import Link from "next/link";
import { SITE, LINKS } from "@/lib/constants";
import T from "./T";

const SITE_LINKS = [
  { en: "Research", zh: "研究", href: "/research" },
  { en: "Publications", zh: "论文", href: "/publications" },
  { en: "Lab", zh: "实验室", href: "/lab" },
  { en: "News", zh: "动态", href: "/news" },
  { en: "Blog", zh: "博客", href: "/blog" },
  { en: "Tinkering", zh: "小项目", href: "/tinkering" },
];

const EXTERNAL_LINKS = [
  { en: "NYU Faculty", zh: "教师主页", href: LINKS.nyuFaculty },
  { en: "CV (PDF)", zh: "简历 (PDF)", href: "/CV_Kangning_Huang.pdf" },
  { en: "Google Scholar", zh: "谷歌学术", href: LINKS.googleScholar },
  { en: "GitHub", zh: "GitHub", href: LINKS.github },
  { en: "Substack", zh: "Substack", href: LINKS.substack },
  { en: "X / Twitter", zh: "X / Twitter", href: LINKS.twitter },
];

const linkClass =
  "link-underline text-sm text-ink-faint hover:text-ink transition-colors";

export default function Footer() {
  return (
    <footer className="relative border-t border-rule bg-paper-warm topo-grain">
      <div className="relative mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-lg text-ink">
              <T en={SITE.name} zh="黄康宁" />
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              <T
                en={<>{SITE.title}, {SITE.affiliation}</>}
                zh="环境学助理教授，上海纽约大学"
              />
            </p>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-2 inline-block text-sm text-ember hover:text-ember-dark transition-colors"
            >
              {SITE.email}
            </a>
          </div>

          <div className="flex flex-col gap-3">
            <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Site">
              {SITE_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass}>
                  <T en={link.en} zh={link.zh} />
                </Link>
              ))}
            </nav>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {EXTERNAL_LINKS.map((link) => (
                <a
                  key={link.en}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <T en={link.en} zh={link.zh} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 h-px bg-rule-faint" />
        <p className="mt-6 text-xs text-ink-faint">
          &copy; {new Date().getFullYear()} <T en={SITE.name} zh="黄康宁" />
        </p>
      </div>
    </footer>
  );
}
