import type { Metadata } from "next";
import Script from "next/script";
import { canonicalUrl, webPageSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Urban Expansion 2050",
  description:
    "Global urban land expansion and heat island projections through 2050 from research by Kangning (Ken) Huang.",
  alternates: {
    canonical: canonicalUrl("/urban-expansion"),
  },
  openGraph: {
    title: "Urban Expansion 2050",
    description:
      "Global urban land expansion and heat island projections through 2050 from research by Kangning (Ken) Huang.",
    url: canonicalUrl("/urban-expansion"),
  },
};

export default function UrbanExpansionPage() {
  const pageSchema = webPageSchema({
    path: "/urban-expansion",
    title: "Urban Expansion 2050",
    description:
      "Global urban land expansion and heat island projections through 2050 from research by Kangning (Ken) Huang.",
  });

  return (
    <>
      <Script
        id="jsonld-urban-expansion"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
      <h1 className="font-display text-4xl text-ink">
        Urban Expansion 2050
      </h1>
      <p className="mt-2 text-ink-muted">
        Global urban land expansion projections
      </p>

      <div className="mt-6 max-w-3xl space-y-4 text-[15px] leading-[1.75] text-ink-muted">
        <p>
          This project visualizes projected global urban land expansion through
          2050. Urban populations are expected to increase by 2&ndash;3 billion
          by mid-century, requiring massive expansion of built-up areas.
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

      <div className="relative mt-8 overflow-hidden rounded-xl border border-rule" style={{ paddingBottom: "75%" }}>
        <iframe
          src="https://knhuang.users.earthengine.app/view/urban-land-expansion-2050"
          className="absolute inset-0 h-full w-full"
          title="Urban Land Expansion 2050 – Google Earth Engine App"
          allowFullScreen
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href="https://doi.org/10.1088/1748-9326/ab4b71"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full bg-ember px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ember-dark"
        >
          Read the paper &#8599;
        </a>
        <a
          href="https://resourcewatch.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full border border-rule px-5 py-2.5 text-sm font-medium text-ink-muted transition-all hover:border-ember hover:text-ember"
        >
          Data on Resource Watch &#8599;
        </a>
      </div>
    </>
  );
}
