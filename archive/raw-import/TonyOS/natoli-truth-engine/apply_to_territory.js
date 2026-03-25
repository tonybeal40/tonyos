/**
 * Apply Natoli Truth Engine to Territory Data
 * 
 * This shows the truth-based classification of all territory companies
 */

const fs = require("fs");
const path = require("path");
const { evaluateCompany, rules } = require("./truth_engine");

const dataPath = path.join(__dirname, "../static/territory-data.js");
const raw = fs.readFileSync(dataPath, "utf8");
const match = raw.match(/const TERRITORY_DATA = (\[[\s\S]*\]);?/);
const companies = eval(match[1]);

console.log(`Evaluating ${companies.length} companies with Truth Engine...\n`);

const results = {
  tier1: [],
  tier2: [],
  tier3: [],
  excluded: []
};

const truthPassCounts = {};
for (let i = 0; i <= 8; i++) {
  truthPassCounts[i] = 0;
}

for (const company of companies) {
  const result = evaluateCompany(company);
  const passedCount = result.passed_truths.length;
  truthPassCounts[passedCount] = (truthPassCounts[passedCount] || 0) + 1;
  
  if (result.tier === 'Tier 1') {
    results.tier1.push({ name: company.name, industry: company.industry, ...result });
  } else if (result.tier === 'Tier 2') {
    results.tier2.push({ name: company.name, industry: company.industry, ...result });
  } else if (result.tier === 'Tier 3') {
    results.tier3.push({ name: company.name, industry: company.industry, ...result });
  } else {
    results.excluded.push({ name: company.name, industry: company.industry, reason: result.rejection_reasons[0] });
  }
}

console.log("=== TRUTH ENGINE RESULTS ===");
console.log(`Tier 1 (ALL truths pass): ${results.tier1.length}`);
console.log(`Tier 2 (4+ truths pass): ${results.tier2.length}`);
console.log(`Tier 3 (1-3 truths pass): ${results.tier3.length}`);
console.log(`Excluded (0 truths or blocked): ${results.excluded.length}`);

console.log("\n=== TRUTH PASS DISTRIBUTION ===");
Object.entries(truthPassCounts).forEach(([count, num]) => {
  console.log(`  ${count} truths passed: ${num} companies`);
});

console.log("\n=== TIER 1 COMPANIES (ALL TRUTHS PASS) ===");
results.tier1.slice(0, 20).forEach(c => {
  console.log(`  ${c.name} | ${c.industry}`);
});

console.log("\n=== SAMPLE TIER 2 COMPANIES (4+ TRUTHS) ===");
results.tier2.slice(0, 15).forEach(c => {
  console.log(`  ${c.name} | ${c.passed_truths.length} truths | Missing: ${c.failed_truths.join(', ')}`);
});

console.log("\n=== SAMPLE EXCLUDED COMPANIES ===");
results.excluded.slice(0, 10).forEach(c => {
  console.log(`  ${c.name} | ${c.reason}`);
});

// Routing breakdown
const routing = { engineering: 0, scientific: 0, both: 0, review: 0 };
[...results.tier1, ...results.tier2].forEach(c => {
  if (c.routing.includes('natoli_engineering') && c.routing.includes('natoli_scientific')) {
    routing.both++;
  } else if (c.routing.includes('natoli_engineering')) {
    routing.engineering++;
  } else if (c.routing.includes('natoli_scientific')) {
    routing.scientific++;
  } else {
    routing.review++;
  }
});

console.log("\n=== ROUTING BREAKDOWN (Tier 1 & 2) ===");
console.log(`  Natoli Engineering only: ${routing.engineering}`);
console.log(`  Natoli Scientific only: ${routing.scientific}`);
console.log(`  Both Divisions: ${routing.both}`);
console.log(`  Routing Review Needed: ${routing.review}`);
