import T from "@/components/T";

/**
 * Website teaching statement distilled from Ken's own materials:
 * - 3rd Year Review - Teaching - v3 (Drive Doc 1xdqi39mf5CMiZ24agZhpoPUBZ5GCDONP8LjyOK0dh0A)
 * - Teaching_Statement_TEA_2026_vC_2pg.md (Drive 1HQ1k1-riBOjsTJs-T5oOQb0c2Ppjplqp)
 * First person; no invented claims. See docs/teaching-sources.md.
 */
export default function StatementDraft() {
  return (
    <section
      id="statement"
      aria-labelledby="statement-heading"
      className="mt-16 scroll-mt-24 rounded-xl border border-rule bg-paper-warm p-6 md:p-8"
    >
      <h2 id="statement-heading" className="font-display text-2xl text-ink">
        <T en="Teaching statement" zh="教学理念" />
      </h2>
      <div className="mt-4 max-w-3xl space-y-4 text-[15px] leading-[1.8] text-ink-muted">
        <T
          en={
            <>
              <p>
                I teach to cultivate systems thinking and adaptive learning in an era reshaped by
                generative AI. Each course is designed backward from what students should still be able
                to do after the semester ends: build analytical frameworks, connect ideas across
                disciplines, evaluate evidence under uncertainty, and communicate recommendations with
                explicit tradeoffs. Learning outcomes rest on three pillars—systems thinking,
                data-driven analysis, and interdisciplinary synthesis—and assignments form progressive
                scaffolds rather than isolated tasks.
              </p>
              <p>
                In <em>Environmental System Science</em>, students work through feedbacks,
                energy–material flows, and system dynamics models. In <em>Cities at a Crossroads</em>,
                they diagnose real urban challenges—energy, heat, water, land—and propose
                evidence-based policy, including through fieldwork. I treat generative AI as part of
                the learning environment: students may use it as a technical assistant, but they must
                validate outputs, check claims against observation, and perform live, unassisted when
                judgment is what matters. The goal is not only that students learn content, but that
                they leave more capable of framing questions, choosing methods with intention, and
                shaping the socio-environmental systems they will inhabit.
              </p>
            </>
          }
          zh={
            <>
              <p>
                我的教学旨在培养学生的系统思维与自适应学习能力，以应对生成式 AI
                重塑的时代。每门课都从“学期结束后学生仍应具备的能力”倒推设计：建构分析框架、跨学科联结观点、在不确定性下评估证据，并以明确的权衡来表达建议。学习目标围绕三大支柱——系统思维、数据驱动分析、跨学科综合——作业是层层递进的支架，而不是彼此孤立的任务。
              </p>
              <p>
                在 <em>Environmental System Science</em>{" "}
                中，学生梳理反馈、能量–物质流动与系统动力学模型。在{" "}
                <em>Cities at a Crossroads</em>{" "}
                中，他们诊断城市在能源、高温、水与土地等方面的真实挑战，并通过实地考察等工作提出基于证据的政策方案。我把生成式
                AI
                纳入学习环境：学生可以把它当作技术助手，但必须核验输出、用观察检验主张，并在判断力最为关键的环节独立现场完成。目标不只是让学生学到内容，更是让他们离开课堂时更有能力提出问题、有意识地选择方法，并参与塑造他们将生活于其中的社会–环境系统。
              </p>
            </>
          }
        />
      </div>
    </section>
  );
}
