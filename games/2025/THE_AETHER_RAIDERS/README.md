# The Aether Raider

Jeu développé avec **Phaser 3**, combinant plateforme, RPG et mini-jeux de rythme. Le projet est organisé en plusieurs scènes et scripts, avec une gestion avancée du HUD, des compétences, des ennemis, des téléporteurs et des interactions.

## Structure du projet

phaser/
│
├── index.html
├── index.js
├── js/
│ ├── boss.js
│ ├── debut.js
│ ├── fonctions.js
│ ├── selection.js
│ ├── tutoriel.js
├── src/
│ ├── Enemy.js
│ ├── enemy1.js
│ ├── enemy2.js
│ ├── enemy3.js
│ ├── enemy4.js
│ ├── Tesla.js
│ ├── map/
│ │ └── map1.json
│ └── ...
├── assets/
│ ├── images (.png, .jpg)
│ ├── spritesheets (.png)
│ ├── sons (.mp3)
│ └── css (.css)

## Fichiers principaux

### `index.html` & `index.js`
- Point d’entrée du jeu.
- Charge Phaser et initialise la scène principale.

### `js/selection.js`
- **Scène principale** du jeu d’aventure/plateforme.
- Gestion du joueur, des ennemis, du HUD (HTML/CSS), des compétences, des téléporteurs, des leviers, du PNJ de trade, du pet, du menu pause et des skills.
- Système de téléporteurs et de triggers pour changer de scène.
- Gestion des barres de vie, mana, XP, or, skills, etc.
- Système de pause/menu avec navigation clavier et boutons interactifs.
- Gestion des animations et des interactions complexes.

### `js/boss.js`
- **Scène du boss** : mini-jeu de rythme.
- Affichage dynamique du fond du boss selon la phase (`boss_full`, `boss_mid`, `boss_dead`, `victoire`).
- Gestion des notes, des feedbacks ("Parfait", "Bien", "Raté"), du score et de la victoire/défaite.
- Interface de fin de partie (victoire/défaite) avec navigation clavier et boutons.
- Animation et gestion du sprite joueur (attaque, dégâts, feedback visuel/sonore).

### `js/debut.js`
- **Scène d’introduction** ou menu principal.
- Affichage du titre, boutons pour lancer le jeu, accéder aux contrôles ou aux skills.

### `js/fonctions.js`
- Fonctions utilitaires partagées entre les scènes.

### `js/tutoriel.js`
- Scène de tutoriel (explications, contrôles, etc.).

### `src/Enemy.js` & `src/enemyX.js`
- Classes pour les différents types d’ennemis (parabolic, cone, spider, bowling).
- Gestion des animations, IA, attaques, projectiles, barre de vie, loot (XP, or).

### `src/Tesla.js`
- Gestion de l’ennemi Tesla (attaque, état on/off, interaction avec leviers).

---

## Fonctionnalités principales

- **Plateforme & RPG** : déplacement, saut, dash, jetpack, attaque corps-à-corps et à distance, progression par compétences.
- **HUD avancé** : affichage HTML/CSS pour le niveau, points, or, skills, barre de vie/mana/XP.
- **Ennemis variés** : IA, patrouille, attaque, projectiles, loot, animations.
- **Pet** : compagnon qui suit le joueur ou attaque les ennemis, avec IA et projectiles.
- **Téléporteurs & leviers** : déplacement rapide, triggers de scènes, activation/désactivation d’obstacles.
- **PNJ de trade** : échange d’or contre XP via interaction.
- **Menu pause & skills** : navigation clavier, pages internes, amélioration des compétences.
- **Boss (jeu de rythme)** : notes synchronisées à la musique, feedbacks, phases visuelles, victoire/défaite.

---

## Lancement du jeu

1. Ouvre `index.html` dans un navigateur compatible.
2. Assure-toi que tous les assets (images, sons, spritesheets, map) sont présents dans le dossier `assets/` et `src/map/`.
3. Navigue dans le menu, lance la partie, explore, combats les ennemis, améliore tes compétences et affronte le boss !

---

## Personnalisation & Ajouts

- Ajoute tes propres assets dans `assets/`.
- Modifie les scènes dans `js/` pour ajuster le gameplay, les interactions ou l’UI.
- Les compétences, ennemis et mécaniques sont facilement extensibles via les fichiers de classes.

---

## Crédits

Projet réalisé par Mathis, SAE301.  
Framework : Phaser 3  
Assets : personnalisés et libres de droits.

---

## Conseils

- Pour toute modification, vérifie la cohérence des chemins d’assets et la gestion des profondeurs (`setDepth`) pour l’affichage.
- Utilise le système de HUD HTML/CSS pour un affichage flexible et moderne.
- Consulte les fichiers de chaque ennemi pour personnaliser leur comportement et leurs animations.

---

Bon jeu !