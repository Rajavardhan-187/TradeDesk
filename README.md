# 📊 TradeDesk — F&O Analytics Platform

> Professional trading analytics for Indian F&O and equity traders. Built with React 18, Supabase, and Groq AI.

[![Netlify Status](https://api.netlify.com/api/v1/badges/0373962c-9941-45d6-b9e1-6bbacd7eb440/deploy-status)](https://app.netlify.com/projects/tradedesk-analytics/deploys)
![Version](https://img.shields.io/badge/version-17.0.0-6366f1)
![License](https://img.shields.io/badge/license-MIT-green)
![Stack](https://img.shields.io/badge/stack-React%20%7C%20Supabase%20%7C%20Netlify-blue)

---

## ✨ Features

| Feature | Description |
|---|---|
| 📥 **Broker Import** | Parse Groww & Zerodha F&O/equity Excel reports automatically |
| 📈 **Dashboard** | Real-time P&L, win rate, capital, equity curve, sector breakdown |
| 🤖 **AI Analysis** | Groq-powered trade coaching (Llama 3.3 70B) — free for all users |
| 🔑 **3-Tier AI** | Platform key (free) → User's own key (unlimited) → Local dev |
| 📅 **Calendar** | Monthly P&L calendar heatmap |
| 🗺️ **Sector Heatmap** | Capital allocation and performance by sector |
| ⚖️ **Kelly Criterion** | Position sizing calculator with half-Kelly recommendations |
| 📓 **Journal** | Per-trade notes, mood tags, company-level insights |
| 🏷️ **Strategy Tags** | Tag trades with strategies and see radar analysis |
| 🔐 **Auth** | Supabase email + Google OAuth, data syncs across devices |
| 📱 **PWA Ready** | Add to home screen on any mobile device |

---

## 🏗️ Tech Stack

```
Frontend     React 18 + Vite
Styling      CSS-in-JS (single file, no build step for styles)
Charts       Recharts
Data parse   SheetJS (xlsx)
Auth & DB    Supabase (PostgreSQL + Auth)
AI           Groq API (llama-3.3-70b-versatile) via Netlify Function
Hosting      Netlify (free tier)
Fonts        Plus Jakarta Sans + Outfit + IBM Plex Mono
```

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Node.js 18+
- A Groq API key → [console.groq.com](https://console.groq.com) (free)

### 1. Clone & install
```bash
git clone https://github.com/YOUR_USERNAME/TradeDesk.git
cd TradeDesk
npm install
```

### 2. Set up environment
```bash
cp .env.example .env.local
# Fill in your values — see .env.example for details
```

### 3. Run dev server
```bash
npm run dev
# → http://localhost:5173
```

On `localhost` the app calls Groq **directly** with your key from Settings.  
In production it routes through the secure Netlify proxy.

---

## ⚙️ Environment Variables

| Variable | Where | Description |
|---|---|---|
| `GROQ_API_KEY` | Netlify env vars | **Your Groq key** — powers free AI for all users |
| `VITE_SUPABASE_URL` | Netlify env vars | Supabase project URL (public) |
| `VITE_SUPABASE_ANON_KEY` | Netlify env vars | Supabase anon key (public) |

> **Never** commit `.env` files. Supabase keys in `index.html` are safe — they are public anon keys protected by Row Level Security.

---

## 🔑 Adding Your Groq API Key (Platform AI)

This is what powers free AI analysis for **all** users of your deployment.

1. Go to **[console.groq.com](https://console.groq.com)** → Sign in
2. Left sidebar → **API Keys** → **Create API Key**
3. Name: `TradeDesk-Platform` → Create → copy `gsk_...`
4. Go to **[app.netlify.com/projects/tradedesk-analytics](https://app.netlify.com/projects/tradedesk-analytics)**
5. **Site configuration → Environment variables**
6. Find `GROQ_API_KEY` → **Edit** → paste your key → **Save**
7. **Trigger redeploy** → Deploys → Trigger deploy → Deploy site

> No model selection needed when creating the key. The model (`llama-3.3-70b-versatile`) is set in `netlify/functions/ai-proxy.js`.

---

## 🤖 AI Routing (3 Tiers)

```
User visits TradeDesk
       │
       ├─ No Groq key saved?
       │     └─→ Platform AI (your GROQ_API_KEY on Netlify) ← FREE for all
       │
       ├─ User added own key in Settings?
       │     └─→ Their key passed per-request (never stored server-side)
       │
       └─ localhost?
             └─→ Direct Groq call with dev key
```

Users can add their own key in **Settings → Your Groq API Key** for unlimited usage.

---

## 🗄️ Database Schema (Supabase)

```sql
profiles        — user plan, name, email (linked to auth.users)
trade_imports   — user's parsed trades (JSONB array) + charges
user_settings   — tags, notes, preferences (JSONB)
```

All tables have **Row Level Security (RLS)** enabled. Users can only read/write their own rows.

---

## 📁 Project Structure

```
TradeDesk/
├── src/
│   ├── App.jsx              # Entire app — 3700+ lines, single component file
│   └── main.jsx             # React entry point
├── netlify/
│   └── functions/
│       └── ai-proxy.js      # Serverless function — Groq API proxy
├── index.html               # Supabase init + font imports
├── package.json
├── vite.config.js
├── netlify.toml             # Build config + redirects
├── .env.example             # Template for local dev
└── docs/
    ├── DEPLOYMENT.md        # Full deploy guide
    ├── SUPABASE_SETUP.md    # Database setup steps
    └── AI_SETUP.md          # Groq key setup
```

---

## 🚢 Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full step-by-step guide.

**TL;DR:**
1. Push this repo to GitHub
2. Connect repo to Netlify site `tradedesk-analytics`
3. Add `GROQ_API_KEY` to Netlify env vars
4. Deploy → live at `https://tradedesk-analytics.netlify.app`

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 License

MIT © 2025 TradeDesk
