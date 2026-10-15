# Partie 2 : hors évaluation

> **Cette partie n'est pas à prendre en compte dans l'évaluation.** La partie évaluée est la **partie 1** (`js/partie1/`, voir son `lisez-moi.md`), sur laquelle nous avons concentré notre travail et notre compréhension du code.
>
> La partie 2 a été ajoutée à la fin, uniquement pour **rendre le jeu plus intéressant sur la borne** et répondre à la demande de **Nicolas Maurin** : rendre le jeu **plus difficile** et **ajouter du contenu**.

## Ce qu'elle contient
- la fuite du niveau 2 (`niveau2.js`, `poursuite.js`, `vide.js`, `faisceaux.js`, `fuite.js`),
- le dernier combat contre le Dieu enragé (`niveau3.js`, `boss_final.js`, `attaques.js`, `attaques_ultimes.js`, `forme_finale.js`),
- le mode NO HIT (`mode_no_hit.js`) : en maintenant les touches O et M pendant 1 seconde, on active un mode où le robot n'a qu'1 PV (barre de vie d'une seule cellule) : un seul coup reçu fait recommencer tout le jeu depuis le début du niveau 1 ; la même manipulation le désactive. Une petite phrase blanche « NO HIT » est alors affichée en bas à droite de l'écran de jeu. Si on termine le jeu sans avoir quitté le mode, une pastille « NO HIT » apparaît à côté de la ligne dans le panthéon,
- la fausse fin (`faux_pantheon.js`), les musiques et sons ajoutés (`musique.js`, `synth.js`), et des touches de test (`tests_borne.js`).

## Comment elle s'accroche à la partie 1
Elle **ne modifie pas** la partie 1 : elle s'y branche par des listes prévues pour ça (`PROFILS` et `ATTAQUES` dans `partie1/ennemis/boss.js`, `CHARGEMENTS_SUPPLEMENTAIRES`, `EXTENSIONS_NIVEAU1`...). Si on retire l'appel à `installerPartie2()` dans `index.js`, le jeu s'arrête à la fin du premier boss et fonctionne normalement.

## La retirer complètement
La partie 2 est indépendante. Pour la retirer : (1) supprimer le dossier `js/partie2/` ; (2) dans `index.js`, supprimer la ligne `import { installerPartie2, ... }`, l'appel `installerPartie2();`, l'appel `activerTestsPartie2(game);` et `...scenesPartie2` dans la liste des scènes. Rien d'autre à changer : la partie 1 n'importe jamais la partie 2. Le jeu s'arrête alors à la défaite du premier boss (le choix du panthéon mène aux crédits puis au classement, quelle que soit la réponse). Nous l'avons testé : jeu lancé sans le dossier `partie2`, boss battu, crédits atteints, aucune erreur.
