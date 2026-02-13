import { SITE, LINKS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background-alt">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-semibold text-foreground">{SITE.name}</p>
            <p className="mt-1 text-sm text-foreground-secondary">
              {SITE.title}
            </p>
            <p className="text-sm text-foreground-secondary">
              {SITE.affiliation}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a
              href={LINKS.googleScholar}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-secondary hover:text-nyu-violet transition-colors"
            >
              Google Scholar
            </a>
            <a
              href={LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-secondary hover:text-nyu-violet transition-colors"
            >
              GitHub
            </a>
            <a
              href={LINKS.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-secondary hover:text-nyu-violet transition-colors"
            >
              X / Twitter
            </a>
            <a
              href={LINKS.substack}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-secondary hover:text-nyu-violet transition-colors"
            >
              Substack
            </a>
            <a
              href={`mailto:${SITE.email}`}
              className="text-foreground-secondary hover:text-nyu-violet transition-colors"
            >
              Email
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-foreground-secondary">
          &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
