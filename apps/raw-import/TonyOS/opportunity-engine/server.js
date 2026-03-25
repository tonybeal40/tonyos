import express from "express";
import cors from "cors";
import { batchScan, summarizeBatch, getDivisionSummary } from "./batchScanner.js";
import { routeDivision, scientificKeywords, engineeringKeywords } from "./divisionRouter.js";
import { mapPressure } from "./pressureMapper.js";
import { detectCompetitors, getCompetitorGravity, competitors } from "./competitorIntel.js";
import { taxonomy, classifyTaxonomy } from "./taxonomy.js";
import { keywords, pressureKeywords } from "./keywords.js";

const app = express();
const PORT = process.env.OPP_ENGINE_PORT || 3003;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static("public"));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "TonyOS Opportunity Engine", version: "1.0.0" });
});

app.get("/api/taxonomy", (req, res) => {
  res.json({ taxonomy });
});

app.get("/api/keywords", (req, res) => {
  res.json({ keywords, pressureKeywords });
});

app.get("/api/competitors", (req, res) => {
  res.json({ competitors });
});

app.get("/api/divisions", (req, res) => {
  res.json({ 
    scientific: scientificKeywords,
    engineering: engineeringKeywords,
    description: {
      scientific: "Natoli Scientific - Formulation, R&D, scale-up, process development",
      engineering: "Natoli Engineering - Tooling, press maintenance, equipment"
    }
  });
});

app.post("/api/scan/single", async (req, res) => {
  try {
    const { name, description, website, region, useAI = false } = req.body;
    
    if (!description) {
      return res.status(400).json({ error: "Description is required" });
    }
    
    const results = await batchScan([{ name, description, website, region }], useAI);
    res.json(results[0]);
  } catch (error) {
    console.error("Single scan error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/scan/batch", async (req, res) => {
  try {
    const { companies, useAI = false } = req.body;
    
    if (!companies || !Array.isArray(companies)) {
      return res.status(400).json({ error: "Companies array is required" });
    }
    
    const results = await batchScan(companies, useAI);
    const summary = summarizeBatch(results);
    const divisionSummary = getDivisionSummary(results);
    
    res.json({ results, summary, divisionSummary });
  } catch (error) {
    console.error("Batch scan error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/analyze/quick", (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    
    const pressure = mapPressure(text);
    const competitors = detectCompetitors(text);
    const gravity = getCompetitorGravity(competitors);
    const taxonomyMatch = classifyTaxonomy(text);
    const division = routeDivision(text);
    
    res.json({
      pressure,
      competitors: competitors.map(c => c.name),
      competitorGravity: gravity,
      taxonomy: taxonomyMatch,
      division
    });
  } catch (error) {
    console.error("Quick analyze error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TonyOS Opportunity Engine running on port ${PORT}`);
});
