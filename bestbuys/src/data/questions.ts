import type { CategoryId, Question } from '../types';

export const QUESTIONS: Record<CategoryId, Question[]> = {
  phone: [
    {
      id: 'usage',
      text: "Quel est l'usage principal du téléphone ?",
      choices: [
        { id: 'photo', label: 'Photo & vidéo', tags: ['camera'] },
        { id: 'gaming', label: 'Jeux & performance', tags: ['perf'] },
        { id: 'daily', label: 'Usage quotidien', tags: ['balanced'] },
        { id: 'pro', label: 'Travail & productivité', tags: ['pro'] },
      ],
    },
    {
      id: 'budget',
      text: 'Quel budget envisagez-vous ?',
      choices: [
        { id: 'low', label: 'Moins de 500 €', max: 500 },
        { id: 'mid', label: '500 – 900 €', min: 500, max: 900 },
        { id: 'high', label: '900 – 1 300 €', min: 900, max: 1300 },
        { id: 'top', label: 'Plus de 1 300 €', min: 1300 },
      ],
    },
    {
      id: 'ecosystem',
      text: "Avez-vous une préférence d'écosystème ?",
      choices: [
        { id: 'apple', label: 'iOS / Apple', tags: ['ios'] },
        { id: 'android', label: 'Android', tags: ['android'] },
        { id: 'none', label: 'Aucune préférence', tags: [] },
      ],
    },
  ],
  laptop: [
    {
      id: 'usage',
      text: 'Pour quel usage principal ?',
      choices: [
        { id: 'creative', label: 'Création (vidéo, design)', tags: ['creative'] },
        { id: 'dev', label: 'Développement / data', tags: ['perf', 'dev'] },
        { id: 'office', label: 'Bureautique & web', tags: ['balanced'] },
        { id: 'gaming', label: 'Gaming', tags: ['gaming'] },
      ],
    },
    {
      id: 'portability',
      text: 'Quelle importance pour la portabilité ?',
      choices: [
        { id: 'ultra', label: 'Très portable (< 1.4 kg)', tags: ['portable'] },
        { id: 'mid', label: 'Équilibré', tags: ['balanced'] },
        { id: 'desktop', label: 'Performance avant tout', tags: ['perf'] },
      ],
    },
    {
      id: 'budget',
      text: 'Quel budget envisagez-vous ?',
      choices: [
        { id: 'low', label: 'Moins de 1 000 €', max: 1000 },
        { id: 'mid', label: '1 000 – 1 800 €', min: 1000, max: 1800 },
        { id: 'high', label: '1 800 – 2 500 €', min: 1800, max: 2500 },
        { id: 'top', label: 'Plus de 2 500 €', min: 2500 },
      ],
    },
  ],
  headphones: [
    {
      id: 'type',
      text: 'Quel format préférez-vous ?',
      choices: [
        { id: 'over', label: 'Casque circum-aural', tags: ['over'] },
        { id: 'in', label: 'Écouteurs intra-auriculaires', tags: ['in'] },
        { id: 'any', label: 'Peu importe', tags: [] },
      ],
    },
    {
      id: 'priority',
      text: 'Quelle est votre priorité ?',
      choices: [
        { id: 'anc', label: 'Réduction de bruit', tags: ['anc'] },
        { id: 'audio', label: 'Qualité audio audiophile', tags: ['audio'] },
        { id: 'sport', label: 'Sport & résistance', tags: ['sport'] },
        { id: 'calls', label: 'Appels & télétravail', tags: ['calls'] },
      ],
    },
    {
      id: 'budget',
      text: 'Quel budget envisagez-vous ?',
      choices: [
        { id: 'low', label: 'Moins de 150 €', max: 150 },
        { id: 'mid', label: '150 – 300 €', min: 150, max: 300 },
        { id: 'high', label: '300 – 500 €', min: 300, max: 500 },
        { id: 'top', label: 'Plus de 500 €', min: 500 },
      ],
    },
  ],
};
