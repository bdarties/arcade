# Partie 2 : non soumise à l'évaluation

> **Nous ne souhaitons pas soumettre la partie 2 du code à l'évaluation : nous ne présentons que la partie 1** (`js/partie1/`, voir son `lisez-moi.md`), sur laquelle nous avons concentré notre travail et notre compréhension du code.
>
> La partie 2 est uniquement présente pour **améliorer la rejouabilité du jeu sur la borne** : elle le rend **plus difficile** et lui ajoute du **contenu**, suite à la demande de **Nicolas Maurin**.

## Ce qu'elle contient
- la fuite du niveau 2 (`niveau2.js`, `poursuite.js`, `vide.js`, `faisceaux.js`, `fuite.js`),
- le dernier combat contre le Dieu enragé (`niveau3.js`, `boss_final.js`, `attaques.js`, `attaques_ultimes.js`, `forme_finale.js`),
- le mode NO HIT (`mode_no_hit.js`) : en maintenant les touches O et M pendant 1 seconde, on active un mode (qui ramène aussitôt au début du niveau 1) où le robot n'a qu'1 PV (barre de vie d'une seule cellule) : un seul coup reçu fait recommencer tout le jeu depuis le début du niveau 1 ; la même manipulation le désactive. Au début de chaque partie, un petit message (« Maintenir B + F pendant 1 seconde ... ») reste affiché 5 secondes au même endroit. Une petite phrase blanche « NO HIT » est alors affichée en bas à droite de l'écran de jeu. Si on termine le jeu sans avoir quitté le mode, sa ligne du panthéon est affichée en rouge, avec un crâne en pixel art à côté et du sang qui coule (fond rouge sombre, éclaboussures, gouttes),
- la fausse fin (`faux_pantheon.js`), les musiques et sons ajoutés (`musique.js`, `synth.js`), et des touches de test (`tests_borne.js`).

## Comment elle s'accroche à la partie 1
Elle **ne modifie pas** la partie 1 : elle s'y branche par des listes prévues pour ça (`PROFILS` et `ATTAQUES` dans `partie1/ennemis/boss.js`, `CHARGEMENTS_SUPPLEMENTAIRES`, `EXTENSIONS_NIVEAU1`...). Si on retire l'appel à `installerPartie2()` dans `index.js`, le jeu s'arrête à la fin du premier boss et fonctionne normalement.

## La retirer complètement
La partie 2 est indépendante. Pour la retirer : (1) supprimer le dossier `js/partie2/` ; (2) dans `index.js`, supprimer la ligne `import { installerPartie2, ... }`, l'appel `installerPartie2();`, l'appel `activerTestsPartie2(game);` et `...scenesPartie2` dans la liste des scènes. Rien d'autre à changer : la partie 1 n'importe jamais la partie 2. Le jeu s'arrête alors à la défaite du premier boss (le choix du panthéon ramène alors directement au menu, quelle que soit la réponse). Nous l'avons testé : jeu lancé sans le dossier `partie2`, boss battu, crédits atteints, aucune erreur.
