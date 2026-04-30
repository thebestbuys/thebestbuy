import type { CategoryId, Product } from '../types';

type RawProduct = Omit<Product, 'category' | 'score'>;

const phones: RawProduct[] = [
  {
    id: 'p1', brand: 'Aurora', model: 'Aurora 15 Pro', price: 1229,
    rating: 4.7, reviews: 2841, tags: ['ios', 'camera', 'pro', 'perf'],
    color: 'oklch(0.78 0.04 60)',
    specs: ['Triple capteur 48 MP', 'Puce A18 Pro', '256 Go', '6.3" OLED 120 Hz'],
  },
  {
    id: 'p2', brand: 'Aurora', model: 'Aurora 15', price: 899,
    rating: 4.5, reviews: 5102, tags: ['ios', 'balanced', 'camera'],
    color: 'oklch(0.85 0.05 220)',
    specs: ['Double capteur 48 MP', 'Puce A18', '128 Go', '6.1" OLED'],
  },
  {
    id: 'p3', brand: 'Lyra', model: 'Lyra Ultra 9', price: 1299,
    rating: 4.6, reviews: 1923, tags: ['android', 'camera', 'pro', 'perf'],
    color: 'oklch(0.35 0.02 280)',
    specs: ['Capteur 200 MP', 'Snapdragon 8 Gen 4', '512 Go', '6.8" AMOLED 144 Hz'],
  },
  {
    id: 'p4', brand: 'Lyra', model: 'Lyra S24', price: 749,
    rating: 4.4, reviews: 3401, tags: ['android', 'balanced'],
    color: 'oklch(0.92 0.02 90)',
    specs: ['Triple capteur 50 MP', 'Snapdragon 7 Gen 3', '256 Go', '6.4" AMOLED'],
  },
  {
    id: 'p5', brand: 'Nimbus', model: 'Nimbus 8 Pro', price: 599,
    rating: 4.5, reviews: 4220, tags: ['android', 'perf', 'gaming', 'balanced'],
    color: 'oklch(0.55 0.12 25)',
    specs: ['IMX989 50 MP', 'Snapdragon 8s Gen 3', '256 Go', '6.7" AMOLED 120 Hz'],
  },
  {
    id: 'p6', brand: 'Pixel', model: 'Pixel 9', price: 699,
    rating: 4.6, reviews: 1876, tags: ['android', 'camera', 'balanced'],
    color: 'oklch(0.88 0.03 110)',
    specs: ['IA photo Tensor G4', '128 Go', '6.3" OLED 120 Hz', '7 ans MAJ'],
  },
  {
    id: 'p7', brand: 'Aurora', model: 'Aurora SE', price: 449,
    rating: 4.2, reviews: 6203, tags: ['ios', 'balanced'],
    color: 'oklch(0.95 0.01 0)',
    specs: ['Capteur 12 MP', 'Puce A16', '64 Go', '4.7" Retina'],
  },
  {
    id: 'p8', brand: 'Nimbus', model: 'Nimbus Lite', price: 329,
    rating: 4.1, reviews: 2104, tags: ['android', 'balanced'],
    color: 'oklch(0.65 0.08 200)',
    specs: ['Triple capteur 50 MP', 'Dimensity 7300', '128 Go', '6.6" LCD 90 Hz'],
  },
];

const laptops: RawProduct[] = [
  {
    id: 'l1', brand: 'Aurora', model: 'AuroraBook Pro 14', price: 2399,
    rating: 4.8, reviews: 1241, tags: ['creative', 'perf', 'portable', 'dev'],
    color: 'oklch(0.45 0.01 250)',
    specs: ['Puce M4 Pro', '24 Go RAM', '1 To SSD', '14" Liquid Retina XDR'],
  },
  {
    id: 'l2', brand: 'Aurora', model: 'AuroraBook Air 13', price: 1299,
    rating: 4.7, reviews: 4520, tags: ['portable', 'balanced'],
    color: 'oklch(0.92 0.01 80)',
    specs: ['Puce M3', '16 Go RAM', '512 Go SSD', '13.6" Liquid Retina'],
  },
  {
    id: 'l3', brand: 'Helix', model: 'Helix XPS 15', price: 2199,
    rating: 4.5, reviews: 982, tags: ['creative', 'perf', 'dev'],
    color: 'oklch(0.32 0.01 270)',
    specs: ['Intel Core Ultra 9', '32 Go RAM', '1 To SSD', '15.6" OLED 4K'],
  },
  {
    id: 'l4', brand: 'Helix', model: 'Helix Slim 13', price: 1099,
    rating: 4.4, reviews: 2103, tags: ['portable', 'balanced', 'office'],
    color: 'oklch(0.85 0.02 240)',
    specs: ['Intel Core Ultra 7', '16 Go RAM', '512 Go SSD', '13.3" IPS'],
  },
  {
    id: 'l5', brand: 'Vortex', model: 'Vortex Strix G16', price: 2599,
    rating: 4.6, reviews: 743, tags: ['gaming', 'perf'],
    color: 'oklch(0.28 0.05 30)',
    specs: ['RTX 4080', 'Ryzen 9 8945HX', '32 Go RAM', '16" QHD 240 Hz'],
  },
  {
    id: 'l6', brand: 'Lyra', model: 'Lyra Galaxy Book4', price: 1499,
    rating: 4.3, reviews: 1320, tags: ['portable', 'balanced', 'creative'],
    color: 'oklch(0.78 0.02 220)',
    specs: ['Intel Core Ultra 7', '16 Go RAM', '512 Go SSD', '14" AMOLED'],
  },
  {
    id: 'l7', brand: 'Nimbus', model: 'Nimbus Book 14', price: 849,
    rating: 4.2, reviews: 2890, tags: ['office', 'balanced', 'portable'],
    color: 'oklch(0.7 0.08 30)',
    specs: ['Ryzen 7 8845HS', '16 Go RAM', '512 Go SSD', '14" IPS 90 Hz'],
  },
  {
    id: 'l8', brand: 'Vortex', model: 'Vortex Blade 14', price: 1999,
    rating: 4.5, reviews: 612, tags: ['gaming', 'perf', 'portable', 'creative'],
    color: 'oklch(0.18 0.02 280)',
    specs: ['RTX 4060', 'Ryzen 9 8945HS', '16 Go RAM', '14" QHD+ 240 Hz'],
  },
];

const headphones: RawProduct[] = [
  {
    id: 'h1', brand: 'Sonance', model: 'Sonance QC Ultra', price: 449,
    rating: 4.7, reviews: 3421, tags: ['over', 'anc', 'calls'],
    color: 'oklch(0.32 0.01 280)',
    specs: ['ANC adaptatif', 'Bluetooth 5.3', '24 h autonomie', 'Codec aptX Adaptive'],
  },
  {
    id: 'h2', brand: 'Sonance', model: 'Sonance Earbuds Pro', price: 279,
    rating: 4.5, reviews: 5410, tags: ['in', 'anc', 'sport'],
    color: 'oklch(0.93 0.01 80)',
    specs: ['ANC', 'IPX4', '8 h + 24 h boîtier', 'Multipoint'],
  },
  {
    id: 'h3', brand: 'Aurora', model: 'AirPods Max 2', price: 579,
    rating: 4.6, reviews: 2103, tags: ['over', 'anc', 'audio'],
    color: 'oklch(0.85 0.02 200)',
    specs: ['Audio spatial', 'Puce H2', '20 h autonomie', 'USB-C lossless'],
  },
  {
    id: 'h4', brand: 'Aurora', model: 'AirPods Pro 3', price: 249,
    rating: 4.6, reviews: 8240, tags: ['in', 'anc', 'calls'],
    color: 'oklch(0.96 0.005 0)',
    specs: ['ANC adaptatif', 'Audio spatial', '6 h + 24 h boîtier', 'IP54'],
  },
  {
    id: 'h5', brand: 'Helix', model: 'Helix Momentum 5', price: 499,
    rating: 4.7, reviews: 1280, tags: ['over', 'audio', 'anc'],
    color: 'oklch(0.42 0.04 60)',
    specs: ['Drivers 42 mm', 'aptX Lossless', '60 h autonomie', 'Cuir véritable'],
  },
  {
    id: 'h6', brand: 'Pulse', model: 'Pulse Beat Studio', price: 199,
    rating: 4.3, reviews: 4502, tags: ['over', 'anc', 'sport'],
    color: 'oklch(0.55 0.18 25)',
    specs: ['ANC', '40 h autonomie', 'Pliable', 'Bluetooth 5.3'],
  },
  {
    id: 'h7', brand: 'Pulse', model: 'Pulse Fit Pro', price: 159,
    rating: 4.2, reviews: 3120, tags: ['in', 'sport'],
    color: 'oklch(0.7 0.16 140)',
    specs: ['IP57', 'Crochets sport', '10 h + 30 h', 'Capteur cardiaque'],
  },
  {
    id: 'h8', brand: 'Vortex', model: 'Vortex Studio Reference', price: 799,
    rating: 4.8, reviews: 412, tags: ['over', 'audio'],
    color: 'oklch(0.25 0.01 60)',
    specs: ['Drivers planaires', 'Filaire + sans fil', 'Hi-Res', '50 h autonomie'],
  },
];

function withCategory(items: RawProduct[], category: CategoryId): Product[] {
  return items.map((p) => ({ ...p, category, score: 0 }));
}

export const PRODUCTS: Record<CategoryId, Product[]> = {
  phone: withCategory(phones, 'phone'),
  laptop: withCategory(laptops, 'laptop'),
  headphones: withCategory(headphones, 'headphones'),
};
