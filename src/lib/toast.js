// Minimal global toast bus. Anywhere in the app can call `toast('message')`;
// a single <Toaster/> (mounted in main.jsx) subscribes and renders the queue.
// Deliberately framework-light: no context/provider needed, so deep components
// (e.g. FavoriteButton inside a card) can fire a toast without prop threading.
let listeners = [];
let seq = 0;

export function toast(message, opts = {}) {
  if (!message) return;
  const item = { id: ++seq, message, duration: opts.duration ?? 2600 };
  listeners.forEach((fn) => fn(item));
}

export function subscribeToasts(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}
