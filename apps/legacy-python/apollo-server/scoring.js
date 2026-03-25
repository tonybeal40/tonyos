import { TOP_PERSONAS } from "./personas.js";

export function scorePersonas(people) {
  let score = 0;
  const matched = [];
  const byCategory = {
    "MS&T": [],
    "R&D": [],
    "Engineering": [],
    "Quality": [],
    "Operations": []
  };

  for (const person of people) {
    const title = (person.title || "").toLowerCase();
    
    for (const [personaTitle, weight] of Object.entries(TOP_PERSONAS)) {
      if (title.includes(personaTitle.toLowerCase()) || 
          personaTitle.toLowerCase().split(" ").every(word => title.includes(word))) {
        score += weight;
        matched.push({
          name: person.name,
          title: person.title,
          linkedin: person.linkedin_url,
          weight
        });
        
        if (title.includes("ms&t") || title.includes("manufacturing science") || title.includes("tech transfer")) {
          byCategory["MS&T"].push(person.name);
        } else if (title.includes("r&d") || title.includes("formulation") || title.includes("development")) {
          byCategory["R&D"].push(person.name);
        } else if (title.includes("engineering") || title.includes("tooling")) {
          byCategory["Engineering"].push(person.name);
        } else if (title.includes("quality") || title.includes("validation")) {
          byCategory["Quality"].push(person.name);
        } else if (title.includes("manufacturing") || title.includes("operations") || title.includes("production")) {
          byCategory["Operations"].push(person.name);
        }
        
        break;
      }
    }
  }

  return { score, matched, byCategory };
}

export function assignTier(score, isPrimary = true, hasCompaction = true) {
  if (!isPrimary) {
    return { tier: "Disqualified", reason: "Not in a primary Natoli market" };
  }

  if (!hasCompaction) {
    return { tier: "Disqualified", reason: "Compaction not critical to operations" };
  }

  if (score >= 10) {
    return { tier: "A", reason: "High-value account with strong persona match" };
  }
  
  if (score >= 6) {
    return { tier: "B", reason: "Good fit with key decision makers identified" };
  }
  
  if (score >= 1) {
    return { tier: "C", reason: "Potential fit - needs deeper persona research" };
  }

  return { tier: "C", reason: "No persona match found - manual review recommended" };
}
