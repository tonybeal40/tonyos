import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static("public"));

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
const gemini = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

function requireKeys(provider) {
  if (provider === "openai" && !openai) throw new Error("Missing OPENAI_API_KEY");
  if (provider === "claude" && !anthropic) throw new Error("Missing ANTHROPIC_API_KEY");
  if (provider === "gemini" && !gemini) throw new Error("Missing GEMINI_API_KEY");
}

function normalizeMessages(messages = []) {
  return messages
    .filter(m => m && m.role && typeof m.content === "string")
    .map(m => ({ role: m.role, content: m.content }));
}

app.post("/api/chat", async (req, res) => {
  try {
    const { provider, model, messages, truthMode } = req.body || {};
    const msgs = normalizeMessages(messages);

    if (!provider) return res.status(400).json({ error: "provider required" });
    requireKeys(provider);

    if (truthMode && provider !== "openai") {
      return res.status(400).json({ error: "truthMode currently supported only with provider=openai (web_search citations)" });
    }

    if (provider === "openai") {
      const chosen = model || "gpt-4o";

      const resp = await openai.chat.completions.create({
        model: chosen,
        messages: msgs
      });

      const text = resp.choices?.[0]?.message?.content || "";
      return res.json({ text, citations: [] });
    }

    if (provider === "claude") {
      const chosen = model || "claude-3-5-sonnet-20241022";
      const system = msgs.find(m => m.role === "system")?.content || "";
      const nonSystem = msgs.filter(m => m.role !== "system").map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content
      }));

      const resp = await anthropic.messages.create({
        model: chosen,
        max_tokens: 4096,
        system: system || undefined,
        messages: nonSystem
      });

      const text = resp?.content?.map(x => x.text).join("") || "";
      return res.json({ text, citations: [] });
    }

    if (provider === "gemini") {
      const chosen = model || "gemini-1.5-flash";
      const prompt = msgs.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");

      const resp = await gemini.models.generateContent({
        model: chosen,
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      });

      const text = resp?.text || "";
      return res.json({ text, citations: [] });
    }

    return res.status(400).json({ error: "Unknown provider" });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
});

function dedupeCitations(arr) {
  const seen = new Set();
  const out = [];
  for (const c of arr) {
    const key = c.url;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out.slice(0, 8);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`SmartBrain running on http://0.0.0.0:${PORT}`));
