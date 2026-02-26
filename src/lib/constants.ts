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
    url: "https://kangning-huang.github.io/nested-scaling-city-mass/",
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
  // ── Side projects ─────────────────────────────────────────────
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
    title: "Projecting global urban land expansion and heat island intensification through 2050",
    authors: "Kangning Huang, Xia Li, Xiaoping Liu, Karen C. Seto",
    venue: "Environmental Research Letters",
    year: 2019,
    citationCount: 466,
    doi: "10.1088/1748-9326/ab4b71",
    isLeadAuthor: true,
    webUrl: "https://kangning-huang.github.io/main/urban-expansion",
    highlights: [
      "Projects global urban land expansion for 2030 and 2050 under shared socioeconomic pathways (SSPs)",
      "Simulates urban heat island intensification driven by land-cover change in over 1,700 cities worldwide",
      "Finds that urban expansion alone could increase local temperatures by 1–3 °C on top of background climate warming",
      "Provides gridded projections at 1-km resolution used by WRI Resource Watch for policy planning",
      "Couples a land-use change model (SLEUTH) with the Weather Research and Forecasting (WRF) climate model",
    ],
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
    highlights: [
      "Develops a multi-objective optimization algorithm based on artificial immune systems for land-use allocation",
      "Solves the Pareto-optimal land-use planning problem efficiently in large geographic areas",
      "Outperforms NSGA-II and other evolutionary algorithms on spatial optimization benchmarks",
      "Balances competing objectives such as economic return, ecological conservation, and food security in land-use planning",
    ],
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
    highlights: [
      "Shows that nighttime urban heat stress keeps rising even when cities adopt heat island mitigation strategies",
      "Uses WRF simulations over the contiguous United States to separate the effects of urban expansion from background climate change",
      "Finds nighttime minimum temperatures are more sensitive to urban land-cover change than daytime maxima",
      "Highlights the public-health implications of persistent nocturnal heat exposure for vulnerable populations",
    ],
    keywords: ["nighttime heat stress", "urban heat island mitigation", "urban expansion", "WRF simulation", "nocturnal heat exposure", "climate and health"],
  },
  {
    title: "Facilitating urban climate forecasts in rapidly urbanizing regions with land-use change modeling",
    authors: "Kangning Huang, Jiye Leng, Yong Xu, Xinwei Li, Meng Cai, Ran Wang, Chao Ren",
    venue: "Urban Climate",
    year: 2021,
    citationCount: 24,
    isLeadAuthor: true,
    highlights: [
      "Integrates land-use change modeling into urban climate forecasts for rapidly urbanizing regions",
      "Demonstrates that ignoring future urban growth leads to significant underestimation of local warming",
      "Case study on the Pearl River Delta / Greater Bay Area mega-urban region in southern China",
      "Couples the SLEUTH urban growth model with WRF to produce scenario-based climate projections",
    ],
    keywords: ["urban climate forecast", "land-use change modeling", "Pearl River Delta", "Greater Bay Area", "rapid urbanization", "SLEUTH model"],
  },
  {
    title: "Urban forests facing climate risks",
    authors: "Kangning Huang",
    venue: "Nature Climate Change",
    year: 2022,
    citationCount: 17,
    isLeadAuthor: true,
    highlights: [
      "Commentary in Nature Climate Change on the vulnerability of urban trees and forests to climate change",
      "Discusses how rising temperatures, drought, and extreme weather threaten the cooling benefits of urban canopy",
      "Argues that cities must diversify tree species and adopt climate-adaptive planting strategies",
      "Highlights the feedback loop: urban forests cool cities, but climate stress may reduce canopy cover over time",
    ],
    keywords: ["urban forests", "urban trees climate change", "urban canopy", "nature-based solutions", "climate adaptation", "urban cooling"],
  },
  {
    title: "Declining urban density attenuates rising population exposure to surface heat extremes",
    authors: "Kangning Huang, Brian Stone Jr., ChengHe Guan, Jiayong Liang",
    venue: "Scientific Reports",
    year: 2025,
    citationCount: 3,
    doi: "10.1038/s41598-025-96045-z",
    isLeadAuthor: true,
    highlights: [
      "Reveals that declining urban population density partially offsets rising heat exposure from climate warming",
      "Analyzes surface urban heat island intensity across hundreds of global cities using satellite land-surface temperature data",
      "Finds that urban sprawl (lower density) reduces per-capita heat exposure but increases total energy consumption",
      "Quantifies the trade-off between compact urban development and heat-risk equity",
    ],
    keywords: ["urban density", "heat exposure", "surface urban heat island", "urban sprawl", "climate equity", "satellite land-surface temperature"],
  },
  {
    title: "Nested economies of scale in global city mass",
    authors: "Kangning Huang, Mingzhen Lu",
    venue: "arXiv preprint (in revision at Nature Cities)",
    year: 2025,
    citationCount: 0,
    url: "https://arxiv.org/abs/2507.03960",
    isLeadAuthor: true,
    webUrl: "https://kangning-huang.github.io/nested-scaling-city-mass/",
    highlights: [
      "Discovers nested scaling laws in the built mass (total building volume) of over 3,000 cities worldwide",
      "Shows that a city's total built mass scales super-linearly with population, analogous to metabolic scaling in biology",
      "Reveals that scaling exponents vary systematically across world regions, reflecting different development pathways",
      "Proposes a unified framework connecting urban scaling theory with Zipf's law of city sizes",
    ],
    keywords: ["urban scaling laws", "Zipf's law", "city size distribution", "built mass", "urban allometry", "urban economics"],
  },
  // Last author
  {
    title: "Rapid Probabilistic Inundation Mapping Using Local Thresholds and Sentinel-1 SAR Data on Google Earth Engine",
    authors: "Jiayong Liang, Desheng Liu, Lihan Feng, Kangning Huang",
    venue: "Remote Sensing",
    year: 2025,
    citationCount: 1,
    doi: "10.3390/rs17101747",
    isLeadAuthor: true,
    highlights: [
      "Presents a rapid, cloud-based method for probabilistic flood inundation mapping using Sentinel-1 SAR imagery",
      "Implements local adaptive thresholding on Google Earth Engine for near-real-time flood extent detection",
      "Produces probabilistic flood maps that quantify uncertainty in inundation boundaries",
      "Validated against ground-truth data across multiple flood events with high accuracy",
    ],
    keywords: ["flood mapping", "Sentinel-1 SAR", "Google Earth Engine", "inundation detection", "remote sensing", "probabilistic mapping"],
  },
  {
    title: "Unveiling the causal link between informal settlement demolition and urban cooling",
    authors: "Yujie Sun, Xuyan Gao, Jiayong Liang, Kangning Huang",
    venue: "npj Environmental Social Science",
    year: 2025,
    citationCount: 0,
    isLeadAuthor: true,
    preprint: "https://www.researchsquare.com/article/rs-7288639/v1",
    webUrl: "https://kangning-huang.github.io/urban-renewal-cooling-DID/",
    highlights: [
      "Establishes a causal link between informal settlement (slum) demolition and local surface cooling using a difference-in-differences design",
      "Analyzes urban renewal programs across multiple cities in the Global South using satellite land-surface temperature",
      "Finds measurable cooling effects of 0.3–0.8 °C following demolition and redevelopment of informal settlements",
      "Raises equity questions about climate co-benefits of displacement-driven urban renewal",
    ],
    keywords: ["informal settlements", "urban renewal", "urban cooling", "difference-in-differences", "causal inference", "slum demolition", "Global South"],
  },
  {
    title: "Integrating Building Height and Protection Standards in Global Urban Flood Risk Assessment",
    authors: "Jiayong Liang, Imman Hilaly, Xuyan Gao, ChengHe Guan, Ying Li, Kangning Huang",
    venue: "preprint",
    year: 2025,
    citationCount: 0,
    isLeadAuthor: true,
    preprint: "https://www.researchsquare.com/article/rs-6900146/v1",
    webUrl: "https://kangning-huang.github.io/3D-urban-flood-risk/",
    highlights: [
      "Introduces a 3D approach to global urban flood risk assessment that accounts for building height and flood protection infrastructure",
      "Shows that conventional 2D flood models overestimate damages by ignoring vertical building structure",
      "Provides city-level flood risk estimates for thousands of urban areas under current and future climate scenarios",
      "Demonstrates how flood protection standards vary dramatically across countries and income levels",
    ],
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
    highlights: [
      "Proposes a temporal classification framework for urban parks based on rhythms of visitor use throughout the day and week",
      "Published in the Journal of the American Planning Association — a top-tier urban planning journal",
      "Identifies distinct park usage modes (morning exercise, lunchtime refuge, evening recreation) and their planning implications",
      "Offers actionable planning strategies for designing parks that serve diverse temporal needs of urban residents",
    ],
    keywords: ["urban parks", "park planning", "temporal classification", "urban recreation", "public space design", "urban planning"],
  },
  {
    title: "Unequal Effects of the Lockdown on Mental Health in Shanghai: The Moderating and Mediating Role of Neighborhood Environment and Online Social Connections",
    authors: "Yaolin Pei, Xiang Qi, Gen Li, Weiming Tang, Kangning Huang, Brian J. Hall, Bei Wu",
    venue: "Journal of Community Psychology",
    year: 2025,
    citationCount: 2,
    isLeadAuthor: false,
    highlights: [
      "Examines how COVID-19 lockdowns in Shanghai unevenly affected mental health across different neighborhoods",
      "Finds that neighborhood environment and online social connections moderate and mediate lockdown mental health impacts",
      "Reveals socioeconomic disparities in mental health resilience during prolonged urban lockdowns",
    ],
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
    highlights: [
      "Links short-term air pollution exposure to increased daily hospital visits for anxiety disorders in southern China",
      "Provides epidemiological evidence connecting PM2.5 and other pollutants to mental health outcomes",
      "Uses time-series analysis of hospital admission records across multiple cities",
    ],
    keywords: ["air pollution", "anxiety disorders", "PM2.5", "hospital visits", "environmental health", "southern China"],
  },
  {
    title: "Measuring rising heat and flood risk along the belt-and-road initiative",
    authors: "Jiayong Liang, Maria Adele Carrai, Ammar A. Malik, Xi Gao, Xuyan Gao, Lihan Feng, Kangning Huang",
    venue: "Discover Environment",
    year: 2024,
    citationCount: 1,
    isLeadAuthor: true,
    highlights: [
      "Quantifies rising heat and flood risk in countries along China's Belt and Road Initiative (BRI)",
      "Maps climate hazard exposure for BRI infrastructure and urban populations using satellite and reanalysis data",
      "Finds that many BRI partner countries face compounding heat and flood risks under future climate scenarios",
      "Provides a framework for climate risk screening of international development investments",
    ],
    keywords: ["Belt and Road Initiative", "climate risk", "heat risk", "flood risk", "infrastructure", "international development"],
  },
  {
    title: "Mega-city development impact on hourly extreme rainfall over the South China Greater Bay Area under near-future climate warming",
    authors: "Chenxi Hu, Chi-Yung Tam, Xinwei Li, Kangning Huang, Chao Ren, Kwun Yip Fung, Ziqian Wang",
    venue: "Urban Climate",
    year: 2023,
    citationCount: 21,
    isLeadAuthor: false,
    highlights: [
      "Simulates how mega-city development in the South China Greater Bay Area intensifies hourly extreme rainfall events",
      "Uses high-resolution WRF modeling to project urban-induced rainfall changes under near-future climate warming",
      "Finds that urbanization amplifies convective precipitation extremes through enhanced surface heating and moisture convergence",
    ],
    keywords: ["extreme rainfall", "mega-city development", "Greater Bay Area", "WRF modeling", "urban precipitation", "climate warming"],
  },
  {
    title: "Investigating future urbanization's impact on local climate under different climate change scenarios in MEGA-urban regions: A case study of the Pearl River Delta, China",
    authors: "Pak Shing Yeung, Jimmy Chi-Hung Fung, Chao Ren, Yong Xu, Kangning Huang, Jiye Leng, Michael Mau-Fong Wong",
    venue: "Atmosphere",
    year: 2020,
    citationCount: 26,
    isLeadAuthor: false,
    highlights: [
      "Models future urbanization impacts on local climate in the Pearl River Delta under multiple climate change scenarios",
      "Combines urban growth projections with regional climate modeling for a major Chinese mega-urban region",
      "Shows that urban expansion substantially modifies local temperature and precipitation patterns beyond background climate change",
    ],
    keywords: ["Pearl River Delta", "urbanization impact", "climate scenarios", "regional climate modeling", "land-use change", "mega-urban region"],
  },
  // ── Co-author ──────────────────────────────────────────────
  {
    title: "Global projections of future urban land expansion under shared socioeconomic pathways",
    authors: "Guangzhao Chen, Xia Li, Xiaoping Liu, Yimin Chen, Xun Liang, Jiye Leng, Xiaocong Xu, Wenjie Liao, Yue'an Qiu, Qianlian Wu, Kangning Huang",
    venue: "Nature Communications",
    year: 2020,
    citationCount: 937,
    doi: "10.1038/s41467-020-14386-x",
    isLeadAuthor: false,
    highlights: [
      "Provides the first global gridded projections of urban land expansion under all five SSP scenarios through 2100",
      "Published in Nature Communications with over 900 citations — a foundational dataset for urban climate research",
      "Projects that global urban land area could triple by 2100 under the highest-growth scenario (SSP5)",
      "Data widely used by IPCC, World Bank, and national climate adaptation assessments",
    ],
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
    highlights: [
      "Creates a 30-year global urban land-cover dataset at 30-meter resolution using Landsat imagery (1985–2015)",
      "Published in Nature Sustainability with over 800 citations — a benchmark for urban remote sensing",
      "Reveals that global urban area expanded by 9,687 km² per year, with China and the U.S. leading growth",
      "The GAIA (Global Artificial Impervious Area) dataset is freely available and widely used in urban studies",
    ],
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
    highlights: [
      "Identifies critical research gaps in understanding how urban expansion threatens global biodiversity",
      "Published in Nature Sustainability with over 600 citations — a landmark review for urban ecology",
      "Projects that 290,000 km² of natural habitat in biodiversity hotspots will be lost to urbanization by 2030",
      "Calls for integrating urban growth projections into conservation planning and protected-area design",
    ],
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
    highlights: [
      "Introduces a multi-type ant colony optimization algorithm for spatial land-use allocation across large geographic areas",
      "Handles multiple land-use types simultaneously, improving on single-type optimization approaches",
      "Demonstrates superior performance for large-area land-use planning with competing spatial objectives",
    ],
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
    highlights: [
      "Quantifies PM2.5 emissions from re-suspended road dust — a major but often overlooked source of urban air pollution",
      "Estimates health impacts of road dust exposure using epidemiological dose-response models",
      "Finds that fugitive road dust accounts for a substantial fraction of total PM2.5 in many Chinese cities",
    ],
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
    highlights: [
      "Proposes an integrated spatial and mutual information (SMI) metric for automatic multi-sensor image registration",
      "Combines spatial feature matching with information-theoretic measures for robust image alignment",
      "Published in IEEE TGRS — achieves high registration accuracy across optical, SAR, and infrared sensor image pairs",
    ],
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
    highlights: [
      "Separates natural and human-caused dust emission sources across different climate regions globally",
      "Quantifies the relative contributions of agricultural activity, land degradation, and natural processes to atmospheric dust loading",
      "Provides spatially resolved dust emission estimates useful for air quality and climate modeling",
    ],
    keywords: ["dust emissions", "anthropogenic dust", "natural dust", "climate regions", "air quality", "atmospheric environment"],
  },
  {
    title: "High-resolution gridded population projections for China under the shared socioeconomic pathways",
    authors: "Yimin Chen, Xia Li, Kangning Huang, Ming Luo, Minyi Gao",
    venue: "Earth's Future",
    year: 2020,
    citationCount: 77,
    isLeadAuthor: false,
    highlights: [
      "Produces high-resolution gridded population projections for China under all five shared socioeconomic pathways (SSPs)",
      "Provides sub-national spatial detail critical for climate impact assessments and infrastructure planning",
      "Projects divergent urbanization and population distribution patterns across SSP scenarios for Chinese provinces and cities",
    ],
    keywords: ["population projections", "China", "SSP scenarios", "gridded population", "urbanization", "climate impact assessment"],
  },
  {
    title: "Evaluation of historical and future wetland degradation using remote sensing imagery and land use modeling",
    authors: "Tango Hu, Jiahong Liu, Gang Zheng, Dengrong Zhang, Kangning Huang",
    venue: "Land Degradation & Development",
    year: 2019,
    citationCount: 70,
    isLeadAuthor: false,
    highlights: [
      "Combines remote sensing imagery with land-use modeling to assess historical and future wetland degradation trends",
      "Quantifies wetland area loss driven by agricultural expansion and urban encroachment over decades",
      "Projects continued wetland decline under business-as-usual development scenarios, informing conservation policy",
    ],
    keywords: ["wetland degradation", "remote sensing", "land-use modeling", "habitat loss", "conservation", "land cover change"],
  },
  {
    title: "Globally elevated greenhouse gas emissions from polluted urban rivers",
    authors: "Wenhao Xu, Gongqin Wang, Shaoda Liu, ... Kangning Huang, ... Xinghui Xia",
    venue: "Nature Sustainability",
    year: 2024,
    citationCount: 69,
    isLeadAuthor: false,
    highlights: [
      "Reveals that polluted urban rivers emit significantly more greenhouse gases (CO₂, CH₄, N₂O) than previously estimated",
      "Combines global water-quality monitoring data with field measurements across urban waterways",
      "Calls for urban river pollution control as a climate mitigation strategy",
    ],
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
    highlights: [
      "Integrates microwave brightness temperature with visible/infrared reflectance data for improved snow depth estimation",
      "Overcomes limitations of single-sensor approaches by fusing complementary remote sensing data sources",
      "Published in Remote Sensing of Environment — demonstrates reduced snow depth retrieval errors across diverse terrain and climate conditions",
    ],
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
    highlights: [
      "Shows how non-climatic interventions (irrigation, species selection, canopy management) can enhance urban tree cooling",
      "Provides evidence that targeted tree care strategies can amplify the climate benefits of urban green infrastructure",
      "Offers practical guidance for city planners to maximize cooling from existing urban canopy",
    ],
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
    highlights: [
      "Quantifies the dual mortality burden of urban overheating: heat-related deaths from both daytime and nighttime excess temperatures",
      "Published in Nature Climate Change — estimates hundreds of thousands of excess deaths annually attributable to urban heat islands",
      "Shows that nighttime urban warming is especially deadly because it prevents physiological recovery from daytime heat",
    ],
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
    highlights: [
      "Reveals that urban browning (vegetation loss) in Global South cities is exacerbating surface heat stress",
      "Published in Nature Cities — shows how declining urban greenness amplifies temperatures in tropical and subtropical cities",
      "Highlights disproportionate heat burden on low-income populations in rapidly urbanizing regions of the Global South",
    ],
    keywords: ["urban browning", "heat stress", "Global South", "vegetation loss", "urban greenness", "Nature Cities"],
  },
  {
    title: "Multi-sensor image registration by combining local self-similarity matching and mutual information",
    authors: "Xiaoping Liu, Shuli Chen, Li Zhuo, Jun Li, Kangning Huang",
    venue: "Frontiers of Earth Science",
    year: 2018,
    citationCount: 26,
    isLeadAuthor: false,
    highlights: [
      "Combines local self-similarity matching with mutual information for robust multi-sensor image registration",
      "Addresses the challenge of aligning images from different sensor types with varying spectral characteristics",
      "Validated on optical-to-SAR and optical-to-infrared image pairs with improved alignment accuracy",
    ],
    keywords: ["image registration", "self-similarity", "multi-sensor", "remote sensing", "mutual information", "feature matching"],
  },
  {
    title: "Long-term monitoring and evaluation of land development in a reclamation area under rapid urbanization",
    authors: "Tangao Hu, Jinjin Fan, Hao Hou, Yao Li, Yue Li, Kangning Huang",
    venue: "Land Degradation & Development",
    year: 2021,
    citationCount: 13,
    isLeadAuthor: false,
    highlights: [
      "Monitors land development dynamics in a reclaimed area using long-term remote sensing time series",
      "Evaluates how rapid urbanization transforms reclaimed land over decades of development",
      "Provides insights for sustainable land reclamation and development planning in fast-growing regions",
    ],
    keywords: ["land reclamation", "urbanization", "remote sensing monitoring", "land development", "land-use change"],
  },
  {
    title: "Mapping of individual building heights reveals the large gap of urban-rural living spaces in the contiguous US",
    authors: "Yangzi Che, Xuecao Li, Xiaoping Liu, Xiaocong Xu, Kangning Huang, ... Xia Li",
    venue: "The Innovation Geoscience",
    year: 2024,
    citationCount: 10,
    isLeadAuthor: false,
    highlights: [
      "Creates a nationwide map of individual building heights across the contiguous United States",
      "Reveals significant urban-rural disparities in vertical living space and built environment density",
      "Provides a high-resolution 3D building dataset useful for urban planning, energy modeling, and climate risk analysis",
    ],
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
    highlights: [
      "Shows that moderating air conditioning usage can reduce the thermal disparity between indoor and outdoor environments",
      "Demonstrates that excessive AC use creates a feedback loop worsening outdoor heat through anthropogenic waste heat emissions",
      "Published in ES&T — offers evidence-based AC management strategies for urban heat mitigation",
    ],
    keywords: ["air conditioning", "thermal disparity", "waste heat", "urban heat island", "indoor-outdoor temperature", "energy efficiency"],
  },
  {
    title: "The implementation and application of geographical simulation and optimization systems (GeoSOS)",
    authors: "Xia Li, Dan Li, Xiaoping Liu, Chunhua Lao, Yihan Zhang, Jinqiang He, Kangning Huang",
    venue: "Acta Scientiarum Natralium Universitatis Sunyatseni",
    year: 2010,
    citationCount: 15,
    isLeadAuthor: false,
    highlights: [
      "Describes the design and application of GeoSOS, a geographical simulation and optimization software platform",
      "Integrates cellular automata, agent-based models, and optimization algorithms for land-use simulation",
      "Applied to urban growth modeling and land-use planning in Chinese cities",
    ],
    keywords: ["GeoSOS", "geographical simulation", "cellular automata", "land-use simulation", "spatial optimization", "urban growth modeling"],
  },
  {
    title: "Estimations of anthropogenic dust emissions at global scale from 2007 to 2010",
    authors: "Siyu Chen, Jianping Huang, Nanxuan Jiang, ... Kangning Huang, ... Shujie Liao",
    venue: "Atmospheric Chemistry and Physics Discussions",
    year: 2017,
    citationCount: 5,
    isLeadAuthor: false,
    highlights: [
      "Estimates global anthropogenic dust emissions from 2007 to 2010 using atmospheric modeling and satellite observations",
      "Quantifies dust sources from agriculture, construction, and other human activities across world regions",
      "Provides baseline estimates for understanding the human contribution to global atmospheric dust loading",
    ],
    keywords: ["anthropogenic dust emissions", "global dust", "atmospheric modeling", "air quality", "human-caused dust"],
  },
];

// Keep the old name for backwards compat
export const FALLBACK_PUBLICATIONS = CURATED_PUBLICATIONS;
