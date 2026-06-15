import { useI18n } from '../lib/i18n.jsx';
import { AmazonPrice, ProductImage, Stars } from './ProductCard.jsx';

// Read-only view of a shared gift list (opened from a ?share=… link). Fully
// self-contained: the products are decoded from the URL, no fetch needed.
// Each item: { b: brand, m: model, p: price, u: amazon_url, i: image_url, s: score }.
export default function SharedGiftList({ data, onCreate }) {
  const { t } = useI18n();
  const items = Array.isArray(data?.items) ? data.items : [];
  const forWhat = [data?.r, data?.o].map((s) => String(s || '').trim()).filter(Boolean).join(' · ');

  const toProduct = (it) => ({
    brand: it.b,
    model: it.m,
    price: it.p ?? null,
    amazon_url: it.u || null,
    image_url: it.i || null,
    score: it.s ?? null,
  });

  return (
    <div className="share-page">
      <header className="share-head">
        <h1 className="home-logo">Oraklia</h1>
        <div className="share-eyebrow">🎁 {t('share.eyebrow')}</div>
        <h2 className="share-title">{t('share.title')}</h2>
        {forWhat && <p className="share-for">{t('share.forOccasion', { what: forWhat })}</p>}
      </header>

      {items.length === 0 ? (
        <p className="share-empty">{t('share.empty')}</p>
      ) : (
        <ul className="share-grid">
          {items.map((it, idx) => {
            const p = toProduct(it);
            const url =
              p.amazon_url ||
              `https://www.amazon.fr/s?k=${encodeURIComponent(`${p.brand} ${p.model}`)}&tag=oraklia123-21`;
            return (
              <li key={idx} className="amz-card">
                <a className="amz-card-img" href={url} target="_blank" rel="noopener noreferrer sponsored">
                  <ProductImage product={p} size="small" />
                </a>
                <div className="amz-card-body">
                  <a className="amz-card-title" href={url} target="_blank" rel="noopener noreferrer sponsored">
                    {[p.brand, p.model].filter(Boolean).join(' ')}
                  </a>
                  {p.score != null && (
                    <div className="amz-card-rating">
                      <Stars rating={Math.round((p.score / 100) * 5 * 10) / 10} />
                    </div>
                  )}
                  {p.price != null && (
                    <div className="amz-card-price">
                      <AmazonPrice price={p.price} />
                    </div>
                  )}
                  <a className="amz-buy-btn" href={url} target="_blank" rel="noopener noreferrer sponsored">
                    {t('product.viewAmazon')}
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="share-cta-wrap">
        <button type="button" className="profile-save share-cta" onClick={onCreate}>
          {t('share.cta')}
        </button>
      </div>
      <p className="selections-note">{t('footer.affiliate')}</p>
    </div>
  );
}
