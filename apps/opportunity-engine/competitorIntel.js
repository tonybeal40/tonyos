export const competitors = [
  { name: "Fette Compacting", shortName: "Fette", type: "press", region: "EMEA" },
  { name: "Korsch", shortName: "Korsch", type: "press", region: "EMEA" },
  { name: "IMA Kilian", shortName: "IMA", type: "press", region: "EMEA" },
  { name: "Syntegon", shortName: "Syntegon", type: "press", region: "EMEA" },
  { name: "Romaco Kilian", shortName: "Romaco", type: "press", region: "EMEA" },
  { name: "Sejong Pharmatech", shortName: "Sejong", type: "press", region: "APAC" },
  { name: "Cadmach", shortName: "Cadmach", type: "press", region: "APAC" },
  { name: "ACG", shortName: "ACG", type: "tooling", region: "APAC" },
  { name: "Elizabeth", shortName: "Elizabeth", type: "tooling", region: "Americas" },
  { name: "I Holland", shortName: "I Holland", type: "tooling", region: "EMEA" }
];

export function detectCompetitors(text) {
  const lower = text.toLowerCase();
  return competitors.filter(c => 
    lower.includes(c.name.toLowerCase()) || 
    lower.includes(c.shortName.toLowerCase())
  );
}

export function getCompetitorGravity(detectedCompetitors) {
  const gravity = { EMEA: 0, APAC: 0, Americas: 0 };
  detectedCompetitors.forEach(c => {
    gravity[c.region] = (gravity[c.region] || 0) + 1;
  });
  return gravity;
}
