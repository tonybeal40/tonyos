/**
 * Add Machine/Tooling Intelligence
 * Natoli sells TOOLING for ALL major press brands
 * Fette/Korsch/Kilian/Stokes/IMA sell MACHINES
 * Every company with a tablet press NEEDS Natoli tooling
 */

const fs = require('fs');
const path = require('path');

// Press brands that need Natoli tooling
const PRESS_BRANDS = [
  'Fette', 'Korsch', 'Kilian', 'Romaco', 'IMA', 'Stokes', 'Manesty', 
  'Cadmach', 'Kikusui', 'Sejong', 'ACG', 'GEA', 'Elizabeth-Hata',
  'Bosch', 'Uhlmann', 'Riva', 'PTK', 'Shanghai Tianhe'
];

// Industry-based machine likelihood
const MACHINE_LIKELIHOOD = {
  'Pharmaceutical': { likelihood: 'High', reason: 'Pharma requires tablet presses for solid dosage production. Uses Fette/Korsch/IMA presses - all need Natoli punches & dies.' },
  'Generic Pharmaceutical': { likelihood: 'High', reason: 'High-volume generic production uses Korsch/Fette presses. Natoli tooling reduces costs vs OEM.' },
  'Nutraceutical': { likelihood: 'High', reason: 'Supplement tablets produced on rotary presses. Natoli tooling compatible with all major brands.' },
  'CDMO/CMO': { likelihood: 'Very High', reason: 'Contract manufacturers run multiple press brands (Fette, Korsch, Kilian). Need universal tooling supplier like Natoli.' },
  'CDMO': { likelihood: 'Very High', reason: 'Contract manufacturers run multiple press brands. Natoli provides cross-compatible tooling for mixed fleets.' },
  'Veterinary Pharma': { likelihood: 'High', reason: 'Vet tablets/boluses use same press technology. Natoli tooling fits standard B/D configurations.' },
  'Veterinary Pharmaceutical': { likelihood: 'High', reason: 'Animal health tablets use rotary presses. Natoli tooling compatible.' },
  'Cannabis': { likelihood: 'Medium', reason: 'Pressed cannabis tablets emerging. New facilities buying presses that need Natoli tooling.' },
  'Confectionery': { likelihood: 'High', reason: 'Pressed candy/mints use tablet presses. Natoli provides specialty tooling for confectionery.' },
  'Cosmetics': { likelihood: 'Medium', reason: 'Pressed powder makeup uses compaction. Natoli specialty tooling available.' },
  'Nuclear Fuel': { likelihood: 'Very High', reason: 'Fuel pellet presses require precision tooling. Natoli engineering expertise for critical applications.' },
  'Battery Manufacturing': { likelihood: 'Very High', reason: 'Electrode pellet production uses compaction presses. Natoli tooling for battery material processing.' },
  'Advanced Ceramics': { likelihood: 'Very High', reason: 'Ceramic compaction requires precision dies. Natoli carbide-tip tooling for abrasive materials.' },
  'Catalyst Manufacturing': { likelihood: 'Very High', reason: 'Catalyst pellet presses need heavy-duty tooling. Natoli carbide dies for extended life.' },
  'Defense & Energetics': { likelihood: 'High', reason: 'Propellant/energetic compaction requires specialized tooling. Natoli precision dies.' },
  'Powder Metallurgy': { likelihood: 'Very High', reason: 'PM presses use standard B/D tooling. Natoli carbide tooling for metal powder compaction.' },
  'Abrasives': { likelihood: 'Very High', reason: 'Grinding wheel compaction uses heavy-duty presses. Natoli carbide tooling essential.' },
  'Medical Implants': { likelihood: 'High', reason: 'Ceramic/metal implant compaction needs precision tooling. Natoli medical-grade dies.' },
  'Hydrogen Storage': { likelihood: 'High', reason: 'Metal hydride pellet production uses compaction. Natoli tooling for energy materials.' },
  'Carbon Capture': { likelihood: 'High', reason: 'Sorbent pellet production needs compaction tooling. Natoli engineering support.' },
  'Rare Earth Magnets': { likelihood: 'Very High', reason: 'NdFeB magnet pressing requires precision dies. Natoli tooling for magnetic materials.' },
  '3D Printing Feedstock': { likelihood: 'Medium', reason: 'Powder preparation may use compaction. Natoli tooling for material processing.' },
  'Agricultural Pellets': { likelihood: 'Medium', reason: 'Fertilizer pelletizing uses different equipment. Limited Natoli fit.' },
  'Animal Feed Supplements': { likelihood: 'Medium', reason: 'Feed pelletizing uses different equipment. Some tablet applications.' },
  'Specialty Chemicals': { likelihood: 'High', reason: 'Chemical pellet production uses compaction presses. Natoli tooling for specialty applications.' },
  'Biotechnology': { likelihood: 'Medium', reason: 'Some biotech does solid dosage. Natoli tooling if tablet production present.' },
  'Manufacturing': { likelihood: 'Medium', reason: 'Depends on specific manufacturing type. Evaluate for compaction operations.' }
};

// Why Natoli beats OEM
const NATOLI_ADVANTAGES = {
  'cost': 'Natoli tooling typically 20-40% less than Fette/Korsch OEM pricing',
  'speed': '250,000+ parts in stock - faster delivery than OEM',
  'compatibility': 'Cross-compatible with Fette, Korsch, Kilian, IMA, Stokes, and all major brands',
  'innovation': 'Extended head flats increase dwell time 50%+, die table segments boost output 25%',
  'support': 'Press rebuilding, training, and tablet design engineering included',
  'quality': '16+ steel grades, vacuum heat-treating, ASTM-certified quality control'
};

// Load territory data
const dataPath = path.join(__dirname, '../static/territory-data.js');
const raw = fs.readFileSync(dataPath, 'utf8');
const match = raw.match(/const TERRITORY_DATA = (\[[\s\S]*?\]);/);
const companies = eval(match[1]);

console.log(`Processing ${companies.length} companies for machine intelligence...`);

let updated = 0;

companies.forEach(c => {
  const info = MACHINE_LIKELIHOOD[c.industry];
  
  if (info) {
    c.machineOpportunity = {
      likelihood: info.likelihood,
      reason: info.reason,
      natoliAdvantage: c.division === 'Natoli Engineering' 
        ? 'Natoli carbide tooling extends die life 3-5x in abrasive materials. Engineering support for custom applications.'
        : 'Natoli tooling costs 20-40% less than OEM. 250,000+ parts in stock for fast delivery. Cross-compatible with all major press brands.',
      competitorPresses: c.industry.includes('Pharma') || c.industry === 'CDMO' || c.industry === 'CDMO/CMO' || c.industry === 'Nutraceutical'
        ? ['Fette', 'Korsch', 'Kilian', 'IMA', 'Romaco']
        : ['Various compaction presses'],
      needsTooling: info.likelihood === 'High' || info.likelihood === 'Very High'
    };
    updated++;
  } else {
    c.machineOpportunity = {
      likelihood: 'Unknown',
      reason: 'Industry not yet classified for press usage. Research recommended.',
      natoliAdvantage: 'Evaluate for compaction operations.',
      competitorPresses: [],
      needsTooling: false
    };
  }
});

// Write updated data
const output = `const TERRITORY_DATA = ${JSON.stringify(companies, null, 2)};`;
fs.writeFileSync(dataPath, output);

console.log(`\n✓ Updated ${updated} companies with machine intelligence`);

// Summary
const byLikelihood = {};
companies.forEach(c => {
  const l = c.machineOpportunity?.likelihood || 'Unknown';
  byLikelihood[l] = (byLikelihood[l] || 0) + 1;
});

console.log('\n=== TOOLING OPPORTUNITY BREAKDOWN ===');
Object.entries(byLikelihood).sort((a,b) => b[1] - a[1]).forEach(([l, count]) => {
  console.log(`  ${l}: ${count} companies`);
});

// High priority count
const highPriority = companies.filter(c => c.machineOpportunity?.needsTooling).length;
console.log(`\n🔧 NEEDS NATOLI TOOLING: ${highPriority} companies`);
