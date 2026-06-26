import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { getProductListIds, setProductLists } from '../lib/selections.js';
import { listLists, createList } from '../lib/lists.js';
import { toast } from '../lib/toast.js';

// Heart that saves a product into one or more named lists. Clicking opens a
// picker (checkboxes of lists + "create a list"); a product in ≥1 list is "on".
// `variant="inline"` drops the absolute positioning (e.g. in the detail modal).
export default function FavoriteButton({ product, variant = 'card', onChange }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState([]);
  const [checked, setChecked] = useState([]);
  const [newName, setNewName] = useState('');
  const [pos, setPos] = useState(null);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);

  const refresh = () => {
    setLists(listLists(user?.sub));
    setChecked(getProductListIds(user?.sub, product?.id));
  };

  useEffect(() => {
    setChecked(getProductListIds(user?.sub, product?.id));
  }, [user?.sub, product?.id]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (product?.id == null) return null;

  const on = checked.length > 0;
  const manage = variant === 'manage';

  const openPicker = (e) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    refresh();
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const W = 248;
      const EST_H = 300; // approx popup height; used only to pick a side
      const left = Math.max(8, Math.min(r.left, window.innerWidth - W - 8));
      const spaceBelow = window.innerHeight - r.bottom;
      // Flip the popover above the button when there isn't enough room below
      // (e.g. a saved-product card low on screen) and there's more room above —
      // otherwise it gets pinned to the bottom edge and is unreachable.
      if (spaceBelow < EST_H && r.top > spaceBelow) {
        setPos({ bottom: Math.max(8, window.innerHeight - r.top + 6), left, width: W });
      } else {
        setPos({ top: Math.max(8, r.bottom + 6), left, width: W });
      }
    }
    setOpen(true);
  };

  const toggleList = (listId) => {
    const adding = !checked.includes(listId);
    const next = adding ? [...checked, listId] : checked.filter((x) => x !== listId);
    setChecked(setProductLists(user?.sub, product, next));
    const name = lists.find((l) => l.id === listId)?.name || '';
    toast(t(adding ? 'toast.added' : 'toast.removed', { name }));
    onChange?.();
  };

  const create = () => {
    const name = newName.trim();
    if (!name) return;
    const lst = createList(user?.sub, name);
    setNewName('');
    setLists(listLists(user?.sub));
    setChecked(setProductLists(user?.sub, product, [...checked, lst.id]));
    toast(t('toast.added', { name }));
    onChange?.();
  };

  return (
    <span className="fav-wrap" ref={wrapRef}>
      <button
        type="button"
        ref={btnRef}
        className={
          'fav-btn' +
          (variant === 'inline' ? ' fav-btn-inline' : '') +
          (manage ? ' fav-btn-manage' : '') +
          (on ? ' on' : '')
        }
        onClick={openPicker}
        aria-pressed={on}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={manage ? t('lists.addTo') : on ? t('selections.remove') : t('selections.add')}
        title={manage ? t('lists.addTo') : on ? t('selections.remove') : t('selections.add')}
      >
        {manage ? (
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M3 4.5h8M3 9h8M3 13.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M13 11.5v5M10.5 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M9 15.4S2.4 11.3 2.4 6.8A3.35 3.35 0 0 1 9 5.1 3.35 3.35 0 0 1 15.6 6.8C15.6 11.3 9 15.4 9 15.4Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill={on ? 'currentColor' : 'none'}
            />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="fav-pop"
          role="menu"
          style={
            pos
              ? {
                  position: 'fixed',
                  left: pos.left,
                  width: pos.width,
                  ...(pos.top != null ? { top: pos.top } : { bottom: pos.bottom }),
                }
              : undefined
          }
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="fav-pop-head">{t('lists.addTo')}</div>
          {lists.length > 0 ? (
            <ul className="fav-pop-list">
              {lists.map((l) => (
                <li key={l.id}>
                  <label className="fav-pop-item">
                    <input
                      type="checkbox"
                      checked={checked.includes(l.id)}
                      onChange={() => toggleList(l.id)}
                    />
                    <span className="fav-pop-name">{l.name}</span>
                    {l.visibility === 'public' && (
                      <span className="fav-pop-badge">{t('lists.public')}</span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <div className="fav-pop-empty">{t('lists.emptyShort')}</div>
          )}
          <div className="fav-pop-create">
            <input
              type="text"
              value={newName}
              maxLength={60}
              placeholder={t('lists.newPlaceholder')}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  create();
                }
              }}
            />
            <button type="button" onClick={create} disabled={!newName.trim()}>
              {t('lists.createBtn')}
            </button>
          </div>
        </div>
      )}
    </span>
  );
}
