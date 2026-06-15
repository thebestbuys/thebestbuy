import { useEffect, useState } from 'react';
import {
  TWEAKS_STYLE,
  TweakSection,
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

// Live "charte graphique" editor. Reuses the existing Tweak* controls + styling.
// Opened with Alt+Shift+T (wired in main.jsx). Writes overrides to localStorage
// and applies them live; Export copies a CSS :root snippet to the clipboard.
const GROUPS = ['Couleurs', 'Polices', 'Tailles'];

export default function ThemeEditor({ open, onClose }) {
  const [vals, setVals] = useState({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) setVals(loadTheme());
  }, [open]);

  if (!open) return null;

  const update = (token, value) => {
    const next = { ...vals, [token]: value };
    setVals(next);
    saveTheme(next);
    applyTheme(next);
  };

  const reset = () => {
    resetTheme();
    setVals({});
  };

  const exportCSS = async () => {
    try {
      await navigator.clipboard.writeText(exportThemeCSS(vals));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const valueFor = (s) => (vals[s.token] != null ? vals[s.token] : s.def);

  return (
    <>
      <style>{TWEAKS_STYLE}</style>
      <div className="twk-panel" style={{ right: 16, bottom: 16 }}>
        <div className="twk-hd">
          <b>Charte graphique</b>
          <button className="twk-x" aria-label="Fermer" onClick={onClose}>✕</button>
        </div>
        <div className="twk-body">
          {GROUPS.map((group) => (
            <TweakSection key={group} label={group}>
              {THEME_SCHEMA.filter((s) => s.group === group).map((s) => {
                if (s.type === 'color') {
                  return (
                    <TweakColor
                      key={s.token}
                      label={s.label}
                      value={valueFor(s)}
                      onChange={(v) => update(s.token, v)}
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
                      onChange={(v) => update(s.token, v)}
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
                    onChange={(v) => update(s.token, v)}
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
