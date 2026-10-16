import { ARMES_REGLES } from "./versusConfig.js";

// Clés Phaser des sprites d'armes, projectiles et cœurs disponibles.
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

// Noms des sons chargés depuis le dossier audio du mode Versus.
const SONS = [
  "lance_tir", "explosion", "lyre_1", "lyre_2", "lyre_3", "lyre_4", "lyre_5", "note_impact",
  "fleche_tir", "endort", "reveil", "arme_ramassee", "coeur", "apparition", "lacher", "clic_vide",
  "vent", "punch", "decompte_1_2_3", "decompte_go", "MerryGo"
];

// `main` et `bouche` sont des décalages depuis le centre du joueur ; `usages` fixe les tirs disponibles.
export const ARMES = {
  lancetrompette: {
    nom: "LANCE-TROMPETTE",
    cle: "versus_lancetrompette",
    cleVide: "versus_lancetrompette_vide",
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
    cadence: 350,
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

// Programme les images et bruitages nécessaires au mode Versus.
export function chargerAssetsArmes(scene) {
  Object.entries(IMAGES).forEach(([cle, fichier]) => scene.load.image(cle, "./assets/versus/armes/" + fichier));
  SONS.forEach((nom) => scene.load.audio("versus_s_" + nom, "./assets/versus/sons/" + nom + ".mp3"));
}

// Joue un bruitage seulement si sa ressource audio est disponible.
export function jouerSon(scene, nom, options = {}) {
  const cle = "versus_s_" + nom;
  if (!scene.cache.audio.exists(cle)) return;
  scene.sound.play(cle, { volume: ARMES_REGLES.VOLUME, ...options });
}