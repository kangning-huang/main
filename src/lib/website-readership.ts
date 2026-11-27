/**
 * Shared rules for the /reach website-readership snapshot.
 *
 * The page hides the section unless `parseWebsiteReadership` accepts the file.
 * The daily job in `scripts/fetch-website-readership.ts` must only write payloads
 * that pass this parser. Metric sentences live in `WebsiteReadership.tsx` and
 * must stay aligned with the filters in that script.
 */

export const READERSHIP_SCHEMA = "website-readership/v1";

export const BOT_FILTER_METHODS = [
  "bot-management",
  "verified-bot-and-user-agent",
  "verified-bot",
  "user-agent",
  "none",
] as const;

export type BotFilterMethod = (typeof BOT_FILTER_METHODS)[number];

export interface WebsiteReadership {
  schema: typeof READERSHIP_SCHEMA;
  status: "ok";
  host: "kangning-huang.com";
  window: { start: string; end: string };
  updatedAt: string;
  metrics: { visits: number; pageviews: number };
  audience: "recorded";
  botFilter: { method: BotFilterMethod };
  sampled: boolean;
  source: { provider: "cloudflare"; dataset: "httpRequestsAdaptiveGroups" };
}

export interface AnalyticsGroup {
  count: number;
  sum: { visits: number };
  avg: { sampleInterval: number | null };
  dimensions: {
    userAgentBrowser: string | null;
    verifiedBotCategory: string | null;
    botManagementDecision: string | null;
  };
}

export interface TimeWindow {
  /** Inclusive UTC midnight. */
  start: Date;
  /** Exclusive UTC midnight. */
  end: Date;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MAX_COUNT = 1_000_000_000;
const KEEP_DECISION = new Set(["likely_human", "not_computed"]);

/**
 * Browser names that are automated clients. A normal browser is left in.
 * Bots that impersonate Chrome or Safari are not caught here.
 */
const AUTOMATED_CLIENT =
  /bot|spider|crawler|slurp|scrapy|curl|wget|python-requests|python-urllib|go-http-client|headless|httpclient|okhttp|axios|node-fetch|undici|petalbot|bytespider|gptbot|claudebot|amazonbot|ahrefs|semrush|uptimerobot|pingdom|facebookexternalhit/i;

export function isAutomatedClient(browser: string | null | undefined): boolean {
  if (browser == null) return false;
  const name = browser.trim();
  if (!name) return false;
  return AUTOMATED_CLIENT.test(name);
}

export function isAutomatedDecision(decision: string | null | undefined): boolean {
  if (decision == null) return false;
  const value = decision.trim();
  if (!value) return false;
  return !KEEP_DECISION.has(value);
}

export function isVerifiedBot(category: string | null | undefined): boolean {
  return Boolean(category && category.trim());
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_COUNT;
}

function isMethod(value: unknown): value is BotFilterMethod {
  return typeof value === "string" && (BOT_FILTER_METHODS as readonly string[]).includes(value);
}

/** Returns the snapshot the page may show, or null when the section must stay hidden. */
export function parseWebsiteReadership(input: unknown): WebsiteReadership | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  if (raw.schema !== READERSHIP_SCHEMA || raw.status !== "ok") return null;
  if (raw.host !== "kangning-huang.com") return null;
  if (raw.audience !== "recorded") return null;
  if (typeof raw.sampled !== "boolean") return null;

  const window = raw.window;
  if (!window || typeof window !== "object") return null;
  const start = (window as Record<string, unknown>).start;
  const end = (window as Record<string, unknown>).end;
  if (!isIsoDate(start) || !isIsoDate(end) || start > end) return null;
  if (!isIsoDate(raw.updatedAt)) return null;

  const metrics = raw.metrics;
  if (!metrics || typeof metrics !== "object") return null;
  const visits = (metrics as Record<string, unknown>).visits;
  const pageviews = (metrics as Record<string, unknown>).pageviews;
  if (!isCount(visits) || !isCount(pageviews)) return null;
  if (visits === 0 && pageviews === 0) return null;

  const botFilter = raw.botFilter;
  if (!botFilter || typeof botFilter !== "object") return null;
  const method = (botFilter as Record<string, unknown>).method;
  if (!isMethod(method)) return null;

  const source = raw.source;
  if (!source || typeof source !== "object") return null;
  if ((source as Record<string, unknown>).provider !== "cloudflare") return null;
  if ((source as Record<string, unknown>).dataset !== "httpRequestsAdaptiveGroups") return null;

  return {
    schema: READERSHIP_SCHEMA,
    status: "ok",
    host: "kangning-huang.com",
    window: { start, end },
    updatedAt: raw.updatedAt,
    metrics: { visits, pageviews },
    audience: "recorded",
    botFilter: { method },
    sampled: raw.sampled,
    source: { provider: "cloudflare", dataset: "httpRequestsAdaptiveGroups" },
  };
}

export function utcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Rolling window of complete UTC days, ending at today's UTC midnight (exclusive).
 * `notOlderThanSeconds` is Cloudflare's retention age. Partial days outside that
 * age are dropped rather than filled in.
 */
export function windowBounds(
  now: Date,
  options?: { days?: number; notOlderThanSeconds?: number | null },
): TimeWindow | null {
  const days = options?.days ?? 30;
  const end = utcMidnight(now);
  let start = addDays(end, -days);
  const age = options?.notOlderThanSeconds;
  if (typeof age === "number" && Number.isFinite(age) && age > 0 && age < 1e9) {
    const oldest = new Date(now.getTime() - age * 1000);
    const oldestMidnight = utcMidnight(oldest);
    const firstComplete = oldest.getTime() === oldestMidnight.getTime() ? oldestMidnight : addDays(oldestMidnight, 1);
    if (firstComplete > start) start = firstComplete;
  }
  if (start >= end) return null;
  return { start, end };
}

export function chunkWindow(window: TimeWindow, maxDurationSeconds: number): TimeWindow[] {
  const widthMs = Math.max(1, Math.floor(maxDurationSeconds)) * 1000;
  const chunks: TimeWindow[] = [];
  let cursor = window.start.getTime();
  const endMs = window.end.getTime();
  while (cursor < endMs) {
    const next = Math.min(cursor + widthMs, endMs);
    chunks.push({ start: new Date(cursor), end: new Date(next) });
    cursor = next;
    if (chunks.length > 400) {
      throw new Error("refusing to split the window into more than 400 queries");
    }
  }
  return chunks;
}

function roundCount(value: number): number | null {
  if (!Number.isFinite(value) || value < 0 || value > MAX_COUNT) return null;
  return Math.round(value);
}

function chooseMethod(dimensions: Set<string>, classifiedShare: number): BotFilterMethod {
  if (dimensions.has("botManagementDecision") && classifiedShare >= 0.8) return "bot-management";
  if (dimensions.has("verifiedBotCategory") && dimensions.has("userAgentBrowser")) return "verified-bot-and-user-agent";
  if (dimensions.has("verifiedBotCategory")) return "verified-bot";
  if (dimensions.has("userAgentBrowser")) return "user-agent";
  return "none";
}

function rowExcluded(row: AnalyticsGroup, method: BotFilterMethod): boolean {
  if (method === "none") return false;
  if (method === "bot-management" && isAutomatedDecision(row.dimensions.botManagementDecision)) return true;
  if (method === "bot-management" || method === "verified-bot" || method === "verified-bot-and-user-agent") {
    if (isVerifiedBot(row.dimensions.verifiedBotCategory)) return true;
  }
  if (method === "bot-management" || method === "user-agent" || method === "verified-bot-and-user-agent") {
    if (isAutomatedClient(row.dimensions.userAgentBrowser)) return true;
  }
  return false;
}

export function aggregateGroups(
  rows: AnalyticsGroup[],
  options: { dimensions: string[]; truncated?: boolean },
):
  | { ok: true; visits: number; pageviews: number; sampled: boolean; method: BotFilterMethod }
  | { ok: false; reason: string } {
  if (options.truncated) return { ok: false, reason: "truncated" };

  const counted: { count: number; visits: number; row: AnalyticsGroup }[] = [];
  let sampled = false;
  let total = 0;
  let classified = 0;

  for (const row of rows) {
    const count = roundCount(row.count);
    const visitCount = roundCount(row.sum.visits);
    if (count == null || visitCount == null) return { ok: false, reason: "non-numeric" };
    const sample = row.avg.sampleInterval;
    if (sample == null || !Number.isFinite(sample) || sample !== 1) sampled = true;
    total += count;
    const decision = row.dimensions.botManagementDecision;
    if (decision && decision !== "not_computed") classified += count;
    counted.push({ count, visits: visitCount, row });
  }

  const method = chooseMethod(new Set(options.dimensions), total > 0 ? classified / total : 0);
  let pageviews = 0;
  let visits = 0;
  for (const item of counted) {
    if (rowExcluded(item.row, method)) continue;
    pageviews += item.count;
    visits += item.visits;
  }

  return { ok: true, visits, pageviews, sampled, method };
}

export function buildSnapshot(input: {
  visits: number;
  pageviews: number;
  sampled: boolean;
  method: BotFilterMethod;
  startDate: string;
  endDate: string;
  updatedAt: string;
}): WebsiteReadership | null {
  return parseWebsiteReadership({
    schema: READERSHIP_SCHEMA,
    status: "ok",
    host: "kangning-huang.com",
    window: { start: input.startDate, end: input.endDate },
    updatedAt: input.updatedAt,
    metrics: { visits: input.visits, pageviews: input.pageviews },
    audience: "recorded",
    botFilter: { method: input.method },
    sampled: input.sampled,
    source: { provider: "cloudflare", dataset: "httpRequestsAdaptiveGroups" },
  });
}
