import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import {
  deleteConversation,
  formatRelative,
  listConversations,
} from '../lib/history.js';
import { useDismiss } from '../lib/useDismiss.js';

export default function HistoryPanel({ open, onClose, onLoad, currentId }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { closing, close } = useDismiss(onClose);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (open) {
      setItems(listConversations(user?.sub));
      setQ('');
    }
  }, [open, user?.sub]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const remove = (id, e) => {
    e.stopPropagation();
    deleteConversation(user?.sub, id);
    setItems((cur) => cur.filter((c) => c.id !== id));
  };

  const catLabelOf = (c) =>
    ['phone', 'laptop', 'headphones'].includes(c.category) ? t('cat.' + c.category) : c.category;

  const term = q.trim().toLowerCase();
  const shown = term
    ? items.filter((c) =>
        [c.title, c.objet, c.initialQuery, catLabelOf(c)]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(term)),
      )
    : items;

  return (
    <div className={'sheet-page history-sheet' + (closing ? ' is-closing' : '')} role="dialog" aria-modal="true" aria-labelledby="history-title">
        <header className="sheet-head">
          <div>
            <h2 id="history-title" className="history-title">
              {t('history.title')}
            </h2>
            <p className="history-sub">
              {user ? t('history.subUser') : t('history.subGuest')}
            </p>
          </div>
          <button
            className="sheet-close"
            onClick={close}
            aria-label={t('auth.close')}
          >
            ✕
          </button>
        </header>
        <div className="sheet-body">

        {items.length > 0 && (
          <div className="friends-search">
            <input
              type="text"
              className="profile-input"
              value={q}
              placeholder={t('history.searchPlaceholder')}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        )}

        {items.length === 0 ? (
          <div className="history-empty">
            <div className="history-empty-icon">✦</div>
            <div className="history-empty-text">{t('history.emptyText')}</div>
            <div className="history-empty-sub">{t('history.emptySub')}</div>
          </div>
        ) : shown.length === 0 ? (
          <div className="friends-hint">{t('search.noResults')}</div>
        ) : (
          <ul className="history-list">
            {shown.map((c) => {
              const isCurrent = c.id === currentId;
              const catLabel = catLabelOf(c);
              return (
                <li
                  key={c.id}
                  className={'history-item' + (isCurrent ? ' current' : '')}
                >
                  <button
                    type="button"
                    className="history-item-main"
                    onClick={() => {
                      onLoad(c);
                      onClose();
                    }}
                  >
                    <div className="history-item-title">
                      {c.title || t('history.conversation')}
                    </div>
                    <div className="history-item-meta">
                      {catLabel && (
                        <span className="history-item-cat">{catLabel}</span>
                      )}
                      <span>{formatRelative(c.updatedAt)}</span>
                      {Array.isArray(c.messages) && c.messages.length > 0 && (
                        <span>{t('history.messages', { n: c.messages.length })}</span>
                      )}
                      {c.done && <span className="history-item-done">{t('history.done')}</span>}
                    </div>
                  </button>
                  <button
                    type="button"
                    className="history-item-del"
                    aria-label={t('history.deleteConvo')}
                    title={t('history.delete')}
                    onClick={(e) => remove(c.id, e)}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 5h8m-6.5 0V3.5h5V5M5 7v4m4-4v4M4 5l.5 7h5L10 5"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
