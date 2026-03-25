import { COMPACTION_KEYWORDS, MARKETS } from "./natoliConfig.js";

const MARKET_PATTERNS = {
  // Core Markets
  "Pharmaceutical": /(pharmaceutical|pharma|drug|medicine|biopharm|biopharma)/i,
  "Generic Pharmaceutical": /(generic|generics|anda|abbreviated new drug)/i,
  "Nutraceutical / Dietary Supplements": /(nutraceutical|dietary supplement|vitamin|mineral|herbal|nutritional supplement|health supplement)/i,
  "Veterinary Pharmaceutical": /(veterinary|animal health|vet pharma|animal pharma)/i,
  "Cannabis": /(cannabis|marijuana|thc|cbd|dispensary|edible.*cannabis)/i,
  
  // Energy & Materials
  "Nuclear Fuel & SMR Materials": /(nuclear|smr|small modular reactor|fuel pellet|uranium|thorium)/i,
  "Battery Manufacturing / Energy Storage": /(battery|lithium|sodium.ion|solid.state battery|electrode|energy storage|fuel cell|coin cell|button cell|alkaline|cathode|anode|electrochemical)/i,
  "Hydrogen Storage Materials": /(hydrogen storage|hydrogen.*powder|metal hydride|h2 storage)/i,
  "Catalyst Manufacturing": /(catalyst|petrochemical|refinery catalyst|green fuel|catalytic)/i,
  "Carbon Capture Sorbents": /(carbon capture|sorbent|co2 capture|carbon sequestration)/i,
  
  // Advanced Manufacturing
  "Advanced Ceramics": /(advanced ceramic|technical ceramic|aerospace ceramic|defense ceramic|ceramic component)/i,
  "3D Printing Feedstock": /(3d print.*feedstock|additive manufacturing.*powder|metal powder.*printing|powder feedstock)/i,
  "Rare Earth Magnets": /(rare earth|neodymium|samarium|permanent magnet|magnet manufacturing)/i,
  "Semiconductor Materials": /(semiconductor|wafer|precursor tablet|ultra.clean|chip manufacturing)/i,
  "Space Materials": /(space material|satellite component|aerospace material|zero.defect)/i,
  
  // Defense & Security
  "Explosives & Propellants": /(explosive|propellant|ordnance|energetic material|pyrotechnic)/i,
  "Ammunition & Ballistics": /(ammunition|ballistic|bullet|cartridge|projectile)/i,
  
  // Industrial & Specialty
  "Abrasives & Grinding Media": /(abrasive|grinding media|grinding wheel|polishing compound)/i,
  "Medical Implants": /(medical implant|ceramic implant|composite implant|orthopedic|prosthetic)/i,
  "Cosmetics Pressed Powders": /(cosmetic.*powder|pressed powder|makeup compact|beauty.*tablet)/i,
  "Agricultural Pellets": /(agricultural.*pellet|micronutrient|fertilizer tablet|controlled release.*agri)/i,
  "Animal Feed Supplements": /(animal feed.*supplement|livestock supplement|feed additive|animal nutrition)/i,
  "Forensic Standards": /(forensic standard|reference material|analytical standard|calibration tablet)/i,
  "Recycling & Reclaimed Materials": /(recycl.*pellet|reclaimed material|waste.*compaction|circular economy)/i,
  "Art Conservation & Pigments": /(art conservation|pigment.*compact|restoration material|museum)/i,
  
  // General
  "Industrial Powder Compaction": /(powder compaction|tablet press|compacting|pellet press|briquette)/i
};

function detectMarket(text) {
  const lower = text.toLowerCase();
  const detectedMarkets = [];
  
  for (const [market, pattern] of Object.entries(MARKET_PATTERNS)) {
    if (pattern.test(lower)) {
      detectedMarkets.push(market);
    }
  }
  
  return detectedMarkets;
}

function isPrimaryMarket(markets) {
  const primaryKeywords = [
    // Core
    "pharmaceutical", "pharma", "generic", "nutraceutical", "dietary supplement",
    "veterinary", "cannabis",
    // Energy & Materials
    "nuclear", "smr", "battery", "energy storage", "hydrogen", "catalyst", "carbon capture",
    // Advanced Manufacturing
    "ceramic", "3d print", "rare earth", "magnet", "semiconductor", "space material",
    // Defense
    "explosive", "propellant", "ammunition", "ballistic",
    // Industrial & Specialty
    "abrasive", "grinding", "medical implant", "cosmetic", "agricultural", "animal feed",
    "forensic", "recycl", "art conservation", "pigment",
    // General
    "powder compaction", "advanced material"
  ];
  
  return markets.some(m => 
    primaryKeywords.some(k => m.toLowerCase().includes(k))
  );
}

export function extractEvidence(text) {
  const lower = text.toLowerCase();
  const detectedMarkets = detectMarket(text);

  return {
    compactionCritical: COMPACTION_KEYWORDS.some(k => lower.includes(k)),
    regulated: /(gmp|fda|ema|regulated|cgmp|ich|usp|ep |bp |quality|compliance|certified|iso|safety)/.test(lower),
    commercialScale: /(commercial|manufacturing|production|facility|plant|factory|operations|supply|global|worldwide|enterprise)/.test(lower),
    rdOrPilot: /(r&d|research|development|pilot|scale up|clinical|innovation|laboratory|lab |scientist|engineer)/.test(lower),
    hasRD: /(r&d|formulation|development|scientist|researcher)/.test(lower),
    hasMST: /(ms&t|process engineering|technology transfer|tech transfer)/.test(lower),
    hasEngineering: /(engineering|manufacturing|operations|tooling|maintenance)/.test(lower),
    scaleUpSignal: /(scale up|validation|tech transfer|expansion|new facility)/.test(lower),
    validationSignal: /(validation|qualification|ppq|pq|iq|oq)/.test(lower),
    detectedMarkets: detectedMarkets,
    isPrimaryMarket: isPrimaryMarket(detectedMarkets),
    marketFit: detectedMarkets.length > 0 ? detectedMarkets[0] : "Unknown"
  };
}
