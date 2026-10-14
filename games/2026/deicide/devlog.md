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
- **La map du niveau 2 est dessinée dans Tiled** par Mathys. Le jeu lit des points dans des calques d'objets (`depart`, `fin`, `faisceau`, ennemis...) au lieu de colonnes écrites en dur dans le code : changer la map ne demande aucun changement de code (voir `assets/maps/lisez-moi.md`).
- **Le boss de la fuite n'est pas le moteur de `boss.js`** : ses attaques étaient liées à une arène fixe de 1280 px (sol, colonnes à x précis). Pendant la fuite tout est posé par rapport au robot et à l'écran, d'où un petit fichier à part qui réutilise juste les orbes et les feuilles d'images du boss.

## Raccourcis de la borne (`systemes/raccourcis.js`)
- Les boutons physiques sont nommés A à F ; ils envoient I, O, P, K, L et ; : **C = P** et **F = ;**. Les deux boutons du centre sont select (Z) et start (X).
- **C + F maintenus 0,5 s** (P et ; au clavier, la touche M en AZERTY) : retour à l'écran d'accueil (reset pour le joueur suivant). (Le raccourci de test Z + B, qui allait directement au boss, a été supprimé le 13/10 ; il reste les touches F8, F9 et F10.)
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
- (REMPLACÉ le 13/10/2026 par la sauvegarde de données, voir la section « Nouveau panthéon » plus bas) **Pourquoi un score « empaqueté »** : l'API de la borne ne stocke que le jeu, le nom et UN entier par score, et on ne doit pas modifier `app/` (code partagé). On range donc trois chiffres dans l'entier : `(999999 - temps net en cs) x 100 000 000 + (999999 - temps total en cs) x 100 + (99 - morts)`. Le temps net pèse le plus : le tri de la borne (plus grand en tête) classe comme avant, puis le temps total le plus court, puis le moins de morts. Le plus gros nombre fait environ 1e14, sous la limite des entiers de JavaScript (9e15). Les anciens scores (10 000 000 - temps net en ms) sont reconnus (ils sont plus petits que 1e8) et affichés sans temps total ni morts.
- **Morts** : `registry "morts"`, remis à 0 au lancement d'une partie (menu.js, raccourcis.js), +1 à chaque `mourir()` de niveau.js.

## La fausse fin et la forme finale du dernier boss (13/10, partie 2)
- **Déroulement** : quand le boss final tombe à 0 PV en phase 3, il se dissout comme pour une vraie victoire et l'écran du panthéon s'affiche (le vrai `classement.js`, avec sa
  séquence de victoire, le chrono arrêté) : une fanfare, une pluie de confettis dorés, un long moment pour y croire. Puis le silence (la musique s'arrête), deux battements de cœur, l'écran qui s'assombrit
  et se rapproche, un son qui monte... et un **énorme coup d'épée** : une lame courbe, effilée, avec un halo doré, traverse l'écran en 0,14 s ; flash blanc, onde de choc, gerbe d'étincelles,
  tremblement violent (0,07), coup de zoom qui rebondit. L'écran SE FISSURE : un réseau dense de fêlures blanches (contour sombre, reflet doré) part de tous les points de la lame et se propage en 0,3 s, avec des
  craquements de verre ; on le laisse se fissurer 0,56 s sous le tremblement. Puis l'écran est tranché en deux le long de la courbe : une capture de l'écran (fissures comprises) est découpée en deux moitiés qui s'écartent dans la lumière de la coupure,
  et derrière, le boss revient : il apparaît dans le fond, grossit et devient violet. Le combat reprend contre la **forme finale** (phase 4). Si on la bat, c'est la vraie fin et le vrai panthéon.
- **Le cri du boss quand il revient** : un vrai enregistrement (`assets/sons/cri_boss`, « Aggressive Monster Roar » de yodguard, Pixabay, licence libre sans attribution obligatoire, citée quand même dans les crédits et `licences.md`). L'enregistrement
  fourni contenait DEUX cris séparés par un silence ; on n'en garde qu'un, le deuxième (une attaque brutale, un pic net : il colle au flash du changement de forme), découpé à 2,5 s avec un fondu de fin et un volume ramené sous 0 dBFS (l'original dépassait
  +2 dBFS). Il part 1,35 s après la coupure de l'écran, 0,35 s avant le changement de forme, pour que son pic tombe sur le flash et le tremblement. Il est chargé avec le dernier combat (47 Ko). Volume : passé de -18,3 à -12,0 LUFS (+6,3 dB, pic à -1,5 dBFS) par une compression (acompressor, ratio 6) puis un limiteur, pour qu'il soit plus fort sans saturer.
- **La bannière du boss** (`fauxPantheon.banniere`), dans la DA du jeu : quand le boss change de forme, la plaque d'armure du HUD (coins coupés, rivets, creux sombre, agrandie x4) glisse sous lui avec un dépassement, ornée d'un cadre doré fin, de losanges
  et de barres dorées aux deux bouts, et d'un filet doré ; son nom (« DIEU DE LA LUMIERE / FORME FINALE », en police pixel à deux tons) claque
  lettre par lettre ; à l'arrivée : flash blanc, tremblement, étincelles aux deux bouts, un accord de cuivres synthétisé (`annonce` dans `synth.js`), un éclat qui balaie le bandeau et un léger battement. Il repart par la droite avant la reprise du combat (la cinématique dure donc 1 s de plus).
- **Un cri de monstre** retentit juste avant le coup d'épée (`cri` dans `synth.js`) : un grognement très grave qui monte en hurlement (deux dents-de-scie désaccordées + une note une octave plus bas dont la hauteur grimpe, trémolo à 30 Hz, trois filtres « formants » qui glissent comme une bouche qui s'ouvre, distorsion, souffle), qui crescendo de -36 à -13 dBFS en 1,05 s et s'arrête net avant la lame ; l'écran tremble pendant le cri. Mesuré hors ligne : toujours plus faible que l'impact.
- **Les sons de cette scène sont synthétisés** (`partie2/synth.js`, API audio du navigateur, aucun fichier) : fanfare, battements, montée de tension, souffle de la lame + tintement du métal, impact (boum grave saturé + coup sec + claquement + fracas métallique + grondement de 3 s, avec un compresseur pour que ce soit énorme sans saturer ; mesuré hors ligne avec un
  OfflineAudioContext : pic à -0,4 dBFS, environ 18 dB plus fort que la fanfare sur les 300 premières ms) et craquements de verre (34 petits claquements aigus). Ils suivent le réglage « bruitages ». Piège rencontré : les easings de caméra de Phaser s'écrivent « Quad.easeIn » (pas « Quad.In » comme pour les tweens).
- **Comment** : `partie2/faux_pantheon.js` est une scène qui HÉRITE de `classement` (partie 1) : même écran, mais au lieu de proposer d'enregistrer le score elle déclenche la fissure.
  Elle est posée par-dessus le niveau 3, mis en pause, comme le menu pause ; l'horloge du niveau est rattrapée à la reprise. `fin_de_combat.js` choisit entre fausse fin (phases 1 à 3) et vraie fin
  (forme finale). Le moteur du boss a seulement reçu des crochets facultatifs dans les profils (`pvDePhase`, `pvMinimum`, `choisirAttaque`, `apresApparition`, `etiquettePhase`, `pvDebutPhase`).
- **La forme finale** (`forme_finale.js`) : 180 PV (100 au début, puis 130), plus grande (4,8 au lieu de 3,8), violette, des annonces plus courtes (charge 0,62) et des attaques enchaînées 15 % plus vite, et **six attaques entièrement nouvelles**, qui ne servent dans aucune
  autre phase (`attaques_ultimes.js`) : *météores* (orbes FINES en diagonale, au corps de 26 px pour un robot de 20 px de large, 15 par volée espacées de 82 px : un trou d'environ 26 px seulement entre deux trajectoires, il faut être précis ; deux volées de sens opposés, annoncées par des traînées), *rideaux* (trois murs d'orbes qui tombent, le trou change de place et
  est annoncé en haut de l'écran), *horloge* (quatre lames de lumière en croix, plus fines (26 px) et plus lentes (0,95 rad/s), qui tournent pendant 2,2 s : sauter ou dasher au bon moment ; le pivot est choisi à plus de 380 px du robot, la croix démarre à l'angle qui éloigne le plus les lames de lui, et les lames sont dormantes (transparentes, inoffensives) 0,55 s à leur apparition : mesuré, elles démarrent à 209 px du robot au pire et un robot immobile n'est jamais touché à l'activation), *étau* (deux murs d'orbes arrivent des côtés avec une
  fenêtre à une hauteur annoncée : sol, plateforme ou en l'air ; puis ils reviennent avec les hauteurs échangées), *traque* (six orbes qui tournent vers le robot, 1,9 rad/s au plus : on les sème en sautant ou en dashant)
  et *damier* (le sol s'allume par blocs de 160 px en alternance, trois fois de suite : une plateforme protège car les blocs font 118 px de haut). Elles sont toutes annoncées. Les phases 1 à 3 gardent les leurs.
  Si le robot meurt contre elle, le combat reprend directement en forme finale (registre `phaseBoss`), sans refaire la fausse fin.
- **Moins de hasard en phase 3 et en forme finale** : le boss lance d'abord, au hasard, les attaques qu'il n'a pas encore faites, puis tire dans un « sac » mélangé (chaque attaque revient avant
  qu'une autre se répète). Et il TIENT BON à 1 PV tant qu'il n'a pas lancé chacune de ses attaques au moins une fois : un tir qui le toucherait à ce moment-là ne compte pas (ni PV, ni points).
  Impossible donc de le finir sans les avoir toutes vues.
- **Lasers du boss rendus esquivables** (attaque « lasers », phases 1 à 3) : en phases 2 et 3 ils ne l'étaient jamais (0 % de situations esquivables, calculé par géométrie) : les rayons se figeaient 0,55 s après le début de
  l'annonce mais tiraient 0,66 s après, soit 0,11 s pour réagir, et le boss continuait de flotter pendant l'annonce donc les rayons partaient d'un autre endroit que celui vu. Maintenant : les rayons se figent après 0,12 s,
  le boss reste en place pendant qu'il canalise l'attaque, l'écart entre deux rayons garantit un trou d'au moins 190 px à la distance du robot, et le balayage est lent (0,1 et 0,15 rad/s au lieu de 0,45 et 0,75).
  Mesuré dans le jeu : une fois les rayons figés, il faut parcourir 52 px en médiane (104 au plus) pour être à l'abri ; avec une réaction de 250 ms le robot a le temps d'en faire 76 (93 % des cas), sans réaction 141 (100 %).
- **Bug corrigé** : la barre de vie du boss, juste après le soin de l'entrée en phase 3, était ramenée à 35 % une fraction de seconde plus tard par l'animation du dernier coup (alors que le boss avait 130 PV). Elle reste pleine, avec ses deux traits.
- **Bug corrigé** : la phase 3 commençait avec 45 PV quand on y arrivait en continuant le combat, mais avec 130 PV après une mort (`pvPleinsApresMort`) : le boss ne devenait « normal » qu'après la
  première mort. Maintenant la phase 3 commence toujours avec tous ses PV : il se soigne en y entrant (`pvDebutPhase`). Ses PV sont ensuite passés de 130 à **91** (moins 30 %, `PV_PHASE_3` dans `forme_finale.js`) ; la barre de vie se règle sur les PV de la phase (`boss.pvMax`).
- **Touche de test** : F5 lance le dernier combat et déclenche tout de suite la fausse fin (dissolution du boss, faux panthéon, fissure de l'écran), puis la forme finale (F5 ne recharge donc plus la page).
- **Non vérifié** : si la forme finale est « faisable mais extrêmement dure » : elle est mesurée (attaques, durées, PV), pas jouée.

## L'écran de crédits de fin (`partie1/scenes/credits.js`, 13/10)
- **Quand** : après le panthéon (le bouton du panthéon s'appelle maintenant « CONTINUER »), avant le retour à l'accueil. Il vaut pour toutes les fins : après le Soldat (réponse NON) comme après la forme finale. Touche de test : F4.
- **Déroulé** : le titre DEICIDE entre au centre lettre par lettre (flash, tremblement, étincelles dorées) et scintille (une vague de lumière de l'or au blanc traverse ses lettres), « OMBRE ET LUMIERE » apparaît dessous ; après 4,2 s les crédits défilent
  vers le haut (75 px/s, avec une accélération douce) : UN JEU DE (les trois créateurs, en gros), SAE BORNE D'ARCADE, GRAPHISMES, MUSIQUES, BRUITAGES, MOTEUR, chaque section avec son titre doré entre deux losanges ; le défilé s'arrête sur « FIN » (qui pulse) et
  « MERCI D'AVOIR JOUE ». N'importe quel bouton saute les crédits après 1,5 s ; sinon passage automatique au panthéon 10 s après « FIN ».
- **DA** : le décor du panthéon (lueur grise-violette qui respire, colonnes sur les bords, poussière qui monte), la police pixel à deux tons, l'or du jeu, un fondu vers le noir en haut et en bas. Les noms des créateurs viennent de la page crédits du menu pause ; les rôles de chacun ne sont pas indiqués (ils ne sont écrits nulle part dans le projet).
- **La musique des crédits** : « Ending Scene » de nene (CC0, OpenGameArt), la **version V3** (la plus rock : guitare électrique saturée mêlée à de l'orchestral ; les autres versions de la page : V1 et V2 sont proches, la version orchestrale n'a pas de guitare, vérifié par
  une analyse du spectre : la platitude spectrale entre 1 et 4 kHz, signe d'un son saturé, est de 0,08 pour V1, V2 et V3 contre 0,05 pour l'orchestrale). La piste fait 112 s : on en garde 54 s (de 44 s à 98 s), qui suivent la structure des crédits : une intro douce pendant le titre, le passage fort à la guitare
  (60 à 82 s de la piste) pendant le défilé, et la partie calme quand « FIN » apparaît (mesuré : « FIN » arrive à 38 s, la musique est alors à 82 s de la piste). Fondu d'entrée de 1,2 s, fondu de sortie de 5 s dans le fichier, volume harmonisé à -16,7 LUFS (pic -1,3 dBFS). Retour automatique 10 s après « FIN ».
- **La mémoire** : la musique pèse 19 Mo une fois décodée, donc elle n'est chargée qu'à l'arrivée sur les crédits (`preload`), et les musiques des boss (42 Mo) sont libérées juste avant ; tout est rechargé tout seul à la partie suivante. Mesuré : à l'accueil, plus rien de tout ça dans le cache. Elle ne se répète pas (`musiqueDeScene` a un paramètre `boucle`).
- **La police pixel** (`classement.js`) a reçu des signes de ponctuation : ' , ! ? ( ) / # &. Elle n'a toujours pas d'accents (comme l'écran du panthéon).
- **Pièges rencontrés** : un conteneur Phaser grossit autour de son origine (0, 0) et non de son milieu (« FIN » se mettait à chevaucher le texte du dessous) : il faut le centrer d'abord ; et la texture « pixel » (utilisée par les étincelles) est fabriquée au 1er niveau : une scène qu'on lance directement doit la créer elle-même (sinon le carré vert « texture manquante » de Phaser).

## Le jeu en deux parties : js/partie1 et js/partie2 (13/10)
- **Pourquoi** : pour pouvoir expliquer le jeu à l'oral jusqu'à la fin du 1er boss, sans que la suite (la fuite, le dernier combat) ne se mélange au code à présenter.
  `js/partie1` est un jeu complet, qui s'arrête quand le Dieu de la Lumière est vaincu (le joueur choisit alors d'enregistrer son temps dans le panthéon).
  `js/partie2` est la suite, jouée seulement si le joueur répond OUI au choix du panthéon.
- **Ce qui est dans la partie 2** : le niveau 2 (la fuite : `poursuite.js`, `vide.js`, `faisceaux.js`), le mur qui se brise et le Dieu qui s'enrage (`fuite.js`), le niveau 3 et le
  boss final (`niveau3.js`, `boss_final.js`), ses attaques en plus (`attaques.js` : lasers, geysers, spirale, piqué), sa musique (`musique.js`), un conseil (`astuce.js`) et les
  touches de test F9 et F10 (`tests_borne.js`). Tout le reste est dans la partie 1, y compris le choix du panthéon et le robot « en boule ».
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
- **Lancement** : un bouton « 1 V 1 » sur l'écran d'accueil (haut / bas pour choisir, un bouton pour valider). Un bouton du joueur 2 (R, T, Y, F, G, H, N) lance aussi directement le duel.
- **Arène** : les 22 dernières lignes de `niveau1.json` (le bas de la map 1, là où le robot démarre) (fichier `arene_versus.json`, qui était d'abord généré par un script Python, supprimé le 13/10/2026 : les maps sont maintenant de simples fichiers Tiled) : mêmes tuiles, 1280 x 704 px, la taille de l'écran. Pas de voile d'obscurité ni de lanternes : un halo de la couleur de chaque joueur le fait ressortir, parce que le robot est sombre sur un décor sombre.
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
- (Ancien) un script Python écrivait `niveau2_genere.json` (une map d'exemple) et les arènes. Il a été supprimé le 13/10/2026 : les maps restent telles quelles, ce sont des fichiers Tiled qu'on retouche directement dans Tiled.
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

## Réglages du 13/10/2026 (forme finale et phase 3)
- **Boss sans soin en cours de combat** : avant, il passait de 45 à 91 PV en entrant en phase 3 (`pvDebutPhase`). Maintenant sa vie totale est 176 (= 40 + 45 + 91 : les phases 1 et 2 gardent leur durée, la phase 3 en a 91), seuils 136 et 91, et rien ne le soigne. Après une mort, il repart avec 91 PV en phase 3 (`pvApresMort`).
  Pourquoi : le soin visible ressemblait à un reset du boss ; on garde pourtant 91 PV en phase 3 quel que soit le chemin.
- **Météores** : les traits d'annonce (lignes diagonales) ressemblaient à des lasers mais ne blessaient pas. À l'allumage, chaque ligne frappe maintenant (éclair de 0,15 s, un seul coup) avant que le météore la suive ; 11 lignes espacées de 112 px (15 de 82 avant).
- **Horloge (laser circulaire)** : lancée seulement si le robot est à moins de 230 px du centre de l'arène (`possible`, vérifié aussi dans le tirage par défaut du moteur : `attaquePossible`) ; plus lente (0,7 rad/s), plus fine (20 px), dormante 0,75 s.
- **Lanternes vivantes** : même cadence partout ; en forme finale une seule à la fois, et celles de l'animation sont effacées avant la phase 4.
- **FPS de la fissure** : le réseau de fissures est dessiné sur deux canevas pendant la tension (14 ms), au coup on ne fait que les afficher (3 ms), au lieu de redessiner des centaines de lignes à chaque image.
- **Ordre de la fin (changé le 13/10/2026)** : victoire → crédits → panthéon (saisie du nom et tableau) → accueil. Le panthéon est la dernière chose vue. `finirPartie` lance les crédits avec le résultat de la partie, les crédits le transmettent à `classement` (sans résultat, par exemple en test, ils ramènent à l'accueil). Une touche pressée pour sauter les crédits ne valide rien dans le panthéon : sa séquence d'intro ignore les touches, puis un délai évite les validations accidentelles.
- **Laser circulaire (horloge)** : durée totale 1,65 s dont 0,75 s dormante, soit 0,9 s de lames actives (2,3 s avant) : il tourne de 0,63 rad seulement, assez court pour être esquivé.

## Numéro de version (13/10/2026)
- **Quoi** : le menu affiche en bas à droite « v1 », « v2 », « v3 »... Le numéro vient de `js/version.js`, que `python3 outils/version.py` augmente de 1.
- **Pourquoi** : sur la borne, comparer ce numéro avec celui de `js/version.js` sur GitHub (branche `main`) dit tout de suite si le jeu est à jour : plus petit = pas à jour.
- **Règle** : une fois par pull request, lancer `python3 outils/version.py` puis commiter `js/version.js`. (Ne pas le relancer si la PR est déjà prête, sinon on saute un numéro.)

## Nouveau panthéon : sauvegarde par la borne (13/10/2026)
- **Quoi** : le panthéon n'utilise plus l'API des scores de la borne (qui ne gardait qu'un entier par score) mais la sauvegarde de données par jeu décrite dans la notice de la borne : `lireDonneesJSON()` et `ecrireDonneesJSON(donnees)`, fournies par `js/donnees.js` (importé tout en haut de `index.js`).
- **Pourquoi** : on peut ranger ce qu'on veut. Le panthéon est maintenant une liste d'objets `{ nom, net, brut, morts, date }`, au lieu d'un nombre unique dans lequel on « empaquetait » trois chiffres avec des multiplications. Le code de `classement.js` est plus court et plus simple à expliquer.
- **Comment** : on lit la liste, on ajoute la ligne, on trie (temps net le plus court en premier, puis temps total, puis moins de morts), on garde 10 lignes et on réécrit tout (`ecrireDonneesJSON` remplace tout le contenu : c'est pour ça qu'on relit juste avant d'écrire).
- **Hors borne** : les mêmes fonctions écrivent dans le `localStorage` du navigateur (clé `arcade_donnees_<dossier>`), donc le panthéon marche aussi sur un ordinateur, sans aucun changement de code.
- **`js/donnees.js`** : le fichier officiel de la borne (`app/static/js/donnees.js`) n'est pas dans le dépôt pour l'instant ; ce fichier est une version à nous qui suit exactement la description de la notice (API `GET` et `PUT /api/donnees/<dossier>`, repli sur le `localStorage`). Si la page de la borne charge déjà sa propre version, la nôtre ne fait rien.
- **À savoir** : les anciens scores de l'ancienne base (`high_scores`) ne sont plus lus : le panthéon repart vide. Ne pas renommer le dossier du jeu (`deicide`) après avoir enregistré des données : elles ne seraient plus retrouvées.
- **Vérifié** : enregistrement de plusieurs parties (tri, limite à 10 lignes, égalités), puis le même test avec le vrai serveur de la borne (version `main` du dépôt) : les données arrivent dans la base sous `deicide` et sont relues après rechargement.
- **Le nom du joueur (13/10/2026)** : jusqu'à 6 caractères (3 avant). Chaque case défile avec le joystick haut ou bas sur 27 caractères : les 26 lettres de l'alphabet et une case vide (le dernier, donc après Z on tombe sur le vide, puis on repart à A). Gauche et droite changent de case. On peut valider avec seulement 3 caractères remplis : les cases vides à la fin ne sont pas gardées (« AB » et non « AB    »). Un nom entièrement vide est refusé. Pour faire de la place aux 6 caractères, les colonnes du tableau sont décalées un peu vers la droite.

## Bouton CLASSEMENT dans l'accueil (14/10/2026)
- **Quoi** : un bouton « CLASSEMENT » à droite de JOUER ouvre le panthéon seul. Flèche droite depuis JOUER pour l'atteindre, flèche gauche pour revenir, un bouton de la borne pour valider ; un appui sur I ramène à l'accueil.
- **Pourquoi** : avant, on ne voyait le panthéon qu'à la fin d'une partie réussie. Sur une borne, les gens veulent voir les meilleurs temps sans jouer.
- **Comment** : on réutilise la scène `classement` avec une option `{ consultation: true }` (au lieu d'écrire un deuxième écran). Dans ce mode, pas de chute du titre, pas de résultat de partie, pas de saisie : le tableau est décalé au centre et affiché tout de suite. Le menu a un 3e mode (1 = JOUER, 2 = 1 V 1, 3 = CLASSEMENT) ; le bouton est une plaque du HUD avec le texte en police pixel, sans animation.
- **Vérifié** : avec un panthéon de test dans le navigateur, flèche droite puis Entrée ouvre la vue, Entrée revient au menu, aucune erreur dans la console.

## Easter egg : toutes les lanternes éteintes (14/10/2026)
- **Quoi** : quand le joueur éteint la dernière lanterne du niveau, le message « L'OBSCURITE COMMENCE A REGNER DANS CE MONDE » apparaît en fondu en haut de l'écran pendant 3 secondes.
- **Comment** : un seul `if` dans `eteindreLanterne` (`lumiere.js`) : si toutes les lanternes du groupe sont éteintes, on affiche le message (police pixel du jeu, collé à l'écran, au-dessus du voile). La fonction s'arrête plus haut quand une lanterne est déjà éteinte, donc le message ne part qu'une fois par niveau.
- **Choix** : on a essayé de changer aussi la couleur du robot (bleu), puis on l'a retirée : le robot est déjà presque invisible dans le noir, et le message suffit.

## Correction : l'accueil se figeait sur la borne (14/10/2026)
- **Symptôme** : sur la borne, le jeu s'arrêtait sur l'écran d'accueil et plus rien ne répondait.
- **Cause** : dans Git, trois dossiers s'appelaient `assets/Spritesheet/Player/...` (avec des majuscules) alors que le code charge `assets/spritesheet/player/...`. Le Mac ne fait pas la différence entre majuscules et minuscules, donc tout marchait chez nous ; la borne (Linux) la fait : 13 images en erreur 404, puis une erreur dans le menu (les animations du robot n'ont pas leurs images).
- **Pourquoi on ne l'a pas vu** : Git sur Mac n'enregistre pas un renommage qui ne change que les majuscules (`core.ignorecase`). Le disque local avait le bon nom, Git gardait l'ancien.
- **Correction** : les 17 fichiers sont renommés dans Git (`git mv` en deux temps via un nom temporaire). Aucun changement de code.
- **Vérifié** : sur un volume sensible aux majuscules (comme Linux), avant : 13 erreurs 404 et un menu bloqué ; après : plus d'erreur, le menu répond.
- **À faire avant chaque PR** : tester sur un volume sensible aux majuscules (`hdiutil create -fs "Case-sensitive APFS"`) ou vérifier avec `git ls-files | grep "[A-Z]"` qu'aucun fichier du jeu ne garde une majuscule.
