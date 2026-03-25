/**
 * Add 2025-2026 Emerging Companies from News
 * Battery, Pharma, Nuclear, Solid-State expansions
 */

const fs = require('fs');
const path = require('path');

const EMERGING_2025_2026 = [
  // BATTERY MANUFACTURING - 2025 Announcements
  {
    name: "Panasonic Energy (De Soto)",
    industry: "Battery Manufacturing",
    territory: "Central",
    city: "De Soto",
    state: "KS",
    country: "USA",
    website: "https://www.panasonic.com/energy",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2025: $4B facility opened July 2025, largest EV battery plant in US, 66 batteries/second",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Electrode Pellet Tooling", secondary: "Battery Cell Compaction" },
    contacts: []
  },
  {
    name: "Toyota Battery Manufacturing NC",
    industry: "Battery Manufacturing",
    territory: "East",
    city: "Liberty",
    state: "NC",
    country: "USA",
    website: "https://www.toyota.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2025: $13.9B facility, 30 GWh capacity, production started Nov 2025",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Battery Cathode Tooling", secondary: "Electrode Compaction" },
    contacts: []
  },
  {
    name: "NeoVolta Power",
    industry: "Battery Manufacturing",
    territory: "East",
    city: "Pendergrass",
    state: "GA",
    country: "USA",
    website: "https://www.neovolta.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2026: 2 GWh facility announced Jan 2026, utility-scale battery assembly",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Battery Pack Tooling", secondary: "Prismatic Cell Assembly" },
    contacts: []
  },
  {
    name: "Gotion High-Tech",
    industry: "Battery Manufacturing",
    territory: "Central",
    city: "Manteno",
    state: "IL",
    country: "USA",
    website: "https://www.gotion.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2026: $2B facility, LFP cell production starting 2026, BESS focus",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "LFP Cathode Tooling", secondary: "Cell Production Dies" },
    contacts: []
  },
  {
    name: "Natron Energy",
    industry: "Battery Manufacturing",
    territory: "East",
    city: "Edgecombe County",
    state: "NC",
    country: "USA",
    website: "https://www.natronenergy.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2025: $1.4B sodium-ion gigafactory, 1,000 jobs",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Sodium-Ion Electrode Tooling", secondary: "Battery Material Compaction" },
    contacts: []
  },
  
  // SOLID-STATE BATTERY - 2025 Expansions
  {
    name: "SK On (Solid-State)",
    industry: "Battery Manufacturing",
    territory: "South Korea",
    city: "Daejeon",
    state: "",
    country: "South Korea",
    website: "https://www.skon.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2025: All-solid-state pilot plant opened Sept 2025, 800Wh/L target",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Solid-State Electrolyte Tooling", secondary: "Sulfide Battery Compaction" },
    contacts: []
  },
  {
    name: "Honda (Solid-State)",
    industry: "Battery Manufacturing",
    territory: "Japan",
    city: "Sakura City",
    state: "",
    country: "Japan",
    website: "https://www.honda.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2025: 300,000 sq ft solid-state demo line at R&D center",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Solid-State Battery Tooling", secondary: "EV Battery Compaction" },
    contacts: []
  },
  {
    name: "ION Storage Systems",
    industry: "Battery Manufacturing",
    territory: "East",
    city: "Beltsville",
    state: "MD",
    country: "USA",
    website: "https://www.ionstoragesystems.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2025: 30,000 sq ft facility, 10 MWh capacity, $20M ARPA-E backing",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Compression-Free SS Battery Tooling", secondary: "Solid Electrolyte Dies" },
    contacts: []
  },
  {
    name: "Factorial Energy",
    industry: "Battery Manufacturing",
    territory: "East",
    city: "Methuen",
    state: "MA",
    country: "USA",
    website: "https://www.factorialenergy.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2025: 375Wh/kg cells validated with Stellantis, fleet demo 2026",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Quasi-Solid Electrolyte Tooling", secondary: "FEST Battery Compaction" },
    contacts: []
  },
  {
    name: "Svolt Energy",
    industry: "Battery Manufacturing",
    territory: "China",
    city: "Changzhou",
    state: "",
    country: "China",
    website: "https://www.svolt.cn",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2026: 2.3 GWh semi-solid-state line, mass delivery 2026",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Semi-Solid Battery Tooling", secondary: "High-Density Cell Dies" },
    contacts: []
  },
  {
    name: "GAC Group (Solid-State)",
    industry: "Battery Manufacturing",
    territory: "China",
    city: "Guangzhou",
    state: "",
    country: "China",
    website: "https://www.gac-motor.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2025: First China all-solid-state production line, mass production ready",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "All-Solid-State Tooling", secondary: "EV Battery Mass Production" },
    contacts: []
  },
  
  // PHARMA MANUFACTURING - 2025-2026 Expansions
  {
    name: "Eli Lilly (Huntsville)",
    industry: "Pharmaceutical",
    territory: "East",
    city: "Huntsville",
    state: "AL",
    country: "USA",
    website: "https://www.lilly.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2026: $6B API facility, construction starts 2026, diabetes/obesity/oncology",
    fit: "Formulation",
    division: "Natoli Scientific",
    needs: { primary: "API Tablet Tooling", secondary: "GLP-1 Formulation Equipment" },
    contacts: []
  },
  {
    name: "Eli Lilly (Houston)",
    industry: "Pharmaceutical",
    territory: "Central",
    city: "Houston",
    state: "TX",
    country: "USA",
    website: "https://www.lilly.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2025: $6.5B API facility, oral GLP-1 (orforglipron) manufacturing",
    fit: "Formulation",
    division: "Natoli Scientific",
    needs: { primary: "Oral GLP-1 Tablet Tooling", secondary: "Small Molecule Compaction" },
    contacts: []
  },
  {
    name: "GSK (Upper Merion)",
    industry: "Pharmaceutical",
    territory: "East",
    city: "Upper Merion",
    state: "PA",
    country: "USA",
    website: "https://www.gsk.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2026: $1.2B facility groundbreaking, respiratory/cancer drugs, inhalers",
    fit: "Formulation",
    division: "Natoli Scientific",
    needs: { primary: "Inhaler Tablet Tooling", secondary: "Oncology Formulation" },
    contacts: []
  },
  {
    name: "Merck (Virginia)",
    industry: "Pharmaceutical",
    territory: "East",
    city: "Virginia",
    state: "VA",
    country: "USA",
    website: "https://www.merck.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2025: $3B pharma manufacturing, 400k sq ft, construction Oct 2025",
    fit: "Formulation",
    division: "Natoli Scientific",
    needs: { primary: "Large-Scale Tablet Tooling", secondary: "API Compaction Equipment" },
    contacts: []
  },
  {
    name: "AbbVie (North Chicago)",
    industry: "Pharmaceutical",
    territory: "Central",
    city: "North Chicago",
    state: "IL",
    country: "USA",
    website: "https://www.abbvie.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2025: $195M API facility, neuroscience/immunology/oncology, operational 2027",
    fit: "Formulation",
    division: "Natoli Scientific",
    needs: { primary: "API Tablet Manufacturing", secondary: "Oncology Formulation Tooling" },
    contacts: []
  },
  {
    name: "Roche (Holly Springs)",
    industry: "Pharmaceutical",
    territory: "East",
    city: "Holly Springs",
    state: "NC",
    country: "USA",
    website: "https://www.roche.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2025: $700M+ obesity/weight-loss facility, 700k sq ft",
    fit: "Formulation",
    division: "Natoli Scientific",
    needs: { primary: "Weight-Loss Drug Tooling", secondary: "GLP-1 Formulation Equipment" },
    contacts: []
  },
  {
    name: "Novo Nordisk (Clayton)",
    industry: "Pharmaceutical",
    territory: "East",
    city: "Clayton",
    state: "NC",
    country: "USA",
    website: "https://www.novonordisk.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2027: $4.1B fill-finish expansion, 1.4M sq ft aseptic manufacturing",
    fit: "Formulation",
    division: "Natoli Scientific",
    needs: { primary: "Oral Semaglutide Tooling", secondary: "Diabetes Formulation Equipment" },
    contacts: []
  },
  
  // NUCLEAR FUEL - 2025-2026 HALEU Announcements
  {
    name: "American Centrifuge Operating (Centrus)",
    industry: "Nuclear Fuel",
    territory: "Central",
    city: "Piketon",
    state: "OH",
    country: "USA",
    website: "https://www.centrusenergy.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2025: $900M DOE contract, 900 kg/year HALEU, first NRC-licensed facility",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "HALEU Pellet Tooling", secondary: "Uranium Enrichment Compaction" },
    contacts: []
  },
  {
    name: "General Matter",
    industry: "Nuclear Fuel",
    territory: "West",
    city: "TBD",
    state: "CA",
    country: "USA",
    website: "https://www.generalmatter.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2026: $900M DOE award, new HALEU enrichment facility, operations 2034",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "HALEU Processing Tooling", secondary: "Nuclear Fuel Compaction" },
    contacts: []
  },
  {
    name: "Orano Federal Services",
    industry: "Nuclear Fuel",
    territory: "East",
    city: "TBD",
    state: "",
    country: "USA",
    website: "https://www.orano.group",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2026: $900M DOE award, 750k sq ft LEU facility, NRC license 2026",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "LEU Pellet Tooling", secondary: "Enrichment Compaction Dies" },
    contacts: []
  },
  {
    name: "Standard Nuclear",
    industry: "Nuclear Fuel",
    territory: "East",
    city: "Oak Ridge",
    state: "TN",
    country: "USA",
    website: "https://www.standardnuclear.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2026: First DOE HALEU recipient Jan 2026, TRISO fuel for Radiant demo",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "TRISO Fuel Tooling", secondary: "Microreactor Fuel Compaction" },
    contacts: []
  },
  {
    name: "Radiant Industries",
    industry: "Nuclear Fuel",
    territory: "West",
    city: "El Segundo",
    state: "CA",
    country: "USA",
    website: "https://www.radiantnuclear.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2026: 1 MWe Kaleidos microreactor demo 2026, HALEU fuel recipient",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Microreactor Fuel Tooling", secondary: "HALEU Pellet Dies" },
    contacts: []
  },
  {
    name: "Kairos Power",
    industry: "Nuclear Fuel",
    territory: "East",
    city: "Oak Ridge",
    state: "TN",
    country: "USA",
    website: "https://www.kairospower.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2027: Hermes 35-MWt test reactor, HALEU fuel recipient, molten salt",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Pebble Fuel Tooling", secondary: "Molten Salt Reactor Fuel" },
    contacts: []
  },
  {
    name: "TRISO-X (X-energy)",
    industry: "Nuclear Fuel",
    territory: "East",
    city: "Oak Ridge",
    state: "TN",
    country: "USA",
    website: "https://x-energy.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2026: HALEU fuel fabrication facility, TRISO particle production",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "TRISO Particle Tooling", secondary: "Advanced Fuel Compaction" },
    contacts: []
  },
  {
    name: "Antares Nuclear",
    industry: "Nuclear Fuel",
    territory: "West",
    city: "TBD",
    state: "",
    country: "USA",
    website: "https://www.antaresnuclear.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2026: Microreactor targeting criticality July 4, 2026",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Microreactor Fuel Tooling", secondary: "Compact Reactor Pellets" },
    contacts: []
  },
  {
    name: "Natura Resources (ACU)",
    industry: "Nuclear Fuel",
    territory: "Central",
    city: "Abilene",
    state: "TX",
    country: "USA",
    website: "https://www.naturaresources.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2026: Molten salt research reactor under construction at Abilene Christian",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "MSR Fuel Tooling", secondary: "Research Reactor Pellets" },
    contacts: []
  },
  
  // CATALYST & CARBON CAPTURE - 2025
  {
    name: "Idemitsu Kosan",
    industry: "Battery Manufacturing",
    territory: "Japan",
    city: "Tokyo",
    state: "",
    country: "Japan",
    website: "https://www.idemitsu.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2027: $142M lithium sulfide plant for Toyota solid-state batteries",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Lithium Sulfide Tooling", secondary: "Solid Electrolyte Material" },
    contacts: []
  },
  {
    name: "Qingtao Energy",
    industry: "Battery Manufacturing",
    territory: "China",
    city: "Wuhai",
    state: "Inner Mongolia",
    country: "China",
    website: "https://www.qingtaoenergy.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2025: 200 MW/800 MWh semi-solid-state BESS operational Nov 2025",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Semi-Solid Battery Tooling", secondary: "Energy Storage Compaction" },
    contacts: []
  },
  {
    name: "Basquevolt",
    industry: "Battery Manufacturing",
    territory: "Spain",
    city: "Vitoria-Gasteiz",
    state: "",
    country: "Spain",
    website: "https://www.basquevolt.com",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2025: €12.5M funding, European solid-state battery leader",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Solid-State Electrolyte Tooling", secondary: "EU Battery Production" },
    contacts: []
  },
  {
    name: "Theion",
    industry: "Battery Manufacturing",
    territory: "Germany",
    city: "Berlin",
    state: "",
    country: "Germany",
    website: "https://www.theion.de",
    companyTier: "Tier 1",
    tier1Reason: "EMERGING 2025: €15M raised March 2025, crystalline sulfur battery technology",
    fit: "Tooling",
    division: "Natoli Engineering",
    needs: { primary: "Sulfur Cathode Tooling", secondary: "Crystal Battery Compaction" },
    contacts: []
  }
];

// Load existing territory data
const dataPath = path.join(__dirname, '../static/territory-data.js');
const raw = fs.readFileSync(dataPath, 'utf8');
const match = raw.match(/const TERRITORY_DATA = (\[[\s\S]*?\]);/);
const existingCompanies = eval(match[1]);

// Check for duplicates
const existingNames = new Set(existingCompanies.map(c => c.name.toLowerCase()));
const newCompanies = EMERGING_2025_2026.filter(c => !existingNames.has(c.name.toLowerCase()));

console.log(`Existing companies: ${existingCompanies.length}`);
console.log(`New 2025-2026 emerging companies: ${newCompanies.length}`);
console.log(`Duplicates skipped: ${EMERGING_2025_2026.length - newCompanies.length}`);

// Merge
const allCompanies = [...existingCompanies, ...newCompanies];

// Sort by tier then name
allCompanies.sort((a, b) => {
  const tierOrder = { 'Tier 1': 1, 'Tier 2': 2, 'Tier 3': 3 };
  const tierDiff = (tierOrder[a.companyTier] || 4) - (tierOrder[b.companyTier] || 4);
  if (tierDiff !== 0) return tierDiff;
  return a.name.localeCompare(b.name);
});

// Count emerging
const emergingCount = allCompanies.filter(c => c.tier1Reason && c.tier1Reason.includes('EMERGING')).length;

console.log(`\n=== EMERGING COMPANIES ===`);
console.log(`Total emerging: ${emergingCount}`);

// By category
const byCategory = {};
newCompanies.forEach(c => {
  byCategory[c.industry] = (byCategory[c.industry] || 0) + 1;
});
Object.entries(byCategory).sort((a,b) => b[1] - a[1]).forEach(([ind, count]) => {
  console.log(`  ${ind}: ${count}`);
});

// Write updated data
const output = `const TERRITORY_DATA = ${JSON.stringify(allCompanies, null, 2)};`;
fs.writeFileSync(dataPath, output);

console.log(`\n✓ Updated territory-data.js with ${allCompanies.length} total companies`);
console.log(`✓ Added ${newCompanies.length} new 2025-2026 emerging companies`);
