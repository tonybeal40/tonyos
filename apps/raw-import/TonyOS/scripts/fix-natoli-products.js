/**
 * Fix Natoli Product Intelligence
 * Natoli sells: TOOLING + MACHINES + FORMULATION SERVICES
 * Many companies need BOTH tooling AND formulation
 */

const fs = require('fs');
const path = require('path');

// What Natoli sells
const NATOLI_PRODUCTS = {
  tooling: 'Punches, dies, tablet tooling, carbide tooling',
  machines: 'Tablet presses, instrumented presses, R&D presses',
  formulation: 'Natoli Scientific - formulation development, characterization, analytical services'
};

// Industry needs mapping
const INDUSTRY_NEEDS = {
  'Pharmaceutical': { tooling: true, machines: true, formulation: true, reason: 'Pharma needs tablet presses, precision tooling, AND formulation development support.' },
  'Generic Pharmaceutical': { tooling: true, machines: true, formulation: true, reason: 'Generic pharma needs cost-effective presses, tooling, and formulation optimization.' },
  'Nutraceutical': { tooling: true, machines: true, formulation: true, reason: 'Supplement companies need presses, tooling, and formulation support for tablet development.' },
  'CDMO/CMO': { tooling: true, machines: true, formulation: true, reason: 'Contract manufacturers need multiple presses, universal tooling, and formulation consulting.' },
  'CDMO': { tooling: true, machines: true, formulation: true, reason: 'CDMOs run mixed fleets - need Natoli presses, tooling for all brands, and scientific services.' },
  'Veterinary Pharma': { tooling: true, machines: true, formulation: true, reason: 'Vet pharma needs specialized presses for boluses, tooling, and formulation support.' },
  'Veterinary Pharmaceutical': { tooling: true, machines: true, formulation: true, reason: 'Animal health tablets require presses, tooling, and formulation development.' },
  'Cannabis': { tooling: true, machines: true, formulation: true, reason: 'Cannabis tablets need presses, tooling, and formulation expertise for new products.' },
  'Confectionery': { tooling: true, machines: true, formulation: false, reason: 'Candy pressing needs machines and specialty tooling. Less formulation need.' },
  'Cosmetics': { tooling: true, machines: true, formulation: false, reason: 'Pressed powder makeup needs presses and specialty tooling.' },
  'Nuclear Fuel': { tooling: true, machines: true, formulation: false, reason: 'Nuclear pellet production needs specialized presses and precision carbide tooling.' },
  'Battery Manufacturing': { tooling: true, machines: true, formulation: false, reason: 'Electrode pellet production needs compaction presses and carbide tooling.' },
  'Advanced Ceramics': { tooling: true, machines: true, formulation: false, reason: 'Ceramic compaction needs heavy-duty presses and carbide tooling for abrasive materials.' },
  'Catalyst Manufacturing': { tooling: true, machines: true, formulation: false, reason: 'Catalyst pellet production needs industrial presses and long-life carbide tooling.' },
  'Defense & Energetics': { tooling: true, machines: true, formulation: false, reason: 'Propellant/energetic compaction needs specialized presses and precision tooling.' },
  'Powder Metallurgy': { tooling: true, machines: true, formulation: false, reason: 'PM compaction needs heavy-duty presses and carbide tooling for metal powders.' },
  'Abrasives': { tooling: true, machines: true, formulation: false, reason: 'Grinding wheel production needs presses and carbide tooling for abrasive materials.' },
  'Medical Implants': { tooling: true, machines: true, formulation: false, reason: 'Medical device compaction needs precision presses and tooling.' },
  'Hydrogen Storage': { tooling: true, machines: true, formulation: false, reason: 'Metal hydride pellet production needs compaction equipment and tooling.' },
  'Carbon Capture': { tooling: true, machines: true, formulation: false, reason: 'Sorbent pellet production needs presses and tooling.' },
  'Rare Earth Magnets': { tooling: true, machines: true, formulation: false, reason: 'Magnet powder compaction needs precision presses and carbide tooling.' },
  '3D Printing Feedstock': { tooling: true, machines: false, formulation: false, reason: 'Powder preparation may use compaction tooling.' },
  'Agricultural Pellets': { tooling: false, machines: false, formulation: false, reason: 'Different pelletizing equipment. Limited Natoli fit.' },
  'Animal Feed Supplements': { tooling: false, machines: false, formulation: false, reason: 'Feed pelletizing uses different equipment.' },
  'Specialty Chemicals': { tooling: true, machines: true, formulation: false, reason: 'Chemical pellet production uses compaction presses and tooling.' },
  'Biotechnology': { tooling: true, machines: true, formulation: true, reason: 'Biotech with solid dosage needs presses, tooling, and formulation support.' },
  'Manufacturing': { tooling: true, machines: true, formulation: false, reason: 'Depends on manufacturing type. Evaluate for compaction operations.' },
  'Pharma': { tooling: true, machines: true, formulation: true, reason: 'Pharma operations need presses, tooling, and formulation development.' }
};

// Load territory data
const dataPath = path.join(__dirname, '../static/territory-data.js');
const raw = fs.readFileSync(dataPath, 'utf8');
const match = raw.match(/const TERRITORY_DATA = (\[[\s\S]*?\]);/);
const companies = eval(match[1]);

console.log(`Processing ${companies.length} companies...`);

let toolingOnly = 0, formulationOnly = 0, bothNeeds = 0, machinesNeeded = 0;

companies.forEach(c => {
  const needs = INDUSTRY_NEEDS[c.industry];
  
  if (needs) {
    // Determine what they need
    const needsTooling = needs.tooling;
    const needsFormulation = needs.formulation;
    const needsMachines = needs.machines;
    const needsBoth = needsTooling && needsFormulation;
    
    c.natoliProducts = {
      needsTooling: needsTooling,
      needsMachines: needsMachines,
      needsFormulation: needsFormulation,
      needsBoth: needsBoth,
      productFit: needsBoth ? 'Full Solution (Tooling + Machines + Formulation)' 
                  : (needsTooling && needsMachines ? 'Tooling + Machines' 
                  : (needsTooling ? 'Tooling Only' : 'Evaluate')),
      reason: needs.reason
    };
    
    // Update fit field
    if (needsBoth) {
      c.fit = 'Full Solution';
      bothNeeds++;
    } else if (needsTooling && !needsFormulation) {
      c.fit = 'Tooling';
      toolingOnly++;
    } else if (needsFormulation && !needsTooling) {
      c.fit = 'Formulation';
      formulationOnly++;
    }
    
    if (needsMachines) machinesNeeded++;
    
    // Update machineOpportunity
    c.machineOpportunity = {
      ...c.machineOpportunity,
      needsTooling: needsTooling,
      needsMachines: needsMachines,
      needsFormulation: needsFormulation,
      natoliProducts: needsBoth ? ['Presses', 'Tooling', 'Formulation Services'] 
                     : (needsTooling && needsMachines ? ['Presses', 'Tooling'] 
                     : (needsTooling ? ['Tooling'] : ['Evaluate'])),
      reason: needs.reason
    };
  }
});

// Write updated data
const output = `const TERRITORY_DATA = ${JSON.stringify(companies, null, 2)};`;
fs.writeFileSync(dataPath, output);

console.log('\n=== NATOLI PRODUCT FIT ===');
console.log(`  Full Solution (Tooling + Machines + Formulation): ${bothNeeds}`);
console.log(`  Tooling + Machines Only: ${toolingOnly}`);
console.log(`  Needs Machines: ${machinesNeeded}`);

console.log(`\n✓ Updated all companies with Natoli product intelligence`);
