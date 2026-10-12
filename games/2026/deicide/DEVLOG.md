# DEVLOG DEICIDE : pourquoi on a fait ces choix

## Niveau 2 : horizontal et centré sur le dash
- **Pourquoi un autre sens de jeu ?** Le niveau 1 monte, le niveau 2 va vers la droite : même robot, même lumière, mais une autre façon de jouer. Le dash devient indispensable (trous de 12 tuiles) au lieu d'être un bonus.
- **Les chiffres qui décident du niveau** (lus dans `personnage.js`) : marche 260 px/s, saut de 180 px de haut, dash d'environ 175 px, recharge du dash 600 ms. Sans dash un saut franchit environ 9 tuiles : les trous de 12 tuiles le demandent. Le script de génération refuse un trou de plus de 12 tuiles.
- **Test avec un robot** (script de test) : le saut suivi d'un dash entre 350 et 450 ms après le décollage passe les trous de 11 à 12 tuiles, même avec une plateforme 2 tuiles plus haute. Un dash trop tôt (250 ms) tombe dans le vide.
- **Le vide** : le bas de la map est un sol invisible, donc on ne « tombe » jamais vraiment. `vide.js` retire 1 PV et remet le robot sur le dernier sol sûr, sinon le robot resterait coincé en bas.

## La fuite : le Soldat enragé (fin du niveau 1 → niveau 2)
- **Pourquoi la fin du niveau 1 change :** à 0 PV, le Soldat ne meurt plus : il s'enrage (rouge, plus gros), le mur de droite de l'arène se brise (`arene.js`) et le robot doit fuir. En franchissant l'ouverture, on passe au niveau 2.
- **Niveau 2 = une course-poursuite** (`poursuite.js`) : un mur de lumière avance à 232 px/s (le robot marche à 260 px/s) et le boss enragé vole derrière en lançant orbes, pluies d'orbes et colonnes de lumière. Le mur ne rattrape que celui qui s'arrête ou rate un saut : le dash sert à reprendre de l'avance.
- **Pas de salle fermée dans le niveau 2** : on ne peut pas s'arrêter pendant une fuite. Les salles de combat restent dans le niveau 1.
- **La map du niveau 2 est dessinée dans Tiled** par Mathys. Le jeu lit des points dans des calques d'objets (`depart`, `fin`, `faisceau`, ennemis...) au lieu de colonnes écrites en dur dans le code : changer la map ne demande aucun changement de code (voir `assets/maps/LISEZ-MOI.md`).
- **Le boss de la fuite n'est pas le moteur de `boss.js`** : ses attaques étaient liées à une arène fixe de 1280 px (sol, colonnes à x précis). Pendant la fuite tout est posé par rapport au robot et à l'écran, d'où un petit fichier à part qui réutilise juste les orbes et les feuilles d'images du boss.

## Un seul code pour les niveaux
- `niveau1.js` lit sa config (map, départ, musique, salles, arène) : `niveau2` et `niveau3` en héritent (`extends`). On ne copie pas 150 lignes de `create`.
- `figerCalques` découpe le décor en bandes horizontales pour un niveau haut, verticales pour un niveau large.
- `endormirLesLoins` regarde aussi la distance horizontale (sinon tous les ennemis d'un niveau large dorment ou se réveillent d'un coup).

## Les maps sont générées
- `outils/generer_niveaux.py` écrit `niveau2.json` et `arene_dieu.json` à partir de colonnes et de longueurs de trous. Les fichiers sont des maps Tiled normales : on peut les rouvrir dans Tiled pour les retoucher.
- Si on change un trou, on relance le script : il vérifie que le niveau reste faisable.

## Les boss
- Un seul moteur (`boss.js`), deux profils : le **Soldat** (fin du niveau 1, 80 PV, 2 phases) et le **Dieu** (fin du niveau 2, 200 PV, 3 phases, plus grand).
- Le Dieu a sa propre scène (`niveau3.js`, une salle de la taille de l'écran) : `boss.js` suppose une arène de 1280 px qui commence à x = 0, alors que le niveau 2 est large. Plutôt que de réécrire toutes les positions du boss, on le met dans une salle à part.
- **Attaque du Dieu pour le dash** : le rayon large couvre la moitié de l'arène et prévient moins d'une seconde avant. À pied on fait environ 230 px dans ce temps, avec un dash environ 400 px : il faut dasher pour changer de côté.
- Le sprite du Dieu est un **remplaçant** (l'ange du Soldat, agrandi et doré) en attendant une nouvelle image.

## Ce qui n'est pas mesuré
- La durée réelle d'une partie (visée : environ 2 min 30 par niveau) : à chronométrer en jouant.
- Les FPS sur la borne avec le niveau 2 (map de 8 960 px de large) : à vérifier avec F3.
