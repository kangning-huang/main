"""Compare Semantic Scholar citing works (data/s2-reach/latest.json) with the
OpenAlex citing works behind /reach (src/data/field-shelf.json).

field-shelf.json stores only OpenAlex IDs, so their DOIs/titles are resolved first
into a JSON list (one OpenAlex work per item, plus `paperIdxs`), passed as argv[1].

Matching: DOI (case-insensitive), then normalized title with year within ±1.
Self-citations are excluded on both sides (OpenAlex squares are already non-self).

    python3 scripts/semantic-scholar/compare-openalex.py <openalex-citing.json>
"""
import collections, json, re, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def norm_title(t):
    t = unicodedata.normalize("NFKD", t or "").lower()
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", " ", t)).strip()


def norm_doi(d):
    return re.sub(r"^https?://(dx\.)?doi\.org/", "", (d or "").lower()) or None


s2 = json.loads((ROOT / "data/s2-reach/latest.json").read_text())
shelf = json.loads((ROOT / "src/data/field-shelf.json").read_text())
oa_works = json.loads(Path(sys.argv[1]).read_text())

pinned = json.loads((ROOT / "data/influence/dois.json").read_text())["papers"]
short = {p["doi"].lower(): p["short"] for p in pinned}
lens = {p["doi"].lower(): p["lens"] for p in pinned}
shelf_doi = [p["doi"].lower() for p in shelf["papers"]]
s2_doi = {p["idx"]: p["doi"].lower() for p in s2["papers"]}

# Each work → set of cited-paper DOIs (non-self only)
oa = []
for w in oa_works:
    oa.append({
        "id": w["id"].rsplit("/", 1)[-1], "doi": norm_doi(w.get("doi")), "title": w.get("title") or "",
        "year": w.get("publication_year"), "type": w.get("type"), "citedBy": w.get("cited_by_count", 0),
        "cites": {shelf_doi[i] for i in w["paperIdxs"]},
    })
s2w = []
for w in s2["works"]:
    cites = {s2_doi[c["paper"]] for c in w["cites"] if not c["self"]}
    if not cites:
        continue
    s2w.append({
        "id": w["s2PaperId"], "doi": norm_doi(w.get("doi")), "title": w["title"] or "", "year": w.get("year"),
        "types": w.get("publicationTypes") or [], "venue": w.get("venue"), "citedBy": w.get("citationCount", 0),
        "cites": cites,
        "influential": any(c["isInfluential"] and not c["self"] for c in w["cites"]),
    })

oa_by_doi = {w["doi"]: w for w in oa if w["doi"]}
oa_by_title = collections.defaultdict(list)
for w in oa:
    oa_by_title[norm_title(w["title"])].append(w)

matched, s2_only = [], []
matched_oa = set()
for w in s2w:
    m = oa_by_doi.get(w["doi"]) if w["doi"] else None
    how = "doi"
    if not m:
        how = "title"
        for c in oa_by_title.get(norm_title(w["title"]), []):
            if not (w["year"] and c["year"]) or abs(w["year"] - c["year"]) <= 1:
                m = c
                break
    if m and len(norm_title(w["title"])) > 10 or (m and how == "doi"):
        matched.append((w, m, how))
        matched_oa.add(m["id"])
    else:
        s2_only.append(w)
oa_only = [w for w in oa if w["id"] not in matched_oa]

# Per cited paper: links in each source, and overlap
per = []
for doi in shelf_doi:
    o = {w["id"] for w in oa if doi in w["cites"]}
    s = {w["id"] for w in s2w if doi in w["cites"]}
    both = sum(1 for w, m, _ in matched if doi in w["cites"] and doi in m["cites"])
    per.append({"doi": doi, "short": short.get(doi, doi), "lens": lens.get(doi), "openalex": len(o), "s2": len(s), "both": both,
                "openalexOnly": len(o) - both, "s2Only": len(s) - both})


def describe(ws, key_types):
    years = collections.Counter(w["year"] for w in ws)
    return {
        "n": len(ws),
        "withDoi": sum(1 for w in ws if w["doi"]),
        "types": collections.Counter(t for w in ws for t in (w[key_types] if isinstance(w[key_types], list) else [w[key_types]]) or ["(none)"]).most_common(8),
        "byYear": sorted(((y or 0), n) for y, n in years.items()),
        "citedByZero": sum(1 for w in ws if not w["citedBy"]),
        "citedBy10plus": sum(1 for w in ws if (w["citedBy"] or 0) >= 10),
    }


report = {
    "openalexWorks": len(oa), "s2Works": len(s2w), "matched": len(matched),
    "matchedBy": dict(collections.Counter(h for _, _, h in matched)),
    "union": len(oa) + len(s2_only),
    "openalexOnly": describe(oa_only, "type"),
    "s2Only": describe(s2_only, "types"),
    "s2OnlyInfluential": sum(1 for w in s2_only if w["influential"]),
    "perPaper": per,
    "topS2Only": [{k: w[k] for k in ("title", "year", "venue", "citedBy", "doi", "influential")} | {"cites": sorted(short.get(d, d) for d in w["cites"])}
                  for w in sorted(s2_only, key=lambda w: -(w["citedBy"] or 0))[:25]],
    "topOpenalexOnly": [{k: w[k] for k in ("title", "year", "type", "citedBy", "doi", "id")} | {"cites": sorted(short.get(d, d) for d in w["cites"])}
                        for w in sorted(oa_only, key=lambda w: -(w["citedBy"] or 0))[:25]],
}
(ROOT / "data/s2-reach/compare-openalex.json").write_text(json.dumps(report, indent=1, ensure_ascii=False) + "\n")
print(json.dumps({k: v for k, v in report.items() if not k.startswith("top") and k != "perPaper"}, indent=1))
for p in per:
    print(f"{p['short'][:46]:46} OA {p['openalex']:4}  S2 {p['s2']:4}  both {p['both']:4}  OA-only {p['openalexOnly']:4}  S2-only {p['s2Only']:4}")
