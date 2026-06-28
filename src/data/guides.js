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

  // ── Idées cadeaux (type 'gift') ─────────────────────────────────────────────
  {
    slug: 'idees-cadeaux-homme',
    category: 'gift',
    type: 'gift',
    content: {
      fr: {
        title: 'Idées cadeaux pour homme : la sélection 2026',
        subtitle: "Des idées qui font mouche, du gadget malin au cadeau qui dure, pour tous les budgets.",
        readTime: '6 min',
        updated: 'Juin 2026',
        intro:
          "Offrir un cadeau à un homme tourne vite au cliché : énième cravate, énième coffret de gel douche. Pourtant, le bon cadeau n'est pas le plus cher, c'est celui qui correspond à sa façon de vivre. Voici nos idées classées par profil et par budget — pour viser juste sans y passer la soirée.",
        sections: [
          {
            heading: '1. Partez de ses centres d\'intérêt, pas du rayon « cadeaux homme »',
            body: [
              "Le meilleur réflexe est de cerner ce qui l'occupe vraiment : cuisine, sport, jeux vidéo, voyage, bricolage, café… Un cadeau qui prolonge une passion existante a beaucoup plus d'impact qu'un objet « générique ». Un amateur de café appréciera un moulin à grains ou une cafetière à piston ; un sportif, des écouteurs qui tiennent à l'effort.",
              "Si vous le connaissez peu, jouez la carte de l'utile haut de gamme : une belle gourde isotherme, un chargeur sans fil élégant ou une lampe de bureau design plaisent presque toujours, car ils remplacent un objet du quotidien par une version plus agréable.",
            ],
          },
          {
            heading: '2. Les valeurs sûres tech (qui ne déçoivent presque jamais)',
            body: [
              "Côté technologie, trois familles tiennent le haut du panier : les écouteurs sans fil (parfaits pour les transports et le sport), les enceintes Bluetooth nomades, et les accessoires de charge (batterie externe, station de charge). Ce sont des cadeaux qui servent tous les jours.",
              "Pour un budget plus large, une montre connectée ou une liseuse sont des cadeaux marquants : on s'en sert pendant des années. Vérifiez juste la compatibilité (iPhone/Android) avant d'acheter une montre.",
            ],
          },
          {
            heading: '3. Faire plaisir avec un petit budget',
            body: [
              "Pas besoin de se ruiner. Un bon mug isotherme, un jeu de société convivial, un livre marquant ou un accessoire pour sa passion font d'excellents cadeaux à moins de 30 €. L'astuce : soigner le « pourquoi » du cadeau (un mot, un clin d'œil à une blague) compte souvent plus que le prix.",
              "Les coffrets thématiques (bière, café de spécialité, soin de la barbe) sont aussi une valeur sûre pour découvrir sans se tromper, à condition de choisir un thème qui lui ressemble vraiment.",
            ],
          },
        ],
        checklist: [
          'Partez de sa passion principale plutôt que d\'un cadeau « passe-partout »',
          'Les écouteurs sans fil et batteries externes plaisent presque toujours',
          'Pour marquer le coup : montre connectée, liseuse ou enceinte nomade',
          'Petit budget : un objet du quotidien en version « premium »',
          'Vérifiez la compatibilité iPhone/Android pour tout objet connecté',
        ],
        picks: [
          { budget: 'Petit budget · ~25 €', name: 'Mug isotherme inox', note: 'Garde le café chaud des heures, utile au bureau comme en déplacement.', query: 'mug isotherme inox' },
          { budget: 'Polyvalent · ~80 €', name: 'Écouteurs sans fil à réduction de bruit', note: 'Le cadeau tech qui sert tous les jours, transports comme sport.', query: 'ecouteurs sans fil reduction de bruit' },
          { budget: 'Pour marquer le coup · ~150 €', name: 'Montre connectée', note: 'Sport, notifications, autonomie : un cadeau qui dure des années.', query: 'montre connectee homme' },
          { budget: 'Passionné de café · ~60 €', name: 'Moulin à café manuel', note: 'Pour les amateurs qui veulent moudre leurs grains frais.', query: 'moulin a cafe manuel' },
        ],
      },
    },
  },
  {
    slug: 'idees-cadeaux-femme',
    category: 'gift',
    type: 'gift',
    content: {
      fr: {
        title: 'Idées cadeaux pour femme : la sélection 2026',
        subtitle: "Bien-être, tech, maison, créativité : des idées qui sortent du lot, pour tous les budgets.",
        readTime: '6 min',
        updated: 'Juin 2026',
        intro:
          "Le piège, quand on cherche un cadeau pour une femme, c'est de retomber dans les clichés (bougie, bijou au hasard). Un cadeau réussi part toujours de la personne : ce qu'elle aime faire, ce qui lui simplifierait la vie, ce dont elle se priverait par raison. Voici nos idées triées par envie et par budget.",
        sections: [
          {
            heading: '1. Le bien-être et le « cocooning »',
            body: [
              "C'est une valeur sûre quand on cherche à faire plaisir sans se tromper. Un diffuseur d'huiles essentielles, un plaid très doux, un appareil de massage ou un coffret de soins transforment un moment ordinaire en parenthèse agréable. L'idée : offrir un instant pour soi.",
              "Pour un budget plus généreux, un appareil de beauté (lisseur de qualité, sèche-cheveux performant) ou une montre connectée orientée bien-être (suivi du sommeil, activité) font des cadeaux durables et utilisés au quotidien.",
            ],
          },
          {
            heading: '2. Tech utile et objets du quotidien « premium »',
            body: [
              "La technologie n'est pas réservée aux hommes : écouteurs sans fil, enceinte Bluetooth design, liseuse pour les grandes lectrices, ou station de charge élégante sont des cadeaux qui servent vraiment. La liseuse est particulièrement appréciée : légère, des milliers de livres dans un sac à main.",
              "Autre piste qui fonctionne bien : remplacer un objet courant par une version plus belle ou plus pratique — une gourde isotherme design, une lampe d'ambiance connectée, un beau carnet.",
            ],
          },
          {
            heading: '3. Créativité, maison et petits budgets',
            body: [
              "Si elle aime créer ou cuisiner, un accessoire de qualité pour sa passion (set d'aquarelle, robot pâtissier, beau plat) est un cadeau qui dit « je sais ce que tu aimes ». Côté maison, les plantes, les jolies bougies parfumées et les objets déco restent des valeurs sûres à petit prix.",
              "Pour moins de 30 €, misez sur le soin du détail : un thé d'exception, un livre choisi avec attention, une trousse de toilette pratique. Le geste compte autant que l'objet.",
            ],
          },
        ],
        checklist: [
          'Partez de ce qu\'elle aime faire, pas d\'un cadeau « par défaut »',
          'Bien-être (diffuseur, plaid, massage) : une valeur sûre',
          'La liseuse est idéale pour les grandes lectrices',
          'Petit budget : un objet du quotidien en version soignée',
          'Un accessoire de qualité pour sa passion fait toujours mouche',
        ],
        picks: [
          { budget: 'Petit budget · ~25 €', name: 'Bougie parfumée artisanale', note: 'Une valeur sûre cocooning, à choisir selon ses senteurs préférées.', query: 'bougie parfumee artisanale' },
          { budget: 'Bien-être · ~40 €', name: 'Diffuseur d\'huiles essentielles', note: 'Crée une ambiance apaisante à la maison, utilisé toute l\'année.', query: 'diffuseur huiles essentielles' },
          { budget: 'Pour les lectrices · ~120 €', name: 'Liseuse à écran rétroéclairé', note: 'Des milliers de livres dans un objet léger, lisible au soleil.', query: 'liseuse ecran retroeclaire' },
          { budget: 'Pour marquer le coup · ~150 €', name: 'Montre connectée bien-être', note: 'Suivi du sommeil et de l\'activité, un cadeau qui dure.', query: 'montre connectee femme' },
        ],
      },
    },
  },
  {
    slug: 'idees-cadeaux-noel',
    category: 'gift',
    type: 'gift',
    content: {
      fr: {
        title: 'Idées cadeaux de Noël 2026 : la sélection pour toute la famille',
        subtitle: "Pour lui, pour elle, pour les enfants, pour les ados : des idées de Noël qui plaisent vraiment.",
        readTime: '7 min',
        updated: 'Juin 2026',
        intro:
          "Noël approche et la liste s'allonge : conjoint, parents, enfants, beau-frère qu'on voit une fois par an… Pour éviter le rush de dernière minute (et les cadeaux génériques), mieux vaut s'y prendre tôt et avoir quelques idées solides par destinataire. Voici notre sélection de Noël, organisée pour vous faire gagner du temps.",
        sections: [
          {
            heading: '1. Anticipez : les bonnes affaires se jouent avant décembre',
            body: [
              "Les meilleures offres tombent souvent en novembre (autour du Black Friday) plutôt qu'à quelques jours de Noël, où les prix remontent et les stocks fondent. Repérez vos idées tôt et surveillez les prix : vous offrirez mieux pour le même budget.",
              "Pensez aussi aux délais de livraison : en décembre, mieux vaut commander avec de la marge. Un cadeau commandé trop tard, c'est le stress assuré.",
            ],
          },
          {
            heading: '2. Des idées qui plaisent à coup sûr',
            body: [
              "Pour les adultes, les valeurs sûres restent les écouteurs sans fil, les enceintes Bluetooth, les liseuses et les objets « cocooning » (plaid, diffuseur). Pour la cuisine, un bel ustensile ou un coffret gourmand fait toujours plaisir autour des fêtes.",
              "Pour les enfants et ados, privilégiez ce qui les fait vraiment vibrer : jeux de société familiaux, jeux de construction, casque audio adapté, ou accessoires pour leur console. Le cadeau « tendance du moment » plaît, mais un classique de qualité dure plus longtemps.",
            ],
          },
          {
            heading: '3. Cadeaux malins quand on ne sait pas quoi offrir',
            body: [
              "Pour le collègue, le secret santa ou l'invité surprise, misez sur des cadeaux universels : coffret de thé ou de café, jeu d'ambiance, gourde isotherme, ou petit objet déco. Difficile de se tromper, et le budget reste maîtrisé.",
              "Et si vous séchez complètement, décrivez la personne à notre conseiller : il vous proposera des idées adaptées en quelques questions.",
            ],
          },
        ],
        checklist: [
          'Repérez vos idées dès novembre : meilleurs prix, meilleurs stocks',
          'Commandez tôt pour éviter le stress des délais de décembre',
          'Adultes : écouteurs, enceinte, liseuse, cocooning — valeurs sûres',
          'Enfants/ados : un classique de qualité dure plus qu\'un effet de mode',
          'Cadeau « secret santa » : coffret gourmand ou jeu d\'ambiance',
        ],
        picks: [
          { budget: 'Secret Santa · ~20 €', name: 'Coffret de thés ou cafés', note: 'Le cadeau universel des fêtes, sans risque de se tromper.', query: 'coffret thes cafe degustation' },
          { budget: 'Famille · ~30 €', name: 'Jeu de société convivial', note: 'Pour animer les soirées de Noël, des petits aux grands.', query: 'jeu de societe famille' },
          { budget: 'Pour lui ou elle · ~90 €', name: 'Écouteurs sans fil', note: 'Un classique qui plaît à tous les âges et sert tous les jours.', query: 'ecouteurs sans fil bluetooth' },
          { budget: 'Cadeau marquant · ~120 €', name: 'Liseuse', note: 'Idéal pour les lecteurs : léger, des milliers de livres à emporter.', query: 'liseuse' },
        ],
      },
    },
  },
  {
    slug: 'idees-cadeaux-ado',
    category: 'gift',
    type: 'gift',
    content: {
      fr: {
        title: 'Idées cadeaux pour ado : ce qui plaît vraiment (2026)',
        subtitle: "Tech, gaming, créativité, déco de chambre : des idées dans l'air du temps sans se tromper.",
        readTime: '6 min',
        updated: 'Juin 2026',
        intro:
          "Offrir un cadeau à un ado, c'est marcher sur un fil : trop « enfant » et c'est raté, trop cher et on explose le budget. La bonne nouvelle, c'est que les ados ont des centres d'intérêt très marqués (musique, gaming, réseaux, sport, déco de chambre). Visez juste là-dessus et le cadeau fait mouche.",
        sections: [
          {
            heading: '1. La tech audio : le cadeau ado par excellence',
            body: [
              "Casque ou écouteurs sans fil arrivent presque toujours en tête. Les ados écoutent de la musique en continu, jouent et passent des appels : un bon casque est un cadeau utilisé tous les jours. Pour le gaming, un casque avec micro fait la différence.",
              "Une enceinte Bluetooth nomade est aussi une excellente idée pour la chambre ou les sorties entre amis — robuste et étanche de préférence.",
            ],
          },
          {
            heading: '2. Gaming et accessoires',
            body: [
              "Si l'ado est joueur, les accessoires sont des cadeaux sûrs : manette supplémentaire, casque gaming, carte cadeau pour sa plateforme, ou éclairage LED pour le coin gaming. Vérifiez bien la console ou la plateforme qu'il utilise avant d'acheter un accessoire.",
              "Pour les budgets plus élevés, une manette de qualité ou un bon casque gaming font des cadeaux marquants sans atteindre le prix d'une console.",
            ],
          },
          {
            heading: '3. Déco de chambre, créativité et petits budgets',
            body: [
              "La chambre est le territoire de l'ado : bandeaux LED, lampe d'ambiance, posters, coussins… autant d'idées sympas et abordables qui personnalisent son espace. Côté créativité, le matériel pour dessiner, créer du contenu (ring light, micro) ou un instrument plaît aux profils créatifs.",
              "Pour moins de 25 €, les LED de chambre, une gourde stylée ou un accessoire pour smartphone (support, coque originale) sont des valeurs sûres.",
            ],
          },
        ],
        checklist: [
          'Le casque/écouteurs sans fil : le cadeau ado quasi infaillible',
          'Gaming : vérifiez la console/plateforme avant d\'acheter un accessoire',
          'Déco de chambre (LED, lampe d\'ambiance) : sympa et abordable',
          'Profil créatif : ring light, micro, matériel de dessin',
          'Petit budget : LED de chambre ou accessoire smartphone original',
        ],
        picks: [
          { budget: 'Petit budget · ~20 €', name: 'Bandeau LED pour chambre', note: 'Personnalise l\'espace, effet garanti pour un petit prix.', query: 'bandeau led chambre' },
          { budget: 'Audio · ~50 €', name: 'Casque sans fil', note: 'Musique, appels, gaming : utilisé tous les jours.', query: 'casque sans fil ado' },
          { budget: 'Gaming · ~45 €', name: 'Casque gaming avec micro', note: 'Pour jouer en ligne avec les copains, confort et micro clair.', query: 'casque gaming micro' },
          { budget: 'Créatif · ~40 €', name: 'Ring light avec trépied', note: 'Pour les ados qui créent du contenu ou font des visios.', query: 'ring light trepied' },
        ],
      },
    },
  },
  {
    slug: 'idees-cadeaux-high-tech',
    category: 'gift',
    type: 'gift',
    content: {
      fr: {
        title: 'Idées cadeaux high-tech : pour les passionnés de tech (2026)',
        subtitle: "Gadgets malins, audio, objets connectés : des idées qui impressionnent les amateurs de tech.",
        readTime: '7 min',
        updated: 'Juin 2026',
        intro:
          "Offrir un cadeau high-tech à un passionné fait peur : « il a déjà tout », « je vais me tromper de modèle ». En réalité, les amateurs de tech adorent les accessoires malins et les objets qui améliorent leur quotidien — pas forcément les plus chers. Voici nos idées, du gadget à moins de 30 € à l'objet qui marque le coup.",
        sections: [
          {
            heading: '1. Les accessoires qui améliorent le quotidien',
            body: [
              "C'est le terrain le plus sûr : station de charge multi-appareils, chargeur sans fil rapide, batterie externe compacte, ou hub USB-C pour le télétravail. Ce sont des objets qu'un passionné utilise tous les jours et qu'il n'achète pas toujours pour lui-même.",
              "Les trackers Bluetooth (pour retrouver clés, sac ou valise) et les supports (pour téléphone, casque, tablette) sont aussi d'excellents cadeaux : utiles, abordables et appréciés.",
            ],
          },
          {
            heading: '2. Audio et image : la valeur sûre',
            body: [
              "Un bon casque à réduction de bruit, une enceinte Bluetooth de qualité ou des écouteurs haut de gamme sont des cadeaux qui font toujours plaisir. Pour les cinéphiles, un projecteur portable ou un bon éclairage d'ambiance (rétroéclairage TV) transforme l'expérience.",
              "Astuce : si la personne est déjà très équipée, visez la qualité plutôt que la nouveauté — un accessoire premium qu'elle ne se serait pas offert.",
            ],
          },
          {
            heading: '3. Maison connectée et gadgets « waouh »',
            body: [
              "La domotique séduit les passionnés : ampoules connectées, prises intelligentes, assistant vocal ou capteurs. On peut commencer petit (une prise connectée) sans imposer tout un écosystème.",
              "Pour l'effet « waouh » à budget contenu, pensez aux gadgets bien conçus : mini-imprimante photo, clavier mécanique compact, lampe de bureau à charge sans fil intégrée. Ils sortent de l'ordinaire sans coûter une fortune.",
            ],
          },
        ],
        checklist: [
          'Les accessoires de charge sont des valeurs sûres (on s\'en sert tous les jours)',
          'Trackers Bluetooth et supports : utiles et abordables',
          'Audio premium : misez sur la qualité plutôt que la nouveauté',
          'Maison connectée : on peut commencer par une seule prise intelligente',
          'Effet « waouh » à petit prix : mini-imprimante photo, clavier mécanique',
        ],
        picks: [
          { budget: 'Petit budget · ~25 €', name: 'Tracker Bluetooth', note: 'Pour ne plus jamais perdre ses clés, son sac ou sa valise.', query: 'tracker bluetooth objets' },
          { budget: 'Pratique · ~35 €', name: 'Station de charge sans fil', note: 'Recharge téléphone et écouteurs sur un seul socle élégant.', query: 'station de charge sans fil' },
          { budget: 'Audio · ~120 €', name: 'Casque à réduction de bruit', note: 'Le cadeau tech qui impressionne et sert au quotidien.', query: 'casque reduction de bruit' },
          { budget: 'Maison connectée · ~30 €', name: 'Prise connectée (lot)', note: 'Une entrée facile dans la domotique, sans tout changer.', query: 'prise connectee wifi' },
        ],
      },
    },
  },

  // ── Idées cadeaux — 2e lot (occasions) ──────────────────────────────────────
  {
    slug: 'idees-cadeaux-saint-valentin',
    category: 'gift',
    type: 'gift',
    content: {
      fr: {
        title: 'Idées cadeaux Saint-Valentin 2026 : pour lui et pour elle',
        subtitle: "Du geste romantique au cadeau qui marque, des idées pour surprendre sans tomber dans le cliché.",
        readTime: '6 min',
        updated: 'Juin 2026',
        intro:
          "La Saint-Valentin, c'est l'art de viser juste : ni trop attendu (le énième bouquet), ni à côté de la plaque. Le bon cadeau dit « je te connais » — il s'appuie sur ce que l'autre aime vraiment. Voici nos idées, des plus romantiques aux plus originales, pour tous les budgets.",
        sections: [
          {
            heading: '1. L\'attention compte plus que le prix',
            body: [
              "Le piège de la Saint-Valentin, c'est de croire qu'il faut dépenser beaucoup. En réalité, un cadeau personnalisé ou lié à un souvenir commun touche bien plus qu'un objet cher choisi au hasard. Pensez à ce qui ferait plaisir au quotidien plutôt qu'à ce qui « fait » cadeau de Saint-Valentin.",
              "Les expériences à deux (un jeu de société pour deux, un coffret dégustation à partager) marquent souvent plus qu'un objet, car elles créent un moment ensemble.",
            ],
          },
          {
            heading: '2. Les valeurs sûres pour elle et pour lui',
            body: [
              "Pour elle : un bijou discret, un coffret de soins, un diffuseur d'ambiance ou une liseuse si elle dévore les livres. Pour lui : une montre, un beau portefeuille, des écouteurs sans fil ou un accessoire pour sa passion.",
              "Côté tech mixte, les écouteurs sans fil et les enceintes Bluetooth plaisent à tout le monde et servent tous les jours — une valeur sûre quand on hésite.",
            ],
          },
          {
            heading: '3. Petits budgets et idées originales',
            body: [
              "Pour moins de 30 €, misez sur le soin du détail : un coffret de chocolats de qualité, une bougie parfumée, un livre choisi avec attention ou un mug à message. L'emballage et le petit mot font la différence.",
              "Pour sortir de l'ordinaire : un cadre photo qui revisite un souvenir, un jeu pour couples, ou une plante facile d'entretien qui durera bien après le 14 février.",
            ],
          },
        ],
        checklist: [
          'Partez d\'un souvenir commun ou d\'une passion : ça touche plus',
          'Une expérience à deux marque souvent plus qu\'un objet',
          'Écouteurs sans fil / enceinte : valeurs sûres mixtes',
          'Petit budget : soignez l\'emballage et le petit mot',
          'Pour durer : une plante ou un objet déco plutôt que l\'éphémère',
        ],
        picks: [
          { budget: 'Petit budget · ~20 €', name: 'Coffret de chocolats fins', note: 'Un classique qui plaît, à choisir selon ses goûts.', query: 'coffret chocolats fins' },
          { budget: 'Cocooning · ~35 €', name: 'Bougie parfumée + diffuseur', note: 'Crée une ambiance chaleureuse pour la soirée et après.', query: 'bougie parfumee coffret' },
          { budget: 'À deux · ~25 €', name: 'Jeu de société pour deux', note: 'Pour passer un vrai moment ensemble, pas juste offrir un objet.', query: 'jeu de societe pour deux' },
          { budget: 'Pour marquer le coup · ~90 €', name: 'Écouteurs sans fil', note: 'Le cadeau utile qui sert tous les jours, pour lui comme pour elle.', query: 'ecouteurs sans fil bluetooth' },
        ],
      },
    },
  },
  {
    slug: 'idees-cadeaux-fete-des-meres',
    category: 'gift',
    type: 'gift',
    content: {
      fr: {
        title: 'Idées cadeaux pour la fête des mères 2026',
        subtitle: "Bien-être, maison, créativité, tech utile : des idées qui font vraiment plaisir, à tout budget.",
        readTime: '6 min',
        updated: 'Juin 2026',
        intro:
          "Pour la fête des mères, on veut un cadeau qui sorte du lot et qui montre qu'on a réfléchi. La clé : partir de ce qu'elle aime et de ce qui lui simplifierait ou embellirait le quotidien. Voici nos idées, triées par envie et par budget.",
        sections: [
          {
            heading: '1. Le bien-être et la détente',
            body: [
              "C'est souvent le cadeau qui touche le plus : un appareil de massage, un diffuseur d'huiles essentielles, un plaid moelleux ou un coffret de soins offrent un vrai moment pour soi. L'idée, c'est de lui offrir une parenthèse.",
              "Pour un budget plus large, un appareil de beauté de qualité (sèche-cheveux performant, lisseur) est utilisé pendant des années.",
            ],
          },
          {
            heading: '2. Maison, cuisine et créativité',
            body: [
              "Si elle aime cuisiner, un bel ustensile, un robot pâtissier ou une machine à café font des cadeaux marquants. Côté maison, une jolie lampe d'ambiance, des plantes ou un cadre photo personnalisé sont des valeurs sûres.",
              "Pour les mamans créatives, un beau matériel pour sa passion (couture, dessin, jardinage) dit « je sais ce que tu aimes » — souvent plus apprécié qu'un cadeau générique.",
            ],
          },
          {
            heading: '3. Tech utile et petits budgets',
            body: [
              "La tech n'est pas hors sujet : une liseuse pour les grandes lectrices, une enceinte Bluetooth pour la cuisine, ou une montre connectée orientée bien-être sont des cadeaux très utilisés.",
              "Pour moins de 30 €, misez sur l'attention : un thé d'exception, un livre choisi pour elle, une jolie tasse ou un bouquet qui dure (fleurs séchées). Le geste compte autant que l'objet.",
            ],
          },
        ],
        checklist: [
          'Bien-être (massage, diffuseur, plaid) : le cadeau qui touche',
          'Cuisine / créativité : un accessoire de qualité pour sa passion',
          'La liseuse est idéale pour les grandes lectrices',
          'Petit budget : misez sur l\'attention et la présentation',
          'Préférez ce qui dure (objet déco) à l\'éphémère',
        ],
        picks: [
          { budget: 'Petit budget · ~25 €', name: 'Coffret de thés d\'exception', note: 'Une attention raffinée, à choisir selon ses goûts.', query: 'coffret thes degustation' },
          { budget: 'Bien-être · ~45 €', name: 'Appareil de massage cervical', note: 'Pour décompresser à la maison, utilisé toute l\'année.', query: 'appareil massage cervical' },
          { budget: 'Maison · ~40 €', name: 'Lampe d\'ambiance', note: 'Réchauffe l\'atmosphère d\'un salon ou d\'une chambre.', query: 'lampe ambiance led' },
          { budget: 'Pour les lectrices · ~120 €', name: 'Liseuse', note: 'Des milliers de livres dans un objet léger, lisible partout.', query: 'liseuse' },
        ],
      },
    },
  },
  {
    slug: 'idees-cadeaux-fete-des-peres',
    category: 'gift',
    type: 'gift',
    content: {
      fr: {
        title: 'Idées cadeaux pour la fête des pères 2026',
        subtitle: "Tech, bricolage, cuisine, passions : des idées qui changent de la cravate, pour tous les budgets.",
        readTime: '6 min',
        updated: 'Juin 2026',
        intro:
          "Cravate, chaussettes, mug « meilleur papa »… La fête des pères mérite mieux. Le bon cadeau part de ce qui l'occupe vraiment : ses loisirs, ses petites manies, ce qui lui faciliterait la vie. Voici nos idées, du gadget malin au cadeau qui dure.",
        sections: [
          {
            heading: '1. Partez de sa passion',
            body: [
              "Bricoleur, cuisinier, sportif, amateur de café ou de musique : un cadeau qui prolonge un loisir existant fait toujours mouche. Un set d'outils de qualité, un accessoire de cuisine, une gourde isotherme pour ses sorties… l'idée juste est souvent là.",
              "Si vous le connaissez peu, l'utile haut de gamme est une valeur sûre : un beau portefeuille, une station de charge élégante ou une lampe de bureau design plaisent presque toujours.",
            ],
          },
          {
            heading: '2. Les valeurs sûres tech',
            body: [
              "Écouteurs sans fil, enceinte Bluetooth, batterie externe ou montre connectée : ce sont des cadeaux utilisés tous les jours. La montre connectée est particulièrement appréciée s'il fait du sport (pensez à vérifier la compatibilité iPhone/Android).",
              "Pour les amateurs de cinéma ou de musique à la maison, un bon casque ou un rétroéclairage TV transforme l'expérience sans exploser le budget.",
            ],
          },
          {
            heading: '3. Cuisine, apéro et petits budgets',
            body: [
              "Les coffrets thématiques (bière, café de spécialité, épices, soin de la barbe) sont parfaits pour faire découvrir sans se tromper, à condition de choisir un thème qui lui ressemble.",
              "Pour moins de 30 €, un mug isotherme, un accessoire d'apéro, un livre sur sa passion ou un jeu convivial sont d'excellentes idées. Le bon mot d'accompagnement fait le reste.",
            ],
          },
        ],
        checklist: [
          'Partez de son loisir principal plutôt que d\'un cadeau « passe-partout »',
          'Écouteurs / enceinte / batterie externe : utilisés tous les jours',
          'Montre connectée pour le sportif (vérifiez la compatibilité)',
          'Coffret thématique : faites-le découvrir sans risque',
          'Petit budget : un objet du quotidien en version « premium »',
        ],
        picks: [
          { budget: 'Petit budget · ~25 €', name: 'Mug isotherme inox', note: 'Garde le café chaud des heures, utile partout.', query: 'mug isotherme inox' },
          { budget: 'Apéro / cuisine · ~35 €', name: 'Coffret apéro ou épices', note: 'Pour les gourmands : une découverte sans risque de se tromper.', query: 'coffret epices degustation' },
          { budget: 'Audio · ~90 €', name: 'Écouteurs sans fil', note: 'Le cadeau tech qui sert au quotidien, transports comme sport.', query: 'ecouteurs sans fil reduction de bruit' },
          { budget: 'Pour marquer le coup · ~150 €', name: 'Montre connectée', note: 'Sport, notifications, autonomie : un cadeau qui dure.', query: 'montre connectee homme' },
        ],
      },
    },
  },
  {
    slug: 'idees-cadeaux-anniversaire',
    category: 'gift',
    type: 'gift',
    content: {
      fr: {
        title: "Idées cadeaux d'anniversaire : pour tous les âges et tous les budgets",
        subtitle: "Enfant, ado, adulte : des idées d'anniversaire qui font mouche selon le profil et le budget.",
        readTime: '7 min',
        updated: 'Juin 2026',
        intro:
          "Un anniversaire, c'est l'occasion de faire vraiment plaisir — encore faut-il viser juste. Le secret : adapter le cadeau à l'âge et aux centres d'intérêt de la personne, plutôt que de chercher « une idée d'anniversaire » au hasard. Voici notre sélection, organisée par profil.",
        sections: [
          {
            heading: '1. Pour les enfants',
            body: [
              "Privilégiez ce qui stimule le jeu et l'imagination : jeux de construction, jeux de société adaptés à leur âge, livres illustrés ou jouets créatifs. Les valeurs sûres durent plus longtemps qu'un jouet « tendance » vite oublié.",
              "Vérifiez toujours l'âge conseillé, et pensez aux jeux qui se partagent en famille : ils prolongent le plaisir bien après le jour J.",
            ],
          },
          {
            heading: '2. Pour les ados',
            body: [
              "Les ados ont des goûts marqués : casque ou écouteurs sans fil, accessoires gaming, déco de chambre (LED), ou matériel pour créer du contenu. Un casque de qualité est presque toujours un bon choix.",
              "Pour le gaming, vérifiez la console ou la plateforme utilisée avant d'acheter un accessoire. Une carte cadeau pour sa plateforme reste une option sûre quand on hésite.",
            ],
          },
          {
            heading: '3. Pour les adultes',
            body: [
              "Misez sur l'utile qui fait plaisir : écouteurs sans fil, liseuse, enceinte Bluetooth, ou un accessoire de qualité pour sa passion (cuisine, café, sport). Les objets « cocooning » (plaid, diffuseur) plaisent aussi beaucoup.",
              "Pour un cadeau qui marque sans se ruiner, un beau coffret thématique ou un objet du quotidien en version premium fait toujours son effet.",
            ],
          },
        ],
        checklist: [
          'Adaptez le cadeau à l\'âge ET aux centres d\'intérêt',
          'Enfants : un classique de qualité dure plus qu\'un effet de mode',
          'Ados : casque/écouteurs ou accessoire gaming (vérifiez la plateforme)',
          'Adultes : l\'utile qui fait plaisir (écouteurs, liseuse, passion)',
          'En cas de doute : carte cadeau ou coffret thématique',
        ],
        picks: [
          { budget: 'Enfant · ~25 €', name: 'Jeu de construction', note: 'Stimule la créativité, occupe longtemps. Vérifiez l\'âge conseillé.', query: 'jeu de construction enfant' },
          { budget: 'Ado · ~50 €', name: 'Casque sans fil', note: 'Musique, gaming, appels : utilisé tous les jours.', query: 'casque sans fil ado' },
          { budget: 'Adulte · ~90 €', name: 'Écouteurs sans fil', note: 'Le cadeau polyvalent qui plaît à tous les âges.', query: 'ecouteurs sans fil bluetooth' },
          { budget: 'Cadeau marquant · ~120 €', name: 'Liseuse', note: 'Idéale pour les lecteurs : léger, des milliers de livres à emporter.', query: 'liseuse' },
        ],
      },
    },
  },
  {
    slug: 'idees-cadeaux-derniere-minute',
    category: 'gift',
    type: 'gift',
    content: {
      fr: {
        title: 'Idées cadeaux de dernière minute (avec livraison rapide)',
        subtitle: "Vous avez oublié ? Pas de panique : des idées qui font plaisir et arrivent vite, pour tous les budgets.",
        readTime: '5 min',
        updated: 'Juin 2026',
        intro:
          "Cadeau oublié, invitation de dernière minute, anniversaire qui tombe demain : ça arrive à tout le monde. La bonne nouvelle, c'est qu'on peut très bien s'en sortir avec un cadeau qui a du sens — à condition de choisir malin et de privilégier la livraison rapide. Voici nos idées qui sauvent la mise.",
        sections: [
          {
            heading: '1. Visez les cadeaux « universels »',
            body: [
              "Quand le temps manque, misez sur des valeurs sûres qui plaisent à presque tout le monde : coffret gourmand (chocolats, thé, café), enceinte Bluetooth, écouteurs sans fil, ou un beau livre. Difficile de se tromper, et l'effet reste au rendez-vous.",
              "Les objets du quotidien en version premium (mug isotherme, gourde design, lampe d'ambiance) sont aussi parfaits : utiles, jolis, et adaptés à tous les profils.",
            ],
          },
          {
            heading: '2. Privilégiez la livraison rapide',
            body: [
              "Vérifiez bien le délai de livraison estimé avant de valider : certains articles arrivent dès le lendemain. Filtrez sur la disponibilité immédiate et évitez les vendeurs aux délais flous quand l'échéance est proche.",
              "Pour les cas vraiment urgents, la carte cadeau (envoyée par e-mail) reste une solution honnête et immédiate — accompagnez-la d'un petit mot pour la rendre personnelle.",
            ],
          },
          {
            heading: '3. Le détail qui fait la différence',
            body: [
              "Un cadeau de dernière minute ne doit pas avoir l'air bâclé. Un emballage soigné, une carte manuscrite ou un petit mot transforment un cadeau simple en attention sincère. C'est souvent ce dont on se souvient.",
              "Et si vous séchez, décrivez la personne à notre conseiller : il vous propose des idées adaptées en quelques secondes.",
            ],
          },
        ],
        checklist: [
          'Misez sur des cadeaux universels (coffret gourmand, audio, livre)',
          'Vérifiez le délai de livraison AVANT de valider',
          'Filtrez sur la disponibilité immédiate / livraison le lendemain',
          'Cas urgent : la carte cadeau par e-mail dépanne bien',
          'Soignez l\'emballage et ajoutez un mot : ça change tout',
        ],
        picks: [
          { budget: 'Petit budget · ~20 €', name: 'Coffret gourmand (chocolats/thé)', note: 'Le sauveur universel, plaît à presque tout le monde.', query: 'coffret gourmand chocolats the' },
          { budget: 'Polyvalent · ~40 €', name: 'Enceinte Bluetooth portable', note: 'Un cadeau sympa et utile, pour tous les âges.', query: 'enceinte bluetooth portable' },
          { budget: 'Audio · ~90 €', name: 'Écouteurs sans fil', note: 'Valeur sûre qui sert tous les jours.', query: 'ecouteurs sans fil bluetooth' },
          { budget: 'Vraiment urgent', name: 'Carte cadeau', note: 'Envoyée par e-mail, immédiate : la solution de secours honnête.', query: 'carte cadeau' },
        ],
      },
    },
  },
];

// Renvoie le contenu d'un guide localisé pour la langue donnée.
export function localizeGuide(guide, lang = 'fr') {
  if (!guide) return null;
  const c = guide.content[lang] || guide.content.fr;
  return { slug: guide.slug, category: guide.category, type: guide.type || 'buying', ...c };
}

export function getGuide(slug) {
  return GUIDES.find((g) => g.slug === slug) || null;
}

// Guides "idées cadeaux" (type 'gift') — alimentent le hub /idees-cadeaux.
export function giftGuides() {
  return GUIDES.filter((g) => g.type === 'gift');
}
