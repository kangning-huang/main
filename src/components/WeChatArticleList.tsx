"use client";

import { useLanguage } from "@/lib/language-context";
import {
  getFeaturedWeChatArticles,
  getWeChatArticles,
  WECHAT_OA_NAME,
  type WeChatArticle,
} from "@/lib/wechat";

type Mode = "featured" | "all";

/**
 * Clickable WeChat Official Account article links — Chinese UI only.
 * Add entries in src/data/wechat-articles.json.
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
        {items.map((article) => (
          <li key={article.id}>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-baseline gap-2"
            >
              <span className="font-display text-[15px] leading-snug text-ink transition-colors group-hover:text-ember">
                {article.title}
              </span>
              <span className="shrink-0 text-xs text-ember opacity-70 group-hover:opacity-100">
                ↗
              </span>
            </a>
            {article.date && (
              <p className="mt-0.5 text-xs text-ink-faint">{article.date}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
