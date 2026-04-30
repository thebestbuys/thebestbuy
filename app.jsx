// app.jsx — orchestrateur principal

const { useState, useEffect, useMemo, useRef } = React;

// Mots-clés pour détecter la catégorie depuis la requête libre
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

function CategoryPicker({ onPick }) {
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => {
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
            <div className="modal-rating">
              <Stars rating={product.rating} />
              <span className="rating-num">{product.rating.toFixed(1)}</span>
              <span className="rating-count">({product.reviews.toLocaleString('fr-FR')} avis)</span>
            </div>
            <div className="modal-score-row">
              <ScoreRing score={product.score} size={56} />
              <div>
                <div className="modal-score-title">{product.score}% de correspondance</div>
                <div className="modal-score-sub">avec vos critères</div>
              </div>
            </div>
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
              <button className="btn-primary big" onClick={() => onBuy(product)}>
                Acheter maintenant
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "chatLayout": "bubbles",
    "heroVariant": "wide",
    "density": "regular"
  }/*EDITMODE-END*/;

  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const [category, setCategory] = useState(null);
  const [initialQuery, setInitialQuery] = useState('');
  const [answers, setAnswers] = useState({});
  const [messages, setMessages] = useState([]);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState(null);

  const questions = category ? window.QUESTIONS[category] : [];
  const products = category ? window.PRODUCTS[category].map(p => ({ ...p, category })) : [];
  const currentQuestion = !isTyping && questionIdx < questions.length ? questions[questionIdx] : null;
  const allDone = category && questionIdx >= questions.length;
  const progress = category ? Math.min(100, Math.round((questionIdx / questions.length) * 100)) : 0;

  // Démarre la conversation
  useEffect(() => {
    if (!category) return;
    const cat = window.CATEGORIES.find(c => c.id === category);
    const initialMsgs = [];
    if (initialQuery) {
      initialMsgs.push({ role: 'user', text: initialQuery });
    }
    initialMsgs.push({
      role: 'bot',
      text: initialQuery
        ? `Compris — je cherche dans la catégorie ${cat.label.toLowerCase()}. Quelques questions pour affiner :`
        : `Parfait, on cherche un ${cat.label.toLowerCase()}. Je vais vous poser quelques questions pour affiner.`
    });
    setMessages(initialMsgs);
    setIsTyping(true);
    const t1 = setTimeout(() => {
      setMessages(m => [...m, { role: 'bot', text: questions[0].text }]);
      setIsTyping(false);
    }, 900);
    return () => clearTimeout(t1);
  }, [category]);

  const ranked = useMemo(() => {
    if (!category) return [];
    return window.rankProducts(products, answers, questions).slice(0, 5);
  }, [category, answers, refreshKey]);

  const handleAnswer = (qId, choice) => {
    setMessages(m => [...m, { role: 'user', text: choice.label }]);
    setAnswers(a => ({ ...a, [qId]: choice.id }));
    setRefreshKey(k => k + 1);

    const nextIdx = questionIdx + 1;
    setIsTyping(true);
    setTimeout(() => {
      if (nextIdx < questions.length) {
        setMessages(m => [...m, { role: 'bot', text: questions[nextIdx].text }]);
        setQuestionIdx(nextIdx);
      } else {
        setMessages(m => [...m, { role: 'bot', text: "Voilà ma sélection sur la droite. La carte mise en avant est mon meilleur match. Vous pouvez cliquer sur n'importe quel produit pour voir le détail." }]);
        setQuestionIdx(nextIdx);
      }
      setIsTyping(false);
    }, 800);
  };

  const handleFreeText = (txt) => {
    setMessages(m => [...m, { role: 'user', text: txt }]);
    setIsTyping(true);
    setTimeout(() => {
      setMessages(m => [...m, {
        role: 'bot',
        text: allDone
          ? "Bien noté, j'ajuste les recommandations. Souhaitez-vous reprendre le questionnaire ?"
          : "Merci, je tiens compte de cette précision. Voici la question suivante :"
      }]);
      setIsTyping(false);
    }, 700);
  };

  const handleRestart = () => {
    setCategory(null);
    setInitialQuery('');
    setAnswers({});
    setMessages([]);
    setQuestionIdx(0);
    setIsTyping(false);
    setSelected(null);
  };

  const handleBuy = (p) => {
    setSelected(null);
    setMessages(m => [...m, { role: 'bot', text: `Je vous redirige vers le ${p.model} chez notre marchand partenaire ✓` }]);
  };

  if (!category) return <CategoryPicker onPick={(cat, q) => { setCategory(cat); setInitialQuery(q || ''); }} />;

  const top = ranked[0];
  const rest = ranked.slice(1, 5);

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
              {window.CATEGORIES.find(c => c.id === category).label}s {' '}
              <span className="results-count">· {Object.keys(answers).length}/{questions.length} critères</span>
            </h2>
          </div>
          <div className="results-meta">
            {allDone ? "Sélection finalisée" : "Affinage en cours…"}
          </div>
        </header>

        <div className="results-content" key={refreshKey}>
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

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
