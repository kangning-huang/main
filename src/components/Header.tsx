"use client";

import Link from "next/link";
import { useState } from "react";
import { LINKS } from "@/lib/constants";

const NAV_ITEMS = [
  { label: "Publications", href: "/publications" },
  { label: "Projects", href: "/projects" },
  { label: "Advisees", href: "/advisees" },
  { label: "Blog", href: "/blog" },
];

const EXTERNAL_LINKS = [
  { label: "Scholar", href: LINKS.googleScholar },
  { label: "GitHub", href: LINKS.github },
  { label: "CV", href: "/main/CV_Kangning_Huang.pdf" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md border-b border-rule-faint">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
        <Link
          href="/"
          className="font-display text-xl tracking-tight text-ink hover:text-ember transition-colors duration-300"
        >
          K. Huang
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="link-underline px-3 py-1.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <span className="mx-2 h-4 w-px bg-rule" />
          {EXTERNAL_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline px-3 py-1.5 text-sm font-medium text-ink-faint hover:text-ink transition-colors"
            >
              {item.label}
              <span className="ml-1 text-[10px] opacity-50">&#8599;</span>
            </a>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          className="relative flex h-8 w-8 flex-col items-center justify-center gap-[5px] md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span
            className={`h-[1.5px] w-5 bg-ink transition-all duration-300 ${menuOpen ? "translate-y-[6.5px] rotate-45" : ""}`}
          />
          <span
            className={`h-[1.5px] w-5 bg-ink transition-all duration-300 ${menuOpen ? "opacity-0 scale-x-0" : ""}`}
          />
          <span
            className={`h-[1.5px] w-5 bg-ink transition-all duration-300 ${menuOpen ? "-translate-y-[6.5px] -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden border-t border-rule-faint bg-paper transition-all duration-300 md:hidden ${
          menuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="px-6 py-4">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-paper-warm hover:text-ink transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-rule-faint" />
            {EXTERNAL_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-faint hover:bg-paper-warm hover:text-ink transition-colors"
              >
                {item.label}
                <span className="ml-1 text-[10px]">&#8599;</span>
              </a>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
