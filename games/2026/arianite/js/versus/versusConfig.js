// ============================================================================
// VERSUS : réglages du mode arcade 2 joueurs (1v1 local)
// Tout ce qui se règle (touches, nombre de manches, délais...) est ici, au même endroit.
// Ce fichier n'importe rien : il ne peut pas casser le mode narratif.
// ============================================================================

// clé de la scène dans Phaser (utilisée par accueil.js : this.scene.start("versus"))
export const CLE_SCENE = "versus";

// raccourcis de test : 1 / 2 = "le joueur 1 / 2 gagne la manche", N = arène suivante,
// et rectangle blanc montrant la portée de chaque coup.   -> false pour jouer, true pour régler / tester
export const DEBUG = false;

// ---- Règles du match --------------------------------------------------------
export const REGLES = {
  MANCHES_POUR_GAGNER: 3, // le premier à 3 manches gagne le match
  VIES: 6, // cœurs de chaque joueur : éliminé quand il n'en reste plus (1 coup reçu = 1 cœur)
  CHUTE: "coeur", // tomber dans le vide : "coeur" = perd 1 cœur et réapparaît au départ
  //                                    "elimination" = éliminé sur-le-champ
  DUREE_DECOMPTE: 3, // secondes de décompte avant chaque manche (3, 2, 1, GO)
  DELAI_FIN_MANCHE: 2000 // ms d'attente après une manche avant de passer à la suivante
};

// ---- États de la scène (machine à états) ------------------------------------
// DECOMPTE   : les joueurs sont placés, le "3-2-1" tourne, les contrôles sont bloqués
// COMBAT     : la manche est en cours
// FIN_MANCHE : un joueur vient de gagner la manche, courte pause
// FIN_MATCH  : un joueur a atteint le nombre de manches nécessaires
export const ETATS = {
  DECOMPTE: "decompte",
  COMBAT: "combat",
  FIN_MANCHE: "fin_manche",
  FIN_MATCH: "fin_match"
};

// ---- Touches (clavier AZERTY) -----------------------------------------------
// Noms acceptés par Phaser : lettres ("Z"), "SPACE", "ENTER", "LEFT", "RIGHT", "UP", "DOWN"...
// action = coup de poing, ou tir de l'arme si le joueur en tient une
// lacher = lâche l'arme tenue (retour aux poings) : elle tombe au sol et peut être ramassée
export const TOUCHES = {
  J1: { gauche: "Q", droite: "D", haut: "Z", bas: "S", action: "SPACE", lacher: "A" },
  J2: { gauche: "LEFT", droite: "RIGHT", haut: "UP", bas: "DOWN", action: "ENTER", lacher: "SHIFT" }
};

// ---- Arènes -----------------------------------------------------------------
export const ARENES_REGLES = {
  ORDRE: "aleatoire", // "aleatoire" : ordre mélangé (jamais deux fois la même arène de suite)
  //                     "sequentiel" : toujours dans l'ordre de la liste (arenes.js)
  DUREE_FONDU: 300, // ms du fondu au noir entre deux arènes
  MARGE_CHUTE: 80 // px sous le bas de l'écran à partir desquels un joueur est considéré tombé
};

// ---- Armes et objets ----------------------------------------------------------
// (les caractéristiques de chaque arme : sprites, munitions, tailles... sont dans armes.js)
export const ARMES_REGLES = {
  INTERVALLE_ARME: 10, // secondes de COMBAT entre deux apparitions d'arme (le décompte et les pauses ne comptent pas)
  INTERVALLE_COEUR: 15, // secondes de combat entre deux apparitions de cœur (minuteur séparé)
  MAX_ARMES_AU_SOL: 2, // pas de nouvelle arme tant qu'il y en a déjà autant par terre
  MAX_COEURS_AU_SOL: 1,
  VITESSE_CHUTE: 90, // vitesse de descente lente des objets (px/s)
  SOIN: 1, // PV rendus par un cœur ramassé (jamais au-dessus de REGLES.VIES)
  DUREE_SOMMEIL: 3000, // ms : durée totale du sommeil du Dormimus
  DELAI_REPRISE: 1000, // ms pendant lesquelles on ne peut pas ramasser l'arme qu'on vient de lâcher
  RAYON_EXPLOSION: 90, // px : zone de l'explosion de la roquette
  DEGATS_EXPLOSION: 2, // PV retirés par la roquette
  RECUL_EXPLOSION: 1.6, // le recul de l'explosion vaut 1,6 fois celui d'un coup de poing
  VOLUME: 0.7 // volume général des bruitages d'armes (0 à 1)
};

// ---- Physique et mouvements des joueurs -------------------------------------
// (valeurs de départ identiques au mode narratif : marche 250, saut 330)
export const PHYSIQUE = {
  VITESSE: 250, // marche (pixels par seconde)
  SAUT: 330, // force du saut (vitesse verticale vers le haut)
  CHUTE_RAPIDE: 520, // vitesse de chute quand on maintient "bas" en l'air
  DELAI_ENTRE_COUPS: 250, // ms minimum entre deux coups de poing
  COUP_PORTEE: 70, // distance devant le joueur où le coup touche (px)
  COLLISION_ENTRE_JOUEURS: true, // true = les joueurs se bloquent / se poussent
  RECUL_X: 260, // vitesse horizontale du joueur touché (px/s), dans le sens du coup
  RECUL_Y: 200, // petit saut du joueur touché
  DUREE_ETOURDI: 250, // ms pendant lesquelles le joueur touché ne peut pas agir
  DUREE_INVULNERABLE: 450, // ms d'invulnérabilité (il clignote) après un coup reçu
  DUREE_INVULNERABLE_RESPAWN: 1500 // ms d'invulnérabilité après être retombé au départ
};

// numéro de l'image de l'animation où le coup "touche" (même valeurs que fonctions.js)
export const FRAME_IMPACT = { aria_punch_right: 2, aria_punch_left: 6 };

// ---- Identité visuelle des joueurs ------------------------------------------
// Le même sprite (Aria) est utilisé pour les deux : le joueur 2 est teinté pour les distinguer.
export const JOUEURS = [
  { nom: "JOUEUR 1", couleurTexte: "#ff5c5c", teinte: null },
  { nom: "JOUEUR 2", couleurTexte: "#5cb8ff", teinte: 0x5cb8ff }
];

// ---- Police (adaptée au 1V1) --------------------------------------
export const POLICE = '"Press Start 2P", monospace';
