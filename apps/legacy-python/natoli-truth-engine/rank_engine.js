const fs = require("fs");
const path = require("path");

const rules = JSON.parse(fs.readFileSync(path.join(__dirname, "natoli_truths.json"), "utf8"));

function normalize(text) {
  return text.toLowerCase();
}

function hasAny(text, list = []) {
  return list.some(k => text.includes(k));
}

function evaluateCompany(company) {
  const text = normalize(
    `${company.name} ${company.industry || ''} ${company.description || ''} ${company.tier1Reason || ''}`
  );

  const evaluation = {
    name: company.name,
    industry: company.industry,
    satisfied_truths: [],
    failed_truths: [],
    rejection_reasons: [],
    routing: [],
    truth_score: 0,
    rank_tier: null
  };

  if (hasAny(text, rules.global_blocked_keywords)) {
    evaluation.failed_truths.push("global_block");
    evaluation.rejection_reasons.push(
      "Company operates in a manufacturing category that is structurally incompatible with Natoli."
    );
    return evaluation;
  }

  for (const truth of rules.truths) {
    let passed = true;

    if (truth.required_keywords && !hasAny(text, truth.required_keywords)) {
      passed = false;
    }

    if (truth.blocked_keywords && hasAny(text, truth.blocked_keywords)) {
      passed = false;
    }

    if (passed) {
      evaluation.satisfied_truths.push(truth.id);
      evaluation.truth_score += 1;
    } else {
      evaluation.failed_truths.push(truth.id);
      if (truth.rejection_sentence) {
        evaluation.rejection_reasons.push(truth.rejection_sentence);
      }
    }
  }

  for (const [route, keywords] of Object.entries(rules.routing_rules)) {
    if (hasAny(text, keywords)) {
      evaluation.routing.push(route);
    }
  }

  if (evaluation.routing.length === 0) {
    evaluation.routing.push("routing_review_required");
  }

  return evaluation;
}

function assignTier(score, totalTruths) {
  const ratio = score / totalTruths;

  if (ratio === 1) return "Tier 1 – Immediate Natoli Priority";
  if (ratio >= 0.75) return "Tier 2 – High Potential / Emerging";
  if (ratio >= 0.5) return "Tier 3 – Monitor";
  return "Tier 4 – Not a Fit";
}

function rankCompanies(companies) {
  const totalTruths = rules.truths.length;

  const ranked = companies
    .map(evaluateCompany)
    .map(c => ({
      ...c,
      rank_tier: assignTier(c.truth_score, totalTruths)
    }))
    .sort((a, b) => b.truth_score - a.truth_score);

  return ranked;
}

module.exports = { evaluateCompany, rankCompanies, assignTier };

if (require.main === module) {
  const inputPath = process.argv[2] || path.join(__dirname, "input_companies.json");
  
  if (!fs.existsSync(inputPath)) {
    console.log("Usage: node rank_engine.js <input_companies.json>");
    process.exit(1);
  }

  const companies = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const totalTruths = rules.truths.length;

  const ranked = rankCompanies(companies);

  const outputPath = path.join(__dirname, "ranked_natoli_companies.json");
  fs.writeFileSync(outputPath, JSON.stringify(ranked, null, 2));

  console.log(`Ranked ${ranked.length} companies using ${totalTruths} Natoli truths.`);
  
  const tierCounts = {};
  ranked.forEach(c => {
    tierCounts[c.rank_tier] = (tierCounts[c.rank_tier] || 0) + 1;
  });
  
  console.log("\nTier Distribution:");
  Object.entries(tierCounts).forEach(([tier, count]) => {
    console.log(`  ${tier}: ${count}`);
  });
}
