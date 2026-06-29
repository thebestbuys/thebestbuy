import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const pad2 = (n) => String(n).padStart(2, '0');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const POP_WIDTH = 280;

// Calendar date picker styled to match the site (no native <input type="date">,
// which follows the BROWSER/OS locale rather than the app's own language — it
// stayed in English even when Oraklia was switched to French, and showed
// MM/DD in English, ambiguous and easy to invert). Month/weekday names are
// localized to the APP language via Intl; the value stays canonical
// 'YYYY-MM-DD'. Tapping the "Month Year" title opens a year grid so jumping
// back decades is quick. Shared by the profile birthday field and the
// "add occasion" form.
//
// The popover is rendered through a portal into document.body, positioned via
// the trigger's own getBoundingClientRect() (not CSS position:absolute on a
// relative wrapper): some hosts (e.g. the notifications popover) scroll their
// own content in an `overflow:auto` box, which would otherwise clip a tall
// calendar that opens near the bottom edge.
export default function DatePicker({
  value,
  lang,
  onChange,
  placeholder,
  ariaLabel,
  yearLabel,
  clearLabel,
  minYear = 1920,
  maxYear = new Date().getFullYear(),
}) {
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  const selected = /^\d{4}-\d{2}-\d{2}$/.test(value || '')
    ? { y: +value.slice(0, 4), m: +value.slice(5, 7) - 1, d: +value.slice(8, 10) }
    : null;

  const [open, setOpen] = useState(false);
  const [yearGrid, setYearGrid] = useState(false);
  const [pos, setPos] = useState(null); // {top, left} in viewport coords (position: fixed)
  const today = new Date();
  // Month currently shown in the calendar: the selected date, or today.
  const initial = selected || { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() };
  const [view, setView] = useState({ y: initial.y, m: initial.m });
  const triggerRef = useRef(null);
  const popRef = useRef(null);

  // Re-centre on the selected date and (re)compute the popover's position
  // each time it opens; keep it anchored to the trigger on resize/scroll of
  // ANY ancestor while open (it's portaled, so a scrolling host like the
  // notifications popover's own overflow:auto body won't carry it along the
  // way a CSS-anchored popover would).
  useEffect(() => {
    if (!open) return;
    setYearGrid(false);
    setView({ y: (selected || initial).y, m: (selected || initial).m });
    const place = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      const left = Math.min(Math.max(r.left, 8), window.innerWidth - POP_WIDTH - 8);
      setPos({ top: r.bottom + 6, left });
    };
    place();
    window.addEventListener('resize', place);
    document.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      document.removeEventListener('scroll', place, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const inside = (target) =>
      (triggerRef.current && triggerRef.current.contains(target)) ||
      (popRef.current && popRef.current.contains(target));
    const onDoc = (e) => { if (!inside(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const triggerLabel = selected
    ? cap(new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })
        .format(new Date(selected.y, selected.m, selected.d)))
    : placeholder;

  // Monday-first weekday headers (Jan 1 2024 is a Monday).
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    cap(new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 1 + i))).replace('.', ''),
  );
  const monthName = cap(new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
    .format(new Date(view.y, view.m, 1)));

  const firstOffset = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isToday = (d) => today.getFullYear() === view.y && today.getMonth() === view.m && today.getDate() === d;
  const isSelected = (d) => selected && selected.y === view.y && selected.m === view.m && selected.d === d;

  const shift = (delta) => {
    const dt = new Date(view.y, view.m + delta, 1);
    setView({ y: dt.getFullYear(), m: dt.getMonth() });
  };
  const pick = (d) => {
    onChange(`${view.y}-${pad2(view.m + 1)}-${pad2(d)}`);
    setOpen(false);
  };

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

  return (
    <div className="birthday-field">
      <button
        type="button"
        ref={triggerRef}
        className={'profile-input birthday-trigger' + (selected ? '' : ' is-empty')}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>{triggerLabel}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2.5" y="3.5" width="11" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2.5 6.5h11M5.5 2v2.5M10.5 2v2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      {open && pos && createPortal(
        <div
          className="birthday-pop"
          ref={popRef}
          role="dialog"
          aria-label={ariaLabel}
          style={{ position: 'fixed', top: pos.top, left: pos.left }}
        >
          <div className="bp-head">
            <button type="button" className="bp-nav" onClick={() => shift(-1)} aria-label="−" disabled={yearGrid}>‹</button>
            <button type="button" className="bp-title" onClick={() => setYearGrid((v) => !v)}>
              {yearGrid ? yearLabel : monthName}
            </button>
            <button type="button" className="bp-nav" onClick={() => shift(1)} aria-label="+" disabled={yearGrid}>›</button>
          </div>

          {yearGrid ? (
            <div className="bp-years">
              {years.map((yr) => (
                <button
                  type="button"
                  key={yr}
                  className={'bp-year' + (yr === view.y ? ' is-selected' : '')}
                  onClick={() => { setView((v) => ({ ...v, y: yr })); setYearGrid(false); }}
                >
                  {yr}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="bp-weekdays">
                {weekdays.map((w) => <span key={w} className="bp-weekday">{w}</span>)}
              </div>
              <div className="bp-grid">
                {cells.map((d, i) =>
                  d == null ? (
                    <span key={`b${i}`} className="bp-day is-blank" />
                  ) : (
                    <button
                      type="button"
                      key={d}
                      className={'bp-day' + (isSelected(d) ? ' is-selected' : '') + (isToday(d) ? ' is-today' : '')}
                      onClick={() => pick(d)}
                    >
                      {d}
                    </button>
                  ),
                )}
              </div>
            </>
          )}

          {selected && (
            <button type="button" className="bp-clear" onClick={() => { onChange(''); setOpen(false); }}>
              {clearLabel}
            </button>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
