#!/usr/bin/env node
/**
 * Reach Where "Glow" — affiliation KDE heatmap data.
 *
 * Fetches citing works for pinned DOIs (same self-cite rule as fetch-influence),
 * aggregates unique citing works per OpenAlex institution, hydrates institution
 * geo, and writes a precomputed Equal Earth density grid for All + Lead.
 *
 * Output: src/data/where-glow.json
 *
 * Usage: node scripts/influence/build-where-glow.mjs
 * Env: OPENALEX_API_KEY (optional), OPENALEX_MAILTO (optional)
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { deflateSync } from "zlib";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const DOIS_PATH = join(ROOT, "data", "influence", "dois.json");
const WORLD_PATH = join(ROOT, "src", "data", "world-map.json");
const OUT_PATH = join(ROOT, "src", "data", "where-glow.json");
const CACHE_PATH = join(ROOT, "data", "influence", "where-affiliations-cache.json");
/** Optional: node scripts/influence/build-where-glow.mjs --from-cache  (uses data/influence/where-affiliations-cache.json) */
const USE_CACHE = process.argv.includes("--cache") || process.argv.includes("--from-cache");

const API = "https://api.openalex.org";
const CITING_SELECT = [
  "id", "doi", "title", "publication_year", "cited_by_count", "type",
  "primary_topic", "topics", "keywords", "authorships", "primary_location",
].join(",");

// Equal Earth — must match scripts/influence/build-world-map.mjs
const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796;
const M = Math.sqrt(3) / 2;
const rad = Math.PI / 180;
const CROP_SOUTH = -58;
const MAP_WIDTH = 960;

function equalEarth(lon, lat) {
  const l = lon * rad;
  const theta = Math.asin(M * Math.sin(lat * rad));
  const t2 = theta * theta, t6 = t2 * t2 * t2;
  const x = (l * Math.cos(theta)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
  const y = theta * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
  return [x, y];
}

const [xMax] = equalEarth(180, 0);
const [, yMax] = equalEarth(0, 90);
const scale = MAP_WIDTH / (2 * xMax);
const [, ySouth] = equalEarth(0, CROP_SOUTH);
const MAP_HEIGHT = Math.round(yMax * scale - ySouth * scale);

function toXY(lon, lat) {
  const [x, y] = equalEarth(lon, Math.max(lat, CROP_SOUTH));
  return [x * scale + MAP_WIDTH / 2, yMax * scale - y * scale];
}

// ~220 km Gaussian σ at lat 30° (mid-latitude research belt)
const pxPerKmAt30 = (() => {
  const a = toXY(0, 30), b = toXY(1, 30);
  const km = 111.32 * Math.cos(30 * rad);
  return Math.hypot(b[0] - a[0], b[1] - a[1]) / km;
})();
// Visual Glow needs a wider kernel than a literal ~200 km footprint on a 960-px world map.
const KERNEL_KM = 550;
const KERNEL_SIGMA_PX = Math.max(16, KERNEL_KM * pxPerKmAt30);

const GRID_W = 480; // half-res for payload; client upscales
const GRID_H = Math.round((MAP_HEIGHT / MAP_WIDTH) * GRID_W);
// Honeycomb: equal-area hexbin on Equal Earth (~300 km flat-to-flat at mid-latitudes)
const HEX_KM = 300;
const HEX_FLAT_PX = Math.max(8, HEX_KM * pxPerKmAt30); // ~300 km at mid-latitudes (≥8px) // flat-to-flat
const HEX_SIZE_PX = HEX_FLAT_PX / Math.sqrt(3); // center → vertex (pointy-top)
const BATCH = 50;

let requestCount = 0;
let costUsd = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function withAuth(url) {
  const u = new URL(url);
  if (process.env.OPENALEX_API_KEY) u.searchParams.set("api_key", process.env.OPENALEX_API_KEY);
  u.searchParams.set("mailto", process.env.OPENALEX_MAILTO || "kh3657@nyu.edu");
  return u.toString();
}

async function getJson(url, attempt = 1) {
  requestCount++;
  let res;
  try {
    res = await fetch(withAuth(url), { headers: { Accept: "application/json" } });
  } catch (err) {
    if (attempt >= 5) throw err;
    await sleep(1000 * 2 ** attempt);
    return getJson(url, attempt + 1);
  }
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 5) throw new Error(`OpenAlex ${res.status}: ${url}`);
    console.warn(`  ${res.status} — retry ${attempt}`);
    await sleep(1000 * 2 ** attempt);
    return getJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`OpenAlex ${res.status} ${res.statusText}: ${url}`);
  const json = await res.json();
  if (typeof json?.meta?.cost_usd === "number") costUsd += json.meta.cost_usd;
  await sleep(100);
  return json;
}

async function getAllCiting(workId) {
  const out = [];
  let cursor = "*";
  while (cursor) {
    const page = await getJson(
      `${API}/works?filter=cites:${workId}&per_page=200&cursor=${encodeURIComponent(cursor)}&select=${CITING_SELECT}`
    );
    out.push(...(page.results ?? []));
    cursor = page.meta?.next_cursor;
    if (!page.results?.length) break;
  }
  return out;
}

const shortId = (id) => (id ? String(id).replace("https://openalex.org/", "") : null);

function nameKey(name) {
  if (!name) return null;
  const tokens = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
  if (tokens.length < 2 || tokens.some((t) => t.length < 2)) return null;
  return tokens.sort().join(" ");
}

function authorKeys(work) {
  const ids = new Set(), orcids = new Set(), names = new Set();
  for (const a of work.authorships ?? []) {
    if (a.author?.id) ids.add(a.author.id);
    if (a.author?.orcid) orcids.add(a.author.orcid);
    for (const n of [a.author?.display_name, a.raw_author_name]) {
      const k = nameKey(n);
      if (k) names.add(k);
    }
  }
  return { ids, orcids, names };
}

function selfCiteReason(citing, citedKeys) {
  for (const a of citing.authorships ?? []) {
    if (a.author?.id && citedKeys.ids.has(a.author.id)) return "author-id";
    if (a.author?.orcid && citedKeys.orcids.has(a.author.orcid)) return "orcid";
  }
  for (const a of citing.authorships ?? []) {
    for (const n of [a.author?.display_name, a.raw_author_name]) {
      const k = nameKey(n);
      if (k && citedKeys.names.has(k)) return "name";
    }
  }
  return null;
}

function institutionsOf(work) {
  const m = new Map();
  for (const a of work.authorships ?? []) {
    for (const i of a.institutions ?? []) {
      if (i.id && !m.has(i.id)) m.set(i.id, i);
    }
  }
  return [...m.values()];
}

/** Accumulate unique citing works per institution for one lens. */
function tallyInstitutions(citingMap) {
  /** @type {Map<string, { id: string, name: string, type: string|null, country: string|null, works: Set<string> }>} */
  const tallies = new Map();
  let worksNoAffiliation = 0;
  for (const [workId, entry] of citingMap) {
    const insts = institutionsOf(entry.work);
    if (insts.length === 0) {
      worksNoAffiliation++;
      continue;
    }
    for (const i of insts) {
      const id = shortId(i.id);
      let t = tallies.get(id);
      if (!t) {
        t = {
          id,
          name: i.display_name ?? id,
          type: i.type ?? null,
          country: i.country_code ?? null,
          works: new Set(),
        };
        tallies.set(id, t);
      }
      t.works.add(workId);
    }
  }
  return { tallies, worksNoAffiliation, uniqueWorks: citingMap.size };
}

async function hydrateGeo(ids) {
  /** @type {Map<string, { lat: number, lon: number, city: string|null, region: string|null }>} */
  const geo = new Map();
  const missing = [];
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const filter = chunk.map((id) => id.replace(/^I/, "I")).join("|");
    // ids.openalex accepts I… or full URL; use short IDs
    const url = `${API}/institutions?filter=openalex_id:${chunk.join("|")}&per_page=${chunk.length}&select=id,display_name,geo,type,country_code`;
    let page;
    try {
      page = await getJson(url);
    } catch (err) {
      console.warn(`  hydrate batch failed (${err.message}) — trying one-by-one`);
      for (const id of chunk) {
        try {
          const one = await getJson(`${API}/institutions/${id}?select=id,display_name,geo,type,country_code`);
          page = { results: [one] };
          applyGeoResults(page.results, geo, missing);
        } catch (e2) {
          missing.push(id);
        }
      }
      continue;
    }
    applyGeoResults(page.results ?? [], geo, missing);
    if ((i / BATCH) % 5 === 0) console.log(`  geo ${Math.min(i + BATCH, ids.length)}/${ids.length}`);
  }
  // Mark ids never returned
  for (const id of ids) if (!geo.has(id) && !missing.includes(id)) missing.push(id);
  return { geo, missing };
}

function applyGeoResults(results, geo, missing) {
  for (const r of results) {
    const id = shortId(r.id);
    const lat = r.geo?.latitude;
    const lon = r.geo?.longitude;
    if (typeof lat === "number" && typeof lon === "number" && Number.isFinite(lat) && Number.isFinite(lon)) {
      geo.set(id, {
        lat,
        lon,
        city: r.geo?.city ?? null,
        region: r.geo?.region ?? null,
      });
    } else if (id) {
      missing.push(id);
    }
  }
}


/** Pointy-top axial hex binning (redblobgames). size = center→vertex in map px. */
function hexKey(x, y, size) {
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / size;
  const r = ((2 / 3) * y) / size;
  let cx = q, cy = -q - r, cz = r;
  let rx = Math.round(cx), ry = Math.round(cy), rz = Math.round(cz);
  const dx = Math.abs(rx - cx), dy = Math.abs(ry - cy), dz = Math.abs(rz - cz);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return `${rx},${rz}`;
}

function hexCenter(q, r, size) {
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = size * ((3 / 2) * r);
  return [x, y];
}

function hexbin(points, size) {
  const bins = new Map();
  for (const p of points) {
    const key = hexKey(p.x, p.y, size);
    const e = bins.get(key) ?? { w: 0, n: 0 };
    e.w += p.w;
    e.n += 1;
    bins.set(key, e);
  }
  const hexes = [];
  let max = 0;
  for (const [key, e] of bins) {
    const [qs, rs] = key.split(",").map(Number);
    const [x, y] = hexCenter(qs, rs, size);
    if (e.w > max) max = e.w;
    hexes.push({
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      w: e.w,
      n: e.n,
    });
  }
  hexes.sort((a, b) => b.w - a.w);
  return { hexes, max };
}

function kdeGrid(points, sigmaPx, width, height, mapW, mapH) {
  const grid = new Float64Array(width * height);
  const sx = width / mapW;
  const sy = height / mapH;
  const sigma = sigmaPx * sx; // scale σ into grid pixels
  const radius = Math.ceil(sigma * 3.5);
  const twoSig2 = 2 * sigma * sigma;

  for (const p of points) {
    const cx = p.x * sx;
    const cy = p.y * sy;
    const w = p.w;
    const x0 = Math.max(0, Math.floor(cx - radius));
    const x1 = Math.min(width - 1, Math.ceil(cx + radius));
    const y0 = Math.max(0, Math.floor(cy - radius));
    const y1 = Math.min(height - 1, Math.ceil(cy + radius));
    for (let y = y0; y <= y1; y++) {
      const dy = y + 0.5 - cy;
      for (let x = x0; x <= x1; x++) {
        const dx = x + 0.5 - cx;
        const d2 = dx * dx + dy * dy;
        if (d2 > radius * radius) continue;
        grid[y * width + x] += w * Math.exp(-d2 / twoSig2);
      }
    }
  }
  let max = 0;
  for (let i = 0; i < grid.length; i++) if (grid[i] > max) max = grid[i];
  return { grid, max };
}

function quantize(grid, normMax) {
  const out = new Uint8Array(grid.length);
  if (!(normMax > 0)) return out;
  // gamma compress so mid densities stay visible
  const gamma = 0.55;
  for (let i = 0; i < grid.length; i++) {
    const t = Math.min(1, grid[i] / normMax);
    out[i] = t <= 0 ? 0 : Math.round(255 * Math.pow(t, gamma));
  }
  return out;
}

function packGrid(u8) {
  return deflateSync(Buffer.from(u8)).toString("base64");
}

async function main() {
  const world = JSON.parse(readFileSync(WORLD_PATH, "utf-8"));
  if (world.width !== MAP_WIDTH || world.height !== MAP_HEIGHT) {
    console.warn(`world-map size ${world.width}×${world.height} vs computed ${MAP_WIDTH}×${MAP_HEIGHT} — using world-map`);
  }
  const W = world.width;
  const H = world.height;

  const doisRaw = readFileSync(DOIS_PATH, "utf-8");
  const config = JSON.parse(doisRaw);
  const asOf = new Date().toISOString().slice(0, 10);
  console.log(`Where Glow — OpenAlex affiliations KDE, as of ${asOf}`);
  console.log(`Map ${W}×${H}, grid ${GRID_W}×${GRID_H}, σ=${KERNEL_SIGMA_PX.toFixed(1)}px (~${KERNEL_KM} km)`);

  const allCiting = new Map();
  const leadCiting = new Map();

  for (const p of config.papers) {
    if (p.status === "pending") {
      console.log(`\n${p.doi} SKIPPED (pending)`);
      continue;
    }
    console.log(`\n${p.doi} (${p.lens})`);
    let work;
    try {
      work = await getJson(
        `${API}/works/doi:${p.doi}?select=id,doi,title,publication_year,cited_by_count,authorships,primary_location,primary_topic,topics`
      );
    } catch (err) {
      console.warn(`  SKIPPED — ${err.message}`);
      continue;
    }
    const keys = authorKeys(work);
    const citing = await getAllCiting(shortId(work.id));
    const kept = [];
    let removed = 0;
    for (const c of citing) {
      if (selfCiteReason(c, keys)) removed++;
      else kept.push(c);
    }
    console.log(`  fetched=${citing.length} self-removed=${removed} kept=${kept.length}`);

    const addTo = (map) => {
      for (const c of kept) {
        if (!map.has(c.id)) map.set(c.id, { work: c });
      }
    };
    addTo(allCiting);
    if (p.lens === "lead") addTo(leadCiting);
  }

  console.log(`\nUnique citing works: all=${allCiting.size} lead=${leadCiting.size}`);
  const allT = tallyInstitutions(allCiting);
  const leadT = tallyInstitutions(leadCiting);
  console.log(`Institutions: all=${allT.tallies.size} lead=${leadT.tallies.size}`);
  console.log(`No affiliation: all=${allT.worksNoAffiliation} lead=${leadT.worksNoAffiliation}`);

  const allIds = [...new Set([...allT.tallies.keys(), ...leadT.tallies.keys()])];
  console.log(`\nHydrating geo for ${allIds.length} institutions…`);
  const { geo, missing } = await hydrateGeo(allIds);
  console.log(`  with geo=${geo.size} missing=${missing.length}`);

  function viewPayload(label, tally) {
    const points = [];
    let weightWithGeo = 0;
    let worksAffectedMissing = 0;
    const missingSet = new Set(missing);
    for (const [id, t] of tally.tallies) {
      const g = geo.get(id);
      if (!g) {
        worksAffectedMissing += t.works.size; // upper bound; may double-count across missing insts
        continue;
      }
      const [x, y] = toXY(g.lon, g.lat);
      if (y < 0 || y > H || x < 0 || x > W) continue;
      const w = t.works.size;
      weightWithGeo += w;
      points.push({
        id,
        name: t.name,
        type: t.type,
        country: t.country,
        city: g.city,
        lat: Math.round(g.lat * 1e4) / 1e4,
        lon: Math.round(g.lon * 1e4) / 1e4,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        w,
      });
    }
    points.sort((a, b) => b.w - a.w || a.name.localeCompare(b.name));
    const { grid, max } = kdeGrid(points, KERNEL_SIGMA_PX, GRID_W, GRID_H, W, H);
    return {
      label,
      points,
      grid,
      max,
      institutionsWithGeo: points.length,
      institutionsMissingGeo: [...tally.tallies.keys()].filter((id) => !geo.has(id)).length,
      totalWeight: weightWithGeo,
      worksNoAffiliation: tally.worksNoAffiliation,
      uniqueWorks: tally.uniqueWorks,
      worksTouchingMissingGeo: worksAffectedMissing,
    };
  }

  const allView = viewPayload("all", allT);
  const leadView = viewPayload("lead", leadT);

  const allHex = hexbin(allView.points, HEX_SIZE_PX);
  const leadHex = hexbin(leadView.points, HEX_SIZE_PX);

  // Shared scale: Lead normalized to All max so Lead reads dimmer
  const normMax = allView.max || leadView.max || 1;
  const hexNormMax = allHex.max || leadHex.max || 1;
  const allPacked = packGrid(quantize(allView.grid, normMax));
  const leadPacked = packGrid(quantize(leadView.grid, normMax));

  // Ship top institutions for footnote / optional legend (not every point)
  const slimPoints = (pts) =>
    pts.slice(0, 25).map(({ id, name, type, country, city, lat, lon, w }) => ({
      id, name, type, country, city, lat, lon, w,
    }));

  const packHexes = (hexes) =>
    hexes.map((h) => [
      Math.round(h.x * 10) / 10,
      Math.round(h.y * 10) / 10,
      h.w,
      h.n,
    ]);

  // Cache slim affiliation points for --cache rebuilds (no OpenAlex re-fetch)
  const doisHash = createHash("sha256").update(doisRaw).digest("hex").slice(0, 16);
  const cache = {
    doisFileSha256: doisHash,
    asOf,
    generatedAt: new Date().toISOString(),
    map: { width: W, height: H },
    gaps: {
      worksNoAffiliationAll: allView.worksNoAffiliation,
      worksNoAffiliationLead: leadView.worksNoAffiliation,
      institutionsMissingGeoAll: allView.institutionsMissingGeo,
      institutionsMissingGeoLead: leadView.institutionsMissingGeo,
      institutionsMissingGeoTotal: missing.length,
      worksTouchingMissingGeoAll: allView.worksTouchingMissingGeo,
      worksTouchingMissingGeoLead: leadView.worksTouchingMissingGeo,
    },
    views: {
      all: {
        uniqueWorks: allView.uniqueWorks,
        points: allView.points.map(({ id, name, type, country, city, lat, lon, x, y, w }) => ({
          id, name, type, country, city, lat, lon, x, y, w,
        })),
      },
      lead: {
        uniqueWorks: leadView.uniqueWorks,
        points: leadView.points.map(({ id, name, type, country, city, lat, lon, x, y, w }) => ({
          id, name, type, country, city, lat, lon, x, y, w,
        })),
      },
    },
  };
  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(cache));
  console.log(`Wrote affiliation cache ${CACHE_PATH} (${(Buffer.byteLength(JSON.stringify(cache)) / 1024).toFixed(1)} KB)`);

  const out = {
    meta: {
      mode: "live",
      source: "OpenAlex",
      asOf,
      generatedAt: new Date().toISOString(),
      schema: "where-glow-v2-honeycomb",
      doisFileSha256: doisHash,
      projection: "Equal Earth (Šavrič et al. 2018), matching world-map.json",
      map: { width: W, height: H },
      grid: { width: GRID_W, height: GRID_H, encoding: "deflate+base64", dtype: "uint8", gamma: 0.55 },
      kernel: {
        type: "gaussian",
        sigmaKm: KERNEL_KM,
        sigmaPx: Math.round(KERNEL_SIGMA_PX * 10) / 10,
        note: "σ ≈ 550 km (floored to ≥16 map px) at mid-latitudes in Equal Earth map pixels; weight = unique citing works per institution",
      },
      hex: {
        type: "pointy-top",
        flatToFlatKm: Math.round(HEX_FLAT_PX / pxPerKmAt30),
        flatToFlatPx: Math.round(HEX_FLAT_PX * 10) / 10,
        sizePx: Math.round(HEX_SIZE_PX * 10) / 10,
        encoding: "[x, y, weight, institutionCount]",
        note: "Equal-area hexbin on Equal Earth (~300 km flat-to-flat). Weight = sum of unique citing works at institutions whose projected point falls in the cell.",
      },
      unit: "Each institution contributes weight = count of unique non-self citing works listing that affiliation. Multi-affiliation papers add weight at each institution with coordinates. Same institution is not stacked per coauthor.",
      sameScale: "Lead density quantized against All max (glow grid + hex weights) so the Lead lens looks dimmer, not re-scaled.",
      selfCitationRule:
        "Same as Reach: drop citing work if it shares any author with the cited paper (OpenAlex ID / ORCID / normalized full name).",
      requests: requestCount,
      costUsd: Math.round(costUsd * 1e6) / 1e6,
      gaps: {
        worksNoAffiliationAll: allView.worksNoAffiliation,
        worksNoAffiliationLead: leadView.worksNoAffiliation,
        institutionsMissingGeoAll: allView.institutionsMissingGeo,
        institutionsMissingGeoLead: leadView.institutionsMissingGeo,
        institutionsMissingGeoTotal: missing.length,
        worksTouchingMissingGeoAll: allView.worksTouchingMissingGeo,
        worksTouchingMissingGeoLead: leadView.worksTouchingMissingGeo,
        note: "Works with no OpenAlex affiliation still count in the country choropleth. Institutions without geo.latitude/longitude contribute no glow/hex. Multi-campus systems (e.g. CAS) plot at the OpenAlex HQ city.",
      },
    },
    views: {
      all: {
        uniqueWorks: allView.uniqueWorks,
        institutionsWithGeo: allView.institutionsWithGeo,
        totalWeight: allView.totalWeight,
        gridMax: allView.max,
        normMax,
        hexMax: allHex.max,
        hexNormMax,
        grid: allPacked,
        hexes: packHexes(allHex.hexes),
        topInstitutions: slimPoints(allView.points),
      },
      lead: {
        uniqueWorks: leadView.uniqueWorks,
        institutionsWithGeo: leadView.institutionsWithGeo,
        totalWeight: leadView.totalWeight,
        gridMax: leadView.max,
        normMax,
        hexMax: leadHex.max,
        hexNormMax,
        grid: leadPacked,
        hexes: packHexes(leadHex.hexes),
        topInstitutions: slimPoints(leadView.points),
      },
    },
  };

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(out));
  const kb = (Buffer.byteLength(JSON.stringify(out)) / 1024).toFixed(1);
  console.log(`\nWrote ${OUT_PATH} (${kb} KB)`);
  console.log(`All: ${allView.institutionsWithGeo} inst, weight ${allView.totalWeight}, gridMax ${allView.max.toFixed(2)}, hexes ${allHex.hexes.length} max ${allHex.max}`);
  console.log(`Lead: ${leadView.institutionsWithGeo} inst, weight ${leadView.totalWeight}, gridMax ${leadView.max.toFixed(2)}, hexes ${leadHex.hexes.length} max ${leadHex.max}`);
  console.log(`Hex flat-to-flat ${HEX_FLAT_PX.toFixed(1)}px (~${HEX_KM} km), size ${HEX_SIZE_PX.toFixed(2)}px`);
  console.log(`${requestCount} requests, ~$${costUsd.toFixed(4)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
