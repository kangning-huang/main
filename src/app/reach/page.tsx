import type { Metadata } from "next";
import { canonicalUrl, withOpenGraphDefaults, pageTitle, webPageSchema, breadcrumbSchema } from "@/lib/seo";
import T from "@/components/T";
import { isSample } from "@/lib/influence";
import { ReachLensProvider, ReachLensChip } from "@/components/reach/ReachLens";
import RippleSection from "@/components/reach/RippleSection";
import AdaptiveTopics from "@/components/reach/AdaptiveTopics";
import WhoUses from "@/components/reach/WhoUses";
import WhereMap from "@/components/reach/WhereMap";
import StandingOnIt from "@/components/reach/StandingOnIt";
import Growth from "@/components/reach/Growth";
import ReachMethod from "@/components/reach/ReachMethod";

const DESCRIPTION =
  "Who builds on Kangning (Ken) Huang's research: what the works citing his papers are about, how far they sit from his own topics, and where they come from. OpenAlex, self-citations removed.";

// Preview branch only (preview/reach-ripple): remove this flag and the banner when the Ripple map launches.
const RIPPLE_PREVIEW = true;

export const metadata: Metadata = {
  title: "Reach",
  description: DESCRIPTION,
  alternates: { canonical: canonicalUrl("/reach") },
  openGraph: withOpenGraphDefaults({
    type: "website",
    title: pageTitle("Reach"),
    description: DESCRIPTION,
    url: canonicalUrl("/reach"),
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Kangning (Ken) Huang — NYU Shanghai" }],
  }),
};

const LATER = [
  { id: "topics", en: "Topic cards", zh: "主题卡片", Component: AdaptiveTopics },
  { id: "who", en: "Who uses it", zh: "谁在使用", Component: WhoUses },
  { id: "where", en: "Where", zh: "在哪里", Component: WhereMap },
  { id: "standing-on-it", en: "Standing on it", zh: "在此基础上", Component: StandingOnIt },
  { id: "growth", en: "Growth", zh: "增长", Component: Growth },
];

export default function ReachPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema({ path: "/reach", title: "Reach", description: DESCRIPTION })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema([{ name: "Reach", path: "/reach" }])) }} />

      {RIPPLE_PREVIEW && (
        <div role="note" className="border-b border-ember bg-ember-light px-6 py-2.5 text-center text-sm font-medium text-ember-dark">
          PREVIEW — Ripple Map (not merged)
        </div>
      )}
      {isSample && (
        <div role="alert" className="border-b border-ember bg-ember-light px-6 py-3 text-center text-sm font-medium text-ember-dark">
          <T en="SAMPLE DATA" zh="示例数据" />
        </div>
      )}
      <ReachLensProvider>
        <section className="pt-10 pb-6 md:pt-14">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <h1 className="font-display text-4xl text-ink md:text-5xl">
              <T en="Who builds on this work" zh="谁在此基础上继续研究" />
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] text-ink-muted">
              <T
                en="Keywords from the works that cite Ken's papers, placed by how far each sits from his own research topics. OpenAlex, self-citations removed."
                zh="引用黄康宁论文的文献关键词，按其与本人研究主题的距离排布。数据来自 OpenAlex，已剔除自引。"
              />
            </p>
            <ReachLensChip />
          </div>
        </section>

        <section id="ripple" aria-labelledby="ripple-heading" className="scroll-mt-20 border-t border-rule-faint py-10 md:py-12">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <RippleSection />
          </div>
        </section>

        {LATER.map(({ id, en, zh, Component }, i) => (
          <section key={id} id={id} aria-labelledby={`${id}-heading`} className={`scroll-mt-20 border-t border-rule-faint py-14 ${i % 2 === 1 ? "bg-paper-warm/50" : ""}`}>
            <div className="mx-auto max-w-6xl px-6 lg:px-8">
              <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">{String(i + 2).padStart(2, "0")}</p>
              <h2 id={`${id}-heading`} className="mt-1 mb-6 font-display text-3xl text-ink">
                <T en={en} zh={zh} />
              </h2>
              <Component />
            </div>
          </section>
        ))}

        <ReachMethod />
      </ReachLensProvider>
    </>
  );
}
