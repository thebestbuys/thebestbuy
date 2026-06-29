// Month names for custom date pickers. Native <input type="date">'s calendar
// popup is rendered by the browser in the BROWSER/OS UI language, ignoring
// document.documentElement.lang — so it can't be forced to follow the app's
// own language switch. Components needing a localized picker build their own
// day/month/year selects using these names instead.
const MONTHS = {
  fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

export function monthNames(lang) {
  return MONTHS[lang] || MONTHS.fr;
}
