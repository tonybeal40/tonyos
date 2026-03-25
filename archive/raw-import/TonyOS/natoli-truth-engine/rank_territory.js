/**
 * Rank Territory Data using Truth Engine
 * Shows the truth-based tier distribution
 */

const fs = require("fs");
const path = require("path");
const { rankCompanies } = require("./rank_engine");

const dataPath = path.join(__dirname, "../static/territory-data.js");
const raw = fs.readFileSync(dataPath, "utf8");
const match = raw.match(/const TERRITORY_DATA = (\[[\s\S]*\]);?/);
const companies = eval(match[1]);

console.log(`Ranking ${companies.length} companies with Truth Engine...\n`);

const ranked = rankCompanies(companies);

const tierCounts = {};
ranked.forEach(c => {
  tierCounts[c.rank_tier] = (tierCounts[c.rank_tier] || 0) + 1;
});

console.log("=== TRUTH-BASED TIER DISTRIBUTION ===");
Object.entries(tierCounts)
  .sort((a, b) => {
    const order = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'];
    return order.findIndex(t => a[0].includes(t)) - order.findIndex(t => b[0].includes(t));
  })
  .forEach(([tier, count]) => {
    console.log(`  ${tier}: ${count}`);
  });

const scoreDist = {};
ranked.forEach(c => {
  scoreDist[c.truth_score] = (scoreDist[c.truth_score] || 0) + 1;
});

console.log("\n=== TRUTH SCORE DISTRIBUTION ===");
Object.entries(scoreDist)
  .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
  .forEach(([score, count]) => {
    console.log(`  ${score}/8 truths: ${count} companies`);
  });

const routingCounts = { engineering: 0, scientific: 0, both: 0, review: 0 };
ranked.forEach(c => {
  if (c.routing.includes('natoli_engineering') && c.routing.includes('natoli_scientific')) {
    routingCounts.both++;
  } else if (c.routing.includes('natoli_engineering')) {
    routingCounts.engineering++;
  } else if (c.routing.includes('natoli_scientific')) {
    routingCounts.scientific++;
  } else {
    routingCounts.review++;
  }
});

console.log("\n=== ROUTING BREAKDOWN ===");
console.log(`  Natoli Engineering: ${routingCounts.engineering}`);
console.log(`  Natoli Scientific: ${routingCounts.scientific}`);
console.log(`  Both Divisions: ${routingCounts.both}`);
console.log(`  Needs Routing Review: ${routingCounts.review}`);

console.log("\n=== TOP RANKED COMPANIES (by truth score) ===");
ranked.slice(0, 20).forEach(c => {
  console.log(`  ${c.truth_score}/8: ${c.name} | ${c.industry} | ${c.rank_tier.split(' – ')[0]}`);
});

console.log("\n=== TIER 1 CANDIDATES (8/8 truths) ===");
const tier1 = ranked.filter(c => c.truth_score === 8);
if (tier1.length === 0) {
  console.log("  None - current data lacks detailed descriptions with all required keywords");
  console.log("  Need: tablet compression, punch/die, formulation, granulation, USP, scale-up, manufacturing");
} else {
  tier1.forEach(c => {
    console.log(`  ${c.name} | ${c.industry}`);
  });
}

console.log("\n=== TIER 2 CANDIDATES (6-7/8 truths) ===");
const tier2 = ranked.filter(c => c.truth_score >= 6 && c.truth_score < 8);
if (tier2.length === 0) {
  console.log("  None at 6-7 truths level");
} else {
  tier2.slice(0, 10).forEach(c => {
    console.log(`  ${c.truth_score}/8: ${c.name} | Missing: ${c.failed_truths.join(', ')}`);
  });
}

const outputPath = path.join(__dirname, "territory_ranked.json");
fs.writeFileSync(outputPath, JSON.stringify(ranked.slice(0, 100), null, 2));
console.log(`\nTop 100 saved to: ${outputPath}`);
