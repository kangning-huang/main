"use client";

import { useLanguage } from "@/lib/language-context";

export type HeadshotVariant = "editorial" | "circle" | "inline";

const ALT = {
  en: "Kangning Huang speaking at a panel",
  zh: "黄康宁在论坛上发言",
};

// Processed by scripts/headshot/process.py — see docs/headshot/TREATMENT.md.
const ASSETS = {
  portrait: { w: 320, h: 400 },
  square: { w: 160, h: 160 },
} as const;

function Picture({
  crop,
  className,
}: {
  crop: keyof typeof ASSETS;
  className: string;
}) {
  const { language } = useLanguage();
  const { w, h } = ASSETS[crop];
  const base = `/headshot/headshot-${crop}`;
  const set = (ext: string) => `${base}-1x.${ext} 1x, ${base}-2x.${ext} 2x`;
  return (
    <picture>
      <source type="image/avif" srcSet={set("avif")} />
      <source type="image/webp" srcSet={set("webp")} />
      <img
        src={`${base}-1x.jpg`}
        srcSet={set("jpg")}
        width={w}
        height={h}
        alt={ALT[language]}
        fetchPriority="high"
        decoding="async"
        className={className}
      />
    </picture>
  );
}

export default function HeroHeadshot({ variant }: { variant: HeadshotVariant }) {
  if (variant === "editorial") {
    return (
      <figure className="relative w-36 shrink-0 sm:w-44 md:w-64 lg:w-80">
        {/* Offset teal frame behind the photo */}
        <div
          aria-hidden
          className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border border-teal/70 md:translate-x-4 md:translate-y-4"
        />
        <Picture
          crop="portrait"
          className="relative block aspect-[4/5] h-auto w-full rounded-2xl object-cover shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)] ring-1 ring-paper/15"
        />
      </figure>
    );
  }

  if (variant === "circle") {
    return (
      <div className="shrink-0 rounded-full bg-gradient-to-br from-teal to-teal/40 p-[3px] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.8)]">
        <Picture
          crop="square"
          className="block h-28 w-28 rounded-full border-[3px] border-ink object-cover md:h-36 md:w-36"
        />
      </div>
    );
  }

  return (
    <Picture
      crop="square"
      className="block h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-teal ring-offset-2 ring-offset-ink"
    />
  );
}
