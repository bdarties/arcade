import { REGLAGES } from "./reglages.js";

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
  return "BORNE · A : sauter · B : action (onde / lampe) · C : note · D : changer (solo)";
}

// Ce qu'on tape au clavier, pour les deux joueurs
export function aideClavier() {
  const j1 = "flèches, " + touche("j1", "A") + ", " + touche("j1", "B") + ", " + touche("j1", "C") + ", " + touche("j1", "D");
  const j2 = "ZQSD, " + touche("j2", "A") + ", " + touche("j2", "B") + ", " + touche("j2", "C") + ", " + touche("j2", "D");
  return "CLAVIER · J1 : " + j1 + "   ·   J2 : " + j2;
}

// ---- Lire les touches d'un personnage ----
// Vrai si le bouton est maintenu enfoncé (une touche de ce personnage est appuyée)
export function toucheEnfoncee(perso, bouton) {
  return perso.touches.some((clavier) => clavier[bouton].isDown);
}

// Vrai UNE SEULE FOIS par appui (pas tant que la touche reste enfoncée)
export function toucheAppuyee(perso, bouton) {
  return perso.touches.map((clavier) => Phaser.Input.Keyboard.JustDown(clavier[bouton])).includes(true);
}

// ---- Échelles : haut / bas devant une échelle pour s'y accrocher (lobby et niveaux) ----
// Lâcher l'échelle : la gravité revient et le personnage n'est plus « accroché »
export function lacherEchelle(perso) {
  perso.enEchelle = false;
  perso.body.setAllowGravity(true);
}

// scene = l'écran (il fournit la liste des échelles). sonne = vrai quand le personnage vient d'être touché.
export function gererEchelle(scene, perso, controle, sonne = false) {
  const corps = perso.body; // le corps physique du personnage
  const pied = corps.bottom; // hauteur des pieds

  // L'échelle devant le personnage : alignée en x, et les pieds entre le haut et le bas de l'échelle
  const echelle = scene.echelles.find(function (e) {
    return Math.abs(corps.center.x - e.centreX) <= 16 && pied >= e.haut - 3 && pied <= e.bas + 3;
  });

  if (sonne == true) {
    lacherEchelle(perso); // un coup fait lâcher prise
    return;
  }

  // S'accrocher : on monte (sauf si on est déjà tout en haut) ou on descend (sauf si on est tout en bas)
  if (perso.enEchelle == false && controle == true && echelle !== undefined) {
    const veutMonter = toucheEnfoncee(perso, "haut") && pied > echelle.haut + 2;
    const veutDescendre = toucheEnfoncee(perso, "bas") && pied < echelle.bas - 2;
    if (veutMonter || veutDescendre) {
      perso.enEchelle = true; // il s'accroche
    }
  }
  if (perso.enEchelle == false) {
    return; // pas accroché : rien à faire ici
  }

  // Accroché : si on n'est plus devant une échelle, on lâche
  if (echelle === undefined) {
    lacherEchelle(perso);
    return;
  }
  let vitesseY = 0; // vitesse verticale sur l'échelle (0 = immobile)
  if (controle == true) {
    if (toucheEnfoncee(perso, "haut")) {
      vitesseY = -REGLAGES.echelle.vitesse; // négatif = vers le haut
    } else if (toucheEnfoncee(perso, "bas")) {
      vitesseY = REGLAGES.echelle.vitesse; // positif = vers le bas
    }
    // Bouton A : on saute de l'échelle
    if (toucheAppuyee(perso, "A")) {
      lacherEchelle(perso);
      perso.setVelocityY(REGLAGES.saut); // on lance un petit saut
      return;
    }
  }
  perso.body.setAllowGravity(false); // pas de gravité sur l'échelle
  perso.setVelocity(0, vitesseY); // pas de marche sur l'échelle, seulement monter ou descendre
  perso.x = echelle.centreX; // on reste bien au milieu de l'échelle

  // Arrivé en haut ou en bas : on se pose sur la plateforme et on lâche l'échelle
  if (vitesseY < 0 && pied <= echelle.haut) {
    perso.y += echelle.haut - pied; // on le remet pile sur le dessus de la plateforme
    lacherEchelle(perso);
  } else if (vitesseY > 0 && pied >= echelle.bas) {
    perso.y -= pied - echelle.bas; // on le remet pile en bas de l'échelle
    lacherEchelle(perso);
  }
}
