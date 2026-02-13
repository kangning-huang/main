"use client";

import Link from "next/link";
import { useState } from "react";
import { LINKS } from "@/lib/constants";

const NAV_ITEMS = [
  { label: "Publications", href: "/publications" },
  { label: "Projects", href: "/projects" },
  { label: "Blog", href: "/blog" },
];

const EXTERNAL_LINKS = [
  { label: "Google Scholar", href: LINKS.googleScholar },
  { label: "GitHub", href: LINKS.github },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-lg font-semibold text-nyu-violet hover:text-nyu-violet-light transition-colors"
        >
          K. Huang
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground-secondary hover:text-nyu-violet transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <span className="h-4 w-px bg-border" />
          {EXTERNAL_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground-secondary hover:text-nyu-violet transition-colors"
            >
              {item.label}
              <span className="ml-0.5 text-xs">&#8599;</span>
            </a>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span
            className={`h-0.5 w-5 bg-foreground transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`h-0.5 w-5 bg-foreground transition-opacity ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`h-0.5 w-5 bg-foreground transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-t border-border bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-foreground-secondary hover:text-nyu-violet"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <hr className="border-border" />
            {EXTERNAL_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground-secondary hover:text-nyu-violet"
              >
                {item.label} &#8599;
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
