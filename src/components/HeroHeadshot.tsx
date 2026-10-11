"use client";

import { useLanguage } from "@/lib/language-context";

const ALT = {
  en: "Kangning Huang",
  zh: "黄康宁",
};

// Processed by scripts/headshot/process.py — see docs/headshot/TREATMENT.md.
// Plain circular avatar matching Google Scholar's round profile form.
const SIZE = { w: 160, h: 160 } as const;
const BASE = "/headshot/headshot-square";

export default function HeroHeadshot() {
  const { language } = useLanguage();
  const set = (ext: string) => `${BASE}-1x.${ext} 1x, ${BASE}-2x.${ext} 2x`;
  return (
    <figure className="shrink-0">
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
          className="block h-24 w-24 rounded-full object-cover shadow-[0_12px_28px_-12px_rgba(0,0,0,0.75)] ring-1 ring-paper/25 sm:h-28 sm:w-28 md:h-32 md:w-32"
        />
      </picture>
    </figure>
  );
}
