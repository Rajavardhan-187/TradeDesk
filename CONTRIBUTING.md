# 🤝 Contributing to TradeDesk

Thank you for your interest in contributing!

---

## Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/TradeDesk.git
cd TradeDesk
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

---

## Architecture

TradeDesk is intentionally a **single-file React app** (`src/App.jsx`). This makes it easy to:
- Drop into any Vite project
- Download and self-host without a build system
- Inspect all code in one place

### Key rules when editing `App.jsx`

1. **Single JSX file only** — no imports from `./anything`
2. **No `import.meta`** — use `window.__VARNAME` set in `index.html`
3. **No nested template literals** — use string concatenation instead
4. **No hardcoded API keys** — Groq key is only in Netlify env vars
5. **Formatters** (`safeN`, `fmtC`, `fmtA`) must be declared **before** `processTrades`
6. **Strategy tag modal** must use `position:fixed` + `z-index:9000`
7. **`sendMessage("", true)`** must work — guard is `if(!isInitial && !userText.trim()) return`
8. After every edit: verify no duplicate component declarations

---

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     new feature
fix:      bug fix
style:    UI/CSS changes, no logic change
refactor: code change without feature/fix
docs:     documentation only
chore:    build, deps, config changes
```

Examples:
```bash
git commit -m "feat: add position sizing calculator"
git commit -m "fix: tooltip white background on P&L chart"
git commit -m "style: redesign KPI cards with glow effect"
```

---

## Pull Request Process

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature`
3. Make changes and test locally
4. Run: `npm run build` — ensure it builds without errors
5. Push and open a PR against `main`
6. Describe what changed and why

---

## Reporting Issues

Open a [GitHub Issue](../../issues) with:
- Steps to reproduce
- Expected vs actual behaviour
- Browser + OS info
- Screenshot if UI related
