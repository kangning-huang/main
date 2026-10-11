#!/usr/bin/env node
/**
 * Rebuild src/data/where-glow.json from data/influence/where-affiliations-cache.json
 * (KDE grid + honeycomb hexes). No OpenAlex calls.
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { deflateSync } from "zlib";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const CACHE_PATH = join(ROOT, "data", "influence", "where-affiliations-cache.json");
const WORLD_PATH = join(ROOT, "src", "data", "world-map.json");
const OUT_PATH = join(ROOT, "src", "data", "where-glow.json");

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
function toXY(lon, lat) {
  const [x, y] = equalEarth(lon, Math.max(lat, CROP_SOUTH));
  return [x * scale + MAP_WIDTH / 2, yMax * scale - y * scale];
}
const pxPerKmAt30 = (() => {
  const a = toXY(0, 30), b = toXY(1, 30);
  const km = 111.32 * Math.cos(30 * rad);
  return Math.hypot(b[0] - a[0], b[1] - a[1]) / km;
})();
const KERNEL_KM = 550;
const KERNEL_SIGMA_PX = Math.max(16, KERNEL_KM * pxPerKmAt30);
const GRID_W = 480;
const HEX_KM = 300;
const HEX_FLAT_PX = Math.max(8, HEX_KM * pxPerKmAt30); // ~300 km at mid-latitudes (≥8px)
const HEX_SIZE_PX = HEX_FLAT_PX / Math.sqrt(3);

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
  return [size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r), size * ((3 / 2) * r)];
}
function hexbin(points, size) {
  const bins = new Map();
  for (const p of points) {
    const key = hexKey(p.x, p.y, size);
    const e = bins.get(key) ?? { w: 0, n: 0 };
    e.w += p.w; e.n += 1;
    bins.set(key, e);
  }
  const hexes = [];
  let max = 0;
  for (const [key, e] of bins) {
    const [qs, rs] = key.split(",").map(Number);
    const [x, y] = hexCenter(qs, rs, size);
    if (e.w > max) max = e.w;
    hexes.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, w: e.w, n: e.n });
  }
  hexes.sort((a, b) => b.w - a.w);
  return { hexes, max };
}
function kdeGrid(points, sigmaPx, width, height, mapW, mapH) {
  const grid = new Float64Array(width * height);
  const sx = width / mapW, sy = height / mapH;
  const sigma = sigmaPx * sx;
  const radius = Math.ceil(sigma * 3.5);
  const twoSig2 = 2 * sigma * sigma;
  for (const p of points) {
    const cx = p.x * sx, cy = p.y * sy, w = p.w;
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
  for (let i = 0; i < grid.length; i++) {
    const t = Math.min(1, grid[i] / normMax);
    out[i] = t <= 0 ? 0 : Math.round(255 * Math.pow(t, 0.55));
  }
  return out;
}

const world = JSON.parse(readFileSync(WORLD_PATH, "utf-8"));
const W = world.width, H = world.height;
const GRID_H = Math.round((H / W) * GRID_W);
const cache = JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
const asOf = cache.asOf ?? new Date().toISOString().slice(0, 10);

function packView(points, uniqueWorks, gapsSide) {
  const { grid, max } = kdeGrid(points, KERNEL_SIGMA_PX, GRID_W, GRID_H, W, H);
  const { hexes, max: hexMax } = hexbin(points, HEX_SIZE_PX);
  return {
    uniqueWorks,
    institutionsWithGeo: points.length,
    totalWeight: points.reduce((s, p) => s + p.w, 0),
    grid, max, hexes, hexMax,
    topInstitutions: points.slice(0, 25).map(({ id, name, type, country, city, lat, lon, w }) => ({
      id, name, type, country, city, lat, lon, w,
    })),
    ...gapsSide,
  };
}

const allV = packView(cache.views.all.points, cache.views.all.uniqueWorks, {});
const leadV = packView(cache.views.lead.points, cache.views.lead.uniqueWorks, {});
const normMax = allV.max || leadV.max || 1;
const hexNormMax = allV.hexMax || leadV.hexMax || 1;
const gaps = cache.gaps ?? {};

const out = {
  meta: {
    mode: "live",
    source: "OpenAlex",
    asOf,
    generatedAt: new Date().toISOString(),
    schema: "where-glow-v2-honeycomb",
    doisFileSha256: cache.doisFileSha256,
    projection: "Equal Earth (Šavrič et al. 2018), matching world-map.json",
    map: { width: W, height: H },
    grid: { width: GRID_W, height: GRID_H, encoding: "deflate+base64", dtype: "uint8", gamma: 0.55 },
    kernel: { type: "gaussian", sigmaKm: KERNEL_KM, sigmaPx: Math.round(KERNEL_SIGMA_PX * 10) / 10,
      note: "σ ≈ 550 km (floored to ≥16 map px) at mid-latitudes; weight = unique citing works per institution" },
    hex: {
      type: "pointy-top",
      flatToFlatKm: Math.round(HEX_FLAT_PX / pxPerKmAt30),
      flatToFlatPx: Math.round(HEX_FLAT_PX * 10) / 10,
      sizePx: Math.round(HEX_SIZE_PX * 10) / 10,
      encoding: "[x, y, weight, institutionCount]",
      note: "Equal-area hexbin on Equal Earth; target ~300 km, floored to ≥8 map px for readability.",
    },
    unit: "Each institution contributes weight = unique non-self citing works listing that affiliation.",
    sameScale: "Lead density against All max (glow + hex) so Lead looks dimmer.",
    selfCitationRule: "Same as Reach fetch-influence.",
    requests: 0,
    costUsd: 0,
    gaps: {
      ...gaps,
      note: "Works with no OpenAlex affiliation still count in the country choropleth. Institutions without coordinates contribute no glow/hex. Multi-campus systems plot at OpenAlex HQ.",
    },
  },
  views: {
    all: {
      uniqueWorks: allV.uniqueWorks,
      institutionsWithGeo: allV.institutionsWithGeo,
      totalWeight: allV.totalWeight,
      gridMax: allV.max,
      normMax,
      hexMax: allV.hexMax,
      hexNormMax,
      grid: deflateSync(Buffer.from(quantize(allV.grid, normMax))).toString("base64"),
      hexes: allV.hexes.map((h) => [h.x, h.y, h.w, h.n]),
      topInstitutions: allV.topInstitutions,
    },
    lead: {
      uniqueWorks: leadV.uniqueWorks,
      institutionsWithGeo: leadV.institutionsWithGeo,
      totalWeight: leadV.totalWeight,
      gridMax: leadV.max,
      normMax,
      hexMax: leadV.hexMax,
      hexNormMax,
      grid: deflateSync(Buffer.from(quantize(leadV.grid, normMax))).toString("base64"),
      hexes: leadV.hexes.map((h) => [h.x, h.y, h.w, h.n]),
      topInstitutions: leadV.topInstitutions,
    },
  },
};
mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(out));
console.log(`Wrote ${OUT_PATH} (${(Buffer.byteLength(JSON.stringify(out))/1024).toFixed(1)} KB)`);
console.log(`All hexes ${allV.hexes.length} max ${allV.hexMax}; Lead hexes ${leadV.hexes.length} max ${leadV.hexMax}`);
console.log(`Hex flat-to-flat ${HEX_FLAT_PX.toFixed(1)}px (~${HEX_KM} km)`);
