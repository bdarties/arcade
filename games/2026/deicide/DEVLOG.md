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

## Raccourcis de la borne (`reset.js`)
- Les boutons physiques sont nommés A à F ; ils envoient I, O, P, K, L et ; : **C = P** et **F = ;**. Les deux boutons du centre sont select (Z) et start (X).
- **Z + X maintenus 1,5 s** : retour à l'écran d'accueil (reset pour le joueur suivant). **C + F maintenus 1,5 s** : aller directement au boss (raccourci de test, à retirer avant la borne).
- Le robot n'utilise que I, K, L et O : aucun de ces raccourcis ne se déclenche en jouant. X ouvre la pause, sauf si Z est déjà maintenu.

## Le son des combats de boss
- **Musique plus forte** : le metal passe de 0,2 à 0,42 de volume de base (le niveau est à 0,3 avec un morceau plus doux) ; le réglage « Musique » du menu pause la baisse toujours.
- **Mesure de la musique** (Boss Battle #8, analysée avec un script) : 200 battements par minute, donc un battement = 300 ms. L'introduction dure exactement 8 mesures (9,6 s) et la boucle 170 battements (51 s), donc la boucle repart bien sur un temps. La tonalité est en ré (mineur : le sib est présent).
- **Les bruitages sont accordés** : au lieu d'une hauteur au hasard (±1 demi-ton), chaque son prend, pendant un combat de boss, la note de la gamme de ré mineur la plus proche. J'ai mesuré la hauteur de chaque son (analyse de son spectre) pour calculer de combien le décaler (tableau `ACCORD` dans `sons.js`).
- **Les attaques sont en rythme** : leurs durées sont arrondies à des croches (150 ms), elles démarrent sur une croche (position de la musique lue avec `seek`), et les sons d'attaque (incantation, orbes, rayon) sont joués sur la croche la plus proche. Mesuré : en moyenne 14 ms d'écart à la croche, 33 ms au maximum (une image à 30 images par seconde).
- Le robot lui-même (tir, saut) reste instantané : on ne retarde jamais une action du joueur.

## Un seul code pour les niveaux
- `niveau1.js` lit sa config (map, départ, musique, salles, arène) : `niveau2` et `niveau3` en héritent (`extends`). On ne copie pas 150 lignes de `create`.
- `figerCalques` découpe le décor en bandes horizontales pour un niveau haut, verticales pour un niveau large.
- `endormirLesLoins` regarde aussi la distance horizontale (sinon tous les ennemis d'un niveau large dorment ou se réveillent d'un coup).

## Les maps sont générées
- `outils/generer_niveaux.py` écrit `niveau2_genere.json` (une map d'exemple) à partir de colonnes et de longueurs de trous. Les fichiers sont des maps Tiled normales : on peut les rouvrir dans Tiled pour les retoucher.
- Si on change un trou, on relance le script : il vérifie que le niveau reste faisable.

## Les boss
- `boss.js` a un profil par boss : le **Soldat** (fin du niveau 1, 80 PV, 2 phases, il s'enrage à 0 PV au lieu de mourir) et le **Soldat v2** (dernier combat, 130 PV, 3 phases, rouge et plus grand, attaques bien plus rapprochées).
- **Dernier combat** (`niveau3.js`, une arène de la taille de l'écran) : après la fuite, on affronte le même boss en version enragée. Cette fois il meurt pour de bon : bonus de 3 000 points (30 s retirées du temps net), chrono arrêté, classement.
- Pourquoi une scène à part : `boss.js` suppose une arène de 1280 px qui commence à x = 0, alors que le niveau 2 est large.
- **La fuite devient plus dure en avançant** (`poursuite.js`) : le mur passe de 232 à 264 px/s (le robot marche à 260, donc à la fin il faut dasher) et le boss attaque de plus en plus souvent (toutes les 2,3 s puis toutes les 1,5 s).

## Ce qui n'est pas mesuré
- La durée réelle d'une partie (visée : environ 2 min 30 par niveau) : à chronométrer en jouant.
- Les FPS sur la borne avec le niveau 2 (map de 8 960 px de large) : à vérifier avec F3.
