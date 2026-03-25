# Natoli Message Generator - Netlify Deployment

## Quick Setup (3 Steps)

### 1. Deploy to Netlify

Option A: Drag & drop this entire folder to Netlify
Option B: Push to GitHub and connect to Netlify

### 2. Add Your API Key

In Netlify dashboard:
1. Go to **Site settings > Environment variables**
2. Click **Add a variable**
3. Key: `OPENAI_API_KEY`
4. Value: Your OpenAI API key (sk-...)
5. Click **Save**

### 3. Redeploy

Trigger a redeploy for the environment variable to take effect.

---

## File Structure

```
netlify-message-generator/
├── netlify.toml           # Netlify config
├── netlify/
│   └── functions/
│       └── generate-message.js   # Serverless function (calls OpenAI)
├── public/
│   └── index.html         # Frontend
└── README.md
```

---

## How It Works

1. User fills out company info in the frontend
2. Frontend calls `/.netlify/functions/generate-message`
3. Serverless function reads `OPENAI_API_KEY` from environment
4. Function calls OpenAI API and returns the message
5. API key stays secure on the server - never exposed to browser

---

## Security

- API key is stored as an environment variable in Netlify
- Never exposed in browser or source code
- Only accessible by the serverless function

---

## Cost

- OpenAI: ~$0.0001 per message (gpt-4o-mini)
- Netlify Functions: Free tier = 125k requests/month
