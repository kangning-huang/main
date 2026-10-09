import type { Metadata } from "next";
import { canonicalUrl, withOpenGraphDefaults, pageTitle, webPageSchema, breadcrumbSchema } from "@/lib/seo";
import T from "@/components/T";
import { isSample } from "@/lib/influence";
import { ReachLensProvider, ReachLensChip } from "@/components/reach/ReachLens";
import AdaptiveTopics from "@/components/reach/AdaptiveTopics";
import FieldsFlow from "@/components/reach/FieldsFlow";
import WhoUses from "@/components/reach/WhoUses";
import WhereMap from "@/components/reach/WhereMap";
import StandingOnIt from "@/components/reach/StandingOnIt";
import Growth from "@/components/reach/Growth";
import ReachIntro from "@/components/reach/ReachIntro";
import ReachMethod from "@/components/reach/ReachMethod";

const DESCRIPTION =
  "Who builds on Kangning (Ken) Huang's research: fields, subfields, institutions, and countries citing his papers, from OpenAlex with self-citations removed.";

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

const SECTIONS = [
  { id: "topics", en: "Where it lands", zh: "影响落点", Component: AdaptiveTopics },
  { id: "fields", en: "Theme → field flow", zh: "主题→领域流向", Component: FieldsFlow },
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
          <T en="SAMPLE DATA — these figures are a placeholder fixture, not real OpenAlex results." zh="示例数据——以下数字为占位样例，并非真实的 OpenAlex 结果。" />
        </div>
      )}

      <ReachLensProvider>
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <h1 className="section-heading animate-fade-up">
              <T en="Who builds on this work" zh="谁在此基础上继续研究" />
            </h1>
            <ReachIntro />
            <ReachLensChip />
            <nav aria-label="Reach views" className="mt-6 flex flex-wrap gap-2 animate-fade-up delay-3">
              {SECTIONS.map((s, i) => (
                <a key={s.id} href={`#${s.id}`} className="rounded-full border border-rule px-3 py-1 text-sm text-ink-muted hover:border-ember hover:text-ember">
                  {i + 1}. <T en={s.en} zh={s.zh} />
                </a>
              ))}
            </nav>
          </div>
        </section>

        {SECTIONS.map(({ id, en, zh, Component }, i) => (
          <section key={id} id={id} aria-labelledby={`${id}-heading`} className={`scroll-mt-20 border-t border-rule-faint py-14 ${i % 2 === 1 ? "bg-paper-warm/50" : ""}`}>
            <div className="mx-auto max-w-6xl px-6 lg:px-8">
              <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">{String(i + 1).padStart(2, "0")}</p>
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
