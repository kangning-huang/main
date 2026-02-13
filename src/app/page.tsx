import Link from "next/link";
import {
  SITE,
  LINKS,
  RESEARCH_INTERESTS,
  ABOUT_TEXT,
  PROJECTS,
} from "@/lib/constants";
import { fetchPublications } from "@/lib/publications";
import { fetchBlogPosts } from "@/lib/blog";

export default async function Home() {
  const allPublications = await fetchPublications();
  // Hand-picked mix of high-impact classics + recent lead-author work
  const selectedTitles = [
    // Classics — highest-impact first-author papers
    "Projecting global urban land expansion and heat island intensification through 2050",
    "Persistent increases in nighttime heat stress from urban expansion despite heat island mitigation",
    "An improved artificial immune system for seeking the Pareto front of land-use allocation problem in large areas",
    // Prestige solo — Nature Climate Change
    "Urban forests facing climate risks",
    // Recent — current research direction
    "Declining urban density attenuates rising population exposure to surface heat extremes",
    "Nested economies of scale in global city mass",
    "Planning for rhythmized urban parks: Temporal park classification and modes of action",
  ];
  const titleSet = new Set(selectedTitles.map((t) => t.toLowerCase()));
  const featuredPubs = allPublications
    .filter((p) => titleSet.has(p.title.toLowerCase()))
    .sort((a, b) => {
      // Preserve the hand-picked order
      const ai = selectedTitles.findIndex((t) => t.toLowerCase() === a.title.toLowerCase());
      const bi = selectedTitles.findIndex((t) => t.toLowerCase() === b.title.toLowerCase());
      return ai - bi;
    });
  const blogPosts = await fetchBlogPosts();
  const featuredPosts = blogPosts.slice(0, 3);
  const featuredProjects = PROJECTS.filter((p) => p.featured);

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-ink topo-grain">
        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-20 md:pb-24 md:pt-28 lg:px-8">
          <p className="animate-fade-up text-sm font-medium uppercase tracking-[0.2em] text-ember">
            {SITE.affiliation}
          </p>
          <h1 className="animate-fade-up delay-1 mt-4 font-display text-5xl leading-[1.1] text-paper md:text-6xl lg:text-7xl">
            {SITE.name}
          </h1>
          <p className="animate-fade-up delay-2 mt-3 font-display text-xl italic text-paper/60 md:text-2xl">
            {SITE.title}
          </p>

          {/* Decorative divider */}
          <div className="animate-draw-line delay-3 mt-8 h-px w-32 origin-left bg-ember" />

          <p className="animate-fade-up delay-4 mt-6 max-w-xl text-[15px] leading-relaxed text-paper/50">
            {SITE.description}
          </p>

          {/* Links row */}
          <div className="animate-fade-up delay-5 mt-8 flex flex-wrap gap-2.5">
            {[
              { label: "Google Scholar", href: LINKS.googleScholar },
              { label: "GitHub", href: LINKS.github },
              { label: "Substack", href: LINKS.substack },
              { label: "X", href: LINKS.twitter },
              { label: "NYU Faculty", href: LINKS.nyuFaculty },
              { label: "Email", href: `mailto:${SITE.email}` },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={
                  link.href.startsWith("mailto:")
                    ? undefined
                    : "noopener noreferrer"
                }
                className="rounded-full border border-paper/15 px-4 py-1.5 text-sm text-paper/60 transition-all duration-300 hover:border-ember hover:text-ember"
              >
                {link.label}
                {!link.href.startsWith("mailto:") && (
                  <span className="ml-1 text-[10px] opacity-40">&#8599;</span>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-paper to-transparent" />
      </section>

      {/* ── About ── */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <h2 className="section-heading animate-fade-up">About</h2>

          <div className="mt-8 grid gap-10 md:grid-cols-[1fr,280px]">
            <div className="space-y-4 animate-fade-up delay-1">
              {ABOUT_TEXT.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-[15px] leading-[1.75] text-ink-muted"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="animate-fade-up delay-2">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-faint">
                Research Areas
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {RESEARCH_INTERESTS.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-ember/20 bg-ember-light px-3 py-1 text-sm font-medium text-ember-dark"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Publications ── */}
      <section className="border-t border-rule-faint bg-paper-warm py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="section-heading flex-1">Selected Publications</h2>
            <Link
              href="/publications"
              className="link-underline ml-4 shrink-0 text-sm font-medium text-ember"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="mt-8 space-y-1">
            {featuredPubs.map((pub, i) => (
              <article key={i} className="pub-item group py-4">
                <h3 className="text-[15px] font-medium leading-snug text-ink">
                  {pub.doi ? (
                    <a
                      href={`https://doi.org/${pub.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors group-hover:text-ember"
                    >
                      {pub.title}
                    </a>
                  ) : pub.url ? (
                    <a
                      href={pub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors group-hover:text-ember"
                    >
                      {pub.title}
                    </a>
                  ) : (
                    pub.title
                  )}
                </h3>
                <p className="mt-1 text-sm text-ink-faint">{pub.authors}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-medium text-ember">{pub.venue}</span>
                  <span className="text-ink-faint">{pub.year}</span>
                  {pub.citationCount > 0 && (
                    <span className="rounded-full bg-paper-deep px-2.5 py-0.5 text-xs text-ink-muted">
                      {pub.citationCount} cit.
                    </span>
                  )}
                  {pub.preprint && (
                    <a
                      href={pub.preprint}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-underline text-xs text-ink-faint hover:text-ember"
                    >
                      Preprint &#8599;
                    </a>
                  )}
                  {pub.webUrl && (
                    <a
                      href={pub.webUrl}
                      target={pub.webUrl.startsWith("/") ? undefined : "_blank"}
                      rel={pub.webUrl.startsWith("/") ? undefined : "noopener noreferrer"}
                      className="link-underline text-xs text-ink-faint hover:text-ember"
                    >
                      Web App &#8599;
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Projects ── */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="section-heading flex-1">Projects</h2>
            <Link
              href="/projects"
              className="link-underline ml-4 shrink-0 text-sm font-medium text-ember"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Blog ── */}
      {featuredPosts.length > 0 ? (
        <section className="border-t border-rule-faint bg-paper-warm py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="section-heading flex-1">Latest Writing</h2>
              <Link
                href="/blog"
                className="link-underline ml-4 shrink-0 text-sm font-medium text-ember"
              >
                View all &rarr;
              </Link>
            </div>

            {/* Lead post — compact card with cover image */}
            <a
              href={featuredPosts[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-hover group mt-8 flex overflow-hidden rounded-xl border border-rule bg-paper"
            >
              {featuredPosts[0].coverImage && (
                <div className="hidden shrink-0 overflow-hidden sm:block sm:w-44 md:w-52">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredPosts[0].coverImage}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
                  {featuredPosts[0].date}
                  {featuredPosts[0].wordcount && (
                    <span className="ml-3 text-ink-faint/60">
                      {Math.ceil(featuredPosts[0].wordcount / 250)} min read
                    </span>
                  )}
                </p>
                <h3 className="mt-2 font-display text-xl leading-snug text-ink transition-colors group-hover:text-ember">
                  {featuredPosts[0].title}
                </h3>
                {featuredPosts[0].subtitle && (
                  <p className="mt-1 text-sm italic text-ink-faint line-clamp-1">
                    {featuredPosts[0].subtitle}
                  </p>
                )}
                {featuredPosts[0].excerpt && (
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted line-clamp-2">
                    {featuredPosts[0].excerpt}
                  </p>
                )}
                <p className="mt-3 text-sm font-medium text-ember">
                  Continue reading &rarr;
                </p>
              </div>
            </a>

            {/* Remaining posts — compact list with just title + date */}
            {featuredPosts.length > 1 && (
              <div className="mt-4 divide-y divide-rule-faint">
                {featuredPosts.slice(1).map((post, i) => (
                  <a
                    key={i}
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-baseline justify-between gap-4 py-3"
                  >
                    <h3 className="font-display text-[15px] leading-snug text-ink transition-colors group-hover:text-ember">
                      {post.title}
                    </h3>
                    <span className="shrink-0 text-xs text-ink-faint">
                      {post.date}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="border-t border-rule-faint bg-paper-warm py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <h2 className="section-heading">Writing</h2>
            <p className="mt-6 text-ink-muted">
              I write about cities, climate, autonomous vehicles, and more on
              Substack.
            </p>
            <a
              href={LINKS.substack}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center rounded-full bg-ember px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ember-dark"
            >
              Read on Substack &rarr;
            </a>
          </div>
        </section>
      )}
    </>
  );
}

function ProjectCard({ project }: { project: (typeof PROJECTS)[number] }) {
  const isInternal = !!project.internalPath;
  const Wrapper = isInternal ? Link : "a";
  const props = isInternal
    ? { href: project.internalPath! }
    : {
        href: project.url,
        target: "_blank" as const,
        rel: "noopener noreferrer",
      };

  return (
    <Wrapper
      {...props}
      className="card-hover group flex flex-col rounded-xl border border-rule bg-paper p-5"
    >
      <h3 className="font-display text-lg text-ink transition-colors group-hover:text-ember">
        {project.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
        {project.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-paper-warm px-2.5 py-0.5 text-xs text-ink-faint"
          >
            {tag}
          </span>
        ))}
      </div>
    </Wrapper>
  );
}
