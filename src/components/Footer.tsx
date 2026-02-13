import { SITE, LINKS } from "@/lib/constants";

const FOOTER_LINKS = [
  { label: "Google Scholar", href: LINKS.googleScholar },
  { label: "GitHub", href: LINKS.github },
  { label: "X / Twitter", href: LINKS.twitter },
  { label: "Substack", href: LINKS.substack },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-rule bg-paper-warm topo-grain">
      <div className="relative mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-lg text-ink">{SITE.name}</p>
            <p className="mt-1 text-sm text-ink-muted">
              {SITE.title}, {SITE.affiliation}
            </p>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-2 inline-block text-sm text-ember hover:text-ember-dark transition-colors"
            >
              {SITE.email}
            </a>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline text-sm text-ink-faint hover:text-ink transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 h-px bg-rule-faint" />
        <p className="mt-6 text-xs text-ink-faint">
          &copy; {new Date().getFullYear()} {SITE.name}
        </p>
      </div>
    </footer>
  );
}
