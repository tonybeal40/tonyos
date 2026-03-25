const PAIN_POINTS = {
  scientific: [
    "Scale-up risk from lab to commercial",
    "Analytical data gaps during tech transfer",
    "Method transfer uncertainty across sites",
    "Formulation changes affecting tablet quality",
    "Validation timeline pressure",
    "Compaction predictability at production scale"
  ],
  engineering: [
    "Tooling wear and replacement costs",
    "Unplanned downtime from tool failure",
    "Inconsistent compression force profiles",
    "Punch tip defects causing tablet issues",
    "Die wear affecting tablet weight uniformity",
    "Maintenance scheduling for tablet presses"
  ],
  common: [
    "Tablet quality consistency",
    "Regulatory compliance pressure",
    "Production efficiency targets"
  ]
};

export function getPainPoints(division, industry = null) {
  if (division === "BOTH" || division === "Both") {
    return [
      ...PAIN_POINTS.scientific.slice(0, 3),
      ...PAIN_POINTS.engineering.slice(0, 3)
    ];
  }

  if (division === "Natoli Scientific") {
    return PAIN_POINTS.scientific.slice(0, 4);
  }

  if (division === "Natoli Engineering") {
    return PAIN_POINTS.engineering.slice(0, 4);
  }

  return PAIN_POINTS.common;
}

export function getWhyNatoli(division) {
  if (division === "Natoli Scientific") {
    return "Analytical rigor and scale-up confidence - helping R&D and MS&T teams predict and solve compaction problems before they reach production";
  }
  
  if (division === "Natoli Engineering") {
    return "Precision tooling and production reliability - reducing downtime and extending tool life for manufacturing teams";
  }
  
  if (division === "BOTH" || division === "Both") {
    return "End-to-end compaction support - from formulation development through commercial manufacturing with integrated scientific and engineering expertise";
  }

  return "Compaction expertise for tablet manufacturing operations";
}
