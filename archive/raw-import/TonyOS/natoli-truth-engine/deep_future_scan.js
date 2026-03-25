const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const truths = JSON.parse(fs.readFileSync(path.join(__dirname, "natoli_truths.json"), "utf8"));
const signals = JSON.parse(fs.readFileSync(path.join(__dirname, "future_demand_signals.json"), "utf8"));

const visited = new Set();
const results = [];

function normalize(text) {
  return text.replace(/\s+/g, " ").toLowerCase();
}

function hasAny(text, list = []) {
  return list.some(k => text.includes(k));
}

async function fetchPage(url) {
  try {
    const res = await axios.get(url, { 
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NatoliScanner/1.0)' }
    });
    const $ = cheerio.load(res.data);
    return normalize($("body").text());
  } catch {
    return "";
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

      const text = await fetchPage(url);
      if (text) combinedText += " " + text;
    } catch {
      continue;
    }
  }

  return combinedText;
}

function evaluateFutureNeed(text) {
  const hit = {
    hiring: hasAny(text, signals.future_need_signals.hiring),
    infrastructure: hasAny(text, signals.future_need_signals.infrastructure),
    language_shift: hasAny(text, signals.future_need_signals.language_shifts),
    excluded: hasAny(text, signals.future_need_signals.exclusions)
  };

  return hit;
}

function evaluateNatoliTruths(text) {
  let passCount = 0;

  for (const truth of truths.truths) {
    if (truth.required_keywords && hasAny(text, truth.required_keywords)) {
      passCount++;
    }
  }

  return passCount;
}

(async () => {
  console.log("Natoli Future Demand Intelligence Engine");
  console.log("=========================================\n");

  const emergingPath = path.join(__dirname, "emerging_natoli_companies.json");
  
  if (!fs.existsSync(emergingPath)) {
    console.log("No emerging_natoli_companies.json found.");
    console.log("Run global_discovery.js first to generate seed companies.");
    process.exit(1);
  }

  const seedCompanies = JSON.parse(fs.readFileSync(emergingPath, "utf8"));
  console.log(`Scanning ${seedCompanies.length} seed companies for future demand signals...\n`);

  for (const company of seedCompanies) {
    console.log(`Crawling: ${company.url}`);
    const text = await crawlCompany(company.url);
    if (!text) {
      console.log("  - No content found");
      continue;
    }

    if (hasAny(text, truths.global_blocked_keywords)) {
      console.log("  - Blocked by global exclusions");
      continue;
    }

    const futureSignals = evaluateFutureNeed(text);
    if (futureSignals.excluded) {
      console.log("  - Excluded (gummy/liquid/etc.)");
      continue;
    }

    const truthScore = evaluateNatoliTruths(text);

    const hasFutureSignal = futureSignals.hiring || futureSignals.infrastructure || futureSignals.language_shift;
    const minTruths = Math.floor(truths.truths.length / 2);

    if (hasFutureSignal && truthScore >= minTruths) {
      results.push({
        url: company.url,
        future_need_detected: true,
        indicators: {
          hiring: futureSignals.hiring,
          infrastructure: futureSignals.infrastructure,
          language_shift: futureSignals.language_shift
        },
        natoli_truth_score: truthScore,
        verdict: "Company shows leading indicators of future tooling and formulation needs"
      });
      console.log(`  ✓ FUTURE TARGET: ${truthScore} truths + future signals`);
    } else {
      console.log(`  - ${truthScore} truths, future signals: ${hasFutureSignal}`);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  const outputPath = path.join(__dirname, "future_natoli_targets.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`\n=========================================`);
  console.log(`Future-demand scan complete. ${results.length} targets identified.`);
  console.log(`Output: ${outputPath}`);
})();
