#!/bin/bash
# TradeDesk — Full Setup Script
# Run this once from inside the TradeDesk/ folder on your machine.
# It will: init git, push to GitHub, and deploy to Netlify.

set -e  # exit on any error

echo "============================================"
echo "  TradeDesk — GitHub + Netlify Setup"
echo "============================================"
echo ""

# ── Step 1: Install dependencies ────────────────
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# ── Step 2: Git init ─────────────────────────────
echo "🔧 Initialising Git..."
git init
git add .
git commit -m "feat: TradeDesk v17 — initial commit

- React 18 + Vite + Recharts
- Supabase auth (email + Google OAuth)
- Groq AI analysis via Netlify serverless proxy (3-tier routing)
- F&O + equity parser (Groww / Zerodha)
- Dashboard, Journal, Kelly, Strategy Tags, Calendar
- Full dark UI with Plus Jakarta Sans + Outfit + IBM Plex Mono"
git branch -M main
echo "✅ Git repo initialised"
echo ""

# ── Step 3: Create GitHub repo & push ────────────
echo "🐙 Creating GitHub repo 'TradeDesk'..."
echo "   (requires: gh auth login  — run 'gh auth login' first if not done)"
gh repo create TradeDesk --public --description "Professional F&O analytics for Indian traders — React + Supabase + Groq AI" --push --source=. --remote=origin
echo "✅ Code pushed to GitHub"
echo ""

# ── Step 4: Deploy to Netlify ────────────────────
echo "🚀 Deploying to Netlify site: tradedesk-analytics..."
npx -y @netlify/mcp@latest \
  --site-id 0373962c-9941-45d6-b9e1-6bbacd7eb440 \
  --proxy-path "https://netlify-mcp.netlify.app/proxy/eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..SmSBlNGpcFkz_TjC.ZMsUG32A8SML1qXqmkoNxNYJ-x-d81BzipOv1cpEF6F0Au107qx1saeeg7HXvueAfmjH7btRyG_Fzsb3crQyySN76YLvz_JGAKEHlJ2vJW62uoNlmNVTHOQKipVDLlbMCehgHzfq02J6NoFGjv2gbJYVJVi1TVkigjMV0ef5NyPeAI6btAZRrEmBRdxzDvcrGA82Jet7_uuPxcdoKRah25TNvVCRr7xb3AENLnbwyOPjvCTxx8mEqb8OXE7hQf1m7B6E_4iYB8dPnuHeiUkqzfeHM2c23gaLNdAd253rcXMAIabDSouUAhbHdjhYg9N04-ET67jaMAY7V69Io4uSgh9rUY2aQOvlFFwnlDi95OrJvgOoBg.Cuz12v-p_hRCfkp8-dQGzQ"
echo ""
echo "============================================"
echo "  ✅ ALL DONE!"
echo "============================================"
echo ""
echo "  🌐 Live URL:  https://tradedesk-analytics.netlify.app"
echo "  📊 Netlify:   https://app.netlify.com/projects/tradedesk-analytics"
echo "  🗄️  Supabase:  https://supabase.com/dashboard/project/xqpqclqhhwxbmbiwphtl"
echo ""
echo "  ⚠️  IMPORTANT: Add your Groq API key to enable AI:"
echo "  1. Get key at: https://console.groq.com → API Keys → Create"
echo "  2. Add to Netlify env vars as: GROQ_API_KEY"
echo "  3. Trigger redeploy in Netlify dashboard"
