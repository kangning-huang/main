import type { Metadata } from "next";
import { canonicalUrl, withOpenGraphDefaults, pageTitle, webPageSchema, breadcrumbSchema } from "@/lib/seo";
import T from "@/components/T";
import { isSample } from "@/lib/influence";
import { ReachLensProvider, ReachLensChip } from "@/components/reach/ReachLens";
import ReachFlowChart from "@/components/reach/ReachFlowChart";
import AdaptiveTopics from "@/components/reach/AdaptiveTopics";
import WhoUses from "@/components/reach/WhoUses";
import WhereMap from "@/components/reach/WhereMap";
import StandingOnIt from "@/components/reach/StandingOnIt";
import Growth from "@/components/reach/Growth";
import ReachIntro from "@/components/reach/ReachIntro";
import ReachMethod from "@/components/reach/ReachMethod";

const DESCRIPTION =
  "Who builds on Kangning (Ken) Huang's research: subfields and topics citing his papers, from OpenAlex with self-citations removed.";

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

      {isSample && (
        <div role="alert" className="border-b border-ember bg-ember-light px-6 py-3 text-center text-sm font-medium text-ember-dark">
          <T en="SAMPLE DATA" zh="示例数据" />
        </div>
      )}

      <div className="border-b border-ember/40 bg-ember-light/40 px-6 py-2 text-center text-xs text-ember-dark">
        <T en="PREVIEW — flow-first redesign; not merged to live." zh="预览——流程图优先改版；尚未合并上线。" />
      </div>

      <ReachLensProvider>
        <section className="pt-10 pb-6 md:pt-14">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <h1 className="font-display text-4xl text-ink md:text-5xl">
              <T en="Who builds on this work" zh="谁在此基础上继续研究" />
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] text-ink-muted">
              <T
                en="OpenAlex citing works after self-citation removal. Flow first; details below."
                zh="OpenAlex 施引文献（已剔除自引）。先看流向，细节在下方。"
              />
            </p>
            <ReachLensChip />
          </div>
        </section>

        <section id="flow" className="scroll-mt-20 border-t border-rule-faint py-10 md:py-12">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <ReachFlowChart />
          </div>
        </section>

        <section className="border-t border-rule-faint py-8">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <ReachIntro />
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
