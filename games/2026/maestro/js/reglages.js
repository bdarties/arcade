// ============================================================================
//  js/reglages.js — TOUS les réglages du jeu au même endroit
//
//  Pour équilibrer le jeu (plus de vitesse, plus de vies...), on change les
//  chiffres ici et nulle part ailleurs. Les autres fichiers font :
//      import { REGLAGES } from "./reglages.js";
// ============================================================================

export const REGLAGES = {
  // ---- Déplacements communs aux deux personnages ----
  vitesse: 200, // vitesse de marche (pixels par seconde)
  saut: -520, // vitesse de saut (négatif = vers le haut)
  gravite: 1000, // gravité des niveaux (appliquée dans niveau1, pas dans index.js)

  // ---- Cantatrice : l'onde sonore ----
  onde: {
    vitesse: 400, // vitesse de l'onde (px/s)
    portee: 300, // distance max parcourue avant de disparaître (px)
    cadenceMs: 500, // délai minimum entre deux ondes (ms)
    etourdissementMs: 2000 // durée pendant laquelle un ennemi touché est étourdi (ms)
  },

  // ---- Détective : la lampe torche ----
  // Les valeurs de batterie sont des POURCENTAGES (100 = pleine).
  lampe: {
    rayon: 150, // rayon du cercle de lumière (px)
    batterieSec: 30, // durée d'une batterie pleine allumée en continu (s)
    rechargeParAppui: 10, // % de batterie gagnés à chaque appui sur le bouton C
    seuilClignote: 20 // sous ce % la lumière clignote
  },

  // ---- Points de vie (cœurs) ----
  vies: {
    solo: 3,
    duo: 5, // cœurs partagés entre les deux joueurs
    invincibiliteMs: 1500 // temps sans dégâts après avoir été touché (ms)
  },

  // ---- Ennemis ----
  tuba: {
    vitesse: 60, // vitesse de patrouille (px/s)
    ondeToutesMs: 3000, // il lance une onde toutes les 3 s
    porteeOnde: 200, // distance parcourue par son onde (px)
    vitesseOnde: 160 // vitesse de son onde (px/s)
  },
  cristal: {
    vitesse: 80, // vitesse à laquelle il avance vers le joueur (px/s)
    pv: 2, // nombre d'ondes pour le détruire
    detectionPx: 520, // il se réveille quand un joueur est plus proche que ça
    // Pour plus tard (niveau 3) : le cristal apparaîtra toutes les 4 à 7 secondes
    apparitionMinMs: 4000,
    apparitionMaxMs: 7000
  },

  // ---- Choc quand un personnage est touché ----
  recul: {
    x: 280, // poussée horizontale (px/s)
    y: -280, // petit saut vers le haut (px/s)
    dureeMs: 350 // pendant ce temps le joueur ne contrôle plus son perso
  }
};
