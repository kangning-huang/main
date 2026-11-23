"use client";

import Link from "next/link";
import { LINKS } from "@/lib/constants";
import { useLanguage } from "@/lib/language-context";
import WeChatOfficialQr from "./WeChatOfficialQr";
import WeChatArticleList from "./WeChatArticleList";

/**
 * Homepage Writing section subscribe strip.
 * EN → Substack; ZH → WeChat OA QR + article links (+ quiet Substack).
 */
export default function HomeWritingSubscribe({
  mode = "with-posts",
}: {
  /** with-posts: compact strip under the post list; empty: lead CTA when no posts */
  mode?: "with-posts" | "empty";
}) {
  const { language } = useLanguage();

  if (language === "zh") {
    if (mode === "empty") {
      return (
        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
          <div className="min-w-0 flex-1">
            <p className="text-ink-muted">
              我在微信公众号「反直觉手记」分享城市与气候研究中的问题和发现，也在 Substack 上发表文章。
            </p>
            <WeChatArticleList mode="featured" className="mt-4" />
            <Link
              href="/zh/blog#wechat"
              className="mt-4 inline-flex items-center text-sm font-medium text-ember transition-colors hover:text-ember-dark"
            >
              到博客页扫码关注 →
            </Link>
            <a
              href={LINKS.substack}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-xs text-ink-faint transition-colors hover:text-ember"
            >
              也可在 Substack 订阅英文文章 ↗
            </a>
          </div>
          <WeChatOfficialQr size="md" className="shrink-0 self-start" />
        </div>
      );
    }

    return (
      <div className="mt-8 flex flex-col gap-5 rounded-xl border border-rule bg-paper p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-muted">
            我也在微信公众号「反直觉手记」写城市与气候。
          </p>
          <WeChatArticleList mode="featured" className="mt-3" />
          <Link
            href="/zh/blog#wechat"
            className="mt-3 inline-flex text-sm font-medium text-ember transition-colors hover:text-ember-dark"
          >
            扫码关注公众号 →
          </Link>
        </div>
        <WeChatOfficialQr size="sm" className="shrink-0 self-start" />
      </div>
    );
  }

  // English
  if (mode === "empty") {
    return (
      <>
        <p className="mt-6 text-ink-muted">
          I write about cities and climate on Substack.
        </p>
        <a
          href={LINKS.substack}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center rounded-full bg-ember px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ember-dark"
        >
          Read on Substack →
        </a>
      </>
    );
  }

  return (
    <div className="mt-8">
      <a
        href={LINKS.substack}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-sm font-medium text-ember transition-colors hover:text-ember-dark"
      >
        Subscribe on Substack →
      </a>
    </div>
  );
}
