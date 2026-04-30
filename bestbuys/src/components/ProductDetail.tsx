import { useEffect } from 'react';
import type { Product } from '../types';
import { ProductImage } from './ProductImage';
import { Stars } from './Stars';
import { ScoreRing } from './ScoreRing';

interface Props {
  product: Product;
  onClose: () => void;
  onBuy: (p: Product) => void;
}

export function ProductDetail({ product, onClose, onBuy }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

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
