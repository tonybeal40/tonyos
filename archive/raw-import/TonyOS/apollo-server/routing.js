import { INDUSTRIES, PRIMARY_NAICS, detectIndustry } from "./industries.js";

export function routeNatoli(company) {
  const naics = company.naics_codes || [];
  const detected = detectIndustry(company);
  
  let eng = false;
  let sci = false;
  let isPrimary = false;

  if (naics.some(code => PRIMARY_NAICS.includes(code))) {
    isPrimary = true;
  }

  if (detected) {
    isPrimary = true;
    if (detected.division.includes("engineering")) eng = true;
    if (detected.division.includes("scientific")) sci = true;
  }

  for (const config of Object.values(INDUSTRIES)) {
    if (config.naics.some(code => naics.includes(code))) {
      if (config.division.includes("engineering")) eng = true;
      if (config.division.includes("scientific")) sci = true;
    }
  }

  let division;
  if (eng && sci) {
    division = "Both";
  } else if (eng) {
    division = "Natoli Engineering";
  } else if (sci) {
    division = "Natoli Scientific";
  } else {
    division = "Unqualified";
  }

  return {
    division,
    isPrimary,
    detectedIndustry: detected?.name || null
  };
}

export function isQualified(routingResult) {
  return routingResult.isPrimary && routingResult.division !== "Unqualified";
}
