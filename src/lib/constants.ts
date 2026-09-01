export const SITE = {
  name: "Kangning (Ken) Huang",
  title: "Assistant Professor of Environmental Studies",
  affiliation: "NYU Shanghai",
  description:
    "Building a sustainable and resilient urban future through research on urbanization, climate change, and environmental hazards.",
  email: "kangning.huang@nyu.edu",
  googleScholarId: "s_domssAAAAJ",
};

export const LINKS = {
  googleScholar:
    "https://scholar.google.com/citations?user=s_domssAAAAJ&hl=en",
  github: "https://github.com/kangning-huang",
  twitter: "https://x.com/FytasoK60918",
  substack: "https://kangninghuang.substack.com",
  nyuFaculty:
    "https://shanghai.nyu.edu/academics/faculty/directory/kangning-ken-huang",
  lab: "https://knhuang.weebly.com",
};

/**
 * Google Scholar profiles for notable co-authors.
 * Keys must match the full name used in the `authors` field of publications.
 * Used by PublicationCard (visible links) and seo.ts (JSON-LD Person.url).
 */
export const COAUTHOR_LINKS: Record<string, string> = {
  "Karen C. Seto": "https://scholar.google.com/citations?user=0mjPS-IAAAAJ&hl=en",
  "Michelle L. Bell": "https://scholar.google.com/citations?user=W4EC7g4AAAAJ&hl=en",
  "Brian Stone Jr.": "https://scholar.google.com/citations?user=C6lK4ZQAAAAJ&hl=en",
  "Xuhui Lee": "https://scholar.google.com/citations?user=8L9uh1oAAAAJ&hl=en",
  "Philippe Ciais": "https://scholar.google.com/citations?user=PJhqfAoAAAAJ&hl=en",
  "Robert I. McDonald": "https://scholar.google.com/citations?user=qjx1OkwAAAAJ&hl=en",
  "Wenfeng Zhan": "https://scholar.google.com/citations?user=-VRcMboAAAAJ&hl=en",
  "Xia Li": "https://scholar.google.com/citations?user=Rxgr5rYAAAAJ&hl=en",
  "Xiaoping Liu": "https://scholar.google.com/citations?user=rad0T_sAAAAJ&hl=en",
};

export const RESEARCH_INTERESTS = [
  "Urbanization",
  "Extreme Heat Events",
  "Climate Adaptation",
  "Remote Sensing",
  "GIScience",
];

export const ABOUT_TEXT = [
  "I am an Assistant Professor of Environmental Studies at NYU Shanghai, where I lead the CLUEs (Climate, Land Use, and Environmental Sustainability) Lab. I received my PhD from Yale University, School of the Environment in 2020, and was an Advanced Study Program Postdoctoral Fellow at the National Center for Atmospheric Research.",
  "My research focuses on how the combination of urbanization and climate change affects vulnerability and adaptability to environmental hazards. By developing global-scale urbanization scenarios, I explore a broad range of possible urban climate futures and the interventions needed to achieve the more sustainable ones.",
  "My work spans urban expansion modeling, urban heat island dynamics, climate adaptation trade-offs, and the scaling laws governing cities. My research has been funded by NASA, NSF, and other sponsors, and featured in Yale News, Scientific American, and E&E News.",
];

export interface Project {
  title: string;
  description: string;
  url: string;
  tags: string[];
  featured: boolean;
  category: "academic" | "side";
  internalPath?: string;
  imagePath?: string;
}

export const PROJECTS: Project[] = [
  // ── Academic projects ─────────────────────────────────────────
  {
    title: "Nested Scaling of City Mass",
    description:
      "Interactive visualization accompanying the paper on nested economies of scale in global city built mass. Explores the nonlinear scaling relationships between urban populations and their built environments across 3,000+ cities.",
    url: "https://city-mass.nested-complexity.net",
    tags: ["Urban Scaling", "Interactive Visualization", "Nature Cities"],
    featured: true,
    category: "academic",
    // imagePath: "/projects/nested-scaling-city-mass.jpg", // Run `npm run screenshots` to generate
  },
  {
    title: "Urban Expansion 2050",
    description:
      "Projected global urban land expansion through 2050. Based on the research published in Environmental Research Letters (2019), with data available on WRI Resource Watch.",
    url: "/urban-expansion",
    tags: ["Urban Modeling", "Remote Sensing"],
    featured: true,
    category: "academic",
    internalPath: "/urban-expansion",
  },
  {
    title: "3D Urban Flood Risk",
    description:
      "Interactive web app for the paper on integrating building height and protection standards in global flood risk assessment. Visualizes 3D urban flood exposure across cities worldwide.",
    url: "https://kangning-huang.github.io/3D-urban-flood-risk/",
    tags: ["Flood Risk", "3D Visualization", "Interactive"],
    featured: true,
    category: "academic",
    // imagePath: "/projects/3d-urban-flood-risk.jpg", // Run `npm run screenshots` to generate
  },
  {
    title: "Urban Renewal Cooling DID",
    description:
      "Interactive visualization of key results from the paper on the causal link between informal settlement demolition and urban cooling. Uses a difference-in-differences approach to unveil cooling effects of urban renewal.",
    url: "https://kangning-huang.github.io/urban-renewal-cooling-DID/",
    tags: ["Urban Cooling", "Causal Inference", "Interactive Visualization"],
    featured: true,
    category: "academic",
    // imagePath: "/projects/urban-renewal-cooling-did.jpg", // Run `npm run screenshots` to generate
  },
  {
    title: "URBANMOD-ZIPF",
    description:
      "A global-scale urban land expansion model that preserves Zipf's Law of urban sizes. Open-source tool for simulating realistic patterns of urban growth across different scenarios.",
    url: "https://github.com/kangning-huang",
    tags: ["Urban Modeling", "Open Source", "Python"],
    featured: false,
    category: "academic",
  },
  // ── Side projects ────────────────────────────────────────────
  {
    title: "RoboTaxi Safety Tracker",
    description:
      "A data-driven dashboard tracking Tesla Cybercab safety performance using NHTSA Standing General Order crash data. Provides transparent, independent analysis of autonomous vehicle safety metrics including miles per incident (MPI) comparisons.",
    url: "https://robotaxi-safety-tracker.com",
    tags: ["Data Visualization", "Autonomous Vehicles", "Safety Analytics"],
    featured: true,
    category: "side",
    // imagePath: "/projects/robotaxi-safety-tracker.jpg", // Run `npm run screenshots` to generate
  },
  {
    title: "Polybot Arena",
    description:
      "Visualizes how elite trading bots compete in Polymarket crypto prediction markets. Tracks the most profitable traders on Polymarket's 'Up or Down' markets for BTC, ETH, SOL, and XRP, showing their exact timing, positions, and P&L.",
    url: "https://polybot-arena.com",
    tags: ["Data Visualization", "Crypto", "Prediction Markets"],
    featured: true,
    category: "side",
  },
  {
    title: "Capitol Alpha",
    description:
      "Congressional trading dashboard — track and analyze stock trades made by members of the U.S. Congress.",
    url: "https://capitol-alpha.com",
    tags: ["Data Visualization", "Finance", "Dashboard"],
    featured: true,
    category: "side",
  },
];

export interface Publication {
  title: string;
  authors: string;
  venue: string;
  year: number;
  citationCount: number;
  url?: string;
  doi?: string;
  /** true when Kangning Huang is first or last (senior) author */
  isLeadAuthor?: boolean;
  /** Link to preprint (e.g. arXiv, Research Square) */
  preprint?: string;
  /** Link to an interactive web app / visualization for this paper */
  webUrl?: string;
  /** SEO/AEO: keyword-rich bullet points summarising key findings */
  highlights?: string[];
  /** SEO/AEO: topic keywords for structured data and filtering */
  keywords?: string[];
}

/**
 * Curated publication list from Google Scholar (s_domssAAAAJ).
 * Conference presentations / abstracts are excluded.
 * Citation counts here are fallback values; the build fetches
 * live counts from OpenAlex when available.
 */
export const CURATED_PUBLICATIONS: Publication[] = [
  // ── First / last author ──────────────────────────────────────
  {
    title: "Stage-dependent scaling of travel distance shaped by 3D urban form",
    authors: "Yangzi Che, Guangdong Li, Xiaoping Liu, Libang Ma, Kangning Huang",
    venue: "submitted to PNAS",
    year: 2026,
    citationCount: 0,
    isLeadAuthor: true,
    keywords: ["3D urban form", "urban scaling", "mobility distance", "transport energy", "sustainable urbanization", "vertical urban growth", "volumetric sprawl"],
  },
  {
    title: "Projecting global urban land expansion and heat island intensification through 2050",
    authors: "Kangning Huang, Xia Li, Xiaoping Liu, Karen C. Seto",
    venue: "Environmental Research Letters",
    year: 2019,
    citationCount: 466,
    doi: "10.1088/1748-9326/ab4b71",
    isLeadAuthor: true,
    webUrl: "https://kangning-huang.github.io/main/urban-expansion",
    keywords: ["urban expansion", "urban heat island", "SSP scenarios", "global urbanization projections", "land-use change modeling", "WRF climate model", "urban land cover 2050"],
  },
  {
    title: "An improved artificial immune system for seeking the Pareto front of land-use allocation problem in large areas",
    authors: "Kangning Huang, Xiaoping Liu, Xia Li, Jiayong Liang, Shenjing He",
    venue: "International Journal of Geographical Information Science",
    year: 2013,
    citationCount: 106,
    doi: "10.1080/13658816.2012.730147",
    isLeadAuthor: true,
    keywords: ["land-use optimization", "Pareto front", "artificial immune system", "multi-objective optimization", "spatial planning", "GIScience"],
  },
  {
    title: "Persistent increases in nighttime heat stress from urban expansion despite heat island mitigation",
    authors: "Kangning Huang, Xuhui Lee, Brian Stone Jr., Jason Knievel, Michelle L. Bell, Karen C. Seto",
    venue: "Journal of Geophysical Research: Atmospheres",
    year: 2021,
    citationCount: 66,
    doi: "10.1029/2020JD033831",
    isLeadAuthor: true,
    keywords: ["nighttime heat stress", "urban heat island mitigation", "urban expansion", "WRF simulation", "nocturnal heat exposure", "climate and health"],
  },
  {
    title: "Facilitating urban climate forecasts in rapidly urbanizing regions with land-use change modeling",
    authors: "Kangning Huang, Jiye Leng, Yong Xu, Xinwei Li, Meng Cai, Ran Wang, Chao Ren",
    venue: "Urban Climate",
    year: 2021,
    citationCount: 24,
    isLeadAuthor: true,
    keywords: ["urban climate forecast", "land-use change modeling", "Pearl River Delta", "Greater Bay Area", "rapid urbanization", "SLEUTH model"],
  },
  {
    title: "Urban forests facing climate risks",
    authors: "Kangning Huang",
    venue: "Nature Climate Change",
    year: 2022,
    citationCount: 17,
    isLeadAuthor: true,
    keywords: ["urban forests", "urban trees climate change", "urban canopy", "nature-based solutions", "climate adaptation", "urban cooling"],
  },
  {
    title: "Declining urban density attenuates rising population exposure to surface heat extremes",
    authors: "Kangning Huang, Brian Stone Jr., ChengHe Guan, Jiayong Liang",
    venue: "Scientific Reports",
    year: 2026,
    citationCount: 3,
    doi: "10.1038/s41598-025-96045-z",
    isLeadAuthor: true,
    keywords: ["urban density", "heat exposure", "surface urban heat island", "urban sprawl", "climate equity", "satellite land-surface temperature"],
  },
  {
    title: "Nested economies of scale in global city mass",
    authors: "Kangning Huang, Mingzhen Lu",
    venue: "Nature Cities (accepted)",
    year: 2026,
    citationCount: 0,
    url: "https://arxiv.org/abs/2507.03960",
    isLeadAuthor: true,
    webUrl: "https://city-mass.nested-complexity.net",
    keywords: ["urban scaling laws", "Zipf's law", "city size distribution", "built mass", "urban allometry", "urban economics"],
  },
  // Last author
  {
    title: "Spatially resolved global potential for year-round solar-powered artificial intelligence computing",
    authors: "Yimin Chen, Jing Qian, Yijing Wang, Xiaoping Liu, Ming Luo, Yutian Liang, Weilin Liao, Zhu Deng, Kangning Huang",
    venue: "submitted to PNAS",
    year: 2026,
    citationCount: 0,
    isLeadAuthor: true,
    keywords: ["green AI", "data centers", "solar power", "photovoltaic energy", "renewable energy", "geopolitics", "hyperscale computing", "energy geography", "AI electricity demand"],
  },
  {
    title: "Rapid Probabilistic Inundation Mapping Using Local Thresholds and Sentinel-1 SAR Data on Google Earth Engine",
    authors: "Jiayong Liang, Desheng Liu, Lihan Feng, Kangning Huang",
    venue: "Remote Sensing",
    year: 2025,
    citationCount: 1,
    doi: "10.3390/rs17101747",
    isLeadAuthor: true,
    keywords: ["flood mapping", "Sentinel-1 SAR", "Google Earth Engine", "inundation detection", "remote sensing", "probabilistic mapping"],
  },
  {
    title: "Unveiling the causal link between informal settlement demolition and urban cooling",
    authors: "Yujie Sun, Xuyan Gao, Jiayong Liang, Kangning Huang",
    venue: "npj Environmental Social Sciences",
    year: 2026,
    citationCount: 0,
    doi: "10.1038/s44432-026-00009-1",
    isLeadAuthor: true,
    webUrl: "https://kangning-huang.github.io/urban-renewal-cooling-DID/",
    keywords: ["informal settlements", "urban renewal", "urban cooling", "difference-in-differences", "causal inference", "slum demolition", "Global South"],
  },
  {
    title: "Height-Aware and Protection-Informed Flood Assessment Shifts Global Urban Risk Distribution",
    authors: "Jiayong Liang, Imman Hilaly, Xuyan Gao, ChengHe Guan, Ying Li, Kangning Huang",
    venue: "Scientific Reports (in 2nd revision)",
    year: 2025,
    citationCount: 0,
    isLeadAuthor: true,
    preprint: "https://www.researchsquare.com/article/rs-6900146/v1",
    webUrl: "https://kangning-huang.github.io/3D-urban-flood-risk/",
    keywords: ["urban flood risk", "3D flood assessment", "building height", "flood protection standards", "climate risk", "global flood modeling"],
  },
  {
    title: "Planning for rhythmized urban parks: Temporal park classification and modes of action",
    authors: "Xiyuan Ren, ChengHe Guan, Shengze Chen, Meizi You, Ying Li, Kangning Huang",
    venue: "Journal of the American Planning Association",
    year: 2026,
    citationCount: 2,
    doi: "10.1080/01944363.2025.2523604",
    isLeadAuthor: true,
    keywords: ["urban parks", "park planning", "temporal classification", "urban recreation", "public space design", "urban planning"],
  },
  {
    title: "Unequal Effects of the Lockdown on Mental Health in Shanghai: The Moderating and Mediating Role of Neighborhood Environment and Online Social Connections",
    authors: "Yaolin Pei, Xiang Qi, Gen Li, Weiming Tang, Kangning Huang, Brian J. Hall, Bei Wu",
    venue: "Journal of Community Psychology",
    year: 2025,
    citationCount: 2,
    isLeadAuthor: false,
    keywords: ["COVID-19 lockdown", "mental health", "Shanghai", "neighborhood environment", "social connections", "health equity"],
  },
  {
    title: "Short-Term Effect of Air Pollution on Daily Hospital Visits for Anxiety Disorders in Southern China",
    authors: "Xinyuan Zhong, Tingting Guo, Jianghui Zhang, Qiong Wang, Rong Yin, Kunpeng Wu, Qing Zou, Meng Zheng, Brian J. Hall, Andre M. N. Renzaho, Kangning Huang, Wen Chen",
    venue: "Toxics",
    year: 2025,
    citationCount: 4,
    doi: "10.3390/toxics13010045",
    isLeadAuthor: false,
    keywords: ["air pollution", "anxiety disorders", "PM2.5", "hospital visits", "environmental health", "southern China"],
  },
  {
    title: "Measuring rising heat and flood risk along the belt-and-road initiative",
    authors: "Jiayong Liang, Maria Adele Carrai, Ammar A. Malik, Xi Gao, Xuyan Gao, Lihan Feng, Kangning Huang",
    venue: "Discover Environment",
    year: 2024,
    citationCount: 1,
    isLeadAuthor: true,
    keywords: ["Belt and Road Initiative", "climate risk", "heat risk", "flood risk", "infrastructure", "international development"],
  },
  {
    title: "Mega-city development impact on hourly extreme rainfall over the South China Greater Bay Area under near-future climate warming",
    authors: "Chenxi Hu, Chi-Yung Tam, Xinwei Li, Kangning Huang, Chao Ren, Kwun Yip Fung, Ziqian Wang",
    venue: "Urban Climate",
    year: 2023,
    citationCount: 21,
    isLeadAuthor: false,
    keywords: ["extreme rainfall", "mega-city development", "Greater Bay Area", "WRF modeling", "urban precipitation", "climate warming"],
  },
  {
    title: "Investigating future urbanization's impact on local climate under different climate change scenarios in MEGA-urban regions: A case study of the Pearl River Delta, China",
    authors: "Pak Shing Yeung, Jimmy Chi-Hung Fung, Chao Ren, Yong Xu, Kangning Huang, Jiye Leng, Michael Mau-Fong Wong",
    venue: "Atmosphere",
    year: 2020,
    citationCount: 26,
    isLeadAuthor: false,
    keywords: ["Pearl River Delta", "urbanization impact", "climate scenarios", "regional climate modeling", "land-use change", "mega-urban region"],
  },
  // ── Co-author ────────────────────────────────────────────
  {
    title: "Toward Cooler Cities by Homogeneous Scale Planning",
    authors: "Xucai Zhang, Xiaobing Wei, Xiaoping Liu, Honghong Wei, Yue Zheng, Hongkai Gu, Yangzi Che, Yeran Sun, Ming Luo, Weilin Liao, Haosheng Huang, Kangning Huang",
    venue: "in revision at PNAS",
    year: 2026,
    citationCount: 0,
    isLeadAuthor: false,
    keywords: ["urban heat island", "Urban Homogeneous Scale", "urban morphology", "climate adaptation", "urban planning", "causal inference", "machine learning"],
  },
  {
    title: "Material-saving strategies for decarbonizing the global urban building stock",
    authors: "Yupeng Liu, Kangning Huang, Shengping Li, Karen C. Seto, Wei-Qiang Chen",
    venue: "submitted to Nature Communications",
    year: 2026,
    citationCount: 0,
    isLeadAuthor: false,
    keywords: ["building stock", "material efficiency", "decarbonization", "embodied carbon", "construction materials", "climate mitigation", "dematerialization"],
  },
  {
    title: "Infrastructure reach and capacity pressure in sub-Saharan Africa's future urban expansion",
    authors: "Kangning Huang, Yimin Chen",
    venue: "submitted to Nature Communications",
    year: 2026,
    citationCount: 0,
    isLeadAuthor: false,
    keywords: ["sub-Saharan Africa", "urban expansion", "infrastructure", "urban growth", "development", "Nature Communications"],
  },
  {
    title: "Global multi-city heat perception: seasonal dynamics and climate–health signals",
    authors: "Meizi You, ChengHe Guan, Yuming Guo, Bao-Jie He, Steven Jige Quan, John S. Ji, Jianxiang Huang, Rongbin Xu, Zhihu Xu, Tianren Yang, Longxu Yan, Kangning Huang, ... Waishan Qiu",
    venue: "under review at Nature Communications",
    year: 2026,
    citationCount: 0,
    isLeadAuthor: false,
    keywords: ["heat perception", "urban heat", "climate and health", "social media", "large language model", "BERT", "climate adaptation", "heat mortality"],
  },
  {
    title: "Global projections of future urban land expansion under shared socioeconomic pathways",
    authors: "Guangzhao Chen, Xia Li, Xiaoping Liu, Yimin Chen, Xun Liang, Jiye Leng, Xiaocong Xu, Wenjie Liao, Yue'an Qiu, Qianlian Wu, Kangning Huang",
    venue: "Nature Communications",
    year: 2020,
    citationCount: 937,
    doi: "10.1038/s41467-020-14386-x",
    isLeadAuthor: false,
    keywords: ["global urban expansion", "SSP scenarios", "urban land projections", "Nature Communications", "IPCC", "urban growth 2100"],
  },
  {
    title: "High-spatiotemporal-resolution mapping of global urban change from 1985 to 2015",
    authors: "Xiaoping Liu, Yinghuai Huang, Xiaocong Xu, Xuecao Li, Xia Li, Philippe Ciais, ... Kangning Huang, ... Zhenzhong Zeng",
    venue: "Nature Sustainability",
    year: 2020,
    citationCount: 843,
    doi: "10.1038/s41893-020-0521-x",
    isLeadAuthor: false,
    keywords: ["global urban change", "Landsat", "remote sensing", "urban land cover", "GAIA dataset", "impervious surface mapping", "30-meter resolution"],
  },
  {
    title: "Research gaps in knowledge of the impact of urban growth on biodiversity",
    authors: "Robert I. McDonald, Andressa V. Mansur, Fernando Ascensão, ... Kangning Huang, ... Carly Ziter",
    venue: "Nature Sustainability",
    year: 2020,
    citationCount: 637,
    doi: "10.1038/s41893-019-0436-6",
    isLeadAuthor: false,
    keywords: ["urban biodiversity", "habitat loss", "urban ecology", "conservation planning", "biodiversity hotspots", "urban growth impact"],
  },
  {
    title: "A multi-type ant colony optimization (MACO) method for optimal land use allocation in large areas",
    authors: "Xiaoping Liu, Xia Li, Xun Shi, Kangning Huang, Yilun Liu",
    venue: "International Journal of Geographical Information Science",
    year: 2012,
    citationCount: 167,
    doi: "10.1080/13658816.2011.635594",
    isLeadAuthor: false,
    keywords: ["ant colony optimization", "land-use allocation", "spatial optimization", "multi-objective planning", "GIScience"],
  },
  {
    title: "Fugitive Road Dust PM2.5 Emissions and Their Potential Health Impacts",
    authors: "Siyu Chen, Xiaorui Zhang, Jintai Lin, Jianping Huang, Dan Zhao, Tiangang Yuan, Kangning Huang, ... Li Xie",
    venue: "Environmental Science & Technology",
    year: 2019,
    citationCount: 150,
    doi: "10.1021/acs.est.9b00666",
    isLeadAuthor: false,
    keywords: ["PM2.5", "road dust emissions", "air pollution", "urban air quality", "health impacts", "particulate matter"],
  },
  {
    title: "Automatic registration of multisensor images using an integrated spatial and mutual information (SMI) metric",
    authors: "Jiayong Liang, Xiaoping Liu, Kangning Huang, Xia Li, Dagang Wang, Xianwei Wang",
    venue: "IEEE Transactions on Geoscience and Remote Sensing",
    year: 2013,
    citationCount: 110,
    doi: "10.1109/tgrs.2013.2242895",
    isLeadAuthor: false,
    keywords: ["image registration", "multi-sensor", "mutual information", "remote sensing", "SAR", "IEEE TGRS"],
  },
  {
    title: "Quantifying contributions of natural and anthropogenic dust emission from different climatic regions",
    authors: "Siyu Chen, Nanxuan Jiang, Jianping Huang, ... Kangning Huang, ... Taichen Feng",
    venue: "Atmospheric Environment",
    year: 2018,
    citationCount: 104,
    doi: "10.1016/j.atmosenv.2018.07.043",
    isLeadAuthor: false,
    keywords: ["dust emissions", "anthropogenic dust", "natural dust", "climate regions", "air quality", "atmospheric environment"],
  },
  {
    title: "High-resolution gridded population projections for China under the shared socioeconomic pathways",
    authors: "Yimin Chen, Xia Li, Kangning Huang, Ming Luo, Minyi Gao",
    venue: "Earth's Future",
    year: 2020,
    citationCount: 77,
    isLeadAuthor: false,
    keywords: ["population projections", "China", "SSP scenarios", "gridded population", "urbanization", "climate impact assessment"],
  },
  {
    title: "Evaluation of historical and future wetland degradation using remote sensing imagery and land use modeling",
    authors: "Tango Hu, Jiahong Liu, Gang Zheng, Dengrong Zhang, Kangning Huang",
    venue: "Land Degradation & Development",
    year: 2019,
    citationCount: 70,
    isLeadAuthor: false,
    keywords: ["wetland degradation", "remote sensing", "land-use modeling", "habitat loss", "conservation", "land cover change"],
  },
  {
    title: "Globally elevated greenhouse gas emissions from polluted urban rivers",
    authors: "Wenhao Xu, Gongqin Wang, Shaoda Liu, ... Kangning Huang, ... Xinghui Xia",
    venue: "Nature Sustainability",
    year: 2024,
    citationCount: 69,
    isLeadAuthor: false,
    keywords: ["urban rivers", "greenhouse gas emissions", "water pollution", "urban waterways", "climate mitigation"],
  },
  {
    title: "Improved snow depth retrieval by integrating microwave brightness temperature and visible/infrared reflectance",
    authors: "Jiayong Liang, Xiaoping Liu, Kangning Huang, Xia Li, Xun Shi, Yaning Chen, Jun Li",
    venue: "Remote Sensing of Environment",
    year: 2015,
    citationCount: 64,
    doi: "10.1016/j.rse.2015.06.016",
    isLeadAuthor: false,
    keywords: ["snow depth retrieval", "microwave remote sensing", "data fusion", "visible/infrared reflectance", "cryosphere", "remote sensing"],
  },
  {
    title: "Enhancing Climate-Driven Urban Tree Cooling with Targeted Nonclimatic Interventions",
    authors: "Zhaowu Yu, Siheng Li, Wenjun Yang, ... Kangning Huang, ... Weiqi Zhou",
    venue: "Environmental Science & Technology",
    year: 2025,
    citationCount: 29,
    doi: "10.1021/acs.est.4c14275",
    isLeadAuthor: false,
    keywords: ["urban tree cooling", "green infrastructure", "urban canopy management", "nature-based cooling", "urban forestry"],
  },
  {
    title: "Dual impact of global urban overheating on mortality",
    authors: "Shasha Wang, Wenfeng Zhan, Bingbing Zhou, ... Kangning Huang, ... Manchun Li",
    venue: "Nature Climate Change",
    year: 2025,
    citationCount: 27,
    doi: "10.1038/s41558-025-02303-3",
    isLeadAuthor: false,
    keywords: ["urban heat mortality", "urban overheating", "heat-related deaths", "nighttime heat", "Nature Climate Change", "public health"],
  },
  {
    title: "Exacerbated heat stress induced by urban browning in the Global South",
    authors: "Huilin Du, Wenfeng Zhan, Bingbing Zhou, ... Kangning Huang, ... Manchun Li",
    venue: "Nature Cities",
    year: 2025,
    citationCount: 0,
    doi: "10.1038/s44284-024-00184-9",
    isLeadAuthor: false,
    keywords: ["urban browning", "heat stress", "Global South", "vegetation loss", "urban greenness", "Nature Cities"],
  },
  {
    title: "Multi-sensor image registration by combining local self-similarity matching and mutual information",
    authors: "Xiaoping Liu, Shuli Chen, Li Zhuo, Jun Li, Kangning Huang",
    venue: "Frontiers of Earth Science",
    year: 2018,
    citationCount: 26,
    isLeadAuthor: false,
    keywords: ["image registration", "self-similarity", "multi-sensor", "remote sensing", "mutual information", "feature matching"],
  },
  {
    title: "Long-term monitoring and evaluation of land development in a reclamation area under rapid urbanization",
    authors: "Tangao Hu, Jinjin Fan, Hao Hou, Yao Li, Yue Li, Kangning Huang",
    venue: "Land Degradation & Development",
    year: 2021,
    citationCount: 13,
    isLeadAuthor: false,
    keywords: ["land reclamation", "urbanization", "remote sensing monitoring", "land development", "land-use change"],
  },
  {
    title: "Mapping of individual building heights reveals the large gap of urban-rural living spaces in the contiguous US",
    authors: "Yangzi Che, Xuecao Li, Xiaoping Liu, Xiaocong Xu, Kangning Huang, ... Xia Li",
    venue: "The Innovation Geoscience",
    year: 2024,
    citationCount: 10,
    isLeadAuthor: false,
    keywords: ["building height mapping", "urban-rural gap", "3D urban structure", "built environment", "United States", "remote sensing"],
  },
  {
    title: "Moderating AC usage can reduce thermal disparity between indoor and outdoor environments",
    authors: "Hong Wei, Bin Chen, Kangning Huang, Meng Gao, Bin Fan, Tao Zhang, Ying Tu, Bing Xu",
    venue: "Environmental Science & Technology",
    year: 2024,
    citationCount: 6,
    doi: "10.1021/acs.est.4c05618",
    isLeadAuthor: false,
    keywords: ["air conditioning", "thermal disparity", "waste heat", "urban heat island", "indoor-outdoor temperature", "energy efficiency"],
  },
  {
    title: "The implementation and application of geographical simulation and optimization systems (GeoSOS)",
    authors: "Xia Li, Dan Li, Xiaoping Liu, Chunhua Lao, Yihan Zhang, Jinqiang He, Kangning Huang",
    venue: "Acta Scientiarum Natralium Universitatis Sunyatseni",
    year: 2010,
    citationCount: 15,
    isLeadAuthor: false,
    keywords: ["GeoSOS", "geographical simulation", "cellular automata", "land-use simulation", "spatial optimization", "urban growth modeling"],
  },
  {
    title: "Estimations of anthropogenic dust emissions at global scale from 2007 to 2010",
    authors: "Siyu Chen, Jianping Huang, Nanxuan Jiang, ... Kangning Huang, ... Shujie Liao",
    venue: "Atmospheric Chemistry and Physics Discussions",
    year: 2017,
    citationCount: 5,
    isLeadAuthor: false,
    keywords: ["anthropogenic dust emissions", "global dust", "atmospheric modeling", "air quality", "human-caused dust"],
  },
];

// Keep the old name for backwards compat
export const FALLBACK_PUBLICATIONS = CURATED_PUBLICATIONS;
