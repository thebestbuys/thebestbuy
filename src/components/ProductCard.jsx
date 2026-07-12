import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import FavoriteButton from './FavoriteButton.jsx';

// Staggered pop in/out for result cards (hero/small/link + their skeletons),
// same handoff as the home suggestion chips: entry cascades slowly, exit is
// snappier. CARD_SWAP_DELAY_MS is how long the 3-card skeleton row's pop-out
// takes before the real cards swap in — keep in sync with .card-pop-out below.
export const CARD_IN_STAGGER_MS = 90;
export const CARD_OUT_STAGGER_MS = 45;
export const CARD_POP_ANIM_MS = 220;
export const CARD_SWAP_DELAY_MS = 2 * CARD_OUT_STAGGER_MS + CARD_POP_ANIM_MS + 20;

// Only show a real product photo when it comes from a verified Amazon result.
// Gemini-sourced candidates must never display a scraped/guessed Amazon image
// (Amazon Associates Operating Agreement, art. 1 — Program Content).
export function ProductImage({ product, size = 'normal' }) {
  if (product.amazon_verified && product.image_url) {
    return (
      <div className="prod-img-wrap is-photo" data-size={size}>
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

// Product gallery for the detail page: the main photo + a row of clickable
// thumbnails. Same verified-only rule as ProductImage — real Amazon photos are
// shown ONLY when amazon_verified; otherwise we defer to ProductImage's
// placeholder. `product.images` is the API-provided gallery (primary + variant
// shots); it degrades to the single image_url (or one thumbnail = no thumb row).
export function ProductGallery({ product }) {
  const imgs =
    product.amazon_verified
      ? (product.images && product.images.length
          ? product.images
          : (product.image_url ? [product.image_url] : []))
      : [];
  const [active, setActive] = useState(0);
  // Amazon-style hover magnifier: on pointer devices, hovering the main photo
  // scales it up and pans with the cursor (transform-origin follows the pointer,
  // computed from the image's own rect so the zoom tracks accurately). The frame
  // clips the overflow (.prod-zoom { overflow:hidden } in styles.css).
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const imgRef = useRef(null);
  // Reset when switching products (the detail modal reuses this component).
  useEffect(() => { setActive(0); setZoom(false); }, [product.id]);

  const onMove = (e) => {
    const el = imgRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const clamp = (v) => Math.max(0, Math.min(100, v));
    const x = clamp(((e.clientX - r.left) / r.width) * 100);
    const y = clamp(((e.clientY - r.top) / r.height) * 100);
    setOrigin(`${x}% ${y}%`);
  };

  if (!imgs.length) return <ProductImage product={product} size="modal" />;
  const src = imgs[Math.min(active, imgs.length - 1)];

  return (
    <div className="prod-gallery">
      <div
        className={'prod-img-wrap is-photo prod-zoom' + (zoom ? ' is-zoomed' : '')}
        data-size="modal"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={onMove}
      >
        <img
          ref={imgRef}
          src={src}
          alt={`${product.brand} ${product.model}`}
          className="prod-img-amazon"
          style={{ transformOrigin: origin }}
        />
      </div>
      {imgs.length > 1 && (
        <div className="prod-gallery-thumbs">
          {imgs.map((u, i) => (
            <button
              key={u}
              type="button"
              className={'prod-gallery-thumb' + (i === active ? ' is-active' : '')}
              onClick={() => setActive(i)}
              aria-label={`${product.brand} ${product.model} — image ${i + 1}`}
              aria-pressed={i === active}
            >
              <img src={u} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
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

// Small trust badge shown only when the product's data was confirmed against
// Amazon (amazon_verified). Makes the verified/estimate distinction explicit
// instead of leaving it implicit in the price formatting.
export function VerifiedBadge({ product, compact = false }) {
  const { t } = useI18n();
  if (!product.amazon_verified) return null;
  return (
    <span className={'verified-badge' + (compact ? ' compact' : '')} title={t('product.verifiedTitle')}>
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 8.5 6 12l8-8.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && <span>{t('product.verified')}</span>}
    </span>
  );
}

// Tells the user whether a product fits the budget bracket they picked. `budget`
// is { min, max } in euros (from the budget answer); we only flag "over budget"
// (with a small tolerance) vs "in budget" — being cheaper is never a warning.
export function BudgetTag({ product, budget }) {
  const { t } = useI18n();
  if (!budget || product.price == null) return null;
  const { max } = budget;
  const over = max != null && product.price > max * 1.05;
  return (
    <span className={'budget-tag ' + (over ? 'over' : 'in')}>
      {over ? t('product.overBudget') : t('product.inBudget')}
    </span>
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

export function HeroCard({ product, density, budget, onSelect, delay = 0 }) {
  const { t, lang } = useI18n();
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  return (
    <article
      className={'hero-card density-' + density + ' card-pop-in'}
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => onSelect(product)}
    >
      <div className="hero-badge">
        <span className="hero-badge-dot" />
        {t('product.bestMatch')}
      </div>
      <FavoriteButton product={product} />
      <div className="hero-grid">
        <ProductImage product={product} size="large" />
        <div className="hero-meta">
          <div className="hero-brand-row">
            <span className="hero-brand">{product.brand}</span>
            <VerifiedBadge product={product} />
          </div>
          <h2 className="hero-model">{product.model}</h2>
          <VerifiedRating product={product} locale={locale} />
          {product.why && (
            <div className="hero-why">{product.why}</div>
          )}
          <ul className="hero-specs">
            {product.specs.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
          <div className="hero-bottom">
            <div className="hero-price-wrap">
              <PriceTag product={product} locale={locale} t={t} variant="hero" />
              <BudgetTag product={product} budget={budget} />
            </div>
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
export function ProductLinkCard({ product, rank, friendCount, budget, onSelect, delay = 0 }) {
  const { t, lang } = useI18n();
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  return (
    <button
      type="button"
      className="product-link-card card-pop-in"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => onSelect(product)}
    >
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
        <span className="plc-brand-row">
          <span className="plc-brand">{product.brand}</span>
          <VerifiedBadge product={product} compact />
        </span>
        <span className="plc-model">{product.model}</span>
        {product.why && <span className="plc-why">{product.why}</span>}
        <span className="plc-bottom">
          <PriceTag product={product} locale={locale} t={t} variant="small" />
          <BudgetTag product={product} budget={budget} />
          <span className="plc-domain">amazon.fr</span>
        </span>
      </span>
      <span className="plc-chevron" aria-hidden="true">›</span>
    </button>
  );
}

// Shimmer placeholder shown while a recommendation request is in flight, so the
// results area reserves space and reads as "loading" instead of jumping from an
// empty state straight to three cards. Variants mirror the real cards.
export function ProductSkeleton({ variant = 'small', delay = 0, leaving = false }) {
  const animClass = leaving ? 'card-pop-out' : 'card-pop-in';
  const style = { animationDelay: `${delay}ms` };
  if (variant === 'hero') {
    return (
      <div className={'hero-card skel-card ' + animClass} style={style} aria-hidden="true">
        <div className="hero-grid">
          <div className="skel-block skel-img-large" />
          <div className="hero-meta">
            <div className="skel-line w40" />
            <div className="skel-line w70 tall" />
            <div className="skel-line w90" />
            <div className="skel-line w80" />
            <div className="skel-line w50" />
          </div>
        </div>
      </div>
    );
  }
  if (variant === 'link') {
    return (
      <div className={'product-link-card skel-card ' + animClass} style={style} aria-hidden="true">
        <span className="skel-block skel-thumb" />
        <span className="plc-body">
          <div className="skel-line w40" />
          <div className="skel-line w80" />
          <div className="skel-line w50" />
        </span>
      </div>
    );
  }
  return (
    <div className={'small-card skel-card ' + animClass} style={style} aria-hidden="true">
      <div className="skel-block skel-img-small" />
      <div className="small-info">
        <div className="skel-line w50" />
        <div className="skel-line w80" />
        <div className="skel-line w60" />
      </div>
    </div>
  );
}

export function SmallCard({ product, rank, density, budget, onSelect, delay = 0 }) {
  const { t, lang } = useI18n();
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  return (
    <article
      className={'small-card density-' + density + ' card-pop-in'}
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => onSelect(product)}
    >
      <div className="small-rank">#{rank}</div>
      <FavoriteButton product={product} />
      <ProductImage product={product} size="small" />
      <div className="small-info">
        <div className="small-brand-row">
          <span className="small-brand">{product.brand}</span>
          <VerifiedBadge product={product} compact />
        </div>
        <div className="small-model">{product.model}</div>
        <VerifiedRating product={product} size="small" locale={locale} />
        {product.why && <div className="small-why">{product.why}</div>}
        <ul className="small-specs">
          {product.specs.slice(0, density === 'compact' ? 2 : 3).map((s, i) => <li key={i}>{s}</li>)}
        </ul>
        <div className="small-bottom">
          <div className="small-price-wrap">
            <PriceTag product={product} locale={locale} t={t} variant="small" />
            <BudgetTag product={product} budget={budget} />
          </div>
          <div className="small-score">
            <span className="small-score-num">{product.score}</span>
            <span className="small-score-pct">% match</span>
          </div>
        </div>
      </div>
    </article>
  );
}
