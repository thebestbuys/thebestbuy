import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import {
  deleteConversation,
  formatRelative,
  listConversations,
} from '../lib/history.js';

const CATEGORY_LABELS = {
  phone: 'Téléphone',
  laptop: 'Ordinateur',
  headphones: 'Casque',
};

export default function HistoryPanel({ open, onClose, onLoad, currentId }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (open) setItems(listConversations(user?.sub));
  }, [open, user?.sub]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
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

  return (
    <div className="auth-modal-bg" onClick={onClose}>
      <div
        className="history-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="history-head">
          <div>
            <h2 id="history-title" className="history-title">
              Historique
            </h2>
            <p className="history-sub">
              {user
                ? 'Vos conversations sauvegardées localement.'
                : 'Conversations stockées sur cet appareil.'}
            </p>
          </div>
          <button
            className="auth-modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </header>

        {items.length === 0 ? (
          <div className="history-empty">
            <div className="history-empty-icon">✦</div>
            <div className="history-empty-text">
              Aucune conversation sauvegardée pour l'instant.
            </div>
            <div className="history-empty-sub">
              Vos sélections apparaîtront ici dès qu'une recherche démarre.
            </div>
          </div>
        ) : (
          <ul className="history-list">
            {items.map((c) => {
              const isCurrent = c.id === currentId;
              const catLabel = CATEGORY_LABELS[c.category] || c.category;
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
                      {c.title || 'Conversation'}
                    </div>
                    <div className="history-item-meta">
                      {catLabel && (
                        <span className="history-item-cat">{catLabel}</span>
                      )}
                      <span>{formatRelative(c.updatedAt)}</span>
                      {Array.isArray(c.messages) && c.messages.length > 0 && (
                        <span>· {c.messages.length} messages</span>
                      )}
                      {c.done && <span className="history-item-done">✓ finalisée</span>}
                    </div>
                  </button>
                  <button
                    type="button"
                    className="history-item-del"
                    aria-label="Supprimer cette conversation"
                    title="Supprimer"
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
