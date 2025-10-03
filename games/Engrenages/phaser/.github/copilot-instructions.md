# Copilot Instructions for AI Agents

## Aperçu du projet
Ce dépôt est un template de jeu vidéo utilisant Phaser 3, structuré autour d'une navigation par scènes : accueil, sélection de niveau, trois niveaux de jeu, paramètres, contrôles et crédits. Le code est organisé pour faciliter l’extension et la réutilisation des fonctionnalités.

## Structure principale
- `index.js` : Point d’entrée, configure et lance le jeu Phaser avec toutes les scènes.
- `js/` : Contient chaque scène comme un module ES6 (`accueil.js`, `selection.js`, `niveau1.js`, `niveau2.js`, `niveau3.js`, etc.).
- `fonctions.js` : Centralise les fonctions utilitaires réutilisables, à importer dans d’autres modules.
- `assets/` : Ressources graphiques (fonds, sprites, boutons, etc.).
- `maps/` : Cartes de niveaux au format Tiled (`.tmx`, `.json`).

## Conventions et patterns spécifiques
- **Modularité** : Chaque scène est une classe ES6 exportée par défaut, héritant de `Phaser.Scene`.
- **Import/Export** : Utiliser l’import ES6 pour partager des fonctions ou des classes entre fichiers (`import ... from ...`).
- **Fonctions utilitaires** : Ajouter les fonctions partagées dans `fonctions.js` et les importer explicitement là où nécessaire.
- **Ressources** : Charger les assets dans la méthode `preload()` de chaque scène.
- **Navigation** : Utiliser `this.scene.switch("nom_scene")` pour changer de scène.
- **Physique** : Utiliser le moteur Arcade de Phaser pour la gestion des collisions et de la gravité.

## Workflows développeur
- **Lancement local** : Ouvrir `index.html` dans un navigateur moderne. Le script principal est chargé en tant que module ES6.
- **Ajout d’une scène** : Créer un nouveau fichier dans `js/`, l’exporter comme classe héritant de `Phaser.Scene`, puis l’ajouter dans le tableau `scene` de `config` dans `index.js`.
- **Ajout d’une fonction utilitaire** : Ajouter dans `fonctions.js` et l’importer explicitement dans les modules consommateurs.
- **Ajout d’un asset** : Placer le fichier dans `assets/` et le charger dans la scène concernée via `this.load.image()` ou équivalent.

## Points d’attention
- **Respecter la structure des imports/exports** pour garantir la modularité.
- **Ne pas modifier directement les fichiers de ressources partagés** (assets, maps) sans coordination.
- **Les chemins d’accès aux assets sont relatifs à la racine du projet**.
- **Aucune configuration de build ou de test automatisé n’est présente** : le projet est conçu pour un usage direct dans le navigateur.

## Exemples
- Import d’une fonction utilitaire :
  ```js
  import { doNothing } from "./js/fonctions.js";
  ```
- Ajout d’une scène :
  ```js
  import nouvelleScene from "./js/nouvelleScene.js";
  // ...
  scene: [accueil, selection, niveau1, niveau2, niveau3, nouvelleScene, ...]
  ```

## Fichiers clés
- `index.js`, `js/accueil.js`, `js/selection.js`, `js/niveau1.js`, `js/niveau2.js`, `js/niveau3.js`, `js/fonctions.js`, `assets/`, `maps/`

Pour toute modification structurelle, suivre les patterns existants et documenter les changements dans le README.
