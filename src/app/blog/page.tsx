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
        <div className="mt-10 space-y-4">
          {posts.map((post, i) => (
            <a
              key={i}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-hover group block rounded-xl border border-rule bg-paper p-6"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <h2 className="font-display text-xl text-ink transition-colors group-hover:text-ember">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                </div>
                <time className="shrink-0 text-sm text-ink-faint sm:ml-6">
                  {post.date}
                </time>
              </div>
              <p className="mt-3 text-sm font-medium text-ember">
                Read on Substack &rarr;
              </p>
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
