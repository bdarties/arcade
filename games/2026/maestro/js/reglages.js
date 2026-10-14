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
  taillePerso: 1, // taille de la Cantatrice et du Détective (1 = taille d'origine). Plus grand = bugs de collision : on reste à 1

  // ---- Cantatrice : l'onde sonore ----
  onde: {
    vitesse: 400, // vitesse de l'onde (px/s)
    portee: 300, // distance max parcourue avant de disparaître (px)
    cadenceMs: 500, // délai minimum entre deux ondes (ms)
    etourdissementMs: 1000 // durée pendant laquelle un ennemi touché est étourdi (ms)
  },

  // ---- Détective : la lampe torche ----
  // Les valeurs de batterie sont des POURCENTAGES (100 = pleine).
  lampe: {
    rayon: 150, // rayon de la tache de lumière projetée par la lampe (px)
    portee: 130, // distance entre le Détective et le centre de la tache de lumière (px)
    rayonProche: 70, // petit cercle toujours éclairé autour du Détective (px)
    vitesseVisee: 90, // vitesse d'orientation de la lampe, haut / bas du joystick (degrés par seconde)
    angleMax: 75, // inclinaison maximale de la lampe, vers le haut ou le bas (degrés)
    // true = une passerelle fantôme éclairée une fois RESTE en place pour toujours (niveau plus accessible :
    // le Détective la révèle, puis l'autre personnage peut la traverser sans qu'il ait à rester là).
    // false = elle disparaît quand la lumière la quitte (et reste solide persistanceMs après).
    passerellesFixes: true,
    persistanceMs: 1200, // (si passerellesFixes = false) elle reste solide ce temps après avoir quitté la lumière (ms)
    batterieSec: 45, // durée d'une batterie pleine allumée en continu (s)
    rechargeParAppui: 15, // % de batterie gagnés à chaque appui sur le bouton C
    seuilClignote: 20 // sous ce % la lumière clignote
  },

  // ---- Échelles ----
  echelle: {
    vitesse: 120 // vitesse de montée / descente (px/s)
  },

  // ---- Points de vie (cœurs) ----
  vies: {
    solo: 5,
    duo: 8, // cœurs partagés entre les deux joueurs
    invincibiliteMs: 1500 // temps sans dégâts après avoir été touché (ms)
  },

  // ---- Ennemis ----
  tuba: {
    vitesse: 60, // vitesse de patrouille (px/s)
    ondeToutesMs: 4000, // il lance une onde toutes les 4 s
    porteeOnde: 200, // distance parcourue par son onde (px)
    vitesseOnde: 160 // vitesse de son onde (px/s)
  },
  cristal: {
    vitesse: 70, // vitesse à laquelle il avance vers le joueur (px/s)
    pv: 1, // nombre d'ondes de la BONNE note pour le détruire (chaque cristal a une couleur = une note)
    etourdissementMauvaiseNoteMs: 600, // une onde d'une autre note ne fait que l'étourdir un instant (ms)
    detectionPx: 450, // il se réveille quand un joueur est plus proche que ça
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
