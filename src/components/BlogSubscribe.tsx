"use client";

import { LINKS } from "@/lib/constants";
import { useLanguage } from "@/lib/language-context";
import WeChatOfficialQr from "./WeChatOfficialQr";
import WeChatArticleList from "./WeChatArticleList";

/**
 * Blog header CTA: Substack for EN; WeChat OA QR + article links for ZH
 * (Substack kept as a quiet secondary link).
 */
export default function BlogSubscribe() {
  const { language } = useLanguage();

  if (language === "zh") {
    return (
      <div className="flex w-full flex-col gap-5 sm:w-auto sm:max-w-sm sm:items-end">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
          <WeChatOfficialQr size="md" />
          <WeChatArticleList mode="all" className="min-w-0 flex-1 text-left" />
        </div>
        <a
          href={LINKS.substack}
          target="_blank"
          rel="noopener noreferrer"
          className="self-center text-xs text-ink-faint transition-colors hover:text-ember sm:self-end"
        >
          也可订阅 Substack ↗
        </a>
      </div>
    );
  }

  return (
    <a
      href={LINKS.substack}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-full bg-ember px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ember-dark"
    >
      Subscribe on Substack &#8599;
    </a>
  );
}
