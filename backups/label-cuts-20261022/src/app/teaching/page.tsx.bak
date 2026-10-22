import Link from "next/link";
import type { Metadata } from "next";
import { canonicalUrl, withOpenGraphDefaults, pageTitle, webPageSchema, breadcrumbSchema } from "@/lib/seo";
import { COURSES } from "@/lib/teaching";
import T from "@/components/T";
import CourseCard from "@/components/teaching/CourseCard";
import SignatureMethods from "@/components/teaching/SignatureMethods";
import AwardBlock from "@/components/teaching/AwardBlock";
import StatementDraft from "@/components/teaching/StatementDraft";

const DESCRIPTION =
  "Teaching by Kangning (Ken) Huang at NYU Shanghai: Environment and Society, Environmental System Science, and Cities at a Crossroads. Recipient of the 2025–2026 NYU Shanghai Teaching Excellence Award.";

export const metadata: Metadata = {
  title: "Teaching",
  description: DESCRIPTION,
  alternates: {
    canonical: canonicalUrl("/teaching"),
  },
  openGraph: withOpenGraphDefaults({
    type: "website",
    title: pageTitle("Teaching"),
    description: DESCRIPTION,
    url: canonicalUrl("/teaching"),
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Kangning (Ken) Huang — NYU Shanghai",
      },
    ],
  }),
};

export default function TeachingPage() {
  const pageSchema = webPageSchema({
    path: "/teaching",
    title: "Teaching",
    description: DESCRIPTION,
  });

  const breadcrumbs = breadcrumbSchema([{ name: "Teaching", path: "/teaching" }]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <h1 className="section-heading animate-fade-up">
            <T en="Teaching" zh="教学" />
          </h1>
          <p className="mt-5 max-w-3xl text-[15px] leading-[1.75] text-ink-muted animate-fade-up delay-1">
            <T
              en="I teach environmental studies at NYU Shanghai in three courses: a debate-driven introduction to environmental thought, a systems-science gateway, and a course on the environmental challenges and opportunities of cities."
              zh="我在上海纽约大学教三门环境研究课程。学生会通过辩论认识不同的环境思想，从系统科学入门，也会讨论城市面临的环境挑战与机遇。"
            />
          </p>

          <AwardBlock />

          {/* ── Courses ── */}
          <h2 id="courses" className="mt-16 scroll-mt-24 font-display text-2xl text-ink">
            <T en="Courses" zh="课程" />
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {COURSES.map((c) => (
              <CourseCard key={c.code} course={c} />
            ))}
          </div>
          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-ink-faint">
            <T
              en="Course readings are distributed to enrolled students through Brightspace and are not posted here."
              zh="课程阅读材料通过 Brightspace 发给选课学生，不在本站公开。"
            />
          </p>

          {/* ── Signature methods ── */}
          <h2 id="methods" className="mt-16 scroll-mt-24 font-display text-2xl text-ink">
            <T en="Signature methods" zh="教学方法" />
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-ink-faint">
            <T
              en="Practices I use across Environment and Society, Environmental System Science, and Cities at a Crossroads—drawn from those syllabi, my third-year review teaching statement, and the NYU Shanghai Teaching Excellence Award interview."
              zh="贯穿《环境与社会》《环境系统科学》与《城市十字路口》的做法，依据各课大纲、三年期中评估教学陈述，以及上海纽约大学卓越教学奖专访。"
            />
          </p>
          <SignatureMethods />

          {/* ── Student work ── */}
          <h2 id="student-work" className="mt-16 scroll-mt-24 font-display text-2xl text-ink">
            <T en="Student work" zh="学生作品" />
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-muted">
            <T
              en="Outside class I supervise undergraduate capstones and research through the CLUEs Lab. Projects, placements, and honors are on the lab and advisee pages."
              zh="课外，我在 CLimate and Urban Environments（CLUEs）实验室指导本科毕业论文与研究项目。学生做过哪些项目、后来去了哪里、获得哪些荣誉，可以在实验室和指导学生页面查看。"
            />
          </p>
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/advisees" className="link-underline font-medium text-ember">
              <T en="Capstones & advisees →" zh="毕业项目与指导学生 →" />
            </Link>
            <Link href="/lab" className="link-underline font-medium text-ember">
              <T en="CLUEs Lab →" zh="CLimate and Urban Environments（CLUEs）实验室 →" />
            </Link>
          </p>

          <StatementDraft />
        </div>
      </section>
    </>
  );
}
