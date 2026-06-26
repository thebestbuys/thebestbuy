import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES } from './data.js';
import { askQuestion, recommend, enrichProduct, fetchSuggestions } from './lib/askAI.js';
import AuthMenu from './components/AuthMenu.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import FriendRequestsBell from './components/FriendRequestsBell.jsx';
import FavoriteButton from './components/FavoriteButton.jsx';
import LangToggle from './components/LangToggle.jsx';

// Overlays / secondary views — code-split so they don't bloat the initial
// bundle. Each is only mounted when its open flag is true (the panels already
// return null when closed), so the chunk loads on first open, not at startup.
const HistoryPanel = lazy(() => import('./components/HistoryPanel.jsx'));
const SelectionsPanel = lazy(() => import('./components/SelectionsPanel.jsx'));
const ProfilePanel = lazy(() => import('./components/ProfilePanel.jsx'));
const GiftPanel = lazy(() => import('./components/GiftPanel.jsx'));
const SharedGiftList = lazy(() => import('./components/SharedGiftList.jsx'));
const FriendsPanel = lazy(() => import('./components/FriendsPanel.jsx'));
const NotificationsPanel = lazy(() => import('./components/NotificationsPanel.jsx'));
const AskOpinionPanel = lazy(() => import('./components/AskOpinionPanel.jsx'));
const LegalNotices = lazy(() => import('./components/LegalNotices.jsx'));
const GuideArticle = lazy(() => import('./components/GuideArticle.jsx'));
const GuidesPanel = lazy(() => import('./components/GuidesPanel.jsx'));
import { GUIDES, localizeGuide, getGuide } from './data/guides.js';
import { HeroCard, PriceTag, ProductImage, ProductLinkCard, ProductSkeleton, ScoreRing, SmallCard, VerifiedRating } from './components/ProductCard.jsx';
import { useAuth } from './lib/auth.jsx';
import { useI18n } from './lib/i18n.jsx';
import { getProfile, profileToPrompt } from './lib/profile.js';
import { giftToPrompt, giftTitle, buildShareUrl, loadSharedPayload } from './lib/gift.js';
import { getAccessToken, circleTrending, logLinkClick } from './lib/cloud.js';
import { toast } from './lib/toast.js';
import {
  deriveTitle,
  formatRelative,
  listConversations,
  newConversationId,
  saveConversation,
} from './lib/history.js';
import {
  TweakRadio,
  TweakSection,
  TweaksPanel,
  useTweaks,
} from './components/TweaksPanel.jsx';

// True on narrow viewports (phones / small tablets). Drives the advisor's
// single-column "chat + inline product link cards" layout; on wider screens we
// keep the two-pane chat + results panel. Mirrors the matchMedia pattern in
// main.jsx and the `@media (max-width: 979px)` CSS breakpoint.
function useIsNarrow() {
  const query = '(max-width: 979px)';
  const [narrow, setNarrow] = useState(
    () => typeof matchMedia === 'function' && matchMedia(query).matches,
  );
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia(query);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return narrow;
}

// Lightweight path → view mapping. Only the SEO/shareable pages (guides + legal)
// carry a real URL; every other view stays URL-less app state. Used to open the
// right view on a direct hit / refresh and to re-sync on browser back/forward.
function viewFromPath() {
  const path = typeof location !== 'undefined' ? location.pathname : '/';
  const m = path.match(/^\/guide\/([^/]+)\/?$/);
  if (m && getGuide(decodeURIComponent(m[1]))) return { guide: decodeURIComponent(m[1]) };
  if (/^\/mentions-legales\/?$/.test(path)) return { legal: true };
  return {};
}

const CATEGORY_KEYWORDS = {
  phone: ['téléphone', 'telephone', 'smartphone', 'phone', 'iphone', 'mobile', 'portable android', 'samsung galaxy', 'pixel'],
  laptop: ['ordinateur', 'laptop', 'pc portable', 'macbook', 'pc', 'notebook', 'ultrabook'],
  headphones: ['casque', 'écouteur', 'ecouteur', 'airpods', 'audio', 'headphone', 'earbuds', 'intra', 'bluetooth audio'],
};

// Maps a search term to one of our editorial buying guides (by guide category),
// so the results can cross-link to "read our guide". Covers the categories that
// detectCategory doesn't (tv / vacuum) plus the three it does.
const GUIDE_KW = [
  { cat: 'phone', kw: ['téléphone', 'telephone', 'smartphone', 'phone', 'iphone', 'pixel', 'galaxy'] },
  { cat: 'laptop', kw: ['ordinateur', 'laptop', 'pc portable', 'macbook', 'notebook', 'ultrabook'] },
  { cat: 'headphones', kw: ['casque', 'écouteur', 'ecouteur', 'airpods', 'earbuds', 'intra'] },
  { cat: 'tv', kw: ['télé', 'tele', 'téléviseur', 'televiseur', 'oled', 'qled'] },
  { cat: 'vacuum', kw: ['aspirateur', 'aspi'] },
];

// The AI returns positional ids ("p1", "p2", "p3") that repeat across every
// recommendation set — so favoriting "p2" once would make every set's 2nd item
// look favorited. Derive a stable id from brand+model (the product's identity)
// so selections track the actual product, not its rank.
function productKey(p) {
  const slug = `${p.brand || ''} ${p.model || ''}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || p.id || `p-${Math.random().toString(36).slice(2, 8)}`;
}

function detectCategory(query) {
  const q = query.toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some((k) => q.includes(k))) return cat;
  }
  return null;
}

function bgPattern(category, id) {
  if (category === 'phone') return (
    <pattern id={id} x="0" y="0" width="80" height="130" patternUnits="userSpaceOnUse">
      <rect x="18" y="8" width="44" height="84" rx="11" fill="none" stroke="currentColor" strokeWidth="1.6"/>
      <rect x="24" y="14" width="32" height="68" rx="7" fill="none" stroke="currentColor" strokeWidth="0.8"/>
      <rect x="30" y="96" width="20" height="3" rx="1.5" fill="currentColor" opacity="0.6"/>
      <circle cx="40" cy="20" r="3" fill="none" stroke="currentColor" strokeWidth="1.2"/>
    </pattern>
  );
  if (category === 'laptop') return (
    <pattern id={id} x="0" y="0" width="130" height="100" patternUnits="userSpaceOnUse">
      <rect x="10" y="5" width="110" height="72" rx="6" fill="none" stroke="currentColor" strokeWidth="1.6"/>
      <rect x="18" y="13" width="94" height="56" rx="3" fill="none" stroke="currentColor" strokeWidth="0.8"/>
      <path d="M0 82 Q65 86 130 82" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
    </pattern>
  );
  return (
    <pattern id={id} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
      <path d="M20 56 Q20 14 50 14 Q80 14 80 56" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <rect x="8" y="56" width="22" height="32" rx="9" fill="none" stroke="currentColor" strokeWidth="1.6"/>
      <rect x="70" y="56" width="22" height="32" rx="9" fill="none" stroke="currentColor" strokeWidth="1.6"/>
    </pattern>
  );
}

function ResultsPlaceholder({ category }) {
  const { t } = useI18n();
  const patternId = `placeholder-pattern-${category}`;
  return (
    <div className="results-placeholder">
      <svg className="placeholder-wallpaper" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <defs>{bgPattern(category, patternId)}</defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <div className="placeholder-message">
        <div className="placeholder-icon">✦</div>
        <h3
          className="placeholder-title"
          dangerouslySetInnerHTML={{ __html: t('results.placeholderTitle') }}
        />
        <p className="placeholder-sub">{t('results.placeholderSub')}</p>
      </div>
    </div>
  );
}

// "Tendances dans mon cercle" — products most saved/clicked by the signed-in
// user's consenting friends (aggregated server-side by circle_trending). Hidden
// for guests and when the circle has nothing to show yet.
function TrendingCircle({ onOpen, hideHeader }) {
  const { t } = useI18n();
  const { user, cloudReady } = useAuth();
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Wait for the Supabase session (cloudReady), not just `user`: `user` is
  // restored synchronously from localStorage but the cloud session is set a tick
  // later, so fetching on `user` alone would call circleTrending() before
  // hasCloudSession() is true and silently get an empty result (no RPC call).
  useEffect(() => {
    if (!user || !cloudReady) {
      setItems([]);
      setLoaded(false);
      return;
    }
    let alive = true;
    setLoaded(false);
    circleTrending(12).then((list) => {
      if (!alive) return;
      setItems(Array.isArray(list) ? list : []);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [user?.sub, cloudReady]);

  // Hidden for guests, and until the first fetch resolves (no empty flash).
  if (!user || !cloudReady || !loaded) return null;

  return (
    <section className="home-trending">
      {!hideHeader && (
        <div className="home-guides-head">
          <h2 className="home-guides-title">{t('trending.title')}</h2>
          <p className="home-guides-sub">{t('trending.sub')}</p>
        </div>
      )}
      {items.length > 0 ? (
        <div className="trending-row">
          {items.map((p) => (
            <ProductLinkCard key={p.id} product={p} friendCount={p.friend_count} onSelect={onOpen} />
          ))}
        </div>
      ) : (
        <p className="trending-empty">{t('trending.empty')}</p>
      )}
    </section>
  );
}

// "Tendances" overlay (rail tab) — wraps TrendingCircle in panel chrome so the
// feature gets its own dedicated tab instead of crowding the home hero.
function TrendingPanel({ onClose, onOpen }) {
  const { t } = useI18n();
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="auth-modal-bg" onClick={onClose}>
      <div
        className="side-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trending-panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="history-head">
          <div>
            <h2 id="trending-panel-title" className="history-title">{t('trending.title')}</h2>
            <p className="history-sub">{t('trending.sub')}</p>
          </div>
          <button className="auth-modal-close" onClick={onClose} aria-label={t('auth.close')}>✕</button>
        </header>
        <TrendingCircle onOpen={onOpen} hideHeader />
      </div>
    </div>
  );
}

function CategoryPicker({ onPick, onOpenHistory, onOpenSelections, onOpenProfile, onOpenFriends, onOpenAsk, onOpenNotifications, notifPing, onOpenGift, onOpenLegal, onOpenGuide, onOpenGuides, onOpenTrending, onLoadConvo, onOpenProduct }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const firstName = user?.given_name || user?.name?.split(/\s+/)[0] || '';
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Suggestion chips picked by the AI for the current season / events, tailored
  // to the user's profile when signed in. `null` while loading → skeleton chips
  // are shown; once resolved the skeletons reverse-pop out, then the real chips
  // pop in one by one. The static list is a fallback if the AI call fails/empties.
  const [suggestions, setSuggestions] = useState(null);
  const [skelOut, setSkelOut] = useState(false); // skeletons playing their exit
  useEffect(() => {
    let alive = true;
    let swapTimer;
    setSuggestions(null); // reset on lang/user change so the chips re-pop
    setSkelOut(false);
    const profile = profileToPrompt(getProfile(user?.sub), lang);
    const fallback = [
      { key: 'suggestion.ac', icon: 'ac' },
      { key: 'suggestion.fan', icon: 'fan' },
      { key: 'suggestion.phone', icon: 'phone' },
      { key: 'suggestion.laptop', icon: 'laptop' },
      { key: 'suggestion.tv', icon: 'tv' },
    ].map((s) => ({ label: t(s.key), icon: s.icon }));
    // Play the skeleton exit, then swap in the real chips once it has finished.
    const resolve = (list) => {
      if (!alive) return;
      setSkelOut(true);
      swapTimer = setTimeout(() => { if (alive) setSuggestions(list); }, 230);
    };
    fetchSuggestions({ lang, profile })
      .then((s) => resolve(Array.isArray(s) && s.length ? s : fallback))
      .catch(() => resolve(fallback));
    return () => { alive = false; clearTimeout(swapTimer); };
  }, [lang, user?.sub]);

  const submit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const cat = detectCategory(query) || query.trim();
    onPick(cat, query.trim());
  };

  const SuggestionIcon = ({ icon }) => {
    const p = { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none', 'aria-hidden': true };
    const sw = { stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round' };
    switch (icon) {
      case 'ac':
        return (
          <svg {...p}><rect x="1.5" y="3.5" width="11" height="4.5" rx="1.4" {...sw} /><line x1="3" y1="6.2" x2="11" y2="6.2" {...sw} /><path d="M4 10.3q1 1 0 2M7 10.3q1 1 0 2M10 10.3q1 1 0 2" {...sw} /></svg>
        );
      case 'fan':
        return (
          <svg {...p}><circle cx="7" cy="7" r="5.2" {...sw} /><circle cx="7" cy="7" r="1" {...sw} /><path d="M7 6V2.5M7.9 7.4l3 1.7M6.1 7.4l-3 1.7" {...sw} /></svg>
        );
      case 'phone':
        return (
          <svg {...p}><rect x="3.5" y="1.5" width="7" height="11" rx="1.6" {...sw} /><line x1="6" y1="10.5" x2="8" y2="10.5" {...sw} /></svg>
        );
      case 'laptop':
        return (
          <svg {...p}><rect x="2.5" y="2.5" width="9" height="6.5" rx="1" {...sw} /><line x1="1" y1="11" x2="13" y2="11" {...sw} /></svg>
        );
      case 'tv':
        return (
          <svg {...p}><rect x="1.5" y="2.5" width="11" height="7.5" rx="1" {...sw} /><line x1="5" y1="12.5" x2="9" y2="12.5" {...sw} /></svg>
        );
      case 'earbuds':
        return (
          <svg {...p}><path d="M4.5 2.5C3 2.5 2.5 4 2.5 5.5S3 8.5 4.5 8.5 5 7 5 5.5 6 2.5 4.5 2.5Z" {...sw} /><path d="M9.5 2.5C11 2.5 11.5 4 11.5 5.5S11 8.5 9.5 8.5 9 7 9 5.5 8 2.5 9.5 2.5Z" {...sw} /></svg>
        );
      case 'watch':
        return (
          <svg {...p}><rect x="4" y="4" width="6" height="6" rx="1.6" {...sw} /><path d="M5.5 4 6 1.5h2L8.5 4M5.5 10 6 12.5h2L8.5 10" {...sw} /><path d="M7 5.5V7l1 .8" {...sw} /></svg>
        );
      case 'vacuum':
        return (
          <svg {...p}><circle cx="7" cy="7.5" r="5" {...sw} /><circle cx="7" cy="7.5" r="1.5" {...sw} /><line x1="7" y1="2.5" x2="7" y2="4" {...sw} /></svg>
        );
      case 'coffee':
        return (
          <svg {...p}><path d="M2.5 5.5h8v3a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3v-3Z" {...sw} /><path d="M10.5 6.5h1.5a1.3 1.3 0 0 1 0 2.6h-1.5" {...sw} /><line x1="4" y1="2" x2="4" y2="3.5" {...sw} /><line x1="7" y1="2" x2="7" y2="3.5" {...sw} /></svg>
        );
      case 'speaker':
        return (
          <svg {...p}><rect x="3.5" y="1.5" width="7" height="11" rx="1.4" {...sw} /><circle cx="7" cy="8.5" r="2.2" {...sw} /><circle cx="7" cy="3.8" r="0.6" fill="currentColor" stroke="none" /></svg>
        );
      default:
        return (
          <svg {...p}><circle cx="7" cy="7" r="5" {...sw} /></svg>
        );
    }
  };

  return (
    <div className="home">
      <div className="home-topbar">
        <FriendRequestsBell onOpen={onOpenNotifications} pingKey={notifPing} />
        <LangToggle />
        <AuthMenu
          variant="home"
          onOpenProfile={onOpenProfile}
          onOpenSelections={onOpenSelections}
          onOpenHistory={onOpenHistory}
          onOpenFriends={onOpenFriends}
          onOpenAsk={onOpenAsk}
          onOpenNotifications={onOpenNotifications}
          onOpenTrending={onOpenTrending}
        />
      </div>

      <div className="home-body">
        <main className="home-main">
          <h1 className="home-logo">Oraklia</h1>
          <p className="home-greeting">
            {firstName ? t('m.greetingLead', { name: firstName }) : t('m.greetingLeadAnon')}{' '}
            <span className="home-greeting-hl">{t('m.greetingHighlight')}</span>
          </p>
          <div className="home-search-row">
            <form className="home-search" onSubmit={submit}>
              <span className="home-search-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M14 14L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <input
                ref={inputRef}
                type="text"
                placeholder={t('home.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" disabled={!query.trim()} className="home-search-submit" aria-label={t('home.search')}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8 L14 8 M9 3 L14 8 L9 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>
            <button
              type="button"
              className="home-help-btn"
              onClick={onOpenGuides}
              title={t('home.helpTooltip')}
              aria-label={t('home.helpTooltip')}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7.7 7.6a2.3 2.3 0 0 1 4.3 1.1c0 1.5-2 1.7-2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="14.3" r="0.9" fill="currentColor" />
              </svg>
            </button>
          </div>

          <div className="home-cta-row">
            <button type="button" className="home-gift-cta" onClick={onOpenGift}>
              <span aria-hidden="true" className="home-gift-cta-emoji">🎁</span>
              {t('home.gift')}
            </button>
          </div>

          <div className="home-suggestions-slot">
            <div className="home-suggestions">
              {suggestions
                ? suggestions.map((s, i) => {
                    const label = s.label;
                    return (
                      <button key={`${label}-${i}`} type="button" className="suggestion-chip suggestion-chip--pop"
                        style={{ animationDelay: `${i * 160}ms` }}
                        onClick={() => onPick(detectCategory(label) || label, label)}>
                        <span className="suggestion-chip-icon"><SuggestionIcon icon={s.icon} /></span>
                        {label}
                      </button>
                    );
                  })
                : [170, 150, 190, 160, 140].map((w, i) => (
                    <span key={i}
                      className={'suggestion-chip-skel' + (skelOut ? ' is-leaving' : '')}
                      style={{ width: w }} aria-hidden="true" />
                  ))}
            </div>
          </div>

        </main>

        <footer className="home-footer">
          <div className="home-footer-inner">
            <p className="home-footer-affiliate">{t('footer.affiliate')}</p>
            <div className="home-footer-meta">
              <span>{t('footer.rights', { year: new Date().getFullYear() })}</span>
              <button type="button" className="home-footer-link" onClick={onOpenLegal}>
                {t('footer.legal')}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ProductDetail({ product, onClose, onBuy }) {
  const { t, lang } = useI18n();
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  const amazonUrl = product.amazon_url ||
    `https://www.amazon.fr/s?k=${encodeURIComponent(`${product.brand} ${product.model}`)}&tag=oraklia123-21`;
  // No real (verified) Amazon image → don't show a placeholder at all; let the
  // detail content take the full width.
  const hasImage = product.amazon_verified && !!product.image_url;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t('auth.close')}>✕</button>
        <div className={'modal-grid' + (hasImage ? '' : ' no-image')}>
          {hasImage && (
            <div className="modal-left">
              <ProductImage product={product} size="modal" />
            </div>
          )}
          <div className="modal-right">
            <div className="modal-brand">{product.brand}</div>
            <h2 className="modal-title">{product.model}</h2>
            {product.amazon_verified && product.rating != null && (
              <div className="modal-rating">
                <VerifiedRating product={product} locale={locale} />
              </div>
            )}
            {product.score != null && (
              <div className="modal-score-row">
                <ScoreRing score={product.score} size={56} />
                <div>
                  <div className="modal-score-title">{t('product.matchPct', { score: product.score })}</div>
                  <div className="modal-score-sub">{t('product.matchSub')}</div>
                </div>
              </div>
            )}
            {product.why && (
              <>
                <div className="modal-section-title">{t('product.why')}</div>
                <p className="modal-why">{product.why}</p>
              </>
            )}
            {product.specs?.length > 0 && (
              <>
                <div className="modal-section-title">{t('product.features')}</div>
                <ul className="modal-specs">
                  {product.specs.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </>
            )}
            <div className="modal-bottom">
              <div>
                <div className="modal-price-label">
                  {product.amazon_verified ? t('product.price') : t('product.priceEstimate')}
                </div>
                <div className="modal-price">
                  <PriceTag product={product} locale={locale} t={t} variant="hero" />
                </div>
                {!product.amazon_verified && product.price != null && (
                  <div className="modal-price-note">{t('product.priceEstimateNote')}</div>
                )}
                <div className="modal-shipping">{t('product.shipping')}</div>
              </div>
              <div className="modal-buy">
                <FavoriteButton product={product} variant="inline" />
                <a
                  className="btn-primary big"
                  href={amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  onClick={() => onBuy(product)}
                >
                  {t('product.viewAmazon')}
                  <span className="btn-arrow">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "chatLayout": "bubbles",
    "heroVariant": "wide",
    "density": "regular"
  }/*EDITMODE-END*/;

  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const { user } = useAuth();
  const { t: tr, lang } = useI18n();
  const narrow = useIsNarrow();

  const [category, setCategory] = useState(null);
  const [initialQuery, setInitialQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [convoId, setConvoId] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectionsOpen, setSelectionsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [guidesOpen, setGuidesOpen] = useState(false);
  const [trendingOpen, setTrendingOpen] = useState(false);
  const [giftPrefill, setGiftPrefill] = useState(null); // {occasion} when opened from a reminder
  const [gift, setGift] = useState(null);   // recipient payload when in gift mode
  const [shareCopied, setShareCopied] = useState(false);
  // Read-only shared list opened from a ?s=<id> (short) or ?share=<payload> link.
  const [sharedList, setSharedList] = useState(null);
  const [shareLoading, setShareLoading] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      return !!(p.get('s') || p.get('share'));
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (!shareLoading) return;
    loadSharedPayload(window.location.search)
      .then((d) => setSharedList(d || { items: [] }))
      .finally(() => setShareLoading(false));
  }, [shareLoading]);
  // Open the guide / legal view directly when landing on its URL (deep link,
  // refresh, or the prerendered page handing off to the app).
  const [legalOpen, setLegalOpen] = useState(() => !!viewFromPath().legal);
  const [activeGuide, setActiveGuide] = useState(() => viewFromPath().guide || null);
  const [objet, setObjet] = useState('');      // human search term sent to the AI
  const [answers, setAnswers] = useState([]);  // compact criteria JSON [{id,q,a,tags,min,max}]
  const [editIndex, setEditIndex] = useState(null); // answer index being edited in place
  const [loadingProducts, setLoadingProducts] = useState(false); // a recommend() call is in flight
  const [retryAction, setRetryAction] = useState(null); // re-run the last failed AI call (set on error)

  // Self mode: recommend after the first 5 answers, then every 3 more (8, 11, …).
  // Gift mode: recommend immediately (the recipient form already has budget +
  // occasion), then every 3 refinement answers (0, 3, 6, …).
  const FIRST_RECO = 5;
  const shouldRecommendAt = (n) => (gift ? n % 3 === 0 : n >= 5 && (n - 5) % 3 === 0);

  // Honest progress tied to the recommendation milestone (FIRST_RECO answers in
  // self mode) rather than an arbitrary turnCount*22. Drives both the bar width
  // (ratio) and a human-readable label in ChatPanel.
  const progressInfo = (() => {
    if (done && recommendedProducts.length > 0) {
      return { ratio: 1, label: tr('chat.progressReady'), tone: 'ready' };
    }
    if (gift) {
      return {
        ratio: Math.min(0.9, 0.3 + turnCount * 0.15),
        label: recommendedProducts.length ? tr('chat.progressRefine') : tr('chat.progressGiftPrep'),
        tone: 'refine',
      };
    }
    if (turnCount < FIRST_RECO) {
      return {
        ratio: turnCount / FIRST_RECO,
        label: `${tr('chat.progressStep', { n: Math.min(turnCount + 1, FIRST_RECO), total: FIRST_RECO })} · ${tr('chat.progressSoon')}`,
        tone: 'asking',
      };
    }
    return { ratio: 0.9, label: tr('chat.progressRefine'), tone: 'refine' };
  })();

  // Budget bracket the user picked (euros), used to badge each card in/over budget.
  const budgetBounds = (() => {
    const b = answers.find((a) => a.min != null || a.max != null);
    return b ? { min: b.min ?? null, max: b.max ?? null } : null;
  })();

  // The buying guide that matches the current search, for the results cross-link.
  const resultsGuide = (() => {
    if (!category || category === 'gift') return null;
    let cat = GUIDES.some((g) => g.category === category) ? category : null;
    if (!cat) {
      const text = (objet || initialQuery || '').toLowerCase();
      cat = GUIDE_KW.find((m) => m.kw.some((k) => text.includes(k)))?.cat || null;
    }
    const g = cat ? GUIDES.find((x) => x.category === cat) : null;
    return g ? localizeGuide(g, lang) : null;
  })();

  // Prefetch the most-used overlay chunks once the app is idle, so the first
  // open of History/Selections/Profile/Gift/Notifications feels instant despite
  // being code-split (see the lazy() imports above).
  useEffect(() => {
    const prefetch = () => {
      import('./components/HistoryPanel.jsx');
      import('./components/SelectionsPanel.jsx');
      import('./components/ProfilePanel.jsx');
      import('./components/GiftPanel.jsx');
      import('./components/NotificationsPanel.jsx');
    };
    const ric = typeof window !== 'undefined' && window.requestIdleCallback;
    const id = ric ? ric(prefetch, { timeout: 3000 }) : setTimeout(prefetch, 2500);
    return () => {
      if (ric && window.cancelIdleCallback) window.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  const loadProducts = (products) => {
    if (!Array.isArray(products) || !products.length) return;
    setDone(true);
    const base = products.map((p) => ({ ...p, id: productKey(p), category }));
    setRecommendedProducts(base);
    base.forEach((p, i) => {
      enrichProduct(p).then((enriched) => {
        setRecommendedProducts((prev) => {
          const next = [...prev];
          next[i] = enriched;
          return next;
        });
      });
    });
  };

  // Advance from the current criteria: fetch recommendations (every 5 then +3
  // answers) and/or ask the next question. Sends only the compact criteria JSON.
  const advance = async (currentAnswers, searchObjet = objet) => {
    setIsTyping(true);
    setCurrentQuestion(null);
    setRetryAction(null);
    // Strip client-only fields (_q, _msgIndex used by edit/rewind) before sending.
    const answersForApi = currentAnswers.map(({ id, q, a, tags, min, max }) => ({ id, q, a, tags, min, max }));
    currentAnswers = answersForApi;
    const profile = profileToPrompt(getProfile(user?.sub), lang);
    const giftStr = gift ? giftToPrompt(gift, lang) : '';
    const surprise = !!gift?.surprise;
    const friendId = gift?.friendId || '';
    const token = friendId ? getAccessToken() : '';
    const willRecommend = shouldRecommendAt(currentAnswers.length);
    if (willRecommend) setLoadingProducts(true);
    try {
      if (willRecommend) {
        const rec = await recommend({ objet: searchObjet, answers: currentAnswers, lang, profile, gift: giftStr, surprise, friendId, token, conversationId: convoId });
        if (rec?.reply) setMessages((m) => [...m, { role: 'bot', text: rec.reply }]);
        loadProducts(rec?.products);
      }
      // Always queue the next refinement question.
      const q = await askQuestion({ objet: searchObjet, answers: currentAnswers, lang, profile, gift: giftStr, surprise, friendId, token, conversationId: convoId });
      if (q?.reply) setMessages((m) => [...m, { role: 'bot', text: q.reply }]);
      setCurrentQuestion(q?.question?.choices ? q.question : null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setMessages((m) => [...m, { role: 'bot', text: tr('chat.error', { msg: e.message }) }]);
      setRetryAction(() => () => advance(currentAnswers, searchObjet));
    } finally {
      setIsTyping(false);
      setLoadingProducts(false);
    }
  };

  // Auto-start: ask the first question (budget) when a fresh advisor session
  // begins. Keyed on convoId so it fires for every new session, even when the
  // category is unchanged; skipped when restoring a saved conversation.
  useEffect(() => {
    if (!category || !convoId) return;
    if (messages.length > 0 || answers.length > 0) return; // restored from history
    advance([], objet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convoId, category]);

  useEffect(() => {
    if (!convoId || !category || messages.length === 0) return;
    saveConversation(user?.sub, {
      id: convoId,
      title: gift ? giftTitle(gift, lang) : deriveTitle({ initialQuery, messages }),
      category,
      initialQuery,
      objet,
      answers,
      messages,
      recommendedProducts,
      done,
      turnCount,
      currentQuestion,
      gift,
    });
  }, [convoId, category, objet, answers, messages, recommendedProducts, initialQuery, done, turnCount, currentQuestion, gift, lang, user?.sub]);

  const recordAnswer = (label, choice = {}) => {
    const next = [...answers, {
      id: choice.id || 'free',
      q: currentQuestion?.text || '',
      a: label,
      tags: choice.tags || [],
      min: choice.min ?? null,
      max: choice.max ?? null,
      // Client-only (stripped before any API call in advance()): _q lets us
      // re-present this exact question when the user edits the answer; _msgIndex
      // is the index of the user bubble we add below, so an in-place edit can
      // target the right bubble. See startEditAnswer()/applyEditAnswer().
      _q: currentQuestion || null,
      _msgIndex: messages.length,
    }];
    setMessages((m) => [...m, { role: 'user', text: label }]);
    setAnswers(next);
    setTurnCount((c) => c + 1);
    advance(next);
  };

  // Re-run only the recommendation step from a (possibly edited) criteria set,
  // without asking a new question or changing the answer count. Used after an
  // in-place answer edit so the picks reflect the change but the rest of the
  // conversation (later answers, the pending question) is preserved.
  const refreshRecommendations = async (currentAnswers, exclude = []) => {
    setIsTyping(true);
    setLoadingProducts(true);
    setRetryAction(null);
    const answersForApi = currentAnswers.map(({ id, q, a, tags, min, max }) => ({ id, q, a, tags, min, max }));
    const profile = profileToPrompt(getProfile(user?.sub), lang);
    const giftStr = gift ? giftToPrompt(gift, lang) : '';
    const surprise = !!gift?.surprise;
    const friendId = gift?.friendId || '';
    const token = friendId ? getAccessToken() : '';
    try {
      const rec = await recommend({ objet, answers: answersForApi, lang, profile, gift: giftStr, surprise, friendId, token, conversationId: convoId, exclude });
      if (rec?.reply) setMessages((m) => [...m, { role: 'bot', text: rec.reply }]);
      loadProducts(rec?.products);
    } catch (e) {
      setMessages((m) => [...m, { role: 'bot', text: tr('chat.error', { msg: e.message }) }]);
      setRetryAction(() => () => refreshRecommendations(currentAnswers, exclude));
    } finally {
      setIsTyping(false);
      setLoadingProducts(false);
    }
  };

  // "Show me other products": keep the same criteria but ask the AI for a fresh
  // set, excluding the ones already on screen (backend honours `exclude`).
  const showOtherProducts = () => {
    const exclude = recommendedProducts
      .map((p) => `${p.brand || ''} ${p.model || ''}`.trim())
      .filter(Boolean);
    refreshRecommendations(answers, exclude);
  };

  // Let an impatient user get picks before the usual 5-answer milestone, using
  // whatever criteria are gathered so far. The advisor loop then continues.
  const recommendNow = () => refreshRecommendations(answers);

  // Tap-to-edit a previous answer — IN PLACE. We start editing (re-present the
  // question inline under its bubble), and on a new pick we replace just that
  // answer, keep every later answer and the pending question, then refresh the
  // recommendations from the updated criteria. No rewind, nothing is dropped.
  const startEditAnswer = (msgIndex) => {
    const idx = answers.findIndex((a) => a._msgIndex === msgIndex);
    if (idx < 0 || !answers[idx]._q) return; // legacy answers without _q aren't editable
    setEditIndex(idx);
  };
  const cancelEditAnswer = () => setEditIndex(null);
  const applyEditAnswer = (idx, label, choice = {}) => {
    if (idx == null || !answers[idx]) return;
    const updated = answers.map((a, i) =>
      i === idx
        ? { ...a, id: choice.id || 'free', a: label, tags: choice.tags || [], min: choice.min ?? null, max: choice.max ?? null }
        : a,
    );
    const msgIdx = answers[idx]._msgIndex;
    if (msgIdx != null) {
      setMessages((m) => m.map((msg, i) => (i === msgIdx ? { ...msg, text: label } : msg)));
    }
    setAnswers(updated);
    setEditIndex(null);
    // Only refresh if picks are already on screen; otherwise the next normal
    // advance() will pick the change up with no extra round-trip.
    if (recommendedProducts.length > 0) refreshRecommendations(updated);
  };

  const handleAnswer = (_qId, choice) => recordAnswer(choice.label, choice);
  const handleFreeText = (txt) => recordAnswer(txt);

  const handleHome = () => {
    setCategory(null);
    setInitialQuery('');
    setObjet('');
    setAnswers([]);
    setMessages([]);
    setCurrentQuestion(null);
    setIsTyping(false);
    setSelected(null);
    setDone(false);
    setTurnCount(0);
    setRecommendedProducts([]);
    setConvoId(null);
    setGift(null);
  };

  const handleRestart = () => {
    if (!category) return;
    // Reset to an empty session; the auto-start effect (keyed on convoId) will
    // re-ask the first question.
    setAnswers([]);
    setMessages([]);
    setCurrentQuestion(null);
    setIsTyping(false);
    setSelected(null);
    setDone(false);
    setTurnCount(0);
    setRecommendedProducts([]);
    setRefreshKey((k) => k + 1);
    setConvoId(newConversationId());
  };

  const loadConversation = (convo) => {
    if (!convo) return;
    setConvoId(convo.id);
    setGift(convo.gift || null);
    setInitialQuery(convo.initialQuery || '');
    setObjet(convo.objet || convo.initialQuery || '');
    setAnswers(Array.isArray(convo.answers) ? convo.answers : []);
    setMessages(Array.isArray(convo.messages) ? convo.messages : []);
    setRecommendedProducts(
      Array.isArray(convo.recommendedProducts) ? convo.recommendedProducts : [],
    );
    setDone(Boolean(convo.done));
    setCurrentQuestion(
      convo.currentQuestion && Array.isArray(convo.currentQuestion.choices)
        ? convo.currentQuestion
        : null,
    );
    setIsTyping(false);
    setTurnCount(convo.turnCount || convo.messages?.length || 0);
    setSelected(null);
    setRefreshKey((k) => k + 1);
    setCategory(convo.category);
  };

  // ─── Browser back-button integration ──────────────────────────────────
  // The app is state-driven (no router). We push a history entry on each
  // forward navigation so the browser Back button steps back through in-app
  // views and overlays instead of leaving the site. UI close buttons call
  // window.history.back(), so both paths converge on the popstate handler.
  // `url` (optional) gives the SEO/shareable views (guides, legal) a real URL;
  // every other view passes nothing and stays URL-less (same path, back-stack only).
  const pushHistory = (url) => {
    try { window.history.pushState({ oraklia: true }, '', url); } catch { /* noop */ }
  };

  const navOpenGuide = (slug) => { pushHistory('/guide/' + slug); setActiveGuide(slug); };
  const navOpenLegal = () => { pushHistory('/mentions-legales'); setLegalOpen(true); };
  const navOpenHistory = () => { pushHistory(); setHistoryOpen(true); };
  const navOpenSelections = () => { pushHistory(); setSelectionsOpen(true); };
  const navOpenProfile = () => { pushHistory(); setProfileOpen(true); };
  const navOpenFriends = () => { pushHistory(); setFriendsOpen(true); };
  const navOpenNotifications = () => { pushHistory(); setNotifOpen(true); };
  const navOpenAsk = () => { pushHistory(); setAskOpen(true); };
  const navOpenGift = () => { setGiftPrefill(null); pushHistory(); setGiftOpen(true); };
  const navOpenGuides = () => { pushHistory(); setGuidesOpen(true); };
  const navOpenTrending = () => { pushHistory(); setTrendingOpen(true); };
  // From a reminder: friend birthday → start directly; holiday/occasion → open
  // the gift form prefilled with the occasion so the user can link a recipient.
  const giftFromReminder = (payload) => {
    setNotifOpen(false);
    if (payload?.friendId) {
      startGift(payload);
    } else {
      setGiftPrefill({ occasion: payload?.occasion || '' });
      pushHistory();
      setGiftOpen(true);
    }
  };
  const navOpenProduct = (p) => { pushHistory(); setSelected(p); };
  // Start a gift advisor session from the recipient form. Reuses the normal
  // advisor pipeline with a pseudo-category ('gift') and the recipient payload;
  // the auto-start effect (keyed on convoId) fires the first recommend + ask.
  const startGift = (giftData) => {
    setGiftOpen(false);
    setGift(giftData);
    setConvoId(newConversationId());
    setObjet('');
    setInitialQuery('');
    setAnswers([]);
    setMessages([]);
    setRecommendedProducts([]);
    setDone(false);
    setTurnCount(0);
    setCurrentQuestion(null);
    setCategory('gift');
  };
  const navPickCategory = (cat, q) => {
    pushHistory();
    setConvoId(newConversationId());
    setObjet(q || CATEGORIES.find((c) => c.id === cat)?.label || cat);
    setAnswers([]);
    setMessages([]);
    setRecommendedProducts([]);
    setDone(false);
    setTurnCount(0);
    setCurrentQuestion(null);
    setCategory(cat);
    setInitialQuery(q || '');
  };
  const navBack = () => {
    try { window.history.back(); } catch { /* noop */ }
  };

  useEffect(() => {
    const onPop = () => {
      // Close the topmost open layer; at home, let the browser navigate away.
      if (selected) { setSelected(null); return; }
      if (legalOpen) { setLegalOpen(false); return; }
      if (giftOpen) { setGiftOpen(false); return; }
      if (notifOpen) { setNotifOpen(false); return; }
      if (askOpen) { setAskOpen(false); return; }
      if (friendsOpen) { setFriendsOpen(false); return; }
      if (profileOpen) { setProfileOpen(false); return; }
      if (selectionsOpen) { setSelectionsOpen(false); return; }
      if (historyOpen) { setHistoryOpen(false); return; }
      if (guidesOpen) { setGuidesOpen(false); return; }
      if (trendingOpen) { setTrendingOpen(false); return; }
      if (activeGuide) { setActiveGuide(null); return; }
      if (category) { handleHome(); return; }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, legalOpen, giftOpen, notifOpen, askOpen, friendsOpen, profileOpen, selectionsOpen, guidesOpen, trendingOpen, historyOpen, activeGuide, category]);

  // Keep the tab title in sync with the open guide (matches the prerendered
  // per-guide <title>); reset to the brand title elsewhere.
  useEffect(() => {
    const base = 'Oraklia — Conseiller d\'achat IA';
    const g = activeGuide ? getGuide(activeGuide) : null;
    document.title = g
      ? `${localizeGuide(g, lang).title} — Oraklia`
      : legalOpen ? 'Mentions légales — Oraklia' : base;
    return () => { document.title = base; };
  }, [activeGuide, legalOpen, lang]);

  const getAmazonUrl = (p) => {
    if (p.amazon_url) return p.amazon_url;
    const q = encodeURIComponent(`${p.brand} ${p.model}`);
    return `https://www.amazon.fr/s?k=${q}&tag=oraklia123-21`;
  };

  const handleBuy = (product) => {
    // Record the outbound click as a popularity signal for "Trends in my circle".
    if (product) logLinkClick(product).catch(() => {});
    navBack();
  };

  // Build a self-contained ?share=… link for the current gift ideas and copy it
  // (or use the native share sheet when available).
  const shareGift = async () => {
    const items = recommendedProducts.slice(0, 3).map((p) => ({
      b: p.brand,
      m: p.model,
      p: p.price ?? null,
      u: getAmazonUrl(p),
      i: p.image_url || null,
      s: p.score ?? null,
    }));
    if (!items.length) return;
    const payload = { r: gift?.relationship || '', o: gift?.occasion || '', items };
    const url = await buildShareUrl(payload);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Oraklia', url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        toast(tr('toast.linkCopied'));
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      /* user cancelled / clipboard blocked */
    }
  };

  const closeSharedList = () => {
    try {
      window.history.replaceState({}, '', window.location.pathname);
    } catch { /* noop */ }
    setSharedList(null);
    setShareLoading(false);
  };

  const startAdvisorFromGuide = (cat) => {
    setActiveGuide(null);
    setConvoId(newConversationId());
    setObjet(CATEGORIES.find((c) => c.id === cat)?.label || cat);
    setAnswers([]);
    setMessages([]);
    setRecommendedProducts([]);
    setDone(false);
    setTurnCount(0);
    setCurrentQuestion(null);
    setInitialQuery('');
    setCategory(cat);
  };

  // Shared list view (opened from a ?s= / ?share= link) — takes precedence.
  if (shareLoading) {
    return <div className="share-page"><p className="share-empty">…</p></div>;
  }
  if (sharedList) {
    return (
      <Suspense fallback={null}>
        <SharedGiftList data={sharedList} onCreate={closeSharedList} />
      </Suspense>
    );
  }

  // Guide article view (accessible before choosing a category)
  if (activeGuide) {
    const guide = localizeGuide(GUIDES.find((g) => g.slug === activeGuide), lang);
    return (
      <Suspense fallback={null}>
        <GuideArticle
          guide={guide}
          onBack={navBack}
          onStartAdvisor={startAdvisorFromGuide}
        />
        {legalOpen && <LegalNotices open onClose={navBack} />}
      </Suspense>
    );
  }

  if (!category) {
    return (
      <>
        <CategoryPicker
          onPick={navPickCategory}
          onOpenHistory={navOpenHistory}
          onOpenSelections={navOpenSelections}
          onOpenProfile={navOpenProfile}
          onOpenFriends={navOpenFriends}
          onOpenAsk={navOpenAsk}
          onOpenNotifications={navOpenNotifications}
          notifPing={notifOpen}
          onOpenGift={navOpenGift}
          onOpenLegal={navOpenLegal}
          onOpenGuide={navOpenGuide}
          onOpenGuides={navOpenGuides}
          onOpenTrending={navOpenTrending}
          onLoadConvo={loadConversation}
          onOpenProduct={navOpenProduct}
        />
        {selected && (
          <ProductDetail product={selected} onClose={navBack} onBuy={handleBuy} />
        )}
        <Suspense fallback={null}>
          {historyOpen && (
            <HistoryPanel open onClose={navBack} onLoad={loadConversation} currentId={convoId} />
          )}
          {selectionsOpen && (
            <SelectionsPanel open onClose={navBack} getAmazonUrl={getAmazonUrl} onBuy={handleBuy} />
          )}
          {profileOpen && <ProfilePanel open onClose={navBack} />}
          {friendsOpen && <FriendsPanel open onClose={navBack} />}
          {notifOpen && <NotificationsPanel open onClose={navBack} onGift={giftFromReminder} />}
          {askOpen && <AskOpinionPanel open onClose={navBack} getAmazonUrl={getAmazonUrl} />}
          {giftOpen && <GiftPanel open onClose={navBack} onSubmit={startGift} initial={giftPrefill} />}
          {guidesOpen && <GuidesPanel open onClose={navBack} onOpenGuide={navOpenGuide} />}
          {trendingOpen && <TrendingPanel onClose={navBack} onOpen={navOpenProduct} />}
          {legalOpen && <LegalNotices open onClose={navBack} />}
        </Suspense>
      </>
    );
  }

  const top = recommendedProducts[0];
  const rest = recommendedProducts.slice(1, 3);
  const editAnswerObj = editIndex != null ? answers[editIndex] : null;
  const editMsgIndex = editAnswerObj ? editAnswerObj._msgIndex : null;
  const editQuestion = editAnswerObj ? editAnswerObj._q : null;

  return (
    <div className={'app' + (narrow ? ' app-narrow' : '')}>
      <ChatPanel
        messages={messages}
        currentQuestion={currentQuestion}
        onAnswer={handleAnswer}
        onFreeText={handleFreeText}
        onRestart={handleRestart}
        onHome={navBack}
        onOpenHistory={navOpenHistory}
        onStartEdit={startEditAnswer}
        onCancelEdit={cancelEditAnswer}
        onApplyEdit={(qId, choice) => applyEditAnswer(editIndex, choice.label, choice)}
        editMsgIndex={editMsgIndex}
        editQuestion={editQuestion}
        onRetry={retryAction}
        onShowOthers={recommendedProducts.length > 0 ? showOtherProducts : null}
        onRecommendNow={recommendedProducts.length === 0 && !isTyping && answers.length >= 1 && category !== 'gift' ? recommendNow : null}
        guide={resultsGuide}
        onOpenGuide={navOpenGuide}
        budget={budgetBounds}
        isTyping={isTyping}
        layout={t.chatLayout}
        progressInfo={progressInfo}
        products={recommendedProducts}
        onSelectProduct={navOpenProduct}
        inlineProducts={narrow}
        loadingProducts={loadingProducts}
        headerExtras={narrow ? (
          <>
            {category === 'gift' && recommendedProducts.length > 0 && (
              <button type="button" className="chat-restart" onClick={shareGift} title={tr('gift.share')} aria-label={tr('gift.share')}>
                <span aria-hidden="true">🔗</span>
              </button>
            )}
            <FriendRequestsBell onOpen={navOpenNotifications} pingKey={notifOpen} />
            <LangToggle />
            <AuthMenu variant="results" onOpenSelections={navOpenSelections} onOpenProfile={navOpenProfile} onOpenFriends={navOpenFriends} onOpenHistory={navOpenHistory} onOpenAsk={navOpenAsk} onOpenNotifications={navOpenNotifications} onOpenTrending={navOpenTrending} />
          </>
        ) : null}
      />

      {!narrow && (
      <main className="results-panel">
        <header className="results-header">
          <div>
            <div className="results-eyebrow">{tr('results.eyebrow')}</div>
            <h2 className="results-title">
              {category === 'gift' || CATEGORIES.find((c) => c.id === category) ? tr('cat.' + category) : category}
            </h2>
          </div>
          <div className="results-header-right">
            <div className="results-meta">
              {done && !currentQuestion && !isTyping ? tr('results.finalized') : tr('results.refining')}
            </div>
            {category === 'gift' && recommendedProducts.length > 0 && (
              <button type="button" className="auth-trigger auth-trigger-results share-btn" onClick={shareGift}>
                <span aria-hidden="true">🔗</span>
                {shareCopied ? tr('gift.shareCopied') : tr('gift.share')}
              </button>
            )}
            <FriendRequestsBell onOpen={navOpenNotifications} pingKey={notifOpen} />
            <LangToggle />
            <AuthMenu variant="results" onOpenSelections={navOpenSelections} onOpenProfile={navOpenProfile} onOpenFriends={navOpenFriends} onOpenHistory={navOpenHistory} onOpenAsk={navOpenAsk} onOpenNotifications={navOpenNotifications} onOpenTrending={navOpenTrending} />
          </div>
        </header>

        <div
          className="results-content"
          key={recommendedProducts.length > 0 ? refreshKey : loadingProducts ? 'loading' : 'placeholder'}
        >
          {recommendedProducts.length > 0 ? (
            <>
              {top && (
                <div className={'hero-wrap variant-' + t.heroVariant}>
                  <HeroCard product={top} density={t.density} budget={budgetBounds} onSelect={navOpenProduct} />
                </div>
              )}
              <div className={'small-grid density-' + t.density}>
                {rest.map((p, i) => (
                  <SmallCard key={p.id} product={p} rank={i + 2} density={t.density} budget={budgetBounds} onSelect={navOpenProduct} />
                ))}
              </div>
              <div className="results-actions">
                {!isTyping && (
                  <button type="button" className="show-others-btn" onClick={showOtherProducts}>
                    <span aria-hidden="true">↻</span> {tr('results.showOthers')}
                  </button>
                )}
                {resultsGuide && (
                  <button type="button" className="results-guide-link" onClick={() => navOpenGuide(resultsGuide.slug)}>
                    {tr('results.guideCta', { title: resultsGuide.title })}
                  </button>
                )}
              </div>
            </>
          ) : loadingProducts ? (
            <>
              <div className={'hero-wrap variant-' + t.heroVariant}>
                <ProductSkeleton variant="hero" />
              </div>
              <div className={'small-grid density-' + t.density}>
                <ProductSkeleton variant="small" />
                <ProductSkeleton variant="small" />
              </div>
            </>
          ) : (
            <ResultsPlaceholder category={category} />
          )}
        </div>

        <footer className="results-footer">
          <span className="results-footer-affiliate">{tr('footer.affiliate')}</span>
          <span className="results-footer-meta">
            {tr('footer.copyrightShort', { year: new Date().getFullYear() })} ·{' '}
            <button type="button" className="home-footer-link" onClick={navOpenLegal}>
              {tr('footer.legal')}
            </button>
          </span>
        </footer>
      </main>
      )}

      {selected && (
        <ProductDetail
          product={selected}
          onClose={navBack}
          onBuy={handleBuy}
        />
      )}

      <Suspense fallback={null}>
        {historyOpen && (
          <HistoryPanel open onClose={navBack} onLoad={loadConversation} currentId={convoId} />
        )}
        {selectionsOpen && (
          <SelectionsPanel open onClose={navBack} getAmazonUrl={getAmazonUrl} onBuy={handleBuy} />
        )}
        {profileOpen && <ProfilePanel open onClose={navBack} />}
        {giftOpen && <GiftPanel open onClose={navBack} onSubmit={startGift} initial={giftPrefill} />}
        {friendsOpen && <FriendsPanel open onClose={navBack} />}
        {notifOpen && <NotificationsPanel open onClose={navBack} onGift={giftFromReminder} />}
        {askOpen && <AskOpinionPanel open onClose={navBack} getAmazonUrl={getAmazonUrl} />}
        {trendingOpen && <TrendingPanel onClose={navBack} onOpen={navOpenProduct} />}
        {legalOpen && <LegalNotices open onClose={navBack} />}
      </Suspense>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Layout du chat" />
        <TweakRadio
          label="Format"
          value={t.chatLayout}
          options={[{ value: 'bubbles', label: 'Bulles' }, { value: 'list', label: 'Liste' }]}
          onChange={(v) => setTweak('chatLayout', v)}
        />
        <TweakSection label="Mise en avant n°1" />
        <TweakRadio
          label="Variante"
          value={t.heroVariant}
          options={[
            { value: 'wide', label: 'Large' },
            { value: 'split', label: 'Split' },
            { value: 'podium', label: 'Podium' },
          ]}
          onChange={(v) => setTweak('heroVariant', v)}
        />
        <TweakSection label="Densité" />
        <TweakRadio
          label="Cartes"
          value={t.density}
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'regular', label: 'Régulier' },
            { value: 'comfy', label: 'Aéré' },
          ]}
          onChange={(v) => setTweak('density', v)}
        />
      </TweaksPanel>
    </div>
  );
}
