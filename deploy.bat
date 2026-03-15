@echo off
:: TradeDesk - Windows Deploy Script (Fixed)
:: Run from Command Prompt inside the TradeDesk\ folder

echo ============================================
echo   TradeDesk - GitHub + Netlify Deploy
echo ============================================
echo.

echo [1/5] Setting up Git identity...
git config --global user.email "190030187cse@gmail.com"
git config --global user.name "RAJAVARDHAN BOLLAM"
echo Git identity set.
echo.

echo [2/5] Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (echo ERROR: npm install failed && pause && exit /b 1)
echo Done.
echo.

echo [3/5] Setting up Git repository...
if exist ".git" rmdir /s /q .git
git init
git add .
git commit -m "feat: TradeDesk v17 - React + Supabase + Groq AI"
if %ERRORLEVEL% neq 0 (echo ERROR: git commit failed && pause && exit /b 1)
git branch -M main
echo Git repo ready.
echo.

echo [4/5] Pushing to GitHub...
gh auth status 2>nul || gh auth login --web
gh repo create TradeDesk --public --description "Professional F/O analytics for Indian traders" --push --source=. --remote=origin
if %ERRORLEVEL% neq 0 (echo ERROR: GitHub push failed && pause && exit /b 1)
echo Pushed to GitHub.
echo.

echo [5/5] Deploying to Netlify...
npx -y @netlify/mcp@latest --site-id 0373962c-9941-45d6-b9e1-6bbacd7eb440 --proxy-path "https://netlify-mcp.netlify.app/proxy/eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..iTGyDKM7gKorOzN3.IKyv5f3VbExVJZBZZm4-jj4uOI-pmO_a_m6uBezyzoWIwqleRKng1GtFVu0VY4SNWVHCEqRhsQCIU_uv4isDjLhuVnd2nJ2aa0tj4927USRoqCWUoLgzb-Eh-VAUzbBVuA99i0eb396PhSbH3ZZY40LiyaTlQGnL67B07Tax2wWgjWl6uvsXT6cRNcmBCa8DxdxnuZE1GG28g_UduIicMHCkRWDV4VgQXuEOqGSRAR5323JgN-ioiG6dVgyE8ei1q_hDyyHIjxULZzAZu7gjJdplGknjgKuX0A4t2AoccaXwFY5_EjPWouhOHVCBmkdfMRzIGaHgXVCYKB8uy4nrootgZcOsdXQoNOqHrL7PfYoRl1Kw3g.iGqvLm339jArJ4LDBC5Z_w"

echo.
echo ============================================
echo   DONE!
echo ============================================
echo   Live: https://tradedesk-analytics.netlify.app
echo   GitHub: https://github.com/190030187cse/TradeDesk
echo.
echo   ADD GROQ KEY to enable AI:
echo   1. console.groq.com - API Keys - Create
echo   2. app.netlify.com/projects/tradedesk-analytics
echo      Site config - Env vars - GROQ_API_KEY - paste key - Save
echo   3. Deploys - Trigger deploy
echo.
pause
