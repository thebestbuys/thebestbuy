import { useEffect, useState } from 'react';
import { subscribeToasts } from '../lib/toast.js';

// Renders the transient toast queue. Mounted once at the app root so it shows
// across every view. Each toast auto-dismisses after its duration.
export default function Toaster() {
  const [items, setItems] = useState([]);

  useEffect(
    () =>
      subscribeToasts((item) => {
        setItems((cur) => [...cur, item]);
        setTimeout(() => {
          setItems((cur) => cur.filter((i) => i.id !== item.id));
        }, item.duration);
      }),
    [],
  );

  if (items.length === 0) return null;
  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((i) => (
        <div key={i.id} className="toast">{i.message}</div>
      ))}
    </div>
  );
}
