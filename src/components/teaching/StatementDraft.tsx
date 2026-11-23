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
                I design my courses around what students should be able to do after the semester ends. They should be able to frame a problem, connect ideas across disciplines, evaluate evidence under uncertainty, and make recommendations that acknowledge trade-offs. My teaching emphasizes systems thinking, data-driven analysis, and interdisciplinary synthesis. Assignments build on one another so students can practice these skills in increasingly complex problems. As generative AI changes how students learn and work, I also emphasize their ability to adapt and learn new methods.
              </p>
              <p>
                In <em>Environmental System Science</em>, students study feedbacks, energy and material flows, and system-dynamics models. In <em>Cities at a Crossroads</em>, they examine urban problems involving energy, heat, water, and land. They use field observations and other evidence to develop policy recommendations. Students may use generative AI as a technical assistant, but they must check its outputs against evidence and observation. When an assessment measures independent judgment, students work live and without AI assistance. My goal is for students to leave the classroom better able to ask questions, choose appropriate methods, evaluate evidence, and act on the socio-environmental systems in which they live.
              </p>
            </>
          }
          zh={
            <>
              <p>
                我设计课程时，首先考虑学生在学期结束后应该具备哪些能力。我希望他们能够界定问题，联系不同学科的知识，在不确定性下评估证据，并在提出建议时明确其中的权衡。我的教学围绕三个方面展开：系统思维、数据驱动分析和跨学科综合。课程作业逐步增加难度，让学生反复练习这些能力。生成式 AI 正在改变学习和工作的方式，因此我也重视学生适应变化、学习新方法的能力。
              </p>
              <p>
                在 <em>Environmental System Science</em> 中，学生学习系统反馈、能量与物质流动，以及系统动力学模型。在 <em>Cities at a Crossroads</em> 中，他们分析城市在能源、高温、水和土地等方面的实际问题，并结合实地观察和其他证据提出政策建议。
              </p>
              <p>
                学生可以使用生成式 AI 辅助技术工作，但必须核查其输出，并用证据和实际观察检验结论。在考查独立判断能力的环节，学生需要在现场独立完成任务，不使用 AI 辅助。我希望学生离开课堂后，能够更好地提出问题、选择合适的方法、判断证据，并参与解决他们所处社会—环境系统中的实际问题。
              </p>
            </>
          }
        />
      </div>
    </section>
  );
}
