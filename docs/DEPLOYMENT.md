# 🚢 Deployment Guide

Full step-by-step guide to deploy TradeDesk on Netlify with Supabase as the backend.

---

## Prerequisites

- [x] GitHub account
- [x] Netlify account (free) → [netlify.com](https://netlify.com)
- [x] Supabase project created → [supabase.com](https://supabase.com)
- [x] Groq API key → [console.groq.com](https://console.groq.com) (free)

---

## Step 1 — Fork / Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/TradeDesk.git
cd TradeDesk
```

---

## Step 2 — Connect Repo to Netlify

The Netlify site `tradedesk-analytics` is already created.

1. Go to **[app.netlify.com/projects/tradedesk-analytics](https://app.netlify.com/projects/tradedesk-analytics)**
2. **Site configuration → Build & deploy → Continuous deployment**
3. Click **Link repository** → GitHub → select `TradeDesk`
4. Build settings (auto-detected from `netlify.toml`):
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

---

## Step 3 — Add Environment Variables

Go to **Site configuration → Environment variables** and add:

| Key | Value | Notes |
|---|---|---|
| `GROQ_API_KEY` | `gsk_xxxx...` | Your Groq key — platform AI for all users |
| `VITE_SUPABASE_URL` | `https://xqpqclqhhwxbmbiwphtl.supabase.co` | Already set |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Already set |

> `GROQ_API_KEY` is the only one you need to add manually.

---

## Step 4 — Get Your Groq API Key

1. Go to **[console.groq.com](https://console.groq.com)**
2. Sign in (Google works)
3. Left sidebar → **API Keys** → **Create API Key**
4. Name: `TradeDesk-Platform`
5. Click Create → copy the key (`gsk_...`)
6. Paste into Netlify env var `GROQ_API_KEY`

> **Model selection**: You do NOT pick a model when creating the key. The model is set in code as `llama-3.3-70b-versatile`. The free tier allows 30 requests/minute.

---

## Step 5 — Deploy

1. In Netlify → **Deploys** tab → **Trigger deploy** → **Deploy site**
2. Watch the build log — takes ~60 seconds
3. Visit `https://tradedesk-analytics.netlify.app` ✅

---

## Step 6 — Configure Supabase Auth (Google OAuth)

For Google login to work in production:

1. Go to **[supabase.com/dashboard/project/xqpqclqhhwxbmbiwphtl/auth/providers](https://supabase.com/dashboard/project/xqpqclqhhwxbmbiwphtl/auth/providers)**
2. Enable **Google** provider
3. Add your Google OAuth credentials (from Google Cloud Console)
4. Add `https://tradedesk-analytics.netlify.app` to **Redirect URLs** in Supabase Auth settings

---

## Redeploying After Code Changes

```bash
git add .
git commit -m "feat: your change description"
git push origin main
# Netlify auto-deploys on every push to main
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| AI not working | Check `GROQ_API_KEY` is set in Netlify env vars, trigger redeploy |
| Auth not working | Check Supabase redirect URLs include your Netlify domain |
| Build fails | Check Node 20 is set, run `npm install` locally first |
| CORS errors | Ensure Supabase project URL matches what's in `index.html` |
