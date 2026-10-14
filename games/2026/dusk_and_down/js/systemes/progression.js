import { XP } from "../reglages/config.js";
import { jouerSon } from "./sons.js";

export function xpPourNiveau(niveau) {
  return Math.round(XP.base + XP.croissance * Math.pow(niveau - 1, XP.exposant));
}

export function gagnerXp(scene, valeur) {
  scene.xp += valeur;
  while (scene.xp >= scene.xpRequise) {
    scene.xp -= scene.xpRequise;
    scene.niveau += 1;
    scene.xpRequise = xpPourNiveau(scene.niveau);
    scene.niveauxEnAttente += 1;
  }
}

export function ouvrirChoixSiNecessaire(scene) {
  if (scene.niveauxEnAttente === 0 || scene.choixEnCours || scene.partieTerminee) {
    return;
  }
  scene.niveauxEnAttente -= 1;
  scene.choixEnCours = true;
  jouerSon("niveau");
  scene.scene.pause();
  scene.scene.launch("amelioration");
}
