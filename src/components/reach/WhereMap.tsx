"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import T from "@/components/T";
import worldMap from "@/data/world-map.json";
import whereGlow from "@/data/where-glow.json";
import { influence, countryName } from "@/lib/influence";
import { useReachLens } from "./ReachLens";

const MIN_WORKS = 5;

const BINS: { min: number; color: string; en: string; zh: string }[] = [
  { min: 6, color: "#0d7377", en: "≥ 6× expected", zh: "≥ 预期 6 倍" },
  { min: 3, color: "#4fa5a8", en: "3–6×", zh: "3–6 倍" },
  { min: 1.5, color: "#a8d5d6", en: "1.5–3×", zh: "1.5–3 倍" },
  { min: 0.67, color: "#d9d2c6", en: "about as expected (0.67–1.5×)", zh: "接近预期（0.67–1.5 倍）" },
  { min: 0, color: "#e3b48f", en: "< 0.67×", zh: "< 0.67 倍" },
];
const binFor = (ratio: number) => BINS.find((b) => ratio >= b.min) ?? BINS[BINS.length - 1];

/** Ember–teal density ramp on transparent (matches site ink/ember). */
function colourFor(t: number): [number, number, number, number] {
  if (t <= 0) return [0, 0, 0, 0];
  // stops: soft teal → deep teal → ember
  const stops: { t: number; c: [number, number, number, number] }[] = [
    { t: 0.05, c: [168, 213, 214, 40] },
    { t: 0.25, c: [79, 165, 168, 110] },
    { t: 0.5, c: [13, 115, 119, 160] },
    { t: 0.75, c: [196, 92, 38, 190] },
    { t: 1, c: [139, 46, 14, 220] },
  ];
  const u = Math.min(1, Math.max(0, t));
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (u >= stops[i].t && u <= stops[i + 1].t) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const span = b.t - a.t || 1;
  const f = (u - a.t) / span;
  return [
    Math.round(a.c[0] + (b.c[0] - a.c[0]) * f),
    Math.round(a.c[1] + (b.c[1] - a.c[1]) * f),
    Math.round(a.c[2] + (b.c[2] - a.c[2]) * f),
    Math.round(a.c[3] + (b.c[3] - a.c[3]) * f),
  ];
}

async function inflateGrid(b64: string, expected: number): Promise<Uint8Array> {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  if (typeof DecompressionStream === "undefined") {
    // Unlikely on modern browsers; treat as raw if lengths match
    if (bin.length === expected) return bin;
    throw new Error("deflate unsupported");
  }
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("deflate"));
  const buf = new Uint8Array(await new Response(stream).arrayBuffer());
  if (buf.length !== expected) {
    console.warn(`where-glow grid length ${buf.length} ≠ ${expected}`);
  }
  return buf;
}

type GlowView = (typeof whereGlow)["views"]["all"];

function GlowCanvas({
  view,
  mapW,
  mapH,
  hatchId,
}: {
  view: GlowView;
  mapW: number;
  mapH: number;
  hatchId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const gridRef = useRef<Uint8Array | null>(null);
  const gw = whereGlow.meta.grid.width;
  const gh = whereGlow.meta.grid.height;

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setErr(null);
    inflateGrid(view.grid, gw * gh)
      .then((g) => {
        if (cancelled) return;
        gridRef.current = g;
        setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : "glow decode failed");
      });
    return () => {
      cancelled = true;
    };
  }, [view.grid, gw, gh]);

  useEffect(() => {
    if (!ready || !gridRef.current) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cssW = rect.width;
      const cssH = (cssW * mapH) / mapW;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Build source ImageData at grid res, then scale smoothly
      const src = document.createElement("canvas");
      src.width = gw;
      src.height = gh;
      const sctx = src.getContext("2d");
      if (!sctx) return;
      const img = sctx.createImageData(gw, gh);
      const g = gridRef.current!;
      for (let i = 0; i < g.length; i++) {
        const [r, gv, b, a] = colourFor(g[i] / 255);
        const o = i * 4;
        img.data[o] = r;
        img.data[o + 1] = gv;
        img.data[o + 2] = b;
        img.data[o + 3] = a;
      }
      sctx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(src, 0, 0, cssW, cssH);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [ready, view, mapW, mapH, gw, gh]);

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0">
      <canvas ref={canvasRef} className="h-auto w-full" aria-hidden="true" />
      {!ready && !err && (
        <div className="absolute inset-0 flex items-center justify-center bg-paper/40 text-xs text-ink-muted">
          <T en="Painting affiliation glow…" zh="正在绘制机构密度热力…" />
        </div>
      )}
      {err && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-ember">
          <T en={`Glow unavailable (${err})`} zh={`热力暂不可用（${err}）`} />
        </div>
      )}
      {/* hatch pattern id reserved for choropleth sibling */}
      <span className="hidden" data-hatch={hatchId} />
    </div>
  );
}

export default function WhereMap() {
  const { view, lens } = useReachLens();
  const { countries, totals } = view;
  const { meta } = influence;
  const byCode = useMemo(() => new Map(countries.map((c) => [c.code, c])), [countries]);
  const drawn = useMemo(() => new Set(worldMap.countries.map((c) => c.iso2)), []);
  const notDrawn = countries.filter((c) => !drawn.has(c.code));
  const tableRows = countries.filter((c) => c.citingWorks >= MIN_WORKS);
  const hatchId = useId().replace(/:/g, "");
  const [showOe, setShowOe] = useState(false);

  const glowView = whereGlow.views[lens === "lead" ? "lead" : "all"];
  const gaps = whereGlow.meta.gaps;

  return (
    <div>
      <p className="max-w-3xl text-[15px] leading-relaxed text-ink-muted">
        <T
          en={
            <>
              Authors in <strong className="text-ink">{totals.countriesCount}</strong> countries and territories have
              built on these papers. The <em>glow</em> is a kernel-density map of OpenAlex author-affiliation cities
              (each unique institution weighted by how many citing works list it). Multi-affiliation papers light every
              campus with coordinates. Absolute density mostly follows where science happens — toggle the country
              shading for the tenure-readable <em>observed ÷ expected</em> view.
            </>
          }
          zh={
            <>
              来自 <strong className="text-ink">{totals.countriesCount}</strong>{" "}
              个国家和地区的作者引用了这些论文。热力为 OpenAlex
              施引作者机构所在城市的核密度：每个有坐标的机构按“列出该机构的施引文献数”加权；一篇多机构论文会点亮各校区。绝对密度主要反映科研产出分布——需要可引用的“实际 ÷
              预期”时，请打开国家着色。
            </>
          }
        />
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <label className="inline-flex cursor-pointer items-center gap-2 text-ink-muted hover:text-ink">
          <input
            type="checkbox"
            className="accent-teal-700"
            checked={showOe}
            onChange={(e) => setShowOe(e.target.checked)}
          />
          <T en="Show observed ÷ expected countries" zh="显示“实际 ÷ 预期”国家着色" />
        </label>
        <span className="text-xs text-ink-faint">
          <T
            en={`${glowView.institutionsWithGeo} institutions with coordinates · weight ${glowView.totalWeight} citing-work links`}
            zh={`${glowView.institutionsWithGeo} 个有坐标机构 · 权重 ${glowView.totalWeight} 篇次施引`}
          />
        </span>
      </div>

      <figure className="mt-6">
        <div className="relative w-full">
          <svg
            viewBox={`0 0 ${worldMap.width} ${worldMap.height}`}
            className="h-auto w-full"
            role="img"
            aria-label="World map: affiliation density glow of citing authors, Equal Earth projection (OpenAlex)"
          >
            <defs>
              <pattern
                id={`reach-hatch-${hatchId}`}
                width="4"
                height="4"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="4" height="4" fill="#efe9df" />
                <line x1="0" y1="0" x2="0" y2="4" stroke="#b9ae9f" strokeWidth="1.2" />
              </pattern>
            </defs>
            {worldMap.countries.map((c, i) => {
              const d = c.iso2 ? byCode.get(c.iso2) : undefined;
              let fill = "#f1ece3";
              let title = `${c.name}: no citing works`;
              if (showOe) {
                if (d && d.citingWorks < MIN_WORKS) {
                  fill = `url(#reach-hatch-${hatchId})`;
                  title = `${c.name}: ${d.citingWorks} citing work${d.citingWorks === 1 ? "" : "s"} — too few to normalize`;
                } else if (d && d.ratio != null) {
                  // Subdue choropleth under glow
                  fill = binFor(d.ratio).color;
                  title = `${c.name}: ${d.citingWorks} citing works vs ${d.expected} expected → ${d.ratio}× (OpenAlex)`;
                }
              } else {
                if (d && d.citingWorks > 0) {
                  fill = "#ebe4d8";
                  title = `${c.name}: ${d.citingWorks} citing works (OpenAlex)`;
                }
              }
              return (
                <path
                  key={c.iso2 ?? `x${i}`}
                  d={c.d}
                  fill={fill}
                  stroke="#fffcf7"
                  strokeWidth={0.5}
                  className="hover:stroke-ink hover:[stroke-width:1]"
                >
                  <title>{title}</title>
                </path>
              );
            })}
          </svg>
          <GlowCanvas view={glowView} mapW={worldMap.width} mapH={worldMap.height} hatchId={hatchId} />
        </div>

        <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-8 rounded-sm"
              style={{
                background: "linear-gradient(90deg, rgba(168,213,214,0.3), #0d7377, #c45c26)",
              }}
            />
            <T en="Affiliation density (glow)" zh="机构密度（热力）" />
          </span>
          {showOe &&
            BINS.map((b) => (
              <span key={b.min} className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ background: b.color }} />
                <T en={b.en} zh={b.zh} />
              </span>
            ))}
          {showOe && (
            <span className="inline-flex items-center gap-1.5">
              <svg width="12" height="12" aria-hidden="true">
                <rect width="12" height="12" rx="2" fill={`url(#reach-hatch-${hatchId})`} />
              </svg>
              <T en={`1–${MIN_WORKS - 1} citing works`} zh={`1–${MIN_WORKS - 1} 篇施引文献`} />
            </span>
          )}
          <span className="w-full text-ink-faint">
            <T
              en={`Glow: Gaussian kernel σ ≈ ${whereGlow.meta.kernel.sigmaKm} km on Equal Earth; weight = unique citing works per institution. Lead uses the same colour scale as All (dimmer, not re-scaled). Source: OpenAlex affiliations (self-citations removed), as of ${whereGlow.meta.asOf}. Basemap: Natural Earth 1:110m (public domain).`}
              zh={`热力：等积地球投影上高斯核 σ ≈ ${whereGlow.meta.kernel.sigmaKm} km；权重为每机构的唯一施引文献数。Lead 与 All 共用色标（更淡、不重标定）。数据：OpenAlex 机构（已剔除自引），截至 ${whereGlow.meta.asOf}。底图：Natural Earth 1:110m（公有领域）。`}
            />
          </span>
          <span className="w-full text-ink-faint">
            <T
              en={`Gaps: ${gaps.worksNoAffiliationAll} All / ${gaps.worksNoAffiliationLead} Lead citing works have no OpenAlex affiliation; ${gaps.institutionsMissingGeoAll} / ${gaps.institutionsMissingGeoLead} institutions lack coordinates (no glow). Multi-campus systems plot at the OpenAlex HQ city. China coverage is a lower bound (CNKI under-count).`}
              zh={`缺口：全部视角 ${gaps.worksNoAffiliationAll} / Lead ${gaps.worksNoAffiliationLead} 篇施引无 OpenAlex 机构；${gaps.institutionsMissingGeoAll} / ${gaps.institutionsMissingGeoLead} 个机构无坐标（不进入热力）。多校区系统落在 OpenAlex 总部城市。中国覆盖为下限（知网低估）。`}
            />
          </span>
        </figcaption>
      </figure>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-ink-muted hover:text-ink">
          <T
            en={`Countries with ≥ ${MIN_WORKS} citing works (observed ÷ expected table)`}
            zh={`施引文献 ≥ ${MIN_WORKS} 篇的国家和地区（实际 ÷ 预期表）`}
          />
        </summary>
        <p className="mt-2 text-xs text-ink-faint">
          <T
            en={`Small research systems have small expected values, so their ratios swing widely (one extra paper moves them a lot). Not drawn at this map scale: ${notDrawn.map((c) => countryName(c.code).en).join(", ") || "—"}.`}
            zh={`科研体量较小的国家和地区预期值很小，比值波动较大（多一篇论文就会显著改变比值）。以下地区在此比例尺地图上未绘出：${notDrawn.map((c) => countryName(c.code).zh).join("、") || "—"}。`}
          />
        </p>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-xs text-ink-faint">
            <tr>
              <th className="py-1 pr-3 font-normal">
                <T en="Country / territory" zh="国家/地区" />
              </th>
              <th className="py-1 pr-3 text-right font-normal">
                <T en="Citing works" zh="施引文献" />
              </th>
              <th className="py-1 pr-3 text-right font-normal">
                <T en="Expected" zh="预期" />
              </th>
              <th className="py-1 text-right font-normal">
                <T en="Ratio" zh="比值" />
              </th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((c) => {
              const n = countryName(c.code);
              return (
                <tr key={c.code} className="border-t border-rule-faint">
                  <td className="py-1 pr-3">
                    <T en={n.en} zh={n.zh} />
                  </td>
                  <td className="py-1 pr-3 text-right tabular-nums">{c.citingWorks}</td>
                  <td className="py-1 pr-3 text-right tabular-nums text-ink-muted">{c.expected ?? "—"}</td>
                  <td className="py-1 text-right tabular-nums">{c.ratio != null ? `${c.ratio}×` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>

      {glowView.topInstitutions?.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-ink-muted hover:text-ink">
            <T en="Top affiliation cities (by citing works)" zh="施引最多的机构所在地（按施引文献）" />
          </summary>
          <ul className="mt-2 columns-1 gap-x-8 text-sm sm:columns-2">
            {glowView.topInstitutions.slice(0, 15).map((inst) => (
              <li key={inst.id} className="break-inside-avoid border-t border-rule-faint py-1">
                <span className="text-ink">{inst.name}</span>
                <span className="text-ink-faint">
                  {" "}
                  · {[inst.city, inst.country].filter(Boolean).join(", ")} · {inst.w}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
