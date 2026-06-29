import { useI18n } from '../lib/i18n.jsx';

// Small "?" button shown in panel headers next to the close (✕), sized to match
// it. Clicking it opens the global tutorial. To avoid prop-drilling an
// onOpenTutorial callback through every panel, it dispatches a window event
// that App.jsx listens for (the 'oraklia:open-tutorial' handler).
// `flat` matches the borderless .auth-modal-close used by Gift/Guides.
export default function PanelHelpButton({ flat = false }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className={'panel-help-btn' + (flat ? ' panel-help-btn--flat' : '')}
      onClick={() => window.dispatchEvent(new Event('oraklia:open-tutorial'))}
      title={t('home.helpTooltip')}
      aria-label={t('home.helpTooltip')}
    >
      <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7.7 7.6a2.3 2.3 0 0 1 4.3 1.1c0 1.5-2 1.7-2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="14.3" r="0.9" fill="currentColor" />
      </svg>
    </button>
  );
}
