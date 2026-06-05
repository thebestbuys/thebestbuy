export function ProductImage({ product, size = 'normal' }) {
  if (product.image_url) {
    return (
      <div className="prod-img-wrap" data-size={size}>
        <img
          src={product.image_url}
          alt={`${product.brand} ${product.model}`}
          className="prod-img-amazon"
        />
      </div>
    );
  }

  const cat = product.category;
  const c = product.color || 'var(--bg-softer)';

  if (cat === 'phone') {
    return (
      <div className="prod-img-wrap" data-size={size}>
        <div className="prod-img phone-img" style={{ background: c }}>
          <div className="phone-screen" />
          <div className="phone-notch" />
          <div className="phone-camera" />
        </div>
      </div>
    );
  }
  if (cat === 'laptop') {
    return (
      <div className="prod-img-wrap" data-size={size}>
        <div className="prod-img laptop-img">
          <div className="laptop-screen" style={{ background: c }} />
          <div className="laptop-base" />
        </div>
      </div>
    );
  }
  const initials = [product.brand?.[0], product.model?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  return (
    <div className="prod-img-wrap" data-size={size}>
      <div className="prod-img generic-img">
        <span className="generic-img-initials">{initials}</span>
      </div>
    </div>
  );
}

export function Stars({ rating }) {
  if (rating == null) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.4;
  return (
    <span className="stars" aria-label={`${rating} sur 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={'star ' + (i < full ? 'full' : i === full && half ? 'half' : 'empty')}>★</span>
      ))}
    </span>
  );
}

export function ScoreRing({ score, size = 64 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 85 ? 'var(--accent-good)' : score >= 70 ? 'var(--accent)' : 'var(--text-muted)';
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,.07)" strokeWidth="3" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="score-ring-num" style={{ fontSize: size * 0.32 }}>
        {score}<span className="score-pct">%</span>
      </div>
    </div>
  );
}

export function HeroCard({ product, density, onSelect }) {
  return (
    <article className={'hero-card density-' + density} onClick={() => onSelect(product)}>
      <div className="hero-badge">
        <span className="hero-badge-dot" />
        Meilleur match
      </div>
      <div className="hero-grid">
        <ProductImage product={product} size="large" />
        <div className="hero-meta">
          <div className="hero-brand">{product.brand}</div>
          <h2 className="hero-model">{product.model}</h2>
          {product.rating != null && (
            <div className="hero-rating">
              <Stars rating={product.rating} />
              <span className="rating-num">{product.rating.toFixed(1)}</span>
              {product.reviews != null && (
                <span className="rating-count">({product.reviews.toLocaleString('fr-FR')} avis)</span>
              )}
            </div>
          )}
          {product.why && !product.rating && (
            <div className="hero-why">{product.why}</div>
          )}
          <ul className="hero-specs">
            {product.specs.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
          <div className="hero-bottom">
            <div className="hero-price">
              <span className="price-num">{product.price.toLocaleString('fr-FR')}</span>
              <span className="price-currency">€</span>
            </div>
            <button className="btn-primary" onClick={(e) => { e.stopPropagation(); onSelect(product); }}>
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

export function SmallCard({ product, rank, density, onSelect }) {
  return (
    <article className={'small-card density-' + density} onClick={() => onSelect(product)}>
      <div className="small-rank">#{rank}</div>
      <ProductImage product={product} size="small" />
      <div className="small-info">
        <div className="small-brand">{product.brand}</div>
        <div className="small-model">{product.model}</div>
        {product.rating != null && (
          <div className="small-rating">
            <Stars rating={product.rating} />
            <span className="rating-num small">{product.rating.toFixed(1)}</span>
          </div>
        )}
        <ul className="small-specs">
          {product.specs.slice(0, density === 'compact' ? 2 : 3).map((s, i) => <li key={i}>{s}</li>)}
        </ul>
        <div className="small-bottom">
          <div className="small-price">{product.price.toLocaleString('fr-FR')} €</div>
          <div className="small-score">
            <span className="small-score-num">{product.score}</span>
            <span className="small-score-pct">% match</span>
          </div>
        </div>
      </div>
    </article>
  );
}
