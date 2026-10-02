// Les séquences d'histoire du jeu.
// Chaque "slide" = un écran :
//   fond  : image de fond (chemin)
//   perso : image du personnage (chemin), optionnel
//   cote  : "gauche" ou "droite" (où se place le perso), optionnel
//   texte : le texte qui s'écrit dans la zone en bas
//
// Pour l'instant : fond du ciel et textes bidons, à remplacer par tes images et ton histoire.

const FOND = "./assets/sky.png";
const ARIA = "./assets/spritesheet/aria_stand_right.png";
<<<<<<< HEAD
// Image du méchant : pas encore faite => une silhouette noire s'affiche à la place.
// Quand tu auras l'image, mets-la à ce chemin (ou change le chemin ici).
// Si le méchant regarde du mauvais côté, ajoute flip: true dans MECHANT.
const MECHANT_IMG = "./assets/histoire/mechant.png";

const ARIA_G = { id: "aria", img: ARIA, cote: "gauche" };
const MECHANT = { id: "mechant", img: MECHANT_IMG, cote: "droite" };
=======
// Image du méchant : planche de 2 images (118x126 chacune) qui s'animent en boucle.
// Mets le fichier gros_mechant_stand_right.png à ce chemin (ou change le chemin ici).
// Si le méchant regarde du mauvais côté, ajoute flip: true dans MECHANT.
const MECHANT_IMG = "./assets/spritesheet/gros_mechant_stand_right.png";

// hauteur = taille du perso à l'écran en px (450 par défaut) ; plus petit = plus petit à l'écran
const ARIA_G = { id: "aria", img: ARIA, cote: "gauche", hauteur: 380 };
// sheet = planche animée : w/h = taille d'UNE image, vitesse = images par seconde (2 par défaut)
const MECHANT = { id: "mechant", img: MECHANT_IMG, cote: "droite", flip: true, sheet: { w: 118, h: 126, vitesse: 2 } };
>>>>>>> Arianite

export const INTRO = [
  // 1) seul le méchant, à droite
  {
    fond: FOND,
    persos: [MECHANT],
    texte:
      "MÉCHANT :\nAria… celle que tu aimes est à l’Opéra. Je l’ai attachée au lustre, au-dessus de la scène. Et lorsque le lustre tombera, elle tombera avec lui."
  },
  // 2) les deux personnages pendant toute la discussion
  {
    fond: FOND,
    persos: [ARIA_G, MECHANT],
    texte: "ARIA :\nQu’est-ce que tu lui as fait ?! Laisse-la partir !"
  },
  {
    fond: FOND,
    persos: [ARIA_G, MECHANT],
    texte: "MÉCHANT :\nSi tu veux la sauver, dépêche-toi. Le spectacle a déjà commencé."
  },
  {
    fond: FOND,
    persos: [ARIA_G, MECHANT],
    texte: "ARIA :\nJ’arrive."
  },
  // 3) le méchant disparaît (animation : clignote, s'étire, fumée)
  {
    fond: FOND,
    persos: [ARIA_G, MECHANT],
    disparition: "mechant",
    texte: "[Le méchant disparaît.]\n[Aria regarde en direction de l’Opéra.]"
  },
  // 4) il ne reste qu'Aria
  {
    fond: FOND,
    persos: [ARIA_G],
    texte: "ARIA :\nJe dois me dépêcher…"
  }
];

// exemple pour une séquence entre deux maps :
// export const VERS_TOIT = [ { fond: "...", texte: "..." } ];
