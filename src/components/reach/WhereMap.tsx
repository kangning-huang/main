"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import T from "@/components/T";
import worldMap from "@/data/world-map.json";
import whereGlow from "@/data/where-glow.json";
import { influence, countryName } from "@/lib/influence";
import { useReachLens } from "./ReachLens";

const MIN_WORKS = 5;

type DensityMode = "glow" | "honeycomb";

const BINS: { min: number; color: string; en: string; zh: string }[] = [
  { min: 6, color: "#0d7377", en: "≥ 6× expected", zh: "≥ 预期 6 倍" },
  { min: 3, color: "#4fa5a8", en: "3–6×", zh: "3–6 倍" },
  { min: 1.5, color: "#a8d5d6", en: "1.5–3×", zh: "1.5–3 倍" },
  { min: 0.67, color: "#d9d2c6", en: "about as expected (0.67–1.5×)", zh: "接近预期（0.67–1.5 倍）" },
  { min: 0, color: "#e3b48f", en: "< 0.67×", zh: "< 0.67 倍" },
];
const binFor = (ratio: number) => BINS.find((b) => ratio >= b.min) ?? BINS[BINS.length - 1];

/** Ember–teal density ramp (shared by Glow + Honeycomb). */
function colourFor(t: number): [number, number, number, number] {
  if (t <= 0) return [0, 0, 0, 0];
  const stops: { t: number; c: [number, number, number, number] }[] = [
    { t: 0.05, c: [168, 213, 214, 55] },
    { t: 0.25, c: [79, 165, 168, 130] },
    { t: 0.5, c: [13, 115, 119, 175] },
    { t: 0.75, c: [196, 92, 38, 200] },
    { t: 1, c: [139, 46, 14, 230] },
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

function rgba(c: [number, number, number, number]) {
  return `rgba(${c[0]},${c[1]},${c[2]},${(c[3] / 255).toFixed(3)})`;
}

async function inflateGrid(b64: string, expected: number): Promise<Uint8Array> {
  const bin = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
  if (typeof DecompressionStream === "undefined") {
    if (bin.length === expected) return bin;
    throw new Error("deflate unsupported");
  }
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

type GlowView = (typeof whereGlow)["views"]["all"];

function GlowCanvas({ view, mapW, mapH }: { view: GlowView; mapW: number; mapH: number }) {
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
        if (!cancelled) {
          gridRef.current = g;
          setReady(true);
        }
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
    </div>
  );
}

function hexPath(cx: number, cy: number, size: number): string {
  // pointy-top
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI / 180) * (60 * i - 30);
    const x = cx + size * Math.cos(ang);
    const y = cy + size * Math.sin(ang);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

function HoneycombLayer({ view }: { view: GlowView }) {
  const hexMeta = (whereGlow.meta as { hex?: { sizePx: number; flatToFlatKm: number } }).hex;
  const size = hexMeta?.sizePx ?? 6;
  const hexes = (view as GlowView & { hexes?: [number, number, number, number][] }).hexes ?? [];
  const hexNormMax = (view as GlowView & { hexNormMax?: number }).hexNormMax ?? 1;
  const gamma = 0.55;

  if (hexes.length === 0) {
    return (
      <text x={worldMap.width / 2} y={worldMap.height / 2} textAnchor="middle" className="fill-ink-muted" fontSize="12">
        Honeycomb data missing — rebuild where-glow.json
      </text>
    );
  }

  return (
    <g aria-label="Affiliation hexbin density">
      {hexes.map(([x, y, w, n], i) => {
        const t = Math.pow(Math.min(1, w / hexNormMax), gamma);
        const fill = rgba(colourFor(Math.max(0.05, t)));
        return (
          <path key={i} d={hexPath(x, y, size)} fill={fill} stroke="#fffcf7" strokeWidth={0.35} strokeOpacity={0.7}>
            <title>{`${w} citing-work links · ${n} institution${n === 1 ? "" : "s"}`}</title>
          </path>
        );
      })}
    </g>
  );
}

export default function WhereMap() {
  const { view, lens } = useReachLens();
  const { countries, totals } = view;
  const byCode = useMemo(() => new Map(countries.map((c) => [c.code, c])), [countries]);
  const drawn = useMemo(() => new Set(worldMap.countries.map((c) => c.iso2)), []);
  const notDrawn = countries.filter((c) => !drawn.has(c.code));
  const tableRows = countries.filter((c) => c.citingWorks >= MIN_WORKS);
  const hatchId = useId().replace(/:/g, "");
  const [showOe, setShowOe] = useState(false);
  const [densityMode, setDensityMode] = useState<DensityMode>("glow");

  const glowView = whereGlow.views[lens === "lead" ? "lead" : "all"];
  const gaps = whereGlow.meta.gaps;
  const hexMeta = (whereGlow.meta as { hex?: { flatToFlatKm: number; sizePx: number } }).hex;
  const hexCount = ((glowView as GlowView & { hexes?: unknown[] }).hexes ?? []).length;

  return (
    <div>
      <p className="max-w-3xl text-[15px] leading-relaxed text-ink-muted">
        <T
          en={
            <>
              Authors in <strong className="text-ink">{totals.countriesCount}</strong> countries and territories have
              built on these papers. Compare two absolute-density views of OpenAlex author-affiliation cities (each
              unique institution weighted by how many citing works list it): <em>Glow</em> (kernel density) and{" "}
              <em>Honeycomb</em> (equal-area hexbin). Multi-affiliation papers count at every campus with coordinates.
              Toggle country shading for the tenure-readable <em>observed ÷ expected</em> view.
            </>
          }
          zh={
            <>
              来自 <strong className="text-ink">{totals.countriesCount}</strong>{" "}
              个国家和地区的作者引用了这些论文。可比较两种施引机构绝对密度：<em>热力 Glow</em>
              （核密度）与<em>蜂巢 Honeycomb</em>
              （等积六边形分箱）；每个有坐标机构按列出该机构的施引文献数加权，多机构论文计入各校区。需要可引用的“实际 ÷
              预期”时，请打开国家着色。
            </>
          }
        />
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm">
        <div
          role="group"
          aria-label="Density map style"
          className="inline-flex rounded-full border border-rule bg-paper p-0.5 shadow-sm"
        >
          {(
            [
              { id: "glow", en: "Glow", zh: "热力" },
              { id: "honeycomb", en: "Honeycomb", zh: "蜂巢" },
            ] as const
          ).map((opt) => {
            const on = densityMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={on}
                onClick={() => setDensityMode(opt.id)}
                className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                  on ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"
                }`}
              >
                <T en={opt.en} zh={opt.zh} />
              </button>
            );
          })}
        </div>
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
            en={`${glowView.institutionsWithGeo} institutions · weight ${glowView.totalWeight}${
              densityMode === "honeycomb" ? ` · ${hexCount} hexes` : ""
            }`}
            zh={`${glowView.institutionsWithGeo} 个机构 · 权重 ${glowView.totalWeight}${
              densityMode === "honeycomb" ? ` · ${hexCount} 个六边形` : ""
            }`}
          />
        </span>
      </div>

      <figure className="mt-6">
        <div className="relative w-full">
          <svg
            viewBox={`0 0 ${worldMap.width} ${worldMap.height}`}
            className="h-auto w-full"
            role="img"
            aria-label={
              densityMode === "glow"
                ? "World map: affiliation density glow of citing authors (OpenAlex)"
                : "World map: affiliation hexbin density of citing authors (OpenAlex)"
            }
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
                  fill = binFor(d.ratio).color;
                  title = `${c.name}: ${d.citingWorks} citing works vs ${d.expected} expected → ${d.ratio}× (OpenAlex)`;
                }
              } else if (d && d.citingWorks > 0) {
                fill = "#ebe4d8";
                title = `${c.name}: ${d.citingWorks} citing works (OpenAlex)`;
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
            {densityMode === "honeycomb" && <HoneycombLayer view={glowView} />}
          </svg>
          {densityMode === "glow" && (
            <GlowCanvas view={glowView} mapW={worldMap.width} mapH={worldMap.height} />
          )}
        </div>

        <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-8 rounded-sm"
              style={{
                background: "linear-gradient(90deg, rgba(168,213,214,0.3), #0d7377, #c45c26)",
              }}
            />
            <T
              en={densityMode === "glow" ? "Affiliation density (glow)" : "Affiliation density (honeycomb)"}
              zh={densityMode === "glow" ? "机构密度（热力）" : "机构密度（蜂巢）"}
            />
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
            {densityMode === "glow" ? (
              <T
                en={`Glow: Gaussian kernel σ ≈ ${whereGlow.meta.kernel.sigmaKm} km on Equal Earth; weight = unique citing works per institution. Lead uses the same colour scale as All (dimmer, not re-scaled). Source: OpenAlex affiliations (self-citations removed), as of ${whereGlow.meta.asOf}. Basemap: Natural Earth 1:110m (public domain).`}
                zh={`热力：等积地球投影上高斯核 σ ≈ ${whereGlow.meta.kernel.sigmaKm} km；权重为每机构的唯一施引文献数。Lead 与 All 共用色标（更淡、不重标定）。数据：OpenAlex 机构（已剔除自引），截至 ${whereGlow.meta.asOf}。底图：Natural Earth 1:110m（公有领域）。`}
              />
            ) : (
              <T
                en={`Honeycomb: equal-area hexbin ~${hexMeta?.flatToFlatKm ?? 300} km flat-to-flat on Equal Earth; cell weight = sum of unique citing works at institutions in that cell. Lead shares All’s colour scale. Source: OpenAlex affiliations (self-citations removed), as of ${whereGlow.meta.asOf}. Basemap: Natural Earth 1:110m (public domain).`}
                zh={`蜂巢：等积地球投影上等积六边形（对边约 ${hexMeta?.flatToFlatKm ?? 300} km）；格网权重为落入该格的机构唯一施引文献数之和。Lead 与 All 共用色标。数据：OpenAlex 机构（已剔除自引），截至 ${whereGlow.meta.asOf}。底图：Natural Earth 1:110m（公有领域）。`}
              />
            )}
          </span>
          <span className="w-full text-ink-faint">
            <T
              en={`Gaps: ${gaps.worksNoAffiliationAll} All / ${gaps.worksNoAffiliationLead} Lead citing works have no OpenAlex affiliation; ${gaps.institutionsMissingGeoAll} / ${gaps.institutionsMissingGeoLead} institutions lack coordinates (no density). Multi-campus systems plot at the OpenAlex HQ city. China coverage is a lower bound (CNKI under-count).`}
              zh={`缺口：全部视角 ${gaps.worksNoAffiliationAll} / Lead ${gaps.worksNoAffiliationLead} 篇施引无 OpenAlex 机构；${gaps.institutionsMissingGeoAll} / ${gaps.institutionsMissingGeoLead} 个机构无坐标（不进入密度图）。多校区系统落在 OpenAlex 总部城市。中国覆盖为下限（知网低估）。`}
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
