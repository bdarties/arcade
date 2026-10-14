// ============================================================================
// VERSUS : catalogue des armes, chargement des sprites et des sons
//
// POUR AJOUTER UNE ARME : ajouter une entrée dans ARMES (+ le cas correspondant dans
// GestionnaireArmes.tirer()). Les sprites sont dans assets/versus/armes/, les sons dans assets/versus/sons/.
// ============================================================================
import { ARMES_REGLES } from "./versusConfig.js";

// ---- sprites (cle -> fichier) ------------------------------------------------
const IMAGES = {
  versus_lancetrompette: "lancetrompette.png",
  versus_lancetrompette_vide: "lancetrompette_vide.png",
  versus_roquette: "roquette.png",
  versus_lyre: "lyre.png",
  versus_note_rouge: "note_rouge.png",
  versus_note_bleu: "note_bleu.png",
  versus_gun_sleep: "gun_sleep.png",
  versus_dart_rouge: "dart_rouge.png",
  versus_dart_bleu: "dart_bleu.png",
  versus_pv: "pv.png"
};

// ---- sons (le fichier est assets/versus/sons/<nom>.mp3, la clé Phaser est versus_s_<nom>) ----
const SONS = [
  "lance_tir", "explosion", "lyre_1", "lyre_2", "lyre_3", "lyre_4", "lyre_5", "note_impact",
  "fleche_tir", "endort", "reveil", "arme_ramassee", "coeur", "apparition", "lacher", "clic_vide",
  "vent", "punch", "decompte_1_2_3", "decompte_go", "MerryGo"
];

// ---- LES ARMES ---------------------------------------------------------------
// usages       : nombre de tirs avant que l'arme disparaisse
// echelle      : taille du sprite dans la main (les sprites d'origine sont grands : 150 px pour le lance-trompette)
// echelleItem  : taille quand l'arme est posée / descend du ciel
// origine      : point du sprite tenu par la main (0 = bord gauche/haut, 1 = bord droit/bas)
// main         : décalage de la main par rapport au centre du joueur [vers l'avant, vers le bas] (px)
// bouche       : d'où sort le projectile, même repère que `main`
// projectile   : "roquette" | "note" | "fleche"  (voir GestionnaireArmes)
export const ARMES = {
  lancetrompette: {
    nom: "LANCE-TROMPETTE",
    cle: "versus_lancetrompette",
    cleVide: "versus_lancetrompette_vide", // affichée tant que la roquette est en vol
    usages: 1,
    echelle: 0.5,
    echelleItem: 0.5,
    origine: [0.3, 0.5],
    main: [8, 4],
    bouche: [58, 4],
    projectile: "roquette"
  },
  lyre: {
    nom: "LYRE",
    cle: "versus_lyre",
    usages: 5,
    cadence: 350, // ms minimum entre deux notes
    echelle: 0.6,
    echelleItem: 0.6,
    origine: [0.5, 0.5],
    main: [16, 2],
    bouche: [30, 2],
    projectile: "note"
  },
  dormimus: {
    nom: "DORMIMUS",
    cle: "versus_gun_sleep",
    usages: 1,
    echelle: 0.7,
    echelleItem: 0.7,
    origine: [0.25, 0.6],
    main: [10, 8],
    bouche: [38, -2],
    projectile: "fleche"
  }
};

export const COEUR = { cle: "versus_pv", echelle: 0.6 };

// ============================================================================
//  CHARGEMENT : à appeler dans preload() de VersusScene
// ============================================================================
export function chargerAssetsArmes(scene) {
  Object.entries(IMAGES).forEach(([cle, fichier]) => scene.load.image(cle, "./assets/versus/armes/" + fichier));
  SONS.forEach((nom) => scene.load.audio("versus_s_" + nom, "./assets/versus/sons/" + nom + ".mp3"));
}

// ============================================================================
//  SON : ne plante jamais si le fichier est absent (ou si le navigateur n'a pas d'audio)
//  options Phaser possibles : { volume, detune (en centièmes de ton), rate }
// ============================================================================
export function jouerSon(scene, nom, options = {}) {
  const cle = "versus_s_" + nom;
  if (!scene.cache.audio.exists(cle)) return;
  scene.sound.play(cle, { volume: ARMES_REGLES.VOLUME, ...options });
}