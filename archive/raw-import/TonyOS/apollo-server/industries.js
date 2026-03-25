// Non-target industries (detected but NOT Natoli markets)
export const NON_TARGET_INDUSTRIES = [
  "food_beverages", "retail", "software", "technology", "financial", 
  "real_estate", "hospitality", "media", "education", "healthcare_services"
];

// Patterns for non-target industries (to exclude from primary market)
const NON_TARGET_PATTERNS = {
  food_beverages: /(food & beverage|food and beverage|beverage company|food company|snack|candy manufacturer|chocolate|dairy company|frozen food)/i,
  retail: /(retail|e-commerce|ecommerce|shopping|stores|supermarket|grocery)/i,
  software: /(software|saas|cloud computing|web development|mobile app)/i,
  technology: /(information technology|it services|computer|tech company)/i,
  financial: /(financial services|banking|insurance|investment|fintech)/i,
  real_estate: /(real estate|property|housing|construction(?! material))/i,
  hospitality: /(hospitality|hotel|restaurant|tourism|travel)/i,
  media: /(media|entertainment|broadcasting|publishing|advertising)/i,
  education: /(education|university|school|training|e-learning)/i,
  healthcare_services: /(healthcare services|hospital|clinic|medical practice|health system)/i
};

export const INDUSTRIES = {
  // Core Markets
  pharmaceutical: {
    naics: ["325412"],
    division: ["scientific", "engineering"],
    keywords: ["pharmaceutical", "pharma", "drug manufacturer", "medicine manufacturer", "biopharm", "drug development"]
  },
  generic_pharma: {
    naics: ["325412"],
    division: ["scientific", "engineering"],
    keywords: ["generic pharma", "generics manufacturer", "anda", "generic drug"]
  },
  nutraceutical: {
    naics: ["311919", "325411"],
    division: ["engineering"],
    keywords: ["nutraceutical", "dietary supplement", "vitamin manufacturer", "supplement manufacturer", "herbal supplement"]
  },
  veterinary: {
    naics: ["325414"],
    division: ["scientific"],
    keywords: ["veterinary pharma", "animal health pharma", "vet pharma", "animal pharmaceutical"]
  },
  cannabis: {
    naics: ["325411"],
    division: ["scientific"],
    // Cannabis keywords - match explicit cannabis terms (not food/beverages)
    keywords: ["cannabis", "marijuana", "cbd", "thc", "dispensary", "hemp", "medical marijuana", "recreational cannabis"]
  },
  
  // Energy & Materials
  battery_manufacturing: {
    naics: ["335912", "335911"],
    division: ["engineering"],
    keywords: ["battery", "lithium", "electrode", "energy storage", "fuel cell", "coin cell", "alkaline", "cathode", "anode", "sodium-ion", "solid-state battery"]
  },
  nuclear: {
    naics: ["541713", "325199"],
    division: ["scientific"],
    keywords: ["nuclear", "fuel pellet", "reactor", "smr", "small modular reactor", "uranium"]
  },
  hydrogen_storage: {
    naics: ["325199"],
    division: ["engineering"],
    keywords: ["hydrogen storage", "metal hydride", "h2 storage"]
  },
  catalyst: {
    naics: ["325199"],
    division: ["scientific"],
    keywords: ["catalyst", "catalytic", "chemical processing", "petrochemical", "refinery"]
  },
  carbon_capture: {
    naics: ["325199"],
    division: ["engineering"],
    keywords: ["carbon capture", "sorbent", "co2 capture"]
  },
  
  // Advanced Manufacturing
  advanced_ceramics: {
    naics: ["327910"],
    division: ["engineering"],
    keywords: ["advanced ceramic", "technical ceramic", "aerospace ceramic"]
  },
  advanced_materials: {
    naics: ["327910", "332117"],
    division: ["scientific"],
    keywords: ["powder metal", "sintering", "ceramic", "advanced material"]
  },
  rare_earth_magnets: {
    naics: ["335991"],
    division: ["engineering"],
    keywords: ["rare earth", "neodymium", "samarium", "permanent magnet"]
  },
  semiconductor: {
    naics: ["334413"],
    division: ["engineering"],
    keywords: ["semiconductor", "wafer", "chip manufacturing"]
  },
  space_materials: {
    naics: ["336414"],
    division: ["engineering"],
    keywords: ["space material", "satellite", "aerospace"]
  },
  
  // Defense
  explosives: {
    naics: ["325920"],
    division: ["engineering"],
    keywords: ["explosive", "propellant", "ordnance", "energetic material", "pyrotechnic"]
  },
  ammunition: {
    naics: ["332992", "332993"],
    division: ["engineering"],
    keywords: ["ammunition", "ballistic", "bullet", "cartridge"]
  },
  
  // Industrial & Specialty
  abrasives: {
    naics: ["327910"],
    division: ["engineering"],
    keywords: ["abrasive", "grinding media", "grinding wheel"]
  },
  medical_implants: {
    naics: ["339113"],
    division: ["scientific", "engineering"],
    keywords: ["medical implant", "orthopedic", "prosthetic"]
  },
  cosmetics: {
    naics: ["325620"],
    division: ["engineering"],
    keywords: ["cosmetic", "pressed powder", "makeup", "beauty"]
  },
  agricultural: {
    naics: ["325314"],
    division: ["engineering"],
    keywords: ["agricultural", "fertilizer", "micronutrient"]
  },
  animal_feed: {
    naics: ["311119"],
    division: ["engineering"],
    keywords: ["animal feed", "livestock supplement", "feed additive"]
  },
  confectionery: {
    naics: ["311340"],
    division: ["engineering"],
    keywords: ["confectionery", "candy", "mint", "lozenge"]
  }
};

export const PRIMARY_NAICS = [
  "325412", "325411", "325414", "311919", 
  "541713", "325199", "327910", "332117"
];

// Check if company is in a non-target industry (should NOT be marked as primary market)
function isNonTargetIndustry(industry, allText) {
  const industryLower = (industry || "").toLowerCase();
  
  // Check if this is an explicit food/beverage company
  if (industryLower.includes("food") || industryLower.includes("beverage")) {
    // Exception: Check if they also have explicit Natoli keywords
    // Use word boundary matching to avoid "thc" matching "healthcare"
    const natoliKeywords = ["cannabis", "marijuana", "pharmaceutical", "pharma", 
      "nutraceutical", "dietary supplement", "battery", "electrode", "nuclear"];
    // Separate check for short keywords that need word boundaries
    const shortKeywords = ["cbd", "thc"];
    
    const matchedLongKeyword = natoliKeywords.find(k => allText.includes(k));
    const matchedShortKeyword = shortKeywords.find(k => {
      const regex = new RegExp(`\\b${k}\\b`, 'i');
      return regex.test(allText);
    });
    const hasNatoliKeyword = matchedLongKeyword || matchedShortKeyword;
    
    if (!hasNatoliKeyword) {
      return true;
    }
  }
  
  // Check other non-target industry names
  const nonTargetIndustries = [
    "restaurants", "consumer goods", "software", "information technology", 
    "financial services", "real estate", "hospitality", "media", "education", 
    "staffing", "marketing", "legal", "accounting", "consulting", "telecommunications"
  ];
  
  if (nonTargetIndustries.some(name => industryLower.includes(name))) {
    return true;
  }
  
  return false;
}

export function detectIndustry(company) {
  const naics = company.naics_codes || [];
  const industry = (company.industry || "").toLowerCase();
  const keywords = (company.keywords || []).map(k => k.toLowerCase());
  const companyName = (company.name || "").toLowerCase();
  const allText = [industry, companyName, ...keywords].join(" ");

  // Check if non-target industry
  const isNonTarget = isNonTargetIndustry(industry, allText);

  // FIRST: Check if this is a non-target industry - return null if so
  // This prevents food companies like Nestlé from being misclassified
  if (isNonTargetIndustry(industry, allText)) {
    // Exception: If they have explicit Natoli-relevant NAICS codes, still check
    const hasRelevantNaics = naics.some(code => PRIMARY_NAICS.some(p => 
      code.startsWith(p.slice(0, 4)) || p.startsWith(code)
    ));
    if (!hasRelevantNaics) {
      return null;
    }
  }

  // Priority industries - check these first with broader matching
  // Note: cannabis comes BEFORE pharmaceutical because cannabis companies 
  // often have "pharmaceuticals" as secondary keyword
  const priorityOrder = [
    "battery_manufacturing", "nuclear", "hydrogen_storage", "catalyst",
    "cannabis", "pharmaceutical", "generic_pharma", "nutraceutical", "veterinary",
    "advanced_ceramics", "rare_earth_magnets", "explosives", "ammunition"
  ];

  // Check priority industries first - use NAICS matching (more reliable)
  for (const name of priorityOrder) {
    const config = INDUSTRIES[name];
    if (!config) continue;
    
    // NAICS prefix matching (e.g., "33591" matches "335912")
    if (config.naics.some(code => naics.some(n => n.startsWith(code.slice(0, 4)) || code.startsWith(n)))) {
      return { name, ...config };
    }
  }
  
  // Now check priority industries by keyword (stricter matching)
  for (const name of priorityOrder) {
    const config = INDUSTRIES[name];
    if (!config) continue;
    
    if (config.keywords.some(k => allText.includes(k))) {
      return { name, ...config };
    }
  }

  // Then check remaining industries (cannabis, cosmetics, etc.)
  for (const [name, config] of Object.entries(INDUSTRIES)) {
    if (priorityOrder.includes(name)) continue; // Already checked
    
    // NAICS first
    if (config.naics.some(code => naics.some(n => n.startsWith(code.slice(0, 4)) || code.startsWith(n)))) {
      return { name, ...config };
    }
    // Keywords second
    if (config.keywords.some(k => allText.includes(k))) {
      return { name, ...config };
    }
  }

  return null;
}
