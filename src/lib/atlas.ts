/** Types and helpers for the Atlas of Urban Futures (v1). */

export type CoverageCode = 0 | 1 | 2;

export type AtlasPoint = {
  id: number;
  name: string;
  iso: string;
  lat: number;
  lon: number;
  pop15: number;
  coverage: CoverageCode;
  massPerCapT: number | null;
  slug: string;
  /** Population-weighted daytime SUHI-extreme trend, °C per decade (Sci Rep 2025). */
  heatDayP: number | null;
  /** 1 if covered by the informal-settlement cooling study (npj 2026). */
  cool: 0 | 1;
  /** 1 if covered by the height-aware flood study (Sci Rep 2026). */
  flood: 0 | 1;
};

export type LayerKey = "mass" | "heat" | "cooling" | "flood";

/** How many mapped studies have a result for this city. */
export function paperCount(p: AtlasPoint): number {
  let n = 0;
  if (p.coverage !== 0 && p.massPerCapT != null) n += 1;
  if (p.heatDayP != null) n += 1;
  if (p.cool === 1) n += 1;
  if (p.flood === 1) n += 1;
  return n;
}

export function hasLayer(p: AtlasPoint, layer: LayerKey): boolean {
  if (layer === "mass") return p.coverage !== 0 && p.massPerCapT != null;
  if (layer === "heat") return p.heatDayP != null;
  if (layer === "cooling") return p.cool === 1;
  return p.flood === 1;
}

export type AtlasPointsFile = {
  version: number;
  cityKey: string;
  sources: {
    ucdb: string;
    cityMass: {
      repo: string;
      commit: string;
      globalCitySlope: {
        scope: string;
        slope: number;
        slope_lo: number;
        slope_hi: number;
        n: number;
        r2: number;
      };
    };
  };
  fields: string[];
  coverageCodes: Record<string, string>;
  counts: {
    mapped: number;
    massMatch: { exact: number; flagged: number; unmatched: number };
    pages: number;
    layers?: Record<string, number>;
  };
  rows: Array<Array<string | number | null>>;
};

export type CityMassLayer = {
  quality: "exact" | "flagged" | "unmatched";
  match: {
    sourceName: string;
    distanceKm: number;
    nameMatch: boolean;
    reason?: string;
  };
  pop: number;
  massT: number;
  massPerCapT: number;
  vsScaling: number;
  neighborhood: {
    slope: number;
    lo: number;
    hi: number;
    n: number;
    r2: number;
  };
};

export type CityHeatLayer = {
  quality: "exact" | "flagged";
  fua: { id: number; name: string; centres: number };
  rank: number;
  climate: string;
  pop2020: number;
  /** Trends in °C per decade, 2003–2020. A = area-based, P = population-weighted. */
  dayA: number;
  dayP: number;
  nightA: number;
  nightP: number;
};

export type CityCoolingLayer = {
  quality: "exact";
  effectK: number;
  ciLo: number;
  ciHi: number;
  pooledK: number;
};

export type CityFloodLayer = {
  quality: "exact" | "flagged";
  fua: { id: number; name: string; centres: number };
  /** Height-aware building damage share without protection (% of footprints). */
  dmgPct: number;
  /** Same with FLOPROS protection applied (%); omitted when CSV cell empty. */
  dmgProtPct?: number;
  /** FLOPROS protection standard, return period in years. */
  protYears?: number;
  /** Mean building height in the FUA (m). */
  heightM?: number;
};

export type CityDetail = {
  id: number;
  slug: string;
  name: string;
  country: string;
  iso: string;
  region: string;
  lat: number;
  lon: number;
  ucdb: { pop15: number; areaKm2: number };
  layers: {
    mass?: CityMassLayer;
    heat?: CityHeatLayer;
    cooling?: CityCoolingLayer;
    flood?: CityFloodLayer;
  };
};

export const POINT_FIELDS = [
  "id",
  "name",
  "iso",
  "lat",
  "lon",
  "pop15",
  "coverage",
  "massPerCapT",
  "slug",
] as const;

export function parsePoints(file: AtlasPointsFile): AtlasPoint[] {
  return file.rows.map((row) => {
    const obj: Record<string, string | number | null> = {};
    file.fields.forEach((f, i) => {
      obj[f] = row[i] ?? null;
    });
    return {
      id: Number(obj.id),
      name: String(obj.name),
      iso: String(obj.iso),
      lat: Number(obj.lat),
      lon: Number(obj.lon),
      pop15: Number(obj.pop15),
      coverage: Number(obj.coverage) as CoverageCode,
      massPerCapT:
        obj.massPerCapT === null || obj.massPerCapT === undefined
          ? null
          : Number(obj.massPerCapT),
      slug: String(obj.slug),
      heatDayP:
        obj.heatDayP === null || obj.heatDayP === undefined ? null : Number(obj.heatDayP),
      cool: Number(obj.cool ?? 0) === 1 ? 1 : 0,
      flood: Number(obj.flood ?? 0) === 1 ? 1 : 0,
    };
  });
}

/** Nature Cities paper is in press — link the publications entry, never the DOI. */
export const MASS_PAPER = {
  title: "Nested economies of scale in global city mass",
  venue: "Nature Cities (in press)",
  year: 2026,
  publicationsHref: "/publications#nested-economies-of-scale-in-global-city-mass",
  appUrl: "https://city-mass.nested-complexity.net",
} as const;

export const HEAT_PAPER = {
  title: "Declining urban density attenuates rising population exposure to surface heat extremes",
  venue: "Scientific Reports",
  year: 2025,
  doiUrl: "https://doi.org/10.1038/s41598-025-96045-z",
} as const;

export const COOLING_PAPER = {
  title: "Unveiling the causal link between informal settlement demolition and urban cooling",
  venue: "npj Environmental Social Sciences",
  year: 2026,
  doiUrl: "https://doi.org/10.1038/s44432-026-00009-1",
  appUrl: "https://cooling.kangning-huang.com/",
} as const;

export const FLOOD_PAPER = {
  title:
    "Height-Aware and Protection-Informed Flood Assessment Shifts Global Urban Risk Distribution",
  venue: "Scientific Reports",
  year: 2026,
  doiUrl: "https://doi.org/10.1038/s41598-026-70981-w",
  appUrl: "https://flood.kangning-huang.com/",
} as const;

export const GLOBAL_SLOPE = 0.8995; // from points.json sources.cityMass.globalCitySlope

/** Format population compactly. */
export function formatPop(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}k`;
  return String(Math.round(n));
}

export function formatMassT(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} Gt`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} Mt`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)} kt`;
  return `${Math.round(n)} t`;
}
