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
  const featuredPubs = allPublications.slice(0, 5);
  const blogPosts = await fetchBlogPosts();
  const featuredPosts = blogPosts.slice(0, 3);
  const featuredProjects = PROJECTS.filter((p) => p.featured);

  return (
    <>
      {/* Hero */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {SITE.name}
          </h1>
          <p className="mt-3 text-xl text-nyu-violet font-medium">
            {SITE.title}
          </p>
          <p className="text-lg text-foreground-secondary">
            {SITE.affiliation}
          </p>
          <p className="mt-4 max-w-2xl text-foreground-secondary leading-relaxed">
            {SITE.description}
          </p>

          {/* Social / external links */}
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { label: "Google Scholar", href: LINKS.googleScholar },
              { label: "GitHub", href: LINKS.github },
              { label: "Substack", href: LINKS.substack },
              { label: "X / Twitter", href: LINKS.twitter },
              { label: "NYU Faculty Page", href: LINKS.nyuFaculty },
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
                className="inline-flex items-center rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground-secondary hover:border-nyu-violet hover:text-nyu-violet transition-colors"
              >
                {link.label}
                {!link.href.startsWith("mailto:") && (
                  <span className="ml-1 text-xs">&#8599;</span>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="bg-background-alt py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-bold text-foreground">About</h2>
          <div className="mt-4 space-y-4 max-w-3xl">
            {ABOUT_TEXT.map((paragraph, i) => (
              <p
                key={i}
                className="text-foreground-secondary leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {RESEARCH_INTERESTS.map((interest) => (
              <span
                key={interest}
                className="rounded-full bg-nyu-violet-bg px-3 py-1 text-sm font-medium text-nyu-violet"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Publications */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              Selected Publications
            </h2>
            <Link
              href="/publications"
              className="text-sm font-medium text-nyu-violet hover:text-nyu-violet-light transition-colors"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {featuredPubs.map((pub, i) => (
              <article
                key={i}
                className="rounded-lg border border-border p-4 hover:border-nyu-violet/30 transition-colors"
              >
                <h3 className="font-medium text-foreground leading-snug">
                  {pub.doi ? (
                    <a
                      href={`https://doi.org/${pub.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-nyu-violet transition-colors"
                    >
                      {pub.title}
                    </a>
                  ) : pub.url ? (
                    <a
                      href={pub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-nyu-violet transition-colors"
                    >
                      {pub.title}
                    </a>
                  ) : (
                    pub.title
                  )}
                </h3>
                <p className="mt-1 text-sm text-foreground-secondary">
                  {pub.authors}
                </p>
                <div className="mt-2 flex items-center gap-3 text-sm text-foreground-secondary">
                  <span className="font-medium text-nyu-violet">
                    {pub.venue}
                  </span>
                  <span>{pub.year}</span>
                  {pub.citationCount > 0 && (
                    <span className="rounded bg-background-alt px-2 py-0.5 text-xs">
                      {pub.citationCount} citations
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="bg-background-alt py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Projects</h2>
            <Link
              href="/projects"
              className="text-sm font-medium text-nyu-violet hover:text-nyu-violet-light transition-colors"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      {featuredPosts.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                Latest Writing
              </h2>
              <Link
                href="/blog"
                className="text-sm font-medium text-nyu-violet hover:text-nyu-violet-light transition-colors"
              >
                View all &rarr;
              </Link>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {featuredPosts.map((post, i) => (
                <a
                  key={i}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-lg border border-border p-5 hover:border-nyu-violet/30 transition-colors"
                >
                  <p className="text-xs font-medium text-foreground-secondary">
                    {post.date}
                  </p>
                  <h3 className="mt-2 font-medium text-foreground group-hover:text-nyu-violet transition-colors leading-snug">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="mt-2 text-sm text-foreground-secondary line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <p className="mt-3 text-sm font-medium text-nyu-violet">
                    Read on Substack &rarr;
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* If no blog posts fetched, show a static link section */}
      {featuredPosts.length === 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-2xl font-bold text-foreground">Writing</h2>
            <p className="mt-4 text-foreground-secondary">
              I write about cities, climate, autonomous vehicles, and more on
              Substack.
            </p>
            <a
              href={LINKS.substack}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center rounded-full bg-nyu-violet px-5 py-2 text-sm font-medium text-white hover:bg-nyu-violet-light transition-colors"
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
      className="group flex flex-col rounded-lg border border-border p-5 hover:border-nyu-violet/30 transition-colors"
    >
      <h3 className="font-semibold text-foreground group-hover:text-nyu-violet transition-colors">
        {project.title}
      </h3>
      <p className="mt-2 flex-1 text-sm text-foreground-secondary leading-relaxed">
        {project.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded bg-background-alt px-2 py-0.5 text-xs text-foreground-secondary"
          >
            {tag}
          </span>
        ))}
      </div>
    </Wrapper>
  );
}
