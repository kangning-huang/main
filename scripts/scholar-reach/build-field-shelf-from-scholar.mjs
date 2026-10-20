#!/usr/bin/env node
/**
 * Build Field & Shelf layout + tooltips from the Scholar Reach prototype
 * embedded in src/data/scholar-citations.json → reachScholarPrototype.
 *
 * - citedBy = Google Scholar (SerpAPI), never invented
 * - Dedupes IPCC AR6 WGII Ch.6 cluster rows → keep highest Scholar citedBy
 * - Packs via scripts/influence/lib/field-shelf-layout.mjs
 * - Writes src/data/field-shelf.json + public/data/field-shelf-tooltips-{all,lead}.json
 *
 * Usage: node scripts/scholar-reach/build-field-shelf-from-scholar.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { gzipSync } from "zlib";
import { FIELD, packField, layoutShelf, minSquareGap } from "../influence/lib/field-shelf-layout.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SCHOLAR_PATH = join(ROOT, "src", "data", "scholar-citations.json");
const OUT_PATH = join(ROOT, "src", "data", "field-shelf.json");
const TIPS_PATH = (lens) => join(ROOT, "public", "data", `field-shelf-tooltips-${lens}.json`);
const REPORT_PATH = join(ROOT, "docs", "reach", "field-shelf-scholar-report.md");
const EXISTING_PATH = join(ROOT, "src", "data", "field-shelf.json");

const THEME_MAP = { "urban-futures": "expansion", heat: "heat-health" };
const THEMES = [
  { id: "expansion", en: "Urban expansion & futures", zh: "城市扩张与未来", color: "#00909a" },
  { id: "heat-health", en: "Heat exposure & health", zh: "高温暴露与健康", color: "#c74b16" },
  { id: "cooling", en: "Cooling & greening", zh: "降温与绿化", color: "#2a9d6e" },
  { id: "air-dust", en: "Air quality / dust", zh: "空气质量 / 扬尘", color: "#8b5a2b" },
  { id: "methods", en: "Scaling, form & methods", zh: "标度、形态与方法", color: "#94700f" },
  { id: "flood", en: "Flood & coasts", zh: "洪水与海岸", color: "#5b4b9a" },
];
const themeIdx = Object.fromEntries(THEMES.map((t, i) => [t.id, i]));

const IMPACT_BREAKS = [0, 1, 10, 100, 1000];
const IMPACT_COLORS = ["#cfc4b6", "#b89a82", "#dd9270", "#c74b16", "#141211"];
const IMPACT_LABELS = [
  { en: "0 citations", zh: "0 次被引" },
  { en: "1–9", zh: "1–9" },
  { en: "10–99", zh: "10–99" },
  { en: "100–999", zh: "100–999" },
  { en: "≥1,000", zh: "≥1,000" },
];
const impactBin = (c) => {
  const n = Number.isFinite(c) ? Math.max(0, Math.floor(c)) : 0;
  for (let i = IMPACT_BREAKS.length - 1; i >= 0; i--) if (n >= IMPACT_BREAKS[i]) return i;
  return 0;
};
const byNum = (a, b) => a - b;
const n0 = (x) => x.toLocaleString("en-US");

/** Normalize titles for IPCC AR6 Ch.6 cluster dedupe. */
function normTitle(t) {
  return String(t || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isIpccCh6(s) {
  const reasons = s.greyLitReasons || [];
  if (reasons.some((r) => /IPCC AR6 Ch\.?6|IPCC AR6 WGII|IPCC WGII/i.test(r))) return true;
  const t = normTitle(s.title);
  return t.includes("cities settlements and key infrastructure");
}

/**
 * Deduplicate Scholar cluster duplicates of the same IPCC chapter:
 * keep the row with the highest Scholar citedBy (typically 821), merge paperIdxs.
 * Documented in PR #148 / field-shelf-scholar-report.md.
 */
function dedupeIpccClusters(squares) {
  const kept = [];
  let ipccBest = null;
  const dropped = [];
  for (const s of squares) {
    if (!isIpccCh6(s)) {
      kept.push(s);
      continue;
    }
    if (!ipccBest) {
      ipccBest = { ...s, paperIdxs: [...(s.paperIdxs || [])] };
      continue;
    }
    const idxs = new Set([...(ipccBest.paperIdxs || []), ...(s.paperIdxs || [])]);
    if ((s.citedBy ?? 0) > (ipccBest.citedBy ?? 0)) {
      dropped.push({ id: ipccBest.id, citedBy: ipccBest.citedBy, title: ipccBest.title });
      ipccBest = { ...s, paperIdxs: [...idxs].sort(byNum) };
    } else {
      dropped.push({ id: s.id, citedBy: s.citedBy, title: s.title });
      ipccBest.paperIdxs = [...idxs].sort(byNum);
      // Prefer richer greyLitReasons / link from either
      if (!ipccBest.link && s.link) ipccBest.link = s.link;
      const r = new Set([...(ipccBest.greyLitReasons || []), ...(s.greyLitReasons || [])]);
      ipccBest.greyLitReasons = [...r];
      ipccBest.detectedGreyLit = true;
    }
  }
  if (ipccBest) kept.push(ipccBest);
  return { squares: kept, ipccKept: ipccBest, ipccDropped: dropped };
}

function greyLitType(s) {
  const reasons = (s.greyLitReasons || []).join(" ").toLowerCase();
  if (/ipcc|report|unep|world bank|fao|undp|wmo/.test(reasons)) return "report";
  if (/thesis|dissertation/.test(reasons)) return "dissertation";
  if (/ssrn|arxiv|preprint/.test(reasons)) return "preprint";
  if (s.detectedGreyLit) return "other";
  return "article";
}

function splitShort(short) {
  const parts = String(short || "").split(" · ");
  return { label: parts[0] || short || "", desc: parts.slice(1).join(" · ") };
}

function headline(lens, total, leadPapers, ge100, ge1000, greyLit) {
  const hot =
    ge1000 > 0
      ? {
          en: `${n0(ge100)} are themselves cited ≥100 times — ${n0(ge1000)} of them ≥1,000.`,
          zh: `其中 ${n0(ge100)} 篇自身被引 ≥100 次，${n0(ge1000)} 篇 ≥1,000 次。`,
        }
      : {
          en: `${n0(ge100)} are themselves cited ≥100 times.`,
          zh: `其中 ${n0(ge100)} 篇自身被引 ≥100 次。`,
        };
  const grey =
    greyLit > 0
      ? {
          en: ` ${n0(greyLit)} grey-literature citers (IPCC, theses, SSRN, …).`,
          zh: ` 含 ${n0(greyLit)} 篇灰色文献（IPCC、学位论文、SSRN 等）。`,
        }
      : { en: "", zh: "" };
  if (lens === "lead") {
    return {
      en: `${n0(total)} works cite Ken's ${leadPapers} first / last / corresponding-author papers (Google Scholar sample). ${hot.en}${grey.en}`,
      zh: `${n0(total)} 篇文献引用了本人担任第一、末位或通讯作者的 ${leadPapers} 篇论文（谷歌学术样本）。${hot.zh}${grey.zh}`,
    };
  }
  return {
    en: `${n0(total)} works cite these papers (Google Scholar sample). ${hot.en}${grey.en}`,
    zh: `${n0(total)} 篇文献引用了这些论文（谷歌学术样本）。${hot.zh}${grey.zh}`,
  };
}

function main() {
  const bundle = JSON.parse(readFileSync(SCHOLAR_PATH, "utf8"));
  const proto = bundle.reachScholarPrototype;
  if (!proto?.squares?.length || !proto?.papers?.length) {
    console.error("Missing reachScholarPrototype.squares/papers in", SCHOLAR_PATH);
    process.exit(1);
  }

  // OpenAlex ids for Ken's own papers (shelf links only); Field squares are Scholar.
  const openalexByDoi = new Map();
  if (existsSync(EXISTING_PATH)) {
    try {
      const prev = JSON.parse(readFileSync(EXISTING_PATH, "utf8"));
      for (const p of prev.papers || []) openalexByDoi.set(String(p.doi).toLowerCase(), p.openalex);
    } catch {}
  }

  const { squares: deduped, ipccKept, ipccDropped } = dedupeIpccClusters(proto.squares);
  console.log("IPCC Ch.6 dedupe: kept", ipccKept?.id, "citedBy", ipccKept?.citedBy, "; dropped", ipccDropped.length, ipccDropped.map((d) => `${d.id}@${d.citedBy}`).join(", "));

  const papers = proto.papers.map((p) => {
    const theme = THEME_MAP[p.theme] || p.theme || "expansion";
    const { label, desc } = splitShort(p.short);
    const paperSquares = deduped.filter((s) => (s.paperIdxs || []).includes(proto.papers.indexOf(p)));
    // Recompute after we have stable paper indexes — filled below
    return {
      doi: p.doi,
      short: p.short,
      label,
      desc,
      year: p.year,
      theme,
      lens: p.lens === "lead" ? "lead" : "coauthor",
      title: p.title,
      venue: p.venue || null,
      openalex: openalexByDoi.get(String(p.doi).toLowerCase()) || "",
      citing: 0,
      outside: 0,
      bands: [0, 0, 0],
      scholarCitesId: p.scholarCitesId,
      scholarCitationCount: p.scholarCitationCount,
      _rawIdx: proto.papers.indexOf(p),
    };
  });

  // Remap paperIdxs: prototype indexes already match papers[] order
  for (const p of papers) {
    const idxs = papers.map((x, i) => i).filter((i) => papers[i]._rawIdx === p._rawIdx);
    // citing count after dedupe
    p.citing = deduped.filter((s) => (s.paperIdxs || []).includes(p._rawIdx)).length;
  }

  // Facts map by Scholar id
  const facts = new Map();
  for (const s of deduped) {
    const citedBy = Number.isFinite(s.citedBy) ? Math.max(0, Math.floor(s.citedBy)) : 0;
    facts.set(s.id, {
      id: s.id,
      year: s.year ?? null,
      citedBy,
      title: s.title || "(untitled)",
      venue: s.venue || null,
      link: s.link || null,
      detectedGreyLit: !!s.detectedGreyLit,
      greyLitReasons: s.greyLitReasons || [],
      type: greyLitType(s),
      paperIdxs: [...new Set(s.paperIdxs || [])].sort(byNum),
    });
  }

  for (const p of papers) {
    const fs = [...facts.values()].filter((f) => f.paperIdxs.includes(p._rawIdx));
    p.citing = fs.length;
    p.outside = 0; // no Scholar topics
    p.bands = [fs.length, 0, 0]; // all "core" placeholder — topic distance N/A
  }

  const leadIdx = new Set(papers.map((p, i) => (p.lens === "lead" ? i : -1)).filter((i) => i >= 0));
  const viewDefs = [
    { id: "all", papers: papers.map((_, i) => i) },
    { id: "lead", papers: [...leadIdx] },
  ];
  const shelfOrder = (idxs) =>
    [...idxs].sort(
      (a, b) =>
        themeIdx[papers[a].theme] - themeIdx[papers[b].theme] ||
        papers[a].year - papers[b].year ||
        papers[b].citing - papers[a].citing ||
        (papers[a].doi < papers[b].doi ? -1 : 1)
    );

  const views = {};
  const viewFacts = {};
  for (const v of viewDefs) {
    const corpus = new Map();
    for (const i of v.papers) {
      const rawIdx = papers[i]._rawIdx;
      for (const f of facts.values()) {
        if (!f.paperIdxs.includes(rawIdx)) continue;
        let e = corpus.get(f.id);
        if (!e) corpus.set(f.id, (e = { f, cites: new Set() }));
        e.cites.add(i);
      }
    }
    const entries = [...corpus.values()].sort(
      (a, b) => b.f.citedBy - a.f.citedBy || (a.f.year ?? 9999) - (b.f.year ?? 9999) || (a.f.id < b.f.id ? -1 : 1)
    );
    const field = packField(entries.length);
    const squares = entries.map((e, k) => [
      e.f.id, // string GS_… id (decoder accepts string | number)
      field.squares[k].x,
      field.squares[k].y,
      e.f.citedBy,
      e.f.year,
      [...e.cites].sort(byNum),
    ]);

    const order = shelfOrder(v.papers);
    const shelf = layoutShelf(
      order.map((i) => ({ p: i, theme: papers[i].theme, label: papers[i].label, desc: papers[i].desc })),
      THEMES,
      { lines: v.id === "lead" ? 2 : 1 }
    );

    const impactCounts = IMPACT_BREAKS.map(() => 0);
    let maxCitedBy = 0;
    let greyLitN = 0;
    for (const e of entries) {
      impactCounts[impactBin(e.f.citedBy)]++;
      if (e.f.citedBy > maxCitedBy) maxCitedBy = e.f.citedBy;
      if (e.f.detectedGreyLit) greyLitN++;
    }
    const ge100 = entries.filter((e) => e.f.citedBy >= 100).length;
    const ge1000 = entries.filter((e) => e.f.citedBy >= 1000).length;
    const leadPapersN = v.papers.filter((i) => papers[i].lens === "lead").length;
    const N = entries.length;
    const coauthorOnly = entries.filter((e) => [...e.cites].every((i) => papers[i].lens === "coauthor")).length;
    const multi = {};
    for (const e of entries) multi[e.cites.size] = (multi[e.cites.size] ?? 0) + 1;

    views[v.id] = {
      field: {
        width: field.width,
        height: field.height,
        cx: field.cx,
        cy: field.cy,
        rx: field.rx,
        ry: field.ry,
        pitch: FIELD.pitch,
        cell: FIELD.cell,
      },
      shelf: {
        width: shelf.width,
        lines: shelf.lines,
        spineW: shelf.spineW,
        spineH: shelf.spineH,
        themeLines: shelf.themeLines,
        items: shelf.items,
        groups: shelf.groups,
      },
      totals: {
        citingWorks: N,
        outsideHome: 0,
        papers: v.papers.length,
        leadPapers: leadPapersN,
        coauthorPapers: v.papers.filter((i) => papers[i].lens === "coauthor").length,
        citingLinksNonSelf: v.papers.reduce((s, i) => s + papers[i].citing, 0),
        selfCitationsRemoved: 0,
        coauthorOnly,
        maxPapersPerSquare: entries.length ? Math.max(...entries.map((e) => e.cites.size)) : 0,
        ge100,
        ge1000,
        maxCitedBy,
        greyLit: greyLitN,
      },
      bands: { core: N, neighbour: 0, further: 0 },
      impact: { counts: impactCounts, ge100, ge1000, maxCitedBy },
      distance: [N, 0, 0, 0, 0, 0],
      multiCite: multi,
      headline: headline(v.id, N, leadPapersN, ge100, ge1000, greyLitN),
      squares,
    };
    viewFacts[v.id] = { entries, field, shelf };
  }

  // Tooltips
  const tips = {};
  for (const lens of ["all", "lead"]) {
    const venues = [];
    const venueIdx = new Map();
    const works = {};
    for (const e of viewFacts[lens].entries) {
      const f = e.f;
      let v = -1;
      if (f.venue) {
        if (!venueIdx.has(f.venue)) {
          venueIdx.set(f.venue, venues.length);
          venues.push(f.venue);
        }
        v = venueIdx.get(f.venue);
      }
      const rec = {
        t: f.title,
        a: null,
        n: 0,
        v,
        y: f.year,
        d: null,
        tp: -1,
        ty: f.type,
        c: f.citedBy,
      };
      if (f.link) rec.url = f.link;
      if (f.detectedGreyLit) {
        rec.g = true;
        rec.gr = f.greyLitReasons;
      }
      works[f.id] = rec;
    }
    tips[lens] = {
      $comment: `Generated by scripts/scholar-reach/build-field-shelf-from-scholar.mjs from Google Scholar (SerpAPI); the ${lens === "all" ? "All" : "Lead"} view. citedBy = Scholar; never invented.`,
      schema: "field-shelf-tooltips/scholar-v1",
      lens,
      asOf: proto.asOf || proto.meta?.asOf || new Date().toISOString().slice(0, 10),
      source: "Google Scholar (SerpAPI)",
      fields: {
        t: "title",
        a: "first author (often unavailable from Scholar citing list)",
        n: "number of authors",
        v: "index into venues (−1 = none)",
        y: "publication year",
        d: "topic distance — null on Scholar path (Where/topics stay OpenAlex)",
        tp: "topic index — unused (−1)",
        ty: "record type heuristic (article / report / dissertation / preprint)",
        c: "Google Scholar cited_by of the citing work",
        url: "landing URL from Scholar when present",
        g: "true if grey-literature heuristic matched",
        gr: "greyLitReasons[]",
      },
      venues,
      topics: [],
      works,
    };
  }

  const tipSizes = {};
  for (const lens of ["all", "lead"]) {
    const s = JSON.stringify(tips[lens]);
    tipSizes[lens] = { raw: Buffer.byteLength(s), gzip: gzipSync(s, { level: 9 }).length };
  }

  const asOf = proto.asOf || proto.meta?.asOf || new Date().toISOString().slice(0, 10);
  const papersOut = papers.map(({ _rawIdx, ...rest }) => rest);
  const greyAll = views.all.totals.greyLit;

  const output = {
    $comment:
      "Generated by scripts/scholar-reach/build-field-shelf-from-scholar.mjs from Google Scholar (SerpAPI). Prototype: 3 pinned papers. squares: [Scholar id string GS_…, x, y, citedBy (Scholar), year, paperIdxs]. IPCC AR6 Ch.6 clusters deduped to max citedBy. Never invent counts. Where/topics remain OpenAlex elsewhere on /reach.",
    meta: {
      asOf,
      schema: "field-shelf/scholar-v1",
      defaultView: "all",
      source: "Google Scholar (SerpAPI)",
      encoding: "citing-work-scholar-cited-by",
      encodingText:
        "Each square is one Google Scholar citing work (prototype sample). Colour = that work's own Scholar citation count on a log-ish ember–ink ramp; nearer the centre = more cited. Direction means nothing. Grey literature (IPCC, theses, SSRN, …) is included and flagged.",
      prototype: true,
      impact: {
        breaks: IMPACT_BREAKS,
        colors: IMPACT_COLORS,
        labels: IMPACT_LABELS,
        scale: "log-bins",
        note: "Bins: 0 · 1–9 · 10–99 · 100–999 · ≥1000 (Google Scholar cited_by). Never invented.",
      },
      homeTopicsRule: "n/a-scholar",
      homeTopicsRuleText: "Scholar path has no OpenAlex topics; topic cards / Where stay on OpenAlex data.",
      homeTopicsLeadCount: 0,
      homeSubfieldsLeadCount: 0,
      homeFieldsLeadCount: 0,
      homeDomainsLeadCount: 0,
      homeTopicsLead: [],
      maxDistance: 0,
      bands: ["core", "neighbour", "further"],
      density: "constant",
      squareFields: ["id", "x", "y", "citedBy", "year", "paperIdxs"],
      recordTypesNote: "Scholar citing list + grey-lit heuristics (IPCC, thesis, SSRN, …). IPCC AR6 WGII Ch.6 cluster duplicates merged to the highest Scholar citedBy.",
      showMeOneTypes: ["article", "review", "report"],
      showable: {
        all: viewFacts.all.entries.filter((e) => e.f.citedBy >= 10).length,
        lead: viewFacts.lead.entries.filter((e) => e.f.citedBy >= 10).length,
      },
      coauthorOnlyShare: views.all.totals.citingWorks
        ? Math.round((views.all.totals.coauthorOnly / views.all.totals.citingWorks) * 1000) / 1000
        : 0,
      influenceOutsideHome: null,
      tooltips: {
        all: "/data/field-shelf-tooltips-all.json",
        lead: "/data/field-shelf-tooltips-lead.json",
        bytes: tipSizes,
      },
      greyLitSquares: greyAll,
      ipccDedupe: {
        kept: ipccKept ? { id: ipccKept.id, citedBy: ipccKept.citedBy, title: ipccKept.title } : null,
        dropped: ipccDropped,
        note: "Multiple Scholar cluster records for IPCC AR6 WGII Ch.6 Cities…; keep highest citedBy (821).",
      },
      scholarPrototype: {
        papers: papersOut.length,
        squaresBeforeDedupe: proto.squares.length,
        squaresAfterDedupe: deduped.length,
        greyLitSample: proto.meta?.greyLitSquares ?? proto.greyLitSample?.length,
      },
    },
    themes: THEMES,
    papers: papersOut,
    views,
  };

  // Sanity
  for (const lens of ["all", "lead"]) {
    const gap = minSquareGap(views[lens].squares.map((q) => ({ x: q[1], y: q[2] })));
    if (gap < 1) throw new Error(`${lens}: squares touch (gap ${gap})`);
  }
  const hasIpcc = viewFacts.all.entries.some(
    (e) => e.f.citedBy === 821 && /cities.*settlements.*key infrastructure/i.test(e.f.title)
  );
  if (!hasIpcc) throw new Error("IPCC AR6 Ch.6 with citedBy 821 missing after build");

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  mkdirSync(dirname(TIPS_PATH("all")), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(output));
  for (const lens of ["all", "lead"]) writeFileSync(TIPS_PATH(lens), JSON.stringify(tips[lens]));

  const md = [
    `# Field & Shelf — Google Scholar prototype`,
    ``,
    `Generated ${new Date().toISOString()} (box). Source: \`reachScholarPrototype\` in \`scholar-citations.json\`.`,
    ``,
    `## IPCC dedupe`,
    `- **Kept:** \`${ipccKept?.id}\` · citedBy **${ipccKept?.citedBy}** · ${ipccKept?.title}`,
    `- **Dropped cluster rows:** ${ipccDropped.map((d) => `\`${d.id}\`@${d.citedBy}`).join(", ") || "none"}`,
    `- Choice: one square per chapter; highest Scholar citedBy (821).`,
    ``,
    `## Counts`,
    `- All: ${views.all.totals.citingWorks} squares · grey-lit ${views.all.totals.greyLit} · ≥100: ${views.all.impact.ge100} · ≥1000: ${views.all.impact.ge1000} · max ${views.all.impact.maxCitedBy}`,
    `- Lead: ${views.lead.totals.citingWorks} squares · grey-lit ${views.lead.totals.greyLit}`,
    `- Papers: ${papersOut.map((p) => p.short).join("; ")}`,
    ``,
    `## Preview`,
    `- Branch \`reach/google-scholar\` — do **not** merge until Ken reviews.`,
    `- Local: \`npm run build\` then \`npm run start\` → /reach`,
    `- Or Vercel preview for PR #148.`,
    ``,
  ];
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, md.join("\n"));

  console.log("Wrote", OUT_PATH);
  console.log("Wrote tooltips all/lead", tipSizes);
  console.log("All squares", views.all.totals.citingWorks, "greyLit", greyAll, "IPCC821", hasIpcc);
  console.log(views.all.headline.en);
}

main();
