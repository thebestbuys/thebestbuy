import { useEffect, useRef, useState } from 'react';
import { CATEGORIES } from './data.js';
import { askQuestion, recommend, enrichProduct } from './lib/askAI.js';
import AuthMenu from './components/AuthMenu.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';
import SelectionsPanel from './components/SelectionsPanel.jsx';
import ProfilePanel from './components/ProfilePanel.jsx';
import GiftPanel from './components/GiftPanel.jsx';
import SharedGiftList from './components/SharedGiftList.jsx';
import FriendsPanel from './components/FriendsPanel.jsx';
import FriendRequestsBell from './components/FriendRequestsBell.jsx';
import FavoriteButton from './components/FavoriteButton.jsx';
import LegalNotices from './components/LegalNotices.jsx';
import GuideArticle from './components/GuideArticle.jsx';
import LangToggle from './components/LangToggle.jsx';
import { GUIDES, localizeGuide } from './data/guides.js';
import { HeroCard, PriceTag, ProductImage, ScoreRing, SmallCard, VerifiedRating } from './components/ProductCard.jsx';
import { useAuth } from './lib/auth.jsx';
import { useI18n } from './lib/i18n.jsx';
import { getProfile, profileToPrompt } from './lib/profile.js';
import { giftToPrompt, giftTitle, encodeGiftShare, decodeGiftShare } from './lib/gift.js';
import { getAccessToken } from './lib/cloud.js';
import {
  deriveTitle,
  newConversationId,
  saveConversation,
} from './lib/history.js';
import {
  TweakRadio,
  TweakSection,
  TweaksPanel,
  useTweaks,
} from './components/TweaksPanel.jsx';

const CATEGORY_KEYWORDS = {
  phone: ['téléphone', 'telephone', 'smartphone', 'phone', 'iphone', 'mobile', 'portable android', 'samsung galaxy', 'pixel'],
  laptop: ['ordinateur', 'laptop', 'pc portable', 'macbook', 'pc', 'notebook', 'ultrabook'],
  headphones: ['casque', 'écouteur', 'ecouteur', 'airpods', 'audio', 'headphone', 'earbuds', 'intra', 'bluetooth audio'],
};

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

function CategoryPicker({ onPick, onOpenHistory, onOpenSelections, onOpenProfile, onOpenFriends, friendsOpen, onOpenGift, onOpenLegal, onOpenGuide }) {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const firstName = user?.given_name || user?.name?.split(/\s+/)[0] || '';
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const cat = detectCategory(query) || query.trim();
    onPick(cat, query.trim());
  };

  const suggestions = [
    { key: 'suggestion.phone', icon: 'phone' },
    { key: 'suggestion.laptop', icon: 'laptop' },
    { key: 'suggestion.tv', icon: 'tv' },
    { key: 'suggestion.earbuds', icon: 'earbuds' },
    { key: 'suggestion.watch', icon: 'watch' },
    { key: 'suggestion.vacuum', icon: 'vacuum' },
    { key: 'suggestion.coffee', icon: 'coffee' },
    { key: 'suggestion.speaker', icon: 'speaker' },
  ];

  const SuggestionIcon = ({ icon }) => {
    const p = { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none', 'aria-hidden': true };
    const sw = { stroke: 'currentColor', strokeWidth: 1.2, strokeLinecap: 'round', strokeLinejoin: 'round' };
    switch (icon) {
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
        <button
          type="button"
          className="auth-trigger auth-trigger-home"
          onClick={onOpenHistory}
          aria-label={t('home.history')}
          title={t('home.historyTitle')}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 4.5V8l2.4 1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          {t('home.history')}
        </button>
        <button
          type="button"
          className="auth-trigger auth-trigger-home"
          onClick={onOpenSelections}
          aria-label={t('home.selectionsTitle')}
          title={t('home.selectionsTitle')}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M8 14S2 10.3 2 6.1A2.9 2.9 0 0 1 8 4.6 2.9 2.9 0 0 1 14 6.1C14 10.3 8 14 8 14Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          {t('home.selections')}
        </button>
        <button
          type="button"
          className="auth-trigger auth-trigger-home gift-trigger"
          onClick={onOpenGift}
          aria-label={t('home.gift')}
          title={t('home.gift')}
        >
          <span aria-hidden="true">🎁</span>
          {t('home.gift')}
        </button>
        <FriendRequestsBell onOpen={onOpenFriends} pingKey={friendsOpen} />
        <LangToggle />
        <AuthMenu variant="home" onOpenSelections={onOpenSelections} onOpenProfile={onOpenProfile} onOpenFriends={onOpenFriends} onOpenHistory={onOpenHistory} />
      </div>
      <main className="home-main">
        <h1 className="home-logo">Oraklia</h1>
        <p className="home-greeting">
          {firstName ? t('m.greetingLead', { name: firstName }) : t('m.greetingLeadAnon')}{' '}
          <span className="home-greeting-hl">{t('m.greetingHighlight')}</span>
        </p>
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

        <div className="home-suggestions">
          {suggestions.map((s) => {
            const label = t(s.key);
            return (
              <button key={s.key} type="button" className="suggestion-chip"
                onClick={() => onPick(detectCategory(label) || label, label)}>
                <span className="suggestion-chip-icon"><SuggestionIcon icon={s.icon} /></span>
                {label}
              </button>
            );
          })}
        </div>

        <section className="home-guides">
          <div className="home-guides-head">
            <h2 className="home-guides-title">{t('guides.sectionTitle')}</h2>
            <p className="home-guides-sub">{t('guides.sectionSub')}</p>
          </div>
          <div className="home-guides-grid">
            {GUIDES.map((g) => {
              const lg = localizeGuide(g, lang);
              return (
                <button
                  key={g.slug}
                  type="button"
                  className="guide-card"
                  onClick={() => onOpenGuide(g.slug)}
                >
                  <div className="guide-card-eyebrow">{t('guides.cardEyebrow', { time: lg.readTime })}</div>
                  <h3 className="guide-card-title">{lg.title}</h3>
                  <p className="guide-card-sub">{lg.subtitle}</p>
                  <span className="guide-card-link">{t('guides.read')}</span>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <p className="home-footer-affiliate">{t('footer.affiliate')}</p>
        <div className="home-footer-inner">
          <div className="home-footer-left">
            {t('footer.rights', { year: new Date().getFullYear() })}
          </div>
          <div className="home-footer-right">
            <button type="button" className="home-footer-link" onClick={onOpenLegal}>
              {t('footer.legal')}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductDetail({ product, onClose, onBuy }) {
  const { t, lang } = useI18n();
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  const amazonUrl = product.amazon_url ||
    `https://www.amazon.fr/s?k=${encodeURIComponent(`${product.brand} ${product.model}`)}&tag=oraklia123-21`;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t('auth.close')}>✕</button>
        <div className="modal-grid">
          <div className="modal-left">
            <ProductImage product={product} size="modal" />
          </div>
          <div className="modal-right">
            <div className="modal-brand">{product.brand}</div>
            <h2 className="modal-title">{product.model}</h2>
            {product.amazon_verified && product.rating != null && (
              <div className="modal-rating">
                <VerifiedRating product={product} locale={locale} />
              </div>
            )}
            <div className="modal-score-row">
              <ScoreRing score={product.score} size={56} />
              <div>
                <div className="modal-score-title">{t('product.matchPct', { score: product.score })}</div>
                <div className="modal-score-sub">{t('product.matchSub')}</div>
              </div>
            </div>
            {product.why && (
              <>
                <div className="modal-section-title">{t('product.why')}</div>
                <p className="modal-why">{product.why}</p>
              </>
            )}
            <div className="modal-section-title">{t('product.features')}</div>
            <ul className="modal-specs">
              {product.specs.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
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
  const [giftOpen, setGiftOpen] = useState(false);
  const [gift, setGift] = useState(null);   // recipient payload when in gift mode
  const [shareCopied, setShareCopied] = useState(false);
  // Read-only shared gift list opened from a ?share=… link (decoded once).
  const [sharedList, setSharedList] = useState(() => {
    try {
      const s = new URLSearchParams(window.location.search).get('share');
      return s ? decodeGiftShare(s) : null;
    } catch {
      return null;
    }
  });
  const [legalOpen, setLegalOpen] = useState(false);
  const [activeGuide, setActiveGuide] = useState(null);
  const [objet, setObjet] = useState('');      // human search term sent to the AI
  const [answers, setAnswers] = useState([]);  // compact criteria JSON [{id,q,a,tags,min,max}]

  const progress = done ? 100 : Math.min(90, turnCount * 22);

  // Self mode: recommend after the first 5 answers, then every 3 more (8, 11, …).
  // Gift mode: recommend immediately (the recipient form already has budget +
  // occasion), then every 3 refinement answers (0, 3, 6, …).
  const shouldRecommendAt = (n) => (gift ? n % 3 === 0 : n >= 5 && (n - 5) % 3 === 0);

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
    const profile = profileToPrompt(getProfile(user?.sub), lang);
    const giftStr = gift ? giftToPrompt(gift, lang) : '';
    const surprise = !!gift?.surprise;
    const friendId = gift?.friendId || '';
    const token = friendId ? getAccessToken() : '';
    try {
      if (shouldRecommendAt(currentAnswers.length)) {
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
    } finally {
      setIsTyping(false);
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
    }];
    setMessages((m) => [...m, { role: 'user', text: label }]);
    setAnswers(next);
    setTurnCount((c) => c + 1);
    advance(next);
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
  const pushHistory = () => {
    try { window.history.pushState({ oraklia: true }, ''); } catch { /* noop */ }
  };

  const navOpenGuide = (slug) => { pushHistory(); setActiveGuide(slug); };
  const navOpenLegal = () => { pushHistory(); setLegalOpen(true); };
  const navOpenHistory = () => { pushHistory(); setHistoryOpen(true); };
  const navOpenSelections = () => { pushHistory(); setSelectionsOpen(true); };
  const navOpenProfile = () => { pushHistory(); setProfileOpen(true); };
  const navOpenFriends = () => { pushHistory(); setFriendsOpen(true); };
  const navOpenGift = () => { pushHistory(); setGiftOpen(true); };
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
      if (friendsOpen) { setFriendsOpen(false); return; }
      if (profileOpen) { setProfileOpen(false); return; }
      if (selectionsOpen) { setSelectionsOpen(false); return; }
      if (historyOpen) { setHistoryOpen(false); return; }
      if (activeGuide) { setActiveGuide(null); return; }
      if (category) { handleHome(); return; }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, legalOpen, giftOpen, friendsOpen, profileOpen, selectionsOpen, historyOpen, activeGuide, category]);

  const getAmazonUrl = (p) => {
    if (p.amazon_url) return p.amazon_url;
    const q = encodeURIComponent(`${p.brand} ${p.model}`);
    return `https://www.amazon.fr/s?k=${q}&tag=oraklia123-21`;
  };

  const handleBuy = () => {
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
    const url = `${window.location.origin}${window.location.pathname}?share=${encodeGiftShare(payload)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Oraklia', url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
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

  // Shared gift list view (opened from a ?share=… link) — takes precedence.
  if (sharedList) {
    return <SharedGiftList data={sharedList} onCreate={closeSharedList} />;
  }

  // Guide article view (accessible before choosing a category)
  if (activeGuide) {
    const guide = localizeGuide(GUIDES.find((g) => g.slug === activeGuide), lang);
    return (
      <>
        <GuideArticle
          guide={guide}
          onBack={navBack}
          onStartAdvisor={startAdvisorFromGuide}
        />
        <LegalNotices open={legalOpen} onClose={navBack} />
      </>
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
          friendsOpen={friendsOpen}
          onOpenGift={navOpenGift}
          onOpenLegal={navOpenLegal}
          onOpenGuide={navOpenGuide}
        />
        <HistoryPanel
          open={historyOpen}
          onClose={navBack}
          onLoad={loadConversation}
          currentId={convoId}
        />
        <SelectionsPanel
          open={selectionsOpen}
          onClose={navBack}
          getAmazonUrl={getAmazonUrl}
          onBuy={handleBuy}
        />
        <ProfilePanel open={profileOpen} onClose={navBack} />
        <FriendsPanel open={friendsOpen} onClose={navBack} />
        <GiftPanel open={giftOpen} onClose={navBack} onSubmit={startGift} />
        <LegalNotices open={legalOpen} onClose={navBack} />
      </>
    );
  }

  const top = recommendedProducts[0];
  const rest = recommendedProducts.slice(1, 3);

  return (
    <div className="app">
      <ChatPanel
        messages={messages}
        currentQuestion={currentQuestion}
        onAnswer={handleAnswer}
        onFreeText={handleFreeText}
        onRestart={handleRestart}
        onHome={navBack}
        onOpenHistory={navOpenHistory}
        isTyping={isTyping}
        layout={t.chatLayout}
        progress={progress}
      />

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
            <FriendRequestsBell onOpen={navOpenFriends} pingKey={friendsOpen} />
            <LangToggle />
            <AuthMenu variant="results" onOpenSelections={navOpenSelections} onOpenProfile={navOpenProfile} onOpenFriends={navOpenFriends} onOpenHistory={navOpenHistory} />
          </div>
        </header>

        <div
          className="results-content"
          key={recommendedProducts.length > 0 ? refreshKey : 'placeholder'}
        >
          {recommendedProducts.length > 0 ? (
            <>
              {top && (
                <div className={'hero-wrap variant-' + t.heroVariant}>
                  <HeroCard product={top} density={t.density} onSelect={navOpenProduct} />
                </div>
              )}
              <div className={'small-grid density-' + t.density}>
                {rest.map((p, i) => (
                  <SmallCard key={p.id} product={p} rank={i + 2} density={t.density} onSelect={navOpenProduct} />
                ))}
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

      {selected && (
        <ProductDetail
          product={selected}
          onClose={navBack}
          onBuy={handleBuy}
        />
      )}

      <HistoryPanel
        open={historyOpen}
        onClose={navBack}
        onLoad={loadConversation}
        currentId={convoId}
      />

      <SelectionsPanel
        open={selectionsOpen}
        onClose={navBack}
        getAmazonUrl={getAmazonUrl}
        onBuy={handleBuy}
      />

      <ProfilePanel open={profileOpen} onClose={navBack} />

      <GiftPanel open={giftOpen} onClose={navBack} onSubmit={startGift} />

      <FriendsPanel open={friendsOpen} onClose={navBack} />

      <LegalNotices open={legalOpen} onClose={navBack} />

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
