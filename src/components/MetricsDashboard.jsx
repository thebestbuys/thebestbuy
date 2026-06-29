// MetricsDashboard.jsx — Oraklia admin dashboard
// ------------------------------------------------------------------
// Drop-in remplacement du <MetricsView> actuel dans AdminPanel.jsx.
//
//   1.  npm i chart.js
//   2.  copie ce fichier dans  src/components/MetricsDashboard.jsx
//   3.  dans AdminPanel.jsx :
//         import MetricsDashboard from './MetricsDashboard.jsx';
//       puis remplace
//         <MetricsView metrics={metrics} topProducts={topProducts} t={t} />
//       par
//         <MetricsDashboard metrics={metrics} topProducts={topProducts} />
//
// Données réelles uniquement : `metrics` (admin_metrics), `topProducts`
// (admin_top_products) et les séries journalières (admin_daily_series) — tous
// excluent les comptes testeurs côté SQL. Quand un jeu de données est vide, on
// n'affiche RIEN (séries à zéro, table vide) — aucune valeur factice/mock.
// ------------------------------------------------------------------
import { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { adminTopProducts } from '../lib/cloud.js';

const C = {
  accent: '#bf5e3a', blue: '#4a73c4', green: '#3f9e6e', amber: '#d9962b', purple: '#7a6bb0',
  ink: '#1a1814', muted: '#6b6555', faint: '#9b9583', soft: '#f4f1ea', softer: '#ede8dd',
  border: 'rgba(26,24,20,.09)', good: '#2f7d52', bad: '#c4513a',
};
const card = { background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: '0 1px 2px rgba(26,24,20,.04)' };
const fmt = (n) => (n == null ? '—' : Number(Math.round(n)).toLocaleString('fr-FR'));
const dec = (n) => n.toFixed(1).replace('.', ',');

const CAT_COLOR = { Audio: C.accent, Charge: C.blue, Ventilateur: C.green, 'Café': C.amber, Maison: C.purple, Stockage: C.blue, Bureau: C.green, Cuisine: C.amber, Wearable: C.purple };

// Empty series over the last `days` days: real date axis, everything at zero so
// the dashboard shows NOTHING when there's no real data (no mock/demo values).
// The cumulative line stays flat at the real total user count when known.
function zeroSeries(totalUsers = 0, days = 90) {
  const N = Math.max(1, days);
  const labels = [], dates = [];
  const today = new Date();
  for (let i = 0; i < N; i++) {
    const d = new Date(today); d.setDate(d.getDate() - (N - 1 - i));
    labels.push(d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
    dates.push(d.toISOString().slice(0, 10));
  }
  const zeros = () => new Array(N).fill(0);
  return {
    labels, dates,
    newU: zeros(), cum: new Array(N).fill(totalUsers || 0),
    convos: zeros(), clicks: zeros(), sels: zeros(), owned: zeros(), dau: zeros(),
    geminiCalls: zeros(), amazonCalls: zeros(), supabaseCalls: zeros(),
  };
}

// Build the chart series from the REAL daily rows returned by admin_daily_series
// ({ d, new_users, active_users, conversations, link_clicks, selections }).
// Returns null when there's no data, so the caller can fall back to the mock.
function fromDaily(rows, totalUsers) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const dates = rows.map((r) => String(r.d).slice(0, 10));
  const labels = rows.map((r) =>
    new Date(r.d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
  );
  const newU = rows.map((r) => Number(r.new_users) || 0);
  const convos = rows.map((r) => Number(r.conversations) || 0);
  const clicks = rows.map((r) => Number(r.link_clicks) || 0);
  const sels = rows.map((r) => Number(r.selections) || 0);
  const owned = rows.map((r) => Number(r.owned) || 0);
  const dau = rows.map((r) => Number(r.active_users) || 0);
  const geminiCalls = rows.map((r) => Number(r.gemini_calls) || 0);
  const amazonCalls = rows.map((r) => Number(r.amazon_calls) || 0);
  const supabaseCalls = rows.map((r) => Number(r.supabase_calls) || 0);
  // Cumulative users, ending at the real total: signups before the window are
  // folded into the starting baseline.
  const totalNew = newU.reduce((a, b) => a + b, 0);
  let run = Math.max(0, (totalUsers || totalNew) - totalNew);
  const cum = newU.map((n) => (run += n));
  return { labels, dates, newU, cum, convos, clicks, sels, owned, dau, geminiCalls, amazonCalls, supabaseCalls };
}

function normalizeProducts(topProducts) {
  if (Array.isArray(topProducts) && topProducts.length) {
    return topProducts.map((p) => {
      const d = p.data || p;
      const brand = d.brand || '', model = d.model || d.title || '';
      const cat = d.category || d.cat || '—';
      const saves = Number(p.saves ?? d.saves ?? 0), clicks = Number(p.clicks ?? d.clicks ?? 0);
      return { brand, model, cat, saves, clicks, total: saves + clicks, trend: Number(p.trend ?? d.trend ?? 0) };
    });
  }
  // No real data → nothing (no demo/placeholder rows).
  return [];
}

const KPI = ({ label, value, sub, delta, canvasRef }) => (
  <div style={{ ...card, padding: '18px 18px 12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ font: '600 12px Inter,sans-serif', color: C.muted }}>{label}</span>
      {delta != null && (
        <span style={{ font: '600 11px Inter,sans-serif', color: delta >= 0 ? C.good : C.bad, background: delta >= 0 ? '#e6f0e9' : '#f6e3df', padding: '3px 7px', borderRadius: 999 }}>
          {delta >= 0 ? '▲' : '▼'} {dec(Math.abs(delta))} %
        </span>
      )}
    </div>
    <div style={{ font: '700 30px/1.1 Inter,sans-serif', color: C.ink, margin: '8px 0 2px' }}>{value}</div>
    <div style={{ fontSize: 11, color: C.faint, marginBottom: 6 }}>{sub}</div>
    <div style={{ position: 'relative', height: 38 }}><canvas ref={canvasRef} /></div>
  </div>
);

const FunnelRow = ({ label, value, pct, color }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
      <span style={{ font: '600 12.5px Inter,sans-serif', color: C.ink }}>{label}</span>
      <span style={{ font: '700 13px Inter,sans-serif', color: C.ink }}>{fmt(value)} <span style={{ fontWeight: 500, color: C.faint }}>· {dec(pct)} %</span></span>
    </div>
    <div style={{ height: 11, borderRadius: 6, background: C.softer, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 6 }} />
    </div>
  </div>
);

const Tile = ({ value, label }) => (
  <div style={{ background: C.soft, borderRadius: 11, padding: '11px 13px' }}>
    <div style={{ font: '700 17px Inter,sans-serif', color: C.ink }}>{value}</div>
    <div style={{ fontSize: 10.5, color: C.faint }}>{label}</div>
  </div>
);

export default function MetricsDashboard({ metrics, topProducts, dailySeries, includeTesters = false, onIncludeTesters }) {
  const [range, setRange] = useState('1m');
  const [customFrom, setCustomFrom] = useState(''); // 'YYYY-MM-DD'
  const [customTo, setCustomTo] = useState('');
  const [localTop, setLocalTop] = useState(null); // products counted over the period
  const [sortKey, setSortKey] = useState('total');
  const [sortDir, setSortDir] = useState('desc');
  const [query, setQuery] = useState('');

  const m = metrics || {};
  // Real daily series when available (admin_daily_series); mock as a fallback.
  const series = useMemo(
    () => fromDaily(dailySeries, m.users) || zeroSeries(m.users),
    [dailySeries, m.users],
  );
  const products = useMemo(() => normalizeProducts(localTop ?? topProducts), [localTop, topProducts]);
  const sumTotal = useMemo(() => products.reduce((a, p) => a + p.total, 0) || 1, [products]);
  const maxPart = useMemo(() => (products[0] ? products[0].total / sumTotal * 100 : 1), [products, sumTotal]);

  const rangeDays = () => {
    if (range === '24h') return 1;
    if (range === '1s') return 7;
    if (range === '3m') return 90;
    if (range === 'YTD') {
      const now = new Date();
      return Math.max(1, Math.floor((now - new Date(now.getFullYear(), 0, 1)) / 86400000) + 1);
    }
    return 30; // '1m'
  };
  // Resolve the selected period to an inclusive index window into the series.
  // Preset ranges = the last N days; 'perso' = the custom from/to dates.
  const N = series.labels.length;
  const win = (() => {
    if (range === 'perso' && customFrom && customTo) {
      const lo = customFrom <= customTo ? customFrom : customTo;
      const hi = customFrom <= customTo ? customTo : customFrom;
      let start = series.dates.findIndex((d) => d >= lo);
      if (start < 0) return { start: 0, end: -1 };
      let end = -1;
      for (let i = N - 1; i >= 0; i--) { if (series.dates[i] <= hi) { end = i; break; } }
      if (end < start) return { start: 0, end: -1 };
      return { start, end };
    }
    return { start: Math.max(0, N - rangeDays()), end: N - 1 };
  })();
  const slice = (arr) => (win.end < win.start ? [] : arr.slice(win.start, win.end + 1));
  const winSum = (arr) => slice(arr).reduce((x, y) => x + y, 0);
  // Range-aware delta for a flow metric: this window's total vs the preceding
  // window of the same length. Moves with the period selector.
  const winDelta = (arr) => {
    const len = win.end - win.start + 1;
    if (len <= 0) return 0;
    const a = arr.slice(win.start, win.end + 1).reduce((x, y) => x + y, 0);
    const b = arr.slice(Math.max(0, win.start - len), win.start).reduce((x, y) => x + y, 0);
    return b ? ((a - b) / b) * 100 : a > 0 ? 100 : 0;
  };

  // ── refs for canvases
  const spkUsers = useRef(), spkActive = useRef(), spkConvos = useRef(), spkClicks = useRef();
  const spkGemini = useRef(), spkAmazon = useRef(), spkSupabase = useRef();
  const growth = useRef(), activity = useRef(), social = useRef();
  const charts = useRef({});

  useEffect(() => {
    const kill = (k) => { if (charts.current[k]) { charts.current[k].destroy(); delete charts.current[k]; } };
    const grid = 'rgba(26,24,20,.06)';
    const tip = { backgroundColor: C.ink, padding: 10, cornerRadius: 8, titleFont: { size: 11 }, bodyFont: { size: 12, weight: '600' }, displayColors: false };
    Chart.defaults.font.family = 'Inter, sans-serif'; Chart.defaults.font.size = 11; Chart.defaults.color = C.faint;

    const spark = (key, ref, arr, color) => {
      kill(key); if (!ref.current) return;
      const last = arr.slice(arr.length - 30);
      const ctx = ref.current.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 0, 40); g.addColorStop(0, color + '33'); g.addColorStop(1, color + '00');
      charts.current[key] = new Chart(ref.current, {
        type: 'line',
        data: { labels: last.map((_, i) => i), datasets: [{ data: last, borderColor: color, backgroundColor: g, borderWidth: 1.6, fill: true, tension: 0.4, pointRadius: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } },
      });
    };
    spark('su', spkUsers, series.newU, C.accent);
    spark('sa', spkActive, series.dau, C.blue);
    spark('sc', spkConvos, series.convos, C.green);
    spark('sk', spkClicks, series.clicks, C.amber);
    spark('sg', spkGemini, series.geminiCalls, C.purple);
    spark('sz', spkAmazon, series.amazonCalls, C.amber);
    spark('sb', spkSupabase, series.supabaseCalls, C.blue);

    const L = slice(series.labels);
    const pr = L.length <= 3 ? 3 : 0; // show dots when the window is tiny (24h)
    kill('growth');
    if (growth.current) charts.current.growth = new Chart(growth.current, {
      data: { labels: L, datasets: [
        { type: 'line', label: 'Cumul utilisateurs', data: slice(series.cum), borderColor: C.accent, backgroundColor: C.accent, borderWidth: 2.2, tension: 0.35, pointRadius: pr, yAxisID: 'y1', order: 0 },
        { type: 'bar', label: 'Inscriptions / jour', data: slice(series.newU), backgroundColor: 'rgba(191,94,58,.22)', borderRadius: 3, yAxisID: 'y', order: 1, maxBarThickness: 16 },
      ] },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, padding: 14 } }, tooltip: tip },
        scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 8, maxRotation: 0 } }, y: { position: 'left', grid: { color: grid }, ticks: { maxTicksLimit: 5 }, beginAtZero: true }, y1: { position: 'right', grid: { display: false }, ticks: { maxTicksLimit: 5 } } } },
    });

    kill('activity');
    const mk = (label, arr, color) => ({ label, data: slice(arr), borderColor: color, backgroundColor: color, borderWidth: 2, tension: 0.35, pointRadius: pr });
    if (activity.current) charts.current.activity = new Chart(activity.current, {
      type: 'line', data: { labels: L, datasets: [mk('Conversations', series.convos, C.accent), mk('Clics Amazon', series.clicks, C.blue), mk('Sélections', series.sels, C.green)] },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, padding: 14 } }, tooltip: tip },
        scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 8, maxRotation: 0 } }, y: { grid: { color: grid }, ticks: { maxTicksLimit: 5 }, beginAtZero: true } } },
    });

    kill('social');
    if (social.current) charts.current.social = new Chart(social.current, {
      type: 'doughnut',
      data: { labels: ['Amitiés acceptées', 'Demandes en attente'], datasets: [{ data: [m.friendships || 0, m.pending_requests || 0], backgroundColor: [C.accent, C.softer], borderWidth: 0, hoverOffset: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '72%', plugins: { legend: { display: false }, tooltip: tip } },
    });

    return () => Object.keys(charts.current).forEach(kill);
  }, [series, range, customFrom, customTo, m.friendships, m.pending_requests]);

  // ── table
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let r = products.filter((p) => !q || `${p.brand} ${p.model} ${p.cat}`.toLowerCase().includes(q));
    const dir = sortDir === 'desc' ? -1 : 1;
    r = [...r].sort((a, b) => {
      if (sortKey === 'brand') { const av = (a.brand + a.model).toLowerCase(), bv = (b.brand + b.model).toLowerCase(); return av < bv ? dir : av > bv ? -dir : 0; }
      if (sortKey === 'cat') { const av = a.cat.toLowerCase(), bv = b.cat.toLowerCase(); return av < bv ? dir : av > bv ? -dir : 0; }
      return (a[sortKey] - b[sortKey]) * dir;
    });
    return r;
  }, [products, query, sortKey, sortDir]);

  const sort = (key) => { if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc')); else { setSortKey(key); setSortDir(key === 'brand' || key === 'cat' ? 'asc' : 'desc'); } };
  const arrow = (k) => (sortKey === k ? (sortDir === 'desc' ? '▼' : '▲') : '');
  const exportCsv = () => {
    const head = ['Rang', 'Marque', 'Modèle', 'Catégorie', 'Saves', 'Clics', 'Total', 'Tendance 7j (%)', 'Part (%)'];
    const lines = rows.map((p, i) => [i + 1, p.brand, p.model, p.cat, p.saves, p.clicks, p.total, dec(p.trend), dec(p.total / sumTotal * 100)].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'));
    const csv = '\uFEFF' + [head.join(';'), ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a'); a.href = url; a.download = 'oraklia-produits.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const seg = (r) => ({ font: '600 12px Inter,sans-serif', border: 'none', cursor: 'pointer', padding: '7px 14px', borderRadius: 999, ...(range === r ? { color: C.ink, background: '#fff', boxShadow: '0 1px 3px rgba(26,24,20,.12)' } : { color: '#8a8472', background: 'transparent' }) });
  const head = { font: '600 10.5px Inter,sans-serif', color: C.faint, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none' };
  const COLS = '42px minmax(160px,1.7fr) 116px 86px 86px 92px 96px 78px';

  // Users delta = growth of the total over the window (end vs the day before the
  // window started). Range-aware: longer period → larger growth.
  const usersDelta = (() => {
    if (win.end < win.start) return 0;
    const base = win.start > 0
      ? series.cum[win.start - 1]
      : Math.max(1, (series.cum[win.start] || 0) - (series.newU[win.start] || 0));
    return ((series.cum[win.end] - base) / Math.max(1, base)) * 100;
  })();

  // Top products counted over the selected window (refetched on range change).
  const fromISO = series.dates[win.start];
  const toISO = series.dates[win.end];
  useEffect(() => {
    if (win.end < win.start || !fromISO || !toISO) return;
    let alive = true;
    adminTopProducts(50, fromISO, toISO, includeTesters).then((r) => {
      if (alive && Array.isArray(r)) setLocalTop(r);
    });
    return () => { alive = false; };
  }, [fromISO, toISO, includeTesters]);

  // Real conversion funnel over the SELECTED period (sums of the daily series),
  // no fabricated ratios. clicks/selections aren't strict subsets of
  // conversations, so percentages are clamped to 100 % for the bars.
  const fConvs = winSum(series.convos);
  const fClicks = winSum(series.clicks);
  const fSaves = winSum(series.sels);
  const fOwned = winSum(series.owned);
  const clampPct = (a, b) => (b ? Math.min(100, (a / b) * 100) : 0);
  const pctClick = clampPct(fClicks, fConvs);
  const pctSave = clampPct(fSaves, fConvs);
  const convGlobal = fConvs ? (fSaves / fConvs) * 100 : 0;
  const clickToSave = fClicks ? (fSaves / fClicks) * 100 : 0;

  return (
    <div style={{ fontFamily: 'Inter,sans-serif', color: C.ink }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', margin: '4px 0 22px' }}>
        <div>
          <h2 style={{ font: "400 34px/1 'Instrument Serif',serif", color: C.ink, margin: '0 0 4px' }}>Tableau de bord</h2>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Vue d'ensemble de l'activité — données agrégées, anonymisées.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', gap: 3, background: C.softer, borderRadius: 999, padding: 3 }}>
            {['24h', '1s', '1m', '3m', 'YTD'].map((r) => <button key={r} type="button" style={seg(r)} onClick={() => setRange(r)}>{r}</button>)}
            <button type="button" style={seg('perso')} onClick={() => {
              if (!customFrom || !customTo) {
                const ds = series.dates;
                setCustomTo(ds[ds.length - 1] || '');
                setCustomFrom(ds[Math.max(0, ds.length - 30)] || '');
              }
              setRange('perso');
            }}>Perso</button>
          </div>
          {range === 'perso' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input type="date" value={customFrom} max={customTo || undefined}
                onChange={(e) => setCustomFrom(e.target.value)}
                style={{ font: '500 12.5px Inter,sans-serif', color: C.ink, background: C.soft, border: `1px solid ${C.border}`, borderRadius: 9, padding: '7px 10px', outline: 'none' }} />
              <span style={{ color: C.faint, fontSize: 12 }}>→</span>
              <input type="date" value={customTo} min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
                style={{ font: '500 12.5px Inter,sans-serif', color: C.ink, background: C.soft, border: `1px solid ${C.border}`, borderRadius: 9, padding: '7px 10px', outline: 'none' }} />
            </div>
          )}
          <button
            type="button"
            onClick={() => onIncludeTesters?.(!includeTesters)}
            role="switch"
            aria-checked={includeTesters}
            title="Inclure ou exclure les comptes testeurs des statistiques"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, font: '600 12.5px Inter,sans-serif', cursor: 'pointer', padding: '9px 14px', borderRadius: 10, border: `1px solid ${includeTesters ? C.accent : C.border}`, background: includeTesters ? C.accent : '#fff', color: includeTesters ? '#fff' : C.muted }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: includeTesters ? '#fff' : C.faint, display: 'inline-block' }} />
            {includeTesters ? 'Testeurs inclus' : 'Testeurs exclus'}
          </button>
          <button type="button" onClick={exportCsv} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, font: '600 13px Inter,sans-serif', color: '#fff', background: C.accent, border: 'none', borderRadius: 10, padding: '10px 16px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(191,94,58,.28)' }}>↓ Export CSV</button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginBottom: 16 }}>
        <KPI label="Utilisateurs" value={fmt(m.users)} sub={`+${fmt(winSum(series.newU))} sur la période · ${fmt(m.users)} au total`} delta={usersDelta} canvasRef={spkUsers} />
        <KPI label="Actifs · 7 j" value={fmt(m.active_users_7d)} sub={`${m.users ? dec(m.active_users_7d / m.users * 100) : '—'} % de la base`} delta={winDelta(series.dau)} canvasRef={spkActive} />
        <KPI label="Conversations" value={fmt(winSum(series.convos))} sub={`${fmt(m.conversations)} au total`} delta={winDelta(series.convos)} canvasRef={spkConvos} />
        <KPI label="Clics Amazon" value={fmt(winSum(series.clicks))} sub={`${fmt(m.link_clicks)} au total · sortants affiliés`} delta={winDelta(series.clicks)} canvasRef={spkClicks} />
      </div>

      {/* Backend API call volume */}
      <div style={{ margin: '4px 0 8px' }}>
        <h3 style={{ font: '600 14px Inter,sans-serif', margin: '0 0 2px' }}>Volumétrie API backend</h3>
        <p style={{ fontSize: 11.5, color: C.faint, margin: 0 }}>Appels réellement exécutés par le serveur (api/*.js)</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginBottom: 16 }}>
        <KPI label="Appels Gemini" value={fmt(winSum(series.geminiCalls))} sub={`${fmt(m.gemini_calls)} au total · génération IA`} delta={winDelta(series.geminiCalls)} canvasRef={spkGemini} />
        <KPI label="Appels Amazon" value={fmt(winSum(series.amazonCalls))} sub={`${fmt(m.amazon_calls)} au total · Creators API`} delta={winDelta(series.amazonCalls)} canvasRef={spkAmazon} />
        <KPI label="Requêtes Supabase" value={fmt(winSum(series.supabaseCalls))} sub={`${fmt(m.supabase_calls)} au total · côté serveur`} delta={winDelta(series.supabaseCalls)} canvasRef={spkSupabase} />
      </div>

      {/* charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(420px,1fr))', gap: 16, marginBottom: 16 }}>
        <div style={{ ...card, padding: '20px 22px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <h3 style={{ font: '600 14px Inter,sans-serif', margin: 0 }}>Croissance des utilisateurs</h3>
            <span style={{ fontSize: 11, color: C.faint }}>Inscriptions / jour · cumul</span>
          </div>
          <div style={{ position: 'relative', height: 248 }}><canvas ref={growth} /></div>
        </div>
        <div style={{ ...card, padding: '20px 22px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <h3 style={{ font: '600 14px Inter,sans-serif', margin: 0 }}>Activité quotidienne</h3>
            <span style={{ fontSize: 11, color: C.faint }}>Conversations · clics · sélections</span>
          </div>
          <div style={{ position: 'relative', height: 248 }}><canvas ref={activity} /></div>
        </div>
      </div>

      {/* funnel + social */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(360px,1fr))', gap: 16, marginBottom: 16 }}>
        <div style={{ ...card, padding: '20px 22px 22px' }}>
          <h3 style={{ font: '600 14px Inter,sans-serif', margin: '0 0 2px' }}>Parcours de conversion</h3>
          <p style={{ fontSize: 11.5, color: C.faint, margin: '0 0 18px' }}>Du premier message au produit sauvegardé</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FunnelRow label="Conversations lancées" value={fConvs} pct={100} color={C.accent} />
            <FunnelRow label="Clic Amazon" value={fClicks} pct={pctClick} color="#d68a68" />
            <FunnelRow label="Produit sauvegardé" value={fSaves} pct={pctSave} color="#e0a283" />
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <div><div style={{ font: '700 18px Inter,sans-serif' }}>{dec(convGlobal)} %</div><div style={{ fontSize: 11, color: C.faint }}>Conv. globale</div></div>
            <div><div style={{ font: '700 18px Inter,sans-serif' }}>{dec(clickToSave)} %</div><div style={{ fontSize: 11, color: C.faint }}>Clic → sauvegarde</div></div>
            <div><div style={{ font: '700 18px Inter,sans-serif' }}>{fmt(fOwned)}</div><div style={{ fontSize: 11, color: C.faint }}>Déjà acheté</div></div>
          </div>
        </div>

        <div style={{ ...card, padding: '20px 22px 22px' }}>
          <h3 style={{ font: '600 14px Inter,sans-serif', margin: '0 0 2px' }}>Cercle social</h3>
          <p style={{ fontSize: 11.5, color: C.faint, margin: '0 0 14px' }}>Amitiés, listes partagées & sondages</p>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 140, height: 140, flex: '0 0 auto' }}>
              <canvas ref={social} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ font: '700 22px Inter,sans-serif' }}>{fmt(m.friendships)}</span>
                <span style={{ fontSize: 10, color: C.faint }}>amitiés</span>
              </div>
            </div>
            <div style={{ flex: '1 1 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Tile value={fmt(m.pending_requests)} label="Demandes en attente" />
              <Tile value={fmt(m.lists)} label="Listes créées" />
              <Tile value={fmt(m.public_lists)} label="Listes publiques" />
              <Tile value={fmt(m.polls)} label="Sondages d'avis" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
            <div><div style={{ font: '700 18px Inter,sans-serif' }}>{fmt(m.occasions)}</div><div style={{ fontSize: 11, color: C.faint }}>Occasions / rappels</div></div>
            <div><div style={{ font: '700 18px Inter,sans-serif' }}>{fmt(m.selections)}</div><div style={{ fontSize: 11, color: C.faint }}>Sélections totales</div></div>
          </div>
        </div>
      </div>

      {/* table */}
      <div style={{ ...card, padding: '20px 22px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <h3 style={{ font: '600 14px Inter,sans-serif', margin: '0 0 2px' }}>Produits les plus populaires</h3>
            <p style={{ fontSize: 11.5, color: C.faint, margin: 0 }}><span style={{ color: C.muted, fontWeight: 600 }}>{rows.length}</span> produits · triez en cliquant sur une colonne</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une marque, un modèle…" style={{ font: '500 12.5px Inter,sans-serif', color: C.ink, background: C.soft, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 13px', width: 248, outline: 'none' }} />
            <button type="button" onClick={exportCsv} style={{ font: '600 12.5px Inter,sans-serif', color: C.muted, background: '#fff', border: '1px solid rgba(26,24,20,.14)', borderRadius: 10, padding: '9px 14px', cursor: 'pointer' }}>↓ CSV</button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', margin: '0 -22px', padding: '0 22px' }}>
        <div style={{ minWidth: 720 }}>
        <div style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', padding: '0 12px 9px', borderBottom: '1.5px solid rgba(26,24,20,.1)' }}>
          <div style={head}>#</div>
          <div style={head} onClick={() => sort('brand')}>Produit <span style={{ color: C.accent }}>{arrow('brand')}</span></div>
          <div style={head} onClick={() => sort('cat')}>Catégorie <span style={{ color: C.accent }}>{arrow('cat')}</span></div>
          {['saves', 'clicks', 'total'].map((k) => <div key={k} style={{ ...head, textAlign: 'right' }} onClick={() => sort(k)}>{k === 'saves' ? 'Saves' : k === 'clicks' ? 'Clics' : 'Total'} <span style={{ color: C.accent }}>{arrow(k)}</span></div>)}
          <div style={{ ...head, textAlign: 'right' }} onClick={() => sort('trend')}>7 j <span style={{ color: C.accent }}>{arrow('trend')}</span></div>
          <div style={{ ...head, textAlign: 'right' }} onClick={() => sort('total')}>Part</div>
        </div>

        {rows.map((p, i) => {
          const part = p.total / sumTotal * 100;
          return (
            <div key={`${p.brand}-${p.model}-${i}`} style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', padding: '11px 12px', borderBottom: '1px solid rgba(26,24,20,.05)' }}>
              <div style={{ font: "700 13px 'Instrument Serif',serif", color: '#c9c0ae' }}>{i + 1}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                <span style={{ flex: '0 0 auto', width: 34, height: 34, borderRadius: 9, background: C.softer, display: 'flex', alignItems: 'center', justifyContent: 'center', font: "600 12px 'Instrument Serif',serif", color: '#9b7d5f' }}>{((p.brand[0] || '') + (p.model[0] || '')).toUpperCase()}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', font: '600 9px Inter,sans-serif', color: C.faint, letterSpacing: '.05em', textTransform: 'uppercase' }}>{p.brand}</span>
                  <span style={{ display: 'block', font: '600 13px Inter,sans-serif', color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.model}</span>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: CAT_COLOR[p.cat] || C.faint }} /><span style={{ font: '500 12px Inter,sans-serif', color: C.muted }}>{p.cat}</span></div>
              <div style={{ font: '600 13px Inter,sans-serif', textAlign: 'right' }}>{fmt(p.saves)}</div>
              <div style={{ font: '600 13px Inter,sans-serif', textAlign: 'right' }}>{fmt(p.clicks)}</div>
              <div style={{ font: '700 13px Inter,sans-serif', textAlign: 'right' }}>{fmt(p.total)}</div>
              <div style={{ font: '600 12px Inter,sans-serif', textAlign: 'right', color: p.trend >= 0 ? C.good : C.bad }}>{p.trend ? `${p.trend >= 0 ? '▲' : '▼'} ${dec(Math.abs(p.trend))} %` : '—'}</div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                  <span style={{ width: 30, height: 5, borderRadius: 3, background: C.softer, overflow: 'hidden', display: 'inline-block' }}><span style={{ display: 'block', height: '100%', width: `${Math.min(100, part / maxPart * 100)}%`, background: C.accent }} /></span>
                  <span style={{ font: '600 12px Inter,sans-serif', color: C.muted }}>{dec(part)} %</span>
                </span>
              </div>
            </div>
          );
        })}
        <div style={{ height: 12 }} />
        </div>
        </div>
      </div>
    </div>
  );
}
