/**
 * Teaching page data.
 *
 * SOURCE OF TRUTH: docs/teaching-sources.md (verified 2026-10-09) plus the
 * syllabi it cites, and the existing "Teaching Experience" section of
 * cv/CV_Kangning_Huang.tex. Do NOT add course codes, terms, awards, student
 * names, or URLs that are not evidenced there.
 *
 * Official Chinese course titles and the official Chinese name of the award
 * have not been verified, so ZH mode keeps the English proper names and only
 * translates descriptions.
 */

export interface Bilingual {
  en: string;
  zh: string;
}

export interface Course {
  code: string;
  /** Official English title as it appears on the syllabus. */
  title: string;
  /** Official Chinese title when verified (e.g. NYU Shanghai Chinese pages). */
  titleZh?: string;
  /** Terms evidenced by the CV and/or a syllabus. */
  terms: Bilingual;
  /** Course-level role, e.g. CORE gateway. Optional; only if in syllabus. */
  tag?: Bilingual;
  summary: Bilingual;
  /** Assessment / activity highlights, only as written in the syllabus. */
  highlights: Bilingual[];
  /**
   * Public syllabus link, only where Ken already publishes one (CV links).
   * These point at earlier-term versions; see PR notes.
   */
  syllabusUrl?: string;
  /** Recognition attached to this course (verified, with attribution). */
  recognition?: Bilingual;
}

export const COURSES: Course[] = [
  {
    code: "SOCS-SHU 135",
    title: "Environment and Society",
    terms: { en: "Fall 2026", zh: "2026年秋季" },
    tag: { en: "CORE STS gateway", zh: "CORE STS 入门课" },
    summary: {
      en: "Students explore environmental thought through six structured debate cycles. The debates cover nature, environmental movements, population, the commons, values, and technological futures.",
      zh: "学生通过六轮结构化辩论学习不同的环境思想。辩题涉及自然、环保运动、人口、公地、价值观和技术未来，重点是理解不同立场及其依据。",
    },
    highlights: [
      {
        en: "Six two-week debate cycles with randomly assigned For/Against teams",
        zh: "六轮辩论，每轮两周，随机分配正反方",
      },
      {
        en: "IPAT quantitative lab and a classroom Public Goods Game",
        zh: "IPAT 定量实验课与课堂公共物品博弈",
      },
      {
        en: "Final project applying course concepts to a real-world environmental issue",
        zh: "期末项目：运用课程所学分析一个现实环境问题",
      },
    ],
  },
  {
    code: "SOCS-SHU 204",
    title: "Environmental System Science",
    terms: { en: "2022–2025 · Fall 2026", zh: "2022至2025年 · 2026年秋季" },
    tag: { en: "Environmental Studies gateway", zh: "环境研究方向入门课" },
    summary: {
      en: "This course introduces environmental systems through energy and material flows, system dynamics, ecological footprints, and environmental change. It is one of two gateway courses in the Environmental Studies track.",
      zh: "这门课从系统科学出发，介绍能量与物质流动、系统动力学、生态足迹和环境变化。它是社会科学环境研究方向的两门入门课之一。",
    },
    highlights: [
      {
        en: "Six problem sets: population, predator–prey dynamics, S-curve growth, IPAT, personal energy footprint, and resource-constrained growth",
        zh: "六次习题：人口、捕食者与猎物、S 型增长、IPAT、个人能源足迹，以及资源约束下的增长",
      },
      {
        en: "Mid-term presentation on the climate, biome, and environmental changes of a student's hometown",
        zh: "期中展示：分析家乡的气候、生物群系和环境变化",
      },
      {
        en: "Final presentation and report on a contemporary environmental challenge",
        zh: "期末展示与报告，分析一个当下的环境挑战",
      },
    ],
    syllabusUrl:
      "https://docs.google.com/document/d/e/2PACX-1vSnLH1DcYAtjhmYVq1k46Zb8-aDYIfBsZWCInBYVJuLiYnjSO0hxBMZq8wBz-8n4p8Utt2J9_5mUK03/pub",
  },
  {
    code: "SOCS-SHU 208",
    title: "Cities at a Crossroads: Environmental Challenges and Opportunities in Cities",
    /** Chinese title as used on shanghai.nyu.edu/cn TEA coverage. */
    titleZh: "城市十字路口（城市的环境挑战与机遇）",
    terms: { en: "2022–2025 · Spring 2026", zh: "2022至2025年 · 2026年春季" },
    summary: {
      en: "Students examine urban environmental challenges and opportunities involving energy, heat, water, food, materials, and land. They learn to analyze spatial data and develop policy projects focused on cities.",
      zh: "这门课研究城市在能源、高温、水、食物、材料和土地方面的环境挑战与机遇。学生学习分析空间数据，并完成以城市为对象的政策项目。",
    },
    highlights: [
      { en: "Weekly analytical reports", zh: "每周分析报告" },
      { en: "Field-trip report", zh: "实地考察报告" },
      {
        en: "Group final city policy report (Tableau / Google Earth Engine optional)",
        zh: "期末以小组为单位撰写城市政策报告（可选用 Tableau / Google Earth Engine）",
      },
    ],
    syllabusUrl:
      "https://docs.google.com/document/d/e/2PACX-1vTrhXo9OGMOFASQhge4gDUPwET_PLufDlfaA2kwZhVEZIc9VCMPkc0FkQl9ORC8Z2VgpaxWGg1gcrUW/pub",
    recognition: {
      en: "Shanghai City-Level Undergraduate Key Course (2025)",
      zh: "上海市本科重点课程（2025年）",
    },
  },
];

/** Signature methods across courses — from 3rd-year review teaching statement (v3),
 * TEA statement / packet, SOCS-SHU 135/204/208 syllabi, and the NYU Shanghai TEA interview.
 * Do not invent practices not evidenced in those sources. See docs/teaching-sources.md.
 */
export interface SignatureMethod {
  title: Bilingual;
  body: Bilingual;
  /** Optional course attribution, shown as a quiet tag under the title. */
  courses?: Bilingual;
}

export const SIGNATURE_METHODS: SignatureMethod[] = [
  {
    title: { en: "Assigned-side debates", zh: "指定立场辩论" },
    courses: { en: "SOCS-SHU 135", zh: "SOCS-SHU 135" },
    body: {
      en: "The course has six debate cycles. In each cycle, students are randomly assigned to For and Against teams, and everyone must speak. Defending a position they did not choose helps students understand the arguments behind it.",
      zh: "全学期有六轮辩论。每轮随机分配正反方，每位学生都必须发言。为自己未必认同的立场辩护，可以帮助学生理解这一立场背后的论据。",
    },
  },
  {
    title: { en: "Device-free floor", zh: "无设备辩论现场" },
    courses: { en: "SOCS-SHU 135", zh: "SOCS-SHU 135" },
    body: {
      en: "Evidence slides must be finalized 24 hours before each debate. Students may use any tools, including AI, during preparation. During the debate, they speak and respond without electronic devices or outside assistance.",
      zh: "每场辩论前 24 小时，证据幻灯片必须定稿。准备阶段可以使用任何工具，包括 AI。辩论现场不使用电子设备，学生须独立发言和应辩。",
    },
  },
  {
    title: { en: "Oral defenses", zh: "口头答辩" },
    courses: {
      en: "Across courses · TEA interview",
      zh: "各课程 · TEA 专访",
    },
    body: {
      en: "After an assignment, students get about ten minutes with devices off and answer concrete questions about their own work: Why this way? How did you get this answer? Even if AI helped produce the artifact, they still have to understand and explain it.",
      zh: "作业交完后，学生关掉设备，用大约十分钟回答关于自己工作的具体问题：为什么这样做？这个答案是怎么来的？即便 AI 参与过产出，他们仍须真正理解并能讲清楚。",
    },
  },
  {
    title: { en: "Scaffolded analytical reports", zh: "递进分析报告" },
    courses: { en: "SOCS-SHU 208", zh: "SOCS-SHU 208" },
    body: {
      en: "Students write weekly reports on energy, heat, water, land, and waste. Each report requires them to define a problem, evaluate evidence, identify trade-offs, and recommend an action. The problems become more complex, but the core skills remain the same.",
      zh: "学生每周围绕能源、高温、水、土地和废弃物撰写分析报告。每份报告都要求他们界定问题、评估证据、分析取舍，并提出行动建议。随着课程推进，问题的复杂度增加，但训练的核心能力保持不变。",
    },
  },
  {
    title: { en: "Checking AI claims against field observations", zh: "用实地观察核查 AI 的说法" },
    courses: { en: "SOCS-SHU 208", zh: "SOCS-SHU 208" },
    body: {
      en: "Students combine building footprints from satellite data with floor counts collected in the field. They then compare AI descriptions of urban density and street life with what they observe, including how people move and use public spaces. AI can assist with calculations, but evaluating a place still requires direct observation.",
      zh: "学生将卫星数据中的建筑轮廓与实地调查的楼层数结合，分析城市密度。他们再把 AI 对密度和街道活动的描述，与现场观察进行比较，包括人们如何出行和使用公共空间。AI 可以辅助计算，但判断一个地方的实际情况仍需要实地观察。",
    },
  },
  {
    title: { en: "Systems-dynamics problem sets", zh: "系统动力学习题" },
    courses: { en: "SOCS-SHU 204", zh: "SOCS-SHU 204" },
    body: {
      en: "Six problem sets progress from exponential growth to feedback under resource constraints. Students build and run simple models, then apply the same systems approach to their mid-term and final analyses of environmental change.",
      zh: "六次习题从指数增长逐步过渡到资源约束下的系统反馈。学生搭建并运行简单模型，再将相同的系统分析方法用于期中和期末的环境变化研究。",
    },
  },
  {
    title: { en: "Structured participation", zh: "结构化发言" },
    courses: {
      en: "Across courses · 3rd-year review",
      zh: "各课程 · 三年期中评估",
    },
    body: {
      en: "Device-minimal lecture segments, then laptops back for modeling. Turn-and-share and assigned-role formats make speaking turns more even, so a few voices do not carry the room alone.",
      zh: "讲授段落尽量少用设备，建模环节再开电脑。同伴互说与指定角色，让发言更均匀，避免少数几个人撑起整堂课。",
    },
  },
  {
    title: { en: "Motivation through fear and hope", zh: "用风险与希望来激励" },
    courses: {
      en: "Across courses · TEA interview",
      zh: "各课程 · TEA 专访",
    },
    body: {
      en: "One thing AI does not easily replace is motivation. I engage students through the risks of climate change and through concrete hope—new technologies and ways of designing cities that could help.",
      zh: "AI 不太容易替代的一件事是激励。我既让学生看到气候变化的风险，也让他们看到具体的希望——新技术与新的城市设计方式如何可能帮上忙。",
    },
  },
];

export const TEA_AWARD = {
  name: "NYU Shanghai Teaching Excellence Award",
  /** Official Chinese name as used on shanghai.nyu.edu/cn TEA coverage. */
  nameZh: "上海纽约大学卓越教学奖",
  cycle: "2025–2026",
  programUrl: "https://shanghai.nyu.edu/content/nyu-shanghai-teaching-excellence-award",
  storyUrlEn: "https://shanghai.nyu.edu/is/ai-age-how-do-great-teachers-teach",
  storyUrlZh: "https://shanghai.nyu.edu/cn/is/ai-age-how-do-great-teachers-teach",
} as const;
