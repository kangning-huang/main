/**
 * Home-page Collaborators + Sponsors.
 * Personal URLs are faculty pages; logos are institution/org marks for acknowledgment.
 */

export type PartnerPerson = {
  name: string;
  nameZh?: string;
  href: string;
  org: string;
  orgZh?: string;
  logo: string;
};

export type PartnerOrg = {
  name: string;
  nameZh?: string;
  href: string;
  logo: string;
};

/** Ordered by prominence (Ken-curated shortlist; Ciais out; Zhan in). */
export const COLLABORATORS: PartnerPerson[] = [
  {
    name: "Karen C. Seto",
    nameZh: "Karen C. Seto",
    href: "https://environment.yale.edu/directory/faculty/karen-seto",
    org: "Yale",
    orgZh: "耶鲁大学",
    logo: "/logos/yale.svg",
  },
  {
    name: "Michelle L. Bell",
    nameZh: "Michelle L. Bell",
    href: "https://ysph.yale.edu/profile/michelle-bell/",
    org: "Yale School of Public Health",
    orgZh: "耶鲁大学公共卫生学院",
    logo: "/logos/yale.svg",
  },
  {
    name: "Xia Li",
    nameZh: "黎夏",
    href: "https://pure.ecnu.edu.cn/zh/persons/xia-li-2/",
    org: "East China Normal University",
    orgZh: "华东师范大学",
    logo: "/logos/ecnu.png",
  },
  {
    name: "Xuhui Lee",
    nameZh: "李旭辉",
    href: "https://environment.yale.edu/directory/faculty/xuhui-lee",
    org: "Yale",
    orgZh: "耶鲁大学",
    logo: "/logos/yale.svg",
  },
  {
    name: "Xiaoping Liu",
    nameZh: "刘小平",
    href: "https://gp.sysu.edu.cn/en/teacher/174",
    org: "Sun Yat-sen University",
    orgZh: "中山大学",
    logo: "/logos/sysu.png",
  },
  {
    name: "Robert I. McDonald",
    nameZh: "Robert I. McDonald",
    href: "https://www.nature.org/en-us/about-us/who-we-are/our-people/rob-mcdonald-lead-scientist/",
    org: "The Nature Conservancy",
    orgZh: "大自然保护协会",
    logo: "/logos/tnc.svg",
  },
  {
    name: "Wenfeng Zhan",
    nameZh: "占文凤",
    href: "https://sgos.nju.edu.cn/zwf/list.htm",
    org: "Nanjing University",
    orgZh: "南京大学",
    logo: "/logos/nju.png",
  },
  {
    name: "Yimin Chen",
    nameZh: "陈逸敏",
    href: "https://gp.sysu.edu.cn/en/teacher/ChenYimin",
    org: "Sun Yat-sen University",
    orgZh: "中山大学",
    logo: "/logos/sysu.png",
  },
  {
    name: "Brian Stone Jr.",
    nameZh: "Brian Stone Jr.",
    href: "https://planning.gatech.edu/people/brian-stone",
    org: "Georgia Tech",
    orgZh: "佐治亚理工学院",
    logo: "/logos/gatech.svg",
  },
  {
    name: "Chao Ren",
    nameZh: "任超",
    href: "https://www.arch.hku.hk/staff/dla/ren-chao/",
    org: "University of Hong Kong",
    orgZh: "香港大学",
    logo: "/logos/hku.png",
  },
  {
    name: "Wei-Qiang Chen",
    nameZh: "陈伟强",
    href: "https://people.ucas.ac.cn/~wqchen?language=en",
    org: "Chinese Academy of Sciences",
    orgZh: "中国科学院",
    logo: "/logos/cas.png",
  },
  {
    name: "ChengHe Guan",
    nameZh: "关成贺",
    href: "https://shanghai.nyu.edu/academics/faculty/directory/chenghe-guan",
    org: "NYU Shanghai",
    orgZh: "上海纽约大学",
    logo: "/logos/nyu-shanghai.svg",
  },
  {
    name: "Mingzhen Lu",
    nameZh: "陆明臻",
    href: "https://mingzhenlu-lab.com/",
    org: "New York University",
    orgZh: "纽约大学",
    logo: "/logos/nyu.svg",
  },
  {
    name: "Jiayong Liang",
    nameZh: "梁佳勇",
    href: "https://shanghai.nyu.edu/academics/faculty/directory/jiayong-liang",
    org: "NYU Shanghai",
    orgZh: "上海纽约大学",
    logo: "/logos/nyu-shanghai.svg",
  },
  {
    name: "Olga Wilhelmi",
    nameZh: "Olga Wilhelmi",
    href: "https://gis.ucar.edu/directory/olga-wilhelmi",
    org: "NCAR",
    orgZh: "美国国家大气研究中心",
    logo: "/logos/ncar.png",
  },
];

/** Sponsors Ken kept (NSF and NSFC/973 out). */
export const SPONSORS: PartnerOrg[] = [
  {
    name: "NASA",
    nameZh: "NASA",
    href: "https://www.nasa.gov/",
    logo: "/logos/nasa.svg",
  },
  {
    name: "NCAR ASP",
    nameZh: "NCAR 高级研究项目",
    href: "https://edec.ucar.edu/advanced-study-program/postdoctoral-fellowship-program",
    logo: "/logos/ncar.png",
  },
  {
    name: "Google Award for Inclusion Research",
    nameZh: "Google Award for Inclusion Research",
    href: "https://research.google/programs-and-events/past-programs/award-for-inclusion-research-program/",
    logo: "/logos/google.svg",
  },
  {
    name: "Shanghai Leading Talents",
    nameZh: "上海市领军人才",
    href: "https://english.shanghai.gov.cn/",
    logo: "/logos/shanghai.png",
  },
  {
    name: "Yale Institute for Biospheric Studies",
    nameZh: "耶鲁生物圈研究所（YIBS）",
    href: "https://yibs.yale.edu/",
    logo: "/logos/yale.svg",
  },
  {
    name: "Yale Hixon Center",
    nameZh: "耶鲁 Hixon 中心",
    href: "https://hixon.yale.edu/",
    logo: "/logos/yale.svg",
  },
  {
    name: "Yale Tropical Resources Institute",
    nameZh: "耶鲁热带资源研究所（TRI）",
    href: "https://tri.yale.edu/",
    logo: "/logos/yale.svg",
  },
  {
    name: "NYU Arts & Science Fund for Research on China",
    nameZh: "纽约大学文理学院中国研究基金",
    href: "https://as.nyu.edu/academics/research-centers.html",
    logo: "/logos/nyu.svg",
  },
  {
    name: "NYU Climate Initiative",
    nameZh: "纽约大学气候倡议",
    href: "https://www.nyu.edu/academics/interdisciplinary-initiatives/climate.html",
    logo: "/logos/nyu.svg",
  },
];
