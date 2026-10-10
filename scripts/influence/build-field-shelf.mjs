#!/usr/bin/env node
/**
 * Field & Shelf builder (docs/reach/FIELD-SHELF-PLAN.md): one square per work citing Ken's papers,
 * packed by topic distance from the FIXED home topics of his lead papers, under a shelf of the papers.
 *
 * Input:   data/influence/dois.json          pinned papers, lens, short labels
 *          data/influence/fine-themes.json   paper → theme; theme labels and order
 *          src/data/influence.json           cross-check only: citing-work counts must match
 *          OpenAlex via lib/openalex.mjs     cached in .cache/openalex (gitignored); the layout needs no new fetch
 * Output:  src/data/field-shelf.json                         layout (bundled with /reach)
 *          public/data/field-shelf-tooltips-{all,lead}.json  tooltip payloads (fetched on first hover / search)
 *          docs/reach/field-shelf-report.md                  sanity report
 *
 * Usage:   node scripts/influence/build-field-shelf.mjs [--offline | --refresh] [--dry-run]
 * Env:     OPENALEX_API_KEY, OPENALEX_MAILTO (optional), OPENALEX_CACHE_MAX_AGE_HOURS
 *
 * Rules (Ken, 2026-10-11): home topics = OpenAlex topics on the lead papers only, computed once; a
 * square's colour never changes with the All / Lead chip, which only filters squares and shelf. Same
 * self-citation rule and record types as fetch-influence.mjs. No "how it cites" text.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { gzipSync } from "zlib";
import {
  ROOT,
  getWork,
  getCiting,
  shortId,
  stripDoi,
  authorKeys,
  selfCiteReason,
  assignedTopic,
  dataAsOf,
  cacheSummary,
  stats,
} from "./lib/openalex.mjs";
import { FIELD, SHELF, packField, layoutShelf, minSquareGap } from "./lib/field-shelf-layout.mjs";

const DRY_RUN = process.argv.includes("--dry-run");
const OUT_PATH = join(ROOT, "src", "data", "field-shelf.json");
const TIPS_PATH = (lens) => join(ROOT, "public", "data", `field-shelf-tooltips-${lens}.json`);
const REPORT_PATH = join(ROOT, "docs", "reach", "field-shelf-report.md");
const INFLUENCE_PATH = join(ROOT, "src", "data", "influence.json");
const readJson = (rel) => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));

// Never pinned while embargoed: Nature Cities "Nested economies of scale" (DOI 404s until publication).
const EMBARGOED_DOIS = ["10.1038/s44284-026-00532-x"];
const OPENALEX_DOMAINS = 4;
const BANDS = ["core", "neighbour", "further"];
/** core = a home topic (d 0); neighbour = same subfield or field (d 1–2); further = d ≥ 3 or no topic. */
const bandOf = (d) => (d === 0 ? 0 : d === 1 || d === 2 ? 1 : 2);
/** "Show me one" prefers these record types (with a venue); every type is still a square. */
const SHOWABLE_TYPES = new Set(["article", "review"]);
/** Authors kept in the tooltip payload for search (the first one is also shown). */
const SEARCH_AUTHORS_MAX = 25;

const byNum = (a, b) => a - b;
const pct = (x, dp = 1) => `${(x * 100).toFixed(dp)}%`;
const n0 = (x) => x.toLocaleString("en-US");
const idNum = (id) => Number(shortId(id).slice(1));
const ENTITIES = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&nbsp;": " " };
const clean = (s) =>
  (s ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (m) => ENTITIES[m])
    .replace(/\s+/g, " ")
    .trim();

// ── Headline wording (same rule as build-ripple.mjs) ─────────────────────────

const FRACTIONS = [
  { v: 1 / 5, en: "one in five", zh: "五分之一" },
  { v: 1 / 4, en: "one in four", zh: "四分之一" },
  { v: 1 / 3, en: "one in three", zh: "三分之一" },
  { v: 2 / 5, en: "two in five", zh: "五分之二" },
  { v: 1 / 2, en: "half", zh: "一半" },
  { v: 3 / 5, en: "three in five", zh: "五分之三" },
  { v: 2 / 3, en: "two in three", zh: "三分之二" },
];

function shareWords(share) {
  const near = FRACTIONS.map((f) => ({ ...f, diff: share - f.v })).sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))[0];
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  if (Math.abs(near.diff) <= 0.015) return { en: cap(near.en), zh: near.zh };
  if (near.diff < 0 && near.diff >= -0.045) return { en: `Nearly ${near.en}`, zh: `近${near.zh}` };
  if (near.diff > 0 && near.diff <= 0.045) return { en: `More than ${near.en}`, zh: `超过${near.zh}` };
  const p = `${Math.round(share * 100)}%`;
  return { en: p, zh: p };
}

function headline(lens, outside, total, leadPapers) {
  const w = shareWords(outside / total);
  if (lens === "all") {
    return {
      en: `${n0(total)} works cite this research. ${w.en} sit outside the topics of Ken's lead papers.`,
      zh: `${n0(total)} 篇文献引用了这些研究，其中${w.zh}落在本人第一/通讯作者论文的主题之外。`,
    };
  }
  return {
    en: `${n0(total)} works cite Ken's ${leadPapers} lead-author papers. ${w.en} sit outside those papers' topics.`,
    zh: `${n0(total)} 篇文献引用了本人的 ${leadPapers} 篇第一/通讯作者论文，其中${w.zh}落在这些论文的主题之外。`,
  };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const dois = readJson("data/influence/dois.json");
  const fine = readJson("data/influence/fine-themes.json");
  for (const p of dois.papers) {
    if (EMBARGOED_DOIS.includes(p.doi.toLowerCase())) throw new Error(`${p.doi} is embargoed and must not be pinned`);
  }
  const themeByDoi = Object.fromEntries(fine.papers.map((p) => [p.doi.toLowerCase(), p.theme]));
  const THEMES = fine.themes; // Reach order
  const themeIdx = Object.fromEntries(THEMES.map((t, i) => [t.id, i]));

  console.log(`Field & Shelf builder — cache mode ${stats.cacheMode}${DRY_RUN ? " (dry run)" : ""}`);

  // 1. Papers, self-citation filter, and the fixed home set from the LEAD papers only.
  const H = new Set();
  const Hsub = new Set();
  const Hfield = new Set();
  const Hdom = new Set();
  const homeTopics = new Map(); // id → { id, name, subfield, field, domain, papers: [label] }
  const addHome = (t, label) => {
    if (!t?.id) return;
    const id = shortId(t.id) ?? t.id;
    H.add(id);
    const sub = t.subfield?.id ? shortId(t.subfield.id) : null;
    const field = t.field?.id ? shortId(t.field.id) : null;
    const dom = t.domain?.id ? shortId(t.domain.id) : null;
    if (sub) Hsub.add(sub);
    if (field) Hfield.add(field);
    if (dom) Hdom.add(dom);
    if (!homeTopics.has(id)) {
      homeTopics.set(id, {
        id,
        name: t.display_name ?? t.name,
        subfield: t.subfield?.display_name ?? t.subfield?.name ?? null,
        field: t.field?.display_name ?? t.field?.name ?? null,
        domain: t.domain?.display_name ?? t.domain?.name ?? null,
        papers: [],
      });
    }
    const h = homeTopics.get(id);
    if (!h.papers.includes(label)) h.papers.push(label);
  };

  const papers = [];
  const nonSelf = new Map(); // paper index → kept citing works
  for (const p of dois.papers) {
    if (p.status === "pending") continue;
    const doi = p.doi.toLowerCase();
    const theme = themeByDoi[doi];
    if (!theme) throw new Error(`${p.doi} has no theme in data/influence/fine-themes.json`);
    const work = await getWork(p.doi);
    const [label, ...rest] = p.short.split(" · ");
    if (p.lens === "lead") {
      for (const t of work.topics ?? []) addHome(t, label);
      const own = assignedTopic(work);
      if (own) {
        // Same as Ripple's addHome for the paper's own (assigned) topic.
        H.add(own.id);
        if (own.subfield) Hsub.add(own.subfield.id);
        if (own.field) Hfield.add(own.field.id);
        if (own.domain) Hdom.add(own.domain.id);
      }
    }
    const keys = authorKeys(work);
    const citing = await getCiting(shortId(work.id));
    const kept = citing.filter((c) => !selfCiteReason(c, keys));
    const idx = papers.length;
    nonSelf.set(idx, kept);
    papers.push({
      doi,
      short: p.short,
      label,
      desc: rest.join(" · "),
      year: p.year,
      openalexYear: work.publication_year,
      theme,
      lens: p.lens,
      title: clean(work.title),
      venue: work.primary_location?.source?.display_name ?? null,
      openalex: shortId(work.id),
      fetched: citing.length,
      selfRemoved: citing.length - kept.length,
      citing: kept.length,
    });
  }
  const asOf = dataAsOf();
  const maxD = Hdom.size >= OPENALEX_DOMAINS ? 3 : 4;
  const distance = (t) => {
    if (!t) return null;
    if (H.has(t.id)) return 0;
    if (t.subfield && Hsub.has(t.subfield.id)) return 1;
    if (t.field && Hfield.has(t.field.id)) return 2;
    if (t.domain && Hdom.has(t.domain.id)) return 3;
    return 4;
  };
  const leadIdx = new Set(papers.map((p, i) => (p.lens === "lead" ? i : -1)).filter((i) => i >= 0));
  console.log(`\nFixed home topics (lead papers only): H_lead = ${H.size} topics · ${Hsub.size} subfields · ${Hfield.size} fields · ${Hdom.size} domains → max distance ${maxD}`);
  for (const t of homeTopics.values()) console.log(`  ${t.name} — ${t.subfield} / ${t.field} / ${t.domain}  [${t.papers.join(", ")}]`);

  // 2. Per-work facts (shared by both views: the home set never changes).
  const facts = new Map();
  const factsOf = (w) => {
    let f = facts.get(w.id);
    if (!f) {
      const topic = assignedTopic(w);
      const d = distance(topic);
      f = { id: shortId(w.id), num: idNum(w.id), year: w.publication_year ?? null, d, band: bandOf(d), topic, work: w };
      facts.set(w.id, f);
    }
    return f;
  };
  for (const [i, p] of papers.entries()) {
    const fs = nonSelf.get(i).map(factsOf);
    p.outside = fs.filter((f) => f.d !== 0).length;
    p.bands = [0, 1, 2].map((b) => fs.filter((f) => f.band === b).length);
  }

  // 3. Views: All = every pinned paper; Lead = lead papers only. Dedupe citing works by OpenAlex id.
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
      for (const c of nonSelf.get(i)) {
        let e = corpus.get(c.id);
        if (!e) corpus.set(c.id, (e = { f: factsOf(c), cites: new Set() }));
        e.cites.add(i);
      }
    }
    // Sort by distance (no topic last), then year, then OpenAlex id: centre → edge of the field.
    const entries = [...corpus.values()].sort(
      (a, b) => (a.f.d ?? 9) - (b.f.d ?? 9) || (a.f.year ?? 9999) - (b.f.year ?? 9999) || a.f.num - b.f.num
    );
    const field = packField(entries.length);
    const squares = entries.map((e, k) => [e.f.num, field.squares[k].x, field.squares[k].y, e.f.band, e.f.year, [...e.cites].sort(byNum)]);

    const order = shelfOrder(v.papers);
    const shelf = layoutShelf(
      order.map((i) => ({ p: i, theme: papers[i].theme, label: papers[i].label, desc: papers[i].desc })),
      THEMES,
      { lines: v.id === "lead" ? 2 : 1 }
    );

    const dist = [0, 0, 0, 0, 0, 0]; // d 0–4, then no topic
    for (const e of entries) dist[e.f.d === null ? 5 : e.f.d]++;
    const bands = { core: 0, neighbour: 0, further: 0 };
    for (const e of entries) bands[BANDS[e.f.band]]++;
    const multi = {};
    for (const e of entries) multi[e.cites.size] = (multi[e.cites.size] ?? 0) + 1;
    const coauthorOnly = entries.filter((e) => [...e.cites].every((i) => papers[i].lens === "coauthor")).length;
    const outsideHome = entries.filter((e) => e.f.d !== 0).length;
    const N = entries.length;

    views[v.id] = {
      field: { width: field.width, height: field.height, cx: field.cx, cy: field.cy, rx: field.rx, ry: field.ry, pitch: FIELD.pitch, cell: FIELD.cell },
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
        outsideHome,
        papers: v.papers.length,
        leadPapers: v.papers.filter((i) => papers[i].lens === "lead").length,
        coauthorPapers: v.papers.filter((i) => papers[i].lens === "coauthor").length,
        citingLinksNonSelf: v.papers.reduce((s, i) => s + papers[i].citing, 0),
        selfCitationsRemoved: v.papers.reduce((s, i) => s + papers[i].selfRemoved, 0),
        coauthorOnly,
        maxPapersPerSquare: Math.max(...entries.map((e) => e.cites.size)),
      },
      bands,
      distance: dist,
      multiCite: multi,
      headline: headline(v.id, outsideHome, N, v.papers.filter((i) => papers[i].lens === "lead").length),
      squares,
    };
    viewFacts[v.id] = { entries, field, shelf };
  }

  // 4. Checks. Hard failures stop the run before anything is written.
  const checks = [];
  const fail = [];
  const check = (ok, msg, hard = true) => {
    checks.push(`${ok ? "PASS" : hard ? "FAIL" : "WARN"} ${msg}`);
    if (!ok && hard) fail.push(msg);
  };
  let inf = null;
  if (existsSync(INFLUENCE_PATH)) inf = JSON.parse(readFileSync(INFLUENCE_PATH, "utf8"));
  if (inf) {
    // Same snapshot ⇒ exact match; a newer cache than influence.json may legitimately differ (warn).
    const same = inf.meta.asOf === asOf;
    for (const lens of ["all", "lead"]) {
      const t = inf.views?.[lens]?.totals;
      const m = views[lens].totals;
      check(
        t.uniqueCitingWorks === m.citingWorks,
        `${lens}: citing works ${n0(m.citingWorks)} vs influence.json uniqueCitingWorks ${n0(t.uniqueCitingWorks)} (influence.json as of ${inf.meta.asOf}, cache as of ${asOf})`,
        same
      );
      check(t.citingLinksNonSelf === m.citingLinksNonSelf, `${lens}: non-self citing links ${n0(m.citingLinksNonSelf)} vs influence.json ${n0(t.citingLinksNonSelf)}`, same);
      check(t.selfCitationsRemoved === m.selfCitationsRemoved, `${lens}: self-citations removed ${m.selfCitationsRemoved} vs influence.json ${t.selfCitationsRemoved}`, same);
      check(t.papers === m.papers && t.leadPapers === m.leadPapers, `${lens}: papers ${m.papers} (${m.leadPapers} lead) vs influence.json ${t.papers} (${t.leadPapers} lead)`, same);
    }
    const infPapers = new Map(inf.papers.map((p) => [p.doi.toLowerCase(), p]));
    const perPaper = papers.filter((p) => infPapers.get(p.doi)?.citingNonSelf !== p.citing);
    check(perPaper.length === 0, `every paper's non-self citing works match influence.json papers[].citingNonSelf${perPaper.length ? ` (mismatch: ${perPaper.map((p) => p.label).join(", ")})` : ""}`, same);
    const share = Math.round((views.all.totals.coauthorOnly / views.all.totals.citingWorks) * 1000) / 10;
    check(share === inf.meta.coauthorOnlyCitingShare, `co-author-only share of All ${share}% vs influence.json ${inf.meta.coauthorOnlyCitingShare}%`, same);
    checks.push(
      `INFO outside home topics: Field & Shelf (fixed lead set, ${H.size} topics) All ${n0(views.all.totals.outsideHome)}/${n0(views.all.totals.citingWorks)} · Lead ${views.lead.totals.outsideHome}/${views.lead.totals.citingWorks}; influence.json (topics of all ${inf.meta.homeTopicCount ?? "?"} on the pinned papers) All ${n0(inf.views.all.totals.citingWorksOutsideOwnTopics)} · Lead ${inf.views.lead.totals.citingWorksOutsideOwnTopics}. Different rules, both labelled; influence.json is not changed.`
    );
  } else {
    check(false, "src/data/influence.json not found — counts not cross-checked", false);
  }
  for (const lens of ["all", "lead"]) {
    const v = views[lens];
    const sumLinks = v.squares.reduce((s, q) => s + q[5].length, 0);
    check(sumLinks === v.totals.citingLinksNonSelf, `${lens}: Σ paperIdxs over squares (${n0(sumLinks)}) = non-self citing links`);
    check(v.totals.maxPapersPerSquare <= 4, `${lens}: max paperIdxs.length = ${v.totals.maxPapersPerSquare} (≤ 4 lines per square)`);
    check(new Set(v.squares.map((q) => q[0])).size === v.squares.length, `${lens}: one square per OpenAlex id (${n0(v.squares.length)} unique)`);
    const gap = minSquareGap(v.squares.map((q) => ({ x: q[1], y: q[2] })));
    check(gap >= 1, `${lens}: squares never touch (min gap ${gap}px)`);
    const want = viewDefs.find((d) => d.id === lens).papers;
    const onShelf = new Set(v.shelf.items.map((it) => it.p));
    check(want.every((i) => onShelf.has(i)) && onShelf.size === want.length, `${lens}: every paper of the view is on the shelf (${onShelf.size}), including those with 0 citing works`);
  }
  const allIds = new Set(views.all.squares.map((q) => q[0]));
  check(views.lead.squares.every((q) => allIds.has(q[0])), "Lead squares ⊂ All squares");
  check(views.lead.squares.every((q) => q[5].every((i) => leadIdx.has(i))), "Lead squares point only at lead papers");
  const allColour = new Map(views.all.squares.map((q) => [q[0], q[3]]));
  check(views.lead.squares.every((q) => allColour.get(q[0]) === q[3]), "no square changes band between All and Lead (fixed home set)");
  const zeroLead = papers.filter((p) => p.lens === "lead" && p.citing === 0).map((p) => p.label);
  checks.push(`INFO lead papers with 0 non-self citing works (shown as "0 yet"): ${zeroLead.length ? zeroLead.join(", ") : "none"}`);
  const linear = Math.sqrt(views.lead.field.width * views.lead.field.height) / Math.sqrt(views.all.field.width * views.all.field.height);
  checks.push(
    `INFO constant density: Lead field ${views.lead.field.width}×${views.lead.field.height}px vs All ${views.all.field.width}×${views.all.field.height}px (linear ×${linear.toFixed(2)}; √(573/3102) = ${Math.sqrt(views.lead.totals.citingWorks / views.all.totals.citingWorks).toFixed(2)})`
  );
  for (const lens of ["all", "lead"]) {
    for (const o of viewFacts[lens].shelf.overflow) checks.push(`WARN ${lens}: theme name "${o.theme}" (${o.lang}) estimated ${o.width}px over ${o.room}px of room`);
  }

  // 5. Tooltip payloads: keyed by OpenAlex id; venues and topics deduplicated.
  const tips = {};
  for (const lens of ["all", "lead"]) {
    const venues = [];
    const venueIdx = new Map();
    const topics = [];
    const topicIdx = new Map();
    const works = {};
    for (const e of viewFacts[lens].entries) {
      const w = e.f.work;
      const venue = w.primary_location?.source?.display_name ?? null;
      let v = -1;
      if (venue) {
        if (!venueIdx.has(venue)) {
          venueIdx.set(venue, venues.length);
          venues.push(venue);
        }
        v = venueIdx.get(venue);
      }
      let tp = -1;
      const t = e.f.topic;
      if (t) {
        const key = t.id;
        if (!topicIdx.has(key)) {
          topicIdx.set(key, topics.length);
          topics.push([t.name, t.subfield?.name ?? null, t.field?.name ?? null, t.domain?.name ?? null]);
        }
        tp = topicIdx.get(key);
      }
      const names = (w.authorships ?? []).map((a) => clean(a.author?.display_name ?? a.raw_author_name)).filter(Boolean);
      const rec = { t: clean(w.title) || "(untitled)", a: names[0] ?? null, n: names.length, v, y: e.f.year, d: e.f.d, tp, ty: w.type ?? null, c: w.cited_by_count ?? 0 };
      const doi = stripDoi(w.doi);
      if (doi) rec.doi = doi;
      if (names.length > 1) rec.s = names.slice(1, SEARCH_AUTHORS_MAX).join(" · ");
      works[e.f.id] = rec;
    }
    tips[lens] = {
      $comment: `Generated by scripts/influence/build-field-shelf.mjs from OpenAlex (self-citations removed); the ${lens === "all" ? "All" : "Lead"} view of Field & Shelf, loaded on first hover or search. Do not edit by hand.`,
      schema: "field-shelf-tooltips/v1",
      lens,
      asOf,
      fields: {
        t: "title",
        a: "first author (OpenAlex display name)",
        n: "number of authors",
        s: `authors 2–${SEARCH_AUTHORS_MAX} (search only), ' · '-joined`,
        v: "index into venues (−1 = none)",
        y: "publication year",
        doi: "DOI without https://doi.org/ (absent if none)",
        d: "topic distance from the lead home topics: 0 home, 1 same subfield, 2 same field, 3 same domain, 4 another domain, null no topic",
        tp: "index into topics [topic, subfield, field, domain] (−1 = none)",
        ty: "OpenAlex record type",
        c: "OpenAlex cited_by_count of the citing work",
      },
      venues,
      topics,
      works,
    };
  }
  const tipSizes = {};
  for (const lens of ["all", "lead"]) {
    const s = JSON.stringify(tips[lens]);
    tipSizes[lens] = { raw: Buffer.byteLength(s), gzip: gzipSync(s, { level: 9 }).length };
  }

  // 6. Layout output.
  const showable = {};
  for (const lens of ["all", "lead"]) {
    const ents = viewFacts[lens].entries;
    showable[lens] = ents.filter((e) => e.f.band !== 0 && SHOWABLE_TYPES.has(e.f.work.type) && e.f.work.primary_location?.source?.display_name).length;
  }
  const output = {
    $comment:
      "Generated by scripts/influence/build-field-shelf.mjs from OpenAlex (self-citations removed). Do not edit by hand; see docs/reach/FIELD-SHELF-PLAN.md. squares: [OpenAlex id number (prefix 'W'), x, y (top-left px in the field box), band (0 core · 1 neighbour · 2 further), publication year, paperIdxs (indexes into papers)].",
    meta: {
      asOf,
      schema: "field-shelf/v1",
      defaultView: "all",
      homeTopicsRule: "lead-fixed",
      homeTopicsRuleText:
        "Home topics = the OpenAlex topics (all listed topics plus the assigned one) on Ken's lead (first / last / corresponding) papers, computed once. A citing work's distance d compares its assigned topic with that set: 0 home topic, 1 same subfield, 2 same field, 3 same domain, 4 another domain. Bands: core d 0, neighbour d 1–2, further d ≥ 3 or no topic. The All / Lead chip filters squares and shelf; it never recolours.",
      homeTopicsLeadCount: H.size,
      homeSubfieldsLeadCount: Hsub.size,
      homeFieldsLeadCount: Hfield.size,
      homeDomainsLeadCount: Hdom.size,
      homeTopicsLead: [...homeTopics.values()].map(({ papers: _p, ...t }) => t),
      maxDistance: maxD,
      bands: BANDS,
      density: "constant",
      squareFields: ["id", "x", "y", "band", "year", "paperIdxs"],
      recordTypesNote:
        "Same inclusion as the influence pipeline: every OpenAlex record that cites a pinned paper, minus self-citations (articles, preprints, chapters, peer reviews and more). 'Show me one' prefers articles and reviews with a venue.",
      showMeOneTypes: [...SHOWABLE_TYPES],
      showable,
      coauthorOnlyShare: Math.round((views.all.totals.coauthorOnly / views.all.totals.citingWorks) * 1000) / 1000,
      influenceOutsideHome: inf
        ? { all: inf.views.all.totals.citingWorksOutsideOwnTopics, lead: inf.views.lead.totals.citingWorksOutsideOwnTopics, homeTopics: inf.meta.homeTopicCount ?? null }
        : null,
      tooltips: { all: "/data/field-shelf-tooltips-all.json", lead: "/data/field-shelf-tooltips-lead.json", bytes: tipSizes },
      layout: { field: FIELD, shelf: { width: SHELF.width, itemGap: SHELF.itemGap, groupGap: SHELF.groupGap, labelSize: SHELF.labelSize, descSize: SHELF.descSize, lineH: SHELF.lineH, padY: SHELF.padY, themeSize: SHELF.themeSize, themeLineH: SHELF.themeLineH } },
    },
    themes: THEMES.map((t) => ({ id: t.id, en: t.en, zh: t.zh, color: t.color })),
    papers: papers.map((p) => ({
      doi: p.doi,
      short: p.short,
      label: p.label,
      desc: p.desc,
      year: p.year,
      theme: p.theme,
      lens: p.lens,
      title: p.title,
      venue: p.venue,
      openalex: p.openalex,
      citing: p.citing,
      outside: p.outside,
      bands: p.bands,
    })),
    views,
  };

  const report = renderReport({ output, papers, homeTopics, checks, tipSizes, viewFacts, maxD, asOf, inf });
  console.log("\n" + report.console);
  console.log(`\n${cacheSummary()}`);
  if (fail.length) {
    console.error(`\n${fail.length} check(s) FAILED — nothing written:\n  ${fail.join("\n  ")}`);
    process.exit(1);
  }
  if (DRY_RUN) {
    console.log("Dry run — nothing written.");
    return;
  }
  writeFileSync(OUT_PATH, serialize(output));
  for (const lens of ["all", "lead"]) {
    mkdirSync(dirname(TIPS_PATH(lens)), { recursive: true });
    writeFileSync(TIPS_PATH(lens), JSON.stringify(tips[lens]) + "\n");
  }
  writeFileSync(REPORT_PATH, report.markdown);
  console.log(`Wrote ${OUT_PATH}\nWrote ${TIPS_PATH("all")}\nWrote ${TIPS_PATH("lead")}\nWrote ${REPORT_PATH}`);
}

/** Pretty JSON, but one square per line: diffable without tripling the file. */
function serialize(output) {
  const marker = (lens) => `"__SQUARES_${lens}__"`;
  const copy = { ...output, views: {} };
  for (const [lens, v] of Object.entries(output.views)) copy.views[lens] = { ...v, squares: `__SQUARES_${lens}__` };
  let text = JSON.stringify(copy, null, 1);
  for (const [lens, v] of Object.entries(output.views)) {
    const indent = "   ";
    const rows = v.squares.map((q) => indent + JSON.stringify(q)).join(",\n");
    text = text.replace(marker(lens), `[\n${rows}\n  ]`);
  }
  return text + "\n";
}

// ── Report ─────────────────────────────────────────────────────────────────

function renderReport({ output, papers, homeTopics, checks, tipSizes, viewFacts, maxD, asOf, inf }) {
  const md = [];
  const con = [];
  const { views, meta } = output;
  const kb = (b) => `${(b / 1024).toFixed(0)} KB`;
  md.push("# Field & Shelf — data report");
  md.push("");
  md.push(`Generated by \`node scripts/influence/build-field-shelf.mjs\` · OpenAlex data as of ${asOf} · self-citations removed (strict per-paper rule, as \`fetch-influence.mjs\`).`);
  md.push("Every number below is recounted from the cached OpenAlex citing lists. This file is rewritten on each run; the preview write-up is [`FIELD-SHELF-REPORT.md`](FIELD-SHELF-REPORT.md).");
  md.push("");

  md.push("## Checks");
  md.push("");
  for (const c of checks) md.push(`- ${c}`);
  md.push("");
  con.push("Checks:\n" + checks.map((c) => "  " + c).join("\n"));

  md.push("## Headlines");
  md.push("");
  for (const lens of ["all", "lead"]) md.push(`- **${lens === "all" ? "All" : "Lead"}:** ${views[lens].headline.en} — ${views[lens].headline.zh}`);
  md.push("");

  md.push(`## Fixed home topics (H_lead): ${meta.homeTopicsLeadCount} topics`);
  md.push("");
  md.push(
    `The union of OpenAlex \`topics[]\` (plus the assigned topic) on the ${views.lead.totals.leadPapers} lead papers: ${meta.homeTopicsLeadCount} topics in ${meta.homeSubfieldsLeadCount} subfields, ${meta.homeFieldsLeadCount} fields and ${meta.homeDomainsLeadCount} domains. ` +
      `With ${meta.homeDomainsLeadCount} of OpenAlex's 4 domains at home, distances run 0–${maxD}. The same set colours both views.`
  );
  md.push("");
  md.push("| Topic | Subfield | Field | Domain | On lead papers |");
  md.push("| --- | --- | --- | --- | --- |");
  const sortedTopics = [...homeTopics.values()].sort((a, b) => (a.domain ?? "").localeCompare(b.domain ?? "") || (a.field ?? "").localeCompare(b.field ?? "") || a.name.localeCompare(b.name));
  for (const t of sortedTopics) md.push(`| ${t.name} | ${t.subfield ?? ""} | ${t.field ?? ""} | ${t.domain ?? ""} | ${t.papers.join(", ")} |`);
  md.push("");

  md.push("## Bands and distances");
  md.push("");
  md.push("| View | Citing works | Core (d 0) | Neighbour (d 1–2) | Further (d ≥ 3 or no topic) | Outside home (d ≠ 0) |");
  md.push("| --- | ---: | ---: | ---: | ---: | ---: |");
  for (const lens of ["all", "lead"]) {
    const v = views[lens];
    const N = v.totals.citingWorks;
    md.push(
      `| ${lens} | ${n0(N)} | ${n0(v.bands.core)} (${pct(v.bands.core / N)}) | ${n0(v.bands.neighbour)} (${pct(v.bands.neighbour / N)}) | ${n0(v.bands.further)} (${pct(v.bands.further / N)}) | ${n0(v.totals.outsideHome)} (${pct(v.totals.outsideHome / N)}) |`
    );
    con.push(
      `[${lens}] N ${N} · core ${v.bands.core} (${pct(v.bands.core / N)}) · neighbour ${v.bands.neighbour} (${pct(v.bands.neighbour / N)}) · further ${v.bands.further} (${pct(v.bands.further / N)}) · outside ${v.totals.outsideHome} (${pct(v.totals.outsideHome / N)})`
    );
  }
  md.push("");
  md.push("| View | d = 0 | 1 | 2 | 3 | 4 | no topic |");
  md.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const lens of ["all", "lead"]) md.push(`| ${lens} | ${views[lens].distance.map(n0).join(" | ")} |`);
  md.push("");
  if (inf) {
    md.push(
      `For comparison, \`influence.json\` (and the Ripple) count a work as outside when its topic is not among the ${inf.meta.homeTopicCount} topics of **all** pinned papers: ${n0(inf.views.all.totals.citingWorksOutsideOwnTopics)} of ${n0(inf.views.all.totals.uniqueCitingWorks)} (All), ${inf.views.lead.totals.citingWorksOutsideOwnTopics} of ${inf.views.lead.totals.uniqueCitingWorks} (Lead). ` +
        `Field & Shelf uses the fixed lead set, so its shares are ${pct(views.all.totals.outsideHome / views.all.totals.citingWorks)} (All) and ${pct(views.lead.totals.outsideHome / views.lead.totals.citingWorks)} (Lead); captions say which rule they use.`
    );
    md.push("");
  }

  md.push("## How many of Ken's papers each citing work cites");
  md.push("");
  md.push("| View | 1 paper | 2 | 3 | 4 | max |");
  md.push("| --- | ---: | ---: | ---: | ---: | ---: |");
  for (const lens of ["all", "lead"]) {
    const m = views[lens].multiCite;
    const N = views[lens].totals.citingWorks;
    md.push(`| ${lens} | ${n0(m[1] ?? 0)} (${pct((m[1] ?? 0) / N)}) | ${m[2] ?? 0} | ${m[3] ?? 0} | ${m[4] ?? 0} | ${views[lens].totals.maxPapersPerSquare} |`);
    con.push(`[${lens}] multi-cite ${JSON.stringify(m)}`);
  }
  md.push("");
  md.push(
    `Co-author share: ${n0(views.all.totals.coauthorOnly)} of ${n0(views.all.totals.citingWorks)} All squares (${pct(views.all.totals.coauthorOnly / views.all.totals.citingWorks)}) cite only co-authored papers.`
  );
  md.push("");

  md.push("## Shelf (theme, then year)");
  md.push("");
  md.push("| # | Paper | Lens | Theme | Year | Citing (non-self) | Outside home | Core / neighbour / further |");
  md.push("| ---: | --- | --- | --- | ---: | ---: | ---: | --- |");
  const allOrder = views.all.shelf.items.map((it) => it.p);
  for (const [k, i] of allOrder.entries()) {
    const p = papers[i];
    const out = p.citing ? `${p.outside} (${pct(p.outside / p.citing, 0)})` : "0 yet";
    md.push(`| ${k + 1} | ${p.short} | ${p.lens} | ${p.theme} | ${p.year}${p.openalexYear !== p.year ? ` (OpenAlex ${p.openalexYear})` : ""} | ${p.citing} | ${out} | ${p.bands.join(" / ")} |`);
  }
  md.push("");
  const zero = papers.filter((p) => p.lens === "lead" && p.citing === 0);
  md.push(`Lead papers with no non-self citing work yet (on the shelf as "0 yet", no squares): ${zero.length ? zero.map((p) => p.short).join("; ") : "none"}.`);
  md.push("");

  md.push("## Record types (squares)");
  md.push("");
  const typeRows = new Map();
  for (const lens of ["all", "lead"]) {
    for (const e of viewFacts[lens].entries) {
      const t = e.f.work.type ?? "(none)";
      const r = typeRows.get(t) ?? { all: 0, lead: 0 };
      r[lens]++;
      typeRows.set(t, r);
    }
  }
  md.push("| Type | All | Lead |");
  md.push("| --- | ---: | ---: |");
  for (const [t, r] of [...typeRows.entries()].sort((a, b) => b[1].all - a[1].all)) md.push(`| ${t} | ${n0(r.all)} | ${r.lead} |`);
  md.push("");
  const noVenue = (lens) => viewFacts[lens].entries.filter((e) => !e.f.work.primary_location?.source?.display_name).length;
  const noDoi = (lens) => viewFacts[lens].entries.filter((e) => !e.f.work.doi).length;
  md.push(
    `Without a venue: ${noVenue("all")} (All) / ${noVenue("lead")} (Lead). Without a DOI: ${noDoi("all")} / ${noDoi("lead")} (the tooltip then links OpenAlex only). ` +
      `"Show me one" draws from outside-home articles and reviews with a venue: ${n0(meta.showable.all)} (All) / ${meta.showable.lead} (Lead).`
  );
  md.push("");

  md.push("## Geometry");
  md.push("");
  for (const lens of ["all", "lead"]) {
    const f = views[lens].field;
    const s = views[lens].shelf;
    md.push(
      `- **${lens}:** field ${f.width}×${f.height}px (ellipse rx ${f.rx}, ry ${f.ry}; ${f.cell}px squares on a ${f.pitch}px grid, ±${FIELD.jitter}px jitter). Shelf: ${s.items.length} spines ${s.spineW}×${s.spineH}px, ${s.lines} text line(s), theme names in ${s.themeLines} line(s), reference width ${s.width}px.`
    );
  }
  md.push("");
  md.push("## Tooltip payloads (lazy)");
  md.push("");
  for (const lens of ["all", "lead"]) md.push(`- \`public/data/field-shelf-tooltips-${lens}.json\`: ${kb(tipSizes[lens].raw)} raw, ${kb(tipSizes[lens].gzip)} gzip (${n0(views[lens].totals.citingWorks)} works).`);
  md.push("");
  con.push(`tooltips: all ${kb(tipSizes.all.raw)} raw / ${kb(tipSizes.all.gzip)} gzip · lead ${kb(tipSizes.lead.raw)} raw / ${kb(tipSizes.lead.gzip)} gzip`);
  return { markdown: md.join("\n") + "\n", console: con.join("\n") };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
