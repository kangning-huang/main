#!/usr/bin/env node
/**
 * Ripple map builder (docs/reach/RIPPLE-MAP.md): keywords of the works citing
 * Ken's papers, placed by how far each sits from his own OpenAlex topics.
 *
 * Input:   data/influence/dois.json             pinned papers + lens
 *          data/influence/fine-themes.json      paper → theme; labels, colors, sector order
 *          data/influence/keyword-aliases.json  merges, display labels, stoplist (hand-edited)
 *          data/influence/keyword-zh.json       Chinese labels (hand-edited)
 *          src/data/ripple.json                 previous run; keeps bubble order stable
 *          OpenAlex via lib/openalex.mjs        cached in .cache/openalex (gitignored)
 * Output:  src/data/ripple.json + docs/reach/ripple-keyword-report.md
 *
 * Usage:   node scripts/influence/build-ripple.mjs [--offline | --refresh] [--dry-run]
 * Env:     OPENALEX_API_KEY, OPENALEX_MAILTO (optional), OPENALEX_CACHE_MAX_AGE_HOURS
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
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
} from "./lib/openalex.mjs";
import { CIRCLE, STRIP, layoutCircle, layoutStrip } from "./lib/ripple-layout.mjs";

const DRY_RUN = process.argv.includes("--dry-run");
const OUT_PATH = join(ROOT, "src", "data", "ripple.json");
const REPORT_PATH = join(ROOT, "docs", "reach", "ripple-keyword-report.md");
const readJson = (rel) => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));

// Never pinned while embargoed: Nature Cities "Nested economies of scale" (DOI 404s until publication).
const EMBARGOED_DOIS = ["10.1038/s44284-026-00532-x"];
const OPENALEX_DOMAINS = 4;

/** Starting parameters from the design doc, plus the three added in phase 1 (see report). */
const PARAMS = {
  keywordScoreMin: 0.5,
  genericShareMax: 0.15, // share of All-lens citing works; one generic list serves both lenses
  minWorksInTheme: 3,
  keywordsPerThemeMin: 3,
  keywordsPerThemeMax: 12,
  bridgeShareMin: 0.25,
  emergingBelowWorks: 20,
  labelsAtRest: 20,
  minTaggedForMean: 5,
  redundancyJaccard: 0.6, // added: skip a keyword whose works overlap this much with a better one
  outsideSlots: 1, // added: 1 = theme's slots split home/outside in proportion to its outside share
  outerKeywordShare: 0.5, // added: a keyword is "outside" if at least this share of its works are
  risingWindowYears: 3,
  risingMinRecentWorks: 5,
  risingMinThemeWorks: 20,
};

const round = (v, dp = 2) => Math.round(v * 10 ** dp) / 10 ** dp;
const sum = (xs) => xs.reduce((s, x) => s + x, 0);
const median = (xs) => {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const byId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const stripTags = (s) => (s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const slugOf = (k) => (k.id ? k.id.split("/").pop() : k.display_name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));

// ── Headline wording ───────────────────────────────────────────────────────

const FRACTIONS = [
  { v: 1 / 5, en: "one in five", zh: "五分之一" },
  { v: 1 / 4, en: "one in four", zh: "四分之一" },
  { v: 1 / 3, en: "one in three", zh: "三分之一" },
  { v: 2 / 5, en: "two in five", zh: "五分之二" },
  { v: 1 / 2, en: "half", zh: "一半" },
  { v: 3 / 5, en: "three in five", zh: "五分之三" },
  { v: 2 / 3, en: "two in three", zh: "三分之二" },
];

/** "One in three" / "Nearly one in three" / "More than one in three", else an exact percent. */
export function shareWords(share) {
  const near = FRACTIONS.map((f) => ({ ...f, diff: share - f.v })).sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))[0];
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  if (Math.abs(near.diff) <= 0.015) return { en: cap(near.en), zh: near.zh, exact: false };
  if (near.diff < 0 && near.diff >= -0.045) return { en: `Nearly ${near.en}`, zh: `近${near.zh}`, exact: false };
  if (near.diff > 0 && near.diff <= 0.045) return { en: `More than ${near.en}`, zh: `超过${near.zh}`, exact: false };
  const pct = Math.round(share * 100);
  return { en: `${pct}%`, zh: `${pct}%`, exact: true };
}

function headline(outside, total, asOf) {
  const w = shareWords(outside / total);
  const n = (x) => x.toLocaleString("en-US");
  const verb = w.en === "Half" || w.exact ? "of works citing this research sit" : "works citing this research sits";
  const sentence = {
    en: `${w.en} ${verb} outside its home topics`,
    zh: `引用这些研究的文献中，${w.zh}落在其自身主题之外`,
  };
  return {
    en: `${sentence.en} (${n(outside)} of ${n(total)}; OpenAlex, ${asOf}).`,
    zh: `${sentence.zh}（${n(total)} 篇中的 ${n(outside)} 篇；OpenAlex，${asOf}）。`,
    sentence,
  };
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const dois = readJson("data/influence/dois.json");
  const fine = readJson("data/influence/fine-themes.json");
  const aliasCfg = readJson("data/influence/keyword-aliases.json");
  const zhCfg = readJson("data/influence/keyword-zh.json");
  const prev = existsSync(OUT_PATH) ? JSON.parse(readFileSync(OUT_PATH, "utf8")) : null;

  for (const p of dois.papers) {
    if (EMBARGOED_DOIS.includes(p.doi.toLowerCase())) throw new Error(`${p.doi} is embargoed and must not be pinned`);
  }
  const themeByDoi = Object.fromEntries(fine.papers.map((p) => [p.doi.toLowerCase(), p.theme]));
  const THEMES = fine.themes; // sector order
  const themeIdx = Object.fromEntries(THEMES.map((t, i) => [t.id, i]));

  // Aliases: OpenAlex slug ids first, then the hand-kept merge list.
  const aliasOf = new Map();
  for (const [canon, variants] of Object.entries(aliasCfg.merge ?? {})) for (const v of variants) aliasOf.set(v, canon);
  const canonical = (slug) => {
    let s = slug;
    for (let i = 0; i < 10 && aliasOf.has(s); i++) s = aliasOf.get(s);
    return s;
  };
  const stoplist = new Set(aliasCfg.stoplist ?? []);
  const nameVotes = new Map(); // canonical → Map(display → [ownSlugVotes, otherVotes])
  const rawSlugs = new Map(); // raw slug → count (alias-candidate search)
  const vote = (canon, slug, display) => {
    const m = nameVotes.get(canon) ?? new Map();
    const v = m.get(display) ?? [0, 0];
    v[slug === canon ? 0 : 1]++;
    m.set(display, v);
    nameVotes.set(canon, m);
  };
  const keywordSet = (work) => {
    const out = new Set();
    for (const k of work.keywords ?? []) {
      if (!(k.score >= PARAMS.keywordScoreMin)) continue;
      const slug = slugOf(k);
      const canon = canonical(slug);
      out.add(canon);
      vote(canon, slug, k.display_name);
    }
    return out;
  };

  console.log(`Ripple builder — cache mode ${process.argv.includes("--offline") ? "offline" : "auto/refresh"}${DRY_RUN ? " (dry run)" : ""}`);

  // 1. Papers, home set, non-self citing works.
  const papers = [];
  const H = new Set();
  const Hsub = new Set();
  const Hfield = new Set();
  const Hdom = new Set();
  const homeTopics = new Map();
  const nonSelf = new Map();
  const addHome = (t) => {
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
      });
    }
  };
  for (const p of dois.papers) {
    if (p.status === "pending") continue;
    const doi = p.doi.toLowerCase();
    const theme = themeByDoi[doi];
    if (!theme) throw new Error(`${p.doi} has no theme in data/influence/fine-themes.json`);
    let work;
    try {
      work = await getWork(p.doi);
    } catch (err) {
      console.warn(`  SKIPPED ${p.doi}: ${err.message}`);
      continue;
    }
    for (const t of work.topics ?? []) addHome(t);
    const own = assignedTopic(work);
    if (own) {
      H.add(own.id);
      if (own.subfield) Hsub.add(own.subfield.id);
      if (own.field) Hfield.add(own.field.id);
      if (own.domain) Hdom.add(own.domain.id);
    }
    const keys = authorKeys(work);
    const citing = await getCiting(shortId(work.id));
    const kept = citing.filter((c) => !selfCiteReason(c, keys));
    nonSelf.set(doi, kept);
    papers.push({
      doi,
      short: p.short,
      year: work.publication_year,
      lens: p.lens,
      theme,
      keywords: keywordSet(work),
      fetched: citing.length,
      works: kept.length,
    });
    console.log(`  ${p.short.padEnd(52)} ${theme.padEnd(12)} non-self ${kept.length}`);
  }

  const asOf = dataAsOf();
  const asOfDate = new Date(`${asOf}T00:00:00Z`);
  const asOfYear = asOfDate.getUTCFullYear();
  const yearsSince = (year) => Math.max(1, asOfYear - year + asOfDate.getUTCMonth() / 12);
  const maxD = Hdom.size >= OPENALEX_DOMAINS ? 3 : 4;
  const distance = (t) => {
    if (!t) return null;
    if (H.has(t.id)) return 0;
    if (t.subfield && Hsub.has(t.subfield.id)) return 1;
    if (t.field && Hfield.has(t.field.id)) return 2;
    if (t.domain && Hdom.has(t.domain.id)) return 3;
    return 4;
  };
  const W = PARAMS.risingWindowYears;
  const windows = { recent: [asOfYear - W, asOfYear - 1], prior: [asOfYear - 2 * W, asOfYear - W - 1] };
  const inWin = (y, [a, b]) => y >= a && y <= b;

  // 2–3. Per-work facts shared by both lenses.
  const facts = new Map();
  const factsOf = (work) => {
    let f = facts.get(work.id);
    if (!f) {
      const topic = assignedTopic(work);
      f = {
        kw: keywordSet(work),
        d: distance(topic),
        outside: !topic || !H.has(topic.id),
        year: work.publication_year,
      };
      facts.set(work.id, f);
    }
    return f;
  };

  const buildCorpus = (lensPapers) => {
    const corpus = new Map();
    for (const p of lensPapers) {
      for (const c of nonSelf.get(p.doi)) {
        let e = corpus.get(c.id);
        if (!e) corpus.set(c.id, (e = { work: c, cites: new Set(), themes: new Map(), ...factsOf(c) }));
        e.cites.add(p.doi);
        e.themes.set(p.theme, Math.max(e.themes.get(p.theme) ?? -Infinity, p.year));
      }
    }
    return corpus;
  };

  const lensDefs = [
    { id: "all", papers: papers },
    { id: "lead", papers: papers.filter((p) => p.lens === "lead") },
  ];
  const corpora = Object.fromEntries(lensDefs.map((l) => [l.id, buildCorpus(l.papers)]));

  // Generic keywords: the stoplist plus anything on more than 15% of All-lens citing works.
  const allCorpus = corpora.all;
  const allCounts = new Map();
  for (const e of allCorpus.values()) for (const k of e.kw) allCounts.set(k, (allCounts.get(k) ?? 0) + 1);
  const generic = new Map();
  for (const [k, n] of allCounts) {
    if (stoplist.has(k)) generic.set(k, { n, share: n / allCorpus.size, why: "stoplist" });
    else if (n / allCorpus.size > PARAMS.genericShareMax) generic.set(k, { n, share: n / allCorpus.size, why: "share" });
  }

  const displayName = (k) => {
    if (aliasCfg.labels?.[k]) return aliasCfg.labels[k];
    const m = nameVotes.get(k);
    if (!m) return k.replace(/-/g, " ");
    return [...m.entries()].sort((a, b) => b[1][0] - a[1][0] || b[1][1] - a[1][1] || byId(a[0], b[0]))[0][0];
  };
  const zhLabel = (k) => zhCfg.labels?.[k] ?? null;

  const views = {};
  const reportLens = {};
  const prevViews = prev ?? {};
  for (const lens of lensDefs) {
    const corpus = corpora[lens.id];
    const N = corpus.size;
    const entries = [...corpus.values()];
    const themes = THEMES.filter((t) => lens.papers.some((p) => p.theme === t.id));

    // 4. Theme membership.
    const inTheme = Object.fromEntries(themes.map((t) => [t.id, entries.filter((e) => e.themes.has(t.id))]));
    const Nt = Object.fromEntries(themes.map((t) => [t.id, inTheme[t.id].length]));
    const weight = (e, t) => 1 / yearsSince(e.themes.get(t));

    // Validation: theme works = an independent union of non-self citing ids per theme.
    for (const t of themes) {
      const ids = new Set();
      for (const p of lens.papers.filter((q) => q.theme === t.id)) for (const c of nonSelf.get(p.doi)) ids.add(c.id);
      if (ids.size !== Nt[t.id]) throw new Error(`validation: ${lens.id}/${t.id} works ${Nt[t.id]} ≠ recount ${ids.size}`);
    }

    // 5. Score every keyword in every theme; place it where s is highest.
    const kwThemeWorks = new Map(); // k → Map(theme → entries)
    const kwCount = new Map();
    for (const e of entries) {
      for (const k of e.kw) {
        kwCount.set(k, (kwCount.get(k) ?? 0) + 1);
        const m = kwThemeWorks.get(k) ?? new Map();
        for (const t of e.themes.keys()) {
          if (!m.has(t)) m.set(t, []);
          m.get(t).push(e);
        }
        kwThemeWorks.set(k, m);
      }
    }
    const placement = new Map();
    for (const [k, m] of kwThemeWorks) {
      if (generic.has(k)) continue;
      const nk = kwCount.get(k);
      let best = null;
      for (const t of themes) {
        const list = m.get(t.id);
        if (!list) continue;
        const n = list.length;
        const lift = n / Nt[t.id] / (nk / N);
        const s = n * Math.log(lift);
        const better =
          !best || s > best.s || (s === best.s && (n > best.n || (n === best.n && themeIdx[t.id] < themeIdx[best.t])));
        if (better) best = { k, t: t.id, n, lift, s, works: list };
      }
      placement.set(k, best);
    }

    // Selection per theme: design rank (s), redundancy filter, home/outside slots.
    const selected = [];
    const themeReport = [];
    for (const t of themes) {
      const tw = inTheme[t.id];
      const emerging = Nt[t.id] < PARAMS.emergingBelowWorks;
      const K = Math.min(PARAMS.keywordsPerThemeMax, Math.max(PARAMS.keywordsPerThemeMin, Math.round(0.5 * Math.sqrt(Nt[t.id]))));
      const outsideShare = tw.length ? tw.filter((e) => e.outside).length / tw.length : 0;
      const Kout = PARAMS.outsideSlots ? Math.round(K * outsideShare) : 0;
      const Kin = K - Kout;
      const cands = [...placement.values()]
        .filter((b) => b.t === t.id && b.n >= PARAMS.minWorksInTheme && b.lift > 1)
        .sort((a, b) => b.s - a.s || b.n - a.n || byId(a.k, b.k))
        .map((b) => ({
          ...b,
          outShare: b.works.filter((e) => e.outside).length / b.n,
          tagged: b.works.filter((e) => e.d !== null).length,
          ids: new Set(b.works.map((e) => e.work.id)),
        }));
      // An outside-slot keyword must have a measured reach (enough topic-tagged works), or it would be drawn at the theme median.
      const isOuter = (c) => c.outShare >= PARAMS.outerKeywordShare && c.tagged >= PARAMS.minTaggedForMean;
      // Mostly-outside keywords with too few topic-tagged works can't be placed honestly (they'd sit at the theme median).
      const unmeasured = (c) => c.outShare >= PARAMS.outerKeywordShare && c.tagged < PARAMS.minTaggedForMean;
      const jaccard = (a, b) => {
        let inter = 0;
        for (const id of a) if (b.has(id)) inter++;
        return inter / (a.size + b.size - inter);
      };
      const chosen = [];
      const redundantWith = new Map();
      const isRedundant = (c) => {
        const hit = chosen.find((x) => jaccard(x.ids, c.ids) >= PARAMS.redundancyJaccard);
        if (hit) redundantWith.set(c.k, hit.k);
        return !!hit;
      };
      if (!emerging) {
        let nIn = 0;
        let nOut = 0;
        for (const c of cands) {
          if (chosen.length >= K) break;
          if (unmeasured(c)) continue;
          const outer = isOuter(c);
          if (outer ? nOut >= Kout : nIn >= Kin) continue;
          if (isRedundant(c)) continue;
          chosen.push(c);
          if (outer) nOut++;
          else nIn++;
        }
        for (const c of cands) {
          if (chosen.length >= K) break;
          if (chosen.includes(c) || unmeasured(c) || isRedundant(c)) continue;
          chosen.push(c);
        }
        chosen.sort((a, b) => b.s - a.s || b.n - a.n || byId(a.k, b.k));
        chosen.forEach((c, rank) => selected.push({ ...c, rank }));
      }
      themeReport.push({ t, N: Nt[t.id], K, Kin, Kout, emerging, outsideShare, cands, chosen, redundantWith, isOuter, unmeasured });
    }

    // 6–8. Metrics for every shown keyword.
    const themeMedianD = Object.fromEntries(
      themes.map((t) => [t.id, median(inTheme[t.id].map((e) => e.d).filter((d) => d !== null))])
    );
    const lensPaperByDoi = new Map(lens.papers.map((p) => [p.doi, p]));
    const keywords = selected.map((c) => {
      const tagged = c.works.filter((e) => e.d !== null);
      const dFallback = tagged.length < PARAMS.minTaggedForMean;
      const dMean = dFallback ? themeMedianD[c.t] ?? 0 : sum(tagged.map((e) => e.d)) / tagged.length;
      const nk = kwCount.get(c.k);
      const also = themes
        .filter((t) => t.id !== c.t)
        .map((t) => ({ id: t.id, n: kwThemeWorks.get(c.k).get(t.id)?.length ?? 0 }))
        .filter((x) => x.n / nk >= PARAMS.bridgeShareMin)
        .sort((a, b) => b.n - a.n || themeIdx[a.id] - themeIdx[b.id]);
      const echo = lens.papers.some((p) => p.theme === c.t && p.keywords.has(c.k));
      const cited = new Map();
      for (const e of c.works) for (const d of e.cites) cited.set(d, (cited.get(d) ?? 0) + 1);
      const top = [...c.works]
        .sort(
          (a, b) =>
            (b.work.cited_by_count ?? 0) - (a.work.cited_by_count ?? 0) ||
            (b.year ?? 0) - (a.year ?? 0) ||
            byId(a.work.id, b.work.id)
        )
        .slice(0, 3)
        .map((e) => ({
          doi: stripDoi(e.work.doi),
          openalex: shortId(e.work.id),
          title: stripTags(e.work.title),
          year: e.year,
          citedBy: e.work.cited_by_count ?? 0,
          cites: [...e.cites].filter((d) => lensPaperByDoi.has(d)).sort(),
        }));
      return {
        id: c.k,
        en: displayName(c.k),
        zh: zhLabel(c.k) ?? undefined,
        theme: c.t,
        also: also.map((x) => x.id),
        works: c.n,
        perYear: round(sum(c.works.map((e) => weight(e, c.t)))),
        lift: round(c.lift),
        dMean: round(dMean),
        echo,
        bridge: also.length > 0,
        rank: c.rank,
        score: round(c.s, 1),
        dFallback,
        tagged: tagged.length,
        outside: c.works.filter((e) => e.outside).length,
        totalWorks: nk,
        alsoWorks: Object.fromEntries(also.map((x) => [x.id, x.n])),
        cited: [...cited.entries()]
          .map(([doi, n]) => ({ doi, n }))
          .sort((a, b) => b.n - a.n || byId(a.doi, b.doi)),
        trend: {
          recent: c.works.filter((e) => inWin(e.year, windows.recent)).length,
          prior: c.works.filter((e) => inWin(e.year, windows.prior)).length,
        },
        top,
      };
    });

    // Callouts: farthest, steepest rise, largest bridge — distinct keywords.
    const callouts = [];
    const used = new Set();
    const pick = (kind, list, detail) => {
      const k = list.find((x) => !used.has(x.id));
      if (!k) return;
      used.add(k.id);
      callouts.push({ kind, keyword: k.id, detail: detail(k) });
    };
    const reliable = keywords.filter((k) => !k.dFallback);
    const far = reliable.filter((k) => k.dMean >= 1).sort((a, b) => b.works - a.works || byId(a.id, b.id));
    const farFallback = [...reliable].sort((a, b) => b.dMean - a.dMean || b.works - a.works || byId(a.id, b.id));
    pick("farthest", far.length ? far : farFallback, (k) => ({ dMean: k.dMean, outside: k.outside, works: k.works }));
    const themeWin = (t, win) => inTheme[t].filter((e) => inWin(e.year, win)).length;
    const rising = keywords
      .map((k) => {
        const R = themeWin(k.theme, windows.recent);
        const Pn = themeWin(k.theme, windows.prior);
        if (R < PARAMS.risingMinThemeWorks || Pn < PARAMS.risingMinThemeWorks) return null;
        if (k.trend.recent < PARAMS.risingMinRecentWorks) return null;
        const gain = k.trend.recent / R - k.trend.prior / Pn;
        return gain > 0 ? { ...k, gain, recentShare: k.trend.recent / R, priorShare: k.trend.prior / Pn } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.gain - a.gain || byId(a.id, b.id));
    pick("rising", rising, (k) => ({
      recentShare: round(k.recentShare, 3),
      priorShare: round(k.priorShare, 3),
      recent: k.trend.recent,
      prior: k.trend.prior,
      windows,
    }));
    const bridges = keywords.filter((k) => k.bridge).sort((a, b) => b.totalWorks - a.totalWorks || byId(a.id, b.id));
    pick("bridge", bridges, (k) => ({ totalWorks: k.totalWorks, byTheme: { [k.theme]: k.works, ...k.alsoWorks } }));

    // Sizes: bubble area ∝ citing works (or cites per year), per-lens scale.
    const maxWorks = Math.max(1, ...keywords.map((k) => k.works));
    const maxPerYear = Math.max(0.01, ...keywords.map((k) => k.perYear));
    const radius = (v, max, rMax, rMin) => Math.max(rMin, rMax * Math.sqrt(v / max));
    for (const k of keywords) {
      k.r = round(radius(k.works, maxWorks, CIRCLE.rMax, CIRCLE.rMin), 1);
      k.rY = round(radius(k.perYear, maxPerYear, CIRCLE.rMax, CIRCLE.rMin), 1);
      k.sr = round(radius(k.works, maxWorks, STRIP.rMax, STRIP.rMin), 1);
      k.srY = round(radius(k.perYear, maxPerYear, STRIP.rMax, STRIP.rMin), 1);
    }

    // Layout (circle + strip), seeded with last run's order.
    const themeList = themes.map((t) => ({
      id: t.id,
      keywords: keywords.filter((k) => k.theme === t.id).length,
      emerging: Nt[t.id] < PARAMS.emergingBelowWorks,
    }));
    const prevOrder = new Map();
    for (const k of prevViews[lens.id]?.keywords ?? []) {
      if (k.order === undefined) continue;
      const list = prevOrder.get(k.theme) ?? [];
      list[k.order] = k.id;
      prevOrder.set(k.theme, list);
    }
    for (const [t, list] of prevOrder) prevOrder.set(t, list.filter(Boolean));
    const layoutInput = keywords.map((k) => ({ ...k, text: { en: k.en, zh: k.zh ?? k.en } }));
    const circle = layoutCircle({ themes: themeList, keywords: layoutInput, maxD, prevOrder, labelsAtRest: PARAMS.labelsAtRest });
    const strip = layoutStrip({ themes: themeList, keywords: layoutInput, maxD });

    const outsideHome = entries.filter((e) => e.outside).length;
    const dCounts = [0, 0, 0, 0, 0];
    let untagged = 0;
    for (const e of entries) {
      if (e.d === null) untagged++;
      else dCounts[e.d]++;
    }

    views[lens.id] = {
      meta: {
        asOf,
        lens: lens.id,
        params: { ...PARAMS, maxDistance: maxD },
        outsideHome,
        citingWorks: N,
        headline: headline(outsideHome, N, asOf),
        homeTopics: H.size,
        untagged,
        distanceCounts: dCounts,
        perYearTotal: round(sum(entries.map((e) => Math.max(...[...e.themes.keys()].map((t) => weight(e, t))))), 1),
        windows,
        scale: { maxWorks, maxPerYear, rMax: CIRCLE.rMax, rMin: CIRCLE.rMin, stripRMax: STRIP.rMax, stripRMin: STRIP.rMin },
        layout: { overlaps: circle.stats.overlaps, maxRadialShift: circle.stats.maxRadialShift },
      },
      themes: themes.map((t) => {
        const tw = inTheme[t.id];
        return {
          id: t.id,
          en: t.en,
          zh: t.zh,
          color: t.color,
          works: Nt[t.id],
          perYear: round(sum(tw.map((e) => weight(e, t.id))), 1),
          outside: tw.filter((e) => e.outside).length,
          emerging: Nt[t.id] < PARAMS.emergingBelowWorks,
          angle: circle.angles.get(t.id),
          keywords: keywords.filter((k) => k.theme === t.id).length,
          medianD: themeMedianD[t.id],
        };
      }),
      papers: lens.papers
        .map((p) => ({ doi: p.doi, short: p.short, year: p.year, theme: p.theme, lens: p.lens, works: p.works }))
        .sort((a, b) => themeIdx[a.theme] - themeIdx[b.theme] || b.works - a.works || byId(a.doi, b.doi)),
      keywords: keywords.map((k) => {
        const cp = circle.positions.get(k.id);
        const sp = strip.positions.get(k.id);
        const order = circle.order.get(k.theme).indexOf(k.id);
        const { r, rY, sr, srY, rank, score, totalWorks, ...rest } = k;
        return {
          ...rest,
          totalWorks,
          rank,
          order,
          circle: { x: cp.x, y: cp.y, r, rY, label: cp.label },
          strip: { x: sp.x, y: sp.y, r: sr, rY: srY, label: sp.label },
        };
      }),
      callouts,
      layout: {
        circle: { ...CIRCLE, maxD, rings: circle.rings },
        strip: { ...STRIP, maxD, rows: strip.rows, guides: strip.guides },
      },
    };
    reportLens[lens.id] = { themeReport, keywords, N, outsideHome, generic, circle, strip, dCounts, untagged, callouts };
  }

  // Cross-check against the page's other numbers (influence.json), when it is from the same data.
  const checks = [];
  const influencePath = join(ROOT, "src", "data", "influence.json");
  if (existsSync(influencePath)) {
    const inf = JSON.parse(readFileSync(influencePath, "utf8"));
    for (const lens of ["all", "lead"]) {
      const t = inf.views?.[lens]?.totals;
      if (!t) continue;
      const ok = t.uniqueCitingWorks === views[lens].meta.citingWorks && t.citingWorksOutsideOwnTopics === views[lens].meta.outsideHome;
      checks.push(
        `${ok ? "PASS" : "WARN"} ${lens}: influence.json (${inf.meta.asOf}) ${t.citingWorksOutsideOwnTopics}/${t.uniqueCitingWorks} vs ripple ${views[lens].meta.outsideHome}/${views[lens].meta.citingWorks}`
      );
    }
  }
  for (const lens of ["all", "lead"]) {
    const m = views[lens].meta;
    checks.push(`${m.layout.overlaps === 0 ? "PASS" : "WARN"} ${lens}: circle bubble overlaps = ${m.layout.overlaps}; max radial shift ${m.layout.maxRadialShift} units`);
    const labelled = views[lens].keywords.filter((k) => k.circle.label.en).length;
    checks.push(`INFO ${lens}: ${labelled} of ${views[lens].keywords.length} bubbles labelled at rest (EN)`);
  }
  checks.push("PASS theme works = independent recount of unique non-self citing works (both lenses)");

  // Alias candidates and missing Chinese labels.
  const aliasCandidates = findAliasCandidates(allCounts, displayName, aliasCfg, generic);
  const shownIds = [...new Set(["all", "lead"].flatMap((l) => views[l].keywords.map((k) => k.id)))].sort();
  const missingZh = shownIds.filter((k) => !zhLabel(k));

  const output = {
    $comment:
      "Generated by scripts/influence/build-ripple.mjs from OpenAlex (self-citations removed). Do not edit by hand; see docs/reach/RIPPLE-MAP.md.",
    all: views.all,
    lead: views.lead,
  };

  const report = renderReport({ views, reportLens, asOf, checks, aliasCandidates, missingZh, prev, homeTopics, maxD, generic, displayName });
  console.log("\n" + report.console);
  console.log(`\n${cacheSummary()}`);
  if (DRY_RUN) {
    console.log("Dry run — nothing written.");
    return;
  }
  writeFileSync(OUT_PATH, JSON.stringify(output, null, 1) + "\n");
  writeFileSync(REPORT_PATH, report.markdown);
  console.log(`Wrote ${OUT_PATH}\nWrote ${REPORT_PATH}`);
}

// ── Alias candidates ───────────────────────────────────────────────────────

const STOP_TOKENS = new Set(["and", "of", "the", "in", "for", "on"]);
const SUFFIX_TOKENS = new Set(["effect", "effects", "phenomenon"]);
const MODIFIERS = new Set(["urban", "surface", "intensity", "global"]);
function singular(tok) {
  if (tok.length > 4 && tok.endsWith("ies")) return tok.slice(0, -3) + "y";
  if (/(ses|xes|zes|ches|shes)$/.test(tok) && tok.length > 4) return tok.slice(0, -2);
  if (tok.length > 3 && tok.endsWith("s") && !/(ss|us|is)$/.test(tok)) return tok.slice(0, -1);
  return tok;
}
function americanize(tok) {
  return tok
    .replace(/isation$/, "ization")
    .replace(/ised$/, "ized")
    .replace(/ising$/, "izing")
    .replace(/^modelling$/, "modeling")
    .replace(/^centre$/, "center")
    .replace(/^behaviour$/, "behavior")
    .replace(/^colour$/, "color")
    .replace(/^neighbourhood$/, "neighborhood")
    .replace(/^greenspace$/, "green-space");
}
function normKey(slug) {
  const toks = slug.split("-").filter((t) => t && !STOP_TOKENS.has(t)).map((t) => americanize(singular(t)));
  while (toks.length > 2 && SUFFIX_TOKENS.has(toks[toks.length - 1])) toks.pop();
  return toks.join("-");
}
const initials = (slug) =>
  slug
    .split("-")
    .filter((t) => t && !STOP_TOKENS.has(t))
    .map((t) => t[0])
    .join("");

function findAliasCandidates(allCounts, displayName, aliasCfg, generic) {
  const rejected = new Set((aliasCfg.rejected ?? []).map((pair) => [...pair].sort().join("|")));
  const pool = [...allCounts.entries()].filter(([, n]) => n >= 3);
  const groups = new Map();
  for (const [k, n] of pool) {
    const key = normKey(k);
    groups.set(key, [...(groups.get(key) ?? []), [k, n]]);
  }
  const out = [];
  const add = (kind, members) => {
    const ids = members.map(([k]) => k).sort();
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) if (rejected.has(`${ids[i]}|${ids[j]}`)) return;
    const sorted = [...members].sort((a, b) => b[1] - a[1] || byId(a[0], b[0]));
    out.push({ kind, into: sorted[0][0], members: sorted.map(([k, n]) => ({ id: k, name: displayName(k), n })) });
  };
  for (const members of groups.values()) if (members.length > 1) add("variant", members);
  const joined = new Map();
  for (const [k, n] of pool) {
    const key = normKey(k).replace(/-/g, "");
    joined.set(key, [...(joined.get(key) ?? []), [k, n]]);
  }
  for (const members of joined.values()) {
    if (members.length > 1 && new Set(members.map(([k]) => normKey(k))).size > 1) add("spelling", members);
  }
  // One extra modifier word: "urban X", "surface X", "X intensity".
  const counts = new Map(pool);
  for (const [k, n] of pool) {
    const toks = k.split("-");
    if (toks.length < 2) continue;
    const variants = [];
    if (MODIFIERS.has(toks[0])) variants.push(toks.slice(1).join("-"));
    if (MODIFIERS.has(toks[toks.length - 1])) variants.push(toks.slice(0, -1).join("-"));
    for (const base of variants) if (counts.has(base) && base.includes("-")) add("modifier", [[k, n], [base, counts.get(base)]]);
  }
  // Acronyms: "uhi" ↔ "urban-heat-island", "lst" ↔ "land-surface-temperature".
  const byInitials = new Map();
  for (const [k, n] of pool) if (k.includes("-")) byInitials.set(initials(k), [...(byInitials.get(initials(k)) ?? []), [k, n]]);
  for (const [k, n] of pool) {
    const shown = displayName(k);
    if (k.includes("-") || k.length < 2 || k.length > 6 || shown !== shown.toUpperCase()) continue;
    const forms = [k, k.endsWith("s") ? k.slice(0, -1) : null].filter(Boolean);
    for (const f of forms) {
      const hits = byInitials.get(f);
      if (hits) for (const h of hits) add("acronym", [[k, n], h]);
    }
  }
  // "urban-heat-island-uhi" style: trailing acronym of the preceding words.
  for (const [k, n] of pool) {
    const toks = k.split("-");
    if (toks.length < 3) continue;
    const last = toks[toks.length - 1];
    const base = toks.slice(0, -1).join("-");
    if (initials(base) === last || initials(base) === last.replace(/s$/, "")) {
      const baseN = allCounts.get(base);
      if (baseN) add("acronym-suffix", [[k, n], [base, baseN]]);
    }
  }
  const seen = new Set();
  return out
    .filter((c) => {
      const key = c.members.map((m) => m.id).sort().join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return !c.members.every((m) => generic.has(m.id));
    })
    .sort((a, b) => sum(b.members.map((m) => m.n)) - sum(a.members.map((m) => m.n)));
}

// ── Report ─────────────────────────────────────────────────────────────────

function renderReport({ views, reportLens, asOf, checks, aliasCandidates, missingZh, prev, homeTopics, maxD, generic, displayName }) {
  const md = [];
  const con = [];
  const pct = (x) => `${Math.round(x * 100)}%`;
  const ring = (d) => (d < 0.5 ? "home" : d < 1.5 ? "subfield" : d < 2.5 ? "field" : d < 3.5 ? "domain" : "other domain");
  md.push("# Ripple keyword report");
  md.push("");
  md.push(`Generated by \`node scripts/influence/build-ripple.mjs\` · OpenAlex data as of ${asOf} · self-citations removed.`);
  md.push("Every number below comes from OpenAlex. This file is rewritten on each run; read it to sanity-check the keywords before a release.");
  md.push("");
  md.push("## Headline");
  md.push("");
  for (const lens of ["all", "lead"]) {
    md.push(`- **${lens === "all" ? "All papers" : "First / last / corresponding author"}:** ${views[lens].meta.headline.en}`);
    con.push(`[${lens}] ${views[lens].meta.headline.en}`);
  }
  md.push("");
  md.push(
    `Reach distance d: 0 = a home topic (one of the ${homeTopics.size} OpenAlex topics on Ken's pinned papers), 1 = same subfield, 2 = same field, 3 = same domain, 4 = another domain. ` +
      `Ken's papers carry topics in ${new Set([...homeTopics.values()].map((t) => t.domain)).size} of OpenAlex's 4 domains, so the outermost ring drawn is d = ${maxD}.`
  );
  md.push("");
  md.push("| Lens | d = 0 | 1 | 2 | 3 | 4 | no topic |");
  md.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const lens of ["all", "lead"]) {
    const r = reportLens[lens];
    md.push(`| ${lens} | ${r.dCounts.join(" | ")} | ${r.untagged} |`);
  }
  md.push("");

  for (const lens of ["all", "lead"]) {
    const r = reportLens[lens];
    const title = lens === "all" ? "All papers" : "First / last / corresponding author (lead)";
    md.push(`## ${title} — top keywords per theme`);
    md.push("");
    md.push(
      "Columns: works = citing works in the theme carrying the keyword; lift = share in theme ÷ share overall; s = works × ln(lift) (the design's rank); d̄ = mean reach distance; out = share of those works outside home topics. " +
        "**Shown** marks the bubbles on the map. Rows marked *redundant* were skipped because ≥60% of their works already carry a higher-ranked keyword."
    );
    md.push("");
    con.push(`\n== ${title}: ${r.N} citing works, ${r.outsideHome} outside home topics`);
    for (const tr of r.themeReport) {
      const head = `${tr.t.en} — ${tr.N} citing works, ${pct(tr.outsideShare)} outside home topics`;
      const slots = tr.emerging
        ? `emerging (fewer than ${PARAMS.emergingBelowWorks} citing works): arc only, no bubbles`
        : `K = ${tr.K} bubbles: ${tr.Kin} home-side + ${tr.Kout} outside slots`;
      md.push(`### ${head}`);
      md.push("");
      md.push(slots + ".");
      md.push("");
      con.push(`\n-- ${head} · ${slots}`);
      if (tr.cands.length === 0) {
        md.push("_No keyword reaches 3 works with lift > 1 in this theme._");
        md.push("");
        continue;
      }
      md.push("| # | Keyword | Works | Lift | s | d̄ | Out | New/echo | Bridge | Shown |");
      md.push("| ---: | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |");
      const shown = new Map(r.keywords.filter((k) => k.theme === tr.t.id).map((k) => [k.id, k]));
      const rows = tr.cands.slice(0, 20);
      for (const extra of tr.chosen) if (!rows.includes(extra)) rows.push(extra);
      rows.forEach((c, i) => {
        const k = shown.get(c.k);
        const tagged = c.works.filter((e) => e.d !== null);
        const dm = tagged.length ? sum(tagged.map((e) => e.d)) / tagged.length : NaN;
        const flag = k
          ? `**shown** (${tr.isOuter(c) ? "outside slot" : "home slot"})`
          : tr.unmeasured(c)
            ? "reach not measurable (<5 topic-tagged works)"
            : tr.redundantWith.has(c.k)
              ? `redundant with “${displayName(tr.redundantWith.get(c.k))}”`
              : "";
        const name = views[lens].keywords.find((x) => x.id === c.k)?.en ?? displayName(c.k);
        md.push(
          `| ${tr.cands.indexOf(c) + 1} | ${name} | ${c.n} | ${c.lift.toFixed(2)} | ${c.s.toFixed(1)} | ${Number.isNaN(dm) ? "–" : dm.toFixed(2)} | ${pct(c.outShare)} | ${k ? (k.echo ? "echo" : "new") : ""} | ${k?.bridge ? k.also.join(", ") : ""} | ${flag} |`
        );
        if (i < 20) {
          con.push(
            `${k ? "*" : " "} ${String(c.n).padStart(4)}  lift ${c.lift.toFixed(2).padStart(6)}  s ${c.s.toFixed(1).padStart(6)}  d̄ ${Number.isNaN(dm) ? " –  " : dm.toFixed(2)}  out ${pct(c.outShare).padStart(4)}  ${name}${tr.redundantWith.has(c.k) ? "  (redundant)" : ""}`
          );
        }
      });
      md.push("");
    }
    md.push("### Callouts");
    md.push("");
    for (const c of r.callouts) {
      const k = views[lens].keywords.find((x) => x.id === c.keyword);
      md.push(`- **${c.kind}:** ${k.en} — ${JSON.stringify(c.detail)}`);
      con.push(`callout ${c.kind}: ${k.en}`);
    }
    if (r.callouts.length === 0) md.push("_None qualified this run._");
    md.push("");
  }

  md.push("## Generic keywords dropped");
  md.push("");
  md.push(`Stoplist entries plus any keyword on more than ${PARAMS.genericShareMax * 100}% of All-lens citing works (applied to both lenses).`);
  md.push("");
  for (const [k, g] of [...generic.entries()].sort((a, b) => b[1].n - a[1].n)) {
    md.push(`- ${displayName(k)} — ${g.n} works (${(g.share * 100).toFixed(1)}%), ${g.why === "stoplist" ? "stoplist" : "over the share cutoff"}`);
  }
  md.push("");

  md.push("## Alias candidates for Ken (accept → add to `merge`; reject → add to `rejected`)");
  md.push("");
  md.push("Detected automatically (plural, spelling, acronym and “… effect” variants among keywords on ≥3 All-lens works). Nothing here is merged until it is in `data/influence/keyword-aliases.json`.");
  md.push("");
  if (aliasCandidates.length === 0) md.push("_None open._");
  const shownAny = new Set(["all", "lead"].flatMap((l) => views[l].keywords.map((k) => k.id)));
  const fmt = (c) => {
    const onMap = c.members.some((m) => shownAny.has(m.id));
    return `- ${onMap ? "**on map** · " : ""}${c.members.map((m) => `\`${m.id}\` (${m.name}, ${m.n})`).join(" ↔ ")}`;
  };
  const ranked = (list) => [...list].sort((a, b) => Number(b.members.some((m) => shownAny.has(m.id))) - Number(a.members.some((m) => shownAny.has(m.id))));
  const groupsOut = [
    ["Plural, spelling and acronym variants", aliasCandidates.filter((c) => c.kind !== "modifier")],
    ["“urban X” / “surface X” / “X intensity” ↔ “X” — one decision: fold the modifier or keep both", aliasCandidates.filter((c) => c.kind === "modifier")],
  ];
  for (const [title, list] of groupsOut) {
    if (list.length === 0) continue;
    md.push(`### ${title} (${list.length})`);
    md.push("");
    for (const c of ranked(list)) md.push(fmt(c));
    md.push("");
  }

  md.push("## Chinese labels missing");
  md.push("");
  md.push(missingZh.length ? missingZh.map((k) => `- \`${k}\` (${displayName(k)})`).join("\n") : "_None: every shown keyword has a Chinese label in `data/influence/keyword-zh.json`._");
  md.push("");

  md.push("## Changes since the previous ripple.json");
  md.push("");
  for (const lens of ["all", "lead"]) {
    const now = new Set(views[lens].keywords.map((k) => k.id));
    const before = new Set((prev?.[lens]?.keywords ?? []).map((k) => k.id));
    const added = [...now].filter((k) => !before.has(k));
    const removed = [...before].filter((k) => !now.has(k));
    md.push(
      `- ${lens}: ${prev ? `${added.length} added${added.length ? ` (${added.join(", ")})` : ""}; ${removed.length} removed${removed.length ? ` (${removed.join(", ")})` : ""}` : "first run, no previous file"}`
    );
  }
  md.push("");

  md.push("## Home topics (the set H)");
  md.push("");
  md.push("| Topic | Subfield | Field | Domain |");
  md.push("| --- | --- | --- | --- |");
  for (const t of [...homeTopics.values()].sort((a, b) => byId(a.domain ?? "", b.domain ?? "") || byId(a.field ?? "", b.field ?? "") || byId(a.name, b.name))) {
    md.push(`| ${t.name} | ${t.subfield ?? ""} | ${t.field ?? ""} | ${t.domain ?? ""} |`);
  }
  md.push("");

  md.push("## Validation");
  md.push("");
  for (const c of checks) md.push(`- ${c}`);
  md.push("");
  md.push(`Parameters: \`${JSON.stringify(views.all.meta.params)}\``);
  md.push("");
  con.push("\nValidation:\n" + checks.map((c) => "  " + c).join("\n"));
  if (missingZh.length) con.push(`Chinese labels missing for ${missingZh.length} shown keywords: ${missingZh.join(", ")}`);
  con.push(`${aliasCandidates.length} open alias candidates (see report).`);
  return { markdown: md.join("\n"), console: con.join("\n") };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
