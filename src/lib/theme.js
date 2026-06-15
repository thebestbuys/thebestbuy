// Charte graphique — single source of truth for the site's editable design
// tokens (colors, fonts, sizes). Each token maps to a CSS custom property used
// throughout styles.css. The runtime applies *overrides* as inline styles on
// <html>, so anything not overridden keeps the default defined in styles.css.
//
// Two ways to reconfigure the look:
//   1. Edit the `def` values below (the config file).
//   2. Use the live Theme editor (Alt+Shift+T) — it writes overrides to
//      localStorage and can export a CSS snippet to paste back here.

const STORAGE_KEY = 'oraklia_theme';

// Font stacks for the loaded families (see index.html).
export const FONT_OPTIONS = [
  { value: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif', label: 'Inter' },
  { value: '"Quicksand", ui-sans-serif, system-ui, sans-serif', label: 'Quicksand' },
  { value: '"Nunito", ui-sans-serif, system-ui, sans-serif', label: 'Nunito' },
  { value: '"Outfit", ui-sans-serif, system-ui, sans-serif', label: 'Outfit' },
  { value: '"Instrument Serif", "Times New Roman", serif', label: 'Instrument Serif' },
  { value: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif', label: 'Système' },
];

// Editable tokens. `def` for colors is a hex approximation of the current
// CSS default — it only takes effect once the user changes it.
export const THEME_SCHEMA = [
  // ── Couleurs ──
  { group: 'Couleurs', token: 'bg',        cssVar: '--bg',               type: 'color', label: 'Fond',            def: '#faf8f4' },
  { group: 'Couleurs', token: 'surface',   cssVar: '--bg-elev',          type: 'color', label: 'Surfaces',        def: '#ffffff' },
  { group: 'Couleurs', token: 'text',      cssVar: '--text',             type: 'color', label: 'Texte',           def: '#1a1814' },
  { group: 'Couleurs', token: 'textMuted', cssVar: '--text-muted',       type: 'color', label: 'Texte secondaire', def: '#6b6555' },
  { group: 'Couleurs', token: 'accent',    cssVar: '--accent',           type: 'color', label: 'Accent',          def: '#c2603c' },
  { group: 'Couleurs', token: 'accentCta', cssVar: '--accent-light',     type: 'color', label: 'CTA / boutons',   def: '#e8b58f' },
  { group: 'Couleurs', token: 'accentInk', cssVar: '--accent-light-ink', type: 'color', label: 'Texte sur CTA',   def: '#8a4326' },
  { group: 'Couleurs', token: 'border',    cssVar: '--border',           type: 'color', label: 'Bordures',        def: '#e7e3da' },

  // ── Polices ──
  { group: 'Polices', token: 'fontSans',    cssVar: '--sans',    type: 'font', label: 'Interface', def: FONT_OPTIONS[0].value },
  { group: 'Polices', token: 'fontDisplay', cssVar: '--display', type: 'font', label: 'Titres',    def: FONT_OPTIONS[4].value },

  // ── Tailles ──
  { group: 'Tailles', token: 'baseSize', cssVar: '--base-size', type: 'size', label: 'Texte',    def: 14, min: 12, max: 18, step: 0.5, unit: 'px' },
  { group: 'Tailles', token: 'radius',   cssVar: '--radius',    type: 'size', label: 'Arrondis', def: 14, min: 0,  max: 28, step: 1,   unit: 'px' },
];

const byToken = Object.fromEntries(THEME_SCHEMA.map((s) => [s.token, s]));

export function loadTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

export function saveTheme(overrides) {
  try {
    const clean = {};
    for (const [k, v] of Object.entries(overrides || {})) {
      if (byToken[k] && v != null && v !== '') clean[k] = v;
    }
    if (Object.keys(clean).length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch {}
}

function cssValue(schema, value) {
  return schema.type === 'size' ? `${value}${schema.unit || 'px'}` : String(value);
}

// Apply overrides as inline custom properties on <html>. Tokens not present in
// `overrides` are cleared, reverting to the stylesheet default.
export function applyTheme(overrides = {}) {
  const root = document.documentElement;
  for (const schema of THEME_SCHEMA) {
    const v = overrides[schema.token];
    if (v != null && v !== '') root.style.setProperty(schema.cssVar, cssValue(schema, v));
    else root.style.removeProperty(schema.cssVar);
  }
}

export function applyStoredTheme() {
  applyTheme(loadTheme());
}

export function resetTheme() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  applyTheme({});
}

// A CSS :root snippet of the current overrides — paste into styles.css (or use
// the `def` values in this file) to make the change permanent.
export function exportThemeCSS(overrides = {}) {
  const lines = THEME_SCHEMA.filter((s) => overrides[s.token] != null && overrides[s.token] !== '')
    .map((s) => `  ${s.cssVar}: ${cssValue(s, overrides[s.token])};`);
  if (!lines.length) return '/* Aucune personnalisation — charte par défaut. */';
  return `:root {\n${lines.join('\n')}\n}`;
}
