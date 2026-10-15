// Les séquences d'histoire du jeu.
// Chaque "slide" = un écran :
//   fond  : image de fond (chemin)
//   perso : image du personnage (chemin), optionnel
//   cote  : "gauche" ou "droite" (où se place le perso), optionnel
//   texte : le texte qui s'écrit dans la zone en bas


const FOND = "./assets/sky.png";

//ARIA :
const ARIA_STAND_IMG = "./assets/spritesheet/aria_stand_right.png";
const ARIA_STAND = { id: "aria", img: ARIA_STAND_IMG, cote: "gauche", hauteur: 380, sheet: { w: 36, h: 64, vitesse: 2 } }; // hauteur = taille du perso à l'écran en px (450 par défaut) ; plus petit = plus petit à l'écran

const ARIA_PARLE_IMG = "./assets/spritesheet/aria_parle.png";
const ARIA_PARLE = { id: "aria_parle", img: ARIA_PARLE_IMG, cote: "gauche", hauteur: 380, sheet: { w: 36, h: 64, vitesse: 2 } };

//GROS MECHANT :
const MECHANT_STAND_IMG = "./assets/spritesheet/gros_mechant_stand_right.png";
const MECHANT_STAND = { id: "mechant", img: MECHANT_STAND_IMG, cote: "droite", flip: true, sheet: { w: 236, h: 252, vitesse: 2 } };

const MECHANT_PARLE_IMG = "./assets/spritesheet/gros_mechant_parle.png";
const MECHANT_PARLE = { id: "mechant_parle", img: MECHANT_PARLE_IMG, cote: "droite", flip: true, sheet: { w: 236, h: 252, vitesse: 2 } };


export const INTRO = [
  // 1) seul le méchant, à droite
  {
    fond: FOND,
    persos: [ARIA_STAND, MECHANT_PARLE],
    texte:
      "MÉCHANT :\nAria… celle que tu aimes est à l’Opéra. Je l’ai attachée au lustre, au-dessus de la scène. Et lorsque le lustre tombera, elle tombera avec lui."
  },
  // 2) les deux personnages pendant toute la discussion
  {
    fond: FOND,
    persos: [ARIA_PARLE, MECHANT_STAND],
    texte: "ARIA :\nQu’est-ce que tu lui as fait ?! Laisse-la partir !"
  },
  {
    fond: FOND,
    persos: [ARIA_STAND, MECHANT_PARLE],
    texte: "MÉCHANT :\nSi tu veux la sauver, dépêche-toi. Le spectacle a déjà commencé."
  },
  {
    fond: FOND,
    persos: [ARIA_PARLE, MECHANT_STAND],
    texte: "ARIA :\nJ’arrive."
  },
  // 3) le méchant disparaît (animation : clignote, s'étire, fumée)
  {
    fond: FOND,
    persos: [ARIA_STAND, MECHANT_STAND],
    disparition: "mechant",
    texte: "[Le méchant disparaît.]\n[Aria regarde en direction de l’Opéra.]"
  },
  // 4) il ne reste qu'Aria
  {
    fond: FOND,
    persos: [ARIA_STAND],
    texte: "ARIA :\nJe dois me dépêcher…"
  }
];

// exemple pour une séquence entre deux maps :
// export const VERS_TOIT = [ { fond: "...", texte: "..." } ];
