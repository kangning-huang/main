import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  BOT_FILTER_METHODS,
  addDays,
  aggregateGroups,
  buildSnapshot,
  chunkWindow,
  isAutomatedClient,
  isoDate,
  parseWebsiteReadership,
  windowBounds,
  type AnalyticsGroup,
} from "../src/lib/website-readership.ts";

function group(partial: Partial<AnalyticsGroup> & { count: number; visits: number }): AnalyticsGroup {
  return {
    count: partial.count,
    sum: { visits: partial.visits },
    avg: { sampleInterval: partial.avg?.sampleInterval ?? 1 },
    dimensions: {
      userAgentBrowser: partial.dimensions?.userAgentBrowser ?? "Chrome",
      verifiedBotCategory: partial.dimensions?.verifiedBotCategory ?? "",
      botManagementDecision: partial.dimensions?.botManagementDecision ?? "",
    },
  };
}

const baseSnapshot = {
  schema: "website-readership/v1",
  status: "ok",
  host: "kangning-huang.com",
  window: { start: "2026-10-28", end: "2026-11-26" },
  updatedAt: "2026-11-27",
  metrics: { visits: 12, pageviews: 40 },
  audience: "recorded",
  botFilter: { method: "verified-bot-and-user-agent" },
  sampled: false,
  source: { provider: "cloudflare", dataset: "httpRequestsAdaptiveGroups" },
};

test("the committed snapshot stays hidden until a job succeeds", () => {
  const raw = JSON.parse(readFileSync(new URL("../src/data/website-readership.json", import.meta.url), "utf8"));
  assert.equal(parseWebsiteReadership(raw), null);
});

test("a valid recorded snapshot is shown", () => {
  const parsed = parseWebsiteReadership(baseSnapshot);
  assert.equal(parsed?.metrics.visits, 12);
  assert.equal(parsed?.metrics.pageviews, 40);
});

test("zeros, people-counts, and incomplete payloads stay hidden", () => {
  assert.equal(parseWebsiteReadership({ ...baseSnapshot, metrics: { visits: 0, pageviews: 0 } }), null);
  assert.equal(parseWebsiteReadership({ ...baseSnapshot, audience: "likely-human" }), null);
  assert.equal(parseWebsiteReadership({ ...baseSnapshot, host: "stats.kangning-huang.com" }), null);
  assert.equal(parseWebsiteReadership({ ...baseSnapshot, metrics: { visits: 1.5, pageviews: 2 } }), null);
  assert.equal(parseWebsiteReadership({ ...baseSnapshot, window: { start: "2026-11-27", end: "2026-11-26" } }), null);
  assert.equal(parseWebsiteReadership({ ...baseSnapshot, botFilter: { method: "unique-visitors" } }), null);
  assert.equal(parseWebsiteReadership({ schema: "website-readership/v1", status: "unavailable" }), null);
});

test("one zero metric can be real when the other is positive", () => {
  const parsed = parseWebsiteReadership({ ...baseSnapshot, metrics: { visits: 0, pageviews: 3 } });
  assert.equal(parsed?.metrics.visits, 0);
  assert.equal(parsed?.metrics.pageviews, 3);
});

test("browser-name filter keeps normal browsers and drops known clients", () => {
  assert.equal(isAutomatedClient("Chrome"), false);
  assert.equal(isAutomatedClient("Mobile Safari"), false);
  assert.equal(isAutomatedClient("Firefox"), false);
  assert.equal(isAutomatedClient(""), false);
  assert.equal(isAutomatedClient(null), false);
  assert.equal(isAutomatedClient("curl/8.7.1"), true);
  assert.equal(isAutomatedClient("Googlebot"), true);
  assert.equal(isAutomatedClient("BingBot"), true);
  assert.equal(isAutomatedClient("HeadlessChrome"), true);
});

test("aggregation keeps human browsers, drops bots, and does not scale the sample", () => {
  const result = aggregateGroups(
    [
      group({ count: 10, visits: 4, avg: { sampleInterval: 10 } }),
      group({ count: 5, visits: 5, dimensions: { userAgentBrowser: "curl", verifiedBotCategory: "", botManagementDecision: "" } }),
      group({
        count: 7,
        visits: 7,
        dimensions: { userAgentBrowser: "Chrome", verifiedBotCategory: "Search Engine Crawler", botManagementDecision: "" },
      }),
    ],
    { dimensions: ["userAgentBrowser", "verifiedBotCategory"] },
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.pageviews, 10);
  assert.equal(result.visits, 4);
  assert.equal(result.sampled, true);
  assert.equal(result.method, "verified-bot-and-user-agent");
});

test("bot decisions are used only when most requests were classified", () => {
  const rows = [
    group({ count: 80, visits: 20, dimensions: { userAgentBrowser: "Chrome", verifiedBotCategory: "", botManagementDecision: "likely_human" } }),
    group({ count: 20, visits: 5, dimensions: { userAgentBrowser: "Chrome", verifiedBotCategory: "", botManagementDecision: "automated" } }),
  ];
  const strong = aggregateGroups(rows, { dimensions: ["botManagementDecision", "userAgentBrowser", "verifiedBotCategory"] });
  assert.equal(strong.ok && strong.method, "bot-management");
  assert.equal(strong.ok && strong.pageviews, 80);

  const weak = aggregateGroups(
    [
      group({ count: 10, visits: 2, dimensions: { userAgentBrowser: "Chrome", verifiedBotCategory: "", botManagementDecision: "automated" } }),
      group({ count: 90, visits: 30, dimensions: { userAgentBrowser: "Chrome", verifiedBotCategory: "", botManagementDecision: "not_computed" } }),
    ],
    { dimensions: ["botManagementDecision", "userAgentBrowser", "verifiedBotCategory"] },
  );
  assert.equal(weak.ok && weak.method, "verified-bot-and-user-agent");
  assert.equal(weak.ok && weak.pageviews, 100);
});

test("a truncated query is not published", () => {
  const result = aggregateGroups([group({ count: 1, visits: 1 })], { dimensions: ["userAgentBrowser"], truncated: true });
  assert.deepEqual(result, { ok: false, reason: "truncated" });
});

test("rolling window is 30 complete UTC days and can shrink to retention", () => {
  const now = new Date("2026-11-27T04:15:00Z");
  const full = windowBounds(now, { days: 30 });
  assert.ok(full);
  assert.equal(isoDate(full.start), "2026-10-28");
  assert.equal(isoDate(full.end), "2026-11-27");
  assert.equal(isoDate(addDays(full.end, -1)), "2026-11-26");
  assert.equal(chunkWindow(full, 86_400).length, 30);

  const short = windowBounds(now, { days: 30, notOlderThanSeconds: 5 * 86_400 });
  assert.ok(short);
  assert.equal(isoDate(short.start), "2026-11-23");
});

test("buildSnapshot refuses zeros and accepts a rounded positive total", () => {
  assert.equal(
    buildSnapshot({
      visits: 0,
      pageviews: 0,
      sampled: false,
      method: "none",
      startDate: "2026-11-26",
      endDate: "2026-11-26",
      updatedAt: "2026-11-27",
    }),
    null,
  );
  const snapshot = buildSnapshot({
    visits: 3,
    pageviews: 9,
    sampled: false,
    method: "user-agent",
    startDate: "2026-10-28",
    endDate: "2026-11-26",
    updatedAt: "2026-11-27",
  });
  assert.equal(snapshot?.audience, "recorded");
  assert.equal(snapshot?.metrics.pageviews, 9);
});

test("the page wires the section only on /reach, with copy for every filter", () => {
  const reach = readFileSync(new URL("../src/app/reach/page.tsx", import.meta.url), "utf8");
  const home = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
  const view = readFileSync(new URL("../src/components/reach/WebsiteReadership.tsx", import.meta.url), "utf8");
  assert.match(reach, /WebsiteReadership/);
  assert.doesNotMatch(home, /WebsiteReadership|website-readership/);
  for (const method of BOT_FILTER_METHODS) {
    assert.match(view, new RegExp(method.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(view, /sessions/);
  assert.match(view, /会话/);
  assert.doesNotMatch(view, /unique visitors|独立访客|人数统计/);
});
