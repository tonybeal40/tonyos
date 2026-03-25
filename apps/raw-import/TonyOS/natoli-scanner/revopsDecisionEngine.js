const MARKET_PERSONAS = {
  "pharmaceutical": {
    scientific: [
      { persona: "Director of R&D", tier: 1, risk: "Late-stage formulation surprises that delay launch" },
      { persona: "Formulation Scientist", tier: 1, risk: "Compression issues discovered too late in development" },
      { persona: "MS&T Director", tier: 1, risk: "Scale-up failures during tech transfer" },
      { persona: "Process Development Manager", tier: 1, risk: "Unpredictable tablet hardness and dissolution" }
    ],
    engineering: [
      { persona: "VP of Manufacturing", tier: 1, risk: "Unplanned downtime from tool failure" },
      { persona: "Production Manager", tier: 2, risk: "Inconsistent batch quality and yield loss" },
      { persona: "Maintenance Director", tier: 2, risk: "Excessive tooling wear and replacement costs" }
    ]
  },
  "nutraceutical": {
    scientific: [
      { persona: "R&D Director", tier: 1, risk: "Formulation stability and tablet integrity issues" },
      { persona: "QA Manager", tier: 2, risk: "Batch consistency and dissolution failures" }
    ],
    engineering: [
      { persona: "VP of Operations", tier: 1, risk: "Production bottlenecks and tooling costs" },
      { persona: "Plant Manager", tier: 1, risk: "Downtime and tool replacement frequency" },
      { persona: "Production Supervisor", tier: 2, risk: "Quality defects from worn tooling" }
    ]
  },
  "battery": {
    scientific: [
      { persona: "Director of R&D", tier: 1, risk: "Electrode density inconsistency affecting performance" },
      { persona: "Materials Scientist", tier: 1, risk: "Powder compaction variability in cell production" },
      { persona: "Process Engineer", tier: 1, risk: "Scale-up challenges from lab to production" }
    ],
    engineering: [
      { persona: "VP of Manufacturing", tier: 1, risk: "Tool wear impacting cell quality and yield" },
      { persona: "Production Manager", tier: 2, risk: "Compression force drift causing defects" }
    ]
  },
  "cannabis": {
    scientific: [
      { persona: "Formulation Director", tier: 1, risk: "Dosage uniformity and dissolution rate" }
    ],
    engineering: [
      { persona: "Operations Director", tier: 1, risk: "Scaling production while maintaining quality" },
      { persona: "Production Manager", tier: 2, risk: "Tool maintenance and replacement costs" }
    ]
  },
  "default": {
    scientific: [
      { persona: "R&D / Formulation Lead", tier: 1, risk: "Development setbacks from compaction issues" },
      { persona: "Process Engineering Manager", tier: 1, risk: "Scale-up predictability problems" }
    ],
    engineering: [
      { persona: "Manufacturing Director", tier: 1, risk: "Unplanned downtime and tool failure" },
      { persona: "Production Manager", tier: 2, risk: "Quality issues from worn tooling" }
    ]
  }
};

const MARKET_STORYBRAND = {
  "pharmaceutical": {
    hero: "Pharmaceutical manufacturing and formulation teams",
    problem_external: "Tablet compression issues causing batch failures and delayed launches",
    problem_internal: "Frustration from unpredictable tool performance and quality surprises",
    problem_philosophical: "World-class drug development shouldn't be derailed by tooling problems",
    guide_empathy: "We understand the pressure of validation timelines and FDA scrutiny",
    guide_authority: "50+ years serving pharma with precision tooling and formulation support",
    plan: "1. Assess current tooling and compression challenges 2. Recommend optimized tooling design 3. Provide ongoing technical support",
    cta: "Schedule a tooling assessment",
    success: "Predictable tablet quality, faster scale-up, and reduced downtime",
    failure: "Continued batch failures, delayed launches, and compliance risks"
  },
  "nutraceutical": {
    hero: "Nutraceutical and dietary supplement manufacturers",
    problem_external: "Inconsistent tablet quality and high tooling replacement costs",
    problem_internal: "Stress from production delays and quality complaints",
    problem_philosophical: "Quality supplements deserve quality manufacturing",
    guide_empathy: "We know the margin pressure and speed-to-market demands you face",
    guide_authority: "Trusted by leading supplement brands for precision tablet tooling",
    plan: "1. Evaluate current compression setup 2. Optimize tooling for your formulations 3. Reduce wear and improve consistency",
    cta: "Get a production efficiency review",
    success: "Lower tooling costs, faster changeovers, consistent quality",
    failure: "Ongoing quality issues and lost production time"
  },
  "battery": {
    hero: "Battery cell manufacturers and energy storage companies",
    problem_external: "Electrode compaction variability affecting cell performance",
    problem_internal: "Uncertainty about scaling from R&D to production volumes",
    problem_philosophical: "The energy transition demands manufacturing excellence",
    guide_empathy: "We understand the technical precision required for next-gen batteries",
    guide_authority: "Supporting advanced materials compaction for cutting-edge industries",
    plan: "1. Analyze current powder compaction process 2. Design tooling for optimal density 3. Support scale-up validation",
    cta: "Discuss your compaction challenges",
    success: "Consistent electrode quality, scalable production, competitive advantage",
    failure: "Cell performance variability and scaling delays"
  },
  "cannabis": {
    hero: "Cannabis product manufacturers and edible producers",
    problem_external: "Dosage uniformity issues and scaling challenges from small batch to high-volume production",
    problem_internal: "Uncertainty about maintaining consistency as production scales",
    problem_philosophical: "This emerging market deserves the same manufacturing excellence as pharma",
    guide_empathy: "We understand the regulatory pressure and quality demands of this growing industry",
    guide_authority: "Bringing pharmaceutical-grade tablet expertise to cannabis manufacturing",
    plan: "1. Assess current compression setup 2. Optimize for consistent dosage 3. Scale production reliably",
    cta: "Schedule a consultation",
    success: "Consistent dosage, scalable production, regulatory compliance",
    failure: "Inconsistent products and scaling bottlenecks"
  },
  "default": {
    hero: "Manufacturing teams working with powder compaction",
    problem_external: "Tooling wear, quality inconsistency, and unplanned downtime",
    problem_internal: "Frustration from unpredictable production outcomes",
    problem_philosophical: "Precision manufacturing deserves precision tooling",
    guide_empathy: "We understand the daily pressure to deliver quality and meet targets",
    guide_authority: "50+ years of powder compaction expertise across industries",
    plan: "1. Assess your current process 2. Recommend optimized solutions 3. Provide ongoing support",
    cta: "Schedule a consultation",
    success: "Reduced downtime, consistent quality, lower tooling costs",
    failure: "Continued quality issues and production inefficiency"
  }
};

function getMarketCategory(markets) {
  const lower = (markets || []).map(m => m.toLowerCase()).join(" ");
  // Priority order: check cannabis FIRST since many cannabis sites also match pharma patterns
  if (lower.includes("cannabis") || lower.includes("marijuana") || lower.includes("thc") || lower.includes("cbd")) return "cannabis";
  if (lower.includes("battery") || lower.includes("energy storage") || lower.includes("electrode")) return "battery";
  if (lower.includes("nutraceutical") || lower.includes("dietary") || lower.includes("supplement")) return "nutraceutical";
  if (lower.includes("pharma") || lower.includes("generic") || lower.includes("veterinary")) return "pharmaceutical";
  return "default";
}

export function decideNatoliAccount(evidence) {
  const decision = {
    market_gate: "fail",
    market_fit: evidence.marketFit || "Unknown",
    detected_markets: evidence.detectedMarkets || [],
    environment_tier: null,
    persona_tiers: [],
    signal_status: "Monitor",
    division_owner: null,
    routing_action: null,
    disqualification_reason: null,
    storybrand: null
  };

  if (!evidence.isPrimaryMarket && evidence.detectedMarkets?.length === 0) {
    decision.disqualification_reason =
      "Industry not identified - unable to confirm fit with Natoli primary markets";
    return decision;
  }

  if (!evidence.isPrimaryMarket) {
    decision.disqualification_reason =
      `Industry "${evidence.marketFit}" is not a Natoli primary market`;
    return decision;
  }

  const compactionAssumedMarkets = [
    "pharmaceutical", "pharma", "generic", "nutraceutical", "dietary supplement",
    "veterinary", "cannabis", "nuclear", "battery", "energy storage", 
    "catalyst", "ceramic", "explosive", "propellant", "ammunition"
  ];
  
  const isCompactionAssumed = evidence.detectedMarkets?.some(market =>
    compactionAssumedMarkets.some(k => market.toLowerCase().includes(k))
  );
  
  if (!evidence.compactionCritical && !isCompactionAssumed) {
    decision.disqualification_reason =
      "Compaction does not materially affect performance, compliance, or uptime";
    return decision;
  }

  decision.market_gate = "pass";

  if (evidence.regulated && evidence.commercialScale) {
    decision.environment_tier = "Tier 1 Environment";
  } else if (evidence.rdOrPilot) {
    decision.environment_tier = "Tier 2 Environment";
  } else if (isCompactionAssumed) {
    decision.environment_tier = "Tier 1 Environment";
  } else {
    decision.disqualification_reason =
      "No defensible compaction risk at the company environment level";
    return decision;
  }

  const marketCategory = getMarketCategory(evidence.detectedMarkets);
  const personas = MARKET_PERSONAS[marketCategory] || MARKET_PERSONAS["default"];

  if (evidence.hasMST) {
    decision.persona_tiers.push({
      persona: "MS&T / Process Engineering",
      tier: 1,
      division: "Natoli Scientific",
      risk: "Scale up predictability"
    });
  }

  if (evidence.hasRD) {
    decision.persona_tiers.push({
      persona: "R&D / Formulation",
      tier: 1,
      division: "Natoli Scientific",
      risk: "Late stage surprises"
    });
  }

  if (evidence.hasEngineering) {
    decision.persona_tiers.push({
      persona: "Engineering / Production",
      tier: 2,
      division: "Natoli Engineering",
      risk: "Downtime and tool failure"
    });
  }

  if (decision.persona_tiers.length === 0) {
    const scientificPersona = personas.scientific[0];
    const engineeringPersona = personas.engineering[0];
    
    decision.persona_tiers.push({
      persona: scientificPersona.persona,
      tier: scientificPersona.tier,
      division: "Natoli Scientific",
      risk: scientificPersona.risk
    });
    
    decision.persona_tiers.push({
      persona: engineeringPersona.persona,
      tier: engineeringPersona.tier,
      division: "Natoli Engineering",
      risk: engineeringPersona.risk
    });
  }

  const divisions = [...new Set(decision.persona_tiers.map(p => p.division))];
  decision.division_owner = divisions.length === 1 ? divisions[0] : "Both";

  if (evidence.scaleUpSignal || evidence.validationSignal) {
    decision.signal_status = "Engage Now";
    decision.routing_action = "Route to Tier 1 technical owner";
  } else {
    decision.signal_status = "Monitor";
    decision.routing_action = "Hold until scale-up or validation signal appears";
  }

  decision.storybrand = MARKET_STORYBRAND[marketCategory] || MARKET_STORYBRAND["default"];

  return decision;
}
