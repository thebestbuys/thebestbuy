// Headless responsive smoke test.
//
// Drives the app through Playwright at several viewport widths and captures
// screenshots into ./.screenshots (gitignored). The advisor needs the AI +
// Amazon backends, which aren't available offline, so /api/chat and /api/amazon
// are mocked with canned data — a mix of amazon_verified true/false so the
// screenshots also prove the verified-vs-estimate UI rules.
//
// Usage:
//   1. npm run dev           (in another terminal — serves http://localhost:5173)
//   2. node scripts/responsive-screens.mjs
//
// Requires the `playwright` devDependency + `npx playwright install chromium`.

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:5173';
const OUT = new URL('../.screenshots/', import.meta.url).pathname.replace(/^\//, '');
mkdirSync(OUT, { recursive: true });

const IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#e8e2d8"/><circle cx="60" cy="46" r="24" fill="#c08a4a"/><rect x="36" y="80" width="48" height="10" rx="5" fill="#9a9a9a"/></svg>'
);

const PRODUCTS = [
  { brand: 'Sony', model: 'WH-1000XM5 Casque sans fil', specs: ['Bluetooth 5.2', 'ANC', '30h'], score: 94, price: 279.99, amazon_verified: true, image_url: IMG, rating: 4.6, reviews: 1842, amazon_url: 'https://www.amazon.fr/dp/B09XYZ?tag=oraklia123-21', why: 'Le meilleur ANC.', category: 'headphones' },
  { brand: 'Anker', model: 'Soundcore Q30 (non vérifié)', specs: ['ANC', '40h'], score: 81, price: 79, amazon_verified: false, image_url: null, rating: null, reviews: null, amazon_url: null, why: 'Bon rapport qualité-prix.', category: 'headphones' },
  { brand: 'JBL', model: 'Tune 770NC', specs: ['ANC', '70h'], score: 76, price: 99, amazon_verified: false, image_url: null, rating: null, reviews: null, amazon_url: null, why: 'Autonomie record.', category: 'headphones' },
];

const Q = (n) => ({ question: { id: 'q' + n, q: 'Q' + n, choices: n === 0
  ? [{ id: 'b1', label: 'Moins de 50 €', min: 0, max: 5000 }, { id: 'b2', label: '50 – 150 €', min: 5000, max: 15000 }, { id: 'b3', label: '150 – 300 €', min: 15000, max: 30000 }, { id: 'b4', label: 'Plus de 300 €', min: 30000, max: null }]
  : [{ id: 'c1', label: 'Option A' }, { id: 'c2', label: 'Option B' }, { id: 'c3', label: 'Option C' }] } });

const browser = await chromium.launch();

async function run(width, height, label) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.route('**/api/chat', async (r) => {
    const body = r.request().postDataJSON() || {};
    const j = body.mode === 'recommend' ? { products: PRODUCTS } : Q((body.answers || []).length);
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(j) });
  });
  await page.route('**/api/amazon**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/home-${label}.png` });

  const input = page.locator('input[type="text"]').first();
  await input.fill('un casque audio bluetooth');
  await input.press('Enter');
  for (let i = 0; i < 8; i++) {
    if (await page.locator('.product-link-card, .small-card, .hero-card').count() > 0) break;
    const chip = page.locator('.budget-bracket, .choice-chip').first();
    await chip.waitFor({ state: 'visible', timeout: 8000 });
    await chip.click();
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(500);

  const ov = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth }));
  if (ov.scrollW > ov.innerW) console.warn(`⚠ ${label}: horizontal overflow ${ov.scrollW} > ${ov.innerW}`);
  await page.screenshot({ path: `${OUT}/advisor-${label}.png` });
  await ctx.close();
}

await run(390, 844, 'phone');
await run(768, 1024, 'tablet');
await run(1280, 800, 'desktop');

await browser.close();
console.log('Screenshots written to', OUT);
