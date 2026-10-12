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

/***************************************************************
PORTES ALÉATOIRES
***************************************************************/
// vers: "hasard" -> la porte mène vers une map tirée au sort À CHAQUE FOIS qu'on la prend.
// Seule la porte de la map4 (derrière la bibliothèque) mène à la map6 : la map6 est donc interdite au tirage.
export const HASARD = {
  interdites: ["map6"], // maps qui ne peuvent jamais sortir du tirage au sort
  // "poids" : plus il est grand, plus la map sort souvent (1 = normal). Mets 0.5 pour la rendre plus rare.
  poids: { map1: 1, map2: 1, map3: 1, map4: 1, map5: 1 }
};

// phrases chuchotées au hasard quand on arrive par une porte aléatoire (ambiance)
export const MURMURES = [
  "Cette pièce... tu ne l'avais jamais vue.",
  "Les murs ont bougé derrière toi.",
  "Quelqu'un chuchote ton nom...",
  "La porte s'est refermée toute seule.",
  "Tu as l'impression d'être observé.",
  "Ce couloir n'était pas là tout à l'heure."
];


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
      { x: 57, y: 15, vers: "hasard" }, // porte
      { x: 53, y: 6, vers: "hasard" }   // porte6
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
      { x: 0, y: 13, vers: "hasard" },  // porte
      { x: 0, y: 6, vers: "hasard" },   // porte2
      { x: 58, y: 13, vers: "hasard" }  // porte1
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
      { x: 3, y: 4, vers: "hasard" },   // porte6
      { x: 54, y: 12, vers: "hasard" }  // porte5
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
      { x: 1, y: 15, vers: "hasard" },  // porte1
      { x: 56, y: 15, vers: "hasard" }, // porte3
      { x: 55, y: 3, vers: "map6" }   // porte4 : PORTE DERRIÈRE LA BIBLIOTHÈQUE -> seule porte qui mène à la map6 (fixe)
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
      { x: 14, y: 3, vers: "hasard" },  // porte3
      { x: 0, y: 14, vers: "hasard" },  // porte5
      { x: 58, y: 14, vers: "hasard" }  // porte2
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
      { x: 28, y: 11, l: 3, h: 4, vers: "fin", cle: true, enigme: "gardienne_resolue" } // + énigme de la gardienne (voir PNJS)
    ]
  }
};


/***************************************************************
CLÉ CACHÉE (ouvre la grande porte de la map6)
***************************************************************/
// La clé est invisible au départ : elle est au fond de la cuvette des toilettes (map5, salle de bain).
// Elle n'apparaît qu'après les deux énigmes (le miroir, puis le bouton secret) : voir POINTS et ENIGMES.
export const CLE = {
  fichier: "./assets/ui/cle.png",
  map: "map5",     // map où la clé est cachée (la salle de bain)
  x: 18.5,         // position en TUILES (colonne) : le milieu de la cuvette
  y: 16.4,         // ligne (en tuiles) : le fond de la cuvette
  echelle: 0.8     // taille de la clé dans le jeu (plus petite = plus discrète)
};


/***************************************************************
ÉNIGMES (questions à choix : joystick gauche/droite pour choisir, bouton A pour valider)
***************************************************************/
// bonne : numéro de la bonne réponse (0 = la première)
// resolu : nom de l'état mémorisé quand l'énigme est résolue
// degats : points de vie perdus en cas de mauvaise réponse
export const ENIGMES = {
  miroir: {
    titre: "Le miroir murmure...",
    question: "« Je parle sans bouche et j'entends sans oreilles.\nJe ne dis jamais rien qu'on ne m'ait dit d'abord.\nQui suis-je ? »",
    choix: ["Un fantôme", "L'écho", "Le miroir"],
    bonne: 1,
    resolu: "miroir_resolu",
    degats: 10,
    succes: "La glace s'embue... Un petit bouton rouge luit dans le mur, près de la cuvette."
  },
  bouton: {
    titre: "Une voix sort du mur...",
    question: "« Je suis toujours devant toi,\nmais tu ne peux jamais me voir.\nQui suis-je ? »",
    choix: ["Le passé", "Le brouillard", "L'avenir"],
    bonne: 2,
    resolu: "cle_revelee",
    degats: 10,
    succes: ""
  },
  // énigme posée par la Dame blanche, juste avant la grande porte (map6)
  gardienne: {
    titre: "La Dame blanche te toise...",
    question: "« Plus on m'enlève, plus je deviens grande.\nQui suis-je ? »",
    choix: ["Une ombre", "Un trou", "Un secret"],
    bonne: 1,
    resolu: "gardienne_resolue",
    degats: 15,
    succes: "La Dame s'efface en souriant... La grande porte s'ouvre en grinçant."
  }
};


/***************************************************************
POINTS D'INTERACTION (notes à lire, miroir, bouton, cuvette) : on appuie sur A devant
***************************************************************/
// x, y, l, h : zone en TUILES (coin haut-gauche, largeur, hauteur), comme les portes
// type : "note" (texte à lire) | "enigme" | "bouton" | "toilettes"
// si : l'élément n'est actif que si cet état est vrai (ex: le bouton n'existe qu'après le miroir)
export const POINTS = {
  map1: [
    // INDICE après la clé
    { x: 36, y: 15, l: 2, h: 3, type: "note", si: "cle",
      texte: "Une page arrachée :\n« La clé ne sert qu'à la grande porte du fond.\nPour l'atteindre, passe derrière la bibliothèque : tout en haut, à droite. »" },
    { x: 42, y: 15, l: 2, h: 3, type: "note",
      texte: "Un journal déchiré :\n« Les portes de ce manoir ne mènent jamais deux fois au même endroit.\nUne seule fait exception : celle qui se cache derrière les livres. »" }
  ],
  map2: [
    // INDICE après la clé
    { x: 8, y: 13, l: 2, h: 3, type: "note", si: "cle",
      texte: "Écrit au charbon sur le mur :\n« Cherche l'échelle, dans la pièce aux livres.\nLa porte cachée est tout au bout, en haut. »" },
    { x: 45, y: 13, l: 2, h: 3, type: "note",
      texte: "Gravé dans la suie :\n« Dans la salle d'eau, le miroir murmure.\nRéponds-lui, et il te montrera ce qu'il cache. »" }
  ],
  map3: [
    // INDICE après la clé
    { x: 30, y: 17, l: 2, h: 3, type: "note", si: "cle",
      texte: "Un papier collé au mur :\n« La dame en blanc réclame cette clé.\nElle garde la grande porte... et elle adore les énigmes. »" },
    { x: 1, y: 15, l: 2, h: 3, type: "note",
      texte: "Un mot glissé sous un livre :\n« J'ai vu la clé disparaître dans l'eau...\nLà où personne n'ose regarder. »" }
  ],
  map4: [
    // INDICE après la clé
    { x: 3, y: 15, l: 2, h: 3, type: "note", si: "cle",
      texte: "Griffonné près de l'échelle :\n« Monte. Marche jusqu'au bout du couloir.\nLa porte derrière les livres t'attend. »" },
    { x: 29, y: 15, l: 4, h: 3, type: "note",
      texte: "Une lettre froissée :\n« Il existe un bouton que seul le miroir connaît.\nJe n'ai pas trouvé la réponse à temps... »" }
  ],
  map5: [
    // INDICE après la clé
    { x: 47, y: 14, l: 2, h: 3, type: "note", si: "cle",
      texte: "Gravé dans le carrelage :\n« La dame ne laisse passer personne sans une énigme.\nÉcoute-la bien... »" },
    // le miroir de la salle de bain (1re énigme)
    { x: 14.5, y: 13, l: 2, h: 4, type: "enigme", enigme: "miroir",
      deja: "Le miroir reste silencieux. Il t'a déjà tout dit." },
    // le bouton secret (n'apparaît qu'après le miroir) -> 2e énigme, puis la chasse d'eau
    { x: 19, y: 13, l: 1, h: 4, type: "bouton", enigme: "bouton", si: "miroir_resolu",
      bx: 19.35, by: 14.4,  // position du bouton dessiné (en tuiles)
      deja: "Le bouton est enfoncé. Plus rien ne bouge." },
    // la cuvette des toilettes (la clé est au fond, une fois la chasse d'eau tirée)
    { x: 17.8, y: 13, l: 1.4, h: 4, type: "toilettes",
      texte: "L'eau est noire et immobile...\nQuelque chose semble attendre sous la surface.",
      vide: "La cuvette est vide." }
  ]
};


/***************************************************************
ÉTATS DE LA PARTIE à remettre à zéro à chaque nouvelle partie
***************************************************************/
export const ETATS_PARTIE = ["finPartie", "cle", "miroir_resolu", "cle_revelee", "gardienne_resolue", "potions_prises", "pouvoir_1", "pouvoir_2", "intro_vue"];


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


/***************************************************************
CONTRÔLES DES NOUVELLES ACTIONS (voir jeu.js, tableau "reglages")
***************************************************************/
// J1 : bouton B = touche O      J2 : bouton B = touche G
// Bouton B : coup de poing (sans pouvoir) / tir (avec pouvoir) / laser (si on MAINTIENT avec pouvoir)


/***************************************************************
SPRITES (tes sprite sheets : remplace juste les fichiers dans assets/sprites/)
***************************************************************/
// frames : nombre d'images dans la bande ; regardeDroite : le dessin regarde vers la droite ?
// corps : [largeur, hauteur, décalageX, décalageY] de la zone qui touche/est touchée (en pixels de l'image)
export const SPRITES = {
  butler:  { fichier: "./assets/sprites/butler_walk_strip.png",      fw: 32, fh: 40, frames: 8, fps: 8,  regardeDroite: true, echelle: 1.3, corps: [14, 34, 9, 6] },
  widow:   { fichier: "./assets/sprites/widow_idle_strip.png",       fw: 32, fh: 40, frames: 8, fps: 6,  regardeDroite: true, echelle: 1.3, corps: [14, 34, 9, 6] },
  dame:    { fichier: "./assets/sprites/lady_white_idle_strip.png",  fw: 32, fh: 40, frames: 8, fps: 6,  regardeDroite: true, echelle: 1.4, corps: [14, 34, 9, 6] },
  guide:   { fichier: "./assets/sprites/pnj_guide_strip.png",        fw: 32, fh: 40, frames: 8, fps: 5,  regardeDroite: true, echelle: 1.4, corps: [14, 34, 9, 6] } // PROVISOIRE : mets ton sprite sheet
};
// images simples (une seule image)
export const IMAGES_COMBAT = {
  boule_joueur: { fichier: "./assets/sprites/boule_verte.png",  echelle: 1.6, regardeDroite: false }, // PROVISOIRE : le dessin regarde vers la GAUCHE
  boule_ennemi: { fichier: "./assets/sprites/boule_orange.png", echelle: 1.1, regardeDroite: true },
  potion:       { fichier: "./assets/sprites/potion.png",       echelle: 1 }
};


/***************************************************************
COMBAT
***************************************************************/
export const COMBAT = {
  // bouton B sans pouvoir : coup de poing
  coup: { degats: 1, portee: 46, hauteur: 44, recharge: 380, recul: 220 },
  // bouton B (appui court) avec pouvoir : boule de pouvoir
  tir: { degats: 1, vitesse: 520, recharge: 300, duree: 1100 },
  // bouton B MAINTENU avec pouvoir : laser
  laser: {
    delai: 260,            // ms d'appui avant que le laser démarre (en dessous : simple tir)
    longueur: 460,         // portée en pixels
    epaisseur: 12,
    degatsParTick: 0.5,    // dégâts toutes les "tick" ms
    tick: 120,
    energieMax: 100,
    coutParSeconde: 40,    // l'énergie descend quand on laisse appuyé...
    rechargeParSeconde: 22,// ...et remonte sinon
    energieMin: 15         // énergie minimale pour relancer le laser
  },
  pouvoirDuree: 30000,     // durée du pouvoir après une potion violette, en ms (0 = pour toute la partie)
  soinPotion: 34,          // points de vie rendus par une potion rouge (34 = 1 cœur)
  chanceDropSoin: 0.2      // chance qu'un ennemi tué laisse une potion rouge
};

// 1 cœur = 34 pv (pvMax 100). Les dégâts sont en pv : 17 = un demi-cœur.
// Il y a 2 types d'ennemis :
//   "garde"  = ennemi 1 : corps à corps, il frappe     (calque Tiled "ennemis 1")
//   "tireur" = ennemi 2 : il reste en place et tire     (calque Tiled "ennemis 2")
export const TYPES_ENNEMIS = {
  garde:  { sprite: "butler", anim: "marche", pv: 3, vitesse: 55, vitesseChasse: 100, degats: 17, portee: 44, preparation: 280, recharge: 1000, detection: 280, recul: 120 },
  tireur: { sprite: "widow",  anim: "idle",   pv: 2, degats: 17, recharge: 2000, preparation: 350, detection: 560, vitesseBoule: 260 }
};

/***************************************************************
ENNEMIS ET POTIONS : ILS VIENNENT DE TES CARTES TILED
***************************************************************/
// Le jeu lit les calques d'objets (points) de chaque carte .json :
//   "ennemis 1"      -> un garde (corps à corps) à chaque point
//   "ennemis 2"      -> un tireur à chaque point
//   "potion pouvoir" -> une potion violette (donne le pouvoir) à chaque point
//   "potion coeur"   -> une potion rouge (soigne) à chaque point
// Pour ajouter / déplacer un ennemi ou une potion : fais-le dans Tiled, il n'y a rien à écrire ici.
export const CALQUES_TILED = {
  "ennemis 1":      { genre: "ennemi", type: "garde" },
  "ennemis 2":      { genre: "ennemi", type: "tireur" },
  "potion pouvoir": { genre: "potion", type: "pouvoir" },
  "potion coeur":   { genre: "potion", type: "soin" }
};
// un garde patrouille de chaque côté de son point, sur cette distance (en tuiles)
export const PATROUILLE_GARDE = 4;

// Ennemis posés à la main pour les cartes SANS calque Tiled (x, y en TUILES, y = ligne du sol).
// map6 : le garde avant la grande porte (la Dame blanche est dans PNJS plus bas).
export const ENNEMIS = {
  map6: [
    { type: "garde", x: 53, y: 18, zone: [49, 57] }
  ]
};

// Potions posées à la main pour les cartes SANS calque Tiled : aucune.
export const POTIONS = {};


/***************************************************************
TROUS MORTELS : zone où l'on meurt en y entrant (x1, x2 = colonnes en TUILES, y = ligne où les pieds touchent le fond noir)
***************************************************************/
export const TROUS = {
  map3: [{ x1: 13, x2: 40, y: 20 }], // le creux au milieu de la map3 : tomber dedans = mourir
  map4: [{ x1: 36, x2: 48, y: 18 }]  // le trou de la map 4
};

/***************************************************************
PNJ QUI PARLENT (A devant eux). x = colonne, y = ligne du SOL, en tuiles
***************************************************************/
// auto: true  -> il se met à parler tout seul au début de la partie
// gelerTemps: true -> le timer de 3 minutes est en pause pendant qu'il parle
// avant / apres : quand le PNJ a une énigme (enigme: "...") :
//   requiert (état du registry) : sinon il dit "avant" ; énigme résolue : il dit "apres"
export const PNJS = {
  map1: [
    {
      nom: "L'Homme au chapeau", sprite: "guide", x: 6, y: 18, auto: true, gelerTemps: true, vu: "intro_vue",
      dialogue: [
        "Chut... Tu es enfin réveillé. Le manoir s'est refermé sur nous.",
        "Tu as 3 minutes pour t'échapper. Pas une de plus.",
        "Les portes ne mènent jamais deux fois au même endroit. Fouille les pièces : notes, miroirs, boutons... chaque INDICE compte.",
        "Méfie-toi, des créatures rôdent. Frappe avec le bouton B. Et cherche des potions : les rouges soignent, les violettes donnent un pouvoir.",
        "Maintenant va. Et trouve la clé."
      ],
      rappel: ["Trouve la clé. Lis les notes. Résous les énigmes.", "Le temps file... ne reste pas là !"]
    }
  ],
  map6: [
    {
      nom: "La Dame blanche", sprite: "dame", x: 25, y: 15,
      requiert: "cle", enigme: "gardienne", resolu: "gardienne_resolue",
      avant: ["Personne ne passe cette porte sans la clé...", "Reviens quand tu l'auras trouvée."],
      dialogue: [
        "Tu as la clé. Tu es plus malin que les autres.",
        "Mais cette porte est la dernière. Je ne laisse sortir que ceux qui savent réfléchir.",
        "Écoute bien mon énigme..."
      ],
      apres: ["La porte est ouverte. Va, et ne te retourne pas."]
    }
  ]
};
