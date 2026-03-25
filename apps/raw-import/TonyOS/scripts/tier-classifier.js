const fs = require('fs');
const path = require('path');

const NATOLI_SCOPE = {
  accepted_form_factors: [
    "tablet", "compressed tablet", "chewable tablet", "pellet", "compact", "pressed solid", "lozenge"
  ],
  
  core_industries: [
    "pharmaceutical", "pharma", "drug product", "drug manufacturing", 
    "solid oral dosage", "solid dose", "tablet manufacturing",
    "generic pharma", "cdmo", "cmo", "contract development", "contract manufacturing",
    "pharmaceutical manufacturing", "pharmaceutical r&d"
  ],
  
  conditional_industries: [
    "nutraceutical", "dietary supplement", "vitamin", "supplement manufacturing",
    "cannabis", "otc drug", "consumer health",
    "catalyst", "catalyst manufacturing", "catalysis",
    "battery material", "battery manufacturing", "energy material", "energy storage",
    "nuclear material", "nuclear fuel", "uranium", "triso",
    "critical material", "specialty chemical", "fine chemical",
    "ceramics", "advanced ceramics", "technical ceramics",
    "confectionery", "compressed candy", "pressed mint"
  ],
  
  hard_excluded_industries: [
    "powder metallurgy", "metal injection", "structural ceramics",
    "construction", "real estate", "automotive structural", "aerospace structural",
    "sintered metal", "job shop", "welding", "sheet metal",
    "machine shop", "cnc", "forging", "casting",
    "retail", "grocery", "supermarket", "department store",
    "restaurant", "food service", "hospitality", "hotel",
    "insurance", "banking", "financial services",
    "software development", "it services", "saas",
    "marketing agency", "advertising agency", "consulting",
    "staffing", "recruiting", "human resources",
    "logistics", "transportation", "trucking", "shipping",
    "wholesale", "distribution", "warehousing"
  ],
  
  compaction_signals: [
    "tablet compression", "powder compaction", "pressed tablet",
    "pellet pressing", "compression force", "press force",
    "compaction", "pressing", "compressed", "pelletizing", "pelletization"
  ],
  
  tooling_signals: [
    "tablet press", "tablet tooling", "punch", "die", "die tooling",
    "punch tooling", "tool wear", "tool life", "compression tooling",
    "press performance", "tooling", "rotary press", "single station",
    "multi-tip", "turret"
  ],
  
  formulation_signals: [
    "formulation development", "powder formulation", "solid oral dosage",
    "granulation", "blend uniformity", "excipient", "binder",
    "lubricant", "porosity", "dissolution", "friability",
    "tablet hardness", "usp", "usp 1062", "formulation",
    "characterization", "analytical", "r&d", "scale-up", "tech transfer"
  ],
  
  negative_keywords: [
    "cnc machining", "job shop", "welding", "sheet metal",
    "casting", "forging", "injection molding", "construction",
    "plastics", "food processing", "beverage", "bakery",
    "cosmetics", "personal care", "packaging only", "labeling",
    "software", "it services", "marketing agency", "advertising",
    "consulting only", "staffing", "recruiting", "real estate",
    "insurance", "banking", "finance", "retail", "grocery",
    "restaurant", "hospitality", "hotel", "travel", "airline",
    "shipping", "logistics only", "warehouse only", "distribution only",
    "gummy", "gummies", "softgel", "capsule only", "liquid",
    "syrup", "spray", "gel", "molded candy", "dtc", "direct to consumer",
    "supermarket", "department store", "dollar store", "convenience store",
    "pharmacy chain", "drugstore chain"
  ],
  
  conditional_gates: {
    nutraceutical: {
      allow_only_if: ["tablet", "compression", "granulation", "formulation", "manufacturing"],
      block_if: ["gummy", "softgel", "capsule only", "dtc", "direct to consumer", "marketing brand", "retail"]
    },
    cannabis: {
      allow_only_if: ["compressed tablet", "dose uniformity", "powder formulation", "tablet", "manufacturing"],
      block_if: ["edible", "gummy", "vape", "flower", "pre-roll", "topical", "dispensary", "retail"]
    },
    confectionery: {
      allow_only_if: ["compressed", "tablet press", "pressed", "lozenge", "manufacturing"],
      block_if: ["molded", "gel", "liquid", "chocolate", "candy bar", "retail", "grocery"]
    },
    otc: {
      allow_only_if: ["chewable tablet", "compressed tablet", "tablet", "manufacturing"],
      block_if: ["liquid", "spray", "syrup", "cream", "ointment", "retail"]
    }
  },
  
  scoring: {
    core_industry_match: 4,
    conditional_industry_match: 2,
    form_factor_match: 3,
    compaction_signal: 2,
    tooling_signal: 3,
    formulation_signal: 3,
    apollo_tier_1_bonus: 4,
    apollo_tier_2_bonus: 2,
    high_compaction_confidence: 2,
    negative_penalty: -10
  },
  
  thresholds: {
    tier_1: 7,
    tier_2: 4
  }
};

function classifyCompany(company) {
  const name = (company.name || '').toLowerCase();
  const industry = (company.industry || '').toLowerCase();
  const keywords = (company.keywords || '').toLowerCase();
  const context = (company.natoliContext || '').toLowerCase();
  const storyContext = (company.storyContext || '').toLowerCase();
  const whyMatters = (company.whyMatters || '').toLowerCase();
  const allText = `${name} ${industry} ${keywords} ${context} ${storyContext} ${whyMatters}`;
  
  let score = 0;
  let signals = {
    industry: null,
    compaction: [],
    tooling: [],
    formulation: [],
    negatives: [],
    exclusion_reason: null
  };
  
  for (const excluded of NATOLI_SCOPE.hard_excluded_industries) {
    if (industry.includes(excluded) || name.includes(excluded)) {
      signals.exclusion_reason = `Hard excluded industry: ${excluded}`;
      return { tier: null, score: -10, signals, division: null, fit: null };
    }
  }
  
  for (const neg of NATOLI_SCOPE.negative_keywords) {
    if (name.includes(neg) || industry.includes(neg)) {
      signals.negatives.push(neg);
      score += NATOLI_SCOPE.scoring.negative_penalty;
    }
  }
  
  if (signals.negatives.length >= 1) {
    signals.exclusion_reason = `Negative keywords in name/industry: ${signals.negatives.join(', ')}`;
    return { tier: null, score, signals, division: null, fit: null };
  }
  
  if (company.apolloTier === '1') {
    score += NATOLI_SCOPE.scoring.apollo_tier_1_bonus;
  } else if (company.apolloTier === '2') {
    score += NATOLI_SCOPE.scoring.apollo_tier_2_bonus;
  }
  
  if (company.compactionConfidence && company.compactionConfidence.toLowerCase().includes('high')) {
    score += NATOLI_SCOPE.scoring.high_compaction_confidence;
  }
  
  let isCore = false;
  for (const ind of NATOLI_SCOPE.core_industries) {
    if (allText.includes(ind)) {
      signals.industry = ind;
      score += NATOLI_SCOPE.scoring.core_industry_match;
      isCore = true;
      break;
    }
  }
  
  if (!isCore) {
    for (const ind of NATOLI_SCOPE.conditional_industries) {
      if (allText.includes(ind)) {
        signals.industry = ind;
        score += NATOLI_SCOPE.scoring.conditional_industry_match;
        
        if (ind.includes('nutraceutical') || ind.includes('dietary') || ind.includes('vitamin') || ind.includes('supplement')) {
          const gate = NATOLI_SCOPE.conditional_gates.nutraceutical;
          const hasAllow = gate.allow_only_if.some(kw => allText.includes(kw));
          const hasBlock = gate.block_if.some(kw => allText.includes(kw));
          if (hasBlock) {
            signals.exclusion_reason = `Nutraceutical with blocking keyword`;
            return { tier: null, score: -5, signals, division: null, fit: null };
          }
        }
        
        if (ind.includes('cannabis')) {
          const gate = NATOLI_SCOPE.conditional_gates.cannabis;
          const hasBlock = gate.block_if.some(kw => allText.includes(kw));
          if (hasBlock) {
            signals.exclusion_reason = `Cannabis with blocking keyword`;
            return { tier: null, score: -5, signals, division: null, fit: null };
          }
        }
        break;
      }
    }
  }
  
  for (const ff of NATOLI_SCOPE.accepted_form_factors) {
    if (allText.includes(ff)) {
      score += NATOLI_SCOPE.scoring.form_factor_match;
      break;
    }
  }
  
  for (const sig of NATOLI_SCOPE.compaction_signals) {
    if (allText.includes(sig)) {
      signals.compaction.push(sig);
      score += NATOLI_SCOPE.scoring.compaction_signal;
      break;
    }
  }
  
  for (const sig of NATOLI_SCOPE.tooling_signals) {
    if (allText.includes(sig)) {
      signals.tooling.push(sig);
      score += NATOLI_SCOPE.scoring.tooling_signal;
      break;
    }
  }
  
  for (const sig of NATOLI_SCOPE.formulation_signals) {
    if (allText.includes(sig)) {
      signals.formulation.push(sig);
      score += NATOLI_SCOPE.scoring.formulation_signal;
      break;
    }
  }
  
  let tier = null;
  if (score >= NATOLI_SCOPE.thresholds.tier_1) {
    tier = 'Tier 1';
  } else if (score >= NATOLI_SCOPE.thresholds.tier_2) {
    tier = 'Tier 2';
  } else if (score > 0) {
    tier = 'Tier 3';
  }
  
  let division = null;
  let fit = null;
  
  const toolingExposure = (company.toolingExposure || '').toLowerCase();
  
  if (toolingExposure.includes('high') || signals.tooling.length > 0) {
    if (signals.formulation.length > 0 || context.includes('formulation')) {
      division = 'Both Divisions';
      fit = 'Full Solution';
    } else {
      division = 'Natoli Engineering';
      fit = 'Tooling';
    }
  } else if (signals.formulation.length > 0) {
    division = 'Natoli Scientific';
    fit = 'Formulation';
  } else if (signals.compaction.length > 0) {
    division = 'Natoli Scientific';
    fit = 'Formulation';
  } else if (signals.industry) {
    division = 'Natoli Scientific';
    fit = 'Formulation';
  }
  
  return { tier, score, signals, division, fit };
}

function processApolloExport(csvPath) {
  const csv = fs.readFileSync(csvPath, 'utf8');
  const lines = csv.split('\n');
  const rawHeaders = lines[0];
  const headers = parseCSVLine(rawHeaders);
  
  const getIdx = (patterns) => {
    for (const p of patterns) {
      const idx = headers.findIndex(h => h.toLowerCase().includes(p.toLowerCase()));
      if (idx >= 0) return idx;
    }
    return -1;
  };
  
  const companyIdx = getIdx(['Company Name', 'Company']);
  const industryIdx = getIdx(['Industry (normalized)', 'Industry']);
  const emailIdx = getIdx(['Email']);
  const titleIdx = getIdx(['Title']);
  const firstNameIdx = getIdx(['First Name']);
  const lastNameIdx = getIdx(['Last Name']);
  const linkedinIdx = getIdx(['Person Linkedin']);
  const phoneIdx = getIdx(['Corporate Phone', 'Phone']);
  const cityIdx = getIdx(['Company City', 'City']);
  const stateIdx = getIdx(['Company State', 'State']);
  const countryIdx = getIdx(['Company Country', 'Country']);
  const employeesIdx = getIdx(['Employee count', 'Employees']);
  const websiteIdx = getIdx(['Website']);
  const apolloTierIdx = getIdx(['Natoli Fit Tier']);
  const compactionConfIdx = getIdx(['Compaction Confidence']);
  const toolingExpIdx = getIdx(['Tooling Exposure']);
  const whyMattersIdx = getIdx(['Why This Account Matters']);
  const natoliContextIdx = getIdx(['Natoli Context']);
  const storyContextIdx = getIdx(['Story Context']);
  
  console.log('Key column indices:', {
    company: companyIdx,
    industry: industryIdx,
    apolloTier: apolloTierIdx,
    compactionConf: compactionConfIdx,
    toolingExp: toolingExpIdx,
    whyMatters: whyMattersIdx,
    natoliContext: natoliContextIdx
  });
  
  const companiesMap = {};
  let processed = 0;
  let excluded = 0;
  const exclusionReasons = {};
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = parseCSVLine(lines[i]);
    const companyName = (values[companyIdx] || '').trim();
    if (!companyName) continue;
    
    processed++;
    
    if (!companiesMap[companyName]) {
      const company = {
        name: companyName,
        industry: values[industryIdx] || '',
        keywords: '',
        website: values[websiteIdx] || '',
        employees: values[employeesIdx] || '',
        city: values[cityIdx] || '',
        state: values[stateIdx] || '',
        country: values[countryIdx] || '',
        apolloTier: values[apolloTierIdx] || '',
        compactionConfidence: values[compactionConfIdx] || '',
        toolingExposure: values[toolingExpIdx] || '',
        whyMatters: values[whyMattersIdx] || '',
        natoliContext: values[natoliContextIdx] || '',
        storyContext: values[storyContextIdx] || '',
        contacts: []
      };
      
      const result = classifyCompany(company);
      
      if (!result.tier) {
        excluded++;
        const reason = result.signals.exclusion_reason || 'Low score';
        exclusionReasons[reason] = (exclusionReasons[reason] || 0) + 1;
        continue;
      }
      
      companiesMap[companyName] = {
        ...company,
        tier: result.tier,
        score: result.score,
        signals: result.signals,
        division: result.division,
        fit: result.fit
      };
    }
    
    const email = (values[emailIdx] || '').trim();
    const title = (values[titleIdx] || '').trim();
    const firstName = (values[firstNameIdx] || '').trim();
    const lastName = (values[lastNameIdx] || '').trim();
    const fullName = `${firstName} ${lastName}`.trim();
    
    if (email && companiesMap[companyName]) {
      companiesMap[companyName].contacts.push({
        name: fullName,
        title: title,
        email: email,
        phone: values[phoneIdx] || '',
        linkedin: values[linkedinIdx] || ''
      });
    }
  }
  
  console.log(`\nProcessed ${processed} rows`);
  console.log(`Excluded ${excluded} (no qualifying tier)`);
  console.log(`Qualified companies: ${Object.keys(companiesMap).length}`);
  
  console.log('\nTop exclusion reasons:');
  Object.entries(exclusionReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([reason, count]) => {
      console.log(`  ${count}: ${reason}`);
    });
  
  return Object.values(companiesMap);
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  return values;
}

module.exports = { classifyCompany, processApolloExport, NATOLI_SCOPE };

if (require.main === module) {
  const csvPath = process.argv[2];
  
  if (!csvPath || !fs.existsSync(csvPath)) {
    console.error('Usage: node tier-classifier.js <path-to-apollo-csv>');
    process.exit(1);
  }
  
  console.log('Processing:', csvPath);
  const companies = processApolloExport(csvPath);
  
  const byTier = {};
  companies.forEach(c => {
    byTier[c.tier] = (byTier[c.tier] || 0) + 1;
  });
  
  console.log('\n=== TIER BREAKDOWN ===');
  Object.entries(byTier).sort().forEach(([tier, count]) => {
    console.log(`  ${tier}: ${count}`);
  });
  
  const byDivision = {};
  companies.forEach(c => {
    byDivision[c.division || 'Unknown'] = (byDivision[c.division || 'Unknown'] || 0) + 1;
  });
  
  console.log('\n=== DIVISION BREAKDOWN ===');
  Object.entries(byDivision).forEach(([div, count]) => {
    console.log(`  ${div}: ${count}`);
  });
  
  const byIndustry = {};
  companies.forEach(c => {
    const ind = c.industry || 'Unknown';
    byIndustry[ind] = (byIndustry[ind] || 0) + 1;
  });
  
  console.log('\n=== TOP INDUSTRIES ===');
  Object.entries(byIndustry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([ind, count]) => {
      console.log(`  ${count}: ${ind}`);
    });
  
  const totalContacts = companies.reduce((sum, c) => sum + c.contacts.length, 0);
  console.log(`\nTotal contacts: ${totalContacts}`);
  
  console.log('\n=== SAMPLE TIER 1 COMPANIES ===');
  companies.filter(c => c.tier === 'Tier 1').slice(0, 15).forEach(c => {
    console.log(`  ${c.name} | ${c.industry} | Score: ${c.score} | ${c.fit}`);
  });
  
  console.log('\n=== SAMPLE TIER 2 COMPANIES ===');
  companies.filter(c => c.tier === 'Tier 2').slice(0, 15).forEach(c => {
    console.log(`  ${c.name} | ${c.industry} | Score: ${c.score} | ${c.fit}`);
  });
  
  console.log('\n=== CATALYST COMPANIES ===');
  companies.filter(c => c.industry.toLowerCase().includes('catalyst')).forEach(c => {
    console.log(`  ${c.name} | ${c.tier} | Score: ${c.score}`);
  });
  
  console.log('\n=== BATTERY/ENERGY COMPANIES ===');
  companies.filter(c => c.industry.toLowerCase().includes('batter') || c.industry.toLowerCase().includes('energy')).forEach(c => {
    console.log(`  ${c.name} | ${c.tier} | Score: ${c.score}`);
  });
}
