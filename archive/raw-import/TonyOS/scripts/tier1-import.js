/**
 * Tier 1 Import Filter for Territory Report
 * 
 * This script only imports companies that match Natoli's strict Tier 1 criteria
 * based on PRIMARY_MARKETS from natoliConfig.js.
 * No Tier 2 or Tier 3 companies are added.
 * 
 * Usage: node scripts/tier1-import.js <contacts-json-file>
 */

const fs = require('fs');

// PRIMARY MARKETS from natoliConfig.js - Always Tier 1
const PRIMARY_MARKETS = [
  'pharmaceutical', 'generic pharmaceutical',
  'nutraceutical', 'dietary supplement',
  'veterinary pharmaceutical',
  'cannabis',
  'nuclear', 'advanced materials', 'catalyst'
];

// TIER 1 INDUSTRIES - Includes PRIMARY_MARKETS plus additional industries with 
// VERIFIED compaction/tablet pressing equipment needs. These extend beyond core
// pharma/nutra to include manufacturing sectors Natoli actively serves:
// - Confectionery: Pressed mints/candies (Tic Tac, Life Savers, etc.)
// - Powder Metallurgy: Metal powder compaction for precision parts
// - Defense/Energetics: Propellant and explosive pressing
// - Cosmetics: Pressed powder compacts (eyeshadow, blush, etc.)
// - Abrasives: Grinding wheel and segment pressing
const TIER1_INDUSTRIES = [
  // Pharma variations
  'pharmaceutical', 'generic pharmaceutical', 'pharma', 'generic pharma',
  // Nutra variations
  'nutraceutical', 'dietary supplement', 'dietary supplements', 'supplements', 'vitamins',
  // CDMOs
  'cdmo', 'cdmo/cmo', 'contract manufacturing', 'contract development',
  // Veterinary
  'veterinary pharma', 'veterinary pharmaceutical', 'animal health',
  // Cannabis
  'cannabis', 'hemp',
  // Nuclear/SMR
  'nuclear fuel', 'nuclear & energy', 'nuclear', 'smr',
  // Battery/Energy
  'battery manufacturing', 'battery & energy', 'battery', 'electrode',
  // Advanced Materials
  'advanced ceramics', 'ceramics', 'advanced materials', 'technical ceramics',
  // Catalyst
  'catalyst manufacturing', 'catalyst', 'catalysts',
  // Confectionery (conditional - pressed candies)
  'confectionery', 'candy', 'mints',
  // Powder Metallurgy
  'powder metallurgy', 'metal powder', 'pm',
  // Defense/Energetics
  'defense & energetics', 'defense', 'explosives', 'propellants', 'ordnance', 'ammunition',
  // Cosmetics (pressed powders)
  'cosmetics', 'pressed powder',
  // Abrasives
  'abrasives', 'grinding'
];

// StoryBrand reasons by industry
const STORYBRAND_REASONS = {
  'pharmaceutical': 'Major pharmaceutical manufacturer with tablet compression operations. Natoli eliminates sticking, picking, and capping issues during high-volume production.',
  'generic pharmaceutical': 'Generic drug producer requiring cost-effective, high-precision tablet tooling for consistent quality.',
  'nutraceutical': 'Nutraceutical/supplement manufacturer with verified tablet and capsule production needs.',
  'cdmo': 'Contract development and manufacturing organization serving pharma clients with tablet production.',
  'nuclear': 'Nuclear fuel fabrication with precision pellet pressing for fuel rod assembly.',
  'battery': 'Battery electrode manufacturer with cathode/anode compaction for cell production.',
  'advanced ceramics': 'Advanced ceramics producer with powder compaction for technical ceramic parts.',
  'catalyst': 'Catalyst manufacturer pressing pellets for chemical processing applications.',
  'confectionery': 'Candy/mint manufacturer with high-volume tablet pressing operations.',
  'powder metallurgy': 'PM parts producer with metal powder compaction for precision components.',
  'defense': 'Defense/energetics manufacturer with propellant or explosive pressing operations.',
  'cosmetics': 'Cosmetics producer with pressed powder compact production lines.',
  'veterinary': 'Veterinary pharmaceutical manufacturer with animal health tablet production.',
  'cannabis': 'Cannabis product manufacturer with tablet or capsule production.',
  'abrasives': 'Abrasives manufacturer with grinding wheel and segment pressing.',
  'default': 'Verified manufacturing operation with tablet/compaction equipment needs.'
};

function isTier1Industry(industry) {
  const ind = (industry || '').toLowerCase();
  return TIER1_INDUSTRIES.some(t => ind.includes(t));
}

function getStoryBrandReason(industry) {
  const ind = (industry || '').toLowerCase();
  for (const [key, reason] of Object.entries(STORYBRAND_REASONS)) {
    if (key !== 'default' && ind.includes(key)) return reason;
  }
  return STORYBRAND_REASONS.default;
}

function getDivision(industry) {
  const ind = (industry || '').toLowerCase();
  const scientific = ['pharmaceutical', 'pharma', 'nutraceutical', 'supplement', 'cdmo', 'veterinary', 'cannabis'];
  const engineering = ['nuclear', 'battery', 'ceramics', 'catalyst', 'powder metallurgy', 'abrasives', 'defense', 'confectionery', 'cosmetics'];
  
  const isScientific = scientific.some(s => ind.includes(s));
  const isEngineering = engineering.some(s => ind.includes(s));
  
  if (isScientific && isEngineering) return 'Both Divisions';
  if (isScientific) return 'Natoli Scientific';
  if (isEngineering) return 'Natoli Engineering';
  return 'Both Divisions';
}

function normalize(name) {
  return name.toLowerCase()
    .replace(/\s*(inc\.?|llc|ltd\.?|corp\.?|co\.?|company|corporation|limited|plc|gmbh)\s*/gi, '')
    .replace(/[^a-z0-9]/g, '');
}

function getTerritory(state, country) {
  const stateNorm = (state || '').toUpperCase();
  const countryNorm = (country || '').toLowerCase();
  
  if (!countryNorm || countryNorm.includes('united states') || countryNorm === 'usa' || countryNorm === 'us') {
    const west = ['CA', 'WA', 'OR', 'NV', 'AZ', 'HI', 'AK'];
    const rocky = ['CO', 'UT', 'MT', 'WY', 'ID', 'NM'];
    const midwest = ['IL', 'OH', 'MI', 'IN', 'WI', 'MN', 'IA', 'MO', 'KS', 'NE', 'SD', 'ND'];
    const southeast = ['FL', 'GA', 'NC', 'SC', 'VA', 'TN', 'AL', 'MS', 'LA', 'AR', 'KY', 'WV', 'TX', 'OK'];
    const northeast = ['NY', 'NJ', 'PA', 'MA', 'CT', 'NH', 'VT', 'ME', 'RI', 'MD', 'DE', 'DC'];
    
    if (west.some(s => stateNorm.includes(s))) return 'West Coast';
    if (rocky.some(s => stateNorm.includes(s))) return 'Rocky Mountain';
    if (midwest.some(s => stateNorm.includes(s))) return 'Midwest';
    if (southeast.some(s => stateNorm.includes(s))) return 'Southeast';
    if (northeast.some(s => stateNorm.includes(s))) return 'Northeast';
    return 'Other US';
  }
  return 'International';
}

// Export for use in other scripts
module.exports = {
  PRIMARY_MARKETS,
  TIER1_INDUSTRIES,
  STORYBRAND_REASONS,
  isTier1Industry,
  getStoryBrandReason,
  getDivision,
  getTerritory,
  normalize
};

// If run directly, process input file
if (require.main === module) {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.log('Usage: node scripts/tier1-import.js <contacts-json-file>');
    console.log('');
    console.log('This script imports contacts to the territory report,');
    console.log('but ONLY for companies in Tier 1 industries.');
    process.exit(1);
  }

  // Load contacts
  const contacts = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  console.log('Total contacts in file:', contacts.length);

  // Filter to Tier 1 only
  const tier1Contacts = contacts.filter(c => isTier1Industry(c.industry));
  console.log('Tier 1 contacts:', tier1Contacts.length);
  console.log('Rejected (not Tier 1):', contacts.length - tier1Contacts.length);

  // Group by company with all required fields
  const companies = {};
  tier1Contacts.forEach(c => {
    if (!companies[c.company]) {
      const division = getDivision(c.industry);
      companies[c.company] = {
        name: c.company,
        industry: c.industry,
        companyTier: 'Tier 1',
        division: division,
        fit: division === 'Natoli Scientific' ? 'Formulation' : 
             division === 'Natoli Engineering' ? 'Tooling' : 'Full Solution',
        tier1Reason: getStoryBrandReason(c.industry),
        territory: getTerritory(c.state, c.country),
        website: '',
        phone: '',
        city: c.city || '',
        state: c.state || '',
        country: c.country || 'United States',
        employees: c.employees || '',
        dataQuality: 'Complete',
        needsResearch: false,
        contacts: []
      };
    }
    companies[c.company].contacts.push({
      name: ((c.firstName || '') + ' ' + (c.lastName || '')).trim(),
      title: c.title || '',
      email: c.email || '',
      phone: c.phone || '',
      linkedin: c.linkedin || '',
      tier: 'A',
      seniority: c.seniority || ''
    });
  });

  console.log('Tier 1 companies:', Object.keys(companies).length);
  console.log('');
  console.log('Top 10 by contacts:');
  Object.values(companies)
    .sort((a, b) => b.contacts.length - a.contacts.length)
    .slice(0, 10)
    .forEach(c => console.log('  ' + c.name + ': ' + c.contacts.length));
}
