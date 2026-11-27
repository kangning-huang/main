"use client";

import snapshot from "@/data/website-readership.json";
import T from "@/components/T";
import { parseWebsiteReadership, type BotFilterMethod } from "@/lib/website-readership";

const COUNT = new Intl.NumberFormat("en-US");

const BOT_FILTER_COPY: Record<BotFilterMethod, { en: string; zh: string }> = {
  "bot-management": {
    en: "Requests Cloudflare classed as automated or as verified bots were excluded, as were common automated client names such as curl. Automated traffic that Cloudflare did not classify, including a bot that claims to be a normal browser, can remain.",
    zh: "已排除 Cloudflare 标为自动程序或已验证机器人的请求，以及 curl 等常见自动客户端。未被这样分类的自动流量仍可能计入，包括冒充普通浏览器的机器人。",
  },
  "verified-bot-and-user-agent": {
    en: "Cloudflare's verified-bot category, and browser names of common automated clients such as curl and known crawlers, were used to exclude requests. Bot scores were not applied. A bot that claims to be a normal browser can remain.",
    zh: "已排除 Cloudflare 标为已验证机器人的请求，以及浏览器名称属于常见自动客户端（例如 curl 和已知爬虫）的请求。这里没有使用机器人评分。冒充普通浏览器的机器人仍可能计入。",
  },
  "verified-bot": {
    en: "Cloudflare's verified-bot category was used to exclude known crawlers. Automated clients that are not verified bots, including curl, can remain.",
    zh: "已排除 Cloudflare 标为已验证机器人的请求。curl 等未被标为已验证机器人的自动客户端仍可能计入。",
  },
  "user-agent": {
    en: "Browser names of common automated clients were used to exclude requests. Cloudflare bot scores and verified-bot categories were not applied, so other automated traffic can remain.",
    zh: "已排除浏览器名称属于常见自动客户端的请求。没有使用 Cloudflare 的机器人评分或已验证机器人分类，因此其他自动流量仍可能计入。",
  },
  none: {
    en: "Bot filtering was not applied. These figures include automated traffic.",
    zh: "没有过滤机器人。数字包含自动流量。",
  },
};

export default function WebsiteReadership() {
  const data = parseWebsiteReadership(snapshot);
  if (!data) return null;

  const bot = BOT_FILTER_COPY[data.botFilter.method];
  const sampling = data.sampled
    ? {
        en: "Cloudflare estimated at least part of this snapshot from a sample.",
        zh: "本次结果里，至少有一部分是 Cloudflare 根据抽样作出的估计。",
      }
    : {
        en: "Cloudflare reported this snapshot with a sample interval of 1.",
        zh: "Cloudflare 报告本次结果的抽样间隔为 1。",
      };

  return (
    <section
      id="website-readership"
      aria-labelledby="website-readership-heading"
      className="scroll-mt-20 border-t border-rule-faint py-12 md:py-14"
      data-website-readership=""
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <h2 id="website-readership-heading" className="font-display text-2xl text-ink">
          <T en="Website readership" zh="网站访问" />
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted">
          <T
            en="Recorded traffic on this website. These counts do not measure research use."
            zh="本网站记录到的流量。这些数字不衡量研究被使用的情况。"
          />
        </p>

        <dl className="mt-6 grid max-w-xl grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-ink-muted">
              <T en="Visits" zh="访问（会话）" />
            </dt>
            <dd className="mt-1">
              <span className="block font-display text-3xl tabular-nums text-ink">{COUNT.format(data.metrics.visits)}</span>
              <span className="mt-1 block text-xs leading-relaxed text-ink-muted">
                <T en="sessions" zh="会话" />
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ink-muted">
              <T en="Pageviews" zh="页面浏览量" />
            </dt>
            <dd className="mt-1 font-display text-3xl tabular-nums text-ink">{COUNT.format(data.metrics.pageviews)}</dd>
          </div>
        </dl>

        <p className="mt-4 text-sm text-ink-muted">
          <T
            en={`${data.window.start} – ${data.window.end} UTC · Updated ${data.updatedAt}`}
            zh={`${data.window.start} 至 ${data.window.end}（UTC）· 更新于 ${data.updatedAt}`}
          />
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-muted">
          <T
            en={`Source: Cloudflare zone analytics for HTTP requests to kangning-huang.com and www.kangning-huang.com only. Other hostnames on the zone, including stats.kangning-huang.com, are excluded. Only end-user requests are counted. Pageviews are HTTP 200 responses whose content type Cloudflare classifies as HTML. Visits are sessions in that same set: a page view from another site, or a direct request with no referrer. One person can contribute many visits. ${bot.en} ${sampling.en} These figures are recorded traffic. Requests made while maintaining the site are included.`}
            zh={`来源：Cloudflare 的站点分析，只统计发往 kangning-huang.com 和 www.kangning-huang.com 的 HTTP 请求。同一域名下的其他主机名不计入，包括 stats.kangning-huang.com。只统计终端用户请求。页面浏览量是内容类型被 Cloudflare 标为 HTML、且状态码为 HTTP 200 的响应。访问（会话）是其中来自其他网站、或没有来源页面的直接访问。同一个人可以贡献多次访问。${bot.zh}${sampling.zh}这些是记录到的流量。维护网站时产生的请求也会计入。`}
          />
        </p>
      </div>
    </section>
  );
}
