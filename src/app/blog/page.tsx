import type { Metadata } from "next";
import { LINKS } from "@/lib/constants";
import { fetchBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Writing on cities, climate, autonomous vehicles, and more by Kangning (Ken) Huang.",
};

export default async function BlogPage() {
  const posts = await fetchBlogPosts();

  return (
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
        <div className="mt-10 space-y-6">
          {posts.map((post, i) => (
            <a
              key={i}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-hover group block overflow-hidden rounded-xl border border-rule bg-paper"
            >
              <div className="flex flex-col md:flex-row">
                {/* Cover image (if available) */}
                {post.coverImage && (
                  <div className="relative h-48 shrink-0 overflow-hidden md:h-auto md:w-64">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.coverImage}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-ink-faint">
                    <span>{post.date}</span>
                    {post.wordcount && (
                      <>
                        <span className="h-0.5 w-0.5 rounded-full bg-ink-faint" />
                        <span>{Math.ceil(post.wordcount / 250)} min read</span>
                      </>
                    )}
                  </div>

                  <h2 className="mt-2.5 font-display text-xl leading-snug text-ink transition-colors group-hover:text-ember md:text-2xl">
                    {post.title}
                  </h2>

                  {post.subtitle && (
                    <p className="mt-1.5 font-display italic text-ink-faint">
                      {post.subtitle}
                    </p>
                  )}

                  {post.excerpt && (
                    <p className="mt-3 flex-1 text-sm leading-[1.7] text-ink-muted line-clamp-4">
                      {post.excerpt}
                    </p>
                  )}

                  <p className="mt-4 text-sm font-medium text-ember">
                    Continue reading &rarr;
                  </p>
                </div>
              </div>
            </a>
          ))}
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
    </div>
  );
}
