/**
 * Reclassify Territory Data with Evidence-Based Tier Rules
 * 
 * Tier 1 = Verified pharmaceutical/CDMO with confirmed tablet manufacturing OR known companies
 * Tier 2 = Industry match + signals OR conditional industries with validation
 * Tier 3 = Needs validation/research
 * Excluded = Retail, services, non-manufacturing
 */

const fs = require('fs');
const path = require('path');

// KNOWN TIER 1 COMPANIES - Verified tablet press/compaction operations
const VERIFIED_TIER1_COMPANIES = [
  'pfizer', 'merck', 'eli lilly', 'abbvie', 'bristol-myers', 'gsk', 'glaxosmithkline',
  'astrazeneca', 'novartis', 'roche', 'sanofi', 'johnson & johnson', 'j&j',
  'takeda', 'gilead', 'regeneron', 'amgen', 'biogen', 'bayer', 'boehringer',
  'teva', 'mylan', 'sandoz', 'viatris', 'hikma', 'dr. reddy', 'sun pharma', 'cipla', 'lupin',
  'catalent', 'lonza', 'patheon', 'thermo fisher', 'piramal', 'siegfried',
  'recipharm', 'fareva', 'famar', 'almac', 'alcami', 'corden pharma', 'evonik',
  'quotient sciences', 'xellia', 'cambrex', 'sk life', 'societal',
  'bwxt', 'x-energy', 'framatome', 'westinghouse', 'centrus', 'terrapower', 'oklo', 'nuscale',
  'quantumscape', 'solid power', 'samsung sdi', 'lg energy', 'panasonic energy', 'catl',
  'nature\'s bounty', 'nutramax', 'nbty', 'glanbia', 'herbalife', 'amway', 'gnc',
  'tic tac', 'ferrero', 'perfetti', 'wrigley', 'mars candy', 'hospitality mints'
];

// Industry classifications
const TIER_1_INDUSTRIES = [
  'pharmaceutical', 'pharma', 
  'cdmo', 'cdmo/cmo', 'cmo',
  'generic pharmaceutical', 'generic pharma'
];

const TIER_2_INDUSTRIES = [
  'nutraceutical', 'dietary supplement', 'supplement', 'vitamin',
  'battery', 'battery manufacturing', 'battery & energy',
  'nuclear', 'nuclear fuel', 'nuclear & energy',
  'ceramics', 'advanced ceramics', 'technical ceramics',
  'catalyst', 'catalyst manufacturing',
  'defense', 'defense & energetics', 'energetics',
  'confectionery', 'candy', 'mint',
  'cosmetics', 'pressed powder',
  'powder metallurgy', 'abrasives',
  'veterinary', 'veterinary pharma', 'animal health',
  'cannabis', 'hemp'
];

// Companies to exclude
const EXCLUDED_COMPANIES = [
  'walmart', 'target', 'costco', 'amazon', 'walgreens', 'cvs',
  'rite aid', 'kroger', 'safeway', 'publix', 'albertsons',
  'dollar general', 'dollar tree', '7-eleven', 'circle k',
  'mcdonald', 'starbucks', 'subway', 'wendy', 'burger king',
  'marriott', 'hilton', 'hyatt', 'fedex', 'dhl'
];

// Patterns to exclude (non-manufacturing)
const EXCLUDED_PATTERNS = [
  /\buniversity\b/i, /\bcollege\b/i, /\bschool of\b/i, /\bacademy\b/i,
  /\bhospital\b/i, /\bmedical center\b/i, /\bclinic\b/i,
  /\bretail\b/i, /\bgrocery\b/i, /\bsupermarket\b/i, /\bdepartment store\b/i,
  /\brestaurant\b/i, /\bhotel\b/i, /\bresort\b/i,
  /\bbank\b/i, /\binsurance\b/i, /\bfinancial\b/i, /\binvestment\b/i,
  /\breal estate\b/i, /\bmortgage\b/i, /\bproperty\b/i,
  /\bsoftware\b/i, /\bsaas\b/i, /\bit services\b/i, /\btech company\b/i,
  /\bmarketing agency\b/i, /\badvertising\b/i, /\bmedia company\b/i,
  /\bstaffing\b/i, /\brecruiting\b/i, /\bhr services\b/i,
  /\blaw firm\b/i, /\blegal services\b/i, /\battorney\b/i,
  /\bconsulting only\b/i, /\badvisory\b/i,
  /\bchurch\b/i, /\bministry\b/i, /\bfoundation\b/i, /\bnonprofit\b/i,
  /\bpharmacy\b(?!.*manufacturing)/i  // Exclude pharmacies but not pharmacy manufacturing
];

// Special exceptions - legitimate pharma companies matching excluded patterns
const EXCEPTION_COMPANIES = [
  'upsher-smith', 'church & dwight', 'university of the sciences',
  'philadelphia college of pharmacy'
];

// Signals that indicate tablet/compaction relevance
const COMPACTION_SIGNALS = [
  'tablet', 'compression', 'compaction', 'pressed', 'pellet', 'punch', 'die',
  'tooling', 'granulation', 'formulation', 'solid dose', 'solid oral',
  'manufacturing', 'production', 'plant', 'facility', 'r&d', 'development'
];

function isException(name) {
  const lname = name.toLowerCase();
  return EXCEPTION_COMPANIES.some(e => lname.includes(e));
}

function isVerifiedTier1(name) {
  const lname = name.toLowerCase();
  return VERIFIED_TIER1_COMPANIES.some(v => lname.includes(v));
}

function hasSignals(company) {
  const name = company.name.toLowerCase();
  const industry = (company.industry || '').toLowerCase();
  const allText = `${name} ${industry}`;
  
  let signalCount = 0;
  for (const sig of COMPACTION_SIGNALS) {
    if (allText.includes(sig)) signalCount++;
    if (signalCount >= 2) return true; // At least 2 signals
  }
  return signalCount >= 1; // At least 1 signal for some cases
}

function classifyCompany(company) {
  const name = company.name.toLowerCase();
  const industry = (company.industry || '').toLowerCase();
  
  // Check exceptions first
  if (isException(name)) {
    // Let these through even if they match excluded patterns
  } else {
    // Check for hard exclusions
    for (const excluded of EXCLUDED_COMPANIES) {
      if (name.includes(excluded)) {
        return { tier: null, reason: `Excluded company: ${excluded}` };
      }
    }
    
    for (const pattern of EXCLUDED_PATTERNS) {
      if (pattern.test(name) || pattern.test(industry)) {
        return { tier: null, reason: `Excluded pattern: ${pattern}` };
      }
    }
  }
  
  // Check verified Tier 1 companies
  if (isVerifiedTier1(name)) {
    return { tier: 'Tier 1', reason: 'Verified Tier 1 company' };
  }
  
  // Check Tier 1 industries WITH manufacturing signals
  for (const t1 of TIER_1_INDUSTRIES) {
    if (industry.includes(t1)) {
      // Pharma/CDMO industry - check for manufacturing signals
      if (hasSignals(company)) {
        return { tier: 'Tier 1', reason: `Tier 1 industry with signals: ${t1}` };
      } else {
        return { tier: 'Tier 2', reason: `Tier 1 industry without signals: ${t1}` };
      }
    }
  }
  
  // Check if name suggests pharma but industry doesn't match
  if (/pharma|cdmo|cmo|drug/i.test(name) && hasSignals(company)) {
    return { tier: 'Tier 1', reason: 'Name suggests pharma with signals' };
  }
  
  // Check Tier 2 industries
  for (const t2 of TIER_2_INDUSTRIES) {
    if (industry.includes(t2) || (t2.length > 5 && name.includes(t2))) {
      return { tier: 'Tier 2', reason: `Tier 2 industry: ${t2}` };
    }
  }
  
  // Check for manufacturing/biotechnology
  if (industry && !['unknown', 'manufacturing', 'biotechnology'].includes(industry)) {
    if (hasSignals(company)) {
      return { tier: 'Tier 2', reason: 'Other industry with signals' };
    }
    return { tier: 'Tier 3', reason: 'Industry needs validation' };
  }
  
  // Default
  return { tier: 'Tier 3', reason: 'Needs research' };
}

function getDivision(industry) {
  const ind = (industry || '').toLowerCase();
  const scientific = ['pharmaceutical', 'pharma', 'nutraceutical', 'supplement', 'cdmo', 'cmo', 'veterinary', 'cannabis', 'drug', 'vitamin'];
  const engineering = ['nuclear', 'battery', 'ceramics', 'catalyst', 'powder metallurgy', 'abrasives', 'defense', 'confectionery', 'cosmetics', 'energetics', 'electrode'];
  
  const isScientific = scientific.some(s => ind.includes(s));
  const isEngineering = engineering.some(s => ind.includes(s));
  
  if (isScientific && isEngineering) return { division: 'Both Divisions', fit: 'Full Solution' };
  if (isEngineering) return { division: 'Natoli Engineering', fit: 'Tooling' };
  if (isScientific) return { division: 'Natoli Scientific', fit: 'Formulation' };
  return { division: 'Natoli Scientific', fit: 'Formulation' };
}

function reclassifyData() {
  const dataPath = path.join(__dirname, '../static/territory-data.js');
  const raw = fs.readFileSync(dataPath, 'utf8');
  const match = raw.match(/const TERRITORY_DATA = (\[[\s\S]*\]);?/);
  if (!match) {
    console.error('Could not parse territory-data.js');
    process.exit(1);
  }
  
  const companies = eval(match[1]);
  console.log(`Loaded ${companies.length} companies`);
  
  const results = {
    tier1: [],
    tier2: [],
    tier3: [],
    excluded: []
  };
  
  const exclusionReasons = {};
  const tierReasons = { 'Tier 1': {}, 'Tier 2': {}, 'Tier 3': {} };
  
  for (const company of companies) {
    const result = classifyCompany(company);
    const divInfo = getDivision(company.industry);
    
    if (!result.tier) {
      results.excluded.push({ ...company, exclusionReason: result.reason });
      exclusionReasons[result.reason] = (exclusionReasons[result.reason] || 0) + 1;
      continue;
    }
    
    const reclassified = {
      ...company,
      companyTier: result.tier,
      division: divInfo.division,
      fit: divInfo.fit
    };
    
    tierReasons[result.tier][result.reason] = (tierReasons[result.tier][result.reason] || 0) + 1;
    
    if (result.tier === 'Tier 1') {
      results.tier1.push(reclassified);
    } else if (result.tier === 'Tier 2') {
      results.tier2.push(reclassified);
    } else {
      results.tier3.push(reclassified);
    }
  }
  
  console.log('\n=== RECLASSIFICATION RESULTS ===');
  console.log(`Tier 1: ${results.tier1.length}`);
  console.log(`Tier 2: ${results.tier2.length}`);
  console.log(`Tier 3: ${results.tier3.length}`);
  console.log(`Excluded: ${results.excluded.length}`);
  
  console.log('\n=== TIER 1 BREAKDOWN ===');
  Object.entries(tierReasons['Tier 1'])
    .sort((a, b) => b[1] - a[1])
    .forEach(([reason, count]) => {
      console.log(`  ${count}: ${reason}`);
    });
  
  console.log('\n=== TIER 2 BREAKDOWN ===');
  Object.entries(tierReasons['Tier 2'])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([reason, count]) => {
      console.log(`  ${count}: ${reason}`);
    });
  
  console.log('\n=== EXCLUSION REASONS ===');
  Object.entries(exclusionReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([reason, count]) => {
      console.log(`  ${count}: ${reason}`);
    });
  
  const tier1Contacts = results.tier1.reduce((sum, c) => sum + (c.contacts?.length || 0), 0);
  const tier2Contacts = results.tier2.reduce((sum, c) => sum + (c.contacts?.length || 0), 0);
  const tier3Contacts = results.tier3.reduce((sum, c) => sum + (c.contacts?.length || 0), 0);
  
  console.log('\n=== CONTACTS BY TIER ===');
  console.log(`Tier 1: ${tier1Contacts} contacts`);
  console.log(`Tier 2: ${tier2Contacts} contacts`);
  console.log(`Tier 3: ${tier3Contacts} contacts`);
  
  const byDivision = { 'Natoli Engineering': 0, 'Natoli Scientific': 0, 'Both Divisions': 0 };
  [...results.tier1, ...results.tier2].forEach(c => {
    byDivision[c.division] = (byDivision[c.division] || 0) + 1;
  });
  
  console.log('\n=== DIVISION BREAKDOWN (Tier 1 & 2) ===');
  Object.entries(byDivision).forEach(([div, count]) => {
    console.log(`  ${div}: ${count}`);
  });
  
  console.log('\n=== SAMPLE TIER 1 COMPANIES ===');
  results.tier1.slice(0, 15).forEach(c => {
    console.log(`  ${c.name} | ${c.industry} | ${c.fit}`);
  });
  
  console.log('\n=== SAMPLE TIER 2 COMPANIES ===');
  results.tier2.slice(0, 15).forEach(c => {
    console.log(`  ${c.name} | ${c.industry} | ${c.fit}`);
  });
  
  console.log('\n=== EXCLUDED EXAMPLES ===');
  results.excluded.slice(0, 10).forEach(c => {
    console.log(`  ${c.name} | ${c.exclusionReason}`);
  });
  
  if (process.argv.includes('--write')) {
    const allQualified = [...results.tier1, ...results.tier2, ...results.tier3];
    
    const output = `// Territory Data - Reclassified ${new Date().toISOString().split('T')[0]}
// Tier 1: ${results.tier1.length} | Tier 2: ${results.tier2.length} | Tier 3: ${results.tier3.length}
// Total contacts: ${tier1Contacts + tier2Contacts + tier3Contacts}
const TERRITORY_DATA = ${JSON.stringify(allQualified, null, 2)};`;
    
    fs.writeFileSync(dataPath, output);
    console.log('\n=== WRITTEN TO territory-data.js ===');
  } else {
    console.log('\n(Run with --write to save changes)');
  }
  
  return results;
}

reclassifyData();
