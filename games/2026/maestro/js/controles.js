// Toutes les touches du jeu, définies à un seul endroit.

export const CONTROLES = {
  // Joueur 1 : la Cantatrice
  j1: {
    haut: "UP", bas: "DOWN", gauche: "LEFT", droite: "RIGHT",
    A: "I", B: "O", C: "P", D: "K"
  },
  // Joueur 2 : le Détective
  j2: {
    haut: "Z", bas: "S", gauche: "Q", droite: "D",
    A: "R", B: "T", C: "Y", D: "F"
  }
};

// Dans les menus, les deux joysticks fonctionnent, et plusieurs touches valident.
export const TOUCHES_MENU = {
  haut: ["UP", "Z"],
  bas: ["DOWN", "S"],
  gauche: ["LEFT", "Q"],
  droite: ["RIGHT", "D"],
  valider: ["ENTER", "I", "R", "SPACE"] // Start, bouton A de J1, bouton A de J2, espace
};

// Crée les touches d'un joueur ("j1" ou "j2") pour une scène.
// Renvoie un objet du style : { gauche: Key, droite: Key, A: Key, ... }
export function creerPanneau(scene, nomJoueur) {
  const panneau = {};
  const noms = CONTROLES[nomJoueur];
  for (const bouton in noms) {
    panneau[bouton] = scene.input.keyboard.addKey(noms[bouton]);
  }
  return panneau;
}

// Pour les menus : renvoie un objet avec une méthode presse("haut" | "bas" | ... | "valider").
// presse() est vraie UNE SEULE FOIS par appui (pas tant que la touche reste enfoncée).
export function creerClavierMenu(scene) {
  const touches = {};
  for (const action in TOUCHES_MENU) {
    touches[action] = TOUCHES_MENU[action].map(function (nom) {
      return scene.input.keyboard.addKey(nom);
    });
  }
  return {
    presse: function (action) {
      // on teste toutes les touches (map) avant de répondre, pour ne pas en "oublier" une
      return touches[action]
        .map(function (touche) {
          return Phaser.Input.Keyboard.JustDown(touche);
        })
        .includes(true);
    }
  };
}

// ---- Les NOMS affichés à l'écran ----
// Deux familles de textes : ce qu'on lit sur la BORNE (A, B, C, D) et ce qu'on tape au CLAVIER (I, O, flèches…).
// Les deux sont générés à partir de la table CONTROLES : si une touche change, l'affichage suit tout seul.

// Nom lisible d'une touche de clavier (les flèches et les touches spéciales sont traduites)
export function nomTouche(nom) {
  const noms = { UP: "↑", DOWN: "↓", LEFT: "←", RIGHT: "→", ENTER: "Entrée", SPACE: "Espace" };
  return noms[nom] || nom;
}

// La touche de clavier d'un bouton pour un joueur : touche("j1", "B") -> "O"
export function touche(joueur, bouton) {
  return nomTouche(CONTROLES[joueur][bouton]);
}

// Ce qu'on lit sur la borne : les 4 boutons utiles (A, B, C, D)
export function aideBorne() {
  return "BORNE · A : sauter · B : action (onde / lampe) · C : note / recharge · D : changer (solo)";
}

// Ce qu'on tape au clavier, pour les deux joueurs
export function aideClavier() {
  const j1 = "flèches, " + touche("j1", "A") + ", " + touche("j1", "B") + ", " + touche("j1", "C") + ", " + touche("j1", "D");
  const j2 = "ZQSD, " + touche("j2", "A") + ", " + touche("j2", "B") + ", " + touche("j2", "C") + ", " + touche("j2", "D");
  return "CLAVIER · J1 : " + j1 + "   ·   J2 : " + j2;
}
