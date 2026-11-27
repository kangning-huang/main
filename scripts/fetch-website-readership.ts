/**
 * Aggregate a rolling window of Cloudflare zone analytics into
 * src/data/website-readership.json.
 *
 * Secret (GitHub Actions): CLOUDFLARE_ANALYTICS_TOKEN
 *   Permission: Zone → Analytics → Read
 *   Zone resources: kangning-huang.com only
 * Optional override: CLOUDFLARE_ZONE_ID
 *
 * The token is read from the environment and is never written to the snapshot.
 * A missing token leaves the current file unchanged and exits 0.
 * A failed query leaves the current file unchanged and exits 1.
 * Both metrics at zero are not written.
 */

import { renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  addDays,
  aggregateGroups,
  buildSnapshot,
  chunkWindow,
  isoDate,
  windowBounds,
  type AnalyticsGroup,
} from "../src/lib/website-readership.ts";

const GRAPHQL_URL = "https://api.cloudflare.com/client/v4/graphql";
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || "8a8fb09fecadcecfc28c0dbcd2399582";
const OUT_PATH = join(dirname(fileURLToPath(import.meta.url)), "../src/data/website-readership.json");

const DIMENSIONS = ["userAgentBrowser", "verifiedBotCategory", "botManagementDecision"] as const;
type DimensionName = (typeof DIMENSIONS)[number];

const SETTINGS_QUERY = `query ReadershipSettings($zoneTag: string) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      settings {
        httpRequestsAdaptiveGroups {
          enabled
          maxDuration
          maxPageSize
          notOlderThan
          availableFields
        }
      }
    }
  }
}`;

interface ZoneSettings {
  maxDuration: number;
  maxPageSize: number;
  notOlderThan: number | null;
  fields: string[];
}

function redact(message: string, token: string): string {
  return token ? message.split(token).join("[redacted]") : message;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function graphql(token: string, query: string, variables: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await response.text();
  let body: { data?: unknown; errors?: { message?: string }[] };
  try {
    body = JSON.parse(text) as { data?: unknown; errors?: { message?: string }[] };
  } catch {
    throw new Error(`Cloudflare GraphQL returned HTTP ${response.status} with a non-JSON body`);
  }
  if (!response.ok || (body.errors && body.errors.length > 0)) {
    const detail = (body.errors ?? []).map((item) => item.message ?? "error").join("; ");
    throw new Error(`Cloudflare GraphQL HTTP ${response.status}: ${redact(detail || "request failed", token)}`);
  }
  return body.data;
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function readSettings(data: unknown): ZoneSettings {
  if (!data || typeof data !== "object") throw new Error("settings response was empty");
  const zones = (data as { viewer?: { zones?: unknown } }).viewer?.zones;
  if (!Array.isArray(zones) || zones.length !== 1) {
    throw new Error("settings response did not contain exactly one zone");
  }
  const node = (zones[0] as { settings?: { httpRequestsAdaptiveGroups?: Record<string, unknown> } }).settings
    ?.httpRequestsAdaptiveGroups;
  if (!node || node.enabled === false) {
    throw new Error("httpRequestsAdaptiveGroups is not enabled for this zone");
  }
  const fields = Array.isArray(node.availableFields) ? node.availableFields.map((field) => String(field)) : [];
  return {
    maxDuration: numberOr(node.maxDuration, 86_400),
    maxPageSize: Math.min(1000, Math.floor(numberOr(node.maxPageSize, 1000))),
    notOlderThan: typeof node.notOlderThan === "number" ? node.notOlderThan : null,
    fields,
  };
}

function fieldAllowed(fields: string[], name: string): boolean {
  if (fields.length === 0) return true;
  const needle = name.toLowerCase();
  return fields.some((field) => field.toLowerCase().includes(needle));
}

function groupsQuery(dimensions: readonly DimensionName[], limit: number): string {
  const dimensionBlock = dimensions.length > 0 ? `dimensions { ${dimensions.join(" ")} }` : "";
  return `query Readership($zoneTag: string, $start: Time, $end: Time) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        groups: httpRequestsAdaptiveGroups(
          limit: ${limit}
          filter: {
            datetime_geq: $start
            datetime_lt: $end
            requestSource: "eyeball"
            clientRequestHTTPHost_in: ["kangning-huang.com", "www.kangning-huang.com"]
            edgeResponseContentTypeName: "html"
            edgeResponseStatus: 200
          }
        ) {
          count
          avg { sampleInterval }
          sum { visits }
          ${dimensionBlock}
        }
      }
    }
  }`;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readGroups(data: unknown, dimensions: readonly DimensionName[]): AnalyticsGroup[] {
  if (!data || typeof data !== "object") throw new Error("analytics response was empty");
  const zones = (data as { viewer?: { zones?: unknown } }).viewer?.zones;
  if (!Array.isArray(zones) || zones.length !== 1) {
    throw new Error("analytics response did not contain exactly one zone");
  }
  const groups = (zones[0] as { groups?: unknown }).groups;
  if (!Array.isArray(groups)) throw new Error("analytics response did not contain groups");
  return groups.map((group) => {
    if (!group || typeof group !== "object") throw new Error("analytics group was empty");
    const row = group as Record<string, unknown>;
    const count = row.count;
    const visits = (row.sum as { visits?: unknown } | undefined)?.visits;
    if (typeof count !== "number" || typeof visits !== "number") {
      throw new Error("analytics group was missing count or visits");
    }
    const sample = (row.avg as { sampleInterval?: unknown } | undefined)?.sampleInterval;
    const dims = (row.dimensions ?? {}) as Record<string, unknown>;
    return {
      count,
      sum: { visits },
      avg: { sampleInterval: typeof sample === "number" ? sample : null },
      dimensions: {
        userAgentBrowser: dimensions.includes("userAgentBrowser") ? stringOrNull(dims.userAgentBrowser) : null,
        verifiedBotCategory: dimensions.includes("verifiedBotCategory") ? stringOrNull(dims.verifiedBotCategory) : null,
        botManagementDecision: dimensions.includes("botManagementDecision") ? stringOrNull(dims.botManagementDecision) : null,
      },
    };
  });
}

function rejectedDimension(message: string, dimensions: readonly DimensionName[]): DimensionName | null {
  const lower = message.toLowerCase();
  if (/max duration|not older|time range|too old|lookback/.test(lower)) return null;
  return dimensions.find((dimension) => lower.includes(dimension.toLowerCase())) ?? null;
}

async function fetchGroups(
  token: string,
  start: Date,
  end: Date,
  dimensions: readonly DimensionName[],
  limit: number,
): Promise<{ rows: AnalyticsGroup[]; dimensions: DimensionName[] }> {
  let active: DimensionName[] = [...dimensions];
  for (let attempt = 0; attempt <= DIMENSIONS.length; attempt += 1) {
    try {
      const data = await graphql(token, groupsQuery(active, limit), {
        zoneTag: ZONE_ID,
        start: start.toISOString(),
        end: end.toISOString(),
      });
      return { rows: readGroups(data, active), dimensions: active };
    } catch (error) {
      const message = errorMessage(error);
      const dropped = rejectedDimension(message, active);
      if (!dropped) throw error;
      active = active.filter((dimension) => dimension !== dropped);
      console.warn(`Cloudflare rejected dimension ${dropped}. Retrying without it.`);
    }
  }
  throw new Error("Cloudflare rejected every bot-filter dimension");
}

function writeSnapshot(snapshot: unknown) {
  const tmp = `${OUT_PATH}.tmp`;
  try {
    writeFileSync(tmp, `${JSON.stringify(snapshot, null, 2)}\n`);
    renameSync(tmp, OUT_PATH);
  } catch (error) {
    try {
      unlinkSync(tmp);
    } catch {
      // The temp file may not exist.
    }
    throw error;
  }
}

async function main() {
  const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN?.trim() ?? "";
  if (!token) {
    console.log("CLOUDFLARE_ANALYTICS_TOKEN is not set. Leaving the current snapshot unchanged.");
    return;
  }
  if (!ZONE_ID) {
    throw new Error("CLOUDFLARE_ZONE_ID is empty");
  }

  let settings: ZoneSettings = {
    maxDuration: 86_400,
    maxPageSize: 1000,
    notOlderThan: null,
    fields: [],
  };
  try {
    settings = readSettings(await graphql(token, SETTINGS_QUERY, { zoneTag: ZONE_ID }));
  } catch (error) {
    console.warn(`Settings query failed (${errorMessage(error)}). Using a 1-day query width and a 30-day lookback.`);
  }

  const bounds = windowBounds(new Date(), { days: 30, notOlderThanSeconds: settings.notOlderThan });
  if (!bounds) {
    throw new Error("no complete UTC day is available inside the retention window");
  }

  const chunks = chunkWindow(bounds, settings.maxDuration);
  const requested = DIMENSIONS.filter((dimension) => fieldAllowed(settings.fields, dimension));
  console.log(
    `Window ${isoDate(bounds.start)} to ${isoDate(addDays(bounds.end, -1))} UTC, ${chunks.length} queries, dimensions: ${requested.join(", ") || "(none)"}.`,
  );
  const rows: AnalyticsGroup[] = [];
  let dimensions = [...requested];

  for (const chunk of chunks) {
    const result = await fetchGroups(token, chunk.start, chunk.end, dimensions, settings.maxPageSize);
    dimensions = result.dimensions;
    if (result.rows.length >= settings.maxPageSize) {
      throw new Error("a query hit the group limit, so the total would be incomplete");
    }
    rows.push(...result.rows);
  }

  const aggregate = aggregateGroups(rows, { dimensions });
  if (!aggregate.ok) {
    throw new Error(`refusing to publish an incomplete aggregate (${aggregate.reason})`);
  }

  const snapshot = buildSnapshot({
    visits: aggregate.visits,
    pageviews: aggregate.pageviews,
    sampled: aggregate.sampled,
    method: aggregate.method,
    startDate: isoDate(bounds.start),
    endDate: isoDate(addDays(bounds.end, -1)),
    updatedAt: isoDate(new Date()),
  });
  if (!snapshot) {
    console.warn("No positive recorded traffic in this window. Leaving the current snapshot unchanged.");
    return;
  }

  writeSnapshot(snapshot);
  console.log(
    `Wrote ${snapshot.window.start} to ${snapshot.window.end}: ${snapshot.metrics.visits} visits, ${snapshot.metrics.pageviews} pageviews (${snapshot.botFilter.method}).`,
  );
}

main().catch((error: unknown) => {
  console.error(errorMessage(error));
  process.exitCode = 1;
});
