// Generate Google Play Store listing assets with Playwright/chromium (the only
// image tool available here — no ImageMagick/sharp). Produces, into ./play-store:
//   icon-512.png            512×512 app icon (resized from brand icon, opaque)
//   feature-graphic.png     1024×500 feature graphic (branded render)
//   screenshots/*.png       phone screenshots at 400×800 @2x = 800×1600 (Play-compliant 2:1)
//
// Requires the dev server on http://localhost:5173 (npm run dev) for screenshots.
// The advisor backend is mocked (canned data, mixed amazon_verified) so no API key.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'play-store');
const SHOTS = join(OUT, 'screenshots');
mkdirSync(SHOTS, { recursive: true });
const BASE = process.env.BASE_URL || 'http://localhost:5173';
const BG = '#FFFCF8';

const browser = await chromium.launch();

// ── 1. App icon 512×512 (opaque, from the 1024 brand icon with background) ────
async function icon() {
  const src = `${BASE}/brand/oraklia-icon-bg.png`;
  const ctx = await browser.newContext({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(
    `<html><body style="margin:0"><img src="${src}" width="512" height="512" style="display:block"/></body></html>`,
    { waitUntil: 'networkidle' },
  );
  await page.locator('img').evaluate((el) => el.complete && el.naturalWidth > 0 ? true : new Promise((res) => { el.onload = res; el.onerror = res; }));
  await page.locator('img').screenshot({ path: join(OUT, 'icon-512.png') });
  await ctx.close();
  console.log('wrote play-store/icon-512.png (512×512)');
}

// ── 2. Feature graphic 1024×500 (branded) ─────────────────────────────────────
async function feature() {
  const logo = `${BASE}/brand/oraklia-logo.png`;
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(`<html><body style="margin:0">
    <div style="width:1024px;height:500px;box-sizing:border-box;display:flex;align-items:center;gap:48px;
      padding:0 72px;background:linear-gradient(135deg,${BG} 0%,#F3E9DA 100%);
      font-family:-apple-system,Segoe UI,Roboto,sans-serif">
      <img src="${logo}" style="width:196px;height:196px;border-radius:44px;box-shadow:0 12px 40px rgba(140,90,40,.22)"/>
      <div>
        <div style="font-size:58px;font-weight:800;color:#2A2118;letter-spacing:-.02em">Oraklia</div>
        <div style="font-size:31px;font-weight:600;color:#8A5A28;margin-top:10px">Votre conseiller d'achat IA</div>
        <div style="font-size:22px;color:#5C4E3D;margin-top:14px;max-width:560px;line-height:1.4">
          Décrivez ce que vous cherchez, l'IA trouve le bon produit sur Amazon.</div>
      </div>
    </div></body></html>`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(OUT, 'feature-graphic.png'), clip: { x: 0, y: 0, width: 1024, height: 500 } });
  await ctx.close();
  console.log('wrote play-store/feature-graphic.png (1024×500)');
}

// ── 3. Phone screenshots (mocked backend) ─────────────────────────────────────
const IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#e8e2d8"/><circle cx="60" cy="46" r="24" fill="#c08a4a"/><rect x="36" y="80" width="48" height="10" rx="5" fill="#9a9a9a"/></svg>');
const PRODUCTS = [
  { brand: 'Sony', model: 'WH-1000XM5 Casque sans fil', specs: ['Bluetooth 5.2', 'ANC', '30h'], score: 94, price: 279.99, amazon_verified: true, image_url: IMG, rating: 4.6, reviews: 1842, amazon_url: 'https://www.amazon.fr/dp/B09XYZ?tag=oraklia123-21', why: 'Le meilleur ANC du marché, confort longue durée.', category: 'headphones' },
  { brand: 'Bose', model: 'QuietComfort Ultra', specs: ['ANC adaptatif', '24h', 'Spatial'], score: 89, price: 349, amazon_verified: true, image_url: IMG, rating: 4.5, reviews: 967, amazon_url: 'https://www.amazon.fr/dp/B0C?tag=oraklia123-21', why: 'Son immersif et réduction de bruit premium.', category: 'headphones' },
  { brand: 'Anker', model: 'Soundcore Q30', specs: ['ANC', '40h'], score: 81, price: 79, amazon_verified: false, image_url: null, rating: null, reviews: null, amazon_url: null, why: 'Excellent rapport qualité-prix.', category: 'headphones' },
];
const Q = (n) => ({ question: { id: 'q' + n, q: n === 0 ? 'Quel est votre budget ?' : 'Quelle utilisation principale ?', choices: n === 0
  ? [{ id: 'b1', label: 'Moins de 50 €', min: 0, max: 5000 }, { id: 'b2', label: '50 – 150 €', min: 5000, max: 15000 }, { id: 'b3', label: '150 – 300 €', min: 15000, max: 30000 }, { id: 'b4', label: 'Plus de 300 €', min: 30000, max: null }]
  : [{ id: 'c1', label: 'Voyage / transport' }, { id: 'c2', label: 'Sport' }, { id: 'c3', label: 'Bureau / télétravail' }] } });

async function phone() {
  const ctx = await browser.newContext({ viewport: { width: 400, height: 800 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.route('**/api/chat', async (r) => {
    const body = r.request().postDataJSON() || {};
    const j = body.mode === 'recommend' ? { products: PRODUCTS } : Q((body.answers || []).length);
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(j) });
  });
  await page.route('**/api/amazon**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(SHOTS, '1-home.png') });

  const input = page.locator('input[type="text"]').first();
  await input.fill('un casque audio bluetooth');
  await input.press('Enter');
  // Answer the first question so the chat shows a real exchange.
  const chip = page.locator('.budget-bracket, .choice-chip').first();
  await chip.waitFor({ state: 'visible', timeout: 8000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(SHOTS, '2-questions.png') });

  // Keep answering until recommendations render.
  for (let i = 0; i < 8; i++) {
    if (await page.locator('.product-link-card, .small-card, .hero-card').count() > 0) break;
    const c = page.locator('.budget-bracket, .choice-chip').first();
    await c.waitFor({ state: 'visible', timeout: 8000 });
    await c.click();
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(SHOTS, '3-recommendations.png') });
  await ctx.close();
  console.log('wrote play-store/screenshots/{1-home,2-questions,3-recommendations}.png (800×1600)');
}

await icon();
await feature();
await phone();
await browser.close();
console.log('Done. Assets in play-store/');
