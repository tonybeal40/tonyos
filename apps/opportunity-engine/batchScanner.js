import { scanPressure } from "./openaiScanner.js";
import { mapPressure, getPressureSummary } from "./pressureMapper.js";
import { detectCompetitors, getCompetitorGravity } from "./competitorIntel.js";
import { classifyTaxonomy } from "./taxonomy.js";
import { routeDivision, getDivisionSummary } from "./divisionRouter.js";

export async function batchScan(companies, useAI = true) {
  const results = [];
  
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const description = company.description || company.text || "";
    
    const localPressure = mapPressure(description);
    const competitors = detectCompetitors(description);
    const competitorGravity = getCompetitorGravity(competitors);
    const taxonomy = classifyTaxonomy(description);
    const division = routeDivision(description);
    
    let aiResult = null;
    if (useAI) {
      aiResult = await scanPressure(description, company.name);
    }
    
    const result = {
      name: company.name,
      website: company.website || null,
      region: company.region || "unknown",
      localAnalysis: {
        ...localPressure,
        summary: getPressureSummary(localPressure)
      },
      competitors: competitors.map(c => c.name),
      competitorGravity,
      taxonomy,
      division,
      ai: aiResult,
      finalTier: aiResult ? aiResult.tier : localPressure.tier,
      scannedAt: new Date().toISOString()
    };
    
    results.push(result);
  }
  
  return results;
}

export { getDivisionSummary };

export function summarizeBatch(results) {
  const tier1 = results.filter(r => r.finalTier === 1).length;
  const tier2 = results.filter(r => r.finalTier === 2).length;
  const tier3 = results.filter(r => r.finalTier === 3).length;
  
  const allCompetitors = {};
  results.forEach(r => {
    r.competitors.forEach(c => {
      allCompetitors[c] = (allCompetitors[c] || 0) + 1;
    });
  });
  
  return {
    total: results.length,
    tier1,
    tier2,
    tier3,
    competitorDistribution: allCompetitors,
    scannedAt: new Date().toISOString()
  };
}
