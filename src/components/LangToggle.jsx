import { LANGS, useI18n } from '../lib/i18n.jsx';

export default function LangToggle({ className = '' }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div className={'lang-toggle ' + className} role="group" aria-label={t('lang.label')}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          className={'lang-toggle-btn' + (l === lang ? ' active' : '')}
          onClick={() => setLang(l)}
          aria-pressed={l === lang}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
