// ============================================================================
//  js/controles.js — les touches de la borne, définies UNE SEULE FOIS
//
//  La borne d'arcade envoie des touches de clavier. Pour changer une touche,
//  on la modifie ici et c'est tout. Les noms sont ceux de Phaser
//  ("UP", "LEFT", "ENTER", "SPACE", ou une lettre "I", "O"...).
//
//  Boutons de la borne :  A = sauter · B = action · C = note / recharge
//                         D = changer de personnage (solo)
//  (les boutons E et F ne sont pas utilisés)
// ============================================================================

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
