import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { extractEvidence } from "./evidenceExtractor.js";
import { decideNatoliAccount } from "./revopsDecisionEngine.js";

const app = express();
app.use(express.json());

// Known company domain patterns for fallback when bot protection blocks scanning
const KNOWN_COMPANIES = {
  "nowfoods": { market: "Nutraceutical / Dietary Supplements", division: "Natoli Engineering", category: "nutraceutical" },
  "gnc": { market: "Nutraceutical / Dietary Supplements", division: "Natoli Engineering", category: "nutraceutical" },
  "naturemade": { market: "Nutraceutical / Dietary Supplements", division: "Natoli Engineering", category: "nutraceutical" },
  "centrum": { market: "Nutraceutical / Dietary Supplements", division: "Natoli Engineering", category: "nutraceutical" },
  "natrol": { market: "Nutraceutical / Dietary Supplements", division: "Natoli Engineering", category: "nutraceutical" },
  "jarrow": { market: "Nutraceutical / Dietary Supplements", division: "Natoli Scientific", category: "nutraceutical" },
  "solgar": { market: "Nutraceutical / Dietary Supplements", division: "Natoli Scientific", category: "nutraceutical" },
  "natoli": { market: "Industrial Powder Compaction", division: "Both", category: "default" },
  "natoliscientific": { market: "Industrial Powder Compaction", division: "Natoli Scientific", category: "default" },
  "pfizer": { market: "Pharmaceutical", division: "Both", category: "pharmaceutical" },
  "merck": { market: "Pharmaceutical", division: "Both", category: "pharmaceutical" },
  "gsk": { market: "Pharmaceutical", division: "Both", category: "pharmaceutical" },
  "novartis": { market: "Pharmaceutical", division: "Both", category: "pharmaceutical" },
  "teva": { market: "Generic Pharmaceutical", division: "Both", category: "pharmaceutical" },
  "zoetis": { market: "Veterinary Pharmaceutical", division: "Both", category: "pharmaceutical" },
  "curaleaf": { market: "Cannabis", division: "Both", category: "cannabis" },
  "trulieve": { market: "Cannabis", division: "Both", category: "cannabis" },
  "tesla": { market: "Battery Manufacturing / Energy Storage", division: "Both", category: "battery" },
  "quantumscape": { market: "Battery Manufacturing / Energy Storage", division: "Both", category: "battery" },
  "basf": { market: "Catalyst Manufacturing", division: "Both", category: "default" },
  "ceramtec": { market: "Advanced Ceramics", division: "Both", category: "default" },
};

const FALLBACK_PERSONAS = {
  "pharmaceutical": [
    { persona: "Director of R&D", tier: 1, division: "Natoli Scientific", risk: "Late-stage formulation surprises" },
    { persona: "VP of Manufacturing", tier: 1, division: "Natoli Engineering", risk: "Unplanned downtime from tool failure" }
  ],
  "nutraceutical": [
    { persona: "R&D Director", tier: 1, division: "Natoli Scientific", risk: "Formulation stability issues" },
    { persona: "VP of Operations", tier: 1, division: "Natoli Engineering", risk: "Production bottlenecks and tooling costs" }
  ],
  "battery": [
    { persona: "Director of R&D", tier: 1, division: "Natoli Scientific", risk: "Electrode density inconsistency" },
    { persona: "VP of Manufacturing", tier: 1, division: "Natoli Engineering", risk: "Tool wear impacting cell quality" }
  ],
  "cannabis": [
    { persona: "Formulation Director", tier: 1, division: "Natoli Scientific", risk: "Dosage uniformity" },
    { persona: "Operations Director", tier: 1, division: "Natoli Engineering", risk: "Scaling production" }
  ],
  "default": [
    { persona: "R&D / Formulation Lead", tier: 1, division: "Natoli Scientific", risk: "Development setbacks" },
    { persona: "Manufacturing Director", tier: 1, division: "Natoli Engineering", risk: "Unplanned downtime" }
  ]
};

const FALLBACK_STORYBRAND = {
  "pharmaceutical": {
    hero: "Pharmaceutical manufacturing teams",
    problem_external: "Tablet compression issues causing batch failures",
    guide_empathy: "We understand validation timelines and FDA scrutiny",
    cta: "Schedule a tooling assessment",
    success: "Predictable tablet quality and faster scale-up"
  },
  "nutraceutical": {
    hero: "Nutraceutical manufacturers",
    problem_external: "Inconsistent tablet quality and high tooling costs",
    guide_empathy: "We know the margin pressure you face",
    cta: "Get a production efficiency review",
    success: "Lower tooling costs and consistent quality"
  },
  "battery": {
    hero: "Battery cell manufacturers",
    problem_external: "Electrode compaction variability affecting performance",
    guide_empathy: "We understand precision requirements for next-gen batteries",
    cta: "Discuss your compaction challenges",
    success: "Consistent electrode quality and scalable production"
  },
  "cannabis": {
    hero: "Cannabis product manufacturers",
    problem_external: "Dosage uniformity and production scaling challenges",
    guide_empathy: "We understand the quality demands of this emerging market",
    cta: "Schedule a consultation",
    success: "Consistent product quality at scale"
  },
  "default": {
    hero: "Manufacturing teams working with powder compaction",
    problem_external: "Tooling wear, quality inconsistency, and downtime",
    guide_empathy: "We understand the pressure to deliver quality",
    cta: "Schedule a consultation",
    success: "Reduced downtime and consistent quality"
  }
};

function getKnownCompanyFallback(url) {
  const domain = url.toLowerCase().replace(/https?:\/\/(www\.)?/, "").split(".")[0];
  return KNOWN_COMPANIES[domain] || null;
}

function isBotProtected(html) {
  const lower = html.toLowerCase();
  return lower.includes("incapsula") || 
         lower.includes("cloudflare") || 
         lower.includes("captcha") ||
         lower.includes("challenge") ||
         html.length < 2000;
}

app.post("/scan", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL required" });

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });
    const html = await response.text();

    // Check for bot protection
    if (isBotProtected(html)) {
      const fallback = getKnownCompanyFallback(url);
      if (fallback) {
        const category = fallback.category || "default";
        const personas = FALLBACK_PERSONAS[category] || FALLBACK_PERSONAS["default"];
        const storybrand = FALLBACK_STORYBRAND[category] || FALLBACK_STORYBRAND["default"];
        
        return res.json({
          company_url: url,
          scan_method: "known_company_fallback",
          revops_decision: {
            market_gate: "pass",
            market_fit: fallback.market,
            detected_markets: [fallback.market],
            environment_tier: "Tier 1 Environment",
            persona_tiers: personas,
            signal_status: "Monitor",
            division_owner: fallback.division,
            routing_action: "Verify via Apollo enrichment for full intelligence",
            disqualification_reason: null,
            storybrand: storybrand,
            note: "Site has bot protection - using known company data"
          }
        });
      }
      return res.json({
        company_url: url,
        scan_method: "blocked",
        revops_decision: {
          market_gate: "unknown",
          market_fit: "Unable to scan",
          detected_markets: [],
          environment_tier: null,
          persona_tiers: [],
          signal_status: "Manual Review",
          division_owner: null,
          routing_action: "Use Apollo enrichment - site has bot protection",
          disqualification_reason: "Website has bot protection - recommend Apollo.io enrichment instead",
          storybrand: null
        }
      });
    }

    const $ = cheerio.load(html);
    const text = $("body").text();

    const evidence = extractEvidence(text);
    const decision = decideNatoliAccount(evidence);

    res.json({
      company_url: url,
      scan_method: "direct_scan",
      revops_decision: decision
    });

  } catch (err) {
    res.status(500).json({ error: "Scan failed", details: err.message });
  }
});

// Manufacturer discovery - keyword-based search
const MANUFACTURER_KEYWORDS = {
  chemicals: [
    "chlorine tablets manufacturer",
    "water treatment tablets manufacturing",
    "pool chlorine tablets manufacturer",
    "disinfectant tablets manufacturer",
    "effervescent chlorine tablets manufacturer",
    "chemical tablets manufacturing facility"
  ],
  pharmaceutical: [
    "pharmaceutical tablets manufacturer",
    "oral solid dosage manufacturing",
    "tablet compression facility",
    "drug tablet manufacturing"
  ],
  nutraceutical: [
    "supplement tablets manufacturer",
    "vitamin tablets manufacturing",
    "nutraceutical tablet production"
  ],
  industrial: [
    "industrial tablets manufacturer",
    "powder compaction manufacturing",
    "pellet manufacturing facility"
  ],
  catalyst: [
    "catalyst pellets manufacturer",
    "catalyst tablets manufacturing"
  ],
  battery: [
    "battery electrode manufacturer",
    "electrode compaction facility",
    "solid state battery manufacturing"
  ],
  ceramics: [
    "ceramic tablets manufacturer",
    "ceramic compaction facility"
  ]
};

function scoreManufacturingConfidence(text) {
  if (!text) return 0;
  const lower = text.toLowerCase();
  const keywords = [
    "manufacturer", "manufacturing", "production facility",
    "in-house production", "tablet manufacturing", "chemical manufacturing",
    "compaction", "pressing", "tablet press", "factory", "plant",
    "made in usa", "iso certified", "gmp certified", "fda registered"
  ];
  let score = 0;
  for (const k of keywords) {
    if (lower.includes(k)) score++;
  }
  return score;
}

function classifyNatoliFit(text, category) {
  const lower = (text || "").toLowerCase();
  const fit = {
    needsTooling: true,
    needsMachines: false,
    needsFormulation: false,
    division: "Engineering"
  };
  
  if (lower.includes("r&d") || lower.includes("research") || lower.includes("development") || lower.includes("formulation")) {
    fit.needsFormulation = true;
    fit.division = "Both";
  }
  if (lower.includes("press") || lower.includes("compaction") || lower.includes("tablet production")) {
    fit.needsMachines = true;
  }
  if (fit.needsFormulation && fit.needsMachines) {
    fit.division = "Both";
  }
  
  return fit;
}

app.post("/discover", async (req, res) => {
  try {
    const { category, customKeywords } = req.body;
    
    let keywords = [];
    if (customKeywords && Array.isArray(customKeywords)) {
      keywords = customKeywords;
    } else if (category && MANUFACTURER_KEYWORDS[category]) {
      keywords = MANUFACTURER_KEYWORDS[category];
    } else {
      keywords = Object.values(MANUFACTURER_KEYWORDS).flat().slice(0, 5);
    }
    
    const results = [];
    
    for (const keyword of keywords) {
      try {
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(keyword)}`;
        const response = await fetch(searchUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        
        $(".result").each((i, el) => {
          const title = $(el).find(".result__title").text().trim();
          const snippet = $(el).find(".result__snippet").text().trim();
          const link = $(el).find(".result__url").text().trim();
          
          if (title && link) {
            const confidence = scoreManufacturingConfidence(title + " " + snippet);
            const natoliFit = classifyNatoliFit(title + " " + snippet, category);
            
            const cleanName = title.split("–")[0].split("-")[0].split("|")[0].trim();
            const cleanUrl = link.startsWith("http") ? link : `https://${link}`;
            
            results.push({
              companyName: cleanName,
              website: cleanUrl,
              searchKeyword: keyword,
              snippet: snippet.substring(0, 200),
              confidenceScore: confidence,
              natoliFit: natoliFit,
              category: category || "general"
            });
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Search failed for: ${keyword}`, err.message);
      }
    }
    
    const unique = [];
    const seen = new Set();
    for (const r of results.sort((a, b) => b.confidenceScore - a.confidenceScore)) {
      const key = r.website.toLowerCase().replace(/https?:\/\/(www\.)?/, "").split("/")[0];
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(r);
      }
    }
    
    res.json({
      category: category || "all",
      totalFound: unique.length,
      companies: unique.slice(0, 50),
      keywordsUsed: keywords
    });
    
  } catch (err) {
    res.status(500).json({ error: "Discovery failed", details: err.message });
  }
});

app.get("/discover/categories", (req, res) => {
  res.json({
    categories: Object.keys(MANUFACTURER_KEYWORDS),
    description: "Available industry categories for manufacturer discovery"
  });
});

app.get("/", (req, res) => {
  res.send("Natoli RevOps Engine running - /scan for website analysis, /discover for manufacturer discovery");
});

const PORT = process.env.SCANNER_PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Natoli RevOps Engine running on port ${PORT}`);
  console.log(`Endpoints: /scan, /discover, /discover/categories`);
});
