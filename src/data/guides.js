// Contenu éditorial original — guides d'achat rédigés pour Oraklia (FR + EN).
// Original editorial content — buying guides written for Oraklia (FR + EN).

export const AFFILIATE_TAG = 'oraklia123-21';

// Construit un lien de recherche Amazon affilié.
export function affiliateSearch(query) {
  return `https://www.amazon.fr/s?k=${encodeURIComponent(query)}&tag=${AFFILIATE_TAG}`;
}

export const GUIDES = [
  {
    slug: 'choisir-smartphone-2026',
    category: 'phone',
    content: {
      fr: {
        title: 'Comment choisir son smartphone en 2026',
        subtitle: "Écran, photo, autonomie, processeur : tout ce qui compte vraiment avant d'acheter.",
        readTime: '7 min',
        updated: 'Juin 2026',
        intro:
          "Le marché du smartphone n'a jamais été aussi vaste. Entre les modèles d'entrée de gamme à moins de 200 € et les flagships à plus de 1 500 €, l'écart de prix est énorme — mais l'écart d'usage réel, lui, l'est beaucoup moins qu'on ne le croit. Ce guide vous aide à identifier les critères qui changent vraiment votre quotidien, et ceux qui ne sont que du marketing.",
        sections: [
          {
            heading: "1. Définissez d'abord votre budget réel",
            body: [
              "Avant de comparer des fiches techniques, fixez une fourchette. En 2026, on distingue grossièrement quatre segments : l'entrée de gamme (150–300 €), le milieu de gamme (300–600 €), le haut de gamme (600–1 000 €) et le premium (au-delà de 1 000 €).",
              "La bonne nouvelle : c'est le milieu de gamme qui a le plus progressé. Pour 400 à 500 €, on trouve aujourd'hui des écrans OLED 120 Hz, une charge rapide et des photos très correctes — soit 90 % de l'expérience d'un flagship pour la moitié du prix.",
            ],
          },
          {
            heading: "2. L'écran : le critère qu'on regarde toute la journée",
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
            heading: "4. Autonomie et charge : la batterie en mAh ne suffit pas",
            body: [
              "Une grosse batterie (5 000 mAh et plus) aide, mais l'autonomie réelle dépend autant de l'efficacité du processeur et de l'écran. Un bon indicateur : visez une journée pleine d'usage intensif sans recharge.",
              "Côté charge, la charge rapide (30 W et plus) est devenue un confort indispensable : récupérer 50 % en 20 minutes change la vie. Vérifiez si le chargeur est fourni — ce n'est plus systématique.",
            ],
          },
          {
            heading: "5. iOS ou Android : une question d'écosystème",
            body: [
              "Si vous avez déjà d'autres produits Apple (Mac, iPad, AirPods, Apple Watch), un iPhone s'intégrera parfaitement. Android offre en revanche plus de choix de tarifs, de personnalisation et de matériel.",
              "Pensez aussi au suivi logiciel : Apple et Google Pixel offrent désormais jusqu'à 7 ans de mises à jour. C'est un vrai critère de durabilité — un téléphone bien suivi reste sécurisé et fluide bien plus longtemps.",
            ],
          },
        ],
        checklist: [
          'Écran OLED, 90 ou 120 Hz, au moins 800 nits',
          'Capteur photo principal de qualité plutôt que multiplication des objectifs',
          "Autonomie d'une journée pleine + charge rapide 30 W minimum",
          'Au moins 5 ans de mises à jour logicielles garanties',
          '128 Go de stockage minimum (256 Go si vous filmez beaucoup)',
        ],
        picks: [
          { budget: 'Petit budget · ~250 €', name: 'Samsung Galaxy A35 5G (128 Go)', note: 'Excellent rapport qualité-prix, écran AMOLED 120 Hz.', url: 'https://amzn.to/4vQYVx0' },
          { budget: 'Polyvalent · ~500 €', name: 'Google Pixel 8a (128 Go)', note: 'La photo de référence à ce prix, 7 ans de mises à jour.', url: 'https://amzn.to/43tSfIX' },
          { budget: 'Premium · ~885 €', name: 'Apple iPhone 17 (256 Go)', note: "Le meilleur de l'écosystème Apple : photo et longévité au top.", url: 'https://amzn.to/4ousimb' },
        ],
      },
      en: {
        title: 'How to choose your smartphone in 2026',
        subtitle: 'Display, camera, battery life, processor: everything that truly matters before you buy.',
        readTime: '7 min',
        updated: 'June 2026',
        intro:
          "The smartphone market has never been so vast. Between entry-level models under €200 and flagships over €1,500, the price gap is huge — but the gap in real-world use is far smaller than you'd think. This guide helps you identify the criteria that genuinely change your daily life, and those that are just marketing.",
        sections: [
          {
            heading: '1. Start by setting your real budget',
            body: [
              "Before comparing spec sheets, set a range. In 2026 there are roughly four segments: entry-level (€150–300), mid-range (€300–600), high-end (€600–1,000) and premium (above €1,000).",
              "The good news: the mid-range has improved the most. For €400 to €500 you now get 120 Hz OLED displays, fast charging and very decent photos — about 90% of a flagship experience for half the price.",
            ],
          },
          {
            heading: '2. The display: what you look at all day',
            body: [
              "This is what you interact with constantly. Favour an OLED panel (deep blacks, better energy efficiency) over LCD. A 90 or 120 Hz refresh rate makes scrolling noticeably smoother — once you've tried it, going back to 60 Hz is hard.",
              "Brightness matters too: aim for at least 800 nits if you use your phone a lot outdoors. Below that, the screen becomes unreadable in direct sunlight.",
            ],
          },
          {
            heading: "3. The camera: the number of sensors isn't everything",
            body: [
              'Be wary of sheets boasting "quad camera". Often only one or two lenses are truly useful; the others (2 MP macro, depth sensor) just inflate the number. What counts: the quality of the main sensor, the aperture, and above all the software processing.',
              'If photography is a priority, look for a telephoto lens (3x or 5x optical zoom) and a strong night mode. The brands that dominate here remain Apple, Google (Pixel) and high-end Samsung.',
            ],
          },
          {
            heading: '4. Battery and charging: mAh alone is not enough',
            body: [
              "A big battery (5,000 mAh and up) helps, but real battery life depends just as much on processor and display efficiency. A good benchmark: aim for a full day of heavy use without recharging.",
              "For charging, fast charging (30 W and up) has become essential comfort: getting 50% in 20 minutes is life-changing. Check whether the charger is included — that's no longer a given.",
            ],
          },
          {
            heading: '5. iOS or Android: a question of ecosystem',
            body: [
              "If you already own other Apple products (Mac, iPad, AirPods, Apple Watch), an iPhone will fit in perfectly. Android, on the other hand, offers more price points, customization and hardware choice.",
              "Also consider software support: Apple and Google Pixel now offer up to 7 years of updates. It's a real durability criterion — a well-supported phone stays secure and smooth far longer.",
            ],
          },
        ],
        checklist: [
          'OLED display, 90 or 120 Hz, at least 800 nits',
          'A quality main camera rather than a pile of extra lenses',
          'A full day of battery life + 30 W fast charging minimum',
          'At least 5 years of guaranteed software updates',
          '128 GB of storage minimum (256 GB if you shoot a lot of video)',
        ],
        picks: [
          { budget: 'Small budget · ~€250', name: 'Samsung Galaxy A35 5G (128 GB)', note: 'Great value, 120 Hz AMOLED display.', url: 'https://amzn.to/4vQYVx0' },
          { budget: 'All-rounder · ~€500', name: 'Google Pixel 8a (128 GB)', note: 'Benchmark camera at this price, 7 years of updates.', url: 'https://amzn.to/43tSfIX' },
          { budget: 'Premium · ~€885', name: 'Apple iPhone 17 (256 GB)', note: 'The best of the Apple ecosystem: top camera and longevity.', url: 'https://amzn.to/4ousimb' },
        ],
      },
    },
  },

  {
    slug: 'choisir-ordinateur-portable',
    category: 'laptop',
    content: {
      fr: {
        title: 'Bien choisir son ordinateur portable',
        subtitle: "Processeur, RAM, écran, autonomie : le guide pour ne pas payer ce dont vous n'avez pas besoin.",
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
            heading: "4. L'écran et le poids : le confort au quotidien",
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
          { budget: 'Étudiant / bureautique · ~600 €', name: 'Lenovo IdeaPad Slim 5 14" (i7, 16 Go, 512 Go SSD)', note: 'Fluide pour le quotidien : Core i7, 16 Go, SSD rapide.', url: 'https://amzn.to/4vL0Gvm' },
          { budget: 'Polyvalent / création · ~1000 €', name: 'Apple MacBook Air M2 13" (256 Go)', note: 'Silencieux, endurant, idéal pour la création légère.', url: 'https://amzn.to/4v52pf5' },
          { budget: 'Premium · ~1500 €', name: 'Apple MacBook Air 15" M5 (16 Go, 512 Go)', note: 'Grand écran Liquid Retina, puce M5, autonomie exceptionnelle.', url: 'https://amzn.to/4eqv7Qx' },
        ],
      },
      en: {
        title: 'How to choose the right laptop',
        subtitle: "Processor, RAM, display, battery: the guide to not paying for what you don't need.",
        readTime: '8 min',
        updated: 'June 2026',
        intro:
          "Choosing a laptop means balancing power, battery life, weight and price. A student, a designer and a gamer don't have the same needs — and paying for power you never use is the most common mistake. This guide decodes the specs that matter for your use case.",
        sections: [
          {
            heading: '1. Start from your usage, not the spec sheet',
            body: [
              "Office work, browsing and streaming? An entry/mid-range processor and 16 GB of RAM are plenty. Video editing, 3D or gaming? Then the processor, graphics card and RAM become decisive.",
              "Defining your usage up front avoids overspending. No need to buy an €1,800 gaming machine for word processing and video calls.",
            ],
          },
          {
            heading: '2. The processor (CPU): understanding the ranges',
            body: [
              "At Intel, Core i3/i5/i7/i9 rise in power; same with AMD's Ryzen 3/5/7/9. For office work, a recent i5 or Ryzen 5 is the perfect sweet spot. For creation or gaming, aim for i7 / Ryzen 7 or higher.",
              "Apple Silicon chips (M3, M4…) deserve a mention: they offer remarkable battery life and silent operation, at the cost of a closed macOS ecosystem.",
            ],
          },
          {
            heading: '3. RAM and storage: the two mistakes to avoid',
            body: [
              "16 GB of RAM is the comfortable minimum in 2026. 8 GB is still fine for very light use but limits multitasking. For creative work, aim for 32 GB.",
              "For storage, insist on an SSD (never a mechanical hard drive). 512 GB is a good starting point; 1 TB if you store photos and videos locally. An SSD transforms responsiveness — boots in a few seconds.",
            ],
          },
          {
            heading: '4. Display and weight: everyday comfort',
            body: [
              "An IPS Full HD panel (1920×1080) is the minimum standard. For your eyes and for creative work, a higher resolution (2K, 3K) and a well-calibrated panel make a difference. Avoid glossy panels if you work near a window.",
              "Weight is underrated: between a 1.2 kg ultraportable and a 2.2 kg 15-inch, the difference is felt quickly in a bag. If you travel often, weight and battery life trump raw power.",
            ],
          },
          {
            heading: '5. Battery life and connectivity',
            body: [
              "Good battery life (8 to 12 h claimed, expect 30% less in real use) frees you from the charger. Ultraportables and MacBooks excel here.",
              "Check the ports: at least one USB-C (ideally with charging and display output), a USB-A for peripherals, and an HDMI if you connect monitors. All-USB-C sometimes forces you to buy adapters.",
            ],
          },
        ],
        checklist: [
          'Recent i5 / Ryzen 5 minimum (i7 / Ryzen 7 for creation)',
          '16 GB of RAM (32 GB for editing / 3D)',
          '512 GB SSD minimum, never a mechanical drive',
          'IPS Full HD display at least, matte preferred',
          'Weight and battery life suited to your mobility',
        ],
        picks: [
          { budget: 'Student / office · ~€600', name: 'Lenovo IdeaPad Slim 5 14" (i7, 16 GB, 512 GB SSD)', note: 'Smooth daily driver: Core i7, 16 GB, fast SSD.', url: 'https://amzn.to/4vL0Gvm' },
          { budget: 'All-round / creation · ~€1000', name: 'Apple MacBook Air M2 13" (256 GB)', note: 'Silent, enduring, ideal for light creative work.', url: 'https://amzn.to/4v52pf5' },
          { budget: 'Premium · ~€1500', name: 'Apple MacBook Air 15" M5 (16 GB, 512 GB)', note: 'Large Liquid Retina screen, M5 chip, exceptional battery.', url: 'https://amzn.to/4eqv7Qx' },
        ],
      },
    },
  },

  {
    slug: 'casque-ou-ecouteurs',
    category: 'headphones',
    content: {
      fr: {
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
          "Mode transparence pour rester attentif à l'environnement",
          'Autonomie : 25 h+ (casque) ou 6 h+ avec boîtier (intra)',
          'Signature sonore équilibrée, codecs AAC / aptX / LDAC',
        ],
        picks: [
          { budget: 'Petit budget · ~80 €', name: 'Soundcore Liberty 5 by Anker', note: 'Écouteurs ANC abordables au son équilibré.', url: 'https://amzn.to/4e6zNfx' },
          { budget: 'Polyvalent · ~150 €', name: 'Apple AirPods 4', note: 'Confort et intégration Apple, parfaits au quotidien.', url: 'https://amzn.to/3Qft9um' },
          { budget: 'Premium · ~575 €', name: 'Apple AirPods Max', note: 'Casque haut de gamme : réduction de bruit et son immersif.', url: 'https://amzn.to/4xq3TCn' },
        ],
      },
      en: {
        title: 'Headphones or earbuds: the complete guide',
        subtitle: 'Noise cancellation, battery life, comfort, sound quality: how to choose for your use.',
        readTime: '6 min',
        updated: 'June 2026',
        intro:
          "Over-ear headphones or in-ear earbuds? With or without active noise cancellation? The answer depends entirely on your use: commuting, sport, working from home or listening at home. This guide separates the essential features from purely commercial arguments.",
        sections: [
          {
            heading: '1. Headphones or earbuds: the right format for the right use',
            body: [
              "Over-ear headphones generally offer better sound, more effective noise cancellation and great long-term comfort — ideal at the office or at home. Their downside: bulk.",
              "True wireless earbuds win on discretion and convenience for sport or travel. Quality has improved enormously: the best models now rival headphones on noise cancellation.",
            ],
          },
          {
            heading: '2. Active noise cancellation (ANC): a real game-changer',
            body: [
              "If you often take public transport or planes, ANC radically changes the experience: it dampens constant low-frequency noise (engine, air conditioning). Not all ANC is equal — premium models isolate noticeably better.",
              'Also consider "transparency" mode, which lets outside sounds through without removing the headphones. Handy to stay aware of your surroundings (announcements, traffic).',
            ],
          },
          {
            heading: '3. Battery life and comfort',
            body: [
              "For headphones, aim for 25 to 30 h of battery; for earbuds, 6 to 8 h plus several recharges from the case. Fast charging (a few minutes for several hours of listening) is a real help.",
              "Comfort is subjective but crucial: headphone weight, pressure on the ears, ear-tip quality for in-ears. A poor fit ruins even the best sound.",
            ],
          },
          {
            heading: '4. Sound quality and codecs',
            body: [
              'A good sound signature is balanced: present but not overwhelming bass, clear mids (voices) and precise highs. Be wary of models that overload the bass to "impress" in store.',
              "On Bluetooth, AAC (Apple) and aptX / LDAC (Android) codecs improve wireless quality. It's a nice plus for audiophiles, secondary for podcast / video-call use.",
            ],
          },
        ],
        checklist: [
          'Right format: headphones for comfort/sound, earbuds for mobility',
          'Active noise cancellation if you commute often',
          'Transparency mode to stay aware of your surroundings',
          'Battery: 25 h+ (headphones) or 6 h+ with case (earbuds)',
          'Balanced sound signature, AAC / aptX / LDAC codecs',
        ],
        picks: [
          { budget: 'Small budget · ~€80', name: 'Soundcore Liberty 5 by Anker', note: 'Affordable ANC earbuds with balanced sound.', url: 'https://amzn.to/4e6zNfx' },
          { budget: 'All-round · ~€150', name: 'Apple AirPods 4', note: 'Comfort and Apple integration, great everyday earbuds.', url: 'https://amzn.to/3Qft9um' },
          { budget: 'Premium · ~€575', name: 'Apple AirPods Max', note: 'High-end headphones: noise cancellation and immersive sound.', url: 'https://amzn.to/4xq3TCn' },
        ],
      },
    },
  },

  {
    slug: 'choisir-televiseur-2026',
    category: 'tv',
    content: {
      fr: {
        title: 'Comment choisir son téléviseur en 2026',
        subtitle: 'OLED, QLED, Mini-LED, taille, HDMI 2.1 : décryptage des critères qui comptent vraiment.',
        readTime: '7 min',
        updated: 'Juin 2026',
        intro:
          "Acheter une télé en 2026 revient à naviguer dans une jungle d'acronymes : OLED, QLED, Mini-LED, HDR10+, Dolby Vision… Pourtant, derrière le jargon, seuls quelques critères déterminent réellement la qualité d'image perçue dans votre salon. Ce guide vous aide à choisir la bonne dalle, la bonne taille et les bonnes fonctions selon votre usage (films, sport, jeu vidéo).",
        sections: [
          {
            heading: '1. La technologie de dalle : OLED, QLED ou Mini-LED ?',
            body: [
              "L'OLED offre les meilleurs noirs (chaque pixel s'éteint individuellement) et un contraste infini — idéal pour les films dans une pièce sombre. Son point faible : une luminosité plus modérée et un risque théorique de marquage en usage intensif d'images fixes.",
              "Le QLED et surtout le Mini-LED montent beaucoup plus haut en luminosité, ce qui les rend excellents dans une pièce lumineuse et en HDR. Le Mini-LED, grâce à ses milliers de zones de rétroéclairage, se rapproche du contraste de l'OLED tout en restant plus abordable en grand format.",
            ],
          },
          {
            heading: '2. La taille : plus grand qu\'on ne le pense',
            body: [
              "L'erreur la plus fréquente est de voir trop petit. Avec les définitions 4K actuelles, on peut s'asseoir bien plus près sans voir les pixels. Règle pratique : pour un recul de 2,5 à 3 m, un écran de 55 à 65 pouces est un excellent point de départ.",
              "Mesurez la distance entre votre canapé et l'emplacement de la télé, puis choisissez la plus grande diagonale qui reste confortable. On regrette rarement d'avoir pris trop grand.",
            ],
          },
          {
            heading: '3. HDR et luminosité : le vrai saut de qualité',
            body: [
              "Le HDR (High Dynamic Range) élargit la plage entre les zones sombres et lumineuses : c'est souvent plus spectaculaire que la simple résolution. Privilégiez les formats Dolby Vision et HDR10+, mieux gérés par les contenus Netflix, Disney+ ou les Blu-ray.",
              "Pour que le HDR soit convaincant, la télé doit être suffisamment lumineuse : visez au moins 600 nits, idéalement 1 000 nits et plus sur les modèles haut de gamme.",
            ],
          },
          {
            heading: '4. Le jeu vidéo : HDMI 2.1 et 120 Hz',
            body: [
              "Si vous jouez sur PS5, Xbox Series ou PC récent, vérifiez la présence de ports HDMI 2.1, du 120 Hz, du VRR (taux de rafraîchissement variable) et de l'ALLM (mode faible latence automatique). Ces fonctions rendent le jeu nettement plus fluide et réactif.",
              "Regardez aussi l'input lag annoncé (idéalement sous 15 ms en mode jeu). Toutes les télés ne se valent pas sur ce point, même à prix équivalent.",
            ],
          },
          {
            heading: '5. Son et système : ne négligez pas l\'ensemble',
            body: [
              "Les télés ultra-fines ont souvent un son décevant. Si le cinéma compte pour vous, prévoyez une barre de son — l'amélioration est immédiate. Vérifiez la présence de la sortie eARC (HDMI) pour la brancher facilement.",
              "Côté logiciel, les systèmes (Google TV, Tizen, webOS) sont tous corrects aujourd'hui. Vérifiez surtout que vos applications favorites sont disponibles et que l'interface reste fluide dans le temps.",
            ],
          },
        ],
        checklist: [
          'Dalle adaptée : OLED en pièce sombre, Mini-LED/QLED en pièce lumineuse',
          'Taille généreuse selon le recul (55–65" pour 2,5–3 m)',
          'HDR Dolby Vision / HDR10+ et au moins 600 nits',
          'HDMI 2.1 + 120 Hz + VRR si vous jouez sur console récente',
          'Barre de son prévue + sortie eARC pour le home cinéma',
        ],
        picks: [
          { budget: 'Petit budget · ~500 €', name: 'TV 4K LED 55" Samsung Crystal', note: 'Bon rapport taille/prix pour un salon lumineux.', query: 'TV Samsung Crystal 4K 55 pouces' },
          { budget: 'Polyvalent · ~1000 €', name: 'TV Mini-LED 65" (HDMI 2.1, 120 Hz)', note: 'Excellente luminosité HDR et fonctions gaming.', query: 'TV Mini-LED 65 pouces 120Hz HDMI 2.1' },
          { budget: 'Premium · ~1800 €', name: 'TV OLED 65" Dolby Vision', note: "Noirs parfaits et contraste infini pour le cinéma.", query: 'TV OLED 65 pouces Dolby Vision' },
        ],
      },
      en: {
        title: 'How to choose your TV in 2026',
        subtitle: 'OLED, QLED, Mini-LED, size, HDMI 2.1: decoding the criteria that truly matter.',
        readTime: '7 min',
        updated: 'June 2026',
        intro:
          "Buying a TV in 2026 means navigating a jungle of acronyms: OLED, QLED, Mini-LED, HDR10+, Dolby Vision… Yet behind the jargon, only a handful of criteria actually determine the picture quality you perceive in your living room. This guide helps you pick the right panel, the right size and the right features for your use (movies, sport, gaming).",
        sections: [
          {
            heading: '1. Panel technology: OLED, QLED or Mini-LED?',
            body: [
              "OLED delivers the best blacks (each pixel turns off individually) and infinite contrast — ideal for movies in a dark room. Its weakness: more moderate brightness and a theoretical risk of burn-in with heavy static-image use.",
              "QLED and especially Mini-LED reach much higher brightness, making them excellent in a bright room and in HDR. Thanks to its thousands of backlight zones, Mini-LED approaches OLED contrast while staying more affordable in large sizes.",
            ],
          },
          {
            heading: '2. Size: bigger than you think',
            body: [
              "The most common mistake is going too small. With today's 4K resolutions, you can sit much closer without seeing pixels. Rule of thumb: for a 2.5 to 3 m viewing distance, a 55 to 65-inch screen is an excellent starting point.",
              "Measure the distance between your sofa and the TV location, then choose the largest diagonal that stays comfortable. People rarely regret going too big.",
            ],
          },
          {
            heading: '3. HDR and brightness: the real quality leap',
            body: [
              "HDR (High Dynamic Range) widens the range between dark and bright areas: it's often more spectacular than resolution alone. Favour Dolby Vision and HDR10+ formats, better handled by Netflix, Disney+ content or Blu-rays.",
              "For HDR to be convincing, the TV must be bright enough: aim for at least 600 nits, ideally 1,000 nits and up on high-end models.",
            ],
          },
          {
            heading: '4. Gaming: HDMI 2.1 and 120 Hz',
            body: [
              "If you game on PS5, Xbox Series or a recent PC, check for HDMI 2.1 ports, 120 Hz, VRR (variable refresh rate) and ALLM (automatic low-latency mode). These features make gaming noticeably smoother and more responsive.",
              "Also look at the stated input lag (ideally under 15 ms in game mode). Not all TVs are equal here, even at the same price.",
            ],
          },
          {
            heading: '5. Sound and system: don\'t overlook the whole',
            body: [
              "Ultra-thin TVs often have disappointing sound. If cinema matters to you, plan for a soundbar — the improvement is immediate. Check for an eARC (HDMI) output to connect it easily.",
              "On software, the systems (Google TV, Tizen, webOS) are all decent today. Mainly check that your favourite apps are available and that the interface stays smooth over time.",
            ],
          },
        ],
        checklist: [
          'Right panel: OLED in a dark room, Mini-LED/QLED in a bright room',
          'Generous size for your distance (55–65" for 2.5–3 m)',
          'HDR Dolby Vision / HDR10+ and at least 600 nits',
          'HDMI 2.1 + 120 Hz + VRR if you game on a recent console',
          'Plan a soundbar + eARC output for home cinema',
        ],
        picks: [
          { budget: 'Small budget · ~€500', name: 'Samsung Crystal 4K LED 55"', note: 'Good size-to-price ratio for a bright living room.', query: 'Samsung Crystal 4K TV 55 inch' },
          { budget: 'All-round · ~€1000', name: 'Mini-LED 65" TV (HDMI 2.1, 120 Hz)', note: 'Excellent HDR brightness and gaming features.', query: 'Mini-LED TV 65 inch 120Hz HDMI 2.1' },
          { budget: 'Premium · ~€1800', name: 'OLED 65" TV Dolby Vision', note: 'Perfect blacks and infinite contrast for cinema.', query: 'OLED TV 65 inch Dolby Vision' },
        ],
      },
    },
  },

  {
    slug: 'choisir-aspirateur-robot',
    category: 'vacuum',
    content: {
      fr: {
        title: "Bien choisir son aspirateur robot",
        subtitle: 'Navigation laser, aspiration, lavage, station auto-vidage : ce qui justifie (ou non) le prix.',
        readTime: '6 min',
        updated: 'Juin 2026',
        intro:
          "L'aspirateur robot est passé du gadget au véritable assistant ménager. Mais entre un modèle à 200 € et un autre à 1 200 €, les écarts de prix recouvrent des différences réelles : navigation, puissance d'aspiration, fonction lavage et surtout station d'entretien. Ce guide vous aide à payer pour les fonctions qui changent vraiment votre quotidien.",
        sections: [
          {
            heading: '1. La navigation : le critère numéro un',
            body: [
              "C'est ce qui sépare un bon robot d'un robot frustrant. Fuyez les modèles à navigation aléatoire (qui rebondissent au hasard) : préférez une navigation laser (LiDAR) qui cartographie votre logement, planifie son trajet et nettoie pièce par pièce.",
              "Une bonne cartographie permet aussi de créer des zones interdites, de cibler une seule pièce et de mémoriser plusieurs étages — un confort qui justifie largement le surcoût par rapport à l'entrée de gamme.",
            ],
          },
          {
            heading: "2. L'aspiration et la gestion des tapis",
            body: [
              "La puissance s'exprime en Pa (pascals). Pour des sols durs et un peu de moquette, 2 500–4 000 Pa suffisent ; au-delà de 5 000 Pa, le robot gère mieux les tapis épais et les poils d'animaux.",
              "Vérifiez la brosse principale : les modèles anti-emmêlement (caoutchouc plutôt que poils) évitent la corvée de démêler les cheveux. Un détail qui change tout si vous avez les cheveux longs ou un animal.",
            ],
          },
          {
            heading: '3. La fonction lavage : utile mais à nuancer',
            body: [
              "Beaucoup de robots aspirent ET lavent. C'est pratique pour un entretien léger, mais ne remplace pas une vraie serpillière sur des taches incrustées. Les meilleurs modèles relèvent ou retirent la serpillière sur les tapis pour ne pas les mouiller.",
              "Les versions premium lavent les patins à l'eau chaude et les sèchent automatiquement, évitant les odeurs. Si vous avez beaucoup de carrelage ou de parquet, c'est un vrai plus.",
            ],
          },
          {
            heading: '4. La station : le confort qui fait la différence',
            body: [
              "La station d'auto-vidage transvase la poussière du robot dans un grand sac : vous ne videz le bac que toutes les quelques semaines au lieu de chaque passage. Pour beaucoup d'utilisateurs, c'est LA fonction qui rend le robot vraiment autonome.",
              "Les stations « tout-en-un » vont plus loin : remplissage d'eau, lavage et séchage des patins. Elles expliquent une grande partie de l'écart de prix sur le haut de gamme — à vous de juger si ce confort vaut l'investissement.",
            ],
          },
        ],
        checklist: [
          'Navigation laser (LiDAR) avec cartographie, jamais aléatoire',
          'Aspiration adaptée : 2 500 Pa+ (sols durs), 5 000 Pa+ (tapis/animaux)',
          'Brosse anti-emmêlement si cheveux longs ou animaux',
          'Station auto-vidage pour une vraie autonomie',
          'Lavage avec relevage de serpillière si vous avez des tapis',
        ],
        picks: [
          { budget: 'Petit budget · ~250 €', name: 'Aspirateur robot à navigation laser', note: 'Cartographie fiable et aspiration correcte à petit prix.', query: 'aspirateur robot navigation laser LiDAR' },
          { budget: 'Polyvalent · ~500 €', name: 'Robot aspirateur + lavage avec station', note: 'Aspiration, lavage et auto-vidage : le bon équilibre.', query: 'aspirateur robot lavage station auto-vidage' },
          { budget: 'Premium · ~1000 €', name: 'Robot haut de gamme station tout-en-un', note: 'Lavage eau chaude, séchage et entretien automatiques.', query: 'aspirateur robot station tout-en-un lavage eau chaude' },
        ],
      },
      en: {
        title: 'How to choose a robot vacuum',
        subtitle: 'Laser navigation, suction, mopping, auto-empty dock: what justifies (or not) the price.',
        readTime: '6 min',
        updated: 'June 2026',
        intro:
          "The robot vacuum has gone from gadget to genuine household assistant. But between a €200 model and a €1,200 one, the price gap reflects real differences: navigation, suction power, mopping and above all the maintenance dock. This guide helps you pay for the features that truly change your daily life.",
        sections: [
          {
            heading: '1. Navigation: the number-one criterion',
            body: [
              "This is what separates a good robot from a frustrating one. Avoid random-navigation models (bouncing around at random): prefer laser navigation (LiDAR) that maps your home, plans its route and cleans room by room.",
              "Good mapping also lets you set no-go zones, target a single room and remember multiple floors — a convenience that easily justifies the premium over entry-level.",
            ],
          },
          {
            heading: '2. Suction and carpet handling',
            body: [
              "Power is expressed in Pa (pascals). For hard floors and a bit of carpet, 2,500–4,000 Pa is enough; above 5,000 Pa the robot handles thick rugs and pet hair better.",
              "Check the main brush: anti-tangle models (rubber rather than bristles) avoid the chore of untangling hair. A detail that changes everything if you have long hair or a pet.",
            ],
          },
          {
            heading: '3. The mopping function: useful but nuanced',
            body: [
              "Many robots vacuum AND mop. It's handy for light upkeep but doesn't replace a real mop on stuck-on stains. The best models lift or remove the mop pad on carpets to avoid wetting them.",
              "Premium versions wash the pads with hot water and dry them automatically, avoiding odours. If you have a lot of tile or hard flooring, it's a real plus.",
            ],
          },
          {
            heading: '4. The dock: the convenience that makes the difference',
            body: [
              "The auto-empty dock transfers dust from the robot into a large bag: you empty it only every few weeks instead of after every run. For many users, this is THE feature that makes the robot truly autonomous.",
              "All-in-one docks go further: water refill, pad washing and drying. They explain much of the price gap at the high end — it's up to you to judge whether that convenience is worth the investment.",
            ],
          },
        ],
        checklist: [
          'Laser (LiDAR) navigation with mapping, never random',
          'Suction to match: 2,500 Pa+ (hard floors), 5,000 Pa+ (carpets/pets)',
          'Anti-tangle brush if long hair or pets',
          'Auto-empty dock for genuine autonomy',
          'Mopping with mop-lift if you have carpets',
        ],
        picks: [
          { budget: 'Small budget · ~€250', name: 'Laser-navigation robot vacuum', note: 'Reliable mapping and decent suction at a low price.', query: 'robot vacuum laser navigation LiDAR' },
          { budget: 'All-round · ~€500', name: 'Robot vacuum + mop with dock', note: 'Vacuuming, mopping and auto-empty: the right balance.', query: 'robot vacuum mop auto-empty dock' },
          { budget: 'Premium · ~€1000', name: 'High-end robot with all-in-one dock', note: 'Hot-water washing, drying and automatic maintenance.', query: 'robot vacuum all-in-one dock hot water mop' },
        ],
      },
    },
  },
];

// Renvoie le contenu d'un guide localisé pour la langue donnée.
export function localizeGuide(guide, lang = 'fr') {
  if (!guide) return null;
  const c = guide.content[lang] || guide.content.fr;
  return { slug: guide.slug, category: guide.category, ...c };
}

export function getGuide(slug) {
  return GUIDES.find((g) => g.slug === slug) || null;
}
