import { keywords, pressureKeywords, silenceSignals } from "./keywords.js";

export function mapPressure(text) {
  const lower = text.toLowerCase();
  
  const detected = keywords.filter(k => lower.includes(k.toLowerCase()));
  const pressure = pressureKeywords.filter(k => lower.includes(k.toLowerCase()));
  const silence = silenceSignals.filter(s => lower.includes(s.toLowerCase()));
  
  const score = detected.length + (pressure.length * 2) + (silence.length * 0.5);
  
  let tier;
  if (score >= 8) tier = 1;
  else if (score >= 4) tier = 2;
  else tier = 3;
  
  return {
    keywords: detected,
    pressureSignals: pressure,
    silenceSignals: silence,
    score,
    tier
  };
}

export function getPressureSummary(pressureData) {
  const { keywords, pressureSignals, tier } = pressureData;
  
  if (tier === 1) {
    return `HIGH PRIORITY: ${keywords.length} capability signals, ${pressureSignals.length} pressure indicators detected`;
  } else if (tier === 2) {
    return `MEDIUM PRIORITY: ${keywords.length} signals detected, worth exploring`;
  }
  return `LOW PRIORITY: Limited signals, monitor for changes`;
}
