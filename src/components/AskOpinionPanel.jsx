import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { AmazonPrice, ProductImage } from './ProductCard.jsx';
import { listSelections } from '../lib/selections.js';
import { listLists } from '../lib/lists.js';
import { listFriends, createPoll } from '../lib/cloud.js';
import { useDismiss } from '../lib/useDismiss.js';

function initials(name = '') {
  const p = String(name).trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || '?';
}

// Compose a poll: pick 2–4 saved products + friends, send for their vote.
export default function AskOpinionPanel({ open, onClose, getAmazonUrl }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { closing, close } = useDismiss(onClose);
  const [items, setItems] = useState([]);
  const [lists, setLists] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pickedP, setPickedP] = useState([]); // product ids
  const [pickedF, setPickedF] = useState([]); // friend user ids
  const [pickedList, setPickedList] = useState(''); // list applied as a shortcut
  const [name, setName] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setItems(listSelections(user?.sub));
    setLists(listLists(user?.sub));
    listFriends().then(setFriends).catch(() => {});
    setPickedP([]);
    setPickedF([]);
    setPickedList('');
    setName('');
    setSent(false);
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, user?.sub]);

  if (!open) return null;

  const toggleP = (id) => {
    setPickedList(''); // manual tweak detaches from the list shortcut
    setPickedP((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 4) return cur; // cap at 4
      return [...cur, id];
    });
  };

  // Shortcut: pick a whole list → its first (up to 4) products. Click again to clear.
  const products = items;
  const listProductIds = (listId) =>
    products.filter((p) => (p.listIds || []).includes(listId)).map((p) => p.id);
  const pickList = (listId) => {
    if (pickedList === listId) {
      setPickedList('');
      setPickedP([]);
      return;
    }
    setPickedList(listId);
    setPickedP(listProductIds(listId).slice(0, 4));
  };
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
    const { ok } = await createPoll(payload, pickedF, name);
    if (ok) {
      setSent(true);
      setTimeout(() => onClose(), 1200);
    }
  };

  return (
    <div className={'sheet-page notif-panel' + (closing ? ' is-closing' : '')} role="dialog" aria-modal="true" aria-labelledby="poll-title">
        <header className="sheet-head">
          <div>
            <h2 id="poll-title" className="history-title">{t('poll.title')}</h2>
          </div>
          <button className="sheet-close" onClick={close} aria-label={t('auth.close')}>✕</button>
        </header>
        <div className="sheet-body">

        {!user ? (
          <div className="history-empty">
            <div className="history-empty-icon">🗳️</div>
            <div className="history-empty-text">{t('friends.signedOut')}</div>
          </div>
        ) : (
          <div className="friends-body">
            <div className="friends-section">{t('poll.name')}</div>
            <input
              type="text"
              className="profile-input"
              value={name}
              maxLength={120}
              placeholder={t('poll.namePlaceholder')}
              onChange={(e) => setName(e.target.value)}
            />
            {lists.length > 0 && (
              <>
                <div className="friends-section">{t('poll.pickList')}</div>
                <div className="poll-list-chips">
                  {lists.map((l) => {
                    const n = listProductIds(l.id).length;
                    if (n === 0) return null;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        className={'poll-list-chip' + (pickedList === l.id ? ' is-on' : '')}
                        onClick={() => pickList(l.id)}
                      >
                        {l.name} <span className="poll-list-chip-n">{n}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

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
