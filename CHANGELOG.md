# Changelog

All notable changes to TradeDesk are documented here.

---

## [17.0.0] — 2025-03-15

### Added
- Complete UI redesign — Midnight Indigo design system
- 3-tier AI routing: platform key → user key → local dev
- Supabase auth activated (email + Google OAuth)
- Local data sync to Supabase on first login
- Show/hide Groq key toggle in Settings
- Live badge in topbar when real data loaded
- Scrolling ticker bar with 8 instruments
- `LabelList` custom renderer for P&L chart (fixes white tooltip boxes)
- `wrapperStyle` fix on all Recharts tooltips (removes white background)
- Professional GitHub repo structure with full docs

### Changed
- Fonts: Plus Jakarta Sans + Outfit + IBM Plex Mono
- Primary accent: Electric Indigo `#6366f1`
- KPI cards: monospace numbers with glow orb
- Sidebar: icon logo mark with glow, pnl-pill card
- Settings page: 3-panel tier selector for AI mode
- AI Modal header: shows active tier badge (Platform / Your Key / Local)

### Fixed
- P&L by Stock chart hover white block (Recharts label white rect)
- All chart tooltips white background (missing `wrapperStyle`)
- Stray `);` syntax error after G() CSS block
- `var(--b06eff)` invalid CSS variable reference

---

## [16.0.0] — 2025-03-14

### Added
- Purple accent redesign (`#7c3aed`)
- Bebas Neue logo font
- Auto-scrolling ticker

---

## [15.0.0] — 2025-03-13

### Added
- Space Grotesk + Syne font system
- Teal accent `#00f5c4`
- Live badge, pnl-pill sidebar card

---

## [14.0.0] — 2025-03-12

### Added
- Initial Supabase schema deployment
- Auth page (login/signup/Google/reset)
- F&O parser for Groww reports
- AI chat (Groq via Netlify proxy)
- Strategy tags, journal, Kelly calculator
