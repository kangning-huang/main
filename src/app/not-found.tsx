import Link from "next/link";

/**
 * Backup for browsers hitting unknown paths after the /main basePath removal.
 * Next.js static export overwrites public/404.html with this page's HTML.
 * HTTP status remains 404 — real 301s need Cloudflare Redirect Rules.
 */
export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var p=location.pathname||"";if(p==="/main"||p.indexOf("/main/")===0){var n=p==="/main"?"/":(p.slice(5)||"/");location.replace(n+location.search+location.hash);}})();`,
        }}
      />
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-4 text-neutral-600">
        <Link href="/" className="underline">
          Return home
        </Link>
      </p>
    </main>
  );
}
