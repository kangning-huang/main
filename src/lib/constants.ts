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
  internalPath?: string;
  imagePath?: string;
}

export const PROJECTS: Project[] = [
  {
    title: "Robotaxi Safety Tracker",
    description:
      "A data-driven dashboard tracking Tesla Cybercab safety performance using NHTSA Standing General Order crash data. Provides transparent, independent analysis of autonomous vehicle safety metrics including miles per incident (MPI) comparisons.",
    url: "https://robotaxi-safety-tracker.com",
    tags: ["Data Visualization", "Autonomous Vehicles", "Safety Analytics"],
    featured: true,
    // imagePath: "/projects/robotaxi-safety-tracker.jpg", // Run `npm run screenshots` to generate
  },
  {
    title: "Nested Scaling of City Mass",
    description:
      "Interactive visualization accompanying the paper on nested economies of scale in global city built mass. Explores the nonlinear scaling relationships between urban populations and their built environments across 3,000+ cities.",
    url: "https://kangning-huang.github.io/nested-scaling-city-mass/",
    tags: ["Urban Scaling", "Interactive Visualization", "Nature Cities"],
    featured: true,
    // imagePath: "/projects/nested-scaling-city-mass.jpg", // Run `npm run screenshots` to generate
  },
  {
    title: "Urban Expansion 2050",
    description:
      "Projected global urban land expansion through 2050. Based on the research published in Environmental Research Letters (2019), with data available on WRI Resource Watch.",
    url: "/urban-expansion",
    tags: ["Urban Modeling", "Remote Sensing"],
    featured: true,
    internalPath: "/urban-expansion",
  },
  {
    title: "3D Urban Flood Risk",
    description:
      "Interactive web app for the paper on integrating building height and protection standards in global flood risk assessment. Visualizes 3D urban flood exposure across cities worldwide.",
    url: "https://kangning-huang.github.io/3D-urban-flood-risk/",
    tags: ["Flood Risk", "3D Visualization", "Interactive"],
    featured: true,
    // imagePath: "/projects/3d-urban-flood-risk.jpg", // Run `npm run screenshots` to generate
  },
  {
    title: "Urban Renewal Cooling DID",
    description:
      "Interactive visualization of key results from the paper on the causal link between informal settlement demolition and urban cooling. Uses a difference-in-differences approach to unveil cooling effects of urban renewal.",
    url: "https://kangning-huang.github.io/urban-renewal-cooling-DID/",
    tags: ["Urban Cooling", "Causal Inference", "Interactive Visualization"],
    featured: true,
    // imagePath: "/projects/urban-renewal-cooling-did.jpg", // Run `npm run screenshots` to generate
  },
  {
    title: "URBANMOD-ZIPF",
    description:
      "A global-scale urban land expansion model that preserves Zipf's Law of urban sizes. Open-source tool for simulating realistic patterns of urban growth across different scenarios.",
    url: "https://github.com/kangning-huang",
    tags: ["Urban Modeling", "Open Source", "Python"],
    featured: false,
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
    authors: "K Huang, X Li, X Liu, KC Seto",
    venue: "Environmental Research Letters",
    year: 2019,
    citationCount: 466,
    doi: "10.1088/1748-9326/ab4b71",
    isLeadAuthor: true,
    webUrl: "https://kangning-huang.github.io/main/urban-expansion",
  },
  {
    title: "An improved artificial immune system for seeking the Pareto front of land-use allocation problem in large areas",
    authors: "K Huang, X Liu, X Li, J Liang, S He",
    venue: "International Journal of Geographical Information Science",
    year: 2013,
    citationCount: 106,
    doi: "10.1080/13658816.2012.730147",
    isLeadAuthor: true,
  },
  {
    title: "Persistent increases in nighttime heat stress from urban expansion despite heat island mitigation",
    authors: "K Huang, X Lee, B Stone Jr, J Knievel, ML Bell, KC Seto",
    venue: "Journal of Geophysical Research: Atmospheres",
    year: 2021,
    citationCount: 66,
    doi: "10.1029/2020JD033831",
    isLeadAuthor: true,
  },
  {
    title: "Facilitating urban climate forecasts in rapidly urbanizing regions with land-use change modeling",
    authors: "K Huang, J Leng, Y Xu, X Li, M Cai, R Wang, C Ren",
    venue: "Urban Climate",
    year: 2021,
    citationCount: 24,
    isLeadAuthor: true,
  },
  {
    title: "Urban forests facing climate risks",
    authors: "K Huang",
    venue: "Nature Climate Change",
    year: 2022,
    citationCount: 17,
    isLeadAuthor: true,
  },
  {
    title: "Declining urban density attenuates rising population exposure to surface heat extremes",
    authors: "K Huang, B Stone Jr, C Guan, J Liang",
    venue: "Scientific Reports",
    year: 2025,
    citationCount: 3,
    doi: "10.1038/s41598-025-96045-z",
    isLeadAuthor: true,
  },
  {
    title: "Nested economies of scale in global city mass",
    authors: "K Huang, M Lu",
    venue: "arXiv preprint (in revision at Nature Cities)",
    year: 2025,
    citationCount: 0,
    url: "https://arxiv.org/abs/2507.03960",
    isLeadAuthor: true,
    webUrl: "https://kangning-huang.github.io/nested-scaling-city-mass/",
  },
  // Last author
  {
    title: "Rapid Probabilistic Inundation Mapping Using Local Thresholds and Sentinel-1 SAR Data on Google Earth Engine",
    authors: "J Liang, D Liu, L Feng, K Huang",
    venue: "Remote Sensing",
    year: 2025,
    citationCount: 1,
    doi: "10.3390/rs17101747",
    isLeadAuthor: true,
  },
  {
    title: "Unveiling the causal link between informal settlement demolition and urban cooling",
    authors: "Y Sun, X Gao, J Liang, K Huang",
    venue: "npj Environmental Social Science",
    year: 2025,
    citationCount: 0,
    isLeadAuthor: true,
    preprint: "https://www.researchsquare.com/article/rs-7288639/v1",
    webUrl: "https://kangning-huang.github.io/urban-renewal-cooling-DID/",
  },
  {
    title: "Integrating Building Height and Protection Standards in Global Urban Flood Risk Assessment",
    authors: "J Liang, I Hilaly, X Gao, C Guan, Y Li, K Huang",
    venue: "preprint",
    year: 2025,
    citationCount: 0,
    isLeadAuthor: true,
    preprint: "https://www.researchsquare.com/article/rs-6900146/v1",
    webUrl: "https://kangning-huang.github.io/3D-urban-flood-risk/",
  },
  {
    title: "Planning for rhythmized urban parks: Temporal park classification and modes of action",
    authors: "X Ren, C Guan, S Chen, M You, Y Li, K Huang",
    venue: "Journal of the American Planning Association",
    year: 2026,
    citationCount: 2,
    doi: "10.1080/01944363.2025.2523604",
    isLeadAuthor: true,
  },
  {
    title: "Unequal Effects of the Lockdown on Mental Health in Shanghai: The Moderating and Mediating Role of Neighborhood Environment and Online Social Connections",
    authors: "Y Pei, X Qi, G Li, W Tang, K Huang, BJ Hall, B Wu",
    venue: "Journal of Community Psychology",
    year: 2025,
    citationCount: 2,
    isLeadAuthor: false,
  },
  {
    title: "Short-Term Effect of Air Pollution on Daily Hospital Visits for Anxiety Disorders in Southern China",
    authors: "X Zhong, T Guo, J Zhang, Q Wang, R Yin, K Wu, Q Zou, M Zheng, BJ Hall, AMN Renzaho, K Huang, W Chen",
    venue: "Toxics",
    year: 2025,
    citationCount: 4,
    doi: "10.3390/toxics13010045",
    isLeadAuthor: false,
  },
  {
    title: "Measuring rising heat and flood risk along the belt-and-road initiative",
    authors: "J Liang, MA Carrai, AA Malik, X Gao, X Gao, L Feng, K Huang",
    venue: "Discover Environment",
    year: 2024,
    citationCount: 1,
    isLeadAuthor: true,
  },
  {
    title: "Mega-city development impact on hourly extreme rainfall over the South China Greater Bay Area under near-future climate warming",
    authors: "C Hu, CY Tam, X Li, K Huang, C Ren, KY Fung, Z Wang",
    venue: "Urban Climate",
    year: 2023,
    citationCount: 21,
    isLeadAuthor: false,
  },
  {
    title: "Investigating future urbanization's impact on local climate under different climate change scenarios in MEGA-urban regions: A case study of the Pearl River Delta, China",
    authors: "PS Yeung, JCH Fung, C Ren, Y Xu, K Huang, J Leng, MMF Wong",
    venue: "Atmosphere",
    year: 2020,
    citationCount: 26,
    isLeadAuthor: false,
  },
  // ── Co-author ──────────────────────────────────────────────
  {
    title: "Global projections of future urban land expansion under shared socioeconomic pathways",
    authors: "G Chen, X Li, X Liu, Y Chen, X Liang, J Leng, X Xu, W Liao, Y Qiu, Q Wu, K Huang",
    venue: "Nature Communications",
    year: 2020,
    citationCount: 937,
    doi: "10.1038/s41467-020-14386-x",
    isLeadAuthor: false,
  },
  {
    title: "High-spatiotemporal-resolution mapping of global urban change from 1985 to 2015",
    authors: "X Liu, Y Huang, X Xu, X Li, X Li, P Ciais, ... K Huang, ... Z Zeng",
    venue: "Nature Sustainability",
    year: 2020,
    citationCount: 843,
    doi: "10.1038/s41893-020-0521-x",
    isLeadAuthor: false,
  },
  {
    title: "Research gaps in knowledge of the impact of urban growth on biodiversity",
    authors: "RI McDonald, AV Mansur, F Ascensão, ... K Huang, ... C Ziter",
    venue: "Nature Sustainability",
    year: 2020,
    citationCount: 637,
    doi: "10.1038/s41893-019-0436-6",
    isLeadAuthor: false,
  },
  {
    title: "A multi-type ant colony optimization (MACO) method for optimal land use allocation in large areas",
    authors: "X Liu, X Li, X Shi, K Huang, Y Liu",
    venue: "International Journal of Geographical Information Science",
    year: 2012,
    citationCount: 167,
    doi: "10.1080/13658816.2011.635594",
    isLeadAuthor: false,
  },
  {
    title: "Fugitive Road Dust PM2.5 Emissions and Their Potential Health Impacts",
    authors: "S Chen, X Zhang, J Lin, J Huang, D Zhao, T Yuan, K Huang, ... L Xie",
    venue: "Environmental Science & Technology",
    year: 2019,
    citationCount: 150,
    doi: "10.1021/acs.est.9b00666",
    isLeadAuthor: false,
  },
  {
    title: "Automatic registration of multisensor images using an integrated spatial and mutual information (SMI) metric",
    authors: "J Liang, X Liu, K Huang, X Li, D Wang, X Wang",
    venue: "IEEE Transactions on Geoscience and Remote Sensing",
    year: 2013,
    citationCount: 110,
    doi: "10.1109/tgrs.2013.2242895",
    isLeadAuthor: false,
  },
  {
    title: "Quantifying contributions of natural and anthropogenic dust emission from different climatic regions",
    authors: "S Chen, N Jiang, J Huang, ... K Huang, ... T Feng",
    venue: "Atmospheric Environment",
    year: 2018,
    citationCount: 104,
    doi: "10.1016/j.atmosenv.2018.07.043",
    isLeadAuthor: false,
  },
  {
    title: "High-resolution gridded population projections for China under the shared socioeconomic pathways",
    authors: "Y Chen, X Li, K Huang, M Luo, M Gao",
    venue: "Earth's Future",
    year: 2020,
    citationCount: 77,
    isLeadAuthor: false,
  },
  {
    title: "Evaluation of historical and future wetland degradation using remote sensing imagery and land use modeling",
    authors: "T Hu, J Liu, G Zheng, D Zhang, K Huang",
    venue: "Land Degradation & Development",
    year: 2019,
    citationCount: 70,
    isLeadAuthor: false,
  },
  {
    title: "Globally elevated greenhouse gas emissions from polluted urban rivers",
    authors: "W Xu, G Wang, S Liu, ... K Huang, ... X Xia",
    venue: "Nature Sustainability",
    year: 2024,
    citationCount: 69,
    isLeadAuthor: false,
  },
  {
    title: "Improved snow depth retrieval by integrating microwave brightness temperature and visible/infrared reflectance",
    authors: "J Liang, X Liu, K Huang, X Li, X Shi, Y Chen, J Li",
    venue: "Remote Sensing of Environment",
    year: 2015,
    citationCount: 64,
    doi: "10.1016/j.rse.2015.06.016",
    isLeadAuthor: false,
  },
  {
    title: "Enhancing Climate-Driven Urban Tree Cooling with Targeted Nonclimatic Interventions",
    authors: "Z Yu, S Li, W Yang, ... K Huang, ... W Zhou",
    venue: "Environmental Science & Technology",
    year: 2025,
    citationCount: 29,
    doi: "10.1021/acs.est.4c14275",
    isLeadAuthor: false,
  },
  {
    title: "Dual impact of global urban overheating on mortality",
    authors: "S Wang, W Zhan, B Zhou, ... K Huang, ... M Li",
    venue: "Nature Climate Change",
    year: 2025,
    citationCount: 27,
    doi: "10.1038/s41558-025-02303-3",
    isLeadAuthor: false,
  },
  {
    title: "Exacerbated heat stress induced by urban browning in the Global South",
    authors: "H Du, W Zhan, B Zhou, ... K Huang, ... M Li",
    venue: "Nature Cities",
    year: 2025,
    citationCount: 0,
    doi: "10.1038/s44284-024-00184-9",
    isLeadAuthor: false,
  },
  {
    title: "Multi-sensor image registration by combining local self-similarity matching and mutual information",
    authors: "X Liu, S Chen, L Zhuo, J Li, K Huang",
    venue: "Frontiers of Earth Science",
    year: 2018,
    citationCount: 26,
    isLeadAuthor: false,
  },
  {
    title: "Long-term monitoring and evaluation of land development in a reclamation area under rapid urbanization",
    authors: "T Hu, J Fan, H Hou, Y Li, Y Li, K Huang",
    venue: "Land Degradation & Development",
    year: 2021,
    citationCount: 13,
    isLeadAuthor: false,
  },
  {
    title: "Mapping of individual building heights reveals the large gap of urban-rural living spaces in the contiguous US",
    authors: "Y Che, X Li, X Liu, X Xu, K Huang, ... X Li",
    venue: "The Innovation Geoscience",
    year: 2024,
    citationCount: 10,
    isLeadAuthor: false,
  },
  {
    title: "Moderating AC usage can reduce thermal disparity between indoor and outdoor environments",
    authors: "H Wei, B Chen, K Huang, M Gao, B Fan, T Zhang, Y Tu, B Xu",
    venue: "Environmental Science & Technology",
    year: 2024,
    citationCount: 6,
    doi: "10.1021/acs.est.4c05618",
    isLeadAuthor: false,
  },
  {
    title: "The implementation and application of geographical simulation and optimization systems (GeoSOS)",
    authors: "X Li, D Li, X Liu, C Lao, Y Zhang, J He, K Huang",
    venue: "Acta Scientiarum Natralium Universitatis Sunyatseni",
    year: 2010,
    citationCount: 15,
    isLeadAuthor: false,
  },
  {
    title: "Estimations of anthropogenic dust emissions at global scale from 2007 to 2010",
    authors: "S Chen, J Huang, N Jiang, ... K Huang, ... S Liao",
    venue: "Atmospheric Chemistry and Physics Discussions",
    year: 2017,
    citationCount: 5,
    isLeadAuthor: false,
  },
];

// Keep the old name for backwards compat
export const FALLBACK_PUBLICATIONS = CURATED_PUBLICATIONS;
