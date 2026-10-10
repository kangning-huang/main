"use client";

import { useLanguage } from "@/lib/language-context";

const ALT = {
  en: "Kangning Huang speaking at a panel",
  zh: "黄康宁在论坛上发言",
};

// Processed by scripts/headshot/process.py — see docs/headshot/TREATMENT.md.
const SIZE = { w: 320, h: 400 } as const;
const BASE = "/headshot/headshot-portrait";

export default function HeroHeadshot() {
  const { language } = useLanguage();
  const set = (ext: string) => `${BASE}-1x.${ext} 1x, ${BASE}-2x.${ext} 2x`;
  return (
    <figure className="relative w-36 shrink-0 sm:w-44 md:w-64 lg:w-80">
      {/* Offset teal frame behind the photo */}
      <div
        aria-hidden
        className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border border-teal/70 md:translate-x-4 md:translate-y-4"
      />
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
          className="relative block aspect-[4/5] h-auto w-full rounded-2xl object-cover shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)] ring-1 ring-paper/15"
        />
      </picture>
    </figure>
  );
}
