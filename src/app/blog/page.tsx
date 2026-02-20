import type { Metadata } from "next";
import { LINKS } from "@/lib/constants";
import { fetchBlogPosts } from "@/lib/blog";
import Script from "next/script";
import { canonicalUrl, webPageSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing on cities, climate, autonomous vehicles, and more by Kangning (Ken) Huang.",
  alternates: {
    canonical: canonicalUrl("/blog"),
  },
  openGraph: {
    title: "Blog",
    description:
      "Writing on cities, climate, autonomous vehicles, and more by Kangning (Ken) Huang.",
    url: canonicalUrl("/blog"),
  },
};

export default async function BlogPage() {
  const posts = await fetchBlogPosts();
  const pageSchema = webPageSchema({
    path: "/blog",
    title: "Blog",
    description:
      "Writing on cities, climate, autonomous vehicles, and more by Kangning (Ken) Huang.",
  });

  return (
    <>
      <Script
        id="jsonld-blog"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-ink">Blog</h1>
          <p className="mt-2 text-ink-muted">
            Writing on cities, climate, autonomous vehicles, and more.
          </p>
        </div>
        <a
          href={LINKS.substack}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full bg-ember px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ember-dark"
        >
          Subscribe on Substack &#8599;
        </a>
      </div>

      {posts.length > 0 ? (
        <div className="mt-10">
          {/* Featured / lead post */}
          <a
            href={posts[0].url}
            target="_blank"
            rel="noopener noreferrer"
            className="card-hover group block overflow-hidden rounded-xl border border-rule bg-paper"
          >
            {posts[0].coverImage && (
              <div className="overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={posts[0].coverImage}
                  alt=""
                  className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] md:h-80"
                />
              </div>
            )}
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-ink-faint">
                <span>{posts[0].date}</span>
                {posts[0].wordcount && (
                  <>
                    <span className="h-0.5 w-0.5 rounded-full bg-ink-faint" />
                    <span>{Math.ceil(posts[0].wordcount / 250)} min read</span>
                  </>
                )}
              </div>
              <h2 className="mt-3 font-display text-2xl leading-snug text-ink transition-colors group-hover:text-ember md:text-3xl">
                {posts[0].title}
              </h2>
              {posts[0].subtitle && (
                <p className="mt-2 font-display text-lg italic text-ink-faint">
                  {posts[0].subtitle}
                </p>
              )}
              {posts[0].excerpt && (
                <p className="mt-4 text-[15px] leading-[1.7] text-ink-muted">
                  {posts[0].excerpt}...
                </p>
              )}
              <p className="mt-5 text-sm font-medium text-ember">
                Continue reading &rarr;
              </p>
            </div>
          </a>

          {/* Remaining posts in 2-col grid */}
          {posts.length > 1 && (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {posts.slice(1).map((post, i) => (
                <a
                  key={i}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-hover group block overflow-hidden rounded-xl border border-rule bg-paper"
                >
                  {post.coverImage && (
                    <div className="overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.coverImage}
                        alt=""
                        className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-ink-faint">
                      <span>{post.date}</span>
                      {post.wordcount && (
                        <>
                          <span className="h-0.5 w-0.5 rounded-full bg-ink-faint" />
                          <span>{Math.ceil(post.wordcount / 250)} min read</span>
                        </>
                      )}
                    </div>
                    <h2 className="mt-2.5 font-display text-xl leading-snug text-ink transition-colors group-hover:text-ember">
                      {post.title}
                    </h2>
                    {post.subtitle && (
                      <p className="mt-1.5 text-sm italic text-ink-faint">
                        {post.subtitle}
                      </p>
                    )}
                    {post.excerpt && (
                      <p className="mt-3 flex-1 text-sm leading-[1.7] text-ink-muted line-clamp-6">
                        {post.excerpt}
                      </p>
                    )}
                    <p className="mt-4 text-sm font-medium text-ember">
                      Continue reading &rarr;
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-rule p-8 text-center">
          <p className="text-ink-muted">
            Posts are loading from Substack. Visit the newsletter directly:
          </p>
          <a
            href={LINKS.substack}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center font-medium text-ember transition-colors hover:text-ember-dark"
          >
            kangninghuang.substack.com &#8599;
          </a>
        </div>
      )}
    </>
  );
}
