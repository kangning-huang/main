import type { Metadata } from "next";
import { canonicalUrl, withOpenGraphDefaults, pageTitle, webPageSchema, breadcrumbSchema } from "@/lib/seo";
import T from "@/components/T";
import { isSample } from "@/lib/influence";
import { ReachLensProvider, ReachLensChip } from "@/components/reach/ReachLens";
import FieldShelf from "@/components/reach/FieldShelf";
import AdaptiveTopics from "@/components/reach/AdaptiveTopics";
import WhoUses from "@/components/reach/WhoUses";
import WhereMap from "@/components/reach/WhereMap";
import StandingOnIt from "@/components/reach/StandingOnIt";
import Growth from "@/components/reach/Growth";
import ReachMethod from "@/components/reach/ReachMethod";

const DESCRIPTION =
  "Research citing Kangning Huang's papers (OpenAlex, self-citations removed): one square per citing work, more-cited work toward the centre.";

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
  { id: "where", en: "Where", zh: "在哪里", Component: WhereMap },
  { id: "topics", en: "Topic cards", zh: "主题卡片", Component: AdaptiveTopics },
  { id: "who", en: "Who uses it", zh: "谁在用", Component: WhoUses },
  { id: "standing-on-it", en: "Standing on it", zh: "在此基础上", Component: StandingOnIt },
  { id: "growth", en: "Growth", zh: "引用增长", Component: Growth },
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
      <ReachLensProvider>
        <section className="pt-10 pb-6 md:pt-14">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <h1 className="font-display text-4xl text-ink md:text-5xl">
              <T en="Who have cited my works" zh="谁引用了我的研究成果" />
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] text-ink-muted">
              <T
                en="Each square is one OpenAlex work that cites these papers. Colour tracks that citing work's own citation count, with higher-impact work toward the centre. Self-citations are removed."
                zh="每个方块代表 OpenAlex 收录的一篇引用了这些论文的文献。颜色表示这篇文献自身的被引次数，被引越多，方块越靠近中心。自引已剔除。"
              />
            </p>
            <ReachLensChip />
          </div>
        </section>

        <section id="field-shelf" aria-labelledby="field-shelf-heading" className="scroll-mt-20 border-t border-rule-faint py-10 md:py-12">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <FieldShelf />
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
