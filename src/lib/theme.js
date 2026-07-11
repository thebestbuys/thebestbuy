// Charte graphique — single source of truth for the site's editable design
// tokens (colors, fonts, sizes), with independent LIGHT and DARK palettes.
//
// Each color token maps to a CSS custom property and has a light (`def`) and a
// dark (`darkDef`) default. Fonts/sizes are mode-independent ("shared").
//
// At runtime the active mode's values are applied as inline styles on <html>:
//   • light mode applies only *overrides* (styles.css :root provides the rest);
//   • dark mode forces the full dark palette (defaults + overrides) plus a set
//     of secondary vars (DARK_EXTRA) so the whole UI flips.
//
// Reconfigure the look two ways: edit the defaults in this file, or use the live
// Theme editor (Alt+Shift+T) which switches/edits both palettes, persists to
// localStorage and exports a CSS snippet.

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

const STORAGE_KEY = 'oraklia_theme';

// Native status bar: the WebView is edge-to-edge, so the OS draws the status
// bar icons over the app's top area. Match their color to the theme, otherwise
// light mode keeps white icons on a light background (invisible).
// Capacitor semantics: Style.Light = dark icons (for light bg), Style.Dark =
// light icons (for dark bg).
function applyNativeStatusBar(dark) {
  if (!Capacitor.isNativePlatform()) return;
  StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {});
}

export const FONT_OPTIONS = [
  { value: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif', label: 'Inter' },
  { value: '"Quicksand", ui-sans-serif, system-ui, sans-serif', label: 'Quicksand' },
  { value: '"Nunito", ui-sans-serif, system-ui, sans-serif', label: 'Nunito' },
  { value: '"Outfit", ui-sans-serif, system-ui, sans-serif', label: 'Outfit' },
  { value: '"Instrument Serif", "Times New Roman", serif', label: 'Instrument Serif' },
  { value: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif', label: 'Système' },
];

// Editable color tokens (per-mode) + shared font/size tokens.
export const THEME_SCHEMA = [
  // ── Couleurs (light `def` / dark `darkDef`) ──
  { group: 'Couleurs', token: 'bg',        cssVar: '--bg',               type: 'color', label: 'Fond',             def: '#faf8f4', darkDef: '#0c0b0a' },
  { group: 'Couleurs', token: 'surface',   cssVar: '--bg-elev',          type: 'color', label: 'Surfaces',         def: '#ffffff', darkDef: '#1a1713' },
  { group: 'Couleurs', token: 'text',      cssVar: '--text',             type: 'color', label: 'Texte',            def: '#1a1814', darkDef: '#f4f1ea' },
  { group: 'Couleurs', token: 'textMuted', cssVar: '--text-muted',       type: 'color', label: 'Texte secondaire', def: '#6b6555', darkDef: '#aca595' },
  { group: 'Couleurs', token: 'accent',    cssVar: '--accent',           type: 'color', label: 'Accent',           def: '#c2603c', darkDef: '#e2865d' },
  { group: 'Couleurs', token: 'accentCta', cssVar: '--accent-light',     type: 'color', label: 'CTA / boutons',    def: '#e8b58f', darkDef: '#cc6b47' },
  { group: 'Couleurs', token: 'accentInk', cssVar: '--accent-light-ink', type: 'color', label: 'Texte sur CTA',    def: '#8a4326', darkDef: '#ffffff' },
  { group: 'Couleurs', token: 'border',    cssVar: '--border',           type: 'color', label: 'Bordures',         def: '#e7e3da', darkDef: '#332e28' },

  // ── Polices (shared) ──
  { group: 'Polices', token: 'fontSans',    cssVar: '--sans',    type: 'font', label: 'Interface', def: FONT_OPTIONS[0].value },
  { group: 'Polices', token: 'fontDisplay', cssVar: '--display', type: 'font', label: 'Titres',    def: FONT_OPTIONS[3].value },

  // ── Tailles (shared) ──
  { group: 'Tailles', token: 'baseSize', cssVar: '--base-size', type: 'size', label: 'Texte',    def: 14, min: 12, max: 18, step: 0.5, unit: 'px' },
  { group: 'Tailles', token: 'radius',   cssVar: '--radius',    type: 'size', label: 'Arrondis', def: 14, min: 0,  max: 28, step: 1,   unit: 'px' },
];

export const COLOR_TOKENS = THEME_SCHEMA.filter((s) => s.type === 'color');
export const SHARED_TOKENS = THEME_SCHEMA.filter((s) => s.type !== 'color');
const byToken = Object.fromEntries(THEME_SCHEMA.map((s) => [s.token, s]));

// Secondary (non-editable) vars that must also flip in dark mode for the whole
// UI to read correctly.
const DARK_EXTRA = {
  '--bg-soft': '#131110',
  '--bg-softer': '#221e18',
  '--text-faint': '#867e70',
  '--border-soft': 'rgba(255,255,255,0.07)',
  '--accent-soft': '#3a2a20',
  // Mobile app palette (dark).
  '--m-coral': '#f2774e',
  '--m-coral-deep': '#e0623c',
  '--m-amber': '#f5b544',
  '--m-cream': '#2a231c',
  '--m-paper': '#19150f',
  '--m-card': '#251f17',
  '--m-ink': '#f3efe7',
  '--m-ink-soft': '#b3ab9b',
  '--m-ink-mute': '#847c6d',
  '--m-line': '#352f27',
  '--m-chip-bg': '#2c2419',
  '--m-chip-bg-hov': '#38301f',
  '--m-bubble-ai': '#241f18',
};

export function systemPrefersDark() {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

// Resolve the preference ('system'|'light'|'dark') to a concrete palette.
export function resolveMode(mode) {
  if (mode === 'light' || mode === 'dark') return mode;
  return systemPrefersDark() ? 'dark' : 'light';
}

const MODES = ['system', 'light', 'dark'];

// Normalized state: { mode, light:{token:val}, dark:{token:val}, shared:{token:val} }
// `mode` is the user preference: 'system' follows the OS.
export function loadTheme() {
  let saved = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saved = JSON.parse(raw) || {};
  } catch {}
  return {
    // Default to light when no preference is saved — the site should not follow
    // the OS into dark mode unless the user explicitly picks 'system' or 'dark'.
    mode: MODES.includes(saved.mode) ? saved.mode : 'light',
    light: saved.light && typeof saved.light === 'object' ? saved.light : {},
    dark: saved.dark && typeof saved.dark === 'object' ? saved.dark : {},
    shared: saved.shared && typeof saved.shared === 'object' ? saved.shared : {},
  };
}

export function getMode() {
  return loadTheme().mode;
}

// Set just the appearance preference (used by the account dropdown).
export function setMode(mode) {
  const next = { ...loadTheme(), mode: MODES.includes(mode) ? mode : 'system' };
  saveTheme(next);
  applyTheme(next);
  return next;
}

export function saveTheme(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function cssValue(schema, value) {
  return schema.type === 'size' ? `${value}${schema.unit || 'px'}` : String(value);
}

// Apply the active mode's palette as inline custom properties on <html>.
export function applyTheme(state) {
  const root = document.documentElement;
  const dark = resolveMode(state.mode) === 'dark';
  root.dataset.theme = dark ? 'dark' : 'light';
  root.style.colorScheme = dark ? 'dark' : 'light';
  applyNativeStatusBar(dark);

  // Color tokens (per-mode).
  for (const s of COLOR_TOKENS) {
    const override = (dark ? state.dark : state.light)[s.token];
    if (dark) {
      root.style.setProperty(s.cssVar, override || s.darkDef);
    } else if (override) {
      root.style.setProperty(s.cssVar, override);
    } else {
      root.style.removeProperty(s.cssVar);
    }
  }

  // Secondary dark-only vars.
  for (const [cssVar, val] of Object.entries(DARK_EXTRA)) {
    if (dark) root.style.setProperty(cssVar, val);
    else root.style.removeProperty(cssVar);
  }

  // Shared tokens (fonts/sizes) — applied only when overridden, both modes.
  for (const s of SHARED_TOKENS) {
    const v = state.shared[s.token];
    if (v != null && v !== '') root.style.setProperty(s.cssVar, cssValue(s, v));
    else root.style.removeProperty(s.cssVar);
  }
}

export function applyStoredTheme() {
  applyTheme(loadTheme());
}

// Clears all customizations (both palettes + shared), keeps the current mode.
export function resetTheme(mode) {
  const state = { mode: mode || loadTheme().mode, light: {}, dark: {}, shared: {} };
  saveTheme(state);
  applyTheme(state);
  return state;
}

// CSS snippet to make the current customization permanent: a :root block for
// shared + light overrides, and a [data-theme="dark"] block for the dark palette.
export function exportThemeCSS(state) {
  const lightLines = [
    ...SHARED_TOKENS.filter((s) => state.shared[s.token] != null && state.shared[s.token] !== '')
      .map((s) => `  ${s.cssVar}: ${cssValue(s, state.shared[s.token])};`),
    ...COLOR_TOKENS.filter((s) => state.light[s.token])
      .map((s) => `  ${s.cssVar}: ${state.light[s.token]};`),
  ];
  const darkLines = [
    ...COLOR_TOKENS.map((s) => `  ${s.cssVar}: ${state.dark[s.token] || s.darkDef};`),
    ...Object.entries(DARK_EXTRA).map(([v, val]) => `  ${v}: ${val};`),
  ];
  const blocks = [];
  if (lightLines.length) blocks.push(`:root {\n${lightLines.join('\n')}\n}`);
  blocks.push(`:root[data-theme="dark"] {\n${darkLines.join('\n')}\n}`);
  return blocks.join('\n\n');
}
