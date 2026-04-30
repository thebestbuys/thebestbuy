import type { Product, Question, Answers } from '../types';

export function scoreProduct(product: Product, answers: Answers, questions: Question[]): number {
  const seed = product.id.charCodeAt(product.id.length - 1) * 7 % 13;
  let score = 60 + seed;

  questions.forEach((q) => {
    const answer = answers[q.id];
    if (!answer) return;

    if (q.id === 'budget') {
      const choice = q.choices.find((c) => c.id === answer);
      if (choice) {
        const inBudget =
          (choice.max == null || product.price <= choice.max) &&
          (choice.min == null || product.price >= choice.min * 0.85);
        if (inBudget) {
          score += 18;
        } else if (choice.max != null && product.price > choice.max) {
          const overshoot = (product.price - choice.max) / choice.max;
          score -= Math.min(28, Math.round(overshoot * 50));
        } else if (choice.min != null && product.price < choice.min * 0.6) {
          score -= 6;
        }
      }
    } else {
      const choice = q.choices.find((c) => c.id === answer);
      const tags = choice?.tags ?? [];
      tags.forEach((tag) => {
        if (product.tags.includes(tag)) score += 10;
      });
      if (tags.includes('ios') && product.tags.includes('android')) score -= 18;
      if (tags.includes('android') && product.tags.includes('ios')) score -= 18;
      if (tags.includes('over') && product.tags.includes('in')) score -= 8;
      if (tags.includes('in') && product.tags.includes('over')) score -= 8;
    }
  });

  score += Math.round((product.rating - 4) * 6);
  return Math.max(32, Math.min(99, Math.round(score)));
}

export function rankProducts(products: Product[], answers: Answers, questions: Question[]): Product[] {
  return products
    .map((p) => ({ ...p, score: scoreProduct(p, answers, questions) }))
    .sort((a, b) => b.score - a.score);
}
