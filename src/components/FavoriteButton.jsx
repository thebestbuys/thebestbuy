import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { isSelected, toggleSelection } from '../lib/selections.js';

// Heart toggle that saves/removes a product from "Mes sélections".
// `variant="inline"` drops the absolute positioning for use inside flows
// (e.g. the product detail modal). Stops propagation so it never triggers
// the surrounding card's onSelect.
export default function FavoriteButton({ product, variant = 'card' }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(isSelected(user?.sub, product?.id));
  }, [user?.sub, product?.id]);

  if (product?.id == null) return null;

  const toggle = (e) => {
    e.stopPropagation();
    setOn(toggleSelection(user?.sub, product));
  };

  return (
    <button
      type="button"
      className={'fav-btn' + (variant === 'inline' ? ' fav-btn-inline' : '') + (on ? ' on' : '')}
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? t('selections.remove') : t('selections.add')}
      title={on ? t('selections.remove') : t('selections.add')}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path
          d="M9 15.4S2.4 11.3 2.4 6.8A3.35 3.35 0 0 1 9 5.1 3.35 3.35 0 0 1 15.6 6.8C15.6 11.3 9 15.4 9 15.4Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill={on ? 'currentColor' : 'none'}
        />
      </svg>
    </button>
  );
}
