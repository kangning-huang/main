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
      "Projects global urban land areas to expand by 0.6–1.3 million km² (78%–171%) between 2015 and 2050 under shared socioeconomic pathways (SSPs)",
      "Estimates urban heat island intensification of 0.5–0.7 °C on average, with localized warming reaching up to 3 °C due to urban land-cover change",
      "Finds that urban expansion-driven warming can be about half, and in some locations up to two times, as strong as greenhouse gas-induced warming under RCP 4.5",
      "Identifies tropical regions in the Southern Hemisphere as facing disproportionately high extreme heat risk from compounding urbanization and climate warming",
      "Combines spatially explicit urban expansion modeling at 5-km resolution with mathematical urban heat island models across roughly half of the world's future urban population",
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
      "Proposes AIS-MOLA, an improved artificial immune system for multi-objective land-use allocation that seeks the Pareto front to reveal trade-offs among spatial suitability and compactness objectives",
      "Introduces heuristic hypermutation based on compromise programming, non-dominated neighbour-based proportional cloning, and a crossover operator that preserves connected land-use patches",
      "Outperforms Pareto Simulated Annealing (PSA) by generating solutions closer to the true Pareto front while requiring only 5.1% of PSA's computation time",
      "Validated on a large-area case study in Panyu, Guangdong, China (389 × 337 cells) demonstrating optimal trade-offs between spatial suitability and compactness",
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
      "Urban expansion through 2050 slightly reduces daytime heat stress (~0.2 °C wet-bulb globe temperature) but intensifies nighttime heat stress by ~1 °C on average and up to 2–3 °C in mega-urban regions of China, India, and Nigeria",
      "Approximately half of the nighttime outdoor urban heat stress increase from urban expansion persists even after large-scale deployment of cool roofs as a heat island mitigation strategy",
      "Uses WRF simulations with spatially explicit urban land expansion projections and wet-bulb globe temperature (WBGT) as a combined temperature-humidity metric to assess physiological heat stress",
      "Demonstrates that infrastructure-based mitigation measures such as cool and green roofs are insufficient alone, highlighting the need for complementary adaptation strategies to address persistent nighttime heat stress",
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
      "Proposes a local climate zone (LCZ) land-use change simulation framework that groups ten urban land types into three categories (high-rise, mid-rise, low-rise) for more reliable urbanization simulation",
      "Shows that the spatial pattern of occurrence probabilities of grouped urban land types aligns with the economic land price bid curve, linking urban morphology transitions to land market dynamics",
      "Validated in the Pearl River Delta metropolitan area, demonstrating applicability to rapidly urbanizing coastal regions where frequent transitions among urban land types alter climate-relevant surface properties",
      "Addresses a critical gap in urban climate forecasting by coupling LCZ-based land-use change modeling with meteorological simulation for scenario-based warming projections",
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
      "News & Views commentary in Nature Climate Change highlighting that more than two-thirds of urban tree species worldwide are projected to face climate risk by 2050",
      "Discusses a global assessment of 3,129 species across 164 cities showing cities at low latitudes face the greatest vulnerability, with nearly all urban tree species exceeding climatic safety margins",
      "Argues that urban forests are central to climate adaptation and nature-based solutions, yet species selection for urban greening rarely accounts for future climatic conditions",
      "Calls for proactive strategies including planting climate-resilient species and adaptive management to sustain the ecological, economic, and public health benefits of urban trees",
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
      "Across the 1,000 largest global cities (2003–2020), declining urban population density attenuates the rise in population-weighted surface urban heat island extremes by approximately 0.5 K per decade per 1,000 persons/km²/year decrease in density",
      "Cities undergoing densification face disproportionately greater increases in population-weighted exposure to surface heat extremes compared to area-average trends",
      "Vegetation changes show a moderate association with population-weighted heat exposure (R² = 0.56), while variations in surface albedo exhibit a negligible relationship (R² = 0.03)",
      "Highlights the need for strategic urban planning that balances compact development co-benefits against amplified heat exposure risks in rapidly densifying cities",
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
      "Analyzes over 3,000 cities globally to reveal universal sub-linear scaling of built mass with population, with a city-level scaling exponent of β ≈ 0.90 meaning larger cities use less built mass per capita",
      "Finds that neighborhood-level scaling exhibits an even smaller exponent (δ ≈ 0.75) than city-level scaling (β ≈ 0.90), demonstrating that economies of scale in built mass intensify at finer spatial resolutions",
      "Proposes a theoretical framework showing that city-level sub-linear scaling emerges from the aggregation of within-city neighborhood-level disparities, establishing a nested multi-scale scaling relationship",
      "Redefines 'over-built' and 'under-built' conditions as deviations from expected scaling patterns, linking excess built mass to environmental impact and deficient built mass to inadequate living standards",
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
      "Implements a probabilistic inundation mapping method on Google Earth Engine using Sentinel-1 SAR data and land-cover-specific local thresholds derived from fitted Gamma distributions",
      "Achieves strong accuracy with Brier Scores of 0.05–0.07, Logarithmic Loss of 0.1–0.2, and Expected Calibration Error of 0.03–0.04 across flood events on five continents",
      "Produces pixel-level inundation probability estimates rather than binary classification, enabling uncertainty quantification in flood mapping",
      "Enables rapid, scalable flood mapping through Google Earth Engine with user-refinable local thresholds for operational disaster response across diverse geographic settings",
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
      "Applies a difference-in-differences causal framework to 77 demolished informal settlements and 584 control sites across Beijing, Shanghai, and Guangzhou (2002–2022), establishing a clear causal cooling signal of approximately 1.5 K",
      "Shows that post-demolition cooling depends on subsequent land use, with greening standards and lower floor-area ratios reinforcing temperature reduction",
      "Finds the cooling effect varies by climate context, with stronger thermal benefits in drier cities like Beijing compared to more humid cities",
      "Notes the total demolished area across the three cities is only approximately 7.7 km², cautioning that surface temperature reductions cannot be directly equated with health benefits",
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
      "Integrating building height and protection standards shifts the global flood damage distribution: Southeast Asia accounts for 42% of damages versus only 15% under conventional flood-depth-only assessments",
      "Sole reliance on flood depth overestimates risk in regions with resilient vertical urban forms and robust protection (e.g., Europe, East Asia) while underestimating it in areas with low-rise, unprotected development",
      "Chinese cities show strong dependence on protection systems that can reduce potential flood damages by over 90%, as illustrated by Wuhan where damages drop to 0.12%–0.17% after accounting for its 100-year protection standard",
      "Countries such as Vietnam, Cambodia, Bangladesh, Thailand, and Pakistan show high vulnerability, with more than 30% of building footprints located within floodplains",
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
      "Uses 1.5 million mobile phone records from 254 urban parks in Tokyo to classify parks by temporal visitation rhythms across daily, weekly, and seasonal scales, challenging traditional static size-based park classification",
      "Reveals that park visitation patterns are shaped by user preference variation and accessibility barriers, with parks rhythmized by seasonal events and daily routines such as commuting and exercise",
      "Proposes four modes of action for temporal park planning: year-round activity tracing, temporary and tactical designs, inclusive park systems for spatiotemporal equity, and public engagement cultivating a sense of time and identity",
      "Demonstrates how temporal insights inform targeted design interventions, such as fitness infrastructure for morning-popular neighborhood parks and extended operating hours for long-evening central parks",
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
      "Among 3,763 Shanghai residents surveyed during the 2022 COVID-19 lockdown, lower socioeconomic status was significantly associated with higher depressive symptoms and anxiety (B = 0.173 and B = 0.147, p < 0.001)",
      "Neighborhood social capital, community management quality, and frequency of online social connections via WeChat partially mediated the association between socioeconomic status and mental health outcomes",
      "Neighborhood social capital and online social connections also moderated SES-driven mental health inequalities, mitigating the disparity in depressive symptoms and anxiety among lower-SES residents",
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
      "Short-term exposure to all six ambient air pollutants (PM2.5, PM10, NO2, CO, SO2, O3) was significantly associated with increased daily hospital visits for anxiety disorders in Qingyuan, Guangdong Province, even at concentrations below China's and WHO's standards",
      "NO2 showed the strongest association (OR = 1.19, 95% CI: 1.05–1.34 per IQR increase at lag 0–7 days), followed by CO (OR = 1.14 at lag 0–2 days), with robust results across sensitivity analyses",
      "Subgroup analyses revealed that females and middle-aged individuals were more susceptible to air-pollution-related anxiety disorder hospital visits than males and other age groups",
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
      "Under SSP3-7.0, labor workability across 217 BRI projects in 70 countries could decrease by 31% by end of century, three times the 10% decline under SSP1-2.6, due to rising wet bulb globe temperatures",
      "Under SSP2-4.5, floods with a historical 10-year return period are projected to occur every 5 years at BRI project sites, effectively doubling flood frequency",
      "Regional flood risk varies substantially, with 100-year floods projected to recur every 15 years in South Asia and every 24 years in Sub-Saharan Africa",
      "These largely overlooked climate risks threaten the commercial viability and loan repayment capacity of BRI infrastructure projects collectively valued at an estimated $1 trillion",
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
      "Convection-permitting WRF simulations coupled with an Urban Canopy Model show that both mega-city development and near-future warming independently enhance the frequency and intensity of hourly extreme rainfall over the Greater Bay Area",
      "Urban expansion has a comparable effect on local extreme rainfall as near-future (2001–2050) climate warming, nearly doubling the frequency of very heavy rainfall events exceeding 90 mm/hr over urban areas",
      "Observational records from 1971 to 2016 confirm that both intensity and frequency of extreme rainfall increased by more than 5% per decade across most Greater Bay Area mega-cities, concurrent with rapid urban expansion",
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
      "Couples urban growth projections with WRF regional climate modeling to quantify future urbanization impacts on local climate in the Pearl River Delta mega-urban region",
      "Shows that urban expansion substantially modifies local temperature and precipitation patterns beyond background climate change under multiple RCP scenarios",
      "Finds that future land-use change contributes an additional warming signal comparable in magnitude to the urban heat island effect under current conditions",
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
      "Projects global urban land expansion through 2100 under all five SSPs, with SSP5 yielding the greatest total urban land area and SSP1/SSP4 showing turning points in the 2080s/2070s as socioeconomic growth slows",
      "Approximately 50–63% of newly expanded urban land worldwide is projected to replace existing croplands, making agricultural land the dominant land-cover type lost to urbanization",
      "The resulting cropland loss is estimated to reduce global crop production by 1–4%, equivalent to the annual food requirements of 122 to 1,389 million people depending on the SSP scenario",
      "China and the United States face the largest urban expansion under SSP5, whereas Latin American regions experience greater expansion under SSP3, reflecting regionally distinct urbanization pressures",
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
      "Produces annual maps of global urban land at 30-meter resolution from 1985 to 2015, revealing an 80% increase in the world's urban footprint from approximately 362,000 km² to 653,000 km²",
      "China and the United States together accounted for nearly half of the global net increase in urban land, with China's urban area expanding more than fourfold during the study period",
      "Global urban expansion disproportionately consumed cropland, with approximately 300,000 km² of agricultural land converted to urban uses, raising food security concerns",
      "The rate of global urbanization accelerated markedly after 2000, with developing countries in Asia and Africa driving the fastest urban growth",
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
      "Projects that urban expansion will convert approximately 290,000 km² of natural habitat to urban land uses between 2000 and 2030, with the most severe losses in tropical coastal regions of China, Brazil, and Nigeria",
      "A systematic review of 922 studies found that 72% of research on direct urban impacts on biodiversity was conducted in high-income countries, despite the greatest projected habitat loss occurring in lower-income countries",
      "Indirect urban impacts on biodiversity, such as food consumption and resource demand, affect a far greater land area than direct habitat conversion, yet only 34% of reviewed studies quantified these indirect effects",
      "By 2030, urban areas will accommodate over 1.2 billion additional people globally, yet critical research gaps persist in tropical and Southern Hemisphere regions where urbanization-driven biodiversity loss is expected to be most severe",
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
      "Proposes the MACO method, assigning different ant types to different land uses, outperforming simulated annealing by ~4.5% and genetic algorithms by ~1.3% in overall land-use allocation utility",
      "Generates more spatially compact land-use patterns than competing methods, improving compactness over SA and GA by 8.9% and 1.7% respectively with significantly less computation time",
      "Addresses the exponentially growing solution space of large-area land-use allocation by incorporating spatial exchange mechanisms and optimizing across suitability, compactness, and conversion cost objectives",
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
      "Fugitive road dust PM2.5 emissions in urban Lanzhou were approximately 1,141 kg per day, accounting for 24.6% of total PM2.5 emissions, concentrated in areas of intense traffic and construction",
      "Constructs a high-resolution (500 × 500 m) road dust PM2.5 emissions inventory, finding emissions exceeding 30,000 µg/m²/day in areas with smaller particle sizes and higher traffic intensity",
      "Estimates 234.5 premature deaths attributable to road dust PM2.5 exposure in Lanzhou in 2017, underscoring that reducing road dust emissions is critical for public health in developing urban regions",
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
      "Introduces a novel SMI metric integrating spatial information from detected features with mutual information between reference and sensed images, achieving more robust registration than either metric alone",
      "Employs a two-phase searching strategy using ant colony optimization for continuous domains, first identifying approximate solutions via spatial information then refining with the combined SMI metric",
      "Demonstrates highly accurate automatic registration on multi-sensor remote sensing imagery (TM, SPOT, SAR) where conventional single-metric methods fail",
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
      "Natural dust sources contribute 81.0% of global dust emissions while anthropogenic sources contribute 19.0%, with natural emissions concentrated in hyper-arid regions and anthropogenic emissions in semi-arid and sub-humid regions",
      "Semi-arid regions exhibit the most complex interplay, accounting for 42.99% of global anthropogenic dust emissions due to diverse land cover types including grasslands, croplands, and urban areas",
      "The complex mix of natural and anthropogenic dust in semi-arid regions may be a crucial factor enhancing the observed warming trend over these areas under global climate change",
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
      "Produces 100-meter resolution gridded population projections for China under the SSPs using machine learning, revealing that 30–43% of population in existing coarse-resolution SSP grids is misallocated to non-urban land",
      "Projects that exposure to extreme heat in China will increase by 121–136% under RCP4.5 and 164–191% under RCP8.5 from 2015 to 2050, concentrated in high-density urbanized areas like the Yangtze and Pearl River Deltas",
      "All scenarios project accelerated population decline in China from 2020 to 2050, though provincial-level trends diverge significantly from the national trajectory",
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
      "Natural wetlands in Hangzhou Bay decreased at ~10 km² per year from 1984 to 2016, with the degradation rate quadrupling from ~4 to ~18 km²/year after establishment of an economic development zone in 2001",
      "Under a continued high-development scenario, the coastline is projected to move approximately 5.89 km inland, undermining coastal protections against sea level rise",
      "Wetland protection scenarios could mitigate projected degradation by approximately 20%, demonstrating that land-use simulation models can identify effective conservation strategies under rapid urbanization",
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
      "Global urban rivers emit an estimated 78.1 ± 3.5 Tg CO₂-equivalent annually, with GHG emissions per unit area nearly double those from non-urban rivers (~815 vs ~414 mmol CO₂-eq/m²/day)",
      "Elevated CH₄ and N₂O emissions are driven by widespread eutrophication and altered carbon and nutrient cycling, with the highest emissions in lower-middle-income countries where pollution control is deficient",
      "Highlights that pollution control in urban rivers is an underappreciated but important pathway for reducing urban greenhouse gas emissions, particularly in developing nations",
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
      "Develops a snow depth retrieval algorithm based on support vector regression that combines passive microwave brightness temperature with visible/infrared reflectance to improve accuracy over microwave-only approaches",
      "Visible and near-infrared measurements contain supplementary information about surface snowpack properties that, when integrated with 19 and 37 GHz data from SSM/I and SSMI/S sensors, significantly reduce retrieval uncertainties",
      "Validated in Xinjiang, China, demonstrating that combining data modalities captures snow cover characteristics more comprehensively than single-sensor retrieval methods",
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
      "For every 10% increase in urban tree cover, surface temperatures are reduced by 0.25 °C during the day and 0.04 °C at night, with trees in humid regions showing highest daytime cooling and arid zones the greatest nighttime cooling",
      "While climatic factors contribute nearly twice as much to tree cooling efficiency as nonclimatic factors, the nonlinear effects of nonclimatic variables such as impervious surface coverage offer actionable optimization thresholds",
      "Optimal impervious surface coverage for maximizing tree cooling is approximately 60% in arid regions and 40% in humid areas, providing practical guidance for climate-resilient nature-based urban cooling",
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
      "The urban heat island effect reduces global cold-related mortality by more than fourfold compared to the increase in heat-related mortality it causes, revealing a previously overlooked beneficial health effect during cold seasons",
      "Widely implemented urban cooling strategies such as green infrastructure and reflective roofs can have adverse net effects in high-latitude cities while benefiting some tropical cities, highlighting the need for place-specific approaches",
      "Proposes seasonal adjustments to roof albedo as an actionable strategy to simultaneously reduce both heat-related and cold-related mortality across diverse climate zones",
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
      "Urban moist heat in more than 2,300 Global South cities increased by 0.41 ± 0.01 °C per decade between 2003 and 2020, with urban browning contributing an additional 0.05 °C per decade in affected cities",
      "The loss of urban vegetation in Global South cities compounds warming trends driven by climate change and urbanization, disproportionately affecting vulnerable populations in regions such as Nigeria",
      "Introduces a new dataset for measuring urban moist heating rates, revealing that urban browning is an underrecognized driver of heat stress exacerbation in the developing world",
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
      "Integrates local self-similarity (LSS) descriptors, which capture common internal layout features across sensor types, with mutual information to handle images with both rigid and non-rigid radiometric distortions",
      "Uses a Bayesian probabilistic model for matching LSS feature ensembles, followed by particle swarm optimization to maximize combined self-similarity and mutual information for optimal correspondences",
      "Overcomes limitations of conventional registration algorithms that fail when common underlying visual features between different sensor images are not distinct",
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
      "Monitors the detailed spatiotemporal evolution of land development in the Qiantang New District reclamation area in China, revealing dramatic land-use changes under rapid urbanization pressures",
      "Identifies key historical drivers of land-use change in reclaimed coastal areas where understanding of long-term dynamics has been limited",
      "Provides a framework and insights for sustainable land management planning in rapidly urbanizing coastal reclamation regions",
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
      "Produces a building-scale height map across the contiguous United States circa 2020, revealing downtown areas average 12.4 m in height — more than double the 5.4 m average in suburban areas",
      "Three-dimensional building volume analysis reveals a significantly larger urban-rural gap in living spaces than two-dimensional footprint analysis alone, highlighting the importance of vertical structure",
      "Urban regions offer more limited per-capita living spaces compared to rural areas, but the higher density reduces inequality in living space distribution within urban settings",
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
      "Air conditioning systems can reduce indoor temperatures by up to 18 °C but cause substantial nighttime outdoor warming of 2–2.5 °C in high-density urban neighborhoods, creating a thermal equity problem",
      "Increasing the target indoor AC temperature by just 2 °C can reduce outdoor temperatures by up to 1 °C in high-density areas, while reducing the spatial cooled fraction can cut energy consumption by up to 50%",
      "Uses coupled WRF and building energy modeling in Chongqing to demonstrate that moderate AC usage adjustments and temporal scheduling can balance indoor comfort, outdoor heat mitigation, and energy resilience",
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
      "Integrates three major computational components — cellular automata (CA), multi-agent systems (MAS), and swarm intelligence (SI) — into the unified GeoSOS platform for process-based geographical modeling",
      "Includes multiple CA algorithms (MCE-CA, Logistic-CA, PCA-CA, ANN-CA, Decision-tree-CA) that automatically derive transition rules through data mining for simulating urban growth and land-use change",
      "Couples simulation models with optimization models, demonstrating more satisfactory modeling results under complex changing environments than either approach alone",
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
      "Constructs both indirect and direct anthropogenic dust emission schemes validated against CALIPSO satellite observations, identifying high emission centers in India, eastern China, North America, and Africa",
      "Pasturelands contribute approximately 60% of indirect anthropogenic dust emissions, substantially more than croplands, while urban areas emit more (13.5 µg/m²/s) than rural areas (7.9 µg/m²/s)",
      "Unlike natural dust emissions with strong seasonal variation, indirect anthropogenic dust emissions show minimal seasonal fluctuation, highlighting that human-driven dust is a persistent year-round concern",
    ],
    keywords: ["anthropogenic dust emissions", "global dust", "atmospheric modeling", "air quality", "human-caused dust"],
  },
];

// Keep the old name for backwards compat
export const FALLBACK_PUBLICATIONS = CURATED_PUBLICATIONS;
