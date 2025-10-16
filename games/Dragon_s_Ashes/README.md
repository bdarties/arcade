# README - Jeu Dragon Aventure

## Description
"Dragon Aventure" est un jeu de plateforme/action où le joueur incarne un dragon et doit explorer le monde afin de se venger. Le joueur progresse en sautant, volant, attaquant au corps à corps et en tirant du feu.

---

## Commandes

### Mouvement du dragon
- Flèche gauche → se déplacer vers la gauche
- Flèche droite → se déplacer vers la droite
- Touche P → saut (si bonus de vol acquis, permet multi-sauts dans les airs)

### Attaques
- Touche O → tirer des projectiles de feu (après ouverture du coffre)
- Touche I → attaque corps à corps

### Interactions
- Touche K → interagir avec objets (ouvrir coffres, fermer popup)

### Pause
- Touche M → activer/désactiver le menu pause
  - Le menu pause bloque le mouvement du joueur et réduit le volume des sons.
  - Appuyez sur M pour reprendre le jeu.

---

## Système de jeu

### PV et Vies
- Le dragon possède 3 PV par défaut.
- Si les PV tombent à 0, une vie est perdue.
- Si toutes les vies sont perdues → écran de défaite.

### Bonus
- **Vol** : Permet de voler dans les airs et de sauter plusieurs fois avant de toucher le sol. Limitée par la barre d’endurance.
- **Barre d’endurance** : 
  - Verte → assez d’endurance
  - Jaune → faible
  - Rouge → très faible
  - Recharge uniquement lorsque le joueur est au sol.

### Coffres et objets
- Certains objets sont interactifs : 
  - Coffres → permettent d’acquérir le tir (boule de feu)
  - Bonus de saut → active le vol

### Ennemis
- Plusieurs types :
  - Chevalier → attaque au corps à corps
  - Magicien → tire des projectiles
  - Boss → attaque spéciale et possède barre de vie
- Les ennemis sont actifs seulement si le joueur est proche de leur zone de détection.

### Mort
- Tuiles mortelles → touchent le joueur et retirent des PV
- Chute ou collision avec ennemis → perte de PV

---

## Sons et Musiques
- Musique de fond, sons d’attaque, de tir, de hit et de coffre.
- Volume des sons réduit automatiquement pendant le menu pause.

---

## Graphismes
- Animations du joueur et des ennemis basées sur des spritesheets.
- Effets visuels pour les attaques et les projectiles.
- Fond, décor et calques interactifs pour créer un niveau immersif.

---

## Plugins
- **AnimatedTilesPlugin** → permet d’animer certaines tuiles (ex : eau, lave, piques)


---

## Développement
- Le code principal se trouve dans `selection.js`.
- Fonctions utilitaires (tir, mise à jour PV, animations) → `fonctions.js`
- Les ennemis sont définis dans `ennemi.js`.
- Les niveaux sont définis via Tiled JSON (`map.json`).

---

## Notes
- Les popups bloquent temporairement le mouvement du joueur.
- Le jeu est conçu pour fonctionner avec clavier, mais peut être adapté pour contrôleurs.
- Les paramètres de sons et volumes peuvent être modifiés dans la section `create()`.

---

## Auteur
- Projet développé par [Noé Balmoussière, Bleuenn Bergeault, Simon Briez].