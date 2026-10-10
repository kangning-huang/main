"use client";

import { useLanguage } from "@/lib/language-context";

const ALT = {
  en: "Kangning Huang speaking at a panel",
  zh: "黄康宁在论坛上发言",
};

// Processed by scripts/headshot/process.py — see docs/headshot/TREATMENT.md.
const SIZE = { w: 160, h: 160 } as const;
const BASE = "/headshot/headshot-square";

export default function HeroHeadshot() {
  const { language } = useLanguage();
  const set = (ext: string) => `${BASE}-1x.${ext} 1x, ${BASE}-2x.${ext} 2x`;
  return (
    <div className="shrink-0 rounded-full bg-gradient-to-br from-teal to-teal/40 p-[3px] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.8)]">
      <picture>
        <source type="image/avif" srcSet={set("avif")} />
        <source type="image/webp" srcSet={set("webp")} />
        <img
          src={`${BASE}-1x.jpg`}
          srcSet={set("jpg")}
          width={SIZE.w}
          height={SIZE.h}
          alt={ALT[language]}
          fetchPriority="high"
          decoding="async"
          className="block h-28 w-28 rounded-full border-[3px] border-ink object-cover md:h-36 md:w-36"
        />
      </picture>
    </div>
  );
}
