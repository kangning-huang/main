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
};

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
