/**
 * Build-time accessors for src/data/influence.json (OpenAlex Reach snapshot).
 * Every number on /reach comes from this file. Never mix in Google Scholar data.
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
  openalexCitedByCount: number;
  citingFetched: number;
  selfCitationsRemoved: number;
  citingNonSelf: number;
  byYear: Record<string, number>;
}

export interface InfluenceData {
  meta: {
    mode: "live" | "sample";
    source: "OpenAlex";
    sourceUrl: string;
    asOf: string;
    generatedAt: string;
    lens: string;
    selfCitationRule: string;
    countryBaseline: string;
    earlyFromYear: number;
    growthDatesDropped: number;
  };
  totals: {
    leadPapers: number;
    openalexCitedByCountSum: number;
    citingLinksFetched: number;
    selfCitationsRemoved: number;
    selfCitationsRemovedBy: Record<string, number>;
    citingLinksNonSelf: number;
    uniqueCitingWorks: number;
    citingWorksOutsideOwnField: number;
    fieldsCount: number;
    countriesCount: number;
  };
  papers: InfluencePaper[];
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
    builds_on: string[];
  }[];
  growth: Record<string, Record<string, number>>;
}

export interface Theme {
  id: string;
  en: string;
  zh: string;
}

export const influence = influenceData as unknown as InfluenceData;
export const THEMES: Theme[] = doiConfig.themes;

/** Theme colors, validated as a categorical set (CVD + normal-vision separation) in this order. */
export const THEME_COLORS: Record<string, string> = {
  "urban-futures": "#00909a",
  heat: "#c74b16",
  "flood-coasts": "#5b4b9a",
  "scaling-form": "#94700f",
};

export const isSample = influence.meta.mode !== "live";

/** Homepage one-liner numbers — null unless the snapshot is real OpenAlex data. */
export function reachHeadline(): { fields: number; countries: number; asOf: string } | null {
  if (isSample) return null;
  const { fieldsCount, countriesCount } = influence.totals;
  if (!fieldsCount || !countriesCount) return null;
  return { fields: fieldsCount, countries: countriesCount, asOf: influence.meta.asOf };
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
