// Ressources et apparences partagées par les différentes répliques de l'introduction.
const FOND = "./assets/sky.png";

const ARIA_STAND_IMG = "./assets/spritesheet/aria_stand_right.png";
const ARIA_STAND = { id: "aria", img: ARIA_STAND_IMG, cote: "gauche", hauteur: 380, sheet: { w: 36, h: 64, vitesse: 2 } };

const ARIA_PARLE_IMG = "./assets/spritesheet/aria_parle.png";
const ARIA_PARLE = { id: "aria_parle", img: ARIA_PARLE_IMG, cote: "gauche", hauteur: 380, sheet: { w: 36, h: 64, vitesse: 2 } };

const MECHANT_STAND_IMG = "./assets/spritesheet/gros_mechant_stand_right.png";
const MECHANT_STAND = { id: "mechant", img: MECHANT_STAND_IMG, cote: "droite", flip: true, sheet: { w: 236, h: 252, vitesse: 2 } };

const MECHANT_PARLE_IMG = "./assets/spritesheet/gros_mechant_parle.png";
const MECHANT_PARLE = { id: "mechant_parle", img: MECHANT_PARLE_IMG, cote: "droite", flip: true, sheet: { w: 236, h: 252, vitesse: 2 } };


// Chaque entrée définit le fond, les personnages présents et le texte d'une scène.
export const INTRO = [
  {
    fond: FOND,
    persos: [ARIA_STAND, MECHANT_PARLE],
    texte:
      "MÉCHANT :\nAria… celle que tu aimes est à l’Opéra. Je l’ai attachée au lustre, au-dessus de la scène. Et lorsque le lustre tombera, elle tombera avec lui."
  },
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
  {
    fond: FOND,
    persos: [ARIA_STAND, MECHANT_STAND],
    disparition: "mechant",
    texte: "[Le méchant disparaît.]\n[Aria regarde en direction de l’Opéra.]"
  },
  {
    fond: FOND,
    persos: [ARIA_STAND],
    texte: "ARIA :\nJe dois me dépêcher…"
  }
];
