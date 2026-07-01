import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';

// ── Asset format ────────────────────────────────────────────────────────────
// Flip this to 'gif' or 'video' depending on what you export. Files live in
// public/tuto/ named  <step>.<tier>.<ext>  where <step> is one of STEPS below
// and <tier> is desktop | tablet | phone:
//   video → <step>.<tier>.webm  +  <step>.<tier>.mp4   (webm preferred, mp4 fallback)
//   gif   → <step>.<tier>.gif
// A missing file degrades gracefully to a placeholder, so you can ship steps
// one at a time. MP4/WebM are usually far lighter than GIF for screen captures.
const MEDIA_KIND = 'gif'; // 'video' | 'gif'

// The walkthrough, in order. Each id is also the asset basename under /tuto/.
const STEPS = ['search', 'questions', 'compare', 'buy'];

// Real pixel dimensions of the /tuto/<step>.<tier>.gif captures (same for every
// step within a tier). Feeding these into the stage's CSS as --tuto-w/--tuto-h
// reserves the right box the instant the step changes — before the GIF's bytes
// have even arrived — so the modal no longer jumps in size once it loads.
// (This has to live on .tuto-stage, not the <img>: an <img> with no natural
// size yet sits inside a width:auto box, so an aspect-ratio on the img alone
// has nothing definite to resolve against and collapses to 0×0.)
const TIER_BOX = {
  desktop: { w: 800, h: 378 },
  tablet: { w: 800, h: 557 },
  phone: { w: 380, h: 820 },
};

// Device tiers mirror the app's 980px narrow breakpoint, plus a 600px phone cut.
// We resolve ONE asset per tier so a visitor never downloads the other two
// captures (matches the matchMedia pattern in App.jsx / main.jsx).
function useDeviceTier() {
  const get = () => {
    if (typeof matchMedia !== 'function') return 'desktop';
    if (matchMedia('(max-width: 599px)').matches) return 'phone';
    if (matchMedia('(max-width: 979px)').matches) return 'tablet';
    return 'desktop';
  };
  const [tier, setTier] = useState(get);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mqs = [matchMedia('(max-width: 599px)'), matchMedia('(max-width: 979px)')];
    const onChange = () => setTier(get());
    mqs.forEach((mq) => mq.addEventListener('change', onChange));
    return () => mqs.forEach((mq) => mq.removeEventListener('change', onChange));
  }, []);
  return tier;
}

// Keys (`${step}.${tier}`) whose media has already finished loading once —
// module-level so it survives the per-step remount (key={i} on StepMedia,
// needed to replay the slide-in animation) and the modal being reopened.
// Without this, flipping back to an already-seen step re-showed the spinner
// even though the browser serves the GIF from cache instantly.
const loadedMedia = new Set();

function StepMedia({ step, tier }) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  const key = `${step}.${tier}`;
  const [loaded, setLoaded] = useState(() => loadedMedia.has(key));
  // Re-probe when the step or tier changes (a new file might exist).
  useEffect(() => { setFailed(false); setLoaded(loadedMedia.has(key)); }, [key]);
  const onLoad = () => { loadedMedia.add(key); setLoaded(true); };

  if (failed) {
    return (
      <div className="tuto-media tuto-media--placeholder" aria-hidden="true">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 9.5v5l4-2.5-4-2.5Z" fill="currentColor" />
        </svg>
        <span>{t('tuto.placeholder')}</span>
      </div>
    );
  }

  return (
    <>
      {MEDIA_KIND === 'gif' ? (
        <img
          className="tuto-media"
          src={`/tuto/${step}.${tier}.gif`}
          alt={t(`tuto.${step}.title`)}
          onLoad={onLoad}
          onError={() => setFailed(true)}
        />
      ) : (
        // key forces a remount on step/tier change so the right source loads.
        <video
          key={key}
          className="tuto-media"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={onLoad}
          onError={() => setFailed(true)}
        >
          <source src={`/tuto/${step}.${tier}.webm`} type="video/webm" />
          <source src={`/tuto/${step}.${tier}.mp4`} type="video/mp4" />
        </video>
      )}
      {!loaded && <div className="tuto-media-spinner" aria-hidden="true" />}
    </>
  );
}

// "Comment ça marche" — a short, device-aware walkthrough opened from the home
// help (?) button, whose tooltip already reads "Comment utiliser Oraklia ?".
// Reuses the auth-modal overlay pattern (Escape to close, click-outside).
export default function TutorialModal({ open, onClose, onOpenGuides }) {
  const { t } = useI18n();
  const tier = useDeviceTier();
  const [i, setI] = useState(0);
  const [dir, setDir] = useState('next'); // drives the slide-in direction
  const touch = useRef(null);

  useEffect(() => { if (open) { setI(0); setDir('next'); } }, [open]);

  const goTo = (idx) => {
    const next = Math.max(0, Math.min(idx, STEPS.length - 1));
    setDir(next >= i ? 'next' : 'prev');
    setI(next);
  };
  const goNext = () => goTo(i + 1);
  const goPrev = () => goTo(i - 1);

  // Swipe left/right on the media to move between steps (phone / tablet).
  const onTouchStart = (e) => {
    const p = e.touches[0];
    touch.current = { x: p.clientX, y: p.clientY };
  };
  const onTouchEnd = (e) => {
    if (!touch.current) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - touch.current.x;
    const dy = p.clientY - touch.current.y;
    touch.current = null;
    // Ignore taps and mostly-vertical drags.
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goNext(); else goPrev();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') { setDir('next'); setI((v) => Math.min(v + 1, STEPS.length - 1)); }
      else if (e.key === 'ArrowLeft') { setDir('prev'); setI((v) => Math.max(v - 1, 0)); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const step = STEPS[i];
  const isFirst = i === 0;
  const isLast = i === STEPS.length - 1;

  return (
    <div className="auth-modal-bg auth-modal-bg--top" onClick={onClose}>
      <div
        className="tuto-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tuto-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="tuto-head">
          <h2 id="tuto-title" className="tuto-title">{t('tuto.title')}</h2>
          <button className="auth-modal-close" onClick={onClose} aria-label={t('auth.close')}>✕</button>
        </header>

        <div
          className="tuto-stage"
          data-dir={dir}
          style={{ '--tuto-w': TIER_BOX[tier].w, '--tuto-h': TIER_BOX[tier].h }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* key={i} remounts the media each step so the slide-in animation replays */}
          <StepMedia key={i} step={step} tier={tier} />
        </div>

        <div className="tuto-caption">
          <span className="tuto-step-no">{t('tuto.step', { n: i + 1, total: STEPS.length })}</span>
          <h3 className="tuto-step-title">{t(`tuto.${step}.title`)}</h3>
          <p className="tuto-step-desc">{t(`tuto.${step}.desc`)}</p>
        </div>

        <div className="tuto-dots" role="tablist" aria-label={t('tuto.title')}>
          {STEPS.map((s, idx) => (
            <button
              key={s}
              type="button"
              className={'tuto-dot' + (idx === i ? ' is-active' : '')}
              aria-label={t(`tuto.${s}.title`)}
              aria-selected={idx === i}
              role="tab"
              onClick={() => goTo(idx)}
            />
          ))}
        </div>

        <div className="tuto-nav">
          <button
            type="button"
            className="tuto-btn tuto-btn--ghost"
            disabled={isFirst}
            onClick={goPrev}
          >
            {t('tuto.prev')}
          </button>
          {isLast ? (
            <button type="button" className="tuto-btn tuto-btn--primary" onClick={onClose}>
              {t('tuto.done')}
            </button>
          ) : (
            <button
              type="button"
              className="tuto-btn tuto-btn--primary"
              onClick={goNext}
            >
              {t('tuto.next')}
            </button>
          )}
        </div>

        {onOpenGuides && (
          <button
            type="button"
            className="tuto-guides-link"
            onClick={() => { onClose(); onOpenGuides(); }}
          >
            {t('tuto.guidesLink')}
          </button>
        )}
      </div>
    </div>
  );
}
