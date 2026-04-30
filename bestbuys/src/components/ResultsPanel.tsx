import type { Product, Question } from '../types';
import { HeroCard } from './HeroCard';
import { SmallCard } from './SmallCard';

interface Props {
  ranked: Product[];
  questions: Question[];
  answeredCount: number;
  categoryLabel: string;
  allDone: boolean;
  onSelect: (p: Product) => void;
  refreshKey: number;
}

export function ResultsPanel({
  ranked, questions, answeredCount, categoryLabel, allDone, onSelect, refreshKey,
}: Props) {
  const top = ranked[0];
  const rest = ranked.slice(1, 5);

  return (
    <main className="results-panel">
      <header className="results-header">
        <div>
          <div className="results-eyebrow">Top 5 sélection</div>
          <h2 className="results-title">
            {categoryLabel}s{' '}
            <span className="results-count">· {answeredCount}/{questions.length} critères</span>
          </h2>
        </div>
        <div className="results-meta">
          {allDone ? 'Sélection finalisée' : 'Affinage en cours…'}
        </div>
      </header>

      <div className="results-content" key={refreshKey}>
        {top && <HeroCard product={top} onSelect={onSelect} />}
        <div className="small-grid">
          {rest.map((p, i) => (
            <SmallCard key={p.id} product={p} rank={i + 2} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </main>
  );
}
