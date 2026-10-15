export const CLE_SCENE = "versus";

export const DEBUG = false;

// Paramètres généraux de victoire, de chute et de transition entre les manches.
export const REGLES = {
  MANCHES_POUR_GAGNER: 3,
  VIES: 6,
  // "coeur" fait perdre une vie avant réapparition ; "elimination" met fin à la manche.
  CHUTE: "coeur",
  DUREE_DECOMPTE: 3,
  DELAI_FIN_MANCHE: 2000
};

// Identifiants des états utilisés par la boucle de match.
export const ETATS = {
  DECOMPTE: "decompte",
  COMBAT: "combat",
  FIN_MANCHE: "fin_manche",
  FIN_MATCH: "fin_match"
};

// Mappage des commandes prévues pour les deux joueurs.
export const TOUCHES = {
  J1: { gauche: "Q", droite: "D", haut: "Z", bas: "S", action: "SPACE", lacher: "A" },
  J2: { gauche: "LEFT", droite: "RIGHT", haut: "UP", bas: "DOWN", action: "ENTER", lacher: "SHIFT" }
};

// Choix d'ordre des arènes et seuil de détection des chutes.
export const ARENES_REGLES = {
  // "aleatoire" mélange les arènes ; "sequentiel" conserve leur ordre dans arenes.js.
  ORDRE: "aleatoire",
  DUREE_FONDU: 300,
  MARGE_CHUTE: 80
};

// Cadences et effets communs aux armes et objets ramassables.
export const ARMES_REGLES = {
  INTERVALLE_ARME: 10,
  INTERVALLE_COEUR: 15,
  MAX_ARMES_AU_SOL: 2,
  MAX_COEURS_AU_SOL: 1,
  VITESSE_CHUTE: 90,
  SOIN: 1,
  DUREE_SOMMEIL: 3000,
  DELAI_REPRISE: 1000,
  RAYON_EXPLOSION: 90,
  DEGATS_EXPLOSION: 2,
  RECUL_EXPLOSION: 1.6,
  VOLUME: 0.7
};

// Vitesses, portées et délais du combat local.
export const PHYSIQUE = {
  VITESSE: 250,
  SAUT: 330,
  CHUTE_RAPIDE: 520,
  DELAI_ENTRE_COUPS: 250,
  COUP_PORTEE: 70,
  COLLISION_ENTRE_JOUEURS: true,
  RECUL_X: 260,
  RECUL_Y: 200,
  DUREE_ETOURDI: 250,
  DUREE_INVULNERABLE: 450,
  DUREE_INVULNERABLE_RESPAWN: 1500
};

export const FRAME_IMPACT = { aria_punch_right: 2, aria_punch_left: 6 };

// Apparence et nom affichés dans l'interface de chaque joueur.
export const JOUEURS = [
  { nom: "JOUEUR 1", couleurTexte: "#ff5c5c", teinte: null },
  { nom: "JOUEUR 2", couleurTexte: "#5cb8ff", teinte: 0x5cb8ff }
];

export const POLICE = '"Press Start 2P", monospace';
