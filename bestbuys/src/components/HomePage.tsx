import { useState, useRef, useEffect } from 'react';
import type { CategoryId } from '../types';

const CATEGORY_KEYWORDS: Record<CategoryId, string[]> = {
  phone: ['téléphone', 'telephone', 'smartphone', 'phone', 'iphone', 'mobile', 'samsung', 'pixel'],
  laptop: ['ordinateur', 'laptop', 'pc portable', 'macbook', 'pc', 'notebook', 'ultrabook'],
  headphones: ['casque', 'écouteur', 'ecouteur', 'airpods', 'audio', 'headphone', 'earbuds', 'intra'],
};

export function detectCategory(query: string): CategoryId | null {
  const q = query.toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS) as [CategoryId, string[]][]) {
    if (kws.some((k) => q.includes(k))) return cat;
  }
  return null;
}

interface Suggestion {
  label: string;
  cat: CategoryId;
}

const SUGGESTIONS: Suggestion[] = [
  { label: 'Un téléphone pour la photo', cat: 'phone' },
  { label: 'Un ordinateur portable léger', cat: 'laptop' },
  { label: 'Un casque avec réduction de bruit', cat: 'headphones' },
  { label: 'Un PC pour le gaming', cat: 'laptop' },
];

function SuggestionIcon({ cat }: { cat: CategoryId }) {
  if (cat === 'phone') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <rect x="3.5" y="1.5" width="7" height="11" rx="1.6" stroke="currentColor" strokeWidth="1.2" />
        <line x1="6" y1="10.5" x2="8" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (cat === 'laptop') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <rect x="2.5" y="2.5" width="9" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
        <line x1="1" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 8 V7 a5 5 0 0 1 10 0 V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="1.5" y="8" width="2.5" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
      <rect x="10" y="8" width="2.5" height="4" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

interface Props {
  onPick: (cat: CategoryId, query: string) => void;
}

export function HomePage({ onPick }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const cat = detectCategory(query) ?? 'phone';
    onPick(cat, query.trim());
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
          <button
            type="submit"
            disabled={!query.trim()}
            className="home-search-submit"
            aria-label="Rechercher"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 8 L14 8 M9 3 L14 8 L9 13"
                stroke="currentColor" strokeWidth="1.7"
                strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>

        <div className="home-suggestions">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              type="button"
              className="suggestion-chip"
              onClick={() => onPick(s.cat, s.label)}
            >
              <span className="suggestion-chip-icon">
                <SuggestionIcon cat={s.cat} />
              </span>
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
