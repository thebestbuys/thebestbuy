// scoring.jsx — calcule le score de match d'un produit selon les réponses

function scoreProduct(product, answers, questions) {
  // Base 60–72 (variation déterministe par id pour ne pas avoir 5 produits à 80%)
  const seed = product.id.charCodeAt(product.id.length - 1) * 7 % 13;
  let score = 60 + seed;
  let maxBonus = 0;

  // Pour chaque question répondue, ajoute des bonus
  questions.forEach((q) => {
    const answer = answers[q.id];
    if (!answer) return;

    if (q.id === 'budget') {
      const choice = q.choices.find((c) => c.id === answer);
      maxBonus += 18;
      if (choice) {
        const inBudget =
          (choice.max == null || product.price <= choice.max) &&
          (choice.min == null || product.price >= choice.min * 0.85);
        if (inBudget) {
          score += 18;
        } else if (choice.max != null && product.price > choice.max) {
          // Au-dessus du budget : pénalité douce proportionnelle
          const overshoot = (product.price - choice.max) / choice.max;
          score -= Math.min(28, Math.round(overshoot * 50));
        } else if (choice.min != null && product.price < choice.min * 0.6) {
          // Très en dessous = peut-être pas le segment voulu
          score -= 6;
        }
      }
    } else {
      const choice = q.choices.find((c) => c.id === answer);
      const tags = choice?.tags || [];
      maxBonus += 14;
      tags.forEach((tag) => {
        if (product.tags.includes(tag)) score += 10;
      });
      // Tag opposé = légère pénalité
      if (tags.includes('ios') && product.tags.includes('android')) score -= 18;
      if (tags.includes('android') && product.tags.includes('ios')) score -= 18;
      if (tags.includes('over') && product.tags.includes('in')) score -= 8;
      if (tags.includes('in') && product.tags.includes('over')) score -= 8;
    }
  });

  // Petit boost pour les meilleures notes
  score += Math.round((product.rating - 4) * 6);

  return Math.max(32, Math.min(99, Math.round(score)));
}

function rankProducts(products, answers, questions) {
  return products
    .map((p) => ({ ...p, score: scoreProduct(p, answers, questions) }))
    .sort((a, b) => b.score - a.score);
}

window.scoreProduct = scoreProduct;
window.rankProducts = rankProducts;
