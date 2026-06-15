import { useEffect, useState } from 'react';
import {
  TWEAKS_STYLE,
  TweakSection,
  TweakRadio,
  TweakColor,
  TweakSelect,
  TweakSlider,
  TweakButton,
} from './TweaksPanel.jsx';
import {
  THEME_SCHEMA,
  FONT_OPTIONS,
  loadTheme,
  saveTheme,
  applyTheme,
  resetTheme,
  exportThemeCSS,
} from '../lib/theme.js';

// Live "charte graphique" editor with independent light/dark palettes. Reuses
// the existing Tweak* controls + styling. Opened with Alt+Shift+T (main.jsx).
const GROUPS = ['Couleurs', 'Polices', 'Tailles'];

export default function ThemeEditor({ open, onClose }) {
  const [state, setState] = useState(loadTheme);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) setState(loadTheme());
  }, [open]);

  if (!open) return null;

  const commit = (next) => {
    setState(next);
    saveTheme(next);
    applyTheme(next);
  };

  const setMode = (mode) => commit({ ...state, mode });

  // Color edits go to the active mode's bucket; fonts/sizes are shared.
  const update = (schema, value) => {
    if (schema.type === 'color') {
      const bucket = { ...state[state.mode], [schema.token]: value };
      commit({ ...state, [state.mode]: bucket });
    } else {
      commit({ ...state, shared: { ...state.shared, [schema.token]: value } });
    }
  };

  const reset = () => setState(resetTheme(state.mode));

  const exportCSS = async () => {
    try {
      await navigator.clipboard.writeText(exportThemeCSS(state));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const valueFor = (s) => {
    if (s.type === 'color') {
      return state[state.mode][s.token] ?? (state.mode === 'dark' ? s.darkDef : s.def);
    }
    return state.shared[s.token] ?? s.def;
  };

  return (
    <>
      <style>{TWEAKS_STYLE}</style>
      <div className="twk-panel" style={{ right: 16, bottom: 16 }}>
        <div className="twk-hd">
          <b>Charte graphique</b>
          <button className="twk-x" aria-label="Fermer" onClick={onClose}>✕</button>
        </div>
        <div className="twk-body">
          <TweakRadio
            label="Mode"
            value={state.mode}
            options={[
              { value: 'light', label: 'Clair' },
              { value: 'dark', label: 'Sombre' },
            ]}
            onChange={setMode}
          />

          {GROUPS.map((group) => (
            <TweakSection key={group} label={group === 'Couleurs' ? `Couleurs · ${state.mode === 'dark' ? 'Sombre' : 'Clair'}` : group}>
              {THEME_SCHEMA.filter((s) => s.group === group).map((s) => {
                if (s.type === 'color') {
                  return (
                    <TweakColor
                      key={s.token}
                      label={s.label}
                      value={valueFor(s)}
                      onChange={(v) => update(s, v)}
                    />
                  );
                }
                if (s.type === 'font') {
                  return (
                    <TweakSelect
                      key={s.token}
                      label={s.label}
                      value={valueFor(s)}
                      options={FONT_OPTIONS}
                      onChange={(v) => update(s, v)}
                    />
                  );
                }
                return (
                  <TweakSlider
                    key={s.token}
                    label={s.label}
                    value={Number(valueFor(s))}
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    unit={s.unit}
                    onChange={(v) => update(s, v)}
                  />
                );
              })}
            </TweakSection>
          ))}

          <div className="twk-row twk-row-h" style={{ marginTop: 10, gap: 8 }}>
            <TweakButton label="Réinitialiser" secondary onClick={reset} />
            <TweakButton label={copied ? 'Copié !' : 'Exporter le CSS'} onClick={exportCSS} />
          </div>
        </div>
      </div>
    </>
  );
}
