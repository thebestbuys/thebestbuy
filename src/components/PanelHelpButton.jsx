import { useI18n } from '../lib/i18n.jsx';

// Labelled "? Comment ça marche" button shown at the top of a panel's content
// (not in the title bar). Clicking it opens the global tutorial. To avoid
// prop-drilling an onOpenTutorial callback through every panel, it dispatches a
// window event that App.jsx listens for (the 'oraklia:open-tutorial' handler).
export default function PanelHelpButton() {
  const { t } = useI18n();
  return (
    <button
      type="button"
      className="panel-help-link"
      onClick={() => window.dispatchEvent(new Event('oraklia:open-tutorial'))}
      title={t('home.helpTooltip')}
    >
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7.7 7.6a2.3 2.3 0 0 1 4.3 1.1c0 1.5-2 1.7-2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="14.3" r="0.9" fill="currentColor" />
      </svg>
      {t('tuto.title')}
    </button>
  );
}
