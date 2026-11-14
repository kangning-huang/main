"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import {
  getFeaturedWeChatArticles,
  getWeChatArticles,
  isInternalArticleUrl,
  WECHAT_OA_NAME,
  type WeChatArticle,
} from "@/lib/wechat";

type Mode = "featured" | "all";

/**
 * Clickable article links for the Chinese UI.
 * First-party posts use their /zh/blog/<slug> canonical path.
 */
export default function WeChatArticleList({
  mode = "featured",
  className = "",
  heading = true,
}: {
  mode?: Mode;
  className?: string;
  heading?: boolean;
}) {
  const { language } = useLanguage();
  if (language !== "zh") return null;

  const items: WeChatArticle[] =
    mode === "all" ? getWeChatArticles() : getFeaturedWeChatArticles();
  if (items.length === 0) return null;

  return (
    <div className={className}>
      {heading && (
        <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
          公众号精选 · {WECHAT_OA_NAME}
        </p>
      )}
      <ul className={heading ? "mt-2 space-y-2" : "space-y-2"}>
        {items.map((article) => {
          const internal = isInternalArticleUrl(article.url);
          const titleClass =
            "font-display text-[15px] leading-snug text-ink transition-colors group-hover:text-ember";
          const arrow = (
            <span className="shrink-0 text-xs text-ember opacity-70 group-hover:opacity-100">
              {internal ? "→" : "↗"}
            </span>
          );
          return (
            <li key={article.id}>
              {internal ? (
                <Link href={article.url} className="group flex items-baseline gap-2">
                  <span className={titleClass}>{article.title}</span>
                  {arrow}
                </Link>
              ) : (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-baseline gap-2"
                >
                  <span className={titleClass}>{article.title}</span>
                  {arrow}
                </a>
              )}
              {article.date && (
                <p className="mt-0.5 text-xs text-ink-faint">{article.date}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
