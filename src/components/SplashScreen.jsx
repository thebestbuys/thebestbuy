import { useEffect, useState } from 'react';

// One-shot launch animation shown when the app opens: the big "Oraklia"
// wordmark fades in over the site's cream background, spins on itself, then
// collapses into a point — after which the overlay fades and unmounts to
// reveal the app. Honors prefers-reduced-motion (quick fade, no spin).
// Rendered once at the app root (see main.jsx); calls onDone when finished.
const DURATION = 1650; // keep in sync with the CSS timeline below
const REDUCED_DURATION = 550;

export default function SplashScreen({ onDone }) {
  const reduced =
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const total = reduced ? REDUCED_DURATION : DURATION;
    // Trigger the overlay fade slightly before unmount for a clean handoff.
    const fade = setTimeout(() => setLeaving(true), total - 250);
    const done = setTimeout(() => onDone?.(), total);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [onDone, reduced]);

  return (
    <div
      className={
        'splash' +
        (reduced ? ' splash--reduced' : '') +
        (leaving ? ' is-leaving' : '')
      }
      aria-hidden="true"
    >
      <span className="splash-logo">Oraklia</span>
    </div>
  );
}
