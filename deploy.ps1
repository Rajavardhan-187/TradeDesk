# TradeDesk - Windows Deploy Script
# Run this from inside the TradeDesk\ folder in PowerShell
# Right-click PowerShell -> Run as Administrator if needed

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  TradeDesk - GitHub + Netlify Deploy" -ForegroundColor Cyan  
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed" -ForegroundColor Red; exit 1 }
Write-Host "Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Git init and commit
Write-Host "Initialising Git..." -ForegroundColor Yellow
git init
git add .
git commit -m "feat: TradeDesk v17 - initial commit - React + Supabase + Groq AI"
git branch -M main
Write-Host "Git repo ready" -ForegroundColor Green
Write-Host ""

# Step 3: Create GitHub repo and push
Write-Host "Creating GitHub repo TradeDesk..." -ForegroundColor Yellow
Write-Host "(If prompted, run: gh auth login  first)" -ForegroundColor DarkYellow
gh repo create TradeDesk --public --description "Professional F&O analytics for Indian traders" --push --source=. --remote=origin
if ($LASTEXITCODE -ne 0) { Write-Host "GitHub push failed - check gh auth login" -ForegroundColor Red; exit 1 }
Write-Host "Pushed to GitHub" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy to Netlify
Write-Host "Deploying to Netlify..." -ForegroundColor Yellow
npx -y "@netlify/mcp@latest" --site-id 0373962c-9941-45d6-b9e1-6bbacd7eb440 --proxy-path "https://netlify-mcp.netlify.app/proxy/eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..iTGyDKM7gKorOzN3.IKyv5f3VbExVJZBZZm4-jj4uOI-pmO_a_m6uBezyzoWIwqleRKng1GtFVu0VY4SNWVHCEqRhsQCIU_uv4isDjLhuVnd2nJ2aa0tj4927USRoqCWUoLgzb-Eh-VAUzbBVuA99i0eb396PhSbH3ZZY40LiyaTlQGnL67B07Tax2wWgjWl6uvsXT6cRNcmBCa8DxdxnuZE1GG28g_UduIicMHCkRWDV4VgQXuEOqGSRAR5323JgN-ioiG6dVgyE8ei1q_hDyyHIjxULZzAZu7gjJdplGknjgKuX0A4t2AoccaXwFY5_EjPWouhOHVCBmkdfMRzIGaHgXVCYKB8uy4nrootgZcOsdXQoNOqHrL7PfYoRl1Kw3g.iGqvLm339jArJ4LDBC5Z_w"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  ALL DONE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Live URL:  https://tradedesk-analytics.netlify.app" -ForegroundColor Cyan
Write-Host "  Netlify:   https://app.netlify.com/projects/tradedesk-analytics" -ForegroundColor Cyan
Write-Host ""
Write-Host "  NEXT: Add your Groq key to Netlify env vars!" -ForegroundColor Yellow
Write-Host "  1. Get key: https://console.groq.com -> API Keys -> Create" -ForegroundColor White
Write-Host "  2. Netlify -> Site config -> Env vars -> GROQ_API_KEY -> paste key" -ForegroundColor White
Write-Host "  3. Netlify -> Deploys -> Trigger deploy -> Deploy site" -ForegroundColor White
