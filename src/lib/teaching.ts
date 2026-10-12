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
      en: "Introduces environmental thought through six structured debate cycles on contested motions: nature, movements, population, the commons, values, and technological futures.",
      zh: "课程用六轮结构化辩论带学生认识环境思想。辩题围绕自然、环保运动、人口、公地、价值观与技术未来展开，每个议题都有值得讨论的分歧。",
    },
    highlights: [
      {
        en: "Six two-week debate cycles with randomly assigned For/Against sides",
        zh: "六轮辩论，每轮两周，随机分配正反方",
      },
      {
        en: "IPAT quantitative lab and a classroom Public Goods Game",
        zh: "IPAT 定量实验课与课堂公共物品博弈",
      },
      {
        en: "Final project applying course ideas to one real-world environmental issue",
        zh: "期末项目，用课程所学分析一个现实环境问题",
      },
    ],
  },
  {
    code: "SOCS-SHU 204",
    title: "Environmental System Science",
    terms: { en: "2022–2025 · Fall 2026", zh: "2022至2025年 · 2026年秋季" },
    tag: { en: "Environmental Studies gateway", zh: "环境研究方向入门课" },
    summary: {
      en: "A systems-science survey of energy and material flows, dynamics, footprints, and environmental change: one of the two gateway courses in the Environmental Studies track.",
      zh: "这门课从系统科学出发，介绍能量与物质流动、系统动力学、生态足迹和环境变化，是社会科学环境研究方向的两门入门课之一。",
    },
    highlights: [
      {
        en: "Six problem sets: population, prey–predator, S-curve growth, IPAT, personal energy footprint, resource-constrained growth",
        zh: "六次习题，涵盖人口、捕食者与猎物、S 型增长、IPAT、个人能源足迹和资源约束下的增长",
      },
      {
        en: "Mid-term presentation on the climate, biome, and environmental change of a student's hometown",
        zh: "期中展示，介绍家乡的气候、生物群系和环境变化",
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
      en: "Urban environmental challenges and opportunities across energy, heat, water, food, materials, and land, with spatial data skills and city-focused policy projects.",
      zh: "城市在能源、高温、水、食物、材料与土地上面临哪些环境挑战，又有哪些机遇？课程围绕这些问题展开，带学生练习处理空间数据，并完成以城市为对象的政策项目。",
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
      en: "Six debate cycles. Each cycle the class is randomly split into For and Against teams, and every member speaks. Defending a position you didn't choose is the fastest way to understand it.",
      zh: "全学期共六轮辩论，每轮随机分为正反两队，每个人都要发言。试着为自己未必认同的立场辩护，是理解这一立场最快的方式。",
    },
  },
  {
    title: { en: "Pre- and post-debate ballots", zh: "辩论前后匿名投票" },
    courses: { en: "SOCS-SHU 135", zh: "SOCS-SHU 135" },
    body: {
      en: "Everyone records an honest position on paper, anonymously, before and after each debate. The side that moves the ballot “wins”; argument quality is graded separately by rubric.",
      zh: "每场辩论前后，所有人都在纸上匿名写下自己的真实立场。哪一方让投票转向自己，哪一方就“获胜”；论证质量另按评分标准评定。",
    },
  },
  {
    title: { en: "Device-free floor", zh: "无设备辩论现场" },
    courses: { en: "SOCS-SHU 135", zh: "SOCS-SHU 135" },
    body: {
      en: "Evidence decks freeze 24 hours before each debate, and the floor is device-free. Preparation may use any tool, including AI; performance is live and unassisted.",
      zh: "证据幻灯片在每场辩论前 24 小时定稿，此后不再修改。准备时可以使用任何工具，包括 AI；辩论现场不使用电子设备，发言与应辩须独立完成。",
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
      en: "Weekly reports follow the course modules—energy, heat, water, land, waste—and rehearse the same skills each time: frame the problem, weigh evidence, name tradeoffs, and say what you would do. Complexity rises; the competencies stay fixed.",
      zh: "每周报告随课程模块推进——能源、高温、水、土地、废弃物——反复练习同一套能力：界定问题、权衡证据、写明取舍、说出你会怎么做。难度上升，能力要求保持不变。",
    },
  },
  {
    title: { en: "Field observation vs. AI claims", zh: "实地观察核对 AI 说法" },
    courses: { en: "SOCS-SHU 208", zh: "SOCS-SHU 208" },
    body: {
      en: "Teams combine satellite footprints with floor counts they collect on the street, then check fluent AI descriptions of density and street life against what people actually do. AI can help with calculation; judgment about a place still needs observation.",
      zh: "小组把卫星建筑足迹与实地楼层计数合在一起，再用街上人们实际怎么走、怎么用公共空间，去核对 AI 对密度与街景的流畅描述。计算可以借助 AI；对具体地点的判断仍须靠观察。",
    },
  },
  {
    title: { en: "Systems-dynamics problem sets", zh: "系统动力学习题" },
    courses: { en: "SOCS-SHU 204", zh: "SOCS-SHU 204" },
    body: {
      en: "Six problem sets move from exponential growth to resource-constrained feedbacks. Students build and run simple models, then carry that systems habit into mid-term and final analyses of real environmental change.",
      zh: "六次习题从指数增长走到资源约束下的反馈。学生搭建并运行简单模型，再把这种系统习惯带进期中与期末对现实环境变化的分析。",
    },
  },
  {
    title: { en: "IPAT lab", zh: "IPAT 实验课" },
    courses: { en: "SOCS-SHU 135 · 204", zh: "SOCS-SHU 135 · 204" },
    body: {
      en: "In pairs, students compute emissions for two countries and project them to 2050 under three scenarios. Their results become evidence for the population-and-consumption debate.",
      zh: "学生两人一组，计算两个国家的排放量，再按三种情景推算到 2050 年。计算结果直接用于“人口与消费”辩论，作为论证证据。",
    },
  },
  {
    title: { en: "Public Goods Game", zh: "公共物品博弈" },
    courses: { en: "SOCS-SHU 135", zh: "SOCS-SHU 135" },
    body: {
      en: "A multi-round classroom game, first anonymous and then with communication. The class's own cooperation data feeds the debate on the commons.",
      zh: "课堂博弈分多轮进行，先匿名，再允许交流。全班的合作数据会成为“公地”辩论的证据。",
    },
  },
  {
    title: { en: "Chart openers & one-minute closers", zh: "图表开场，一分钟收尾" },
    courses: { en: "SOCS-SHU 135", zh: "SOCS-SHU 135" },
    body: {
      en: "Each class opens with an unlabeled environmental chart to guess, reveal, and critique, and closes with a one-sentence statement of where you now stand on the motion.",
      zh: "每节课先看一张隐去标注的环境图表，猜它讲了什么，揭晓后再一起评析。下课前，每人用一句话写下自己对辩题的当前立场，以及是什么让自己改变了看法。",
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
