# Captures du tutoriel ("Comment ça marche")

Déposez ici les enregistrements d'écran utilisés par la modale `TutorialModal`
(ouverte par le bouton « ? » de la home).

## Convention de nommage

```
<étape>.<format>.<ext>
```

- **étape** : `search`, `questions`, `compare`, `buy` (l'ordre du walkthrough,
  défini par `STEPS` dans `src/components/TutorialModal.jsx`).
- **format (tier)** : `desktop`, `tablet`, `phone` — la bonne capture est servie
  selon la largeur d'écran (≥980 = desktop, 600–979 = tablet, <600 = phone).
  Un **seul** fichier est téléchargé par visiteur.
- **ext** : selon le mode choisi par `MEDIA_KIND` dans `TutorialModal.jsx` :
  - `video` (recommandé) → fournir `.webm` **et** `.mp4` (webm préféré, mp4 fallback)
  - `gif` → `.gif`

### Exemples

```
search.desktop.webm   search.desktop.mp4
search.tablet.webm    search.tablet.mp4
search.phone.webm     search.phone.mp4
questions.desktop.webm ...
compare.phone.gif      (si MEDIA_KIND = 'gif')
```

Un fichier manquant affiche un placeholder « Démo bientôt disponible » : on peut
donc livrer les étapes une par une.

## Conversion depuis un enregistrement

```bash
# MP4 (H.264) — lisible partout
ffmpeg -i capture.mov -an -vf "scale=900:-2,fps=24" -c:v libx264 -crf 28 -pix_fmt yuv420p -movflags +faststart search.desktop.mp4
# WebM (VP9) — plus léger
ffmpeg -i capture.mov -an -vf "scale=900:-2,fps=24" -c:v libvpx-vp9 -crf 34 -b:v 0 search.desktop.webm
```

La modale lit les vidéos en `autoplay loop muted playsinline` : elles bouclent
exactement comme un GIF, mais en bien plus léger et plus net.
