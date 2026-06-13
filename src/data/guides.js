// Contenu éditorial original — guides d'achat rédigés pour Bestbuys.
// Chaque guide apporte une vraie valeur au lecteur (conseils, critères, sélection).

export const AFFILIATE_TAG = 'oraklia123-21';

// Construit un lien de recherche Amazon affilié.
export function affiliateSearch(query) {
  return `https://www.amazon.fr/s?k=${encodeURIComponent(query)}&tag=${AFFILIATE_TAG}`;
}

export const GUIDES = [
  {
    slug: 'choisir-smartphone-2026',
    category: 'phone',
    title: 'Comment choisir son smartphone en 2026',
    subtitle: "Écran, photo, autonomie, processeur : tout ce qui compte vraiment avant d'acheter.",
    readTime: '7 min',
    updated: 'Juin 2026',
    intro:
      "Le marché du smartphone n'a jamais été aussi vaste. Entre les modèles d'entrée de gamme à moins de 200 € et les flagships à plus de 1 500 €, l'écart de prix est énorme — mais l'écart d'usage réel, lui, l'est beaucoup moins qu'on ne le croit. Ce guide vous aide à identifier les critères qui changent vraiment votre quotidien, et ceux qui ne sont que du marketing.",
    sections: [
      {
        heading: '1. Définissez d\'abord votre budget réel',
        body: [
          "Avant de comparer des fiches techniques, fixez une fourchette. En 2026, on distingue grossièrement quatre segments : l'entrée de gamme (150–300 €), le milieu de gamme (300–600 €), le haut de gamme (600–1 000 €) et le premium (au-delà de 1 000 €).",
          "La bonne nouvelle : c'est le milieu de gamme qui a le plus progressé. Pour 400 à 500 €, on trouve aujourd'hui des écrans OLED 120 Hz, une charge rapide et des photos très correctes — soit 90 % de l'expérience d'un flagship pour la moitié du prix.",
        ],
      },
      {
        heading: '2. L\'écran : le critère qu\'on regarde toute la journée',
        body: [
          "C'est l'élément avec lequel vous interagissez en permanence. Privilégiez une dalle OLED (noirs profonds, meilleure efficacité énergétique) plutôt que LCD. Le taux de rafraîchissement de 90 ou 120 Hz rend le défilement nettement plus fluide — une fois qu'on y a goûté, difficile de revenir à 60 Hz.",
          "La luminosité compte aussi : visez au moins 800 nits si vous utilisez beaucoup votre téléphone en extérieur. En dessous, l'écran devient illisible en plein soleil.",
        ],
      },
      {
        heading: '3. La photo : le nombre de capteurs ne fait pas tout',
        body: [
          "Méfiez-vous des fiches annonçant « quadruple capteur ». Souvent, seuls un ou deux objectifs sont réellement utiles ; les autres (macro 2 Mpx, capteur de profondeur) ne servent qu'à gonfler le chiffre. Ce qui compte : la qualité du capteur principal, l'ouverture, et surtout le traitement logiciel.",
          "Si la photo est une priorité, regardez la présence d'un téléobjectif (zoom optique x3 ou x5) et d'un mode nuit performant. Les marques qui dominent ce terrain restent Apple, Google (Pixel) et les hauts de gamme Samsung.",
        ],
      },
      {
        heading: '4. Autonomie et charge : la batterie en mAh ne suffit pas',
        body: [
          "Une grosse batterie (5 000 mAh et plus) aide, mais l'autonomie réelle dépend autant de l'efficacité du processeur et de l'écran. Un bon indicateur : visez une journée pleine d'usage intensif sans recharge.",
          "Côté charge, la charge rapide (30 W et plus) est devenue un confort indispensable : récupérer 50 % en 20 minutes change la vie. Vérifiez si le chargeur est fourni — ce n'est plus systématique.",
        ],
      },
      {
        heading: '5. iOS ou Android : une question d\'écosystème',
        body: [
          "Si vous avez déjà d'autres produits Apple (Mac, iPad, AirPods, Apple Watch), un iPhone s'intègrera parfaitement. Android offre en revanche plus de choix de tarifs, de personnalisation et de matériel.",
          "Pensez aussi au suivi logiciel : Apple et Google Pixel offrent désormais jusqu'à 7 ans de mises à jour. C'est un vrai critère de durabilité — un téléphone bien suivi reste sécurisé et fluide bien plus longtemps.",
        ],
      },
    ],
    checklist: [
      'Écran OLED, 90 ou 120 Hz, au moins 800 nits',
      'Capteur photo principal de qualité plutôt que multiplication des objectifs',
      'Autonomie d\'une journée pleine + charge rapide 30 W minimum',
      'Au moins 5 ans de mises à jour logicielles garanties',
      '128 Go de stockage minimum (256 Go si vous filmez beaucoup)',
    ],
    picks: [
      { budget: 'Petit budget (~250 €)', query: 'smartphone milieu de gamme oled 120hz', note: 'Le meilleur rapport qualité-prix actuel.' },
      { budget: 'Polyvalent (~500 €)', query: 'smartphone photo oled 120hz 256go', note: 'L\'équilibre idéal photo / autonomie / fluidité.' },
      { budget: 'Premium photo (~1000 €+)', query: 'smartphone premium teleobjectif appareil photo', note: 'Pour qui la photo passe avant tout.' },
    ],
  },

  {
    slug: 'choisir-ordinateur-portable',
    category: 'laptop',
    title: 'Bien choisir son ordinateur portable',
    subtitle: 'Processeur, RAM, écran, autonomie : le guide pour ne pas payer ce dont vous n\'avez pas besoin.',
    readTime: '8 min',
    updated: 'Juin 2026',
    intro:
      "Choisir un ordinateur portable, c'est arbitrer entre puissance, autonomie, poids et prix. Un étudiant, un graphiste et un joueur n'ont pas les mêmes besoins — et payer pour de la puissance qu'on n'exploite jamais est l'erreur la plus courante. Ce guide décode les caractéristiques qui comptent selon votre usage.",
    sections: [
      {
        heading: '1. Partez de votre usage, pas de la fiche technique',
        body: [
          "Bureautique, navigation et streaming ? Un processeur d'entrée/milieu de gamme et 16 Go de RAM suffisent amplement. Montage vidéo, 3D ou jeu ? Là, le processeur, la carte graphique et la RAM deviennent déterminants.",
          "Définir l'usage en amont évite de surpayer. Inutile d'acheter une machine de gamer à 1 800 € pour faire du traitement de texte et des visioconférences.",
        ],
      },
      {
        heading: '2. Le processeur (CPU) : comprendre les gammes',
        body: [
          "Chez Intel, les Core i3/i5/i7/i9 montent en puissance ; idem chez AMD avec les Ryzen 3/5/7/9. Pour la bureautique, un i5 ou Ryzen 5 récent est le point d'équilibre parfait. Pour la création ou le jeu, visez i7 / Ryzen 7 ou plus.",
          "Les puces Apple Silicon (M3, M4…) méritent une mention : elles offrent une autonomie et un silence de fonctionnement remarquables, au prix d'un écosystème macOS fermé.",
        ],
      },
      {
        heading: '3. RAM et stockage : les deux faux pas à éviter',
        body: [
          "16 Go de RAM est le minimum confortable en 2026. 8 Go suffisent encore pour un usage très léger, mais limitent le multitâche. Pour la création, visez 32 Go.",
          "Côté stockage, exigez un SSD (jamais un disque dur mécanique). 512 Go est un bon point de départ ; 1 To si vous stockez photos et vidéos en local. Un SSD transforme la réactivité de la machine — démarrage en quelques secondes.",
        ],
      },
      {
        heading: '4. L\'écran et le poids : le confort au quotidien',
        body: [
          "Une dalle IPS Full HD (1920×1080) est le standard minimum. Pour les yeux et la création, une définition supérieure (2K, 3K) et une dalle bien calibrée font la différence. Évitez les dalles brillantes si vous travaillez près d'une fenêtre.",
          "Le poids est sous-estimé : entre un ultraportable de 1,2 kg et un 15 pouces de 2,2 kg, la différence se ressent vite dans un sac. Si vous êtes souvent en déplacement, le poids et l'autonomie priment sur la puissance brute.",
        ],
      },
      {
        heading: '5. Autonomie et connectique',
        body: [
          "Une bonne autonomie (8 à 12 h annoncées, comptez 30 % de moins en usage réel) vous libère du chargeur. Les ultraportables et les MacBook excellent ici.",
          "Vérifiez la connectique : au moins un port USB-C (idéalement avec charge et affichage), un USB-A pour les périphériques, et un HDMI si vous branchez des écrans. Le tout-USB-C oblige parfois à acheter des adaptateurs.",
        ],
      },
    ],
    checklist: [
      'Processeur i5 / Ryzen 5 récent minimum (i7 / Ryzen 7 pour la création)',
      '16 Go de RAM (32 Go pour montage / 3D)',
      'SSD de 512 Go minimum, jamais de disque mécanique',
      'Écran IPS Full HD au moins, mat de préférence',
      'Poids et autonomie adaptés à votre mobilité',
    ],
    picks: [
      { budget: 'Étudiant / bureautique (~600 €)', query: 'ordinateur portable 16go ssd 512 ips', note: 'Fluide pour le quotidien, sans superflu.' },
      { budget: 'Polyvalent / création (~1000 €)', query: 'ordinateur portable i7 16go ssd 1to', note: 'Assez puissant pour le montage léger.' },
      { budget: 'Ultraportable premium (~1500 €+)', query: 'ultraportable leger autonomie oled', note: 'Léger, endurant, silencieux.' },
    ],
  },

  {
    slug: 'casque-ou-ecouteurs',
    category: 'headphones',
    title: 'Casque ou écouteurs : le guide complet',
    subtitle: 'Réduction de bruit, autonomie, confort, qualité sonore : comment bien choisir selon votre usage.',
    readTime: '6 min',
    updated: 'Juin 2026',
    intro:
      "Casque circum-aural ou écouteurs intra ? Avec ou sans réduction de bruit active ? La réponse dépend entièrement de votre usage : transports, sport, télétravail ou écoute à la maison. Ce guide fait le tri entre les caractéristiques essentielles et les arguments purement commerciaux.",
    sections: [
      {
        heading: '1. Casque ou écouteurs : le bon format pour le bon usage',
        body: [
          "Le casque (qui englobe l'oreille) offre généralement un meilleur son, une réduction de bruit plus efficace et un grand confort sur la durée — idéal au bureau ou à la maison. Son défaut : l'encombrement.",
          "Les écouteurs sans fil (true wireless) gagnent en discrétion et en praticité pour le sport ou les déplacements. La qualité a énormément progressé : les meilleurs modèles rivalisent désormais avec des casques sur la réduction de bruit.",
        ],
      },
      {
        heading: '2. La réduction de bruit active (ANC) : un vrai game-changer',
        body: [
          "Si vous prenez souvent les transports en commun ou l'avion, l'ANC change radicalement l'expérience : elle atténue les bruits graves constants (moteur, climatisation). Toutes les ANC ne se valent pas — les modèles premium isolent nettement mieux.",
          "Pensez aussi au mode « transparence », qui laisse passer les sons extérieurs sans retirer le casque. Pratique pour rester attentif à son environnement (annonces, circulation).",
        ],
      },
      {
        heading: '3. Autonomie et confort',
        body: [
          "Pour un casque, visez 25 à 30 h d'autonomie ; pour des écouteurs, 6 à 8 h plus plusieurs recharges via le boîtier. La charge rapide (quelques minutes pour plusieurs heures d'écoute) dépanne bien.",
          "Le confort est subjectif mais crucial : poids du casque, pression sur les oreilles, qualité des embouts pour les intra. Un mauvais maintien gâche même le meilleur son.",
        ],
      },
      {
        heading: '4. La qualité sonore et les codecs',
        body: [
          "Une bonne signature sonore est équilibrée : des basses présentes mais non envahissantes, des médiums clairs (voix) et des aigus précis. Méfiez-vous des modèles qui surchargent les basses pour « impressionner » en magasin.",
          "Côté Bluetooth, les codecs AAC (Apple) et aptX / LDAC (Android) améliorent la qualité sans fil. C'est un plus appréciable pour les mélomanes, secondaire pour un usage podcast / visio.",
        ],
      },
    ],
    checklist: [
      'Format adapté : casque pour le confort/son, intra pour la mobilité',
      'Réduction de bruit active si transports fréquents',
      'Mode transparence pour rester attentif à l\'environnement',
      'Autonomie : 25 h+ (casque) ou 6 h+ avec boîtier (intra)',
      'Signature sonore équilibrée, codecs AAC / aptX / LDAC',
    ],
    picks: [
      { budget: 'Petit budget (~80 €)', query: 'casque bluetooth reduction de bruit', note: 'L\'ANC accessible, l\'essentiel bien fait.' },
      { budget: 'Écouteurs sport (~150 €)', query: 'ecouteurs sans fil sport reduction bruit', note: 'Discrets et endurants pour bouger.' },
      { budget: 'Casque premium (~350 €+)', query: 'casque premium reduction de bruit hifi', note: 'Le top du confort et du silence.' },
    ],
  },
];

export function getGuide(slug) {
  return GUIDES.find((g) => g.slug === slug) || null;
}
