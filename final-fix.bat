@echo off
:: TradeDesk - Final Fix
:: Run from your TradeDesk folder: cd Desktop\TradeDesk && final-fix.bat

echo TradeDesk - Final Fix
echo.

:: Remove node_modules from git completely (this is the root cause)
echo [1/3] Removing node_modules from git tracking...
git rm -r --cached node_modules 2>nul
git rm --cached package-lock.json 2>nul

:: Commit everything with the two fixed files
echo [2/3] Committing fix...
git add -A
git commit -m "fix: remove node_modules from git, use npm ci for clean build"

:: Push
echo [3/3] Pushing to GitHub...
git push origin main

echo.
echo Done! Netlify will auto-redeploy in ~60 seconds.
echo Watch: https://app.netlify.com/projects/tradedesk-analytics/deploys
echo.
pause
