"use client";

import { useMemo, useState } from "react";
import type { AtlasPoint } from "@/lib/atlas";
import { formatPop } from "@/lib/atlas";
import { useLanguage } from "@/lib/language-context";

type Props = {
  points: AtlasPoint[];
  onSelect: (id: number) => void;
};

export default function CitySearch({ points, onSelect }: Props) {
  const { language } = useLanguage();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    return points
      .filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.iso.toLowerCase().includes(needle) ||
          p.slug.includes(needle),
      )
      .sort((a, b) => b.pop15 - a.pop15)
      .slice(0, 8);
  }, [q, points]);

  return (
    <div className="relative w-full max-w-md">
      <label htmlFor="atlas-search" className="sr-only">
        {language === "zh" ? "搜索城市" : "Search cities"}
      </label>
      <input
        id="atlas-search"
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // delay so click on result registers
          setTimeout(() => setOpen(false), 150);
        }}
        placeholder={language === "zh" ? "搜索城市，例如 Lagos…" : "Search a city, e.g. Lagos…"}
        className="w-full rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ember focus:outline-none"
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-rule bg-paper shadow-lg"
        >
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-ember-light"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(p.id);
                  setQ(p.name);
                  setOpen(false);
                }}
              >
                <span>
                  <span className="font-medium text-ink">{p.name}</span>
                  <span className="ml-2 text-ink-faint">{p.iso}</span>
                </span>
                <span className="text-xs text-ink-muted">{formatPop(p.pop15)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
