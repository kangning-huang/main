import T from "@/components/T";

/**
 * DRAFT — for Ken to edit. Drafted from syllabus themes (SOCS-SHU 135 / 204 /
 * 208) and the TEA citation themes in docs/teaching-sources.md. Remove the
 * DRAFT banner once Ken has rewritten/approved the text.
 */
export default function StatementDraft() {
  return (
    <section
      id="statement"
      aria-labelledby="statement-heading"
      className="mt-16 scroll-mt-24 rounded-xl border border-dashed border-ember/50 bg-paper-warm p-6 md:p-8"
    >
      <p className="inline-block rounded bg-ember px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.15em] text-paper">
        DRAFT — for Ken to edit
      </p>
      <h2 id="statement-heading" className="mt-3 font-display text-2xl text-ink">
        <T en="Teaching statement" zh="教学理念" />
      </h2>
      <div className="mt-4 max-w-3xl text-[15px] leading-[1.8] text-ink-muted">
        <T
          en={
            <p>
              I teach environmental studies as a set of live arguments rather than settled facts. In{" "}
              <em>Environment and Society</em>, students argue six of the field&rsquo;s foundational
              questions from sides they did not choose, because defending an unfamiliar position is the
              fastest way to understand it, and anonymous ballots before and after each debate show how
              evidence moves a room. In <em>Environmental System Science</em>, the same habit becomes
              quantitative: stocks, flows, feedbacks, and footprints explain why environmental problems
              are nonlinear and hard to solve. In <em>Cities at a Crossroads</em>, students treat a
              city&rsquo;s energy, heat, water, food, material, and land challenges as opportunities,
              diagnosing them with spatial data and proposing evidence-based policy. I also draw a
              deliberate line around AI: in <em>Environment and Society</em>, students may use any tool
              to prepare, but they debate and reflect live and unassisted. The goal is judgment that
              outlasts the course.
            </p>
          }
          zh={
            <p>
              我把环境研究当作一组仍在进行的争论来教，而不是一套既定的结论。在
              <em>Environment and Society</em>
              中，学生要从并非自己选择的立场出发，辩论这一领域的六个基础问题，因为为陌生的立场辩护是理解它最快的方式；每场辩论前后的匿名投票，则让大家看到证据如何改变一屋子人的看法。在
              <em>Environmental System Science</em>
              中，同样的思维习惯变得定量化：存量、流量、反馈与足迹，解释了环境问题为何是非线性的、为何难以解决。在
              <em>Cities at a Crossroads</em>
              中，学生把城市在能源、高温、水、食物、材料与土地方面的挑战视为机遇，用空间数据诊断问题，并提出基于证据的政策。我也为
              AI 划出一条清晰的界线：在 <em>Environment and Society</em>
              中，准备阶段可以使用任何工具，但现场辩论与反思必须独立完成。我希望学生收获的，是课程结束后依然有用的判断力。
            </p>
          }
        />
      </div>
    </section>
  );
}
