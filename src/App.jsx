import { useEffect, useRef, useState } from 'react';
import { CATEGORIES } from './data.js';
import { askAI } from './lib/askAI.js';
import ChatPanel from './components/ChatPanel.jsx';
import { HeroCard, ProductImage, ScoreRing, SmallCard, Stars } from './components/ProductCard.jsx';
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
  const patternId = `placeholder-pattern-${category}`;
  return (
    <div className="results-placeholder">
      <svg className="placeholder-wallpaper" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <defs>{bgPattern(category, patternId)}</defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <div className="placeholder-message">
        <div className="placeholder-icon">✦</div>
        <h3 className="placeholder-title">
          Vos suggestions<br />apparaîtront ici
        </h3>
        <p className="placeholder-sub">
          Répondez aux questions dans le chat pour que Bestbuys sélectionne les meilleurs produits pour vous.
        </p>
      </div>
    </div>
  );
}

function CategoryPicker({ onPick }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const cat = detectCategory(query) || 'phone';
    onPick(cat, query.trim());
  };

  const suggestions = [
    { label: 'Un téléphone pour la photo', cat: 'phone' },
    { label: 'Un ordinateur portable léger', cat: 'laptop' },
    { label: 'Un casque avec réduction de bruit', cat: 'headphones' },
    { label: 'Un PC pour le gaming', cat: 'laptop' },
  ];

  const SuggestionIcon = ({ cat }) => {
    if (cat === 'phone') return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <rect x="3.5" y="1.5" width="7" height="11" rx="1.6" stroke="currentColor" strokeWidth="1.2"/>
        <line x1="6" y1="10.5" x2="8" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    );
    if (cat === 'laptop') return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <rect x="2.5" y="2.5" width="9" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        <line x1="1" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    );
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M2 8 V7 a5 5 0 0 1 10 0 V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <rect x="1.5" y="8" width="2.5" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="10" y="8" width="2.5" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    );
  };

  return (
    <div className="home">
      <main className="home-main">
        <h1 className="home-logo">Bestbuys</h1>
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
            placeholder="Que cherchez-vous aujourd'hui ?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={!query.trim()} className="home-search-submit" aria-label="Rechercher">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8 L14 8 M9 3 L14 8 L9 13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>

        <div className="home-suggestions">
          {suggestions.map((s) => (
            <button key={s.label} type="button" className="suggestion-chip"
              onClick={() => onPick(s.cat, s.label)}>
              <span className="suggestion-chip-icon"><SuggestionIcon cat={s.cat} /></span>
              {s.label}
            </button>
          ))}
        </div>
      </main>

      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-left">
            <a href="#">À propos</a>
            <a href="#">Comment ça marche</a>
            <a href="#">Marchands partenaires</a>
          </div>
          <div className="home-footer-right">
            <a href="#">Aide</a>
            <a href="#">Confidentialité</a>
            <a href="#">Conditions</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductDetail({ product, onClose, onBuy }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>
        <div className="modal-grid">
          <div className="modal-left">
            <ProductImage product={product} size="modal" />
          </div>
          <div className="modal-right">
            <div className="modal-brand">{product.brand}</div>
            <h2 className="modal-title">{product.model}</h2>
            {product.rating != null && (
              <div className="modal-rating">
                <Stars rating={product.rating} />
                <span className="rating-num">{product.rating.toFixed(1)}</span>
                {product.reviews != null && (
                  <span className="rating-count">({product.reviews.toLocaleString('fr-FR')} avis)</span>
                )}
              </div>
            )}
            <div className="modal-score-row">
              <ScoreRing score={product.score} size={56} />
              <div>
                <div className="modal-score-title">{product.score}% de correspondance</div>
                <div className="modal-score-sub">avec vos critères</div>
              </div>
            </div>
            {product.why && (
              <>
                <div className="modal-section-title">Pourquoi ce produit ?</div>
                <p className="modal-why">{product.why}</p>
              </>
            )}
            <div className="modal-section-title">Caractéristiques principales</div>
            <ul className="modal-specs">
              {product.specs.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
            <div className="modal-bottom">
              <div>
                <div className="modal-price-label">Prix</div>
                <div className="modal-price">
                  <span>{product.price.toLocaleString('fr-FR')}</span>
                  <span className="price-currency">€</span>
                </div>
                <div className="modal-shipping">Livraison gratuite · 30 jours d'essai</div>
              </div>
              <button className="btn-primary big" onClick={() => onBuy(product)} disabled={!product.amazon_url}>
                Voir sur Amazon
                <span className="btn-arrow">→</span>
              </button>
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

  const progress = done ? 100 : Math.min(90, turnCount * 22);

  const runTurn = async (history) => {
    setIsTyping(true);
    setCurrentQuestion(null);
    try {
      const result = await askAI({ messages: history, category });
      const reply = result?.reply || '…';
      setMessages((m) => [...m, { role: 'bot', text: reply }]);
      if (result?.action === 'recommend') {
        setDone(true);
        setCurrentQuestion(null);
        if (Array.isArray(result.products) && result.products.length) {
          setRecommendedProducts(result.products.map((p) => ({ ...p, category })));
        }
      } else if (result?.question && Array.isArray(result.question.choices)) {
        setCurrentQuestion(result.question);
      } else {
        setCurrentQuestion(null);
      }
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setMessages((m) => [...m, {
        role: 'bot',
        text: `Désolé, le service de recommandation n'a pas répondu (${e.message}). Réessayez ou rafraîchissez la page.`,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (!category) return;
    const initial = initialQuery
      ? [{ role: 'user', text: initialQuery }]
      : [{ role: 'user', text: `Je cherche un ${CATEGORIES.find((c) => c.id === category).label.toLowerCase()}.` }];
    setMessages(initial);
    runTurn(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const sendUserMessage = (text) => {
    const next = [...messages, { role: 'user', text }];
    setMessages(next);
    setTurnCount((c) => c + 1);
    runTurn(next);
  };

  const handleAnswer = (_qId, choice) => sendUserMessage(choice.label);
  const handleFreeText = (txt) => sendUserMessage(txt);

  const handleRestart = () => {
    setCategory(null);
    setInitialQuery('');
    setMessages([]);
    setCurrentQuestion(null);
    setIsTyping(false);
    setSelected(null);
    setDone(false);
    setTurnCount(0);
    setRecommendedProducts([]);
  };

  const handleBuy = (p) => {
    setSelected(null);
    if (p.amazon_url) {
      window.open(p.amazon_url, '_blank', 'noopener,noreferrer');
    }
    setMessages((m) => [...m, { role: 'bot', text: `Je vous redirige vers le ${p.model} sur Amazon ✓` }]);
  };

  if (!category) {
    return <CategoryPicker onPick={(cat, q) => { setCategory(cat); setInitialQuery(q || ''); }} />;
  }

  const top = recommendedProducts[0];
  const rest = recommendedProducts.slice(1, 5);

  return (
    <div className="app">
      <ChatPanel
        messages={messages}
        currentQuestion={currentQuestion}
        onAnswer={handleAnswer}
        onFreeText={handleFreeText}
        onRestart={handleRestart}
        isTyping={isTyping}
        layout={t.chatLayout}
        progress={progress}
      />

      <main className="results-panel">
        <header className="results-header">
          <div>
            <div className="results-eyebrow">Top 5 sélection</div>
            <h2 className="results-title">
              {CATEGORIES.find((c) => c.id === category).label}s
            </h2>
          </div>
          <div className="results-meta">
            {done ? 'Sélection finalisée' : 'Affinage en cours…'}
          </div>
        </header>

        <div className="results-content" key={refreshKey}>
          {recommendedProducts.length > 0 ? (
            <>
              {top && (
                <div className={'hero-wrap variant-' + t.heroVariant}>
                  <HeroCard product={top} density={t.density} onSelect={setSelected} />
                </div>
              )}
              <div className={'small-grid density-' + t.density}>
                {rest.map((p, i) => (
                  <SmallCard key={p.id} product={p} rank={i + 2} density={t.density} onSelect={setSelected} />
                ))}
              </div>
            </>
          ) : (
            <ResultsPlaceholder category={category} />
          )}
        </div>
      </main>

      {selected && (
        <ProductDetail
          product={selected}
          onClose={() => setSelected(null)}
          onBuy={handleBuy}
        />
      )}

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
