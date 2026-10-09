/**
 * Build-time accessors for src/data/influence.json (OpenAlex Reach snapshot).
 * Every number on /reach comes from this file. Never mix in Google Scholar data.
 * Schema reach-v2-c2-f5-h2: dual views (all | lead) + adaptive taxonomy.
 */
import influenceData from "@/data/influence.json";
import doiConfig from "../../data/influence/dois.json";

export interface InfluencePaper {
  doi: string;
  openalexId: string;
  title: string;
  venue: string | null;
  year: number;
  short: string;
  theme: string;
  themeSource: string;
  lens: "lead" | "coauthor";
  early: boolean;
  ownField: { id: string; name: string };
  ownTopic?: { id: string; name: string } | null;
  openalexCitedByCount: number;
  citingFetched: number;
  selfCitationsRemoved: number;
  citingNonSelf: number;
  byYear: Record<string, number>;
}

export interface AdaptiveNode {
  level: "field" | "subfield" | "topic" | "other";
  id: string;
  name: string;
  path: string[];
  citingWorks: number;
  share: number;
  childrenOf: string | null;
  examples: {
    openalexId: string;
    doi: string | null;
    title: string;
    year: number;
    venue: string | null;
    openalexCitedByCount: number;
  }[];
  keywords: { name: string; count: number }[];
}

export interface InfluenceView {
  label: "all" | "lead" | string;
  totals: {
    papers: number;
    leadPapers: number;
    coauthorPapers: number;
    openalexCitedByCountSum: number;
    citingLinksFetched: number;
    selfCitationsRemoved: number;
    selfCitationsRemovedBy: Record<string, number>;
    citingLinksNonSelf: number;
    uniqueCitingWorks: number;
    citingWorksOutsideOwnField: number;
    citingWorksOutsideOwnTopics: number;
    fieldsCount: number;
    countriesCount: number;
    leadCitingShare: number;
  };
  adaptive: AdaptiveNode[];
  homepageDistant: { a: string | null; b: string | null; aId?: string | null; bId?: string | null };
  fields: { id: string; name: string; citingWorks: number; topSubfields: { name: string; citingWorks: number }[] }[];
  flows: { theme: string; field: string; citingWorks: number }[];
  institutionTypes: { type: string; citingWorks: number; institutions: number }[];
  topNonAcademicInstitutions: { id: string; name: string; type: string; country: string | null; citingWorks: number }[];
  countries: { code: string; citingWorks: number; expected: number | null; ratio: number | null }[];
  topCitingWorks: {
    openalexId: string;
    doi: string | null;
    title: string;
    year: number;
    venue: string | null;
    type: string;
    openalexCitedByCount: number;
    field: string;
    subfield?: string | null;
    topic?: string | null;
    builds_on: string[];
  }[];
  growth: Record<string, Record<string, number>>;
  growthDatesDropped: number;
}

export interface InfluenceData {
  meta: {
    mode: "live" | "sample";
    source: "OpenAlex";
    sourceUrl: string;
    asOf: string;
    generatedAt: string;
    schema?: string;
    defaultView?: "all" | "lead";
    autoFlippedToLead?: boolean;
    coauthorOnlyCitingShare?: number;
    lens: string;
    doisFileSha256?: string;
    selfCitationRule: string;
    adaptiveRule?: string;
    outsideOwnTopicsRule?: string;
    countryBaseline: string;
    earlyFromYear: number;
    homeTopicCount?: number;
    homeSubfields?: string[];
    growthDatesDropped?: number;
    requests?: number;
    skipped?: Record<string, string>;
  };
  totals: InfluenceView["totals"];
  papers: InfluencePaper[];
  views: {
    all: InfluenceView;
    lead: InfluenceView;
  };
  // legacy flat fields may be absent in v2
  fields?: InfluenceView["fields"];
  flows?: InfluenceView["flows"];
  institutionTypes?: InfluenceView["institutionTypes"];
  topNonAcademicInstitutions?: InfluenceView["topNonAcademicInstitutions"];
  countries?: InfluenceView["countries"];
  topCitingWorks?: InfluenceView["topCitingWorks"];
  growth?: InfluenceView["growth"];
}

export interface Theme {
  id: string;
  en: string;
  zh: string;
}

export const influence = influenceData as unknown as InfluenceData;
export const THEMES: Theme[] = doiConfig.themes;

export const THEME_COLORS: Record<string, string> = {
  "urban-futures": "#00909a",
  heat: "#c74b16",
  "flood-coasts": "#5b4b9a",
  "scaling-form": "#94700f",
};

export const isSample = influence.meta.mode !== "live";

export type ReachLens = "all" | "lead";

export function getView(lens: ReachLens): InfluenceView {
  if (influence.views?.[lens]) return influence.views[lens];
  // Fallback for accidental old schema during migration
  throw new Error(`influence.json missing views.${lens}`);
}

export function defaultLens(): ReachLens {
  return influence.meta.defaultView === "lead" ? "lead" : "all";
}

/** Homepage H2 one-liner — All view; countries + two distant subfields/topics. */
export function reachHeadline(): {
  countries: number;
  from: string;
  to: string;
  asOf: string;
  autoFlipped: boolean;
} | null {
  if (isSample) return null;
  const view = getView("all");
  const { countriesCount } = view.totals;
  const { a, b } = view.homepageDistant ?? {};
  if (!countriesCount || !a || !b) return null;
  return {
    countries: countriesCount,
    from: a,
    to: b,
    asOf: influence.meta.asOf,
    autoFlipped: !!influence.meta.autoFlippedToLead,
  };
}

const FIELD_ZH: Record<string, string> = {
  "Environmental Science": "环境科学",
  Engineering: "工程",
  "Agricultural and Biological Sciences": "农业与生物科学",
  "Economics, Econometrics and Finance": "经济学、计量经济学与金融",
  "Social Sciences": "社会科学",
  "Computer Science": "计算机科学",
  "Earth and Planetary Sciences": "地球与行星科学",
  Medicine: "医学",
  "Business, Management and Accounting": "商业、管理与会计",
  "Arts and Humanities": "艺术与人文",
  "Biochemistry, Genetics and Molecular Biology": "生物化学、遗传学与分子生物学",
  "Decision Sciences": "决策科学",
  Energy: "能源",
  "Health Professions": "卫生职业",
  Psychology: "心理学",
  Mathematics: "数学",
  "Physics and Astronomy": "物理与天文学",
  Chemistry: "化学",
  "Materials Science": "材料科学",
  Neuroscience: "神经科学",
  "Immunology and Microbiology": "免疫学与微生物学",
  Nursing: "护理学",
  Unclassified: "未分类",
  "Environmental Engineering": "环境工程",
  "Global and Planetary Change": "全球与行星变化",
  "Pollution": "污染",
  "Health, Toxicology and Mutagenesis": "健康、毒理学与诱变",
  "Atmospheric Science": "大气科学",
  "Ecology": "生态学",
  "Urban Studies": "城市研究",
  "Geography, Planning and Development": "地理、规划与发展",
  "Nature and Landscape Conservation": "自然与景观保护",
  "Water Science and Technology": "水科学与技术",
  "Building and Construction": "建筑与建造",
  "Civil and Structural Engineering": "土木与结构工程",
  "Renewable Energy, Sustainability and the Environment": "可再生能源、可持续性与环境",
};

export const fieldZh = (name: string) => FIELD_ZH[name] ?? name;

export const INSTITUTION_TYPE_LABELS: Record<string, { en: string; zh: string }> = {
  education: { en: "Universities", zh: "高校" },
  facility: { en: "Research institutes & labs", zh: "研究机构与实验室" },
  government: { en: "Government", zh: "政府机构" },
  nonprofit: { en: "Nonprofits", zh: "非营利组织" },
  company: { en: "Companies", zh: "企业" },
  healthcare: { en: "Healthcare", zh: "医疗机构" },
  archive: { en: "Archives & libraries", zh: "档案馆与图书馆" },
  funder: { en: "Funders", zh: "资助机构" },
  other: { en: "Other", zh: "其他" },
  "no-affiliation": { en: "No affiliation listed", zh: "未列出机构" },
};

const regionEn = new Intl.DisplayNames(["en"], { type: "region" });
const regionZh = new Intl.DisplayNames(["zh-Hans"], { type: "region" });
export function countryName(code: string | null): { en: string; zh: string } {
  if (!code) return { en: "—", zh: "—" };
  try {
    return { en: regionEn.of(code) ?? code, zh: regionZh.of(code) ?? code };
  } catch {
    return { en: code, zh: code };
  }
}
