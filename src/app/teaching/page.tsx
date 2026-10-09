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
              en="I teach environmental studies at NYU Shanghai, from a debate-driven introduction to environmental thought, through a systems-science gateway, to a course on the environmental challenges and opportunities of cities."
              zh="我在上海纽约大学讲授环境研究课程：从以辩论为主线的环境思想导论，到系统科学视角的入门课，再到关注城市环境挑战与机遇的专题课。"
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
              zh="课程阅读材料通过 Brightspace 向选课学生发放，不在本站公开。"
            />
          </p>

          {/* ── Signature methods ── */}
          <h2 id="methods" className="mt-16 scroll-mt-24 font-display text-2xl text-ink">
            <T en="Signature methods" zh="教学方法" />
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-ink-faint">
            <T
              en="From the Environment and Society (SOCS-SHU 135) syllabus."
              zh="摘自 Environment and Society（SOCS-SHU 135）课程大纲。"
            />
          </p>
          <SignatureMethods />

          {/* ── Student work ── */}
          <h2 id="student-work" className="mt-16 scroll-mt-24 font-display text-2xl text-ink">
            <T en="Student work" zh="学生作品" />
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-muted">
            <T
              en="Beyond the classroom, I supervise undergraduate capstones and research projects through the CLUEs Lab. Projects, placements, and student honors are listed on the lab and advisee pages."
              zh="在课堂之外，我通过 CLUEs 实验室指导本科毕业论文与研究项目。项目、去向与学生荣誉详见实验室与指导学生页面。"
            />
          </p>
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/advisees" className="link-underline font-medium text-ember">
              <T en="Capstones & advisees →" zh="毕业论文与指导学生 →" />
            </Link>
            <Link href="/lab" className="link-underline font-medium text-ember">
              <T en="CLUEs Lab →" zh="CLUEs 实验室 →" />
            </Link>
          </p>

          <StatementDraft />
        </div>
      </section>
    </>
  );
}
