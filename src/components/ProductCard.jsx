import { useI18n } from '../lib/i18n.jsx';
import FavoriteButton from './FavoriteButton.jsx';

// Only show a real product photo when it comes from a verified Amazon result.
// Gemini-sourced candidates must never display a scraped/guessed Amazon image
// (Amazon Associates Operating Agreement, art. 1 — Program Content).
export function ProductImage({ product, size = 'normal' }) {
  if (product.amazon_verified && product.image_url) {
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

// Price rendered with Amazon's exact markup: whole + decimal separator on the
// baseline, fraction and currency raised as superscript. The decimal separator
// follows the locale ("," in FR, "." in EN). Size scales from the parent's
// `.a-price` font-size, so each context can resize via a container override.
export function AmazonPrice({ price }) {
  const { lang } = useI18n();
  if (price == null) return null;
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  const decimalSep = (1.1).toLocaleString(locale).replace(/[0-9\s]/g, '') || '.';
  const whole = Math.floor(price).toLocaleString(locale);
  const frac = String(Math.round((price - Math.floor(price)) * 100)).padStart(2, '0');
  return (
    <span className="a-price">
      <span className="a-offscreen">{whole}{decimalSep}{frac} €</span>
      <span aria-hidden="true">
        <span className="a-price-whole">
          {whole}
          <span className="a-price-decimal">{decimalSep}</span>
        </span>
        <span className="a-price-fraction">{frac}</span>
        <span className="a-price-symbol">€</span>
      </span>
    </span>
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

// Rating + review count are only authoritative when sourced from a real Amazon
// result. For Gemini-only candidates we hide them entirely rather than show
// AI-invented stars/review counts (misleading + Amazon community rules).
export function VerifiedRating({ product, size = 'normal', locale }) {
  if (!product.amazon_verified || product.rating == null) return null;
  return (
    <div className={size === 'small' ? 'small-rating' : 'hero-rating'}>
      <Stars rating={product.rating} />
      <span className={'rating-num' + (size === 'small' ? ' small' : '')}>{product.rating.toFixed(1)}</span>
      {size !== 'small' && product.reviews != null && (
        <span className="rating-count">({product.reviews.toLocaleString(locale)})</span>
      )}
    </div>
  );
}

// Round to a human-friendly value for the estimated range bounds.
function roundNice(v) {
  if (v >= 1000) return Math.round(v / 50) * 50;
  if (v >= 100) return Math.round(v / 10) * 10;
  return Math.round(v / 5) * 5;
}

// Price display. Verified Amazon products show the exact scraped price. Gemini
// estimates are shown as a clearly-labelled indicative range — never as a firm
// Amazon price (Amazon Program Policies forbid showing non-API prices as exact).
export function PriceTag({ product, locale, t, variant = 'small' }) {
  if (product.amazon_verified && product.price != null) {
    if (variant === 'small') {
      return <div className="small-price"><AmazonPrice price={product.price} /></div>;
    }
    return (
      <div className="hero-price">
        <AmazonPrice price={product.price} />
      </div>
    );
  }

  if (product.price == null) return null;
  const low = roundNice(product.price * 0.9);
  const high = roundNice(product.price * 1.1);
  const range = `≈ ${low.toLocaleString(locale)} – ${high.toLocaleString(locale)} €`;
  if (variant === 'small') {
    return (
      <div className="small-price small-price-est" title={t('product.priceEstimateNote')}>
        {range}
      </div>
    );
  }
  return (
    <div className="hero-price hero-price-est">
      <span className="price-est-label">{t('product.priceEstimate')}</span>
      <span className="price-est-range">{range}</span>
    </div>
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
  const { t, lang } = useI18n();
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  return (
    <article className={'hero-card density-' + density} onClick={() => onSelect(product)}>
      <div className="hero-badge">
        <span className="hero-badge-dot" />
        {t('product.bestMatch')}
      </div>
      <FavoriteButton product={product} />
      <div className="hero-grid">
        <ProductImage product={product} size="large" />
        <div className="hero-meta">
          <div className="hero-brand">{product.brand}</div>
          <h2 className="hero-model">{product.model}</h2>
          <VerifiedRating product={product} locale={locale} />
          {product.why && !(product.amazon_verified && product.rating != null) && (
            <div className="hero-why">{product.why}</div>
          )}
          <ul className="hero-specs">
            {product.specs.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
          <div className="hero-bottom">
            <PriceTag product={product} locale={locale} t={t} variant="hero" />
            <button className="btn-primary" onClick={(e) => { e.stopPropagation(); onSelect(product); }}>
              {t('product.viewDetails')}
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
        <div className="hero-score">
          <ScoreRing score={product.score} size={92} />
          <div className="hero-score-label">{t('product.matchLabel')}</div>
        </div>
      </div>
    </article>
  );
}

// Compact "shared link" card, à la WhatsApp/Messenger link unfurl — used inside
// the chat stream on narrow viewports. Reuses ProductImage + PriceTag so the
// amazon_verified rules hold automatically (placeholder + estimated range when
// the product wasn't verified against Amazon; never a fake price/image/stars).
export function ProductLinkCard({ product, rank, friendCount, onSelect }) {
  const { t, lang } = useI18n();
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  return (
    <button type="button" className="product-link-card" onClick={() => onSelect(product)}>
      {rank != null && <span className="plc-rank">#{rank}</span>}
      {friendCount != null && (
        <span className="plc-friends" title={t('trending.friendsCount', { n: friendCount })}>
          👥 {friendCount}
        </span>
      )}
      <span className="plc-thumb">
        <ProductImage product={product} size="small" />
      </span>
      <span className="plc-body">
        <span className="plc-brand">{product.brand}</span>
        <span className="plc-model">{product.model}</span>
        <span className="plc-bottom">
          <PriceTag product={product} locale={locale} t={t} variant="small" />
          <span className="plc-domain">amazon.fr</span>
        </span>
      </span>
      <span className="plc-chevron" aria-hidden="true">›</span>
    </button>
  );
}

export function SmallCard({ product, rank, density, onSelect }) {
  const { t, lang } = useI18n();
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  return (
    <article className={'small-card density-' + density} onClick={() => onSelect(product)}>
      <div className="small-rank">#{rank}</div>
      <FavoriteButton product={product} />
      <ProductImage product={product} size="small" />
      <div className="small-info">
        <div className="small-brand">{product.brand}</div>
        <div className="small-model">{product.model}</div>
        <VerifiedRating product={product} size="small" locale={locale} />
        <ul className="small-specs">
          {product.specs.slice(0, density === 'compact' ? 2 : 3).map((s, i) => <li key={i}>{s}</li>)}
        </ul>
        <div className="small-bottom">
          <PriceTag product={product} locale={locale} t={t} variant="small" />
          <div className="small-score">
            <span className="small-score-num">{product.score}</span>
            <span className="small-score-pct">% match</span>
          </div>
        </div>
      </div>
    </article>
  );
}
