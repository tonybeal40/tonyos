import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { getUserInfo, login, callback, logout, isAuthenticated } from "./replitAuth.js";

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "2mb" }));

const PgStore = connectPgSimple(session);
app.use(session({
  store: new PgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT === "1",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

app.use(express.static("public"));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/auth/user", getUserInfo);
app.get("/api/login", login);
app.get("/api/callback", callback);
app.get("/api/logout", logout);

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

const anthropic = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY
  ? new Anthropic({ 
      apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL
    })
  : null;

const gemini = process.env.AI_INTEGRATIONS_GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY })
  : null;

console.log("[codebench] Providers:", {
  openai: !!openai,
  anthropic: !!anthropic,
  gemini: !!gemini
});

const AVAILABLE_MODELS = {
  openai: {
    "gpt-4o": "GPT-4o (Best)",
    "gpt-4o-mini": "GPT-4o Mini (Fast)",
    "gpt-4-turbo": "GPT-4 Turbo"
  },
  claude: {
    "claude-sonnet-4-5-20250514": "Claude Sonnet 4.5 (Best)",
    "claude-haiku-4-5-20250514": "Claude Haiku 4.5 (Fast)",
    "claude-opus-4-1-20250416": "Claude Opus 4.1"
  },
  gemini: {
    "gemini-2.5-flash": "Gemini 2.5 Flash (Fast)",
    "gemini-2.5-pro": "Gemini 2.5 Pro (Best)",
    "gemini-3-pro-preview": "Gemini 3 Pro Preview"
  }
};

app.get("/api/models", (_req, res) => {
  const available = {};
  if (openai) available.openai = AVAILABLE_MODELS.openai;
  if (anthropic) available.claude = AVAILABLE_MODELS.claude;
  if (gemini) available.gemini = AVAILABLE_MODELS.gemini;
  res.json({ models: available });
});

function safeJsonParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, value: null };
  }
}

const SYSTEM_INSTRUCTIONS = `
You are Codebench AI, a code generation assistant. You must return ONLY valid JSON with this schema:
{
  "html": "string",
  "css": "string",
  "js": "string",
  "notes": "string"
}

Rules:
- No markdown, no backticks, no extra keys.
- Keep code runnable in a browser.
- Do not include any API keys.
- If mode is "debug", focus on fixing errors and making it run.
- If mode is "improve", improve clarity, UI, and reliability without breaking behavior.
- If mode is "build", create what the user asked for from scratch.
- If mode is "explain", provide a detailed explanation in the notes field.
`;

function buildUserPrompt(prompt, mode, html, css, js) {
  return `
Mode: ${mode}

User request:
${prompt}

Current HTML:
${html}

Current CSS:
${css}

Current JS:
${js}
`;
}

async function callOpenAI(model, systemPrompt, userPrompt) {
  const response = await openai.chat.completions.create({
    model: model || "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 4000
  });
  return response.choices[0]?.message?.content || "";
}

async function callClaude(model, systemPrompt, userPrompt) {
  const response = await anthropic.messages.create({
    model: model || "claude-sonnet-4-5-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }]
  });
  return response.content?.map(c => c.text).join("") || "";
}

async function callGemini(model, systemPrompt, userPrompt) {
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
  const response = await gemini.models.generateContent({
    model: model || "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }]
  });
  return response?.response?.text() || response?.text || "";
}

app.post("/api/ai", async (req, res) => {
  try {
    const { 
      prompt = "", 
      html = "", 
      css = "", 
      js = "", 
      mode = "improve",
      provider = "openai",
      model
    } = req.body || {};

    if (!prompt.trim()) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const userPrompt = buildUserPrompt(prompt, mode, html, css, js);
    let text = "";

    console.log(`[ai] Provider: ${provider}, Model: ${model || "default"}, Mode: ${mode}`);

    if (provider === "openai") {
      if (!openai) {
        return res.status(500).json({
          error: "OpenAI not configured",
          fix: "Add OPENAI_API_KEY in Replit Secrets."
        });
      }
      text = await callOpenAI(model, SYSTEM_INSTRUCTIONS, userPrompt);
    } else if (provider === "claude") {
      if (!anthropic) {
        return res.status(500).json({
          error: "Claude not configured",
          fix: "Set up Anthropic AI Integration in Replit."
        });
      }
      text = await callClaude(model, SYSTEM_INSTRUCTIONS, userPrompt);
    } else if (provider === "gemini") {
      if (!gemini) {
        return res.status(500).json({
          error: "Gemini not configured",
          fix: "Set up Gemini AI Integration in Replit."
        });
      }
      text = await callGemini(model, SYSTEM_INSTRUCTIONS, userPrompt);
    } else {
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = safeJsonParse(cleanText);

    if (!parsed.ok) {
      return res.status(502).json({
        error: "Model did not return valid JSON",
        raw: text.slice(0, 4000)
      });
    }

    return res.json({ ok: true, provider, model: model || "default", ...parsed.value });
  } catch (e) {
    console.error("[ai] Error:", e);
    return res.status(500).json({
      error: "Server error",
      detail: String(e?.message || e)
    });
  }
});

const PORT = process.env.CODEBENCH_PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Codebench running on port ${PORT}`));
