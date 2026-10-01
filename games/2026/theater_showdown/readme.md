# Theater Showdown - SAE 301

Jeu de combat musical en 1 contre 1 (Phaser 3.60), jouable sur la borne d'arcade.
Thème : **Musique & opéra**.

## Lancer le jeu

Les modules JavaScript imposent de passer par un serveur local, par exemple :

```bash
python -m http.server 8080
```

puis ouvrir http://localhost:8080.

## Commandes (borne)

| Bouton | Action |
| --- | --- |
| Joystick | se déplacer, ↑ sauter, ↓ garde |
| A | attaque rapide |
| B | attaque puissante |
| C | lancer une note de musique |
| D | attaque spéciale (jauge de 5 notes pleine) |
| E | esquive |
| F (ou Échap) | pause |

Clavier : J1 = flèches + `I O P K L M`, J2 = `Z Q S D` + `R T Y F G H`.

## Règles

- 2 manches gagnantes, 60 s par manche (au chrono : le plus de PV gagne).
- Chaque coup remplit la jauge de notes, plus vite en combo.
- Attaque spéciale : l'attaquant et le défenseur ont chacun un QTE de 4 touches ;
  les réussites de l'attaquant augmentent les dégâts, celles du défenseur les réduisent.
  Chaque personnage joue un thème classique (Mozart pour Doremi, Tchaïkovski pour Symphanie).
- Des objets tombent au hasard : rose (+PV), partition (+jauge), métronome (vitesse), baguette (force).
- 2 personnages en pixel art (Doremi et Symphanie) et 3 arènes : l'Opéra (lustre mobile),
  le Piano géant (chaque touche joue sa note) et les Coulisses (caisses, pont de projecteurs mobile).

## Organisation des fichiers

```
index.html / index.js     point d'entrée, configuration Phaser
game.json                 fiche du jeu pour la borne
presentation.png          jaquette 800x450
js/
  chargement.js           chargement des assets + animations
  menu.js                 menu principal
  commandes.js            écran des commandes et des règles
  selection.js            choix des personnages
  selection_arene.js      choix de l'arène
  combat.js               combat, manches, objets, QTE de l'attaque spéciale, HUD
  combattant.js           classe Combattant (déplacements, coups, dégâts, jauge)
  victoire.js             écran de fin
  pause.js                menu pause (lancé par-dessus le combat)
  donnees.js              personnages, arènes, objets (équilibrage)
  controles.js            touches de la borne
  fonctions.js            fonctions utilitaires partagées
assets/images, assets/sons, assets/videos
outils/                   scripts de préparation des assets (non nécessaires pour jouer)
```

## Assets

- **Visuels de l'équipe** (menus, décors, plateformes, HUD, textes, Doremi, Symphanie, clés de fa/sol,
  vidéos de rideau) : extraits de `visuel.zip` puis convertis par `outils/integrer_visuels.py`
  (noms en minuscules, recadrage, redimensionnement, compression < 200 Ko).
- **Générés par programme** : les objets bonus, les notes de musique
  (`outils/generer_images.py`) et tous les sons (`outils/generer_sons.js`). Les mélodies sont
  des œuvres du domaine public réarrangées.

```bash
python outils/integrer_visuels.py "../visuel/SAE 301"
python outils/generer_images.py
cd outils && npm install && node generer_sons.js
```

### Ajouter un personnage pixel art

Dans `js/donnees.js`, ajouter une entrée avec `sprite: SPRITE_PIXEL_ART` (frames de 128x128) et,
si besoin, `projectile: "nom_de_la_planche"`. La planche doit suivre l'ordre des 14 frames
(repos x2, marche x4, saut, garde, légère, lourde, tir, touché, K.O., victoire) ;
`integrer_visuels.py` montre comment la fabriquer.

## Reste à faire

- Mode histoire (solo) : la barre de vie de boss « Chef d'orchestre » est prête dans `visuel.zip`
- Animations complètes de Doremi et Symphanie (marche, saut, touché, K.O.) : pour l'instant
  ces frames sont fabriquées à partir des 4 dessins d'attaque
- `game.json` à compléter par l'équipe, `demo.mp4` (10 s de jeu) à enregistrer
