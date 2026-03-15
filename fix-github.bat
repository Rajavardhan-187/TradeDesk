@echo off
:: Run from your TradeDesk folder: cd Desktop\TradeDesk && fix-github.bat

echo Fixing TradeDesk GitHub repo...
echo.

:: Step 1: Remove node_modules from git tracking (it was committed by mistake)
echo [1/3] Removing node_modules from git...
git rm -r --cached node_modules 2>nul
git rm -r --cached package-lock.json 2>nul

:: Step 2: Replace netlify.toml with the fixed version
:: (you should have already placed the new netlify.toml in this folder)
echo [2/3] Committing fixes...
git add -A
git commit -m "fix: remove node_modules from repo, use node ./node_modules/.bin/vite build"

:: Step 3: Push
echo [3/3] Pushing to GitHub...
git push origin main

echo.
echo Done! Netlify will auto-redeploy. Check:
echo https://app.netlify.com/projects/tradedesk-analytics/deploys
echo.
pause
