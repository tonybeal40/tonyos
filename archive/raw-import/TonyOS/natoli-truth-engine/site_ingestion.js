const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const truths = JSON.parse(fs.readFileSync(path.join(__dirname, "natoli_truths.json"), "utf8"));
const queries = JSON.parse(fs.readFileSync(path.join(__dirname, "discovery_queries.json"), "utf8"));

const visited = new Set();
const siteCompanies = [];

function normalize(text) {
  return text.replace(/\s+/g, " ").toLowerCase();
}

function hasAny(text, list = []) {
  return list.some(k => text.includes(k));
}

async function searchWeb(query) {
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const res = await axios.get(url, { 
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NatoliIngestion/1.0)' }
    });
    const $ = cheerio.load(res.data);

    const links = new Set();
    $("a.result__a").each((_, el) => {
      const href = $(el).attr("href");
      if (href && href.startsWith("http")) links.add(href.split("&")[0]);
    });

    return Array.from(links);
  } catch (err) {
    console.log(`  Search error: ${err.message}`);
    return [];
  }
}

async function crawlCompany(baseUrl) {
  const paths = ["", "/about", "/careers", "/jobs", "/news", "/about-us", "/company"];
  let combinedText = "";

  for (const pathSuffix of paths) {
    try {
      const urlObj = new URL(baseUrl);
      urlObj.pathname = pathSuffix;
      const url = urlObj.toString();
      
      if (visited.has(url)) continue;
      visited.add(url);

      const res = await axios.get(url, { 
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NatoliIngestion/1.0)' }
      });
      const $ = cheerio.load(res.data);
      combinedText += " " + $("body").text();
    } catch {}
  }

  return normalize(combinedText);
}

function evaluateTruths(text) {
  const passed = [];
  const failed = [];

  for (const truth of truths.truths) {
    let ok = true;

    if (truth.required_keywords && !hasAny(text, truth.required_keywords)) ok = false;
    if (truth.blocked_keywords && hasAny(text, truth.blocked_keywords)) ok = false;

    if (ok) {
      passed.push(truth.id);
    } else if (truth.rejection_sentence) {
      failed.push(truth.rejection_sentence);
    }
  }

  if (hasAny(text, truths.global_blocked_keywords)) {
    return { qualified: false, passed: [], failed: ["Globally excluded manufacturing category"] };
  }

  return { 
    qualified: failed.length === 0, 
    passed, 
    failed,
    score: passed.length
  };
}

function generateWhyNatoliFits(passedTruths) {
  const reasons = [];

  if (passedTruths.includes("uses_powder_compaction"))
    reasons.push("They compact powders using press-based processes");

  if (passedTruths.includes("produces_pressed_solid"))
    reasons.push("Their primary products are tablets, pellets, or pressed solids");

  if (passedTruths.includes("tooling_impacts_outcome"))
    reasons.push("Tooling performance directly impacts quality and yield");

  if (passedTruths.includes("formulation_impacts_compaction"))
    reasons.push("Formulation variables influence compaction behavior");

  if (passedTruths.includes("scale_up_matters"))
    reasons.push("Scale-up introduces tooling and formulation risk");

  if (passedTruths.includes("process_is_press_based"))
    reasons.push("Manufacturing is press-based, not molded or liquid");

  if (passedTruths.includes("manufacturing_or_rnd_internal"))
    reasons.push("Manufacturing or R&D is performed internally");

  if (passedTruths.includes("performance_specs_exist"))
    reasons.push("Performance and regulatory specs drive process decisions");

  if (reasons.length === 0) {
    return "Shows powder compaction and formulation signals aligned with Natoli capabilities.";
  }

  return reasons.join(". ") + ".";
}

function getRouting(text) {
  const routing = [];
  
  if (hasAny(text, truths.routing_rules.natoli_engineering)) {
    routing.push("natoli_engineering");
  }
  if (hasAny(text, truths.routing_rules.natoli_scientific)) {
    routing.push("natoli_scientific");
  }
  
  if (routing.length === 0) {
    routing.push("routing_review_required");
  }
  
  return routing;
}

(async () => {
  console.log("Natoli Site Ingestion Engine");
  console.log("============================\n");

  for (const query of queries.queries) {
    console.log(`Searching: ${query}`);
    const links = await searchWeb(query);
    console.log(`  Found ${links.length} results`);

    for (const url of links) {
      if (siteCompanies.some(c => c.company_url === url)) continue;
      
      const text = await crawlCompany(url);
      if (!text || text.length < 100) continue;

      const evaluation = evaluateTruths(text);
      
      // Accept companies that pass ALL truths OR at least 6/8 truths
      const isQualified = evaluation.qualified || evaluation.score >= 6;
      
      if (!isQualified) continue;

      const entry = {
        company_url: url,
        why_natoli_fits: generateWhyNatoliFits(evaluation.passed),
        qualification_basis: evaluation.passed,
        truth_score: evaluation.score,
        routing: getRouting(text),
        tier: evaluation.qualified ? "Tier 1" : "Tier 2",
        added_at: new Date().toISOString()
      };
      
      siteCompanies.push(entry);
      console.log(`  ✓ QUALIFIED: ${url} (${evaluation.score}/8 truths)`);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 1500));
  }

  const outputPath = path.join(__dirname, "natoli_site_companies.json");
  fs.writeFileSync(outputPath, JSON.stringify(siteCompanies, null, 2));

  console.log(`\n============================`);
  console.log(`Site ingestion complete. ${siteCompanies.length} companies added.`);
  console.log(`Output: ${outputPath}`);
  
  if (siteCompanies.length > 0) {
    console.log("\nSample entries:");
    siteCompanies.slice(0, 3).forEach(c => {
      console.log(`  ${c.company_url}`);
      console.log(`    Why: ${c.why_natoli_fits.substring(0, 80)}...`);
      console.log(`    Tier: ${c.tier} | Score: ${c.truth_score}/8`);
    });
  }
})();
