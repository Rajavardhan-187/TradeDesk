# 🤖 AI Setup Guide

TradeDesk uses Groq's `llama-3.3-70b-versatile` model for trade analysis.

---

## How It Works — 3-Tier Routing

```
Request to /api/ai-proxy
        │
        ├─ body.userKey present?  ──YES──→ Use user's own Groq key
        │                                  (higher rate limit, not stored)
        │
        ├─ body.userKey absent?   ──YES──→ Use GROQ_API_KEY env var
        │                                  (platform key, free for all users)
        │
        └─ Neither key available? ──────→ 503 error
```

On `localhost`, the app calls Groq **directly** (no proxy) using the key saved in Settings.

---

## Setting Up the Platform Key

The platform key powers free AI for **all users** of your deployment.

### Step 1 — Create a Groq key
1. Go to [console.groq.com](https://console.groq.com)
2. Sign in → **API Keys** → **+ Create API Key**
3. Name it `TradeDesk-Platform`
4. Copy the key: `gsk_xxxxxxxxxxxxxxxxxxxxxxxx`

> **No model selection needed.** The key grants access to all Groq models. The model is configured in code.

### Step 2 — Add to Netlify
1. [app.netlify.com/projects/tradedesk-analytics](https://app.netlify.com/projects/tradedesk-analytics)
2. **Site configuration → Environment variables**
3. Find `GROQ_API_KEY` → Edit → paste key → Save
4. **Deploys → Trigger deploy → Deploy site**

---

## Rate Limits

| Tier | Limit | Notes |
|---|---|---|
| Free (console.groq.com) | 30 req/min, 6,000 req/day | Enough for most users |
| Paid | Higher limits | Users can add own key |

When the platform key hits rate limits, the proxy returns a friendly message:
> "Platform AI rate limit reached. Add your own Groq key in Settings for unlimited usage."

---

## Users Adding Their Own Key

Users can paste their own Groq key at **Settings → Your Groq API Key**.

- Key is stored **only in their browser's `localStorage`**
- Passed to the proxy per-request in the request body
- **Never stored** in Supabase or any server
- They can remove it anytime → reverts to platform AI

---

## Proxy Source

The serverless function lives at `netlify/functions/ai-proxy.js`.

It:
1. Accepts POST requests at `/api/ai-proxy`
2. Selects the correct Groq key (user's or platform's)
3. Forwards the request to `api.groq.com`
4. Returns the response — your GROQ_API_KEY never touches the browser

---

## Changing the Model

Edit `netlify/functions/ai-proxy.js`, line:
```js
model: model || "llama-3.3-70b-versatile",
```

Available Groq models: [console.groq.com/docs/models](https://console.groq.com/docs/models)
