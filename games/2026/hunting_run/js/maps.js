export const DEBUG = true; // true : affiche le nom de la map

export const PERSO = {
  cle: "img_perso",
  fichier: "./assets/dude.png",
  frameWidth: 32,
  frameHeight: 48,
  anim_gauche: { debut: 0, fin: 3 },
  anim_face: { frame: 4 },
  anim_droite: { debut: 5, fin: 8 },
  vitesse: 160,
  saut: -330,
  vitesse_echelle: 120
};

export const PERSO2 = {
  cle: "img_perso2",
  fichier: "./assets/perso2.png",
  frameWidth: 32,
  frameHeight: 48,
  anim_gauche: { debut: 0, fin: 3 },
  anim_face: { frame: 4 },
  anim_droite: { debut: 5, fin: 8 }
};

// clé de l'image -> fichier dans assets/tuiles/
export const TUILES = {
  tuiles1: "TuileDeJeu1.png",
  tuiles2: "TuileDeJeu2.png",
  tuiles3: "TuileDeJeu3.png",
  tuiles4: "TuileDeJeu4.png",
  tuiles5: "TuileDeJeu5.png",
  tuiles6: "TuileDeJeu6.png",
  salle:   "Tuile salle de bain.png"
};

export const MAPS = {
  map1: {
    fichier: "map1.json",
    depart: { x: 100, y: 500 }, // point d'apparition au lancement du jeu
    tilesets: {
      JeuDeTuiles1: "tuiles1",
      TuileDeJeu3: "tuiles3",
      TuileDeJeu2: "tuiles2"
    },
    portes: [
      { x: 57, y: 15, vers: "map2" }, // porte
      { x: 53, y: 6, vers: "map3" }   // porte6
    ]
  },
  map2: {
    fichier: "map2.json",
    tilesets: {
      TuileDeJeu1: "tuiles1",
      TuileDeJeu3: "tuiles3",
      "TuileDeJeu2(1)": "tuiles5",
      TuileDeJeu4: "tuiles6"
    },
    portes: [
      { x: 0, y: 13, vers: "map1" },  // porte
      { x: 0, y: 6, vers: "map5" },   // porte2
      { x: 58, y: 13, vers: "map4" }  // porte1
    ]
  },
  map3: {
    fichier: "map3.json",
    tilesets: {
      TuileDeJeu1: "tuiles1",
      TuileDeJeu2: "tuiles2",
      TuileDeJeu3: "tuiles3",
      TuileDeJeu4: "tuiles6"
    },
    portes: [
      { x: 3, y: 4, vers: "map1" },   // porte6
      { x: 54, y: 12, vers: "map5" }  // porte5
    ]
  },
  map4: {
    fichier: "map4.json",
    tilesets: {
      JeuDeTuile1: "tuiles1",
      TuileDeJeu2: "tuiles2",
      TuileDeJeu3: "tuiles3"
    },
    portes: [
      { x: 1, y: 15, vers: "map2" },  // porte1
      { x: 56, y: 15, vers: "map5" }, // porte3
      { x: 55, y: 3, vers: "map6" }   // porte4
    ]
  },
  map5: {
    fichier: "map5.json",
    tilesets: {
      "Tuile salle de bain": "salle",
      TuileDeJeu1: "tuiles1",
      TuileDeJeu3: "tuiles3",
      TuileDeJeu4: "tuiles4"
    },
    portes: [
      { x: 14, y: 3, vers: "map4" },  // porte3
      { x: 0, y: 14, vers: "map3" },  // porte5
      { x: 58, y: 14, vers: "map2" }  // porte2
    ]
  },
  map6: {
    fichier: "map6.json",
    tilesets: {
      TuileDeJeu1: "tuiles1",
      TuileDeJeu2: "tuiles2",
      TuileDeJeu3: "tuiles3",
      TuileDeJeu4: "tuiles6"
    },
    portes: [
      { x: 6, y: 15, vers: "map4" },  // porte4
      // cle: true -> la porte reste fermée tant que les joueurs n'ont pas trouvé la clé (voir CLE plus bas)
      { x: 28, y: 11, l: 3, h: 4, vers: "fin", cle: true }
    ]
  }
};


/***************************************************************
CLÉ CACHÉE (ouvre la grande porte de la map6)
***************************************************************/
export const CLE = {
  fichier: "./assets/ui/cle.png",
  map: "map3",     // map où la clé est cachée
  x: 26.5,         // position en TUILES (comme dans Tiled : colonne, ici le milieu de la tuile 26)
  y: 12,           // ligne de la tuile sur laquelle la clé est posée (le bas de la clé touche le haut de cette tuile)
  echelle: 1       // taille de la clé dans le jeu (0.7 = plus petite)
};


/***************************************************************
ÉCRANS D'HISTOIRE
***************************************************************/
export const ECRANS = {
  histoire: ["./assets/ui/histoire.png"],
  fin: "./assets/ui/fin.png",
  // affichée quand on perd (temps écoulé ou K.O.)
  gameOver: "./assets/ui/game-over.png",
  // bouton "Rejouer" (écran Game Over et écran de fin)
  boutonRejouer: "./assets/ui/rejouer.png"
};


/***************************************************************
JOUEURS
***************************************************************/
export const JOUEUR = {
  pvMax: 100,          // points de vie au départ
  invincibilite: 1200  // ms d'invincibilité après avoir été touché
};
