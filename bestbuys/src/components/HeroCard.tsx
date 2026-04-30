import type { Product } from '../types';
import { ProductImage } from './ProductImage';
import { Stars } from './Stars';
import { ScoreRing } from './ScoreRing';

interface Props {
  product: Product;
  onSelect: (p: Product) => void;
}

export function HeroCard({ product, onSelect }: Props) {
  return (
    <article className="hero-card" onClick={() => onSelect(product)}>
      <div className="hero-badge">
        <span className="hero-badge-dot" />
        Meilleur match
      </div>
      <div className="hero-grid">
        <ProductImage product={product} size="large" />
        <div className="hero-meta">
          <div className="hero-brand">{product.brand}</div>
          <h2 className="hero-model">{product.model}</h2>
          <div className="hero-rating">
            <Stars rating={product.rating} />
            <span className="rating-num">{product.rating.toFixed(1)}</span>
            <span className="rating-count">({product.reviews.toLocaleString('fr-FR')} avis)</span>
          </div>
          <ul className="hero-specs">
            {product.specs.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
          <div className="hero-bottom">
            <div className="hero-price">
              <span className="price-num">{product.price.toLocaleString('fr-FR')}</span>
              <span className="price-currency">€</span>
            </div>
            <button
              className="btn-primary"
              onClick={(e) => { e.stopPropagation(); onSelect(product); }}
            >
              Voir détails
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
        <div className="hero-score">
          <ScoreRing score={product.score} size={92} />
          <div className="hero-score-label">match</div>
        </div>
      </div>
    </article>
  );
}
