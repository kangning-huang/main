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
    <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <h1 className="font-display text-4xl text-ink">
        Urban Expansion 2050
      </h1>
      <p className="mt-2 text-ink-muted">
        Interactive Google Earth Engine web application
      </p>

      <div className="mt-6 max-w-3xl space-y-4 text-[15px] leading-[1.75] text-ink-muted">
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
        <blockquote className="border-l-2 border-ember pl-4 italic text-ink-muted">
          Kangning Huang, Xia Li, Xiaoping Liu, Karen C. Seto (2019).
          &ldquo;Projecting global urban land expansion and heat island
          intensification through 2050.&rdquo;{" "}
          <span className="font-medium text-ember">
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
            className="text-ember hover:underline"
          >
            WRI Resource Watch
          </a>
          .
        </p>
      </div>

      {/* GEE App Embed */}
      <div className="mt-8 overflow-hidden rounded-xl border border-rule">
        <div className="relative w-full" style={{ paddingBottom: "65%" }}>
          <iframe
            src={GEE_APP_URL}
            className="absolute inset-0 h-full w-full"
            title="Urban Expansion 2050 — Google Earth Engine App"
            allowFullScreen
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={GEE_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-rule px-4 py-2 text-sm font-medium text-ink-muted transition-all hover:border-ember hover:text-ember"
        >
          Open full-screen GEE app &#8599;
        </a>
        <a
          href="https://doi.org/10.1088/1748-9326/ab4b71"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-rule px-4 py-2 text-sm font-medium text-ink-muted transition-all hover:border-ember hover:text-ember"
        >
          Read the paper &#8599;
        </a>
      </div>
    </div>
  );
}
