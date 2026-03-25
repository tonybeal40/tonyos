export const scientificKeywords = [
  "formulation",
  "scale-up",
  "R&D",
  "research",
  "development",
  "API",
  "active pharmaceutical",
  "excipient",
  "dissolution",
  "bioavailability",
  "stability",
  "ICH",
  "clinical",
  "trial",
  "pilot batch",
  "tech transfer",
  "MS&T",
  "manufacturing science",
  "process development",
  "analytical",
  "QbD",
  "quality by design",
  "DoE",
  "design of experiments",
  "characterization",
  "particle size",
  "blend uniformity",
  "content uniformity",
  "friability",
  "hardness testing",
  "disintegration"
];

export const engineeringKeywords = [
  "tooling",
  "punch",
  "die",
  "turret",
  "press maintenance",
  "tablet press",
  "rotary press",
  "single station",
  "multi-tip",
  "wear",
  "refurbishment",
  "rebuild",
  "spare parts",
  "OEM",
  "retrofit",
  "upgrade",
  "installation",
  "commissioning",
  "preventive maintenance",
  "calibration",
  "force feeder",
  "pre-compression",
  "main compression",
  "ejection",
  "take-off",
  "dwell time",
  "cam track",
  "keyed tooling",
  "B tooling",
  "D tooling",
  "EU tooling",
  "TSM",
  "IPT"
];

export function routeDivision(text) {
  const lower = text.toLowerCase();
  
  const scientificMatches = scientificKeywords.filter(k => lower.includes(k.toLowerCase()));
  const engineeringMatches = engineeringKeywords.filter(k => lower.includes(k.toLowerCase()));
  
  const scientificScore = scientificMatches.length;
  const engineeringScore = engineeringMatches.length;
  
  let division;
  if (scientificScore > 0 && engineeringScore > 0) {
    division = "both";
  } else if (scientificScore > engineeringScore) {
    division = "scientific";
  } else if (engineeringScore > scientificScore) {
    division = "engineering";
  } else if (scientificScore === 0 && engineeringScore === 0) {
    division = "unknown";
  } else {
    division = "both";
  }
  
  return {
    division,
    scientificScore,
    engineeringScore,
    scientificMatches,
    engineeringMatches,
    recommendation: getDivisionRecommendation(division, scientificScore, engineeringScore)
  };
}

function getDivisionRecommendation(division, sciScore, engScore) {
  if (division === "scientific") {
    return `Route to Natoli Scientific. ${sciScore} formulation/R&D signals detected.`;
  } else if (division === "engineering") {
    return `Route to Natoli Engineering. ${engScore} tooling/equipment signals detected.`;
  } else if (division === "both") {
    return `Route to BOTH divisions. Scientific: ${sciScore} signals, Engineering: ${engScore} signals. Coordinate joint approach.`;
  }
  return "Insufficient signals for routing. Gather more intelligence.";
}

export function getDivisionSummary(results) {
  const scientific = results.filter(r => r.division?.division === "scientific");
  const engineering = results.filter(r => r.division?.division === "engineering");
  const both = results.filter(r => r.division?.division === "both");
  const unknown = results.filter(r => r.division?.division === "unknown");
  
  return {
    scientific: scientific.length,
    engineering: engineering.length,
    both: both.length,
    unknown: unknown.length,
    scientificCompanies: scientific.map(r => r.name),
    engineeringCompanies: engineering.map(r => r.name),
    bothCompanies: both.map(r => r.name)
  };
}
