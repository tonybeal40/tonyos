const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const truths = JSON.parse(fs.readFileSync(path.join(__dirname, "natoli_truths.json"), "utf8"));
const seeds = JSON.parse(fs.readFileSync(path.join(__dirname, "global_search_seeds.json"), "utf8"));

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
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NatoliDiscovery/1.0)' }
    });
    const $ = cheerio.load(res.data);
    const links = new Set();

    $("a.result__a").each((_, el) => {
      const href = $(el).attr("href");
      if (href && href.startsWith("http")) {
        links.add(href.split("&")[0]);
      }
    });

    return Array.from(links);
  } catch (err) {
    console.log(`  Search failed: ${err.message}`);
    return [];
  }
}

async function scrapePage(url) {
  try {
    const res = await axios.get(url, { 
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NatoliDiscovery/1.0)' }
    });
    const $ = cheerio.load(res.data);
    return normalize($("body").text());
  } catch {
    return "";
  }
}

function evaluateTruths(text) {
  const failures = [];
  const passed = [];

  for (const truth of truths.truths) {
    if (truth.required_keywords && !hasAny(text, truth.required_keywords)) {
      failures.push(truth.rejection_sentence);
    } else if (truth.required_keywords) {
      passed.push(truth.id);
    }
    if (truth.blocked_keywords && hasAny(text, truth.blocked_keywords)) {
      failures.push(truth.rejection_sentence);
    }
  }

  if (hasAny(text, truths.global_blocked_keywords)) {
    failures.push("Company operates in a globally excluded manufacturing category for Natoli.");
  }

  return {
    qualified: failures.length === 0,
    passed_truths: passed,
    truth_score: passed.length,
    failures
  };
}

(async () => {
  const discovered = {};
  const qualified = [];

  console.log("Natoli Global Discovery Engine");
  console.log("================================\n");

  for (const query of seeds.queries) {
    console.log(`Searching: ${query}`);
    const links = await searchWeb(query);
    console.log(`  Found ${links.length} results`);

    for (const link of links) {
      if (discovered[link]) continue;

      const text = await scrapePage(link);
      if (!text) continue;

      discovered[link] = true;

      const evaluation = evaluateTruths(text);

      if (evaluation.qualified) {
        qualified.push({
          url: link,
          detected_via: query,
          truth_score: evaluation.truth_score,
          passed_truths: evaluation.passed_truths,
          verdict: "Qualified emerging Natoli account",
          rationale: "Powder compaction, tooling relevance, and formulation signals detected"
        });
        console.log(`  ✓ QUALIFIED: ${link}`);
      } else if (evaluation.truth_score >= 4) {
        qualified.push({
          url: link,
          detected_via: query,
          truth_score: evaluation.truth_score,
          passed_truths: evaluation.passed_truths,
          verdict: "Potential Natoli account - needs validation",
          rationale: `Passed ${evaluation.truth_score}/8 truths`
        });
        console.log(`  ~ POTENTIAL: ${link} (${evaluation.truth_score} truths)`);
      }
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  const outputPath = path.join(__dirname, "emerging_natoli_companies.json");
  fs.writeFileSync(outputPath, JSON.stringify(qualified, null, 2));

  console.log(`\n================================`);
  console.log(`Discovery complete. ${qualified.length} qualified/potential companies found.`);
  console.log(`Output: ${outputPath}`);
})();
