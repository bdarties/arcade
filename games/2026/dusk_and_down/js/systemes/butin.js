import { XP, PROFONDEUR } from "../reglages/config.js";
import { distanceSol, directionSol, deplacerAuSol } from "../fonctions.js";
import { gagnerXp } from "./progression.js";
import { jouerSon } from "./sons.js";

export function lacherEclatDeLumiere(scene, x, y, valeur) {
  if (scene.groupeGemmes.countActive(true) >= XP.maxGemmes) {
    const existant = Phaser.Utils.Array.GetRandom(scene.groupeGemmes.getChildren());
    existant.valeur += valeur;
    return;
  }
  const gemme = scene.groupeGemmes.create(x, y, "gemme");
  gemme.valeur = valeur;
  gemme.attiree = null;
  gemme.setDepth(PROFONDEUR.lumieres);
  if (valeur >= 4) {
    gemme.setTint(0xffd36b).setScale(1.4);
  }
  scene.tweens.add({ targets: gemme, y: y - 10, duration: 150, yoyo: true });
}

export function mettreAJourGemmes(scene) {
  const vivants = scene.joueurs.filter((joueur) => !joueur.estMort);
  scene.groupeGemmes.children.iterate((gemme) => {
    if (!gemme || !gemme.active) {
      return;
    }
    if (gemme.attiree === null || gemme.attiree.estMort) {
      gemme.attiree = null;
      gemme.setVelocity(0, 0);
      for (const joueur of vivants) {
        if (distanceSol(gemme.x, gemme.y, joueur.x, joueur.y) < joueur.stats.rayonCollecte) {
          gemme.attiree = joueur;
        }
      }
    }
    if (gemme.attiree !== null) {
      const cible = gemme.attiree;
      const direction = directionSol(gemme.x, gemme.y, cible.x, cible.y - 10);
      deplacerAuSol(gemme, direction.x, direction.y, XP.vitesseAttraction);
    }
  });
}

export function ramasserGemme(scene, joueur, gemme) {
  if (!gemme.active) {
    return;
  }
  gagnerXp(scene, gemme.valeur);
  jouerSon("gemme");
  gemme.destroy();
}
