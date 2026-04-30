import type { Product } from '../types';
import { ProductImage } from './ProductImage';
import { Stars } from './Stars';

interface Props {
  product: Product;
  rank: number;
  onSelect: (p: Product) => void;
}

export function SmallCard({ product, rank, onSelect }: Props) {
  return (
    <article className="small-card" onClick={() => onSelect(product)}>
      <div className="small-rank">#{rank}</div>
      <ProductImage product={product} size="small" />
      <div className="small-info">
        <div className="small-brand">{product.brand}</div>
        <div className="small-model">{product.model}</div>
        <div className="small-rating">
          <Stars rating={product.rating} />
          <span className="rating-num small">{product.rating.toFixed(1)}</span>
        </div>
        <ul className="small-specs">
          {product.specs.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
        </ul>
        <div className="small-bottom">
          <div className="small-price">{product.price.toLocaleString('fr-FR')} €</div>
          <div className="small-score">
            <span>{product.score}</span>
            <span className="small-score-pct">% match</span>
          </div>
        </div>
      </div>
    </article>
  );
}
