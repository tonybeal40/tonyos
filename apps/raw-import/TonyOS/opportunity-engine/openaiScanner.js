import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function scanPressure(text, companyName = "Unknown") {
  const systemPrompt = `You are TonyOS Universal Manufacturing Scanner, specialized in tablet compression and powder compaction intelligence.

Analyze the company description and detect:
- Compression/tablet manufacturing relevance (0-100)
- Scaling pressure signals (expansion, growth, capacity issues)
- Tooling risk indicators (wear, maintenance, upgrade needs)
- Regulatory pressure (FDA, GMP, compliance mentions)
- Competitor gravity (existing equipment relationships)
- Silence signals (lack of recent activity, going dark)
- Opportunity classification (new equipment, tooling, services, training)

Return ONLY valid JSON:
{
  "compression_score": 0-100,
  "relevant": true/false,
  "pressure_signals": ["list of detected pressures"],
  "risk_indicators": ["list of risks"],
  "competitors_mentioned": ["list"],
  "opportunity_type": "equipment|tooling|services|training|none",
  "tier": 1|2|3,
  "decision": "brief recommendation",
  "next_action": "suggested next step"
}`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Company: ${companyName}\n\nDescription:\n${text}` }
      ],
      temperature: 0,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI scan error:", error.message);
    return {
      compression_score: 0,
      relevant: false,
      pressure_signals: [],
      risk_indicators: [],
      competitors_mentioned: [],
      opportunity_type: "none",
      tier: 3,
      decision: "Scan failed - manual review needed",
      next_action: "Retry scan or review manually",
      error: error.message
    };
  }
}
