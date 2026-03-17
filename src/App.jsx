
// ─────────────────────────────────────────────────────────────────
// TradeDesk v17 — Professional F&O + Equity Trading Analytics
// Real Groww/Zerodha parsing · AI (Groq/Claude) · PWA-ready
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
// Supabase: npm install @supabase/supabase-js, then follow PHASE1_SETUP.md
import * as XLSX from "xlsx";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceDot, Legend, ComposedChart, Cell, PieChart, Pie, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, LabelList
} from "recharts";

/* ═══════════════════ AI CONFIG ════════════════════════════════════
   AI Routing (3-tier):
   1. Local dev          → Groq directly with user's key from localStorage
   2. Production, no key → /.netlify/functions/ai-proxy (platform key, shared)
   3. Production + user key → same proxy but user key passed in body
      → proxy uses userKey if present, else falls back to platform key
      → user key NEVER stored server-side, only passed per-request

   This means:
   • All users get free AI analysis using the platform Groq key
   • Power users can paste their own key for higher rate limits
   • Key is stored in localStorage ONLY (never sent to Supabase/server)
═══════════════════════════════════════════════════════════════════ */
const IS_LOCAL = typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const AI_PROXY_URL = IS_LOCAL ? null : "/api/ai-proxy";

/* ═══════════════════════════ STYLES — 2025 Premium UI ══════════════
   Design: Deep space trading terminal
   Fonts: Plus Jakarta Sans + Outfit + IBM Plex Mono
   Palette: #030304 bg, #6366f1 indigo, layered glass surfaces
════════════════════════════════════════════════════════════════════ */
const G = () => (
  <style>{`
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Outfit:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }

:root {
  /* Canvas */
  --bg:     #030304;
  --s1:     #07070c;
  --s2:     #0d0d16;
  --s3:     #12121e;
  --s4:     #181826;

  /* Borders */
  --b1: rgba(255,255,255,.045);
  --b2: rgba(255,255,255,.075);
  --b3: rgba(255,255,255,.11);
  --b4: rgba(255,255,255,.16);

  /* Brand — electric indigo */
  --acc:      #6366f1;
  --acc-hi:   #818cf8;
  --acc-dim:  rgba(99,102,241,.12);
  --acc-glow: 0 0 20px rgba(99,102,241,.45), 0 0 50px rgba(99,102,241,.15);

  /* Cyan pop */
  --cyan:     #22d3ee;
  --cyan-dim: rgba(34,211,238,.1);

  /* Amber */
  --amber:     #f59e0b;
  --amber-dim: rgba(245,158,11,.1);

  /* Emerald / Rose */
  --g:     #34d399;
  --g-dim: rgba(52,211,153,.1);
  --r:     #fb7185;
  --r-dim: rgba(251,113,133,.1);
  --y:     #fbbf24;
  --y-dim: rgba(251,191,36,.1);
  --o:     #fb923c;

  /* Text */
  --t1: #f1f5f9;
  --t2: #94a3b8;
  --t3: #475569;
  --t4: #1e293b;

  /* Glass */
  --glass: rgba(7,7,12,.8);
  --gl-border: rgba(255,255,255,.05);

  /* Shadows */
  --sh-sm: 0 1px 6px rgba(0,0,0,.5);
  --sh-md: 0 4px 20px rgba(0,0,0,.6);
  --sh-lg: 0 16px 56px rgba(0,0,0,.75);

  /* Radii */
  --r8:  8px;
  --r12: 12px;
  --r16: 16px;
  --r20: 20px;
  --r24: 24px;
}

html, body, #root { height: 100%; overflow: hidden }
body {
  background: var(--bg);
  color: var(--t1);
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  -webkit-font-smoothing: antialiased;
}
::-webkit-scrollbar { width: 3px; height: 3px }
::-webkit-scrollbar-track { background: transparent }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,.07); border-radius: 4px }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.12) }

/* ─── App shell ─── */
.app { display: flex; height: 100vh; overflow: hidden }

/* ─── Sidebar ─── */
.sb {
  width: 228px; min-width: 228px;
  background: var(--s1);
  border-right: 1px solid var(--b1);
  display: flex; flex-direction: column; overflow: hidden;
  position: relative;
}
.sb::after {
  content: ''; pointer-events: none;
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,.07) 0%, transparent 65%);
}
.sb-logo {
  padding: 18px 16px 14px;
  border-bottom: 1px solid var(--b1);
  display: flex; align-items: center; gap: 10px;
}
.sb-logo-icon {
  width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
  background: linear-gradient(135deg, var(--acc) 0%, #4f46e5 100%);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 800;
  color: #fff; box-shadow: var(--acc-glow);
  letter-spacing: -1px;
}
.sb-logo-words { flex: 1; min-width: 0 }
.sb-logo-words h1 {
  font-family: 'Outfit', sans-serif;
  font-size: 17px; font-weight: 800; color: var(--t1);
  letter-spacing: -0.5px; line-height: 1;
}
.sb-logo-words span {
  font-size: 8.5px; color: var(--t3);
  letter-spacing: 2px; text-transform: uppercase; font-weight: 600;
  margin-top: 2px; display: block;
}
.sb-nav { flex: 1; padding: 8px 8px 4px; overflow-y: auto }
.sb-sec {
  font-size: 8px; letter-spacing: 2.5px; color: var(--t4);
  padding: 12px 10px 5px; text-transform: uppercase; font-weight: 700;
}
.nb {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px; border-radius: var(--r8);
  cursor: pointer; transition: all .13s;
  color: var(--t3); font-size: 12px; font-weight: 500;
  margin-bottom: 1px; border: 1px solid transparent;
  position: relative;
}
.nb:hover { background: var(--b1); color: var(--t2) }
.nb.on {
  background: var(--acc-dim); color: var(--acc-hi);
  border-color: rgba(99,102,241,.2); font-weight: 600;
}
.nb.on::after {
  content: ''; position: absolute; left: -1px; top: 20%; height: 60%;
  width: 2px; border-radius: 0 2px 2px 0;
  background: linear-gradient(to bottom, var(--acc-hi), var(--acc));
  box-shadow: 0 0 6px var(--acc);
}
.nb .dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0 }

.sb-foot { padding: 10px 12px 14px; border-top: 1px solid var(--b1) }
.pnl-pill {
  background: var(--s2); border: 1px solid var(--b2);
  border-radius: var(--r12); padding: 10px 13px; margin-bottom: 8px;
}
.pnl-pill-label {
  font-size: 8px; letter-spacing: 2px; text-transform: uppercase;
  color: var(--t3); font-weight: 700; margin-bottom: 5px;
}
.pnl-pill-value {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 20px; font-weight: 600; line-height: 1;
  letter-spacing: -0.5px;
}
.pnl-pill-sub {
  font-size: 10px; color: var(--t3); margin-top: 4px;
  font-family: 'IBM Plex Mono', monospace;
}
.user-row {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px; border-radius: var(--r8);
  background: var(--s2); border: 1px solid var(--b1);
  cursor: pointer; transition: all .13s;
}
.user-row:hover { border-color: var(--b3) }
.user-avatar {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  background: linear-gradient(135deg, var(--acc) 0%, #312e81 100%);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; color: #fff;
}
.real-badge {
  margin: 5px 7px 2px;
  padding: 5px 10px; border-radius: 7px;
  background: rgba(52,211,153,.08);
  border: 1px solid rgba(52,211,153,.18);
  font-size: 9.5px; color: var(--g); font-weight: 600;
  display: flex; align-items: center; gap: 6px;
}
.real-badge-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--g); flex-shrink: 0;
  box-shadow: 0 0 5px var(--g);
  animation: blink 1.8s ease infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

/* ─── Main area ─── */
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden }

/* ─── Ticker ─── */
.ticker {
  height: 34px; min-height: 34px;
  background: var(--s1); border-bottom: 1px solid var(--b1);
  overflow: hidden; position: relative; display: flex; align-items: center;
}
.ticker-track {
  display: flex; white-space: nowrap;
  animation: ticker-run 60s linear infinite;
}
.ticker-track:hover { animation-play-state: paused }
.tick-item {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 0 22px; border-right: 1px solid var(--b1);
  font-family: 'IBM Plex Mono', monospace; font-size: 10.5px;
}
.tick-name { color: var(--t3); font-size: 9px; letter-spacing: .5px; font-weight: 500 }
.tick-val  { color: var(--t1); font-weight: 500 }
.tick-chg  { font-size: 9.5px; font-weight: 600; padding: 1px 5px; border-radius: 4px }
.tick-chg.up   { color: var(--g); background: var(--g-dim) }
.tick-chg.down { color: var(--r); background: var(--r-dim) }
.ticker-fade {
  position: absolute; right: 0; top: 0; bottom: 0; width: 80px;
  background: linear-gradient(to right, transparent, var(--s1));
  pointer-events: none;
}
@keyframes ticker-run { from{transform:translateX(0)} to{transform:translateX(-50%)} }

/* ─── Topbar ─── */
.topbar {
  height: 52px; min-height: 52px;
  background: var(--s1); border-bottom: 1px solid var(--b1);
  display: flex; align-items: center; padding: 0 20px; gap: 10px;
}
.topbar-title {
  font-family: 'Outfit', sans-serif;
  font-size: 16px; font-weight: 700; flex: 1;
  color: var(--t1); letter-spacing: -0.3px;
}
.live-pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 20px;
  background: rgba(52,211,153,.08); border: 1px solid rgba(52,211,153,.2);
  font-size: 9px; font-weight: 700; color: var(--g);
  letter-spacing: .8px; text-transform: uppercase;
}
.live-pill::before {
  content: ''; width: 4px; height: 4px; border-radius: 50%;
  background: var(--g); animation: blink 1.8s ease infinite;
}

/* ─── Content ─── */
.content { flex: 1; overflow-y: auto; padding: 18px 20px }

/* ─── Cards ─── */
.card {
  background: var(--s1); border: 1px solid var(--b1);
  border-radius: var(--r12); padding: 18px;
  position: relative; overflow: hidden;
  transition: border-color .18s;
}
.card:hover { border-color: var(--b2) }
.card-hi {
  border-color: rgba(99,102,241,.22);
  box-shadow: 0 0 0 1px rgba(99,102,241,.07), var(--sh-md);
}
.card-glass {
  background: var(--glass); border-color: var(--gl-border);
  backdrop-filter: blur(14px);
}
.kpi {
  background: var(--s2); border: 1px solid var(--b1);
  border-radius: var(--r12); padding: 18px 20px;
  position: relative; overflow: hidden;
  transition: all .18s; cursor: default;
}
.kpi:hover { border-color: var(--b2); transform: translateY(-1px); box-shadow: var(--sh-md) }
.ch { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px }
.ct { font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 700; color: var(--t1); letter-spacing: -0.2px }
.cs { font-size: 9px; color: var(--t3); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 2px; font-weight: 600 }

/* ─── Grids ─── */
.g4  { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px }
.g3  { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px }
.g2  { display: grid; grid-template-columns: 1fr 1fr; gap: 12px }
.g21 { display: grid; grid-template-columns: 2fr 1fr; gap: 12px }
.g31 { display: grid; grid-template-columns: 3fr 1fr; gap: 12px }
.gcol { display: flex; flex-direction: column; gap: 12px }
.bento-main { display: grid; grid-template-columns: 2fr 1fr; gap: 12px }

/* ─── Buttons ─── */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: var(--r8);
  cursor: pointer; font-size: 12px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 600; transition: all .13s; border: 1px solid;
  letter-spacing: -0.1px;
}
.btn-p {
  background: var(--acc); color: #fff;
  border-color: var(--acc);
  box-shadow: 0 2px 12px rgba(99,102,241,.4);
}
.btn-p:hover {
  background: var(--acc-hi);
  box-shadow: var(--acc-glow); transform: translateY(-1px);
}
.btn-p:active { transform: none }
.btn-g { background: transparent; color: var(--t2); border-color: var(--b2) }
.btn-g:hover { background: var(--b1); color: var(--t1); border-color: var(--b3) }
.btn-v { background: var(--amber-dim); color: var(--amber); border-color: rgba(245,158,11,.2) }
.btn-v:hover { background: rgba(245,158,11,.18) }
.btn-r { background: var(--r-dim); color: var(--r); border-color: rgba(251,113,133,.2) }
.btn-r:hover { background: rgba(251,113,133,.18) }
.btn-sm { padding: 4px 10px; font-size: 11px; border-radius: 7px }
.btn-xs { padding: 3px 8px; font-size: 10px; border-radius: 6px }
.btn:disabled { opacity: .4; cursor: not-allowed; transform: none !important }

/* ─── Badges ─── */
.bd { display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 5px; font-size: 10px; font-weight: 600 }
.bd-g { background: var(--g-dim); color: var(--g); border: 1px solid rgba(52,211,153,.2) }
.bd-r { background: var(--r-dim); color: var(--r); border: 1px solid rgba(251,113,133,.2) }
.bd-y { background: var(--y-dim); color: var(--y); border: 1px solid rgba(251,191,36,.2) }
.bd-b { background: var(--cyan-dim); color: var(--cyan); border: 1px solid rgba(34,211,238,.2) }
.bd-a { background: var(--acc-dim); color: var(--acc-hi); border: 1px solid rgba(99,102,241,.25) }
.bd-v { background: var(--amber-dim); color: var(--amber); border: 1px solid rgba(245,158,11,.2) }

/* ─── Table ─── */
.tbl { width: 100%; border-collapse: collapse }
.tbl th {
  text-align: left; font-size: 9px; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--t3);
  padding: 9px 12px; border-bottom: 1px solid var(--b1);
  font-weight: 700; white-space: nowrap;
  background: var(--s2);
}
.tbl td { padding: 10px 12px; border-bottom: 1px solid var(--b1); font-size: 12px; vertical-align: middle; transition: background .1s }
.tbl tr:hover td { background: rgba(255,255,255,.015) }
.tbl tr:last-child td { border-bottom: none }

/* ─── Chips ─── */
.chip {
  display: inline-flex; align-items: center; padding: 4px 11px;
  border-radius: 20px; font-size: 11px; cursor: pointer;
  border: 1px solid; transition: all .13s; font-weight: 500;
}
.chip-on  { background: var(--acc-dim); color: var(--acc-hi); border-color: rgba(99,102,241,.3); font-weight: 600 }
.chip-off { background: transparent; color: var(--t3); border-color: var(--b2) }
.chip-off:hover { color: var(--t2); border-color: var(--b3) }

/* ─── Forms ─── */
.inp {
  background: var(--s2); border: 1px solid var(--b2);
  color: var(--t1); padding: 8px 12px; border-radius: var(--r8);
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px;
  outline: none; width: 100%; transition: all .15s;
}
.inp:focus { border-color: var(--acc); box-shadow: 0 0 0 3px rgba(99,102,241,.12) }
.inp::placeholder { color: var(--t4) }
.sel {
  background: var(--s2); border: 1px solid var(--b2); color: var(--t1);
  padding: 6px 10px; border-radius: 7px;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px;
  cursor: pointer; outline: none; transition: border-color .15s;
}
.sel:focus { border-color: var(--acc) }

/* ─── Drop zone ─── */
.drop {
  border: 2px dashed var(--b2); border-radius: var(--r16);
  padding: 44px 24px; text-align: center; cursor: pointer;
  transition: all .2s; position: relative; overflow: hidden;
}
.drop:hover, .drop.drag { border-color: var(--acc); background: var(--acc-dim) }

/* ─── Utilities ─── */
.row  { display: flex; align-items: center; gap: 10px }
.col  { display: flex; flex-direction: column; gap: 8px }
.sep  { height: 1px; background: var(--b1); margin: 14px 0 }
.green  { color: var(--g)   } .red    { color: var(--r)   } .yellow { color: var(--y) }
.acc    { color: var(--acc-hi) } .acc2 { color: var(--cyan) } .acc3 { color: var(--amber) }
.muted  { color: var(--t2)  } .dim   { color: var(--t3)  }
.mini-prog { height: 2px; border-radius: 2px; background: var(--b2); overflow: hidden }
.mini-prog-fill { height: 100%; border-radius: 2px; transition: width .4s ease }
.mono { font-family: 'IBM Plex Mono', monospace }

/* ─── Animations ─── */
@keyframes fadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn   { from{opacity:0} to{opacity:1} }
@keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
@keyframes spin     { to{transform:rotate(360deg)} }
@keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes glow-out { 0%,100%{opacity:.6} 50%{opacity:1} }
.fa       { animation: fadeUp .2s ease forwards }
.pulsing  { animation: pulse 2s ease infinite }
.spin     { animation: spin .7s linear infinite }
.shimmer  { background: linear-gradient(90deg,var(--s2) 25%,var(--s3) 50%,var(--s2) 75%); background-size:200% 100%; animation:shimmer 1.6s infinite }
.glow-pulse { animation: glow-out 2.5s ease infinite }

/* ─── Modal ─── */
.modal-bg {
  position: fixed; inset: 0; background: rgba(0,0,0,.82);
  backdrop-filter: blur(8px); z-index: 200;
  display: flex; align-items: center; justify-content: center;
  padding: 24px; animation: fadeIn .15s ease;
}
.modal {
  background: var(--s1); border: 1px solid var(--b2);
  border-radius: var(--r20); width: 100%; max-width: 820px;
  max-height: 88vh; overflow: hidden; display: flex; flex-direction: column;
  box-shadow: var(--sh-lg);
}

/* ─── Calendar / Heatmap ─── */
.cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px }
.cal-cell { aspect-ratio: 1; border-radius: 5px; cursor: pointer; transition: all .12s; display:flex; align-items:center; justify-content:center; font-size:8.5px; color:var(--t3) }
.cal-cell:hover { background: var(--b2); color: var(--t1) }
.heat-cell { padding: 8px 6px; border-radius: 6px; text-align:center; font-size:9px; cursor:pointer; transition:all .15s }
.heat-cell:hover { filter: brightness(1.25); transform: scale(1.05) }
.tag { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:6px; font-size:10px; cursor:pointer; border:1px solid transparent; transition:all .12s; font-weight:600 }
.status-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; position:relative }
.status-dot.live::after { content:''; position:absolute; inset:-3px; border-radius:50%; background:inherit; opacity:.3; animation:pulse 1.5s infinite }

/* ─── Auth ─── */
.auth-page {
  min-height: 100vh; background: var(--bg);
  display: flex; align-items: center; justify-content: center;
  padding: 24px; position: relative; overflow: hidden;
}
.auth-page::before {
  content: ''; pointer-events: none;
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 70% 60% at 20% 30%, rgba(99,102,241,.09) 0%, transparent 60%),
    radial-gradient(ellipse 50% 50% at 80% 70%, rgba(34,211,238,.06) 0%, transparent 60%);
}
.auth-card {
  background: var(--s1); border: 1px solid var(--b2);
  border-radius: var(--r24); padding: 40px 38px;
  width: 100%; max-width: 430px; position: relative;
  box-shadow: var(--sh-lg);
}
.auth-card::after {
  content: ''; pointer-events: none;
  position: absolute; top: 0; left: 15%; right: 15%; height: 1px;
  background: linear-gradient(90deg, transparent, var(--acc), var(--acc-hi), transparent);
  opacity: .5;
}

/* ─── Plan cards ─── */
.plan-card { background:var(--s1); border:1px solid var(--b2); border-radius:var(--r16); padding:24px; display:flex; flex-direction:column; position:relative; transition:all .2s }
.plan-card:hover { transform:translateY(-2px); box-shadow:var(--sh-md) }
.plan-card.featured { border-color:rgba(99,102,241,.35); box-shadow:0 0 40px rgba(99,102,241,.1) }
.empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:48px 24px; text-align:center; gap:12px }
.empty-icon { width:52px; height:52px; border-radius:12px; background:var(--s2); border:1px solid var(--b2); display:flex; align-items:center; justify-content:center; font-size:22px }

/* ─── Toast ─── */
.toast { position:fixed; bottom:20px; right:20px; z-index:9999; padding:10px 16px; border-radius:10px; font-weight:600; font-size:12px; box-shadow:var(--sh-md); animation:fadeUp .2s ease; display:flex; align-items:center; gap:8px; max-width:300px; background:var(--s2); border:1px solid }
.toast-success { border-color:rgba(52,211,153,.3); color:var(--g) }
.toast-warn    { border-color:rgba(251,191,36,.3); color:var(--y) }
.toast-error   { border-color:rgba(251,113,133,.3); color:var(--r) }

/* ─── Recharts ─── */
.recharts-cartesian-grid-horizontal line,
.recharts-cartesian-grid-vertical line { stroke:rgba(255,255,255,.04) !important }
`}</style>
);

/* ══════════════════════════ CONSTANTS ════════════════════════════ */
const MARKET_EVENTS = [
  /* ── 2023 ── */
  {date:"2023-02-01",label:"Adani-Hindenburg",type:"company",detail:"Hindenburg Research triggered massive selloff in Adani group. Adani Ports fell ~30% in days.",impact:-1,stocks:["ADANIPORTS","ADANIENT"]},
  {date:"2023-03-10",label:"SVB Collapse",type:"global",detail:"Silicon Valley Bank collapse; global banking fear. HDFC Bank, Kotak fell 2-3%.",impact:-1,stocks:["HDFCBANK"]},
  {date:"2023-05-04",label:"RBI Pause",type:"macro",detail:"RBI paused rate hike cycle at 6.5%, boosting banking & NBFC sectors.",impact:1,stocks:["HDFCBANK","BAJFINANCE","MFSL"]},
  {date:"2023-07-20",label:"Nifty 20K First",type:"market",detail:"Nifty 50 crossed 20,000 for the first time on strong FII inflows.",impact:1,stocks:[]},
  {date:"2023-08-18",label:"Rupee 83 Breach",type:"macro",detail:"INR crossed 83/USD for first time. IT exporters benefited; importers hurt.",impact:-1,stocks:["TCS","INFY","TATAMOTORS"]},
  {date:"2023-10-07",label:"Israel-Hamas War",type:"geopolitical",detail:"Middle East conflict drove crude +8%. Nifty fell 1.4%, oil importers hit hard.",impact:-1,stocks:["RELIANCE","TATAMOTORS","ASHOKLEY"]},
  {date:"2023-11-15",label:"Sensex 65K",type:"market",detail:"BSE Sensex crossed 65,000. IT and banking led the rally.",impact:1,stocks:["TCS","INFY","HDFCBANK"]},
  {date:"2023-12-04",label:"State Election Results",type:"macro",detail:"BJP wins MP, Rajasthan, Chhattisgarh. PSU, defence, infra stocks rally sharply.",impact:1,stocks:["HAL","BEL","RVNL","IRFC"]},

  /* ── 2024 H1 ── */
  {date:"2024-01-22",label:"Ram Mandir",type:"event",detail:"Consecration ceremony. Real estate, tourism, cement, infra stocks spiked 3-8%.",impact:1,stocks:[]},
  {date:"2024-02-01",label:"Budget 2024",type:"macro",detail:"Interim budget. No major changes; fiscal discipline maintained. Markets muted.",impact:0,stocks:[]},
  {date:"2024-02-14",label:"Pre-Election Rally",type:"macro",detail:"Defence, infra, PSU stocks rallied 15-25% on expected continuation government.",impact:1,stocks:["HAL","BEL","RVNL"]},
  {date:"2024-03-01",label:"Nifty 22K",type:"market",detail:"Nifty hit 22,000. Midcap index surged 60% in 12 months. Froth warnings.",impact:1,stocks:[]},
  {date:"2024-04-01",label:"New FY Start",type:"macro",detail:"FY2025-26 begins. F&O reporting period starts. Position rollovers active.",impact:0,stocks:[]},
  {date:"2024-04-19",label:"Iran Strikes Israel",type:"geopolitical",detail:"Direct Iran-Israel military exchange. Nifty fell 1.2%, crude spiked to $90.",impact:-1,stocks:["RELIANCE","ASHOKLEY"]},
  {date:"2024-05-15",label:"Nifty ATH 23K",type:"market",detail:"Nifty hit all-time high of 23,338 ahead of election results. F&O premiums elevated.",impact:1,stocks:[]},
  {date:"2024-06-04",label:"Election Shock",type:"macro",detail:"BJP fell below majority. Nifty crashed 4.7% intraday — biggest fall in years. BankNifty -7%.",impact:-1,stocks:["RELIANCE","TCS","HDFCBANK","EICHERMOT","BAJFINANCE"]},
  {date:"2024-07-23",label:"Budget 2024 Full",type:"macro",detail:"LTCG raised to 12.5%, STCG to 20%. F&O STT hiked. Markets fell 1.5% on tax shock.",impact:-1,stocks:["RELIANCE","TCS","HDFCBANK","EICHERMOT","DIXON","MFSL"]},

  /* ── 2024 H2 ── */
  {date:"2024-08-05",label:"Japan Crash / Yen Unwind",type:"global",detail:"Yen carry trade unwound. Global selloff. Nifty -3%, midcaps -5%. BANKNIFTY -700pts.",impact:-1,stocks:["EICHERMOT","MFSL","NATIONALUM","ASHOKLEY"]},
  {date:"2024-09-05",label:"Nifty ATH 25K",type:"market",detail:"Nifty crossed 25,000. FII buying of ₹15,000Cr in August. Options premiums high.",impact:1,stocks:[]},
  {date:"2024-09-18",label:"Fed Rate Cut 50bps",type:"macro",detail:"US Fed cut 50bps. FII inflows ₹20,000Cr in a week. Tech & banking rallied 3-4%.",impact:1,stocks:["TCS","INFY","HDFCBANK","DIXON","EICHERMOT"]},
  {date:"2024-09-27",label:"Nifty ATH 26K",type:"market",detail:"Nifty hit record 26,277. Retail F&O participation at all-time high.",impact:1,stocks:[]},
  {date:"2024-10-08",label:"FII Exodus Oct",type:"macro",detail:"₹85,000Cr FII selling in Oct 2024. Nifty crashed from 26,000 to 23,500. BankNifty -2200pts.",impact:-1,stocks:["RELIANCE","TCS","HDFCBANK","BAJFINANCE","EICHERMOT","MFSL","DIXON","MCX"]},
  {date:"2024-10-24",label:"Q2FY25 Results Season",type:"macro",detail:"Mixed Q2 results. HDFC, TCS beat. Eicher, Dixon in line. Mid-caps diverged.",impact:0,stocks:["HDFCBANK","TCS","EICHERMOT","DIXON","MFSL"]},
  {date:"2024-11-05",label:"US Election Trump Win",type:"global",detail:"Trump wins US election. USD surged, INR fell to 84.5. IT stocks fell on uncertainty.",impact:-1,stocks:["TCS","INFY","IDEA"]},
  {date:"2024-11-21",label:"Adani Bribery Charges",type:"company",detail:"US DoJ bribery charges on Gautam Adani. Adani group stocks crashed 15-25%.",impact:-1,stocks:["ADANIPORTS"]},
  {date:"2024-12-04",label:"Nifty Crash 23K",type:"market",detail:"Nifty fell to 23,500 from 26,000 peak. 3-month correction of 10%. F&O saw massive put buying.",impact:-1,stocks:["EICHERMOT","MFSL","NATIONALUM","ASHOKLEY","IDEA","DIXION"]},
  {date:"2024-12-18",label:"Fed Hawkish Cut",type:"global",detail:"Fed cut 25bps but signalled only 2 cuts in 2025. Dollar index hit 108. FII selling continued.",impact:-1,stocks:["HDFCBANK","BAJFINANCE","DIXON","EICHERMOT"]},

  /* ── 2025 ── */
  {date:"2025-01-13",label:"FII Selling Jan",type:"macro",detail:"₹45,000Cr FII outflow in Jan 2025. INR hit 86/USD. Midcap index fell 12% from peak.",impact:-1,stocks:["NATIONALUM","ASHOKLEY","IDEA","KALYANKJIL"]},
  {date:"2025-01-20",label:"Trump Inauguration",type:"global",detail:"Trump sworn in. Tariff threats began. IT, pharma, auto on watch. INR under pressure.",impact:-1,stocks:["TCS","INFY","ASHOKLEY","EICHERMOT"]},
  {date:"2025-02-01",label:"Budget 2025",type:"macro",detail:"Zero income tax up to ₹12L. Consumer, FMCG, auto rallied. Capex up 11%. BankNifty +400pts.",impact:1,stocks:["TATAMOTORS","BAJFINANCE","ZOMATO","ASHOKLEY","EICHERMOT","KALYANKJIL"]},
  {date:"2025-02-20",label:"Q3FY25 Results",type:"macro",detail:"Eicher Motor strong Q3 — PAT up 14%. Dixon beat estimates. MFSL mixed.",impact:1,stocks:["EICHERMOT","DIXON","MFSL","ASHOKLEY"]},
  {date:"2025-03-01",label:"Nifty Correction 22K",type:"market",detail:"Nifty fell to 21,964 — correction of 16% from ATH. BankNifty at 9-month low. F&O IVs spiked.",impact:-1,stocks:["BANKNIFTY","EICHERMOT","MFSL","NATIONALUM","IDEA"]},
  {date:"2025-03-11",label:"F&O Report End Date",type:"macro",detail:"End of user's F&O reporting period. Positions rolled or closed.",impact:0,stocks:[]},
  {date:"2025-04-03",label:"Trump Tariffs 26%",type:"global",detail:"26% reciprocal tariff on India. Nifty fell 800+ pts. IT, pharma, auto exporters hit hard.",impact:-1,stocks:["TCS","INFY","ASHOKLEY","EICHERMOT","TATAMOTORS"]},
  {date:"2025-04-09",label:"Tariff Pause 90 Days",type:"global",detail:"Trump paused reciprocal tariffs for 90 days. Global markets surged 5-8%. Nifty recovered.",impact:1,stocks:["TCS","INFY","EICHERMOT","ASHOKLEY"]},
];

/* ═════════════════════════ FORMATTERS ═══════════════════════════ */
const safeN = v => { const n=parseFloat(String(v).replace(/[₹,\s]/g,"")); return isNaN(n)?0:n; };
const fmtC = n => { const num=safeN(n); return (num>=0?"+":"−")+"₹"+Math.abs(Math.round(num)).toLocaleString("en-IN"); };
const fmtA = n => "₹"+Math.abs(Math.round(safeN(n))).toLocaleString("en-IN");
const fmtP = n => { const num=safeN(n); return (num>=0?"+":"")+num+"%"; };
const fmtD = d => d?new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"2-digit"}):"—";
const fmtDLong = d => d?new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}):"—";

const SECTORS = {
  RELIANCE:"Energy",TCS:"IT",HDFCBANK:"Banking",INFY:"IT",WIPRO:"IT",TECHM:"IT",HCLTECH:"IT",
  ADANIPORTS:"Infra",TATAMOTORS:"Auto",BAJFINANCE:"NBFC",BAJAJ_AUTO:"Auto",MARUTI:"Auto",
  ZOMATO:"Consumer Tech",NIFTYBEES:"Index ETF",GOLDBEES:"Commodity ETF",
  EICHERMOT:"Auto",ASHOKLEY:"Auto",TATASTEEL:"Metal",NATIONALUM:"Metal",HINDALCO:"Metal",
  DIXON:"Electronics",MCX:"Commodity",KALYANKJIL:"Jewellery",MFSL:"Insurance",
  IDEA:"Telecom",IRCTC:"Travel",IRFC:"NBFC",RVNL:"Infra",HAL:"Defence",BEL:"Defence",
  NIFTY:"Index",BANKNIFTY:"Index",FINNIFTY:"Index",MIDCPNIFTY:"Index",
  DEFAULT:"Other"
};

// Auto-detect sector for unknown stocks based on segment
const getSector = (t) => {
  if(SECTORS[t.stock]) return SECTORS[t.stock];
  if(t.segment==="FNO-FUT") return "Futures";
  if(t.segment==="FNO-OPT") return "Options";
  return SECTORS.DEFAULT;
};

const STRATEGY_TAGS = ["Breakout","Dip Buy","Earnings Play","Trend Follow","Reversal","Swing","Value Buy","Event Trade","Momentum","Hedging"];

const eventColor = t => ({company:"#ff3d5a",global:"#ffc542",macro:"#4d8aff",geopolitical:"#ff7a3d",market:"#00f0c0",event:"#b06eff"}[t]||"#8b9bbf");

/* ══════════════════════ SAMPLE DATA (fallback) ═══════════════════ */
const SAMPLE_TRADES_RAW = [
  {id:1,stock:"RELIANCE",exchange:"NSE",qty:50,buyDate:"2023-02-15",buyPrice:2380,sellDate:"2023-04-10",sellPrice:2540,segment:"EQ"},
  {id:2,stock:"RELIANCE",exchange:"NSE",qty:30,buyDate:"2023-07-05",buyPrice:2620,sellDate:"2023-09-18",sellPrice:2490,segment:"EQ"},
  {id:3,stock:"RELIANCE",exchange:"NSE",qty:60,buyDate:"2024-01-15",buyPrice:2720,sellDate:"2024-03-20",sellPrice:2940,segment:"EQ"},
  {id:4,stock:"RELIANCE",exchange:"NSE",qty:40,buyDate:"2024-08-15",buyPrice:2980,sellDate:"2024-10-22",sellPrice:2780,segment:"EQ"},
  {id:5,stock:"TCS",exchange:"NSE",qty:20,buyDate:"2023-01-20",buyPrice:3180,sellDate:"2023-05-12",sellPrice:3420,segment:"EQ"},
  {id:6,stock:"TCS",exchange:"NSE",qty:15,buyDate:"2023-08-10",buyPrice:3580,sellDate:"2023-11-28",sellPrice:3720,segment:"EQ"},
  {id:7,stock:"TCS",exchange:"NSE",qty:25,buyDate:"2024-02-20",buyPrice:3820,sellDate:"2024-06-12",sellPrice:3480,segment:"EQ"},
  {id:8,stock:"TCS",exchange:"NSE",qty:18,buyDate:"2024-09-05",buyPrice:4180,sellDate:"2025-01-20",sellPrice:4350,segment:"EQ"},
  {id:9,stock:"HDFCBANK",exchange:"NSE",qty:40,buyDate:"2023-03-20",buyPrice:1620,sellDate:"2023-06-15",sellPrice:1580,segment:"EQ"},
  {id:10,stock:"HDFCBANK",exchange:"NSE",qty:60,buyDate:"2023-10-15",buyPrice:1510,sellDate:"2024-01-08",sellPrice:1680,segment:"EQ"},
  {id:11,stock:"HDFCBANK",exchange:"NSE",qty:50,buyDate:"2024-04-10",buyPrice:1550,sellDate:"2024-07-22",sellPrice:1620,segment:"EQ"},
  {id:12,stock:"INFY",exchange:"NSE",qty:30,buyDate:"2023-04-20",buyPrice:1320,sellDate:"2023-07-14",sellPrice:1280,segment:"EQ"},
  {id:13,stock:"INFY",exchange:"NSE",qty:45,buyDate:"2023-11-10",buyPrice:1380,sellDate:"2024-02-05",sellPrice:1520,segment:"EQ"},
  {id:14,stock:"INFY",exchange:"NSE",qty:35,buyDate:"2024-05-15",buyPrice:1480,sellDate:"2024-08-20",sellPrice:1440,segment:"EQ"},
  {id:15,stock:"ADANIPORTS",exchange:"NSE",qty:80,buyDate:"2023-01-25",buyPrice:680,sellDate:"2023-03-05",sellPrice:510,segment:"EQ"},
  {id:16,stock:"ADANIPORTS",exchange:"NSE",qty:100,buyDate:"2023-05-20",buyPrice:720,sellDate:"2023-08-15",sellPrice:840,segment:"EQ"},
  {id:17,stock:"TATAMOTORS",exchange:"NSE",qty:60,buyDate:"2023-02-10",buyPrice:420,sellDate:"2023-05-20",sellPrice:510,segment:"EQ"},
  {id:18,stock:"TATAMOTORS",exchange:"NSE",qty:80,buyDate:"2023-09-12",buyPrice:620,sellDate:"2023-12-18",sellPrice:820,segment:"EQ"},
  {id:19,stock:"TATAMOTORS",exchange:"NSE",qty:50,buyDate:"2024-03-15",buyPrice:960,sellDate:"2024-06-08",sellPrice:880,segment:"EQ"},
  {id:20,stock:"BAJFINANCE",exchange:"NSE",qty:15,buyDate:"2023-05-10",buyPrice:6200,sellDate:"2023-08-22",sellPrice:7480,segment:"EQ"},
  {id:21,stock:"BAJFINANCE",exchange:"NSE",qty:10,buyDate:"2023-11-20",buyPrice:7200,sellDate:"2024-02-18",sellPrice:6800,segment:"EQ"},
  {id:22,stock:"ZOMATO",exchange:"NSE",qty:200,buyDate:"2023-04-05",buyPrice:58,sellDate:"2023-08-28",sellPrice:88,segment:"EQ"},
  {id:23,stock:"ZOMATO",exchange:"NSE",qty:300,buyDate:"2023-10-20",buyPrice:92,sellDate:"2024-01-15",sellPrice:148,segment:"EQ"},
  {id:24,stock:"ZOMATO",exchange:"NSE",qty:150,buyDate:"2024-05-10",buyPrice:188,sellDate:"2024-09-05",sellPrice:245,segment:"EQ"},
  {id:25,stock:"NIFTYBEES",exchange:"NSE",qty:500,buyDate:"2023-06-10",buyPrice:184,sellDate:"2023-09-20",sellPrice:195,segment:"EQ"},
  {id:26,stock:"NIFTYBEES",exchange:"NSE",qty:400,buyDate:"2024-01-20",buyPrice:218,sellDate:"2024-06-12",sellPrice:228,segment:"EQ"},
];

/* ═══════════════════ EXCEL PARSER — REAL PARSING ════════════════ */
const parseGrowwExcel = (data) => {
  // Groww P&L report columns (multiple possible layouts)
  const colMaps = [
    // Groww Trade Book
    {stock:["symbol","instrument","stock","scrip","tradingsymbol"],buy_date:["trade date","buy date","date","order date"],buy_price:["buy price","buy avg","buy","avg buy price","buy rate"],sell_date:["sell date","exit date"],sell_price:["sell price","sell avg","sell","avg sell price","sell rate"],qty:["qty","quantity","shares","net qty"]},
    // Zerodha Trade Book
    {stock:["symbol","instrument"],buy_date:["trade date","order execution time"],buy_price:["price","trade price"],sell_date:["trade date"],sell_price:["price"],qty:["quantity","qty"]},
  ];

  const ws = data.Sheets[data.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, {header:1,defval:""});
  if (!rows.length) return [];

  // Find header row
  let hdrIdx = -1;
  let hdrRow = [];
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const r = rows[i].map(c => String(c).toLowerCase().trim());
    if (r.some(c => c.includes("symbol") || c.includes("stock") || c.includes("trade"))) {
      hdrIdx = i; hdrRow = r; break;
    }
  }
  if (hdrIdx === -1) return [];

  const findCol = (aliases) => {
    for (const a of aliases) {
      const idx = hdrRow.findIndex(h => h.includes(a));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  // Try to detect Groww P&L statement (has buy+sell in same row)
  const map = colMaps[0];
  const colStock = findCol(map.stock);
  const colBuyDate = findCol(map.buy_date);
  const colBuyPrice = findCol(map.buy_price);
  const colSellDate = findCol(map.sell_date);
  const colSellPrice = findCol(map.sell_price);
  const colQty = findCol(map.qty);

  // Also look for pnl / realized columns
  const colPnl = hdrRow.findIndex(h => h.includes("realised") || h.includes("realized") || h.includes("p&l") || h.includes("net pnl"));

  if (colStock === -1) return [];

  const trades = [];
  let id = 1;

  for (let i = hdrIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[colStock]) continue;
    const stock = String(r[colStock]).trim().replace(/\.NS|\.BSE/gi,"").toUpperCase();
    if (!stock || stock === "SYMBOL" || stock === "INSTRUMENT") continue;

    const rawBuyDate = r[colBuyDate] !== undefined ? r[colBuyDate] : "";
    const rawSellDate = r[colSellDate] !== undefined ? r[colSellDate] : "";
    const buyPrice = parseFloat(String(r[colBuyPrice]).replace(/[₹,]/g,"")) || 0;
    const sellPrice = parseFloat(String(r[colSellPrice]).replace(/[₹,]/g,"")) || 0;
    const qty = parseFloat(String(r[colQty]).replace(/[,]/g,"")) || 0;

    if (!buyPrice || !sellPrice || !qty) continue;

    // Parse dates - handle Excel serial, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
    const parseDate = (v) => {
      if (!v) return null;
      if (typeof v === "number") {
        // Excel serial date
        const d = new Date((v - 25569) * 86400 * 1000);
        return d.toISOString().split("T")[0];
      }
      const s = String(v).trim();
      // DD/MM/YYYY or DD-MM-YYYY
      let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
      if (m) {
        const y = m[3].length === 2 ? "20" + m[3] : m[3];
        return `${y}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
      }
      // YYYY-MM-DD
      m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (m) return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;
      // Try natural parse
      const d = new Date(s);
      if (!isNaN(d)) return d.toISOString().split("T")[0];
      return null;
    };

    const buyDate = parseDate(rawBuyDate);
    const sellDate = parseDate(rawSellDate) || buyDate;
    if (!buyDate) continue;

    trades.push({id:id++,stock,exchange:"NSE",qty,buyDate,buyPrice,sellDate,sellPrice,segment:"EQ",source:"imported"});
  }
  return trades;
};

// Handle Groww trade history (separate buy/sell rows)
const parseGrowwTradeHistory = (data) => {
  const ws = data.Sheets[data.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, {header:1,defval:""});
  if (!rows.length) return [];

  let hdrIdx = -1;
  let hdrRow = [];
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const r = rows[i].map(c => String(c).toLowerCase().trim());
    if (r.some(c => c.includes("type") || c.includes("buy") || c.includes("sell"))) {
      hdrIdx = i; hdrRow = r; break;
    }
  }
  if (hdrIdx === -1) return null;

  const colDate = hdrRow.findIndex(h=>h.includes("date"));
  const colStock = hdrRow.findIndex(h=>h.includes("symbol")||h.includes("stock")||h.includes("scrip"));
  const colType = hdrRow.findIndex(h=>h.includes("type")||h.includes("side")||h.includes("buy/sell")||h.includes("trade type"));
  const colPrice = hdrRow.findIndex(h=>h.includes("price")||h.includes("rate"));
  const colQty = hdrRow.findIndex(h=>h.includes("qty")||h.includes("quantity"));

  if (colStock === -1 || colType === -1) return null;

  // Group buys and sells
  const buys = {}, sells = {};
  let id = 1;

  for (let i = hdrIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const stock = String(r[colStock]||"").trim().toUpperCase().replace(/\.NS|\.BSE/gi,"");
    if (!stock) continue;
    const type = String(r[colType]||"").toLowerCase();
    const price = parseFloat(String(r[colPrice]||"").replace(/[₹,]/g,""))||0;
    const qty = parseFloat(String(r[colQty]||"").replace(/,/g,""))||0;
    const date = r[colDate];
    if (!price || !qty) continue;

    const parseDate = (v) => {
      if (!v) return null;
      if (typeof v === "number") return new Date((v-25569)*86400*1000).toISOString().split("T")[0];
      const s = String(v).trim();
      const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
      if (m) { const y=m[3].length===2?"20"+m[3]:m[3]; return `${y}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`; }
      const d = new Date(s); if (!isNaN(d)) return d.toISOString().split("T")[0];
      return null;
    };

    const parsedDate = parseDate(date);
    if (!parsedDate) continue;

    if (type.includes("buy")) {
      if (!buys[stock]) buys[stock] = [];
      buys[stock].push({date:parsedDate, price, qty});
    } else if (type.includes("sell")) {
      if (!sells[stock]) sells[stock] = [];
      sells[stock].push({date:parsedDate, price, qty});
    }
  }

  // Match buys with sells by stock
  const trades = [];
  for (const stock of Object.keys(buys)) {
    const stockBuys = buys[stock] || [];
    const stockSells = sells[stock] || [];
    const pairs = Math.min(stockBuys.length, stockSells.length);
    for (let i = 0; i < pairs; i++) {
      const b = stockBuys[i], s = stockSells[i];
      trades.push({id:id++,stock,exchange:"NSE",qty:Math.min(b.qty,s.qty),buyDate:b.date,buyPrice:b.price,sellDate:s.date,sellPrice:s.price,segment:"EQ",source:"imported"});
    }
    // Unmatched buys = open positions
    for (let i = pairs; i < stockBuys.length; i++) {
      const b = stockBuys[i];
      trades.push({id:id++,stock,exchange:"NSE",qty:b.qty,buyDate:b.date,buyPrice:b.price,sellDate:null,sellPrice:null,segment:"EQ",source:"imported",open:true});
    }
  }
  return trades.length > 0 ? trades : null;
};

/* ═══════════════════ GROWW F&O P&L PARSER ═══════════════════════
   Handles: F_O_PnL_Report_XXXXXXXXXX_YYYY-MM-DD_YYYY-MM-DD_.xlsx
   Sheet: "Trade Level"
   Columns: Scrip Name | Qty | Buy Date | Buy Price | Buy Value | Sell Date | Sell Price | Sell Value | Realized P&L
   Scrip format examples:
     "EICHERMOT 30 SEP 25 Fut"
     "ASHOKLEY 30 DEC 25 163 Call"
     "BANKNIFTY 25 NOV 25 58700 Put"
═══════════════════════════════════════════════════════════════ */
const parseChargesFromSummary = (data) => {
  // Try to find charges from the first/summary sheet
  // The format has rows like: "Total Charges" with a number, or individual charge rows
  const ws = data.Sheets[data.SheetNames[0]];
  if(!ws) return 0;
  const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:""});
  let totalCharges = 0;
  for(let i=0; i<rows.length; i++) {
    const r = rows[i];
    // Look for a "Total" row in the charges section
    // The sheet has: "Charges" label, then individual charge rows, then "Total" with the sum
    // We look for the row with "Total" that follows charge names like "Exchange Transaction Charges", "Brokerage", etc
    const col0 = String(r[0]||"").trim();
    const col1 = String(r[1]||"").trim();
    // Look for the charges total row — it's labeled "Total" and the value is in adjacent columns
    // Pattern: after seeing "Charges" header, find "Total" row
    if(col0 === "Total" || col1 === "Total") {
      // Find first numeric value in this row
      for(let j=1; j<r.length; j++) {
        const v = parseFloat(String(r[j]||"").replace(/[₹,]/g,""));
        if(!isNaN(v) && v > 1000) { // charges total should be > 1000 (not a small P&L figure)
          // Verify this is in the charges section by checking nearby rows for known charge types
          const nearby = rows.slice(Math.max(0,i-8), i).map(row=>String(row[0]||"").trim());
          const isChargesTotal = nearby.some(n=>
            n.includes("Brokerage")||n.includes("STT")||n.includes("Transaction Charges")||n.includes("SEBI")||n.includes("GST")||n.includes("Stamp")
          );
          if(isChargesTotal) { totalCharges = v; break; }
        }
      }
    }
  }
  return totalCharges;
};

const parseGrowwFnO = (data) => {
  // Try "Trade Level" sheet first, fall back to first sheet
  const sheetName = data.SheetNames.find(n => n.toLowerCase().includes("trade")) || data.SheetNames[0];
  const ws = data.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:""});

  // Parse "01 Apr 2025" → "2025-04-01"
  const MONTHS = {jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12"};
  const parseGrowwDate = (v) => {
    if(!v) return null;
    if(typeof v === "number") return new Date((v-25569)*86400*1000).toISOString().split("T")[0];
    const s = String(v).trim();
    // "01 Apr 2025" or "1 Apr 2025"
    const m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
    if(m) { const mo = MONTHS[m[2].toLowerCase()]; return mo ? `${m[3]}-${mo}-${m[1].padStart(2,"0")}` : null; }
    // Fallback: standard date string
    const d = new Date(s); if(!isNaN(d)) return d.toISOString().split("T")[0];
    return null;
  };

  // Parse scrip name → underlying, expiry, type, strike
  const parseScrip = (name) => {
    if(!name || name === "Scrip Name" || name === "Total") return null;
    const s = String(name).trim();
    // Futures: "EICHERMOT 30 SEP 25 Fut" or "NIFTY 28 AUG 25 Fut"
    const futMatch = s.match(/^(.+?)\s+(\d{1,2}\s+\w{3}\s+\d{2})\s+Fut$/i);
    if(futMatch) {
      const expRaw = futMatch[2]; // "30 SEP 25"
      const expM = expRaw.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2})/);
      const expiry = expM ? `20${expM[3]}-${MONTHS[expM[2].toLowerCase()]||"01"}-${expM[1].padStart(2,"0")}` : null;
      return {underlying: futMatch[1].trim(), expiry, type:"FUT", strike:null, display:s};
    }
    // Options: "ASHOKLEY 30 DEC 25 163 Call" or "BANKNIFTY 25 NOV 25 58700 Put"
    const optMatch = s.match(/^(.+?)\s+(\d{1,2}\s+\w{3}\s+\d{2})\s+([\d.]+)\s+(Call|Put)$/i);
    if(optMatch) {
      const expRaw = optMatch[2];
      const expM = expRaw.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2})/);
      const expiry = expM ? `20${expM[3]}-${MONTHS[expM[2].toLowerCase()]||"01"}-${expM[1].padStart(2,"0")}` : null;
      const optType = optMatch[4].toUpperCase(); // CALL or PUT
      return {underlying: optMatch[1].trim(), expiry, type:optType, strike:parseFloat(optMatch[3]), display:s};
    }
    return {underlying:s, expiry:null, type:"UNK", strike:null, display:s};
  };

  // Find "Trade Level" data — look for header row with "Buy Date"
  let hdrIdx = -1;
  let section = "FUTURES"; // track Futures vs Options section
  for(let i=0; i<rows.length; i++) {
    if(rows[i][0] === "Options") section = "OPTIONS";
    if(rows[i][2] === "Buy Date" || rows[i][2] === "Buy date") { hdrIdx = i; break; }
  }
  if(hdrIdx === -1) return null;

  const trades = [];
  let id = 1;
  let curSection = "FUTURES";

  for(let i = hdrIdx+1; i < rows.length; i++) {
    const r = rows[i];
    // Track section changes
    if(String(r[0]).trim() === "Options") { curSection = "OPTIONS"; continue; }
    if(String(r[0]).trim() === "Futures") { curSection = "FUTURES"; continue; }
    // Skip total rows, empty rows, header repeats
    const scripName = String(r[0]||"").trim();
    if(!scripName || scripName === "Total" || scripName === "Scrip Name" || scripName === "Realised trades (trade level)") continue;

    const scrip = parseScrip(scripName);
    if(!scrip) continue;

    const qty = parseFloat(String(r[1]||"").replace(/,/g,"")) || 0;
    const buyDate = parseGrowwDate(r[2]);
    const buyPrice = parseFloat(String(r[3]||"").replace(/[₹,]/g,"")) || 0;
    const buyValue = parseFloat(String(r[4]||"").replace(/[₹,]/g,"")) || 0; // col 4 = Buy Value
    const sellDate = parseGrowwDate(r[5]);
    const sellPrice = parseFloat(String(r[6]||"").replace(/[₹,]/g,"")) || 0;
    // Column 8 = Realized P&L (if present)
    const realizedPnl = r[8] !== "" && r[8] !== undefined ? parseFloat(String(r[8]||"").replace(/[₹,]/g,"")) : null;

    if(!scrip.underlying || !qty || !buyPrice) continue;

    // For options/futures: use underlying as stock identifier
    const stock = scrip.underlying;
    // Determine if it's a short (sell date before buy date = sold first)
    const isShort = buyDate && sellDate && new Date(sellDate) < new Date(buyDate);

    trades.push({
      id: id++,
      stock,
      display: scripName,
      exchange: stock.includes("NIFTY") || stock.includes("SENSEX") ? "NSE" : "NSE",
      segment: curSection === "OPTIONS" ? "FNO-OPT" : "FNO-FUT",
      instrType: scrip.type,
      strike: scrip.strike,
      expiry: scrip.expiry,
      qty,
      buyDate: isShort ? sellDate : buyDate,
      buyPrice: isShort ? sellPrice : buyPrice,
      buyValue: isShort ? 0 : buyValue,
      sellDate: isShort ? buyDate : sellDate,
      sellPrice: isShort ? buyPrice : sellPrice,
      realizedPnl,
      source: "fno-imported",
    });
  }
  if(trades.length > 0) {
    const totalCharges = parseChargesFromSummary(data);
    trades._totalCharges = totalCharges; // attach as property on array
    return trades;
  }
  return null;
};

/* Also try parsing Contract Level sheet (no dates, but has P&L per contract) */
const parseGrowwFnOContractLevel = (data) => {
  const sheetName = data.SheetNames.find(n => n.toLowerCase().includes("contract")) || null;
  if(!sheetName) return null;
  const ws = data.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:""});

  const MONTHS = {jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12"};
  const parseScrip = (name) => {
    if(!name) return null;
    const s = String(name).trim();
    const futMatch = s.match(/^(.+?)\s+(\d{1,2}\s+\w{3}\s+\d{2})\s+Fut$/i);
    if(futMatch) {
      const expM = futMatch[2].match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2})/);
      const expiry = expM ? `20${expM[3]}-${MONTHS[expM[2].toLowerCase()]||"01"}-${expM[1].padStart(2,"0")}` : null;
      return {underlying:futMatch[1].trim(), expiry, type:"FUT", strike:null};
    }
    const optMatch = s.match(/^(.+?)\s+(\d{1,2}\s+\w{3}\s+\d{2})\s+([\d.]+)\s+(Call|Put)$/i);
    if(optMatch) {
      const expM = optMatch[2].match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2})/);
      const expiry = expM ? `20${expM[3]}-${MONTHS[expM[2].toLowerCase()]||"01"}-${expM[1].padStart(2,"0")}` : null;
      return {underlying:optMatch[1].trim(), expiry, type:optMatch[4].toUpperCase(), strike:parseFloat(optMatch[3])};
    }
    return null;
  };

  let curSection = "FUTURES";
  const trades = [];
  let id = 1;

  for(let i=0; i<rows.length; i++) {
    const r = rows[i];
    if(String(r[0]).trim()==="Futures") { curSection="FUTURES"; continue; }
    if(String(r[0]).trim()==="Options") { curSection="OPTIONS"; continue; }
    if(!r[0] || String(r[0]).trim()==="Scrip Name" || String(r[0]).trim()==="Total") continue;

    const scrip = parseScrip(String(r[0]).trim());
    if(!scrip) continue;

    const qty = parseFloat(String(r[1]||"").replace(/,/g,""))||0;
    const buyPrice = parseFloat(String(r[2]||"").replace(/[₹,]/g,""))||0;
    const sellPrice = parseFloat(String(r[4]||"").replace(/[₹,]/g,""))||0;
    const pnl = parseFloat(String(r[6]||"").replace(/[₹,]/g,""))||0;
    if(!qty||!buyPrice) continue;

    // Derive approximate dates from expiry (contract level has no dates — use expiry month)
    const buyDate = scrip.expiry ? scrip.expiry.slice(0,7)+"-01" : "2025-04-01";
    const sellDate = scrip.expiry || "2025-04-30";

    trades.push({
      id: id++,
      stock: scrip.underlying,
      display: String(r[0]).trim(),
      exchange: "NSE",
      segment: curSection==="OPTIONS" ? "FNO-OPT" : "FNO-FUT",
      instrType: scrip.type,
      strike: scrip.strike,
      expiry: scrip.expiry,
      qty, buyDate, buyPrice, sellDate, sellPrice,
      realizedPnl: pnl,
      source: "fno-contract",
    });
  }
  return trades.length > 0 ? trades : null;
};

const processTrades = (raw) => raw.map(t => {
  const sector = getSector(t);
  const buyV = safeN(t.buyValue);
  const buyP = safeN(t.buyPrice);
  const qty  = safeN(t.qty);
  // Capital per trade = broker's Buy Value (includes lot size) or fallback price×qty
  const invested = buyV > 0 ? buyV : Math.round(Math.abs(buyP * qty));

  if (t.open || !t.sellPrice) {
    return {...t, pnl:0, pnlPct:0, days:0, invested, relatedEvents:[], sector};
  }
  // P&L: broker's realizedPnl is authoritative (accounts for lot size & charges)
  const pnl = (t.realizedPnl != null && safeN(t.realizedPnl) !== 0)
    ? Math.round(safeN(t.realizedPnl))
    : Math.round((safeN(t.sellPrice) - buyP) * qty);
  const pnlPct = buyP ? parseFloat(((safeN(t.sellPrice) - buyP) / buyP * 100).toFixed(2)) : 0;
  const days = t.buyDate && t.sellDate
    ? Math.abs(Math.round((new Date(t.sellDate) - new Date(t.buyDate)) / 86400000)) : 0;
  const relatedEvents = (t.buyDate && t.sellDate) ? MARKET_EVENTS.filter(e => {
    const ed=new Date(e.date), bd=new Date(t.buyDate), sd=new Date(t.sellDate);
    return ed >= Math.min(bd,sd) && ed <= Math.max(bd,sd);
  }) : [];
  return {...t, pnl, pnlPct, days, invested, relatedEvents, sector};
});

const buildEquityCurve = (trades) => {
  const sorted = [...trades].filter(t=>!t.open).sort((a,b)=>new Date(a.sellDate)-new Date(b.sellDate));
  let cum = 0;
  return sorted.map(t => ({date:t.sellDate, cumPnl:(cum+=t.pnl), pnl:t.pnl, stock:t.stock}));
};

const buildStockStats = (trades) => {
  const map = {};
  trades.filter(t=>!t.open).forEach(t => {
    if (!map[t.stock]) map[t.stock] = {
      stock:t.stock, trades:0, totalPnl:0, wins:0, losses:0,
      maxTradeCapital:0, totalTurnover:0,
      maxWin:0, maxLoss:0, sector:t.sector||getSector(t), days:[]
    };
    const s = map[t.stock];
    s.trades++; s.totalPnl += t.pnl;
    s.maxTradeCapital = Math.max(s.maxTradeCapital, t.invested);
    s.totalTurnover += t.invested;
    s.days.push(t.days);
    if (t.pnl >= 0) { s.wins++; s.maxWin = Math.max(s.maxWin, t.pnl); }
    else { s.losses++; s.maxLoss = Math.min(s.maxLoss, t.pnl); }
  });
  return Object.values(map).map(s => ({
    ...s,
    // Use max single-trade capital as "invested" for this stock (peak risk, not sum)
    invested: s.maxTradeCapital,
    winRate: s.trades ? Math.round(s.wins/s.trades*100) : 0,
    roi: s.maxTradeCapital ? parseFloat((s.totalPnl/s.maxTradeCapital*100).toFixed(1)) : 0,
    avgDays: s.days.length ? Math.round(s.days.reduce((a,b)=>a+b,0)/s.days.length) : 0,
  })).sort((a,b) => b.totalPnl - a.totalPnl);
};

const buildOverall = (trades, totalCharges=0) => {
  const closed = trades.filter(t=>!t.open);
  const grossPnl = closed.reduce((s,t)=>s+t.pnl, 0);
  // Net P&L = Gross P&L minus all broker charges (STT, brokerage, GST, etc.)
  const netPnl = grossPnl - totalCharges;
  const totalTurnover = closed.reduce((s,t)=>s+t.invested, 0); // sum of all buyValues

  /* ── CURRENT CAPITAL ─────────────────────────────────────────────
     Peak capital deployed is the max single-trade buyValue (or the
     largest concurrent position). A simpler proxy: the largest single
     buyValue across all trades — this is the minimum starting capital
     needed. We display it as "Est. Starting Capital" and show what it
     grew (or shrank) to after all trades including charges.

     Current Capital = max(invested per trade) + netPnl
     (i.e. your account if you started with that much and traded it all)

     For turnover-heavy F&O accounts the max single-trade capital is
     more representative of actual risk capital than the sum of all
     buyValues (which double-counts reinvested proceeds).            */
  const maxSingleTrade = closed.length ? Math.max(...closed.map(t=>t.invested)) : 0;
  // Estimate starting capital = largest individual position (peak risk capital)
  const startingCapital = maxSingleTrade;
  // Current = what that capital would be worth now after all trades + charges
  const currentCapital = startingCapital + netPnl;

  // Also compute avg capital per trade (useful for position sizing)
  const avgTradeCapital = closed.length ? Math.round(totalTurnover / closed.length) : 0;

  const wins = closed.filter(t=>t.pnl>0).length;
  const losses = closed.filter(t=>t.pnl<0).length;
  const avgDays = closed.length ? Math.round(closed.reduce((s,t)=>s+t.days,0)/closed.length) : 0;
  const maxPnl = closed.reduce((m,t)=>t.pnl>m.pnl?t:m, closed[0]||{pnl:0});
  const minPnl = closed.reduce((m,t)=>t.pnl<m.pnl?t:m, closed[0]||{pnl:0});

  // ROI = Net P&L (after charges) as % of starting capital
  const roi = startingCapital ? parseFloat((netPnl/startingCapital*100).toFixed(2)) : 0;

  return {
    grossPnl,
    totalCharges,
    totalPnl: netPnl,          // net (after charges) — used everywhere as THE P&L number
    totalInvested: currentCapital,   // backwards compat alias
    currentCapital,
    startingCapital,
    totalTurnover,
    avgTradeCapital,
    wins, losses,
    winRate: closed.length ? Math.round(wins/closed.length*100) : 0,
    avgDays, bestTrade: maxPnl, worstTrade: minPnl,
    roi,
    totalTrades: closed.length, openTrades: trades.filter(t=>t.open).length,
  };
};


/* ═══════════════════════ NIFTY SIMULATOR ════════════════════════ */
const genNifty = () => {
  let v=17800; const out=[];
  const s=new Date("2023-01-01");
  for(let i=0;i<900;i++){
    const d=new Date(s); d.setDate(d.getDate()+i);
    if(d.getDay()===0||d.getDay()===6) continue;
    const ds=d.toISOString().split("T")[0];
    const ev=MARKET_EVENTS.find(e=>e.date===ds);
    const ef=ev?ev.impact*(Math.random()*180+80):0;
    v+=((Math.random()-.46)*110+ef);
    v=Math.max(15000,Math.min(27500,v));
    out.push({date:ds,nifty:Math.round(v)});
  }
  return out;
};
const NIFTY_DATA=genNifty();

/* ═══════════════════ TOOLTIP ════════════════════════════════════ */
const TT = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:"rgba(13,13,22,.95)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"10px 14px",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,boxShadow:"0 16px 40px rgba(0,0,0,.8)",minWidth:150,backdropFilter:"blur(12px)"}}>
      <div style={{color:"var(--t3)",fontSize:9,marginBottom:7,letterSpacing:1}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",gap:14,marginBottom:2}}>
          <span style={{color:p.color||"var(--t2)"}}>{p.name}</span>
          <span style={{fontWeight:600,color:typeof p.value==="number"&&p.value<0?"var(--r)":typeof p.value==="number"&&p.value>0?"var(--g)":"var(--t1)"}}>
            {typeof p.value==="number"?p.value.toLocaleString("en-IN"):p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ═════════════════════ SVG ICONS ════════════════════════════════ */
const I = ({n,s=14,c="currentColor"}) => {
  const p = {
    dash:<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    hist:<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    ev:<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    stock:<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    up:<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    ai:<><path d="M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z"/><circle cx="12" cy="13" r="2"/></>,
    tag:<><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    heat:<><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></>,
    cal:<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    risk:<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
    corr:<><line x1="22" y1="12" x2="2" y2="12"/><polyline points="12 2 2 12 12 22"/></>,
    note:<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
    x:<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    check:<><polyline points="20 6 9 17 4 12"/></>,
    warn:<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></>,
    send:<><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    refresh:<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>,
    star:<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    sector:<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
    kelly:<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    journal:<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{p[n]}</svg>;
};

/* ═══════════════════════ AI ANALYSIS ════════════════════════════ */
const genAnalysis = (stock, trades, stockStats) => {
  const ts = trades.filter(t => t.stock === stock && !t.open);
  const st = stockStats.find(s => s.stock === stock);
  if (!ts.length || !st) return null;

  const avgHold = st.avgDays;
  const eventLosses = ts.filter(t => t.pnl < 0 && t.relatedEvents.length > 0);
  const quietLosses = ts.filter(t => t.pnl < 0 && t.relatedEvents.length === 0);
  const bigWins = ts.filter(t => t.pnlPct > 8);
  const bigLosses = ts.filter(t => t.pnlPct < -5);

  const goods=[], bads=[], improves=[];

  if(st.winRate>=60) goods.push(`Win rate of ${st.winRate}% is above the 60% threshold — your entry timing on ${stock} is consistently good.`);
  if(st.roi>10) goods.push(`${st.roi}% ROI significantly outperforms FD/index benchmarks (7-12% annual). You have edge on this stock.`);
  if(bigWins.length) goods.push(`${bigWins.length} trade(s) captured >8% moves — shows you can ride strong trends when fundamentals aligned.`);
  if(avgHold>45) goods.push(`Average hold of ${avgHold} days indicates patience — you're not overtrading and letting gains compound.`);

  if(st.winRate<50) bads.push(`Win rate of ${st.winRate}% means you're losing more often than winning. Review your entry criteria — are you buying breakouts or at resistance?`);
  eventLosses.forEach(t => {
    bads.push(`Trade ${fmtD(t.buyDate)}→${fmtD(t.sellDate)} lost ${t.pnlPct}% during "${t.relatedEvents.map(e=>e.label).join(", ")}". This was a known macro risk — pre-hedging would've saved ${fmtA(Math.abs(t.pnl))}.`);
  });
  if(bigLosses.length > bigWins.length) bads.push(`You have ${bigLosses.length} big losses (>5%) vs ${bigWins.length} big wins (>8%). Your winners need to be bigger or you need tighter stop-losses.`);
  quietLosses.forEach(t => {
    bads.push(`Loss on ${fmtD(t.buyDate)}→${fmtD(t.sellDate)} had no macro catalyst — likely entry at wrong level or no stop-loss discipline.`);
  });

  if(avgHold < 15 && st.winRate < 55) improves.push(`Short average hold (${avgHold}d) + low win rate = overtrading signal. Reduce trade frequency by 50%, focus on high-conviction setups.`);
  if(avgHold > 90) improves.push(`${avgHold}-day average hold is long. Consider partial profit-booking at 8-12% to reduce drawdown risk on long holds.`);
  improves.push(`Use Nifty50 correlation: if ${stock} falls while Nifty is rising — it's a stock-specific problem. If both fall — it's macro. Your response should differ.`);
  if(st.trades >= 3) improves.push(`With ${st.trades} trades, you have enough data. Track your best entry conditions (time of year, market mood, stock events) and build a personal checklist.`);
  improves.push(`Consider setting a max loss per trade at 3-5% of invested amount. Your worst ${stock} trade was ${fmtC(st.maxLoss)} — a hard stop would've limited that.`);

  return {goods, bads, improves, trades:ts, stats:st, avgHold};
};

/* ════════════════════ AI SETTINGS HELPER ═══════════════════════ */
const AI_OPTIONS = [
  {id:"groq",name:"Groq (Llama 3.3)",free:true,speed:"~1s",quality:"★★★★☆",setup:"Get API key at console.groq.com — free tier 30 req/min",endpoint:"https://api.groq.com/openai/v1/chat/completions",model:"llama-3.3-70b-versatile",recommended:true},
  {id:"together",name:"Together AI (Mixtral)",free:true,speed:"~2s",quality:"★★★☆☆",setup:"Free $25 credits at api.together.xyz",endpoint:"https://api.together.xyz/v1/chat/completions",model:"mistralai/Mixtral-8x7B-Instruct-v0.1"},
  {id:"openrouter",name:"OpenRouter (Free models)",free:true,speed:"~3s",quality:"★★★☆☆",setup:"Free at openrouter.ai — access 20+ free models",endpoint:"https://openrouter.ai/api/v1/chat/completions",model:"meta-llama/llama-3.1-8b-instruct:free"},
  {id:"anthropic",name:"Claude (Anthropic)",free:false,speed:"~2s",quality:"★★★★★",setup:"api.anthropic.com — pay-per-use, best quality",endpoint:"https://api.anthropic.com/v1/messages",model:"claude-3-haiku-20240307"},
];

/* ════════════════════════ NIFTY TICKER ══════════════════════════ */
const TickerBar = ({niftyData}) => {
  const latest = niftyData[niftyData.length-1];
  const prev = niftyData[niftyData.length-2];
  const ch = latest?.nifty - prev?.nifty;
  const chP = prev?.nifty ? (ch/prev.nifty*100).toFixed(2) : 0;
  const items = [
    {n:"NIFTY 50",  v:latest?.nifty?.toLocaleString("en-IN"), up:ch>=0,  p:chP},
    {n:"SENSEX",    v:(latest?.nifty*3.32).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,","), up:ch>=0, p:chP},
    {n:"BANK NIFTY",v:(latest?.nifty*1.28).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,","), up:ch>=0, p:chP},
    {n:"IT INDEX",  v:(latest?.nifty*.82).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,","),  up:ch<0,  p:(-chP*.7).toFixed(2)},
    {n:"USD/INR",v:"83.42",up:true,p:"0.14"},
    {n:"CRUDE",v:"$82.4",up:false,p:"-0.72"},
    {n:"GOLD",v:"72,480",up:true,p:"0.32"},
    {n:"VIX",v:"14.2",up:false,p:"-2.8"},
  ];
  return (
    <div className="ticker">
      <div className="ticker-track">
        {[...items,...items].map((it,idx)=>(
          <div key={idx} className="tick-item">
            <span className="tick-name">{it.n}</span>
            <span className="tick-val">{it.v}</span>
            <span className={"tick-chg "+(it.up?"up":"down")}>{it.up?"▲":"▼"} {Math.abs(it.p)}%</span>
          </div>
        ))}
      </div>
      <div className="ticker-fade"/>
    </div>
  );
};

/* ══════════════════════ DASHBOARD ═══════════════════════════════ */
const Dashboard = ({trades,overall,stockStats,equityCurve,onStock}) => {
  const sectors = useMemo(()=>{
    const m={};
    trades.filter(t=>!t.open).forEach(t=>{
      const sec=t.sector||SECTORS.DEFAULT;
      if(!m[sec]) m[sec]={sector:sec,pnl:0,trades:0};
      m[sec].pnl+=t.pnl; m[sec].trades++;
    });
    return Object.values(m).sort((a,b)=>b.pnl-a.pnl);
  },[trades]);

  const monthlyPnl = useMemo(()=>{
    const m={};
    trades.filter(t=>!t.open&&t.sellDate).forEach(t=>{
      const k=t.sellDate.slice(0,7);
      if(!m[k]) m[k]={month:k,pnl:0};
      m[k].pnl+=t.pnl;
    });
    return Object.values(m).sort((a,b)=>a.month.localeCompare(b.month));
  },[trades]);

  return (
    <div className="gcol fa">
      {/* KPIs */}
      <div className="g4" style={{gap:12}}>
        {[
          {l:"Net P&L",     v:fmtC(overall.totalPnl),     sub:overall.roi+"% return",        clr:overall.totalPnl>=0?"var(--g)":"var(--r)",  icon:"↑↓"},
          {l:"Win Rate",    v:overall.winRate+"%",          sub:overall.wins+"W / "+overall.losses+"L", clr:"var(--acc-hi)", icon:"◎"},
          {l:"Capital",     v:fmtA(overall.currentCapital),sub:"Base "+fmtA(overall.startingCapital),  clr:"var(--cyan)",   icon:"◈"},
          {l:"Avg Hold",    v:overall.avgDays+"d",          sub:"Best: "+(overall.bestTrade?.stock||"—"),clr:"var(--amber)",  icon:"◷"},
        ].map((k,i)=>(
          <div key={i} className="kpi">
            <div style={{position:"absolute",top:-30,right:-30,width:90,height:90,borderRadius:"50%",background:k.clr,opacity:.06,pointerEvents:"none"}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <span style={{fontSize:9,color:"var(--t3)",letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>{k.l}</span>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:16,color:k.clr,opacity:.7,fontWeight:600}}>{k.icon}</span>
            </div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:22,fontWeight:600,color:k.clr,lineHeight:1,marginBottom:6,letterSpacing:"-0.5px"}}>{k.v}</div>
            <div style={{fontSize:10,color:"var(--t3)",fontWeight:500}}>{k.sub}</div>
          </div>
        ))}
      </div>

            {/* Equity + Monthly */}
      <div className="g21">
        <div className="card">
          <div className="ch"><div><div className="ct">Equity Curve</div><div className="cs">Cumulative realized P&L</div></div><span className={`bd ${overall.totalPnl>=0?"bd-g":"bd-r"}`}>{fmtC(overall.totalPnl)}</span></div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={equityCurve} margin={{top:4,right:4,left:0,bottom:0}}>
              <defs>
                <linearGradient id="eqg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
              <XAxis dataKey="date" tick={{fontSize:8,fill:"var(--t3)"}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fontSize:8,fill:"var(--t3)"}} tickLine={false} axisLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<TT/>} wrapperStyle={{outline:"none"}} cursor={{fill:"rgba(255,255,255,.04)"}}/>
              <ReferenceLine y={0} stroke="rgba(255,255,255,.08)"/>
              <Area type="monotone" dataKey="cumPnl" name="Equity" stroke="#6366f1" strokeWidth={2} fill="url(#eqg)" dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="ch"><div className="ct">Monthly P&L</div></div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={monthlyPnl} margin={{top:4,right:4,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:7.5,fill:"var(--t3)"}} tickLine={false} axisLine={false}/>
              <YAxis tick={{fontSize:7.5,fill:"var(--t3)"}} tickLine={false} axisLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={<TT/>} wrapperStyle={{outline:"none"}} cursor={{fill:"rgba(255,255,255,.04)"}}/>
              <ReferenceLine y={0} stroke="rgba(255,255,255,.1)"/>
              <Bar dataKey="pnl" name="P&L" radius={[3,3,0,0]}>
                {monthlyPnl.map((m,i)=><Cell key={i} fill={m.pnl>=0?"var(--g)":"var(--r)"}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stock PnL + Sector */}
      <div className="g2">
        <div className="card" style={{overflow:"hidden"}}>
          <div className="ch"><div className="ct">P&L by Stock</div><div className="cs">{stockStats.length} positions · sorted by P&L</div></div>
          {/* Dynamic height: 28px per bar, minimum 180px */}
          <div style={{overflowY:"auto",maxHeight:380}}>
            <div style={{height:Math.max(180, stockStats.length*28)}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockStats} margin={{top:4,right:80,left:0,bottom:4}} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" horizontal={false}/>
                  <XAxis type="number" tick={{fontSize:8,fill:"var(--t3)"}} tickLine={false} axisLine={false} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`}/>
                  <YAxis type="category" dataKey="stock" tick={{fontSize:9.5,fill:"var(--t1)",fontWeight:500}} tickLine={false} axisLine={false} width={80}/>
                  <Tooltip
                    wrapperStyle={{outline:"none",filter:"drop-shadow(0 8px 24px rgba(0,0,0,.7))"}}
                    cursor={{fill:"rgba(255,255,255,.04)",radius:4}}
                    content={({active,payload})=>{
                      if(!active||!payload?.length) return null;
                      const d=payload[0].payload;
                      return(
                        <div style={{background:"rgba(13,13,22,.95)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"10px 14px",fontSize:11,backdropFilter:"blur(12px)",minWidth:160}}>
                          <div style={{fontWeight:700,marginBottom:6,fontSize:12,color:"var(--t1)"}}>{d.stock}</div>
                          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:14,fontWeight:600,color:d.totalPnl>=0?"var(--g)":"var(--r)",marginBottom:4}}>{fmtC(d.totalPnl)}</div>
                          <div style={{color:"var(--t3)",fontSize:10}}>{d.trades} trades · {d.winRate}% win · {d.roi}% ROI</div>
                        </div>
                      );
                    }}/>
                  <ReferenceLine x={0} stroke="rgba(255,255,255,.15)"/>
                  <Bar dataKey="totalPnl" name="Total P&L" radius={[0,3,3,0]} barSize={18}>
                    {stockStats.map((s,i)=><Cell key={i} fill={s.totalPnl>=0?"var(--g)":"var(--r)"}/>)}
                    <LabelList dataKey="totalPnl" position="right" content={({x,y,width,height,value})=>(
                      <text x={(x||0)+(width||0)+6} y={(y||0)+(height||0)/2} dy="0.35em" fill={value>=0?"var(--g)":"var(--r)"} fontSize={9} fontWeight={600} fontFamily="'IBM Plex Mono',monospace">{fmtC(value)}</text>
                    )}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="ch"><div className="ct">Sector Breakdown</div><div className="cs">by capital deployed</div></div>
          {sectors.length===0
            ?<div style={{textAlign:"center",padding:30,color:"var(--t3)",fontSize:11}}>No sector data — import trades first</div>
            :(
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={sectors.map(s=>({...s,absSize:Math.max(Math.abs(s.pnl),1)}))}
                    dataKey="absSize" nameKey="sector" cx="50%" cy="50%" outerRadius={60} innerRadius={30}
                    label={false}>
                    {sectors.map((_,i)=><Cell key={i} fill={["#00f0c0","#4d8aff","#b06eff","#ffc542","#ff7a3d","#00d4ff","#ff3d5a","#39d353"][i%8]}/>)}
                  </Pie>
                  <Tooltip formatter={(v,n,p)=>[fmtC(p.payload.pnl),p.payload.sector]}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:"flex",flexDirection:"column",gap:5,marginTop:4}}>
                {sectors.map((s,i)=>(
                  <div key={s.sector} style={{display:"flex",alignItems:"center",gap:8,padding:"3px 0"}}>
                    <div style={{width:8,height:8,borderRadius:2,flexShrink:0,background:["#00f0c0","#4d8aff","#b06eff","#ffc542","#ff7a3d","#00d4ff","#ff3d5a","#39d353"][i%8]}}/>
                    <span style={{fontSize:10,color:"var(--t2)",flex:1}}>{s.sector}</span>
                    <span style={{fontSize:9.5,color:"var(--t3)"}}>{s.trades}T</span>
                    <span className={s.pnl>=0?"green":"red"} style={{fontSize:10.5,fontWeight:600,minWidth:80,textAlign:"right"}}>{fmtC(s.pnl)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top gainers/losers */}
      <div className="g2">
        {[{title:"🏆 Top Gainers",data:[...stockStats].slice(0,4)},{title:"📉 Top Losers",data:[...stockStats].sort((a,b)=>a.totalPnl-b.totalPnl).slice(0,4)}].map(({title,data})=>(
          <div key={title} className="card">
            <div className="ch"><div className="ct">{title}</div></div>
            {data.map(s=>(
              <div key={s.stock} onClick={()=>onStock(s.stock)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid var(--b1)",cursor:"pointer"}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>{s.stock}</div>
                  <div style={{fontSize:9.5,color:"var(--t3)"}}>{s.sector} · {s.trades}T · {s.winRate}% WR</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div className={s.totalPnl>=0?"green":"red"} style={{fontWeight:600}}>{fmtC(s.totalPnl)}</div>
                  <div style={{fontSize:9.5,color:"var(--t3)"}}>{s.roi}% ROI</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════ TRADE HISTORY ═══════════════════════════ */
const History = ({trades,onStock,onAnalyze,tags,setTags,groqKey,onEditTag}) => {
  const [fStock,setFS]=useState("ALL");
  const [sortBy,setSort]=useState("sellDate");
  const [fResult,setFR]=useState("ALL");
  const stocks=["ALL",...new Set(trades.map(t=>t.stock))];

  const filtered = trades
    .filter(t=>fStock==="ALL"||t.stock===fStock)
    .filter(t=>fResult==="ALL"||(fResult==="WIN"&&t.pnl>0)||(fResult==="LOSS"&&t.pnl<=0)||(fResult==="OPEN"&&t.open))
    .sort((a,b)=>sortBy==="pnl"?b.pnl-a.pnl:new Date(b.sellDate||b.buyDate)-new Date(a.sellDate||a.buyDate));

  return (
    <div className="gcol fa">
      <div className="card" style={{padding:"10px 14px"}}>
        <div className="row" style={{flexWrap:"wrap",gap:8}}>
          <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,fontSize:12,color:"var(--t2)"}}>Stock:</span>
          {stocks.map(s=><span key={s} className={`chip ${fStock===s?"chip-on":"chip-off"}`} onClick={()=>setFS(s)}>{s}</span>)}
          <span style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
            {["ALL","WIN","LOSS","OPEN"].map(r=><span key={r} className={`chip ${fResult===r?"chip-on":"chip-off"}`} onClick={()=>setFR(r)}>{r}</span>)}
            <select className="sel" value={sortBy} onChange={e=>setSort(e.target.value)}>
              <option value="sellDate">↓ Date</option>
              <option value="pnl">↓ P&L</option>
            </select>
          </span>
        </div>
      </div>
      <div className="card" style={{padding:0,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table className="tbl">
            <thead><tr>{["Stock / Instrument","Seg","Buy","Buy ₹","Sell","Sell ₹","Qty","P&L","%","Days","Strategy","Events","Action"].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(t=>(
                <tr key={t.id}>
                  <td>
                    <span onClick={()=>onStock(t.stock)} style={{color:"var(--acc2)",cursor:"pointer",fontWeight:600}}>{t.stock}</span>
                    {t.display&&t.display!==t.stock&&<div style={{fontSize:8.5,color:"var(--t4)",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.display}</div>}
                    {t.source==="imported"&&<span style={{fontSize:8,color:"var(--t4)",marginLeft:4}}>●</span>}
                    {t.source==="fno-imported"&&<span className="bd bd-v" style={{fontSize:7.5,marginLeft:4}}>F&O</span>}
                  </td>
                  <td>
                    {t.instrType?<span className={`bd ${t.instrType==="FUT"?"bd-b":t.instrType==="CALL"?"bd-g":"bd-r"}`}>{t.instrType}{t.strike?` ${t.strike}`:""}</span>:<span style={{fontSize:9.5,color:"var(--t3)"}}>{t.sector||"EQ"}</span>}
                  </td>
                  <td style={{color:"var(--t2)"}}>{fmtD(t.buyDate)}</td>
                  <td>₹{t.buyPrice?.toLocaleString("en-IN")}</td>
                  <td style={{color:"var(--t2)"}}>{t.open?<span className="bd bd-y pulsing">OPEN</span>:fmtD(t.sellDate)}</td>
                  <td>{t.open?"—":"₹"+t.sellPrice?.toLocaleString("en-IN")}</td>
                  <td>{t.qty}</td>
                  <td className={t.open?"muted":t.pnl>=0?"green":"red"} style={{fontWeight:600}}>{t.open?"—":fmtC(t.pnl)}</td>
                  <td>{t.open?<span className="bd bd-y">OPEN</span>:<span className={`bd ${t.pnlPct>=0?"bd-g":"bd-r"}`}>{fmtP(t.pnlPct)}</span>}</td>
                  <td style={{color:"var(--t2)"}}>{t.days||"—"}</td>
                  <td>
                    <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                      {(tags[t.id]||[]).map(tg=><span key={tg} className="bd bd-v" style={{fontSize:8.5}}>{tg}</span>)}
                      <span className="bd bd-b" style={{cursor:"pointer",fontSize:8.5}} onClick={()=>onEditTag(t.id)}>+ tag</span>
                    </div>
                  </td>
                  <td>
                    <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                      {t.relatedEvents.map(e=>(
                        <span key={e.date} className="bd" style={{background:`${eventColor(e.type)}15`,color:eventColor(e.type),border:`1px solid ${eventColor(e.type)}30`,fontSize:8.5}} title={e.detail}>
                          {e.impact<0?"⚠":"✦"} {e.label}
                        </span>
                      ))}
                      {!t.relatedEvents.length&&<span style={{color:"var(--t4)",fontSize:9}}>—</span>}
                    </div>
                  </td>
                  <td>
                    {!t.open&&<button className="btn btn-g btn-sm" style={{color:groqKey?"var(--y)":"var(--acc)",fontWeight:600}} onClick={()=>onAnalyze(t.stock)}>{groqKey?"⚡ Groq":"✨ AI"}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════ STOCK DETAIL ══════════════════════════════ */
const StockDetail = ({stock,trades,niftyData,onAnalyze}) => {
  const myTrades = trades.filter(t=>t.stock===stock);
  const stats = buildStockStats(myTrades.filter(t=>!t.open))[0];
  if(!myTrades.length) return <div className="fa" style={{padding:40,textAlign:"center",color:"var(--t3)"}}>No trades found for {stock}</div>;

  const allDates=myTrades.flatMap(t=>[t.buyDate,t.sellDate]).filter(Boolean).sort();
  const minDate=allDates[0], maxDate=allDates[allDates.length-1];
  const chartData=niftyData.filter(n=>n.date>=minDate&&n.date<=maxDate);
  const nMin=Math.min(...chartData.map(d=>d.nifty));
  const normalized=chartData.map(d=>({...d,niftyNorm:parseFloat(((d.nifty-nMin)/nMin*100).toFixed(2))}));
  const events=MARKET_EVENTS.filter(e=>e.date>=minDate&&e.date<=maxDate);
  // Find events relevant to this stock specifically
  const stockEvents=MARKET_EVENTS.filter(e=>
    (e.date>=minDate&&e.date<=maxDate) ||
    e.stocks.includes(stock)
  );

  return (
    <div className="gcol fa">
      <div className="card" style={{background:"linear-gradient(135deg,rgba(124,58,237,.08),rgba(6,182,212,.05))"}}>
        <div className="row" style={{justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:26,fontWeight:800,letterSpacing:-1}}>{stock}</div>
            <div style={{color:"var(--t2)",fontSize:11,marginTop:3}}>{getSector({stock,segment:myTrades[0]?.segment})} · {myTrades.length} trades · {fmtD(minDate)} → {fmtD(maxDate)}</div>
          </div>
          <div className="row" style={{gap:20,flexWrap:"wrap"}}>
            {[{l:"P&L",v:fmtC(stats?.totalPnl||0),c:stats?.totalPnl>=0?"green":"red"},{l:"ROI",v:(stats?.roi||0)+"%",c:"acc"},{l:"Win Rate",v:(stats?.winRate||0)+"%",c:"acc2"},{l:"Avg Hold",v:(stats?.avgDays||0)+"d",c:"muted"}].map(k=>(
              <div key={k.l}>
                <div style={{fontSize:9,color:"var(--t3)",letterSpacing:1,textTransform:"uppercase"}}>{k.l}</div>
                <div className={k.c} style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:20,fontWeight:700}}>{k.v}</div>
              </div>
            ))}
            <button className="btn btn-p" onClick={()=>onAnalyze(stock)}><I n="ai" s={12}/>AI Report</button>
          </div>
        </div>
      </div>

      {/* Nifty context chart */}
      <div className="card">
        <div className="ch"><div><div className="ct">Nifty50 Context During Your {stock} Trades</div><div className="cs">B = Buy entry, S = Sell exit, vertical lines = market events</div></div></div>
        {chartData.length>5?(
          <>
            <ResponsiveContainer width="100%" height={210}>
              <ComposedChart data={normalized} margin={{top:4,right:4,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="niftyg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--cyan)" stopOpacity={.15}/>
                    <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
                <XAxis dataKey="date" tick={{fontSize:7.5,fill:"var(--t3)"}} tickLine={false} axisLine={false}/>
                <YAxis tick={{fontSize:7.5,fill:"var(--t3)"}} tickLine={false} axisLine={false} unit="%"/>
                <Tooltip content={<TT/>} wrapperStyle={{outline:"none"}} cursor={{fill:"rgba(255,255,255,.04)"}}/>
                {events.map(e=><ReferenceLine key={e.date} x={e.date} stroke={eventColor(e.type)} strokeDasharray="2 4" opacity={.7}/>)}
                <Area type="monotone" dataKey="niftyNorm" name="Nifty %" stroke="var(--cyan)" strokeWidth={1.5} fill="url(#niftyg)" dot={false}/>
                {myTrades.flatMap(t=>{
                  const dots=[];
                  const buyPt=normalized.find(d=>d.date===t.buyDate);
                  if(buyPt) dots.push(<ReferenceDot key={`b${t.id}`} x={t.buyDate} y={buyPt.niftyNorm} r={7} fill="#6366f1" stroke="var(--bg)" strokeWidth={2} label={{value:"B",position:"center",fill:"var(--bg)",fontSize:7,fontWeight:700}}/>);
                  if(t.sellDate){
                    const sellPt=normalized.find(d=>d.date===t.sellDate);
                    if(sellPt) dots.push(<ReferenceDot key={`s${t.id}`} x={t.sellDate} y={sellPt.niftyNorm} r={7} fill={t.pnl>=0?"var(--g)":"var(--r)"} stroke="var(--bg)" strokeWidth={2} label={{value:"S",position:"center",fill:"var(--bg)",fontSize:7,fontWeight:700}}/>);
                  }
                  return dots;
                })}
              </ComposedChart>
            </ResponsiveContainer>
            <div className="row" style={{flexWrap:"wrap",gap:12,marginTop:8}}>
              {[{label:"Buy date",bg:"var(--acc)",t:"B"},{label:"Sell (profit)",bg:"var(--g)",t:"S"},{label:"Sell (loss)",bg:"var(--r)",t:"S"}].map(l=>(
                <span key={l.label} style={{display:"flex",alignItems:"center",gap:5,fontSize:8.5,color:"var(--t2)"}}>
                  <span style={{width:14,height:14,borderRadius:"50%",background:l.bg,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,color:"var(--bg)"}}>{l.t}</span>{l.label}
                </span>
              ))}
              {events.map(e=>(
                <span key={e.date} style={{display:"flex",alignItems:"center",gap:4,fontSize:8.5,color:"var(--t2)"}}>
                  <span style={{width:7,height:7,borderRadius:"50%",background:eventColor(e.type),display:"inline-block"}}/>
                  {e.label}
                </span>
              ))}
            </div>
          </>
        ):(
          <div style={{background:"var(--s2)",borderRadius:8,padding:"14px 16px",color:"var(--t3)",fontSize:11}}>
            Chart data not available for this date range. Showing relevant market events below.
          </div>
        )}

        {/* Always show stock-relevant events list */}
        {stockEvents.length>0&&(
          <div style={{marginTop:14}}>
            <div style={{fontSize:9.5,color:"var(--t3)",letterSpacing:.8,marginBottom:8,textTransform:"uppercase"}}>Market Events Relevant to {stock}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {stockEvents.map(e=>(
                <div key={e.date+e.label} style={{display:"flex",gap:10,padding:"8px 10px",borderRadius:6,background:"var(--s2)",border:`1px solid ${eventColor(e.type)}20`,alignItems:"flex-start"}}>
                  <div style={{flexShrink:0,marginTop:1}}>
                    <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:eventColor(e.type)}}/>
                  </div>
                  <div style={{flex:1}}>
                    <div className="row" style={{gap:8,marginBottom:2}}>
                      <span style={{fontWeight:600,fontSize:11}}>{e.label}</span>
                      <span style={{fontSize:9.5,color:"var(--t3)"}}>{fmtD(e.date)}</span>
                      <span style={{fontSize:9,color:e.impact>0?"var(--g)":e.impact<0?"var(--r)":"var(--t3)"}}>{e.impact>0?"▲ Bullish":e.impact<0?"▼ Bearish":"— Neutral"}</span>
                    </div>
                    <div style={{fontSize:10.5,color:"var(--t2)",lineHeight:1.6}}>{e.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="card" style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 18px 10px"}}><div className="ct">Trade Log — {stock}</div></div>
        <table className="tbl">
          <thead><tr>{["Buy","Buy ₹","Sell","Sell ₹","Qty","P&L","%","Days","Events During Trade"].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {myTrades.map(t=>(
              <tr key={t.id}>
                <td>{fmtD(t.buyDate)}</td>
                <td>₹{t.buyPrice?.toLocaleString("en-IN")}</td>
                <td>{t.open?<span className="bd bd-y pulsing">OPEN</span>:fmtD(t.sellDate)}</td>
                <td>{t.open?"—":"₹"+t.sellPrice?.toLocaleString("en-IN")}</td>
                <td>{t.qty}</td>
                <td className={t.open?"muted":t.pnl>=0?"green":"red"} style={{fontWeight:600}}>{t.open?"—":fmtC(t.pnl)}</td>
                <td>{t.open?<span className="bd bd-y">OPEN</span>:<span className={`bd ${t.pnlPct>=0?"bd-g":"bd-r"}`}>{fmtP(t.pnlPct)}</span>}</td>
                <td>{t.days||"—"}</td>
                <td>
                  {t.relatedEvents?.length>0?(
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {t.relatedEvents.map(e=><span key={e.date} className="bd" style={{background:`${eventColor(e.type)}15`,color:eventColor(e.type),border:`1px solid ${eventColor(e.type)}30`,fontSize:8.5}}>{e.impact<0?"⚠":"✦"} {e.label}</span>)}
                    </div>
                  ):<span style={{color:"var(--t4)",fontSize:9}}>No major events</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ══════════════════════ EVENTS VIEW ═════════════════════════════ */
const EventsView = ({trades}) => {
  const [fType,setFT]=useState("all");
  const types=["all","macro","global","company","geopolitical","market","event"];

  const niftyWithEv = NIFTY_DATA.slice(0,450).map(d=>{
    const ev=MARKET_EVENTS.find(e=>e.date===d.date);
    return {...d,evVal:ev?d.nifty:null,evLabel:ev?.label,evType:ev?.type,evImpact:ev?.impact};
  });

  const filtered=MARKET_EVENTS.filter(e=>fType==="all"||e.type===fType);

  // For each event, count how many of user's trades were active
  const evWithTrades=filtered.map(e=>({
    ...e,
    affectedTrades:trades.filter(t=>{
      const ed=new Date(e.date);
      return !t.open&&ed>=new Date(t.buyDate)&&ed<=new Date(t.sellDate);
    })
  }));

  return (
    <div className="gcol fa">
      <div className="card">
        <div className="ch"><div><div className="ct">Nifty50 with Major Events</div><div className="cs">Green = bullish · Red = bearish</div></div></div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={niftyWithEv} margin={{top:16,right:4,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
            <XAxis dataKey="date" tick={{fontSize:7.5,fill:"var(--t3)"}} tickLine={false} axisLine={false}/>
            <YAxis tick={{fontSize:7.5,fill:"var(--t3)"}} tickLine={false} axisLine={false}/>
            <Tooltip
              wrapperStyle={{outline:"none",filter:"drop-shadow(0 8px 20px rgba(0,0,0,.7))"}}
              cursor={{stroke:"rgba(255,255,255,.08)",strokeWidth:1}}
              content={({active,payload})=>{
                if(!active||!payload?.[0]) return null;
                const d=payload[0].payload;
                return(
                  <div style={{background:"rgba(13,13,22,.95)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"10px 14px",fontSize:10.5,backdropFilter:"blur(12px)"}}>
                    <div style={{color:"var(--t3)",fontSize:8.5,marginBottom:6}}>{d.date}</div>
                    <div style={{color:"var(--t1)"}}>Nifty: <span style={{color:"var(--cyan)",fontWeight:600,fontFamily:"'IBM Plex Mono',monospace"}}>{d.nifty?.toLocaleString("en-IN")}</span></div>
                    {d.evLabel&&<div style={{marginTop:5,color:eventColor(d.evType),fontSize:10}}>⚡ {d.evLabel}</div>}
                  </div>
                );
              }}/>
            <Line type="monotone" dataKey="nifty" stroke="var(--cyan)" strokeWidth={1.5} dot={false}/>
            {/* Fixed: ReferenceDot renders reliably vs Scatter which silently fails on null values */}
            {MARKET_EVENTS.map(ev=>{
              const matchDay = niftyWithEv.find(d=>d.date===ev.date);
              if(!matchDay) return null;
              const c = ev.impact<0?"var(--r)":"var(--g)";
              return (
                <ReferenceDot key={ev.date} x={ev.date} y={matchDay.nifty}
                  r={6} fill={c} fillOpacity={0.9} stroke={c} strokeWidth={1}
                  label={{value:ev.label.split(" ")[0], position:"top", fill:c, fontSize:7.5, fontWeight:600}}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="card" style={{padding:"10px 14px"}}>
        <div className="row" style={{flexWrap:"wrap",gap:8}}>
          {types.map(t=><span key={t} className={`chip ${fType===t?"chip-on":"chip-off"}`} onClick={()=>setFT(t)} style={{textTransform:"capitalize"}}>{t}</span>)}
        </div>
      </div>
      <div className="g2" style={{gap:12}}>
        {evWithTrades.map(e=>(
          <div key={e.date} className="card" style={{padding:"14px 16px",borderLeft:`3px solid ${eventColor(e.type)}`}}>
            <div className="row" style={{justifyContent:"space-between",marginBottom:8,flexWrap:"wrap",gap:6}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,fontSize:13}}>{e.label}</div>
              <div className="row" style={{gap:5}}>
                <span className="bd" style={{background:`${eventColor(e.type)}15`,color:eventColor(e.type),border:`1px solid ${eventColor(e.type)}25`,textTransform:"capitalize"}}>{e.type}</span>
                <span className={`bd ${e.impact>0?"bd-g":"bd-r"}`}>{e.impact>0?"↑ Bull":"↓ Bear"}</span>
                {e.affectedTrades.length>0&&<span className="bd bd-y">{e.affectedTrades.length} of your trades</span>}
              </div>
            </div>
            <div style={{fontSize:10.5,color:"var(--t2)",lineHeight:1.65,marginBottom:8}}>{e.detail}</div>
            {e.affectedTrades.length>0&&(
              <div style={{background:"var(--s2)",borderRadius:6,padding:"8px 10px",fontSize:9.5,color:"var(--t2)"}}>
                <span style={{color:"var(--y)",marginRight:6}}>⚠ Your trades during this:</span>
                {e.affectedTrades.map(t=>(
                  <span key={t.id} className={`bd ${t.pnl>=0?"bd-g":"bd-r"}`} style={{marginRight:4,fontSize:8.5}}>{t.stock} {fmtC(t.pnl)}</span>
                ))}
              </div>
            )}
            <div style={{fontSize:8.5,color:"var(--t4)",marginTop:8}}>{fmtDLong(e.date)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════ CALENDAR VIEW ═══════════════════════════ */
const CalendarView = ({trades}) => {
  const [year,setYear]=useState("2024");
  const years=[...new Set(trades.map(t=>t.sellDate?.slice(0,4)||t.buyDate?.slice(0,4)))].filter(Boolean).sort();

  // Build trade activity map
  const actMap=useMemo(()=>{
    const m={};
    trades.forEach(t=>{
      [t.buyDate,t.sellDate].filter(Boolean).forEach(d=>{
        if(d.startsWith(year)){
          if(!m[d]) m[d]={buys:0,sells:0,pnl:0,trades:[]};
          if(d===t.buyDate) m[d].buys++;
          if(d===t.sellDate){m[d].sells++;m[d].pnl+=t.pnl;m[d].trades.push(t);}
        }
      });
    });
    return m;
  },[trades,year]);

  const maxPnl=Math.max(...Object.values(actMap).map(v=>Math.abs(v.pnl)),1);
  const months=Array.from({length:12},(_,i)=>i);
  const monthNames=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days=["S","M","T","W","T","F","S"];

  const getCellColor=(date)=>{
    const info=actMap[date];
    if(!info) return "var(--s2)";
    if(info.pnl>0) return `rgba(0,201,141,${0.15+0.7*(info.pnl/maxPnl)})`;
    if(info.pnl<0) return `rgba(255,61,90,${0.15+0.7*(Math.abs(info.pnl)/maxPnl)})`;
    return "rgba(77,138,255,.25)";
  };

  // GitHub-style contribution chart
  const startDate=new Date(`${year}-01-01`);
  const endDate=new Date(`${year}-12-31`);
  const allWeeks=[];
  let curDate=new Date(startDate);
  curDate.setDate(curDate.getDate()-curDate.getDay()); // start from Sunday
  while(curDate<=endDate){
    const week=[];
    for(let d=0;d<7;d++){
      const dateStr=curDate.toISOString().split("T")[0];
      week.push({date:dateStr,inYear:curDate.getFullYear()===parseInt(year)});
      curDate=new Date(curDate); curDate.setDate(curDate.getDate()+1);
    }
    allWeeks.push(week);
    curDate=new Date(curDate);
  }

  return (
    <div className="gcol fa">
      <div className="card">
        <div className="ch">
          <div><div className="ct">Trade Activity Calendar</div><div className="cs">Green = profit day · Red = loss day · Blue = entry only</div></div>
          <div className="row" style={{gap:8}}>
            {years.map(y=><span key={y} className={`chip ${year===y?"chip-on":"chip-off"}`} onClick={()=>setYear(y)}>{y}</span>)}
          </div>
        </div>
        <div style={{overflowX:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${allWeeks.length},1fr)`,gap:3,minWidth:allWeeks.length*16}}>
            {allWeeks.map((week,wi)=>
              week.map((day,di)=>{
                const info=actMap[day.date];
                const bg=day.inYear?getCellColor(day.date):"transparent";
                return (
                  <div key={`${wi}-${di}`} title={day.inYear&&info?`${day.date}\n${info.sells} sells · P&L: ${fmtC(info.pnl)}`:""}
                    style={{width:13,height:13,borderRadius:2,background:bg,cursor:info?"pointer":"default",border:info?"1px solid rgba(255,255,255,.1)":"none"}}/>
                );
              })
            )}
          </div>
        </div>
        <div className="row" style={{gap:16,marginTop:12,flexWrap:"wrap"}}>
          <span style={{display:"flex",alignItems:"center",gap:4,fontSize:9}}><span style={{width:12,height:12,borderRadius:2,background:"rgba(0,201,141,.7)",display:"inline-block"}}/>Profit Day</span>
          <span style={{display:"flex",alignItems:"center",gap:4,fontSize:9}}><span style={{width:12,height:12,borderRadius:2,background:"rgba(255,61,90,.7)",display:"inline-block"}}/>Loss Day</span>
          <span style={{display:"flex",alignItems:"center",gap:4,fontSize:9}}><span style={{width:12,height:12,borderRadius:2,background:"rgba(77,138,255,.5)",display:"inline-block"}}/>Entry Day</span>
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="ct" style={{marginBottom:14}}>Monthly Summary {year}</div>
          {months.map(mi=>{
            const monthStr=`${year}-${String(mi+1).padStart(2,"0")}`;
            const monthTrades=trades.filter(t=>(t.sellDate||"").startsWith(monthStr));
            const mpnl=monthTrades.reduce((s,t)=>s+t.pnl,0);
            const mwins=monthTrades.filter(t=>t.pnl>0).length;
            if(!monthTrades.length) return null;
            return (
              <div key={mi} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid var(--b1)"}}>
                <div style={{fontSize:11,color:"var(--t2)",width:40}}>{monthNames[mi]}</div>
                <div style={{flex:1,padding:"0 12px"}}>
                  <div className="mini-prog"><div className="mini-prog-fill" style={{width:`${Math.min(100,Math.abs(mpnl)/maxPnl*100)}%`,background:mpnl>=0?"var(--g)":"var(--r)"}}/></div>
                </div>
                <div className={mpnl>=0?"green":"red"} style={{fontWeight:600,fontSize:11,minWidth:80,textAlign:"right"}}>{fmtC(mpnl)}</div>
                <div style={{fontSize:9,color:"var(--t3)",minWidth:50,textAlign:"right"}}>{mwins}/{monthTrades.length}W</div>
              </div>
            );
          })}
        </div>
        <div className="card">
          <div className="ct" style={{marginBottom:14}}>Day of Week Analysis</div>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day,di)=>{
            const dayTrades=trades.filter(t=>!t.open&&t.sellDate&&new Date(t.sellDate).getDay()===di);
            const dpnl=dayTrades.reduce((s,t)=>s+t.pnl,0);
            const dmax=Math.max(...["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((_,i)=>Math.abs(trades.filter(t=>!t.open&&t.sellDate&&new Date(t.sellDate).getDay()===i).reduce((s,t)=>s+t.pnl,0))),1);
            if(!dayTrades.length) return <div key={day} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid var(--b1)"}}><span style={{color:"var(--t3)",fontSize:11}}>{day}</span><span style={{color:"var(--t4)",fontSize:9}}>No trades</span></div>;
            return (
              <div key={day} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid var(--b1)"}}>
                <div style={{fontSize:11,color:"var(--t2)",width:35}}>{day}</div>
                <div style={{flex:1,padding:"0 10px"}}>
                  <div className="mini-prog"><div className="mini-prog-fill" style={{width:`${Math.abs(dpnl)/dmax*100}%`,background:dpnl>=0?"var(--g)":"var(--r)"}}/></div>
                </div>
                <div className={dpnl>=0?"green":"red"} style={{fontWeight:600,fontSize:11,minWidth:75,textAlign:"right"}}>{fmtC(dpnl)}</div>
                <div style={{fontSize:9,color:"var(--t3)",minWidth:40,textAlign:"right"}}>{dayTrades.length}T</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════ SECTOR HEATMAP ══════════════════════════ */
const SectorHeatmap = ({trades,onStock}) => {
  const sectorData=useMemo(()=>{
    const m={};
    trades.filter(t=>!t.open).forEach(t=>{
      const sec=t.sector||SECTORS.DEFAULT;
      if(!m[sec]) m[sec]={sector:sec,stocks:{},totalPnl:0,trades:0};
      if(!m[sec].stocks[t.stock]) m[sec].stocks[t.stock]={pnl:0,trades:0,roi:0,invested:0};
      m[sec].stocks[t.stock].pnl+=t.pnl;
      m[sec].stocks[t.stock].trades++;
      m[sec].stocks[t.stock].invested+=t.invested;
      m[sec].totalPnl+=t.pnl;
      m[sec].trades++;
    });
    // calc roi for each stock
    Object.values(m).forEach(s=>Object.values(s.stocks).forEach(st=>{st.roi=st.invested?parseFloat((st.pnl/st.invested*100).toFixed(1)):0;}));
    return Object.values(m).sort((a,b)=>b.totalPnl-a.totalPnl);
  },[trades]);

  const maxAbs=Math.max(...sectorData.flatMap(s=>Object.values(s.stocks).map(st=>Math.abs(st.pnl))),1);

  return (
    <div className="gcol fa">
      <div className="card">
        <div className="ch"><div className="ct">Sector Performance Heatmap</div><div className="cs">Color intensity = P&L magnitude</div></div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:4}}>
          <span style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"var(--t3)"}}>SCALE:</span>
          {[-100,-50,0,50,100].map(v=>(
            <span key={v} style={{fontSize:8.5,padding:"2px 6px",borderRadius:3,background:v<0?`rgba(255,61,90,${Math.abs(v)/100*.7})`:`rgba(0,201,141,${v/100*.7})`}}>{v>0?"+":""}{v}%</span>
          ))}
        </div>
      </div>
      {sectorData.map(sec=>(
        <div key={sec.sector} className="card">
          <div className="ch">
            <div>
              <div className="ct">{sec.sector}</div>
              <div className="cs">{sec.trades} trades · {fmtC(sec.totalPnl)}</div>
            </div>
            <span className={`bd ${sec.totalPnl>=0?"bd-g":"bd-r"}`}>{fmtC(sec.totalPnl)}</span>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {Object.entries(sec.stocks).map(([st,info])=>{
              const intensity=Math.min(0.9,0.15+Math.abs(info.pnl)/maxAbs*.75);
              const bg=info.pnl>=0?`rgba(0,201,141,${intensity})`:`rgba(255,61,90,${intensity})`;
              return (
                <div key={st} onClick={()=>onStock(st)} className="heat-cell" style={{background:bg,minWidth:110,border:"1px solid rgba(255,255,255,.06)"}}>
                  <div style={{fontWeight:600,fontSize:12,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{st}</div>
                  <div style={{fontSize:9,marginTop:3,color:"rgba(255,255,255,.7)"}}>{fmtC(info.pnl)}</div>
                  <div style={{fontSize:8.5,color:"rgba(255,255,255,.5)"}}>{info.roi>0?"+":""}{info.roi}% ROI</div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════ RISK CALCULATOR ════════════════════════ */
const RiskCalc = ({trades,overall}) => {
  const [capital,setCapital]=useState("500000");
  const [riskPct,setRiskPct]=useState("2");

  const kellyData=useMemo(()=>{
    return buildStockStats(trades.filter(t=>!t.open)).map(s=>{
      const wins=trades.filter(t=>t.stock===s.stock&&t.pnl>0);
      const losses=trades.filter(t=>t.stock===s.stock&&t.pnl<0);
      const avgWin=wins.length?wins.reduce((a,t)=>a+t.pnlPct,0)/wins.length:0;
      const avgLoss=losses.length?Math.abs(losses.reduce((a,t)=>a+t.pnlPct,0)/losses.length):1;
      const wr=s.winRate/100;
      const b=avgWin/avgLoss; // reward/risk ratio
      const kelly=wr-(1-wr)/b; // Kelly criterion
      const halfKelly=Math.max(0,kelly/2);
      const riskAmt=parseFloat(capital)*parseFloat(riskPct)/100;
      const suggestedSize=halfKelly*parseFloat(capital);
      return {...s,avgWin:parseFloat(avgWin.toFixed(2)),avgLoss:parseFloat(avgLoss.toFixed(2)),rrRatio:parseFloat(b.toFixed(2)),kelly:parseFloat((kelly*100).toFixed(1)),halfKelly:parseFloat((halfKelly*100).toFixed(1)),suggestedSize:Math.round(suggestedSize),riskAmt:Math.round(riskAmt)};
    });
  },[trades,capital,riskPct]);

  // Max drawdown
  const drawdown=useMemo(()=>{
    let peak=0, maxDD=0;
    const eq=buildEquityCurve(trades);
    eq.forEach(p=>{if(p.cumPnl>peak) peak=p.cumPnl; const dd=peak-p.cumPnl; if(dd>maxDD) maxDD=dd;});
    return {maxDD, maxDDPct:overall.currentCapital?parseFloat((maxDD/overall.currentCapital*100).toFixed(1)):0};
  },[trades,overall]);

  return (
    <div className="gcol fa">
      <div className="g2">
        <div className="card">
          <div className="ct" style={{marginBottom:14}}>Position Size Calculator</div>
          <div className="col">
            <div>
              <div style={{fontSize:10,color:"var(--t3)",marginBottom:6,letterSpacing:.5}}>TOTAL CAPITAL (₹)</div>
              <input className="inp" type="number" value={capital} onChange={e=>setCapital(e.target.value)} placeholder="500000"/>
            </div>
            <div>
              <div style={{fontSize:10,color:"var(--t3)",marginBottom:6,letterSpacing:.5}}>RISK PER TRADE (%)</div>
              <input className="inp" type="number" value={riskPct} onChange={e=>setRiskPct(e.target.value)} placeholder="2" step="0.5"/>
            </div>
            <div style={{background:"var(--s2)",borderRadius:8,padding:"12px 14px",border:"1px solid var(--b2)"}}>
              <div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>MAX RISK PER TRADE</div>
              <div className="yellow" style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:24,fontWeight:700}}>{fmtA(parseFloat(capital)*parseFloat(riskPct)/100)}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="ct" style={{marginBottom:14}}>Portfolio Risk Metrics</div>
          {[
            {l:"Max Drawdown",v:fmtA(drawdown.maxDD),sub:`${drawdown.maxDDPct}% of capital`,c:"red"},
            {l:"Current P&L",v:fmtC(overall.totalPnl),sub:`${overall.roi}% ROI`,c:overall.totalPnl>=0?"green":"red"},
            {l:"Win Rate",v:overall.winRate+"%",sub:"Probability of winning trade",c:"acc"},
            {l:"Avg Hold",v:overall.avgDays+" days",sub:"Average holding period",c:"muted"},
          ].map(k=>(
            <div key={k.l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--b1)"}}>
              <div style={{fontSize:11,color:"var(--t2)"}}>{k.l}<div style={{fontSize:9,color:"var(--t4)"}}>{k.sub}</div></div>
              <div className={k.c} style={{fontWeight:600,fontSize:13}}>{k.v}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 18px 10px"}}><div className="ct">Kelly Criterion — Suggested Position Sizes</div><div className="cs" style={{marginTop:2}}>Half-Kelly used (safer) — based on your historical win rate & R/R</div></div>
        <table className="tbl">
          <thead><tr>{["Stock","Win Rate","Avg Win%","Avg Loss%","R/R Ratio","Kelly%","Suggested Size","Max Risk"].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {kellyData.map(s=>(
              <tr key={s.stock}>
                <td style={{fontWeight:600}}>{s.stock}</td>
                <td><span className={`bd ${s.winRate>=50?"bd-g":"bd-r"}`}>{s.winRate}%</span></td>
                <td className="green">+{s.avgWin}%</td>
                <td className="red">-{s.avgLoss}%</td>
                <td><span className={`bd ${s.rrRatio>=1?"bd-g":"bd-r"}`}>{s.rrRatio}x</span></td>
                <td><span className={`bd ${s.halfKelly>0?"bd-a":"bd-r"}`}>{s.halfKelly>0?s.halfKelly+"%":"Avoid"}</span></td>
                <td className="acc" style={{fontWeight:600}}>{s.halfKelly>0?fmtA(s.suggestedSize):"—"}</td>
                <td className="yellow">{fmtA(s.riskAmt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ══════════════════════ CORRELATION ════════════════════════════ */
const Correlation = ({trades}) => {
  const corrData=useMemo(()=>{
    return trades.filter(t=>!t.open&&t.sellDate).map(t=>{
      const tradeNiftyStart=NIFTY_DATA.find(n=>n.date>=t.buyDate);
      const tradeNiftyEnd=NIFTY_DATA.find(n=>n.date>=t.sellDate);
      const niftyMove=tradeNiftyStart&&tradeNiftyEnd?parseFloat(((tradeNiftyEnd.nifty-tradeNiftyStart.nifty)/tradeNiftyStart.nifty*100).toFixed(2)):0;
      const stockMove=t.pnlPct;
      const alpha=parseFloat((stockMove-niftyMove).toFixed(2));
      return {...t,niftyMove,stockMove,alpha,type:alpha>2?"Alpha":alpha<-2?"Drag":"Tracking"};
    });
  },[trades]);

  const stats={
    alpha:corrData.filter(t=>t.type==="Alpha").length,
    drag:corrData.filter(t=>t.type==="Drag").length,
    tracking:corrData.filter(t=>t.type==="Tracking").length,
    avgAlpha:corrData.length?parseFloat((corrData.reduce((s,t)=>s+t.alpha,0)/corrData.length).toFixed(1)):0,
  };

  return (
    <div className="gcol fa">
      <div className="g4" style={{gap:12}}>
        {[
          {l:"Alpha Trades",v:stats.alpha,sub:"Beat Nifty by >2%",c:"green"},
          {l:"Drag Trades",v:stats.drag,sub:"Underperformed by >2%",c:"red"},
          {l:"Tracking",v:stats.tracking,sub:"Moved with market",c:"muted"},
          {l:"Avg Alpha",v:stats.avgAlpha+"%",sub:"Your edge over Nifty",c:stats.avgAlpha>=0?"acc":"red"},
        ].map((k,i)=>(
          <div key={i} className="card" style={{padding:"14px 16px"}}>
            <div style={{fontSize:9,color:"var(--t3)",letterSpacing:1.5,marginBottom:8,textTransform:"uppercase",fontWeight:700}}>{k.l}</div>
            <div className={k.c} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:20,fontWeight:500}}>{k.v}</div>
            <div style={{fontSize:10,color:"var(--t3)",marginTop:4}}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="ch"><div className="ct">Your Stock Move vs Nifty Move (same period)</div><div className="cs">Top-right = alpha · Bottom-left = market dragged you</div></div>
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart margin={{top:4,right:20,left:0,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)"/>
            <XAxis dataKey="niftyMove" name="Nifty Move" unit="%" tick={{fontSize:9,fill:"var(--t3)"}} tickLine={false} axisLine={false} label={{value:"Nifty % Move",position:"insideBottom",fill:"var(--t3)",fontSize:9,offset:-2}}/>
            <YAxis dataKey="stockMove" name="Stock Move" unit="%" tick={{fontSize:9,fill:"var(--t3)"}} tickLine={false} axisLine={false} label={{value:"Stock % Move",angle:-90,position:"insideLeft",fill:"var(--t3)",fontSize:9}}/>
            <Tooltip wrapperStyle={{outline:"none",filter:"drop-shadow(0 8px 20px rgba(0,0,0,.6))"}} cursor={{fill:"rgba(255,255,255,.04)"}} content={({active,payload})=>{
              if(!active||!payload?.[0]) return null;
              const d=payload[0].payload;
              return(
                <div style={{background:"var(--s2)",border:"1px solid var(--b2)",borderRadius:8,padding:"10px 14px",fontSize:11}}>
                  <div style={{fontWeight:600,marginBottom:4}}>{d.stock}</div>
                  <div>Stock: <span className={d.stockMove>=0?"green":"red"}>{d.stockMove>0?"+":""}{d.stockMove}%</span></div>
                  <div>Nifty: <span style={{color:"var(--acc2)"}}>{d.niftyMove>0?"+":""}{d.niftyMove}%</span></div>
                  <div>Alpha: <span className={d.alpha>=0?"acc":"red"}>{d.alpha>0?"+":""}{d.alpha}%</span></div>
                </div>
              );
            }}/>
            <ReferenceLine x={0} stroke="rgba(255,255,255,.1)"/>
            <ReferenceLine y={0} stroke="rgba(255,255,255,.1)"/>
            <Scatter data={corrData} name="Trades">
              {corrData.map((t,i)=><Cell key={i} fill={t.type==="Alpha"?"var(--g)":t.type==="Drag"?"var(--r)":"var(--acc2)"} fillOpacity={.8}/>)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="card" style={{padding:0,overflow:"hidden"}}>
        <div style={{padding:"14px 18px 10px"}}><div className="ct">Per-Trade Correlation Analysis</div></div>
        <table className="tbl">
          <thead><tr>{["Stock","Period","Stock %","Nifty %","Alpha","Type","P&L"].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {corrData.map(t=>(
              <tr key={t.id}>
                <td style={{fontWeight:600}}>{t.stock}</td>
                <td style={{color:"var(--t3)",fontSize:10}}>{fmtD(t.buyDate)} → {fmtD(t.sellDate)}</td>
                <td className={t.stockMove>=0?"green":"red"}>{t.stockMove>0?"+":""}{t.stockMove}%</td>
                <td style={{color:"var(--acc2)"}}>{t.niftyMove>0?"+":""}{t.niftyMove}%</td>
                <td className={t.alpha>=0?"acc":"red"} style={{fontWeight:600}}>{t.alpha>0?"+":""}{t.alpha}%</td>
                <td><span className={`bd ${t.type==="Alpha"?"bd-g":t.type==="Drag"?"bd-r":"bd-b"}`}>{t.type}</span></td>
                <td className={t.pnl>=0?"green":"red"} style={{fontWeight:600}}>{fmtC(t.pnl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ══════════════════════ JOURNAL ════════════════════════════════
   Company-level journal: select company → see all trades verdict →
   click any trade for individual deep-dive note
════════════════════════════════════════════════════════════════ */
const Journal = ({trades,notes,setNotes}) => {
  const [selStock,setSelStock]=useState(null);
  const [selTrade,setSelTrade]=useState(null); // individual trade drill-down
  const [text,setText]=useState("");
  const [mood,setMood]=useState("neutral");
  const [view,setView]=useState("company"); // "company" | "trade"
  const [saved,setSaved]=useState(false);

  const closedTrades=trades.filter(t=>!t.open);
  // Unique companies
  const companies=[...new Set(closedTrades.map(t=>t.stock))].sort();

  const companyTrades=(stock)=>closedTrades.filter(t=>t.stock===stock);

  // Company-level stats
  const companyStats=(stock)=>{
    const ts=companyTrades(stock);
    if(!ts.length) return null;
    const totalPnl=ts.reduce((s,t)=>s+t.pnl,0);
    const wins=ts.filter(t=>t.pnl>0);
    const losses=ts.filter(t=>t.pnl<0);
    const bestTrade=ts.reduce((b,t)=>t.pnl>b.pnl?t:b,ts[0]);
    const worstTrade=ts.reduce((w,t)=>t.pnl<w.pnl?t:w,ts[0]);
    const avgHold=Math.round(ts.reduce((s,t)=>s+t.days,0)/ts.length);
    const hasNote=notes[`co_${stock}`];
    return {stock,ts,totalPnl,wins,losses,bestTrade,worstTrade,avgHold,winRate:Math.round(wins.length/ts.length*100),hasNote};
  };

  const saveNote=(key)=>{
    if(!text.trim()) return;
    setNotes(prev=>({...prev,[key]:{text,mood,date:new Date().toISOString().split("T")[0]}}));
    setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  };

  const openCompany=(stock)=>{
    setSelStock(stock);
    setSelTrade(null);
    setView("company");
    const existing=notes[`co_${stock}`];
    setText(existing?.text||"");
    setMood(existing?.mood||"neutral");
  };

  const openTrade=(t)=>{
    setSelTrade(t);
    setView("trade");
    const existing=notes[t.id];
    setText(existing?.text||"");
    setMood(existing?.mood||"neutral");
  };

  const MOODS=["😤 FOMO","😰 Fear","😎 Confident","🤔 Uncertain","😌 Disciplined","😡 Revenge"];

  // Company list panel
  if(!selStock) return (
    <div className="gcol fa">
      <div className="card">
        <div className="ch">
          <div><div className="ct">📓 Trade Journal</div><div className="cs">Select a company to review all its trades and add notes</div></div>
          <span className="bd bd-a">{Object.keys(notes).length} notes saved</span>
        </div>
        {companies.length===0&&<div style={{textAlign:"center",padding:40,color:"var(--t3)"}}>No closed trades yet. Import your broker report first.</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10,marginTop:4}}>
          {companies.map(stock=>{
            const cs=companyStats(stock);
            if(!cs) return null;
            return(
              <div key={stock} onClick={()=>openCompany(stock)}
                style={{background:"var(--s2)",borderRadius:9,padding:"13px 15px",cursor:"pointer",border:`1px solid ${cs.hasNote?"rgba(124,58,237,.3)":"var(--b2)"}`,transition:"all .15s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="var(--acc)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=cs.hasNote?"rgba(124,58,237,.3)":"var(--b2)"}>
                <div className="row" style={{justifyContent:"space-between",marginBottom:7}}>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:15}}>{stock}</div>
                  <div className="row" style={{gap:5}}>
                    {cs.hasNote&&<span className="bd bd-a" style={{fontSize:8}}>✓ note</span>}
                    <span className={`bd ${cs.totalPnl>=0?"bd-g":"bd-r"}`}>{fmtC(cs.totalPnl)}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:12,fontSize:10,color:"var(--t2)"}}>
                  <span>{cs.ts.length} trades</span>
                  <span className={cs.winRate>=50?"green":"red"}>{cs.winRate}% WR</span>
                  <span style={{color:"var(--t3)"}}>{cs.avgHold}d avg</span>
                </div>
                <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                  {cs.ts.map(t=>(
                    <div key={t.id} title={`${fmtD(t.buyDate)} · ${fmtC(t.pnl)}`}
                      style={{width:10,height:10,borderRadius:2,background:t.pnl>=0?"var(--g)":"var(--r)",opacity:.8}}/>
                  ))}
                </div>
                {notes[cs.ts[0]?.id]||notes[`co_${stock}`]?
                  <div style={{fontSize:9.5,color:"var(--t3)",marginTop:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(notes[`co_${stock}`]||notes[cs.ts[0]?.id])?.text?.slice(0,60)}...</div>
                :null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const cs=companyStats(selStock);
  const tradeNoteKey=selTrade?selTrade.id:`co_${selStock}`;

  return(
    <div className="gcol fa">
      {/* Breadcrumb */}
      <div className="card" style={{padding:"10px 16px"}}>
        <div className="row" style={{gap:8}}>
          <span onClick={()=>setSelStock(null)} style={{color:"var(--t3)",cursor:"pointer",fontSize:11}}>📓 Journal</span>
          <span style={{color:"var(--t4)"}}>›</span>
          <span onClick={()=>{setSelTrade(null);setView("company");const e=notes[`co_${selStock}`];setText(e?.text||"");setMood(e?.mood||"neutral");}}
            style={{color:view==="company"?"var(--acc)":"var(--t2)",cursor:"pointer",fontSize:11,fontWeight:600}}>{selStock}</span>
          {selTrade&&<><span style={{color:"var(--t4)"}}>›</span><span style={{color:"var(--acc)",fontSize:11}}>{fmtD(selTrade.buyDate)} → {fmtD(selTrade.sellDate)}</span></>}
        </div>
      </div>

      <div className="g21">
        {/* Left: Trade list + company stats */}
        <div className="gcol">
          {/* Company summary */}
          <div className="card">
            <div className="ch">
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:16}}>{selStock}</div>
              <span className={`bd ${cs.totalPnl>=0?"bd-g":"bd-r"}`} style={{fontSize:12}}>{fmtC(cs.totalPnl)}</span>
            </div>
            <div style={{display:"flex",gap:18,flexWrap:"wrap",marginBottom:14}}>
              {[
                {l:"Trades",v:cs.ts.length},
                {l:"Win Rate",v:cs.winRate+"%",c:cs.winRate>=50?"green":"red"},
                {l:"Avg Hold",v:cs.avgHold+"d"},
                {l:"Best",v:fmtC(cs.bestTrade.pnl),c:"green"},
                {l:"Worst",v:fmtC(cs.worstTrade.pnl),c:"red"},
              ].map(k=>(
                <div key={k.l}>
                  <div style={{fontSize:8.5,color:"var(--t3)",letterSpacing:.5,marginBottom:2}}>{k.l}</div>
                  <div className={k.c||""} style={{fontWeight:600,fontSize:13}}>{k.v}</div>
                </div>
              ))}
            </div>
            {/* Auto insight */}
            <div style={{background:"var(--bg)",borderRadius:7,padding:"9px 12px",border:"1px solid var(--b1)",fontSize:10.5,color:"var(--t2)",lineHeight:1.75}}>
              {cs.winRate>=60?`✅ Strong ${cs.winRate}% win rate on ${selStock} — your entry timing is consistent.`
                :cs.winRate<40?`⚠️ Only ${cs.winRate}% win rate — review your entry conditions for ${selStock}.`
                :`📊 ${cs.winRate}% win rate on ${selStock} — room to improve entry discipline.`}
              {" "}{cs.totalPnl>0?`Net profitable with ${fmtC(cs.totalPnl)} total.`:`Net loss of ${fmtC(cs.totalPnl)} — analyse the ${cs.losses.length} losing trades.`}
              {cs.avgHold<7?" Short avg hold suggests intraday/scalping style."
                :cs.avgHold>60?" Long avg hold — positional trader style."
                :" Medium-term swing trading style."}
            </div>
          </div>

          {/* Individual trade list */}
          <div className="card" style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"12px 16px 8px",borderBottom:"1px solid var(--b1)"}}>
              <div className="ct">All {selStock} Trades</div>
              <div className="cs" style={{marginTop:2}}>Click any trade to add a specific note</div>
            </div>
            {cs.ts.map(t=>{
              const hasNote=!!notes[t.id];
              const isSelected=selTrade?.id===t.id;
              return(
                <div key={t.id} onClick={()=>openTrade(t)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:"1px solid rgba(26,32,53,.4)",cursor:"pointer",background:isSelected?"rgba(124,58,237,.06)":"transparent",transition:"background .1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=isSelected?"rgba(124,58,237,.06)":"rgba(255,255,255,.02)"}
                  onMouseLeave={e=>e.currentTarget.style.background=isSelected?"rgba(124,58,237,.06)":"transparent"}>
                  <div style={{width:8,height:8,borderRadius:2,background:t.pnl>=0?"var(--g)":"var(--r)",flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,color:"var(--t1)"}}>
                      {fmtD(t.buyDate)} → {fmtD(t.sellDate)}
                      {t.instrType&&<span className={`bd ${t.instrType==="FUT"?"bd-b":t.instrType==="CALL"?"bd-g":"bd-r"}`} style={{marginLeft:6,fontSize:8}}>{t.instrType}{t.strike?` ${t.strike}`:""}</span>}
                    </div>
                    <div style={{fontSize:9.5,color:"var(--t3)",marginTop:1}}>{t.days}d hold · qty {t.qty}{t.relatedEvents?.length?` · ⚡${t.relatedEvents[0].label}`:""}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div className={t.pnl>=0?"green":"red"} style={{fontWeight:600,fontSize:12}}>{fmtC(t.pnl)}</div>
                    <div style={{fontSize:9,color:"var(--t3)"}}>{t.pnlPct>0?"+":""}{t.pnlPct}%</div>
                  </div>
                  {hasNote&&<span style={{fontSize:10,color:"var(--acc)",flexShrink:0}}>✎</span>}
                  <span style={{color:"var(--t4)",fontSize:11}}>›</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Note editor */}
        <div className="gcol">
          <div className="card">
            <div className="ct" style={{marginBottom:4}}>
              {view==="trade"&&selTrade
                ?`Note: ${selStock} · ${fmtD(selTrade.buyDate)} → ${fmtD(selTrade.sellDate)}`
                :`Company Note: ${selStock}`}
            </div>
            <div style={{fontSize:9.5,color:"var(--t3)",marginBottom:12}}>
              {view==="trade"&&selTrade
                ?<span className={selTrade.pnl>=0?"green":"red"}>{fmtC(selTrade.pnl)} · {selTrade.pnlPct}% · {selTrade.days}d hold</span>
                :`Overall verdict for all ${cs.ts.length} ${selStock} trades`}
            </div>

            {/* Mood selector */}
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
              {MOODS.map(m=>(
                <span key={m} className={`chip ${mood===m?"chip-on":"chip-off"}`} onClick={()=>setMood(m)} style={{fontSize:9.5}}>{m}</span>
              ))}
            </div>

            <textarea className="inp" rows={6} value={text} onChange={e=>{setText(e.target.value);setSaved(false);}}
              placeholder={view==="trade"
                ?"What was your thesis for this trade? What worked or didn't? Would you take this trade again?"
                :`Overall pattern for ${selStock}: What's your edge here? What mistakes repeat? What should you do differently?`}
              style={{resize:"vertical",lineHeight:1.7,fontSize:11.5}}/>

            <div className="row" style={{gap:8,marginTop:10}}>
              <button className="btn btn-p" onClick={()=>saveNote(tradeNoteKey)} style={{flex:1,justifyContent:"center"}}>
                <I n="check" s={12}/>{saved?"✓ Saved!":"Save Note"}
              </button>
              {notes[tradeNoteKey]&&(
                <button className="btn btn-g btn-sm" onClick={()=>{setNotes(prev=>{const n={...prev};delete n[tradeNoteKey];return n;});setText("");setMood("neutral");}}>
                  Delete
                </button>
              )}
            </div>

            {/* Trade context when drilling down */}
            {view==="trade"&&selTrade&&selTrade.relatedEvents?.length>0&&(
              <div style={{marginTop:12,background:"var(--bg)",borderRadius:7,padding:"9px 12px",border:"1px solid var(--b1)"}}>
                <div style={{fontSize:9,color:"var(--t3)",letterSpacing:1,marginBottom:6}}>MARKET EVENTS DURING THIS TRADE</div>
                {selTrade.relatedEvents.map(e=>(
                  <div key={e.date} style={{display:"flex",gap:8,marginBottom:4,alignItems:"flex-start"}}>
                    <span style={{color:eventColor(e.type),fontSize:11}}>{e.impact>0?"↑":"↓"}</span>
                    <div>
                      <div style={{fontSize:11,fontWeight:600}}>{e.label}</div>
                      <div style={{fontSize:9.5,color:"var(--t3)"}}>{e.detail.slice(0,80)}...</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Existing notes for this company */}
          {cs.ts.filter(t=>notes[t.id]).length>0&&(
            <div className="card">
              <div className="ct" style={{marginBottom:10}}>Previous Trade Notes</div>
              {cs.ts.filter(t=>notes[t.id]).map(t=>(
                <div key={t.id} onClick={()=>openTrade(t)}
                  style={{background:"var(--s2)",borderRadius:7,padding:"10px 12px",marginBottom:8,cursor:"pointer",border:"1px solid var(--b2)"}}>
                  <div className="row" style={{justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:10.5,color:"var(--t2)"}}>{fmtD(t.buyDate)} → {fmtD(t.sellDate)}</span>
                    <div className="row" style={{gap:5}}>
                      <span className={`bd ${t.pnl>=0?"bd-g":"bd-r"}`} style={{fontSize:8.5}}>{fmtC(t.pnl)}</span>
                      <span style={{fontSize:10}}>{notes[t.id].mood}</span>
                    </div>
                  </div>
                  <div style={{fontSize:10.5,color:"var(--t3)",lineHeight:1.6,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{notes[t.id].text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════ AI ANALYSIS MODAL ══════════════════════
   Self-hosted: uses Groq (if key set in Settings)
   Claude.ai artifact: uses built-in Anthropic API (no key needed)
════════════════════════════════════════════════════════════════ */
const AIModal = ({stock,trades,stockStats,groqKey,onClose}) => {
  const [loading,setLoading]=useState(false);
  const [tab,setTab]=useState("local");
  const [chatHistory,setChatHistory]=useState([]); // [{role:"user"|"assistant", content}]
  const [inputMsg,setInputMsg]=useState("");
  const chatEndRef=useRef(null);
  const inputRef=useRef(null);

  const local=genAnalysis(stock,trades,stockStats);
  const ts=trades.filter(t=>t.stock===stock&&!t.open);
  const st=stockStats.find(s=>s.stock===stock);

  // Which AI tier is active — shown in modal header
  const usingOwnKeyInModal = !IS_LOCAL && !!groqKey && groqKey !== "proxy";
  const providerColor = IS_LOCAL ? "var(--amber)" : usingOwnKeyInModal ? "var(--g)" : "var(--acc-hi)";
  const providerLabel = IS_LOCAL
    ? "⚡ Local Dev"
    : usingOwnKeyInModal
      ? "🔑 Your Key"
      : "🌐 Platform AI";

  // Build system context string (used in every call)
  const tradeContext=useMemo(()=>{
    const log=ts.map(t=>{
      const instrPart=t.instrType?" ["+t.instrType+(t.strike?" "+t.strike:"")+(t.expiry?" exp:"+t.expiry.slice(0,7):"")+"]":"";
      const evtPart=t.relatedEvents&&t.relatedEvents.length?" Events:"+t.relatedEvents.map(e=>e.label).join(","):"";
      return t.buyDate+"→"+(t.sellDate||"Open")+" Qty:"+t.qty+" Buy:₹"+t.buyPrice+" Sell:₹"+(t.sellPrice||"?")+" PnL:₹"+t.pnl+"("+t.pnlPct+"%) "+t.days+"d"+instrPart+evtPart;
    }).join("\n");
    return `CONTEXT: ${stock} | ${ts.length} trades | Win:${st?.winRate}% | P&L:₹${st?.totalPnl?.toLocaleString("en-IN")||0} | ROI:${st?.roi}% | Avg hold:${st?.avgDays}d | Sector:${st?.sector||"F&O"}\n\nTRADES:\n${log||"No closed trades"}`;
  },[stock,ts,st]);

  const systemPrompt=`You are an expert Indian stock market and F&O trading coach. The user is reviewing their personal trade history. Be specific, cite exact dates and ₹ amounts. Keep replies concise (under 200 words unless asked for more). Focus on actionable insights. For F&O mention theta, expiry risk, hedging where relevant.

${tradeContext}`;

  // Send message to AI
  const sendMessage=useCallback(async(userText,isInitial=false)=>{
    if(loading) return;
    if(!isInitial && !userText.trim()) return;  // only block empty for follow-ups
    const newHistory=isInitial?[]:[...chatHistory];
    if(!isInitial) {
      newHistory.push({role:"user",content:userText});
      setChatHistory(newHistory);
      setInputMsg("");
    } else {
      setChatHistory([]);
    }
    setLoading(true);

    // Build messages array for API
    const INIT_PROMPT=`You are analyzing my ${stock} trades. Give a structured analysis:

✅ STRENGTHS (2-3 points with specific dates/amounts)
❌ MISTAKES (2-3 points with specific dates/amounts)  
💡 IMPROVEMENTS (3 actionable steps)
📊 RATING: X/10 with 2-sentence reasoning

Be specific. Cite actual ₹ amounts and dates from the trade log.`;
    const initMsg = isInitial ? INIT_PROMPT : userText;
    const messages=isInitial
      ?[{role:"user",content:initMsg}]
      :[...newHistory.map(m=>({role:m.role,content:m.content}))];

    try{
      let resText;
      const payload={
        model:"llama-3.3-70b-versatile",
        max_tokens:900,
        messages:[{role:"system",content:systemPrompt},...messages],
      };
      // ── 3-tier AI routing ──────────────────────────────────────────
      // Tier 1: Local dev — call Groq directly with user's key
      // Tier 2: Production + user has own key → proxy passes userKey
      // Tier 3: Production, no user key → proxy uses platform key (free for all)
      if(IS_LOCAL){
        if(!groqKey||groqKey==="proxy")
          throw new Error("Add your Groq API key in Settings to use AI in local dev mode.");
        const res=await fetch("https://api.groq.com/openai/v1/chat/completions",{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":"Bearer "+groqKey},
          body:JSON.stringify(payload),
        });
        if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.error?.message||"Groq error "+res.status);}
        const data=await res.json();
        resText=data.choices?.[0]?.message?.content||"No response.";
      } else {
        // Production: always use proxy. If user has own key, include it so
        // proxy can use it for higher rate limits (key never stored server-side).
        const proxyBody=Object.assign({},payload);
        if(groqKey&&groqKey!=="proxy") proxyBody.userKey=groqKey;
        const res=await fetch(AI_PROXY_URL,{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify(proxyBody),
        });
        if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.error||"AI proxy error "+res.status);}
        const data=await res.json();
        resText=data.choices?.[0]?.message?.content||"No response.";
      }
      if(isInitial){
        setChatHistory([
          {role:"user",content:initMsg},
          {role:"assistant",content:resText}
        ]);
      } else {
        setChatHistory(prev=>[...prev,{role:"assistant",content:resText}]);
      }
    }catch(e){
      const errMsg="❌ "+e.message+(usingOwnKeyInModal?"\n\nTip: Try removing your key to use the platform AI instead (Settings → Remove Key).":"\n\nThe platform AI is temporarily unavailable. You can add your own Groq key in Settings for uninterrupted access.");
      if(isInitial){
        setChatHistory([{role:"assistant",content:errMsg}]);
      } else {
        setChatHistory(prev=>[...prev,{role:"assistant",content:errMsg}]);
      }
    }
    setLoading(false);
  },[groqKey,loading,chatHistory,systemPrompt,stock]);

  // Auto-scroll to latest message
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[chatHistory,loading]);

  // Quick prompt suggestions
  const QUICK_PROMPTS=[
    "What should I have done differently on my biggest loss?",
    "Which trades did I execute perfectly and why?",
    "What patterns do you see in my losing trades?",
    "What's my biggest psychological mistake here?",
    "How can I improve my entry timing?",
    "Was my risk management appropriate?",
    "What's the best strategy for this stock going forward?",
  ];

  return(
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal fa" style={{maxWidth:900}}>
        {/* Header */}
        {/* Header */}
        <div style={{padding:"14px 22px",borderBottom:"1px solid var(--b1)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(135deg,rgba(99,102,241,.06),rgba(34,211,238,.04))"}}>
          <div>
            <div className="row" style={{gap:8,flexWrap:"wrap"}}>
              <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:16}}>AI Analysis — {stock}</div>
              <span style={{fontSize:9,padding:"2px 9px",borderRadius:10,
                background:usingOwnKeyInModal?"rgba(52,211,153,.1)":IS_LOCAL?"rgba(245,158,11,.1)":"rgba(99,102,241,.1)",
                color:providerColor,fontWeight:700,
                border:"1px solid "+(usingOwnKeyInModal?"rgba(52,211,153,.2)":IS_LOCAL?"rgba(245,158,11,.2)":"rgba(99,102,241,.2)")}}>
                {providerLabel}
              </span>
            </div>
            <div style={{fontSize:10,color:"var(--t3)",marginTop:3,fontFamily:"'IBM Plex Mono',monospace"}}>
              {st?.trades} trades · {st?.winRate}% WR · {fmtC(st?.totalPnl||0)}
              {!IS_LOCAL&&!usingOwnKeyInModal&&<span style={{color:"var(--t4)",marginLeft:8}}>· Add your key in Settings for unlimited usage</span>}
            </div>
          </div>
          <button className="btn btn-g btn-sm" onClick={onClose}><I n="x" s={12}/></button>
        </div>

        {/* Tabs */}
        <div className="row" style={{padding:"8px 22px",gap:8,borderBottom:"1px solid var(--b1)"}}>
          {[
            {id:"local",label:"📊 Rule-based"},
            {id:"ai",label:groqKey?"⚡ Groq Chat":"✨ AI Chat"},
          ].map(t=>(
            <span key={t.id} className={`chip ${tab===t.id?"chip-on":"chip-off"}`} onClick={()=>setTab(t.id)}>
              {t.label}
            </span>
          ))}
          {tab==="ai"&&chatHistory.length>0&&(
            <span className="chip chip-off" style={{marginLeft:"auto",fontSize:9.5}} onClick={()=>{setChatHistory([]);setInputMsg("");}}>
              🗑 Clear chat
            </span>
          )}
        </div>

        {/* ── LOCAL tab ── */}
        {tab==="local"&&(
          <div style={{flex:1,overflowY:"auto",padding:22}}>
            {local&&(
              <div>
                <div style={{background:"var(--s2)",borderRadius:10,padding:"12px 16px",marginBottom:18,border:"1px solid var(--b2)",fontSize:12,lineHeight:1.7}}>
                  You traded <strong style={{color:"var(--acc)"}}>{stock}</strong> {local.stats.trades} times, averaging <strong>{local.avgHold} days</strong> per position. Win rate: <strong className={local.stats.winRate>=50?"green":"red"}>{local.stats.winRate}%</strong>. Total: <strong className={local.stats.totalPnl>=0?"green":"red"}>{fmtC(local.stats.totalPnl)}</strong> ({local.stats.roi}% ROI).
                </div>
                {[
                  {title:"✅ What You Did Right",items:local.goods,c:"var(--g)"},
                  {title:"❌ What Went Wrong",items:local.bads,c:"var(--r)"},
                  {title:"💡 Improvements",items:local.improves,c:"var(--y)"},
                ].map(sec=>sec.items.length>0&&(
                  <div key={sec.title} style={{marginBottom:18}}>
                    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,fontSize:14,color:sec.c,marginBottom:10}}>{sec.title}</div>
                    <div style={{borderLeft:`2px solid ${sec.c}`,paddingLeft:14}}>
                      {sec.items.map((it,i)=>(
                        <div key={i} style={{display:"flex",gap:8,marginBottom:9,alignItems:"flex-start"}}>
                          <div style={{width:5,height:5,borderRadius:"50%",background:sec.c,marginTop:6,flexShrink:0}}/>
                          <div style={{fontSize:11.5,color:"var(--t1)",lineHeight:1.7}}>{it}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{background:"var(--s2)",borderRadius:10,padding:"12px 16px",border:"1px solid var(--b2)"}}>
                  <div style={{fontSize:9.5,color:"var(--t3)",letterSpacing:1,marginBottom:10,textTransform:"uppercase"}}>Per-Trade Verdict</div>
                  {local.trades.map(t=>(
                    <div key={t.id} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:"1px solid var(--b1)",alignItems:"center"}}>
                      <span className={`bd ${t.pnl>=0?"bd-g":"bd-r"}`}>{t.pnl>=0?"WIN":"LOSS"}</span>
                      <div style={{flex:1,fontSize:10.5}}>{fmtD(t.buyDate)} → {fmtD(t.sellDate)} · {t.days}d{t.relatedEvents?.length>0&&<span style={{color:"var(--t3)",marginLeft:8}}>During: {t.relatedEvents.map(e=>e.label).join(", ")}</span>}</div>
                      <div style={{textAlign:"right"}}><div className={t.pnl>=0?"green":"red"} style={{fontWeight:600,fontSize:11}}>{fmtC(t.pnl)}</div><div style={{fontSize:9,color:"var(--t3)"}}>{fmtP(t.pnlPct)}</div></div>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:16,padding:"12px 16px",background:"rgba(124,58,237,.05)",borderRadius:10,border:"1px solid rgba(124,58,237,.15)"}}>
                  <div style={{fontSize:10.5,color:"var(--t2)"}}>Want deeper analysis? Switch to <strong style={{color:providerColor}}>{providerLabel} Chat</strong> tab to ask follow-up questions.</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AI CHAT tab ── */}
        {tab==="ai"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

            {/* Chat messages area */}
            <div style={{flex:1,overflowY:"auto",padding:"16px 22px",display:"flex",flexDirection:"column",gap:14}}>

              {/* Empty state */}
              {chatHistory.length===0&&!loading&&(
                <div style={{textAlign:"center",paddingTop:16}}>
                  <div style={{fontSize:32,marginBottom:12}}>{groqKey?"⚡":"🤖"}</div>
                  <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:15,fontWeight:600,marginBottom:6,color:providerColor}}>
                    {groqKey?"Groq AI Chat":"Claude AI Chat"} — {stock}
                  </div>
                  <div style={{fontSize:11,color:"var(--t3)",marginBottom:20}}>
                    Ask anything about your trades, or click below to generate a full analysis
                  </div>
                  <button className="btn btn-p" style={{margin:"0 auto",padding:"10px 22px",fontSize:12}} onClick={()=>sendMessage("",true)}>
                    <I n="send" s={13}/> Generate Full Analysis
                  </button>
                  <div style={{fontSize:9.5,color:"var(--t3)",marginTop:8,textAlign:"center"}}>Powered by Groq · llama-3.3-70b-versatile</div>
                  <div style={{marginTop:20,textAlign:"left"}}>
                    <div style={{fontSize:9.5,color:"var(--t3)",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>Quick Questions</div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {QUICK_PROMPTS.map((q,i)=>(
                        <button key={i} className="btn btn-g" style={{textAlign:"left",fontSize:11,padding:"8px 12px",justifyContent:"flex-start"}}
                          onClick={()=>sendMessage(q)}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat bubbles */}
              {chatHistory.map((msg,i)=>(
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:msg.role==="user"?"flex-end":"flex-start",gap:4}}>
                  <div style={{fontSize:9,color:"var(--t4)",letterSpacing:.5}}>{msg.role==="user"?"YOU":providerLabel}</div>
                  <div style={{
                    maxWidth:"88%",padding:"10px 14px",borderRadius:msg.role==="user"?"12px 12px 2px 12px":"12px 12px 12px 2px",
                    background:msg.role==="user"?"rgba(77,138,255,.18)":"var(--s2)",
                    border:`1px solid ${msg.role==="user"?"rgba(77,138,255,.3)":"var(--b2)"}`,
                    fontSize:11.5,lineHeight:1.8,color:"var(--t1)",fontFamily:"'IBM Plex Mono',monospace",
                    whiteSpace:"pre-wrap"
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {loading&&(
                <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                  <div style={{fontSize:9,color:"var(--t4)",letterSpacing:.5,marginTop:2}}>{providerLabel}</div>
                  <div style={{background:"var(--s2)",border:"1px solid var(--b2)",borderRadius:"12px 12px 12px 2px",padding:"10px 16px",display:"flex",gap:5,alignItems:"center"}}>
                    {[0,1,2].map(i=>(
                      <div key={i} style={{width:6,height:6,borderRadius:"50%",background:providerColor,animation:`pulse 1.2s ${i*0.2}s infinite`}}/>
                    ))}
                  </div>
                </div>
              )}

              {/* After first response, show quick follow-ups */}
              {chatHistory.length>=2&&!loading&&(
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:4}}>
                  {["What should I do differently?","What did I do well?","How's my risk management?","Best strategy going forward?"].map((q,i)=>(
                    <button key={i} className="btn btn-g" style={{fontSize:9.5,padding:"5px 10px",borderRadius:20}} onClick={()=>sendMessage(q)}>{q}</button>
                  ))}
                </div>
              )}

              <div ref={chatEndRef}/>
            </div>

            {/* Input bar */}
            <div style={{padding:"12px 16px",borderTop:"1px solid var(--b1)",display:"flex",gap:8,background:"var(--s1)"}}>
              <input
                ref={inputRef}
                className="inp"
                style={{flex:1,fontSize:12,padding:"10px 14px"}}
                placeholder={`Ask about your ${stock} trades...`}
                value={inputMsg}
                onChange={e=>setInputMsg(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&inputMsg.trim()){e.preventDefault();sendMessage(inputMsg);}}}
                disabled={loading}
              />
              <button
                className="btn btn-p"
                style={{padding:"10px 16px",opacity:!inputMsg.trim()||loading?0.5:1}}
                onClick={()=>sendMessage(inputMsg)}
                disabled={!inputMsg.trim()||loading}
              >
                <I n="send" s={13}/>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


/* ══════════════════════ UPLOAD VIEW ════════════════════════════ */
const UploadView = ({onImport}) => {
  const [drag,setDrag]=useState(false);
  const [status,setStatus]=useState(null);
  const [preview,setPreview]=useState([]);
  const [isFnO,setIsFnO]=useState(false);

  const handleFile=useCallback((f)=>{
    if(!f) return;
    setStatus({loading:true,name:f.name});
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const data=XLSX.read(e.target.result,{type:"array"});

        // Detect file type by sheet names / title row
        const sheetNames = data.SheetNames.map(s=>s.toLowerCase());
        const isFnO = sheetNames.some(s=>s.includes("trade level")||s.includes("contract")) ||
          (() => { const ws=data.Sheets[data.SheetNames[0]]; const r=XLSX.utils.sheet_to_json(ws,{header:1,defval:""}); return r.slice(0,6).some(row=>row.some(c=>String(c).includes("Futures & Options")||String(c).includes("F&O"))); })();

        let parsed = null;
        let detectedCharges = 0;

        if(isFnO) {
          // Try Trade Level (has dates) first
          parsed = parseGrowwFnO(data);
          if(parsed && parsed._totalCharges) { detectedCharges = parsed._totalCharges; }
          // Fall back to Contract Level (no dates, approximate)
          if(!parsed || !parsed.length) parsed = parseGrowwFnOContractLevel(data);
        }

        // Fall back to equity parsers
        if(!parsed || !parsed.length) parsed = parseGrowwExcel(data);
        if(!parsed || !parsed.length) parsed = parseGrowwTradeHistory(data) || [];

        const processed = processTrades(parsed);
        setPreview(processed.slice(0,5));
        setIsFnO(isFnO);

        if(processed.length>0) {
          // Build summary stats for F&O
          const futTrades = processed.filter(t=>t.segment==="FNO-FUT");
          const optTrades = processed.filter(t=>t.segment==="FNO-OPT");
          setStatus({success:true, name:f.name, count:processed.length,
            rows:XLSX.utils.sheet_to_json(data.Sheets[data.SheetNames[0]]).length,
            isFnO, futCount:futTrades.length, optCount:optTrades.length,
            futPnl: futTrades.reduce((s,t)=>s+t.pnl,0),
            optPnl: optTrades.reduce((s,t)=>s+t.pnl,0),
            charges: detectedCharges,
          });
          onImport(processed, detectedCharges);
        } else {
          setStatus({error:true,name:f.name,msg:"Could not parse trades. See format guide below."});
        }
      }catch(err){setStatus({error:true,name:f.name,msg:err.message});}
    };
    reader.readAsArrayBuffer(f);
  },[onImport]);

  return(
    <div className="gcol fa">
      <div className={`drop ${drag?"drag":""}`}
        onDragOver={e=>{e.preventDefault();setDrag(true)}}
        onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0])}}
        onClick={()=>document.getElementById("fi").click()}>
        <input id="fi" type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
        <div style={{fontSize:40,marginBottom:12,opacity:.4}}>📂</div>
        <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,fontSize:16,marginBottom:6}}>Drop Groww / Zerodha Report Here</div>
        <div style={{color:"var(--t2)",fontSize:11,marginBottom:16}}>Supports Excel (.xlsx), CSV — Groww P&L Report, Zerodha Console, Upstox</div>
        <button className="btn btn-p">Choose File</button>
      </div>

      {status&&(
        <div className={`card`} style={{borderLeft:`3px solid ${status.error?"var(--r)":status.loading?"var(--y)":"var(--g)"}`}}>
          {status.loading&&<div className="row" style={{gap:8}}><span className="pulsing" style={{color:"var(--y)"}}>⟳</span> Parsing {status.name}...</div>}
          {status.success&&(
            <div>
              <div className="row" style={{gap:8,marginBottom:8}}><I n="check" s={14} c="var(--g)"/><span className="green" style={{fontWeight:600}}>Successfully parsed!</span>{status.isFnO&&<span className="bd bd-v">F&O Report</span>}</div>
              <div style={{fontSize:11,color:"var(--t2)",marginBottom:status.isFnO?10:0}}>Found <strong style={{color:"var(--acc)"}}>{status.count} trades</strong> from {status.name}. Dashboard updated with your real data.</div>
              {status.isFnO&&(
                <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:8}}>
                  <div style={{background:"var(--s2)",borderRadius:7,padding:"8px 12px",border:"1px solid var(--b2)"}}>
                    <div style={{fontSize:9,color:"var(--t3)",marginBottom:3}}>FUTURES ({status.futCount})</div>
                    <div className={status.futPnl>=0?"green":"red"} style={{fontWeight:600,fontSize:14}}>{fmtC(status.futPnl)}</div>
                  </div>
                  <div style={{background:"var(--s2)",borderRadius:7,padding:"8px 12px",border:"1px solid var(--b2)"}}>
                    <div style={{fontSize:9,color:"var(--t3)",marginBottom:3}}>OPTIONS ({status.optCount})</div>
                    <div className={status.optPnl>=0?"green":"red"} style={{fontWeight:600,fontSize:14}}>{fmtC(status.optPnl)}</div>
                  </div>
                  <div style={{background:"var(--s2)",borderRadius:7,padding:"8px 12px",border:"1px solid var(--b2)"}}>
                    <div style={{fontSize:9,color:"var(--t3)",marginBottom:3}}>GROSS P&L</div>
                    <div className={(status.futPnl+status.optPnl)>=0?"green":"red"} style={{fontWeight:600,fontSize:14}}>{fmtC(status.futPnl+status.optPnl)}</div>
                  </div>
                  {status.charges>0&&(
                    <div style={{background:"var(--s2)",borderRadius:7,padding:"8px 12px",border:"1px solid rgba(255,61,90,.3)"}}>
                      <div style={{fontSize:9,color:"var(--t3)",marginBottom:3}}>CHARGES</div>
                      <div className="red" style={{fontWeight:600,fontSize:14}}>−{fmtC(status.charges)}</div>
                    </div>
                  )}
                  {status.charges>0&&(
                    <div style={{background:"var(--s2)",borderRadius:7,padding:"8px 12px",border:"1px solid rgba(124,58,237,.2)"}}>
                      <div style={{fontSize:9,color:"var(--t3)",marginBottom:3}}>NET P&L</div>
                      <div className={(status.futPnl+status.optPnl-status.charges)>=0?"green":"red"} style={{fontWeight:600,fontSize:14}}>{fmtC(status.futPnl+status.optPnl-status.charges)}</div>
                    </div>
                  )}
                </div>
              )}
              {preview.length>0&&(
                <div style={{marginTop:8,background:"var(--s2)",borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontSize:9,color:"var(--t3)",marginBottom:8,letterSpacing:1}}>PREVIEW (first 5)</div>
                  {preview.map((t,i)=>(
                    <div key={i} style={{fontSize:10.5,padding:"4px 0",borderBottom:"1px solid var(--b1)",display:"flex",justifyContent:"space-between",gap:8}}>
                      <span style={{color:"var(--t2)",maxWidth:260,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.display||t.stock}</span>
                      {t.instrType&&<span className={`bd ${t.instrType==="FUT"?"bd-b":t.instrType==="CALL"?"bd-g":"bd-r"}`}>{t.instrType}</span>}
                      <span className={t.open?"yellow":t.pnl>=0?"green":"red"}>{t.open?"OPEN":fmtC(t.pnl)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {status.error&&(
            <div>
              <div className="row" style={{gap:8,marginBottom:6}}><I n="warn" s={14} c="var(--r)"/><span className="red" style={{fontWeight:600}}>Parse Error</span></div>
              <div style={{fontSize:11,color:"var(--t2)"}}>{status.msg}</div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="ct" style={{marginBottom:12}}>📋 Supported Formats</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div style={{background:"var(--s2)",borderRadius:8,padding:"12px 14px",border:"1px solid rgba(177,110,255,.25)"}}>
            <div style={{color:"var(--acc3)",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,marginBottom:6}}>🔷 Groww F&O P&L Report ← YOUR FILE</div>
            <div style={{fontSize:10.5,color:"var(--t2)",lineHeight:1.8}}>
              Groww → Reports → F&O → P&L Report → Download Excel<br/>
              <strong style={{color:"var(--t1)"}}>File name:</strong> F_O_PnL_Report_XXXXXXXX_...<br/>
              <strong style={{color:"var(--t1)"}}>Sheet used:</strong> "Trade Level" (has buy/sell dates)<br/>
              <strong style={{color:"var(--t1)"}}>Parsed:</strong> Futures + Options, strike, expiry, P&L
            </div>
          </div>
          <div style={{background:"var(--s2)",borderRadius:8,padding:"12px 14px",border:"1px solid var(--b2)"}}>
            <div style={{color:"var(--acc)",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,marginBottom:6}}>📊 Groww Equity P&L Report</div>
            <div style={{fontSize:10.5,color:"var(--t2)",lineHeight:1.8}}>
              Groww → Reports → Equity → P&L Report → Download Excel<br/>
              Columns: Symbol · Buy Date · Buy Price · Sell Date · Sell Price · Qty
            </div>
          </div>
          <div style={{background:"var(--s2)",borderRadius:8,padding:"12px 14px",border:"1px solid var(--b2)"}}>
            <div style={{color:"var(--acc2)",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,marginBottom:6}}>📥 Zerodha Console</div>
            <div style={{fontSize:10.5,color:"var(--t2)",lineHeight:1.8}}>
              Console → Reports → Trade Book → CSV<br/>
              Columns: Symbol · Trade type · Qty · Price · Date
            </div>
          </div>
          <div style={{background:"var(--s2)",borderRadius:8,padding:"12px 14px",border:"1px solid var(--b2)"}}>
            <div style={{color:"var(--y)",fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,marginBottom:6}}>📥 Upstox / Angel / ICICI</div>
            <div style={{fontSize:10.5,color:"var(--t2)",lineHeight:1.8}}>
              Any broker CSV with: Date, Symbol, Buy/Sell, Qty, Price columns
            </div>
          </div>
        </div>
        <div style={{marginTop:12,background:"var(--bg)",borderRadius:6,padding:"8px 12px",border:"1px solid var(--b1)",fontSize:10.5,color:"var(--t3)"}}>
          <strong style={{color:"var(--t2)"}}>If parsing fails:</strong> Open the Excel, check that headers are in row 26 area (for F&O) or row 1-5 (for equity). Remove password protection if any.
        </div>
      </div>
    </div>
  );
};

/* ════════════════════ SETTINGS VIEW ════════════════════════════ */
const SettingsView = ({userGroqKey,setGroqKey,totalCharges,setTotalCharges,aiProvider,setAiProvider,onClear}) => {
  const [tempKey,setTempKey]=useState(userGroqKey||"");
  const [tempCharges,setTempCharges]=useState(totalCharges||0);
  const [saved,setSaved]=useState(false);
  const [testing,setTesting]=useState(false);
  const [testResult,setTestResult]=useState(null);
  const [keyVisible,setKeyVisible]=useState(false);

  // Which tier is active right now
  const usingOwnKey = !IS_LOCAL && !!userGroqKey;
  const usingPlatform = !IS_LOCAL && !userGroqKey;
  const usingLocal = IS_LOCAL;

  const testKey=async(key)=>{
    setTesting(true);setTestResult(null);
    try{
      if(IS_LOCAL){
        if(!key) throw new Error("Enter a Groq key first");
        const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},
          body:JSON.stringify({model:"llama-3.3-70b-versatile",max_tokens:5,messages:[{role:"user",content:"Hi"}]}),
        });
        if(r.ok) setTestResult("✅ Key valid! AI ready for local dev.");
        else{const e=await r.json().catch(()=>({}));setTestResult("❌ "+(e?.error?.message||"Invalid key — check console.groq.com"));}
      } else {
        // Test proxy — with or without user key
        const body={model:"llama-3.3-70b-versatile",max_tokens:5,messages:[{role:"user",content:"Hi"}]};
        if(key) body.userKey=key;
        const r=await fetch(AI_PROXY_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
        if(r.ok) setTestResult(key?"✅ Your Groq key works! Using your key for unlimited AI.":"✅ Platform AI is working — free for all users.");
        else{const e=await r.json().catch(()=>({}));setTestResult("❌ "+(e?.error||"Proxy error "+r.status));}
      }
    }catch(e){setTestResult("❌ "+e.message);}
    setTesting(false);
  };

  return(
    <div className="gcol fa">

      {/* ── AI Mode Banner ── */}
      <div className="card" style={{padding:0,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)"}}>
          {[
            {
              id:"platform",
              icon:"🌐",
              title:"Platform AI",
              sub:"Free for everyone",
              desc:"TradeDesk's built-in Groq key powers your analysis. No setup needed. Shared rate limits.",
              active:usingPlatform,
              color:"var(--acc-hi)",
              bg:"rgba(99,102,241,.08)",
              border:"rgba(99,102,241,.25)",
            },
            {
              id:"own",
              icon:"🔑",
              title:"Your Own Key",
              sub:"Unlimited usage",
              desc:"Paste your Groq key for higher rate limits. Key stays in your browser only — never on our servers.",
              active:usingOwnKey,
              color:"var(--g)",
              bg:"rgba(52,211,153,.08)",
              border:"rgba(52,211,153,.25)",
            },
            {
              id:"local",
              icon:"💻",
              title:"Local Dev",
              sub:"Direct Groq call",
              desc:"Running on localhost. Calls go directly to Groq API. Your key required in Settings.",
              active:usingLocal,
              color:"var(--amber)",
              bg:"rgba(245,158,11,.08)",
              border:"rgba(245,158,11,.25)",
            },
          ].map((tier,i)=>(
            <div key={tier.id} style={{
              padding:"18px 20px",
              borderRight:i<2?"1px solid var(--b1)":"none",
              background:tier.active?tier.bg:"transparent",
              borderBottom:tier.active?"3px solid "+tier.color:"3px solid transparent",
              transition:"all .2s",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:18}}>{tier.icon}</span>
                <div>
                  <div style={{fontWeight:700,fontSize:12,color:tier.active?tier.color:"var(--t2)"}}>{tier.title}</div>
                  <div style={{fontSize:9,color:"var(--t3)",fontWeight:600,letterSpacing:.5}}>{tier.sub}</div>
                </div>
                {tier.active&&<span style={{marginLeft:"auto",fontSize:8,fontWeight:700,padding:"2px 7px",borderRadius:10,background:tier.bg,color:tier.color,border:"1px solid "+tier.border}}>ACTIVE</span>}
              </div>
              <div style={{fontSize:10.5,color:"var(--t3)",lineHeight:1.7}}>{tier.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Your Own Key (optional upgrade) ── */}
      <div className="card">
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
          <div>
            <div className="ct">Your Groq API Key <span style={{fontSize:10,color:"var(--g)",fontWeight:600,marginLeft:6}}>Optional</span></div>
            <div style={{fontSize:10.5,color:"var(--t3)",marginTop:3,lineHeight:1.6}}>
              All users get free AI analysis via the platform key. Add your own for unlimited usage &amp; higher rate limits.
            </div>
          </div>
          {userGroqKey&&(
            <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,background:"rgba(52,211,153,.1)",color:"var(--g)",border:"1px solid rgba(52,211,153,.2)",fontSize:10,fontWeight:700,flexShrink:0,marginLeft:12}}>
              ● Your key active
            </span>
          )}
        </div>

        <div style={{position:"relative",marginBottom:10}}>
          <input
            className="inp"
            type={keyVisible?"text":"password"}
            placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx  (optional)"
            value={tempKey}
            onChange={e=>{setTempKey(e.target.value);setSaved(false);setTestResult(null);}}
            style={{paddingRight:40}}
          />
          <span
            onClick={()=>setKeyVisible(v=>!v)}
            style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:12,color:"var(--t3)",userSelect:"none"}}
          >{keyVisible?"🙈":"👁"}</span>
        </div>

        <div style={{fontSize:10,color:"var(--t3)",marginBottom:12,display:"flex",gap:6,alignItems:"center"}}>
          <span>Get a free key at</span>
          <strong style={{color:"var(--acc-hi)"}}>console.groq.com</strong>
          <span>→ API Keys → Create (30 req/min free)</span>
        </div>

        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="btn btn-p btn-sm" onClick={()=>{setGroqKey(tempKey.trim());setSaved(true);setTimeout(()=>setSaved(false),2500);}}>
            <I n="check" s={11}/>{saved?"Saved!":tempKey.trim()?"Save & Activate Key":"Save (clear key)"}
          </button>
          {userGroqKey&&(
            <button className="btn btn-g btn-sm" style={{color:"var(--r)"}} onClick={()=>{setTempKey("");setGroqKey("");setSaved(false);setTestResult("Key removed — using platform AI");}}>
              Remove Key
            </button>
          )}
          <button className="btn btn-g btn-sm" onClick={()=>testKey(tempKey.trim())} disabled={testing}>
            {testing?"Testing…":"Test Connection"}
          </button>
        </div>

        {testResult&&(
          <div style={{marginTop:10,fontSize:11,padding:"9px 12px",borderRadius:8,
            background:testResult.startsWith("✅")?"rgba(52,211,153,.08)":"rgba(251,113,133,.08)",
            border:"1px solid "+(testResult.startsWith("✅")?"rgba(52,211,153,.25)":"rgba(251,113,133,.25)"),
            color:testResult.startsWith("✅")?"var(--g)":"var(--r)",lineHeight:1.6}}>
            {testResult}
          </div>
        )}

        {/* How it works */}
        <div style={{marginTop:14,padding:"12px 14px",background:"var(--bg)",borderRadius:8,border:"1px solid var(--b1)"}}>
          <div style={{fontSize:9,color:"var(--t3)",letterSpacing:1.5,marginBottom:10,fontWeight:700,textTransform:"uppercase"}}>How AI routing works</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              {step:"1",label:"No key saved",action:"→ Platform AI (free, your Groq key on the server)",c:"var(--acc-hi)"},
              {step:"2",label:"Your key saved",action:"→ Your key passed per-request (never stored server-side)",c:"var(--g)"},
              {step:"3",label:"Local dev",action:"→ Direct call to Groq with your key",c:"var(--amber)"},
            ].map(r=>(
              <div key={r.step} style={{display:"flex",gap:10,alignItems:"flex-start",fontSize:10.5}}>
                <span style={{width:18,height:18,borderRadius:"50%",background:"var(--s3)",color:r.c,fontSize:9,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{r.step}</span>
                <span style={{color:"var(--t2)"}}><strong style={{color:"var(--t1)"}}>{r.label}</strong> {r.action}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:10,fontSize:10,color:"var(--t3)",padding:"7px 10px",background:"var(--s2)",borderRadius:6,lineHeight:1.7}}>
            🔒 Your key is stored only in <strong style={{color:"var(--t2)"}}>your browser's localStorage</strong>. It is never saved to Supabase or any server. When you clear browser data, it's gone.
          </div>
        </div>
      </div>

      {/* Manual Charges Override */}
      <div className="card">
        <div className="ct" style={{marginBottom:6}}>💸 Broker Charges</div>
        <div style={{fontSize:10.5,color:"var(--t3)",marginBottom:14,lineHeight:1.7}}>
          Charges are auto-detected from your uploaded broker report. You can override manually here — they are subtracted from Gross P&L to show your true Net P&L.
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:9.5,color:"var(--t3)",letterSpacing:.5,marginBottom:6}}>TOTAL CHARGES (₹)</div>
          <input className="inp" type="number" placeholder="e.g. 54137" value={tempCharges}
            onChange={e=>setTempCharges(parseFloat(e.target.value)||0)}/>
          <div style={{fontSize:9.5,color:"var(--t3)",marginTop:5}}>
            Includes: Brokerage + STT + Exchange charges + SEBI charges + GST + Stamp duty
          </div>
        </div>
        <button className="btn btn-p btn-sm" onClick={()=>setTotalCharges(tempCharges)}>Apply Charges</button>
        {totalCharges>0&&<span style={{marginLeft:10,fontSize:10.5,color:"var(--r)"}}>Currently deducting −{fmtC(totalCharges)}</span>}
      </div>

      {/* Netlify Deploy Guide */}
      <div className="card">
        <div className="ct" style={{marginBottom:4}}>🚀 Deploy to Netlify — Access from Phone, Anywhere</div>
        <div style={{fontSize:10.5,color:"var(--t3)",marginBottom:18,lineHeight:1.7}}>
          Deploy once → get a permanent URL → open on any phone/tablet without your laptop being on. Free forever on Netlify.
        </div>

        {[
          {n:"1",color:"var(--acc)",title:"Download this file",steps:[
            "Click ↓ download on this artifact (top-right of the artifact panel)",
            "Save as: trading-tracker-v8.jsx",
          ]},
          {n:"2",color:"var(--acc2)",title:"Install Node.js (one-time)",steps:[
            "Visit: nodejs.org → Download LTS (v20+)",
            "Install with defaults. Then open Terminal and verify:",
            "node --version   →  should print v20.x.x",
          ]},
          {n:"3",color:"var(--b06eff)",title:"Create the Vite project",steps:[
            "npm create vite@latest tradedesk -- --template react",
            "cd tradedesk",
            "npm install",
            "npm install recharts xlsx",
          ]},
          {n:"4",color:"var(--g)",title:"Drop in the app code",steps:[
            "Open tradedesk/src/App.jsx in any editor (VS Code recommended)",
            "Select all → delete → paste the entire trading-tracker-v8.jsx content",
            "Open tradedesk/index.html, add inside <head>:",
            `<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Clash+Display:wght@400;500;600;700&display=swap" rel="stylesheet">`,
            "Optional: delete src/App.css and src/index.css",
          ]},
          {n:"5",color:"var(--y)",title:"Test locally first",steps:[
            "npm run dev",
            "Open browser → http://localhost:5173",
            "Upload your Groww F&O report, verify data looks correct",
          ]},
          {n:"6",color:"var(--o)",title:"Build & deploy to Netlify",steps:[
            "npm run build   →  creates a dist/ folder",
            "Go to: app.netlify.com/drop  (no account needed initially)",
            "Drag the dist/ folder into the Netlify drop zone",
            "Get your permanent URL: e.g. tradedesk-abc123.netlify.app",
            "Open that URL on your phone → add to Home Screen for app-like feel",
            "Tip: create a free Netlify account to keep the URL permanent & redeploy easily",
          ]},
          {n:"7",color:"var(--acc)",title:"Set up Groq key on your phone",steps:[
            "Open your Netlify URL on phone",
            "Go to Settings → paste your Groq API key → Save",
            "Key saves in browser storage on your phone automatically",
            "Now AI Chat works on mobile without needing your laptop",
          ]},
        ].map(step=>(
          <div key={step.n} style={{marginBottom:18,borderLeft:`3px solid ${step.color}`,paddingLeft:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{background:step.color,color:"var(--bg)",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,flexShrink:0}}>{step.n}</span>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,fontSize:13}}>{step.title}</div>
            </div>
            {step.steps.map((s,i)=>{
              const isCmd=s.startsWith("npm ")||s.startsWith("cd ")||s.startsWith("node ")||s.startsWith("npx ")||s.startsWith("Open browser");
              const isCode=s.startsWith("<link")||s.startsWith("tradedesk-");
              return(
                <div key={i} style={{display:"flex",gap:8,marginBottom:5,fontSize:10.5,color:"var(--t2)",lineHeight:1.6,alignItems:"flex-start"}}>
                  <span style={{color:step.color,flexShrink:0}}>→</span>
                  <code style={{
                    fontFamily:isCmd||isCode?"'IBM Plex Mono',monospace":"inherit",
                    fontSize:isCmd||isCode?10:10.5,
                    color:isCmd?"var(--acc)":isCode?"var(--acc3)":"var(--t2)",
                    background:isCmd||isCode?"rgba(255,255,255,.04)":"transparent",
                    padding:isCmd||isCode?"2px 5px":"0",
                    borderRadius:4,
                  }}>{s}</code>
                </div>
              );
            })}
          </div>
        ))}

        <div style={{background:"rgba(124,58,237,.06)",border:"1px solid rgba(124,58,237,.2)",borderRadius:8,padding:"12px 14px",marginTop:4}}>
          <div style={{fontWeight:600,color:"var(--acc)",marginBottom:6,fontSize:12}}>⚡ TL;DR — 8 steps</div>
          <div style={{fontSize:10.5,color:"var(--t2)",lineHeight:2,fontFamily:"'IBM Plex Mono',monospace"}}>
            Download JSX → Install Node → npm create vite → npm install recharts xlsx → Paste code into App.jsx → npm run build → Drag dist/ to netlify.com/drop → Open URL on phone
          </div>
        </div>
      </div>

      {/* Data & Privacy */}
      <div className="card">
        <div className="ct" style={{marginBottom:12}}>🔒 Data & Privacy</div>
        <div style={{fontSize:11,color:"var(--t2)",lineHeight:2}}>
          ✓ All trade data stored <strong>only in your browser</strong> — never sent to any server<br/>
          ✓ AI analysis sends only your anonymized trade stats to Groq/Anthropic<br/>
          ✓ No account, no login, no tracking<br/>
          ✓ localStorage persists your data across sessions (Groq key, trades, notes, tags)
        </div>
        {onClear&&(
          <button className="btn btn-g btn-sm" style={{color:"var(--r)",marginTop:14}} onClick={()=>{if(window.confirm("Clear all imported trades, notes and tags? (Sample data will reload)"))onClear();}}>
            🗑 Clear All Data
          </button>
        )}
      </div>
    </div>
  );
};


/* ════════════════════════ STRATEGY TAGS VIEW ══════════════════ */
const StrategyView = ({trades,tags}) => {
  const tagStats=useMemo(()=>{
    const m={};
    STRATEGY_TAGS.forEach(tg=>{m[tg]={tag:tg,trades:[],pnl:0,wins:0};});
    Object.entries(tags).forEach(([tid,tgs])=>{
      const t=trades.find(tr=>String(tr.id)===String(tid));
      if(!t||t.open) return;
      tgs.forEach(tg=>{if(m[tg]){m[tg].trades.push(t);m[tg].pnl+=t.pnl;if(t.pnl>0)m[tg].wins++;}});
    });
    return Object.values(m).filter(s=>s.trades.length>0).sort((a,b)=>b.pnl-a.pnl);
  },[trades,tags]);

  const radarData=tagStats.map(s=>({tag:s.tag,winRate:s.trades.length?Math.round(s.wins/s.trades.length*100):0,trades:s.trades.length,pnl:s.pnl}));

  return(
    <div className="gcol fa">
      {tagStats.length===0?(
        <div className="card" style={{textAlign:"center",padding:40}}>
          <div style={{fontSize:32,marginBottom:12}}>🏷️</div>
          <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:600,marginBottom:8}}>No Strategy Tags Yet</div>
          <div style={{color:"var(--t2)",fontSize:11}}>Go to Trade History and click "+ tag" on any trade to tag it with a strategy. Then come back here to see which strategies work best for you.</div>
        </div>
      ):(
        <>
          <div className="g3" style={{gap:12}}>
            {tagStats.map(s=>(
              <div key={s.tag} className="card">
                <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:600,fontSize:14,marginBottom:10}}>{s.tag}</div>
                <div className="row" style={{justifyContent:"space-between"}}>
                  <div><div style={{fontSize:9,color:"var(--t3)"}}>P&L</div><div className={s.pnl>=0?"green":"red"} style={{fontWeight:600,fontSize:15}}>{fmtC(s.pnl)}</div></div>
                  <div><div style={{fontSize:9,color:"var(--t3)"}}>TRADES</div><div style={{fontWeight:600,fontSize:15}}>{s.trades.length}</div></div>
                  <div><div style={{fontSize:9,color:"var(--t3)"}}>WIN RATE</div><div className={s.wins/s.trades.length>=.5?"green":"red"} style={{fontWeight:600,fontSize:15}}>{Math.round(s.wins/s.trades.length*100)}%</div></div>
                </div>
              </div>
            ))}
          </div>
          {radarData.length>=3&&(
            <div className="card">
              <div className="ct" style={{marginBottom:14}}>Strategy Win Rate Radar</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--b2)"/>
                  <PolarAngleAxis dataKey="tag" tick={{fontSize:9,fill:"var(--t2)"}}/>
                  <Radar name="Win Rate" dataKey="winRate" stroke="#6366f1" fill="#6366f1" fillOpacity={.2}/>
                  <Tooltip content={<TT/>} wrapperStyle={{outline:"none"}} cursor={{fill:"rgba(255,255,255,.04)"}}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
};


/* ════════════════════════ AUTH PAGE ═════════════════════════════
   Login · Signup · Google OAuth · Password Reset
   Uses the G() CSS classes (auth-page, auth-card etc)
════════════════════════════════════════════════════════════════ */
const AuthPage = ({ supabase }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const go = (m) => { setMode(m); setError(null); setSuccess(null); };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        if (!name.trim()) throw new Error("Please enter your name");
        if (password.length < 8) throw new Error("Password must be at least 8 characters");
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() } } });
        if (error) throw error;
        setSuccess("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) throw error;
        setSuccess("Password reset link sent to " + email);
      }
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const googleLogin = async () => {
    if(!supabase){setError("Supabase not configured yet.");return;}
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fa">
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:48,height:48,borderRadius:14,background:"linear-gradient(135deg,var(--acc),#4f46e5)",marginBottom:14,boxShadow:"var(--acc-glow)",fontFamily:"'Outfit',sans-serif",fontSize:20,fontWeight:800,color:"#fff"}}>TD</div>
          <div style={{fontFamily:"'Outfit',sans-serif",fontSize:24,fontWeight:800,color:"var(--t1)",letterSpacing:"-0.5px",lineHeight:1}}>TradeDesk</div>
          <div style={{fontSize:10,color:"var(--t3)",letterSpacing:2.5,marginTop:5,textTransform:"uppercase",fontWeight:600}}>F&O Analytics Platform</div>
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontFamily:"'Outfit',sans-serif",fontSize:17,fontWeight:700,color:"var(--t1)",marginBottom:4}}>
            {mode==="login"?"Welcome back":mode==="signup"?"Create account":"Reset password"}
          </div>
          <div style={{fontSize:12,color:"var(--t3)",lineHeight:1.6}}>
            {mode==="login"?"Sign in to your TradeDesk account":mode==="signup"?"Free · All analytics · No card needed":"We\'ll email you a reset link"}
          </div>
        </div>
        {error&&<div style={{background:"var(--r-dim)",border:"1px solid rgba(244,63,94,.25)",borderRadius:8,padding:"10px 14px",fontSize:11.5,color:"var(--r)",marginBottom:16,lineHeight:1.6}}>{error}</div>}
        {success&&<div style={{background:"var(--g-dim)",border:"1px solid rgba(34,211,160,.2)",borderRadius:8,padding:"10px 14px",fontSize:11.5,color:"var(--g)",marginBottom:16,lineHeight:1.6}}>{success}</div>}

        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:13}}>
          {mode==="signup"&&<div><div style={{fontSize:10,color:"var(--t3)",letterSpacing:1,marginBottom:5,textTransform:"uppercase",fontWeight:600}}>Full name</div><input className="inp" type="text" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} required autoComplete="name"/></div>}
          <div>
            <div style={{fontSize:10,color:"var(--t3)",letterSpacing:1,marginBottom:5,textTransform:"uppercase",fontWeight:600}}>Email</div>
            <input className="inp" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/>
          </div>
          {mode!=="reset"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                <div style={{fontSize:10,color:"var(--t3)",letterSpacing:1,textTransform:"uppercase",fontWeight:600}}>Password</div>
                {mode==="login"&&<span style={{fontSize:10.5,color:"var(--acc)",cursor:"pointer"}} onClick={()=>go("reset")}>Forgot?</span>}
              </div>
              <input className="inp" type="password" placeholder={mode==="signup"?"At least 8 characters":"••••••••"} value={password} onChange={e=>setPassword(e.target.value)} required autoComplete={mode==="signup"?"new-password":"current-password"}/>
            </div>
          )}
          <button className="btn btn-p" type="submit" disabled={loading} style={{width:"100%",justifyContent:"center",padding:"12px",fontSize:13,marginTop:6,borderRadius:9}}>
            {loading?"Please wait...":(mode==="login"?"Sign in":mode==="signup"?"Create free account":"Send reset link")}
          </button>
        </form>
        <div style={{textAlign:"center",marginTop:20,fontSize:12,color:"var(--t3)"}}>
          {mode==="login"&&<>Don\'t have an account? <span style={{color:"var(--acc)",cursor:"pointer",fontWeight:600}} onClick={()=>go("signup")}>Sign up free</span></>}
          {mode==="signup"&&<>Have an account? <span style={{color:"var(--acc)",cursor:"pointer",fontWeight:600}} onClick={()=>go("login")}>Sign in</span></>}
          {mode==="reset"&&<span style={{color:"var(--acc)",cursor:"pointer",fontWeight:600}} onClick={()=>go("login")}>← Back to sign in</span>}
        </div>
      </div>
    </div>
  );
};


/* ════════════ SUPABASE DATA SYNC ════════════════════════════════
   On first login, push any data the user created while logged-out
   (trades, tags, notes) up to Supabase so it persists across devices.
   Subsequent changes sync incrementally via the save handlers.
════════════════════════════════════════════════════════════════ */
const syncLocalDataToSupabase = async (supabase, userId) => {
  try {
    // Push trades if local data exists and Supabase row doesn't yet
    const localTrades = localStorage.getItem("td_trades");
    const localTags   = localStorage.getItem("td_tags");
    const localNotes  = localStorage.getItem("td_notes");
    const localCharges= localStorage.getItem("td_charges");

    if (localTrades) {
      const { data: existing } = await supabase
        .from("trade_imports")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
      if (!existing || existing.length === 0) {
        await supabase.from("trade_imports").upsert({
          user_id: userId,
          file_name: "local_import",
          trades: JSON.parse(localTrades),
          charges: parseFloat(localCharges || "0"),
        });
      }
    }
    if (localTags || localNotes) {
      await supabase.from("user_settings").upsert({
        user_id: userId,
        tags:  JSON.parse(localTags  || "{}"),
        notes: JSON.parse(localNotes || "{}"),
        preferences: {},
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }
  } catch(e) {
    console.warn("[TradeDesk] Supabase sync skipped:", e.message);
  }
};

/* ══════════════════════════ ROOT APP ════════════════════════════ */
export default function App() {
  // ── Auth state ──────────────────────────────────────────────
  // When Supabase is set up, import supabase and replace these lines with:
  //   const [user, setUser] = useState(null);
  //   const [authLoading, setAuthLoading] = useState(true);
  //   useEffect(() => {
  //     supabase.auth.getSession().then(({ data }) => {
  //       setUser(data.session?.user ?? null);
  //       setAuthLoading(false);
  //     });
  //     const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
  //       setUser(session?.user ?? null);
  //     });
  //     return () => subscription.unsubscribe();
  //   }, []);
  //
  //   const userPlan = user?.profile?.plan || "free";
  //   if (authLoading) return <LoadingScreen />;
  //   if (!user) return <AuthPage supabase={typeof supabase !== 'undefined' ? supabase : null}/>;  // uncomment supabase import to enable
  //
  // For now (pre-Supabase), app works as before with localStorage:
  // ══ SUPABASE AUTH ══════════════════════════════════════════════
  // Step 1: npm install @supabase/supabase-js
  // Step 2: create src/supabaseClient.js (provided in phase1/src/)
  // Step 3: uncomment the two imports at top of this file
  // Step 4: remove the mock lines below and uncomment the real auth block
  // ───────────────────────────────────────────────────────────────

  // ── Supabase auth — reads window.__supabase set in index.html ────────────
  const supabase = (typeof window !== "undefined" && window.__supabase) || null;

  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let settled = false;

    const finish = (u) => {
      if (!settled) {
        settled = true;
        setAuthLoading(false);
      }
    };

    // Fallback: never hang forever — force-unblock after 4 seconds
    const timeout = setTimeout(() => finish(), 4000);

    // Get existing session on mount
    supabase.auth.getSession().then(async ({data}) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) {
        try {
          const {data: prof} = await supabase
            .from("profiles").select("*").eq("id", u.id).single();
          setUserProfile(prof);
        } catch(e) {}
        syncLocalDataToSupabase(supabase, u.id);
      }
      finish(u);
    }).catch(() => finish());

    // Listen for auth changes (login / logout / token refresh)
    const {data:{subscription}} = supabase.auth.onAuthStateChange(async (_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        try {
          const {data: prof} = await supabase
            .from("profiles").select("*").eq("id", u.id).single();
          setUserProfile(prof);
        } catch(e) {}
      }
      // Also unblock loading in case getSession resolved with no session
      // but onAuthStateChange fires after the redirect with the real session
      finish(u);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [supabase]);

  // ── ALL remaining hooks MUST come before any conditional return (React rules) ──
  const [view,setView]=useState("dashboard");
  const [selStock,setSelStock]=useState(null);
  const [analyzeStock,setAnalyzeStock]=useState(null);
  const [editTagTrade,setEditTagTrade]=useState(null);
  const [usingReal,setUsingReal]=useState(()=>!!localStorage.getItem("td_using_real"));
  const [trades,setTrades]=useState(()=>{
    try{
      const saved=localStorage.getItem("td_trades");
      if(saved){const parsed=JSON.parse(saved);if(parsed?.length)return parsed;}
    }catch(e){}
    return processTrades(SAMPLE_TRADES_RAW);
  });
  const [tags,setTagsRaw]=useState(()=>{try{return JSON.parse(localStorage.getItem("td_tags")||"{}");}catch(e){return {};}});
  const [notes,setNotesRaw]=useState(()=>{try{return JSON.parse(localStorage.getItem("td_notes")||"{}");}catch(e){return {};}});
  const [userGroqKey,setUserGroqKeyRaw]=useState(()=>localStorage.getItem("td_groq_key")||"");
  const setGroqKey=(k)=>{setUserGroqKeyRaw(k);k?localStorage.setItem("td_groq_key",k):localStorage.removeItem("td_groq_key");};
  const groqKey = IS_LOCAL ? (userGroqKey||"") : "proxy";
  const [aiProvider,setAiProvider]=useState("groq");
  const [toast,setToast]=useState(null);
  const [totalCharges,setTotalChargesRaw]=useState(()=>{
    try{return parseFloat(localStorage.getItem("td_charges")||"0");}catch(e){return 0;}
  });
  // Persist helpers
  const setTotalCharges=(v)=>{setTotalChargesRaw(v);localStorage.setItem("td_charges",String(v));};
  const setTags=(fn)=>setTagsRaw(prev=>{const next=typeof fn==="function"?fn(prev):fn;localStorage.setItem("td_tags",JSON.stringify(next));return next;});
  const setNotes=(fn)=>setNotesRaw(prev=>{const next=typeof fn==="function"?fn(prev):fn;localStorage.setItem("td_notes",JSON.stringify(next));return next;});

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),2800);};

  const onImport=useCallback((newTrades, charges=0)=>{
    setTrades(newTrades);
    setUsingReal(true);
    setTotalCharges(charges);
    localStorage.setItem("td_trades",JSON.stringify(newTrades));
    localStorage.setItem("td_using_real","1");
    setView("dashboard");
    showToast("✓ "+newTrades.length+" trades imported"+(charges>0?" · ₹"+charges.toLocaleString("en-IN")+" charges detected":""));
  },[]);

  const clearData=()=>{
    ["td_trades","td_using_real","td_tags","td_notes","td_charges"].forEach(k=>localStorage.removeItem(k));
    setTrades(processTrades(SAMPLE_TRADES_RAW));
    setUsingReal(false);
    setTotalChargesRaw(0);
    setTagsRaw({});setNotesRaw({});
    showToast("Data cleared — showing sample data","warn");
  };

  // Export trades as CSV
  const exportCSV=()=>{
    const closed=trades.filter(t=>!t.open);
    const hdr=["Stock","Type","Strike","Expiry","Buy Date","Buy Price","Sell Date","Sell Price","Qty","P&L","P&L%","Days","Sector","Capital"];
    const rows=closed.map(t=>[t.stock,t.instrType||"EQ",t.strike||"",t.expiry||"",t.buyDate,t.buyPrice,t.sellDate,t.sellPrice,t.qty,t.pnl,t.pnlPct,t.days,t.sector,t.invested]);
    const csv=[hdr,...rows].map(r=>r.map(v=>JSON.stringify(v??"")||'""').join(",")).join("\n");
    const a=document.createElement("a");a.href="data:text/csv;charset=utf-8,"+encodeURIComponent(csv);
    a.download=`TradeDesk_Export_${new Date().toISOString().slice(0,10)}.csv`;a.click();
    showToast("✓ CSV exported");
  };

  // Keyboard shortcuts
  useEffect(()=>{
    const handle=(e)=>{
      if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA") return;
      const map={"1":"dashboard","2":"history","3":"events","4":"calendar","5":"sector","6":"risk","7":"correlation","8":"strategy","9":"journal","0":"upload"};
      if(map[e.key]){setView(map[e.key]);return;}
      if(e.key==="Escape"){setAnalyzeStock(null);}
    };
    window.addEventListener("keydown",handle);
    return ()=>window.removeEventListener("keydown",handle);
  },[]);

  // Inject PWA meta tags dynamically (for self-hosted prod)
  useEffect(()=>{
    document.title="TradeDesk — F&O Analytics";
    const setMeta=(n,c,isOG=false)=>{
      const attr=isOG?"property":"name";
      let m=document.querySelector(`meta[${attr}="${n}"]`);
      if(!m){m=document.createElement("meta");m.setAttribute(attr,n);document.head.appendChild(m);}
      m.setAttribute("content",c);
    };
    setMeta("description","Professional F&O and equity trading analytics dashboard for Indian traders");
    setMeta("theme-color","var(--bg)");
    setMeta("mobile-web-app-capable","yes");
    setMeta("apple-mobile-web-app-capable","yes");
    setMeta("apple-mobile-web-app-status-bar-style","black-translucent");
    setMeta("og:title","TradeDesk",true);
    setMeta("og:description","Your personal F&O trading analytics",true);
    // Viewport for mobile
    let vp=document.querySelector('meta[name="viewport"]');
    if(!vp){vp=document.createElement("meta");vp.name="viewport";document.head.appendChild(vp);}
    vp.content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no";
  },[]);

  const onStock=useCallback((stock)=>{setSelStock(stock);setView("stock");},[]);
  const onAnalyze=useCallback((stock)=>setAnalyzeStock(stock),[]);

  const overall=useMemo(()=>buildOverall(trades, totalCharges),[trades, totalCharges]);
  const stockStats=useMemo(()=>buildStockStats(trades.filter(t=>!t.open)),[trades]);
  const equityCurve=useMemo(()=>buildEquityCurve(trades),[trades]);

  // ── Now safe to do conditional returns — all hooks declared above ──

  if (authLoading) return (
    <>
      <G/>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"var(--bg)",gap:14,flexDirection:"column"}}>
        <div style={{width:40,height:40,borderRadius:"50%",border:"2px solid var(--b2)",borderTopColor:"var(--acc)",animation:"spin .8s linear infinite"}}/>
        <div style={{fontSize:11,color:"var(--t3)",letterSpacing:2,textTransform:"uppercase",fontWeight:600}}>Loading TradeDesk</div>
      </div>
    </>
  );

  // Gate: show auth page when Supabase is configured and user is not signed in
  if (supabase && !user) return (
    <>
      <G/>
      <AuthPage supabase={supabase}/>
    </>
  );

  // ── Derived values (safe after hooks + conditional returns) ──
  const ADMIN_EMAIL = (typeof window !== "undefined" && window.__ADMIN_EMAIL) || "";
  const isAdmin = user?.email && ADMIN_EMAIL && user.email === ADMIN_EMAIL;
  const userPlan = isAdmin ? "pro" : (userProfile?.plan || "free");
  const canUseAI = isAdmin || userPlan === "basic" || userPlan === "pro";
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Demo";

  const handleSignOut = async () => {
    try{ if(supabase) await supabase.auth.signOut(); }catch(e){}
    showToast("Signed out");
    window.location.reload();
  };


  const NAV=[
    {id:"dashboard",label:"Dashboard",icon:"dash",key:"1"},
    {id:"history",label:"Trade History",icon:"hist",key:"2"},
    {id:"events",label:"Market Events",icon:"ev",key:"3"},
    {id:"calendar",label:"Calendar",icon:"cal",key:"4"},
    {id:"sector",label:"Sector Heatmap",icon:"heat",key:"5"},
    {id:"risk",label:"Risk & Kelly",icon:"risk",key:"6"},
    {id:"correlation",label:"Correlation",icon:"corr",key:"7"},
    {id:"strategy",label:"Strategy Tags",icon:"tag",key:"8"},
    {id:"journal",label:"Journal",icon:"journal",key:"9"},
    {id:"upload",label:"Import Report",icon:"up",key:"0"},
    {id:"settings",label:"AI Settings",icon:"ai"},
  ];

  const titles={dashboard:"Overview",history:"Trade History",events:"Market Events",calendar:"Trade Calendar",sector:"Sector Heatmap",risk:"Risk & Kelly Criterion",correlation:"Nifty Correlation",strategy:"Strategy Analysis",journal:"Trade Journal",upload:"Import Broker Report",settings:"AI & Deployment Settings",stock:`${selStock} — Detail`};

  return(
    <>
      <G/>
      <div className="app">
        {/* Sidebar */}
        <div className="sb">
          <div className="sb-logo">
            <div className="sb-logo-icon">TD</div>
            <div className="sb-logo-words">
              <h1>TradeDesk</h1>
              <span>v17 · Analytics</span>
            </div>
          </div>
          <div className="sb-nav">
            {usingReal&&<div className="real-badge"><span className="real-badge-dot"/>Real data loaded</div>}
            {NAV.map((n,i)=>{
              const isActive=view===n.id||(view==="stock"&&n.id==="history");
              return(
                <div key={n.id}>
                  {i===9&&<div className="sb-sec">Data & Config</div>}
                  {i===0&&<div className="sb-sec">Analytics</div>}
                  <div className={`nb ${isActive?"on":""}`} onClick={()=>{if(n.id!=="stock")setView(n.id);}}>
                    <I n={n.icon} s={13}/>
                    <span style={{flex:1}}>{n.label}</span>
                    {n.key&&<span style={{fontSize:8,color:"var(--t4)",opacity:.6}}>{n.key}</span>}
                  </div>
                </div>
              );
            })}
            {stockStats.length>0&&<div className="sb-sec">My Stocks</div>}
            {stockStats.map(s=>(
              <div key={s.stock} className={`nb ${view==="stock"&&selStock===s.stock?"on":""}`} onClick={()=>onStock(s.stock)}>
                <div className="dot" style={{background:s.totalPnl>=0?"var(--g)":"var(--r)"}}/>
                <span style={{flex:1,fontSize:11}}>{s.stock}</span>
                <span style={{fontSize:9,color:s.totalPnl>=0?"var(--g)":"var(--r)"}}>{s.totalPnl>=0?"+":"−"}</span>
              </div>
            ))}
          </div>
          <div className="sb-foot">
            <div className="pnl-pill">
              <div className="pnl-pill-label">Portfolio P&amp;L</div>
              <div className={"pnl-pill-value "+(overall.totalPnl>=0?"green":"red")}>{fmtC(overall.totalPnl)}</div>
              <div className="pnl-pill-sub">{overall.totalTrades}T &nbsp;&middot;&nbsp; <span className={overall.roi>=0?"green":"red"}>{overall.roi}% ROI</span></div>
            </div>
            <div className="user-row" onClick={()=>setView("settings")}>
              <div className="user-avatar">{user?.email?user.email.slice(0,2).toUpperCase():"TD"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11.5,color:"var(--t1)",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.user_metadata?.full_name||user?.email?.split("@")[0]||"My Account"}</div>
                <div style={{fontSize:9,color:userPlan==="pro"?"var(--acc3)":userPlan==="basic"?"var(--acc)":"var(--t3)",marginTop:2,textTransform:"uppercase",letterSpacing:.5,fontWeight:600}}>{userPlan} plan</div>
              </div>
              <I n="settings" s={11}/>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="main">
          <TickerBar niftyData={NIFTY_DATA}/>
          <div className="topbar">
            <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
              <div className="topbar-title">{titles[view]||view}</div>
              {usingReal&&<span className="live-pill">Live</span>}
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
              {view==="stock"&&selStock&&<button className="btn btn-p btn-sm" onClick={()=>onAnalyze(selStock)}><I n="ai" s={11}/>AI Report</button>}
              <button className="btn btn-g btn-sm" onClick={exportCSV}><I n="up" s={11}/>Export</button>
              <button className="btn btn-g btn-sm" onClick={()=>setView("upload")}>Import</button>
              <button className="btn btn-g btn-sm" onClick={()=>setView("settings")}>Settings</button>
              {usingReal&&<button className="btn btn-r btn-sm" onClick={clearData}>Clear</button>}
            </div>
          </div>
          <div className="content">
            {view==="dashboard"&&<Dashboard trades={trades} overall={overall} stockStats={stockStats} equityCurve={equityCurve} onStock={onStock}/>}
            {view==="history"&&<History trades={trades} onStock={onStock} onAnalyze={onAnalyze} tags={tags} setTags={setTags} groqKey={groqKey} onEditTag={setEditTagTrade}/>}
            {view==="events"&&<EventsView trades={trades}/>}
            {view==="calendar"&&<CalendarView trades={trades}/>}
            {view==="sector"&&<SectorHeatmap trades={trades} onStock={onStock}/>}
            {view==="risk"&&<RiskCalc trades={trades} overall={overall}/>}
            {view==="correlation"&&<Correlation trades={trades}/>}
            {view==="strategy"&&<StrategyView trades={trades} tags={tags}/>}
            {view==="journal"&&<Journal trades={trades} notes={notes} setNotes={setNotes}/>}
            {view==="upload"&&<UploadView onImport={onImport}/>}
            {view==="settings"&&<SettingsView userGroqKey={userGroqKey} setGroqKey={setGroqKey} totalCharges={totalCharges} setTotalCharges={setTotalCharges} aiProvider={aiProvider} setAiProvider={setAiProvider} onClear={clearData}/>}
            {view==="stock"&&selStock&&<StockDetail stock={selStock} trades={trades} niftyData={NIFTY_DATA} onAnalyze={onAnalyze} groqKey={groqKey}/>}
          </div>
        </div>

        {/* AI Modal */}
        {analyzeStock&&<AIModal stock={analyzeStock} trades={trades} stockStats={stockStats} groqKey={groqKey} onClose={()=>setAnalyzeStock(null)}/>}

        {/* Strategy Tag Modal — at App root, outside all overflow:hidden containers */}
        {editTagTrade&&(
          <div
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}
            onClick={e=>e.target===e.currentTarget&&setEditTagTrade(null)}
          >
            <div style={{background:"var(--s1)",border:"1px solid var(--b2)",borderRadius:"var(--radius-lg)",padding:28,minWidth:320,maxWidth:460,width:"100%",boxShadow:"var(--shadow-lg)"}}>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:700,fontSize:16,marginBottom:6,color:"var(--t1)"}}>Tag Strategy</div>
              <div style={{fontSize:10.5,color:"var(--t3)",marginBottom:18}}>Select one or more strategies for this trade</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:24}}>
                {STRATEGY_TAGS.map(tg=>{
                  const active=(tags[editTagTrade]||[]).includes(tg);
                  return(
                    <span key={tg}
                      onClick={()=>setTags(prev=>{
                        const cur=prev[editTagTrade]||[];
                        return {...prev,[editTagTrade]:active?cur.filter(x=>x!==tg):[...cur,tg]};
                      })}
                      style={{
                        padding:"7px 16px",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:500,
                        background:active?"var(--acc)":"var(--s2)",
                        color:active?"#fff":"var(--t2)",
                        border:"1px solid "+(active?"var(--acc)":"var(--b2)"),
                        transition:"all .15s",userSelect:"none"
                      }}>
                      {active?"✓ ":""}{tg}
                    </span>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <button className="btn btn-g" onClick={()=>setEditTagTrade(null)}>Cancel</button>
                <button className="btn btn-p" onClick={()=>setEditTagTrade(null)}>Done</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast notifications */}
        {toast&&(
          <div className={`toast toast-${toast.type||"success"}`}>
            {toast.type==="error"?"✕":toast.type==="warn"?"⚠":"✓"} {toast.msg}
          </div>
        )}
      </div>
    </>
  );
}

