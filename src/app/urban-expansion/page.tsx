import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Urban Expansion 2050 — GEE App",
  description:
    "Interactive Google Earth Engine map visualizing projected global urban land expansion through 2050.",
};

const GEE_APP_URL =
  "https://kangning.users.earthengine.app/view/urban-expansion-2050";

export default function UrbanExpansionPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-bold text-foreground">
        Urban Expansion 2050
      </h1>
      <p className="mt-2 text-foreground-secondary">
        Interactive Google Earth Engine web application
      </p>

      <div className="mt-6 max-w-3xl space-y-4 text-foreground-secondary leading-relaxed">
        <p>
          This interactive map visualizes projected global urban land expansion
          through 2050. Urban populations are expected to increase by 2&ndash;3
          billion by mid-century, requiring massive expansion of built-up areas.
          Understanding where and how this growth will occur is critical for
          planning climate adaptation strategies.
        </p>
        <p>
          The projections are based on the research published in:
        </p>
        <blockquote className="border-l-4 border-nyu-violet pl-4 italic">
          Kangning Huang, Xia Li, Xiaoping Liu, Karen C. Seto (2019).
          &ldquo;Projecting global urban land expansion and heat island
          intensification through 2050.&rdquo;{" "}
          <span className="font-medium text-nyu-violet">
            Environmental Research Letters
          </span>
          , 14(11): 114037.
        </blockquote>
        <p>
          The underlying data is available as an open database on{" "}
          <a
            href="https://resourcewatch.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-nyu-violet hover:underline"
          >
            WRI Resource Watch
          </a>
          .
        </p>
      </div>

      {/* GEE App Embed */}
      <div className="mt-8 overflow-hidden rounded-lg border border-border">
        <div className="relative w-full" style={{ paddingBottom: "65%" }}>
          <iframe
            src={GEE_APP_URL}
            className="absolute inset-0 h-full w-full"
            title="Urban Expansion 2050 — Google Earth Engine App"
            allowFullScreen
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={GEE_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground-secondary hover:border-nyu-violet hover:text-nyu-violet transition-colors"
        >
          Open full-screen GEE app &#8599;
        </a>
        <a
          href="https://doi.org/10.1088/1748-9326/ab4b71"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground-secondary hover:border-nyu-violet hover:text-nyu-violet transition-colors"
        >
          Read the paper &#8599;
        </a>
      </div>
    </div>
  );
}
