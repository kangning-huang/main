import type { ReactNode } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";

type Segment =
  | { type: "md"; text: string }
  | { type: "video"; src: string; poster?: string };

const VIDEO_RE = /<video\b([^>]*)>\s*<\/video>/gi;

function attr(attrStr: string, name: string): string | undefined {
  const match = new RegExp(`(?:^|\\s)${name}="(\\/blog\\/[^"]+)"`).exec(attrStr);
  return match?.[1];
}

function isSafeBlogPath(value: string | undefined): value is string {
  return !!value && value.startsWith("/blog/") && !value.includes("..") && !value.includes("\\");
}

function parseAllowedVideo(attrStr: string): { src: string; poster?: string } | null {
  const src = attr(attrStr, "src");
  const poster = attr(attrStr, "poster");
  if (!isSafeBlogPath(src)) return null;
  if (poster !== undefined && !isSafeBlogPath(poster)) return null;
  return { src, poster };
}

function splitContent(content: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  const re = new RegExp(VIDEO_RE.source, VIDEO_RE.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "md", text: content.slice(lastIndex, match.index) });
    }
    const parsed = parseAllowedVideo(match[1] ?? "");
    if (parsed) {
      segments.push({ type: "video", ...parsed });
    } else {
      // Drop disallowed raw HTML rather than rendering it.
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    segments.push({ type: "md", text: content.slice(lastIndex) });
  }
  return segments;
}

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-5 text-[17px] leading-[1.85] text-ink">{children}</p>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 mb-4 font-display text-2xl leading-snug text-ink">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 mb-3 font-display text-xl leading-snug text-ink">
      {children}
    </h3>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-ember underline decoration-ember/30 underline-offset-2 transition-colors hover:text-ember-dark hover:decoration-ember"
      target={href && /^https?:\/\//.test(href) ? "_blank" : undefined}
      rel={href && /^https?:\/\//.test(href) ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  img: ({ src, alt }) =>
    src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? ""}
        className="my-6 w-full rounded-lg"
        loading="lazy"
        decoding="async"
      />
    ) : null,
  hr: () => <hr className="my-8 border-rule" />,
  strong: ({ children }) => <strong className="font-medium text-ink">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-5 list-disc space-y-2 pl-6 text-[17px] leading-[1.85] text-ink">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-5 list-decimal space-y-2 pl-6 text-[17px] leading-[1.85] text-ink">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-2 border-ember/40 pl-4 text-ink-muted">
      {children}
    </blockquote>
  ),
};

function OpeningVideo({ src, poster }: { src: string; poster?: string }) {
  return (
    <div className="mx-auto mb-8 w-full max-w-md">
      <video
        controls
        playsInline
        poster={poster}
        src={src}
        className="aspect-square w-full rounded-lg bg-ink object-cover"
      />
    </div>
  );
}

export default function ZhBlogMarkdown({ content }: { content: string }) {
  const segments = splitContent(content);
  const nodes: ReactNode[] = segments.map((segment, index) => {
    if (segment.type === "video") {
      return <OpeningVideo key={`video-${index}`} src={segment.src} poster={segment.poster} />;
    }
    const text = segment.text.trim();
    if (!text) return null;
    return (
      <ReactMarkdown key={`md-${index}`} components={markdownComponents}>
        {segment.text}
      </ReactMarkdown>
    );
  });
  return <div className="zh-blog-prose">{nodes}</div>;
}
