# DEVLOG DEICIDE : pourquoi on a fait ces choix

## Niveau 2 : horizontal et centré sur le dash
- **Pourquoi un autre sens de jeu ?** Le niveau 1 monte, le niveau 2 va vers la droite : même robot, même lumière, mais une autre façon de jouer. Le dash devient indispensable (trous de 12 tuiles) au lieu d'être un bonus.
- **Les chiffres qui décident du niveau** (lus dans `personnage.js`) : marche 260 px/s, saut de 180 px de haut, dash d'environ 175 px, recharge du dash 600 ms. Sans dash un saut franchit environ 9 tuiles : les trous de 12 tuiles le demandent. Le script de génération refuse un trou de plus de 12 tuiles.
- **Test avec un robot** (script de test) : le saut suivi d'un dash entre 350 et 450 ms après le décollage passe les trous de 11 à 12 tuiles, même avec une plateforme 2 tuiles plus haute. Un dash trop tôt (250 ms) tombe dans le vide.
- **Le vide** : le bas de la map est un sol invisible, donc on ne « tombe » jamais vraiment. `vide.js` retire 1 PV et remet le robot sur le dernier sol sûr, sinon le robot resterait coincé en bas.

## La fuite : le Dieu enragé (fin du niveau 1 → niveau 2)
- **Pourquoi la fin du niveau 1 change :** à 0 PV, le Dieu ne meurt plus : il s'enrage (rouge, plus gros), le mur de droite de l'arène se brise (`arene.js`) et le robot doit fuir. En franchissant l'ouverture, on passe au niveau 2.
- **Niveau 2 = une course-poursuite** (`poursuite.js`) : un mur de lumière avance à 232 px/s (le robot marche à 260 px/s) et le boss enragé vole derrière en lançant orbes, pluies d'orbes et colonnes de lumière. Le mur ne rattrape que celui qui s'arrête ou rate un saut : le dash sert à reprendre de l'avance.
- **Pas de salle fermée dans le niveau 2** : on ne peut pas s'arrêter pendant une fuite. Les salles de combat restent dans le niveau 1.
- **La map du niveau 2 est dessinée dans Tiled** par Mathys. Le jeu lit des points dans des calques d'objets (`depart`, `fin`, `faisceau`, ennemis...) au lieu de colonnes écrites en dur dans le code : changer la map ne demande aucun changement de code (voir `assets/maps/LISEZ-MOI.md`).
- **Le boss de la fuite n'est pas le moteur de `boss.js`** : ses attaques étaient liées à une arène fixe de 1280 px (sol, colonnes à x précis). Pendant la fuite tout est posé par rapport au robot et à l'écran, d'où un petit fichier à part qui réutilise juste les orbes et les feuilles d'images du boss.

## Raccourcis de la borne (`systemes/raccourcis.js`)
- Les boutons physiques sont nommés A à F ; ils envoient I, O, P, K, L et ; : **C = P** et **F = ;**. Les deux boutons du centre sont select (Z) et start (X).
- **C + F maintenus 0,5 s** (P et ; au clavier, la touche M en AZERTY) : retour à l'écran d'accueil (reset pour le joueur suivant). **Z + B maintenus 0,5 s** : aller directement au boss (raccourci de test, à retirer avant la borne).
- Le robot n'utilise que I, K, L et O : aucun de ces raccourcis ne se déclenche en jouant. X (start) ouvre la pause.

## Le son des combats de boss
- **Musique plus forte** : le metal passe de 0,2 à 0,42 de volume de base (le niveau est à 0,3 avec un morceau plus doux) ; le réglage « Musique » du menu pause la baisse toujours.
- **Mesure de la musique** (Boss Battle #8, analysée avec un script) : 200 battements par minute, donc un battement = 300 ms. L'introduction dure exactement 8 mesures (9,6 s) et la boucle 170 battements (51 s), donc la boucle repart bien sur un temps. La tonalité est en ré (mineur : le sib est présent).
- **Les bruitages sont accordés** : au lieu d'une hauteur au hasard (±1 demi-ton), chaque son prend, pendant un combat de boss, la note de la gamme de ré mineur la plus proche. J'ai mesuré la hauteur de chaque son (analyse de son spectre) pour calculer de combien le décaler (tableau `ACCORD` dans `sons.js`).
- **Les attaques sont en rythme** : leurs durées sont arrondies à des croches (150 ms), elles démarrent sur une croche (position de la musique lue avec `seek`), et les sons d'attaque (incantation, orbes, rayon) sont joués sur la croche la plus proche. Mesuré : en moyenne 14 ms d'écart à la croche, 33 ms au maximum (une image à 30 images par seconde).
- **Plus de bruit avant une attaque du boss** : le son de préparation (incantation du mage, puis grondement, puis laser grave) n'a convaincu personne, il est retiré. Les attaques gardent seulement leurs bruits d'impact (orbes, rayon), accordés et calés sur les croches. Un bruit de préparation pourra être ajouté plus tard (`jouerSonSurLeTemps` sait déjà caler un son sur la musique).
- **Autre musique pour le dernier boss** (13/10) : « Boss Battle #9 [Metal] » de nene (CC0, OpenGameArt), plus dure que la #8. Mesurée avec le fichier MIDI du morceau : 113 battements par minute (un battement = 531 ms), l'intro fait 8 mesures et la boucle 20 mesures ; les notes sont en mi mineur (E, D, C, G, F#, B, A), donc un ton au-dessus de ré mineur : les bruitages accordés prennent +200 centièmes de ton. Le pas de rythme passe à la double-croche (133 ms) : avec la croche (265 ms), une annonce de 630 ms tombait à 531 ms, et la colonne de lumière aurait tombé 31 ms après s'être figée (impossible à éviter). Volume de base 0,18 au lieu de 0,42 : la #9 est 7 dB plus forte (mesure en LUFS : -7,6 contre -14,8). Le Soldat du niveau 1 garde la #8.
- Le robot lui-même (tir, saut) reste instantané : on ne retarde jamais une action du joueur.

## Le panthéon (anciennement « classement », `scenes/classement.js`)
- **Nom** : le tableau des scores s'appelle maintenant le panthéon à l'écran (le fichier et la scène gardent le nom `classement`, pour ne pas tout renommer).
- **Choix d'enregistrer** : si le temps entre dans le top 10, deux boutons OUI / NON demandent « enregistrer ton score » avant la saisie du nom. NON : rien n'est envoyé, le tableau reste tel quel.
- **Stats** : le panneau de gauche montre le temps total (réel, sans rien retirer), le nombre de morts, les points, le bonus, puis le temps net. Le tableau montre pour chaque joueur le temps net (celui qui classe), le temps total et les morts.
- **Pourquoi un score « empaqueté »** : l'API de la borne ne stocke que le jeu, le nom et UN entier par score, et on ne doit pas modifier `app/` (code partagé). On range donc trois chiffres dans l'entier : `(999999 - temps net en cs) x 100 000 000 + (999999 - temps total en cs) x 100 + (99 - morts)`. Le temps net pèse le plus : le tri de la borne (plus grand en tête) classe comme avant, puis le temps total le plus court, puis le moins de morts. Le plus gros nombre fait environ 1e14, sous la limite des entiers de JavaScript (9e15). Les anciens scores (10 000 000 - temps net en ms) sont reconnus (ils sont plus petits que 1e8) et affichés sans temps total ni morts.
- **Morts** : `registry "morts"`, remis à 0 au lancement d'une partie (menu.js, raccourcis.js), +1 à chaque `mourir()` de niveau.js.

## Le jeu en deux parties : js/partie1 et js/partie2 (13/10)
- **Pourquoi** : pour pouvoir expliquer le jeu à l'oral jusqu'à la fin du 1er boss, sans que la suite (la fuite, le dernier combat) ne se mélange au code à présenter.
  `js/partie1` est un jeu complet, qui s'arrête quand le Dieu de la Lumière est vaincu (le joueur choisit alors d'enregistrer son temps dans le panthéon).
  `js/partie2` est la suite, jouée seulement si le joueur répond OUI au choix du panthéon.
- **Ce qui est dans la partie 2** : le niveau 2 (la fuite : `poursuite.js`, `vide.js`, `faisceaux.js`), le mur qui se brise et le Dieu qui s'enrage (`fuite.js`), le niveau 3 et le
  boss final (`niveau3.js`, `bossFinal.js`), ses attaques en plus (`attaques.js` : lasers, geysers, spirale, piqué), sa musique (`musique.js`), un conseil (`astuce.js`) et les
  touches de test F9 et F10 (`testsBorne.js`). Tout le reste est dans la partie 1, y compris le choix du panthéon et le robot « en boule ».
- **Comment la partie 2 se branche sans modifier la partie 1** : la partie 1 expose des tables et des listes, la partie 2 y ajoute ses éléments au démarrage (`installerPartie2()`).
  `PROFILS` et `ATTAQUES` (moteur des boss) : le boss final est un profil de plus, ses attaques sont des attaques de plus. `MUSIQUES_BOSS` : sa musique, son tempo et sa
  tonalité. `CHARGEMENTS_SUPPLEMENTAIRES` : ses cartes. `EXTENSIONS_NIVEAU1` : la fuite après le boss. Le boss du niveau 1 a un champ `suite` : la partie 2 y met la fonction
  qui fait s'enrager le Dieu ; sans elle, la réponse OUI termine simplement la partie.
- **Le moteur du boss a été rendu générique** (`partie1/ennemis/boss.js`) : avant, le même fichier mélangeait les deux boss avec des « si c'est le dernier boss ». Maintenant les
  réglages de chaque phase sont dans `BASE` (boss 1) ou dans le profil (`reglages`), et les attaques sont une table de `{ charge, apres, annoncer, executer }`.
- **Rien n'a changé dans le jeu** (vérifié) : un script lance chacune des 35 attaques des deux boss (chaque phase) avant et après la séparation et compare le nombre d'orbes,
  de zones de lumière, de lasers, le piqué et la durée : 0 écart. Le parcours complet (niveau 1, boss, choix, fuite, niveau 2, niveau 3, boss final, panthéon), le reset à 0,5 s dans huit situations
  et les touches F9 et F10 donnent les mêmes résultats. La partie 1 a aussi été testée SEULE (sans le dossier partie2) : le jeu va jusqu'au choix du panthéon, OUI et NON mènent à l'écran de fin.

## Optimisation de la borne et reset (13/10)
- **Reset C + F (0,5 s)** : il remet tout à zéro, quelle que soit la situation (pause, arène, choix du panthéon, fuite, mort en cours, niveau 2 ou 3) : plus de boss, mur de l'arène refermé, ennemis revenus (21), chrono, score et morts à 0. Vérifié par un script qui provoque chaque situation puis le reset.
- **Fuites corrigées** (mesurées avec un script, avant/après) : (1) les clignotements « sans fin » des traits d'annonce du boss restaient actifs après la destruction de leurs objets : jusqu'à 212 animations qui montaient sans jamais redescendre pendant un combat, maintenant 23 au plus (`effets.clignoter`) ; (2) chaque nouvelle partie laissait un son de plus et des écouteurs d'événements en mémoire (1 son et 3 écouteurs par reset, 6 par mort) : une borne allumée toute la journée en accumulait des milliers, maintenant 1 son et 71 écouteurs en permanence ; (3) l'arène oubliait mal ses repères à la nouvelle partie.
- **Le reset ne peut plus se déclencher tout seul** (constaté après un gel de la borne au lancement, juste après la fusion qui avait raccourci le reset à 0,5 s) : quand deux boutons sont maintenus, le navigateur répète la touche toutes les 30 ms. Avant, le reset repartait aussitôt après s'être fait (12 redémarrages en 4 s avec les boutons tenus), et si les boutons C et F étaient déjà enfoncés pendant le chargement (le navigateur ne voit alors que des répétitions), le jeu redémarrait en boucle (5 changements d'écran en 2 s). Maintenant : les répétitions de touche sont ignorées (seul un vrai nouvel appui compte) et un verrou impose de relâcher tous les boutons après un reset. Mesuré avant/après avec un script.
- **Mémoire au lancement** : toute la musique était décodée d'un coup au démarrage (117 s de son = 41 Mo en mémoire, le Raspberry Pi 3 n'a que 1 Go). La musique du boss (21 Mo) est maintenant chargée en arrière-plan une fois le niveau 1 lancé (elle est prête bien avant l'arène), et celle du dernier boss (21 Mo de plus) seulement à l'arrivée au dernier combat. Au lancement : 20 Mo de musique au lieu de 41 Mo, 62 Mo auparavant avec la nouvelle musique. Si le joueur arrive à l'arène avant la fin du chargement, la musique démarre dès qu'elle est prête.
- **Ce qui est déjà léger** (mesuré) : le processeur du jeu (moins de 1 % sur un Mac, même avec toutes les attaques du boss), la surface dessinée (1,5 à 4 fois l'écran), les textures (23 Mo, stables après des dizaines de morts).
- **Non vérifié** : tout ça est mesuré sur un Mac, pas sur le Raspberry Pi.

## Le robot « en boule » (`personnage/boule.js`)
- **Règle** : immobile plus d'1 seconde (aucune touche tenue, aucune action en cours, au sol, vitesse horizontale nulle), le robot est « en boule » : il garde sa pose d'attente et clignote, et il est invulnérable à tous les dégâts. Il en sort dès qu'il bouge, saute, tire ou dashe.
- **Exception** : les rayons du boss le blessent quand même (colonnes, balayage, geysers, lasers) ainsi que le mur de lumière de la fuite (sinon on laisserait passer le mur en restant immobile). `blesserJoueur(degats, cause, perce)` : `perce` vaut vrai pour ces rayons.
- **Piège rencontré** : au sol le robot rebondit un tout petit peu en permanence (rebond de 0,2) : sa vitesse verticale n'est jamais nulle, donc on ne la teste pas.
- Vérifié par script : en boule, plus aucun coup des orbes, de la nova, de la spirale ni du piqué ; les colonnes, le balayage et les lasers blessent toujours.

## Le mode 1 contre 1 (`versus.js`)
- **Lancement** : un bouton « 2 JOUEURS » sur l'écran d'accueil (haut / bas pour choisir, un bouton pour valider). Un bouton du joueur 2 (R, T, Y, F, G, H, N) lance aussi directement le duel.
- **Arène** : les 22 dernières lignes de `niveau1.json` (le bas de la map 1, là où le robot démarre) découpées par `outils/generer_niveaux.py` : mêmes tuiles, 1280 x 704 px, la taille de l'écran. Pas de voile d'obscurité ni de lanternes : un halo de la couleur de chaque joueur le fait ressortir, parce que le robot est sombre sur un décor sombre.
- **Règles** : 3 PV par manche, au meilleur des 3 manches (le premier à 2 manches gagne). Chaque manche relance la scène (`scene.restart`) avec le score en paramètre : tout repart propre sans avoir à tout remettre à zéro à la main. 0,6 s d'invincibilité après un coup, pour qu'une rafale ne tue pas d'un coup.
- **Réutilisation de `personnage.js`** : le code du robot visait un seul joueur. Trois petits changements : `creerPersonnage` accepte les touches et une teinte, chaque robot a son groupe de balles (`joueur.tirs`, pour savoir qui a tiré), et la visée automatique prend l'adversaire pour cible (`joueur.adversaire`) avec la même vérification de mur que pour les ennemis.
- **Commandes** : J1 flèches + I (saut), K (tir), L (dash) ; J2 W A S D + R (saut), F (tir), G (dash) : les boutons de la borne (`gpio2keys.py`).

## Le rangement du code (12/10/2026)
- **Pourquoi ranger** : le dossier `js/` contenait 28 fichiers à plat. Ils sont maintenant classés par rôle : `scenes` (les écrans), `personnage`, `ennemis`, `mecanismes` (les règles des niveaux) et `systemes` (les outils partagés). Le plan est dans `readme.md`.
- **Aucun changement de jeu** : avant et après, les mêmes scénarios (partie complète, relance, 1 contre 1, pause, reset, salles, caméra, saut coyote) donnent les mêmes résultats et les mêmes images.
- **Une classe de base `niveau.js`** : `niveau1`, `niveau2` et `niveau3` en héritent et ne contiennent que ce qui change (carte, musique, départ). Avant, la base s'appelait `niveau1` et les autres en héritaient, ce qui était trompeur.
- **`create` découpé** en étapes nommées (carte, robot, ennemis, lumières, remise à zéro) ; `majPersonnage` découpé en `marcherEtSauter`, `glisserEtSauterDuMur`, `dasherOuTirer`... avec le même ordre qu'avant.
- **Supprimé** : le code des salles horizontales (plus aucune n'existe), des gardes qui ne servaient plus, 8 images de l'ancien gabarit Phaser jamais utilisées (`sky.png`, `bomb.png`, `dude.png`...), des commentaires périmés.
- **`Personnage/` est devenu `personnage/`** : la borne tourne sous Linux, qui distingue majuscules et minuscules ; tous les noms de dossiers sont en minuscules.

## Un seul code pour les niveaux
- `scenes/niveau.js` lit une config (map, départ, musique, salles, arène) : `niveau1`, `niveau2` et `niveau3` en héritent (`extends`). On ne copie pas 150 lignes de `create`.
- `figerCalques` découpe le décor en bandes horizontales pour un niveau haut, verticales pour un niveau large.
- `endormirLesLoins` regarde aussi la distance horizontale (sinon tous les ennemis d'un niveau large dorment ou se réveillent d'un coup).

## Les maps sont générées
- `outils/generer_niveaux.py` écrit `niveau2_genere.json` (une map d'exemple) à partir de colonnes et de longueurs de trous. Les fichiers sont des maps Tiled normales : on peut les rouvrir dans Tiled pour les retoucher.
- Si on change un trou, on relance le script : il vérifie que le niveau reste faisable.

## Les boss
- `boss.js` a un profil par boss : le **Dieu** (fin du niveau 1, 80 PV, 2 phases, il s'enrage à 0 PV au lieu de mourir) et le **Dieu v2** (dernier combat, 130 PV, 3 phases, rouge et plus grand, attaques bien plus rapprochées).
- **Dernier combat** (`niveau3.js`, une arène de la taille de l'écran) : après la fuite, on affronte le même boss en version enragée. Cette fois il meurt pour de bon : bonus de 3 000 points (30 s retirées du temps net), chrono arrêté, classement.
- Pourquoi une scène à part : `boss.js` suppose une arène de 1280 px qui commence à x = 0, alors que le niveau 2 est large.
- **La fuite devient plus dure en avançant** (`poursuite.js`) : le mur passe de 232 à 264 px/s (le robot marche à 260, donc à la fin il faut dasher) et le boss attaque de plus en plus souvent (toutes les 2,3 s puis toutes les 1,5 s).

## Ce qui n'est pas mesuré
- La durée réelle d'une partie (visée : environ 2 min 30 par niveau) : à chronométrer en jouant.
- Les FPS sur la borne avec le niveau 2 (map de 8 960 px de large) : à vérifier avec F3.

## Guide du joueur
- **Pourquoi si peu ?** Le joueur doit comprendre le but sans que le jeu l'interrompe. Le but est écrit à l'accueil (« Battre le Dieu de la Lumière ») et affiché 7 s au début de la partie (`systemes/guide.js`), en fondu, sans pause ni blocage de touche.
- **Pourquoi pas de rappel des commandes en plus ?** La légende du HUD (en haut à droite) les affiche déjà en permanence : un second rappel faisait doublon (essayé, puis retiré après capture d'écran).
- **Une seule fois par partie** : un registre `guideVu` est remis à faux au lancement (`menu.js`), pour que le texte ne revienne pas après chaque mort.

## Dieu de la Lumière, plus de vies, reprise au boss
- **Un seul nom pour le boss :** « Dieu de la Lumière » partout (barre de vie, textes, readme). Le but affiché au joueur et le boss rencontré sont maintenant les mêmes.
- **Le système de vies est retiré :** il n'a jamais servi (mourir ne coûtait aucune vie, seulement du temps). Le classement est au temps, donc la pénalité de la mort, c'est le chrono qui continue.
- **La touche « porte » (O) est retirée :** les salles s'ouvrent toutes seules quand les ennemis sont morts, la touche ne faisait rien.
- **Mourir contre le boss du niveau 1 ne refait pas la tour :** le robot repart à l'entrée de l'arène (`departArene` dans la config du niveau), avec le score qu'il avait en y entrant (`scoreArene`). Hors boss, mourir remet toujours le niveau et le score à zéro.
- **« Le plus vite possible » :** ajouté aux textes du menu et du début de partie, puisque le classement se fait au temps.
- **Raccourci de test vers le boss :** déplacé sur Z + B (les deux boutons « select »), qui ne servent à rien d'autre.
- **Z + X maintenus 1,5 s recommence la partie :** une partie solo repart du bas du niveau 1 (chrono et score à zéro, texte du but de nouveau affiché), un 1 contre 1 repart à 0 - 0. Depuis l'accueil ou l'écran de fin, on revient à l'accueil. Avant, le raccourci renvoyait toujours à l'accueil alors que le menu pause annonçait « recommencer la partie ».
- **Reprise au début de la phase atteinte :** si le robot meurt contre le boss, le combat repart au début de la phase où il est mort (phase 1 : boss plein, phase 2 : PV du premier seuil, phase 3 : PV du second seuil), avec la barre de vie déjà au bon niveau. La phase atteinte est retenue dans le registre (`phaseBoss`, avec le nom du profil pour ne pas mélanger le boss du niveau 1 et le dernier boss) et remise à zéro à chaque nouvelle partie. Au dernier combat (niveau 3), le score retrouve aussi sa valeur d'avant le combat.
- **Wall jump expliqué au début :** après le but, un second message (7 s) dit « contre un mur, appuie sur le bouton A pour rebondir et monter ». Les deux messages passent par une seule fonction (`message` dans `guide.js`) : un message est un texte qui apparaît en fondu, reste 7 s et s'efface.
- **Consigne dans les salles de combat :** « TUE TOUS LES ENNEMIS POUR POUVOIR MONTER », sous le compteur d'ennemis, jusqu'à l'ouverture de la sortie. Sans elle, le joueur voyait la sortie bouchée sans savoir pourquoi.
- **Joueur 2 : Q Z D S (clavier AZERTY) :** les directions du joueur 2 acceptent Q et Z en plus de A et W. Le joystick de la borne envoie A et W (clavier QWERTY, `gpio2keys.py`) : garder les deux évite qu'il cesse de marcher sur la borne. Le menu accepte aussi Z pour remonter au choix « JOUER ».
- **Les touches affichées sont celles de la borne :** la légende du HUD montre les boutons A (saut), D (tir) et E (dash) au lieu des lettres du clavier I, K, L, comme sur la borne (schéma du cours : A à F). Le menu pause dit « A : valider », « START : reprendre » et « SELECT + START » pour recommencer. Le jeu lit toujours les mêmes touches : seuls les textes changent.
- **Phase 3 du Dieu final plus dure (réglages seulement, pas de code en plus) :** pause entre deux attaques 800 → 450 ms ; salve d'orbes 9 → 11 orbes, éventail plus large (130°), plus rapides (440), deuxième salve après 350 ms ; colonnes 4 → 7 (le joueur voit toujours le trait qui le suit puis se fige) ; pluie 13 → 16 orbes ; nova 4 → 5 anneaux de 24 orbes plus rapides ; 4 lanternes vivantes au lieu de 3.
- **Ce que j'ai refusé de changer :** raccourcir encore l'annonce des attaques. Le trait de la colonne suit le robot 0,5 s puis se fige ; avec une annonce plus courte la colonne tomberait avant de se figer, pile sur le robot, donc impossible à éviter. La difficulté monte par la densité, pas par un temps de réaction injuste.
- **Durée de vie des orbes 6 s → 4 s :** elles ont quitté l'écran bien avant, et moins d'orbes en même temps ménage la borne (mesuré : jusqu'à 76 orbes en phase 3 au lieu de 88 sans ce réglage ; 68 avant tout changement).
- **Phase 3 encore plus dure (2e passage) :** pause entre attaques 450 → 250 ms ; colonne et balayage deux fois plus fréquents dans la liste d'attaques ; orbes 480 px/s, pluie 450, nova 330 ; le boss se déplace plus vite (période 1,0 s au lieu de 1,45 s) ; le piqué plonge en 0,28 s au lieu de 0,34 s ; orbes détruites au bout de 3 s. Mesuré sur 25 s : 16-17 attaques (13 au départ).
- **Ce que j'ai écarté :** doubler aussi la nova. Elle lance 5 anneaux de 24 orbes d'un coup ; doublée, on est monté à 103 orbes à l'écran, trop pour la borne (risque de ralentissement au-delà d'environ 48 d'après les mesures faites plus tôt). On double les attaques sans orbes à la place.
- **Limite des mesures :** mon robot-joueur de test prend toujours environ 10 coups en 40 s : il est trop simple (il ne saute pas, n'utilise pas le dash) pour mesurer la différence entre deux réglages. La vraie mesure de difficulté, c'est de jouer la phase (touche de test F10).
