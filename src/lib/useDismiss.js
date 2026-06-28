import { useCallback, useEffect, useRef, useState } from 'react';

// Smooth close for full-screen sheets/pages. Calling `close()` flips `closing`
// to true — the panel root adds `.is-closing`, which plays the exit animation
// (mirror of the bb-rise enter) — then fires the real `onClose` after `duration`
// so the parent unmounts only once the animation has finished. Without this the
// panels snap out instantly on close while sliding in smoothly on open.
export function useDismiss(onClose, duration = 200) {
  const [closing, setClosing] = useState(false);
  const cbRef = useRef(onClose);
  cbRef.current = onClose;
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const close = useCallback(() => {
    setClosing((c) => {
      if (c) return c; // already closing — ignore repeat triggers
      timer.current = setTimeout(() => cbRef.current && cbRef.current(), duration);
      return true;
    });
  }, [duration]);
  return { closing, close };
}
