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

  const result = {
    name: company.name,
    qualified: true,
    routing: [],
    failed_truths: [],
    rejection_reasons: [],
    passed_truths: []
  };

  // GLOBAL HARD BLOCK
  if (hasAny(text, rules.global_blocked_keywords)) {
    result.qualified = false;
    result.rejection_reasons.push(
      "Company operates in a globally excluded manufacturing category for Natoli."
    );
    return result;
  }

  // TRUTH CHECKS
  for (const truth of rules.truths) {
    if (truth.required_keywords && !hasAny(text, truth.required_keywords)) {
      result.failed_truths.push(truth.id);
      result.rejection_reasons.push(truth.rejection_sentence);
    } else if (truth.required_keywords) {
      result.passed_truths.push(truth.id);
    }

    if (truth.blocked_keywords && hasAny(text, truth.blocked_keywords)) {
      result.qualified = false;
      result.failed_truths.push(truth.id);
      result.rejection_reasons.push(truth.rejection_sentence);
    }
  }

  // Tiering based on truth pass count
  // Tier 1: Passes ALL truths (fully qualified)
  // Tier 2: Passes 4+ truths (partially qualified)
  // Tier 3: Passes 1-3 truths (needs validation)
  // Excluded: Passes 0 truths or has blocked keywords
  
  const passedCount = result.passed_truths.length;
  const totalRequired = rules.truths.filter(t => t.required_keywords).length;
  
  if (result.qualified && passedCount === totalRequired) {
    result.tier = 'Tier 1';
  } else if (passedCount >= 4) {
    result.tier = 'Tier 2';
    result.qualified = false;
  } else if (passedCount >= 1) {
    result.tier = 'Tier 3';
    result.qualified = false;
  } else {
    result.tier = null;
    result.qualified = false;
  }

  // ROUTING (based on signals, regardless of tier)
  for (const [route, keywords] of Object.entries(rules.routing_rules)) {
    if (hasAny(text, keywords)) {
      result.routing.push(route);
    }
  }

  if (result.routing.length === 0 && result.tier) {
    result.routing.push("routing_review_required");
  }

  return result;
}

function evaluateTerritory(companies) {
  const results = {
    tier1: [],
    tier2: [],
    tier3: [],
    excluded: []
  };
  
  for (const company of companies) {
    const result = evaluateCompany(company);
    
    if (result.tier === 'Tier 1') {
      results.tier1.push({ ...company, ...result });
    } else if (result.tier === 'Tier 2') {
      results.tier2.push({ ...company, ...result });
    } else if (result.tier === 'Tier 3') {
      results.tier3.push({ ...company, ...result });
    } else {
      results.excluded.push({ ...company, ...result });
    }
  }
  
  return results;
}

module.exports = { evaluateCompany, evaluateTerritory, rules };

// CLI mode
if (require.main === module) {
  const inputPath = process.argv[2] || path.join(__dirname, "input_companies.json");
  
  if (fs.existsSync(inputPath)) {
    const companies = JSON.parse(fs.readFileSync(inputPath, "utf8"));
    const output = companies.map(evaluateCompany);
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log("Usage: node truth_engine.js <input_companies.json>");
  }
}
