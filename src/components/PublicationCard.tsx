"use client";

import { useState, useRef, useEffect } from "react";
import type { Publication } from "@/lib/constants";
import T from "@/components/T";

export default function PublicationCard({ pub }: { pub: Publication }) {
  const hasExtra = (pub.highlights && pub.highlights.length > 0) || (pub.keywords && pub.keywords.length > 0);
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (bodyRef.current) {
      setHeight(bodyRef.current.scrollHeight);
    }
  }, [open]);

  return (
    <article className="pub-item group py-4">
      <div
        className={hasExtra ? "cursor-pointer" : undefined}
        onClick={hasExtra ? () => setOpen((o) => !o) : undefined}
        role={hasExtra ? "button" : undefined}
        aria-expanded={hasExtra ? open : undefined}
        tabIndex={hasExtra ? 0 : undefined}
        onKeyDown={
          hasExtra
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen((o) => !o);
                }
              }
            : undefined
        }
      >
        <h3 className="text-[15px] font-medium leading-snug text-ink">
          {hasExtra && (
            <span
              className={`mr-1.5 inline-block text-xs text-ink-faint transition-transform duration-200 ${
                open ? "rotate-90" : ""
              }`}
              aria-hidden="true"
            >
              ▶
            </span>
          )}
          {pub.doi ? (
            <a
              href={`https://doi.org/${pub.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors group-hover:text-ember"
              onClick={(e) => e.stopPropagation()}
            >
              {pub.title}
            </a>
          ) : pub.url ? (
            <a
              href={pub.url}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors group-hover:text-ember"
              onClick={(e) => e.stopPropagation()}
            >
              {pub.title}
            </a>
          ) : (
            pub.title
          )}
        </h3>
        <p className="mt-1 text-sm text-ink-faint">{pub.authors}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          {pub.venue && (
            <span className="font-medium text-ember">{pub.venue}</span>
          )}
          {pub.citationCount > 0 && (
            <span className="rounded-full bg-paper-deep px-2.5 py-0.5 text-xs text-ink-muted">
              {pub.citationCount} <T en="citations" zh="引用" />
            </span>
          )}
          {pub.doi && (
            <a
              href={`https://doi.org/${pub.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline text-xs text-ink-faint hover:text-ember"
              onClick={(e) => e.stopPropagation()}
            >
              DOI &#8599;
            </a>
          )}
          {pub.preprint && (
            <a
              href={pub.preprint}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline text-xs text-ink-faint hover:text-ember"
              onClick={(e) => e.stopPropagation()}
            >
              <T en="Preprint" zh="预印本" /> &#8599;
            </a>
          )}
          {pub.webUrl && (
            <a
              href={pub.webUrl}
              target={pub.webUrl.startsWith("/") ? undefined : "_blank"}
              rel={
                pub.webUrl.startsWith("/") ? undefined : "noopener noreferrer"
              }
              className="link-underline text-xs text-ink-faint hover:text-ember"
              onClick={(e) => e.stopPropagation()}
            >
              <T en="Web App" zh="网页应用" /> &#8599;
            </a>
          )}
        </div>
      </div>

      {/* Expandable section */}
      {hasExtra && (
        <div
          className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
          style={{ maxHeight: open ? `${height}px` : "0px" }}
        >
          <div ref={bodyRef} className="pt-3 pb-1 pl-2">
            {pub.highlights && pub.highlights.length > 0 && (
              <ul className="space-y-1.5 text-sm leading-relaxed text-ink-muted">
                {pub.highlights.map((h, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember/40" aria-hidden="true" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            )}
            {pub.keywords && pub.keywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {pub.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full border border-teal/20 bg-teal-light px-2.5 py-0.5 text-xs text-teal"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
