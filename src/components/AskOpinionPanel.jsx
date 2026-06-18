import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { AmazonPrice, ProductImage } from './ProductCard.jsx';
import { listSelections } from '../lib/selections.js';
import { listFriends, createPoll } from '../lib/cloud.js';

function initials(name = '') {
  const p = String(name).trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || '?';
}

// Compose a poll: pick 2–4 saved products + friends, send for their vote.
export default function AskOpinionPanel({ open, onClose, getAmazonUrl }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pickedP, setPickedP] = useState([]); // product ids
  const [pickedF, setPickedF] = useState([]); // friend user ids
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setItems(listSelections(user?.sub));
    listFriends().then(setFriends).catch(() => {});
    setPickedP([]);
    setPickedF([]);
    setSent(false);
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, user?.sub]);

  if (!open) return null;

  const toggleP = (id) =>
    setPickedP((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 4) return cur; // cap at 4
      return [...cur, id];
    });
  const toggleF = (id) =>
    setPickedF((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const canSend = pickedP.length >= 2 && pickedP.length <= 4 && pickedF.length >= 1;

  const send = async () => {
    if (!canSend) return;
    const chosen = items.filter((p) => pickedP.includes(p.id));
    const payload = chosen.map((p) => ({
      b: p.brand,
      m: p.model,
      p: p.price ?? null,
      u: getAmazonUrl ? getAmazonUrl(p) : p.amazon_url,
      i: p.image_url || null,
    }));
    const { ok } = await createPoll(payload, pickedF);
    if (ok) {
      setSent(true);
      setTimeout(() => onClose(), 1200);
    }
  };

  return (
    <div className="auth-modal-bg" onClick={onClose}>
      <div
        className="history-panel notif-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="poll-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="history-head">
          <div>
            <h2 id="poll-title" className="history-title">{t('poll.title')}</h2>
          </div>
          <button className="auth-modal-close" onClick={onClose} aria-label={t('auth.close')}>✕</button>
        </header>

        {!user ? (
          <div className="history-empty">
            <div className="history-empty-icon">🗳️</div>
            <div className="history-empty-text">{t('friends.signedOut')}</div>
          </div>
        ) : (
          <div className="friends-body">
            <div className="friends-section">
              {t('poll.pickProducts')} <span className="sel-list-n">{pickedP.length}/4</span>
            </div>
            {items.length === 0 ? (
              <div className="friends-hint">{t('poll.noProducts')}</div>
            ) : (
              <ul className="pub-items">
                {items.map((p) => {
                  const on = pickedP.includes(p.id);
                  return (
                    <li
                      key={p.id}
                      className={'pub-item poll-pick' + (on ? ' is-on' : '')}
                      onClick={() => toggleP(p.id)}
                    >
                      <input type="checkbox" checked={on} readOnly className="poll-check" />
                      <span className="pub-item-img"><ProductImage product={p} size="small" /></span>
                      <span className="pub-item-main">
                        <span className="pub-item-title">{[p.brand, p.model].filter(Boolean).join(' ')}</span>
                        {p.price != null && <span className="pub-item-price"><AmazonPrice price={p.price} /></span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="friends-section">{t('poll.pickFriends')}</div>
            {friends.length === 0 ? (
              <div className="friends-hint">{t('poll.noFriends')}</div>
            ) : (
              <ul className="friends-list">
                {friends.map((f) => {
                  const on = pickedF.includes(f.user_id);
                  return (
                    <li
                      key={f.user_id}
                      className={'friend-row poll-pick' + (on ? ' is-on' : '')}
                      onClick={() => toggleF(f.user_id)}
                    >
                      <input type="checkbox" checked={on} readOnly className="poll-check" />
                      <span className="friend-avatar-fallback" style={{ width: 32, height: 32, fontSize: 12 }}>
                        {initials(f.display_name)}
                      </span>
                      <span className="friend-name">{f.display_name}</span>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="profile-actions">
              <button type="button" className="profile-save" disabled={!canSend} onClick={send}>
                {sent ? t('poll.sent') : t('poll.send')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
