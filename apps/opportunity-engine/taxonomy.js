export const taxonomy = [
  "pharmaceutical solid dose",
  "nutraceutical tablets",
  "veterinary compaction",
  "cannabis tablets",
  "industrial powder compaction",
  "ceramic pressing",
  "catalyst compacts",
  "battery powder compression",
  "pressed consumer goods",
  "pool water treatment",
  "cleaning tablets",
  "agricultural pellets",
  "cosmetics pressed powders",
  "nuclear fuel pellets",
  "rare earth magnets",
  "ammunition propellants"
];

export function classifyTaxonomy(text) {
  const lower = text.toLowerCase();
  return taxonomy.filter(t => {
    const words = t.split(' ');
    return words.some(w => lower.includes(w));
  });
}
