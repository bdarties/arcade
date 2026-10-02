import { ISO, PROFONDEUR } from "../reglages/config.js";
import { ARSENAL } from "../reglages/arsenal.js";
import { plusProche } from "../fonctions.js";
import { blesserEnnemi } from "./ennemis.js";
import { jouerSon } from "./sons.js";

export function creerArme(scene, id) {
  const arme = Object.assign({ id: id, prochaineAttaque: 0 }, ARSENAL[id].base);
  arme.visuel = scene.add.graphics().setDepth(PROFONDEUR.lumieres);
  return arme;
}

export function mettreAJourArme(scene, joueur) {
  const arme = joueur.arme;
  if (joueur.estMort || scene.tempsJeu < arme.prochaineAttaque) {
    return;
  }
  arme.prochaineAttaque = scene.tempsJeu + arme.recharge;
  coupEpee(scene, joueur, arme);
}

function angleDeVisee(scene, joueur, distanceVisee) {
  const ennemisActifs = scene.groupeEnnemis.getChildren().filter((ennemi) => ennemi.active);
  const cible = plusProche(joueur.x, joueur.y, ennemisActifs, distanceVisee);
  if (cible === null) {
    return Math.atan2(joueur.directionY, joueur.directionX);
  }
  const dx = cible.x - joueur.x;
  const dy = (cible.y - joueur.y) / ISO.ratioY;
  if (Math.abs(dx) > 4) {
    joueur.setFlipX(joueur.classe.regardeAGauche ? dx > 0 : dx < 0);
  }
  return Math.atan2(dy, dx);
}

function coupEpee(scene, joueur, arme) {
  const demiAngle = Phaser.Math.DegToRad(arme.angle) / 2;
  const angleVise = angleDeVisee(scene, joueur, arme.visee);

  joueur.finAttaque = scene.tempsJeu + 320;
  joueur.anims.play(joueur.cleTexture + "_attaque", true);
  dessinerCoupEpee(scene, joueur, arme, angleVise, demiAngle);
  jouerSon("epee");

  for (const ennemi of scene.groupeEnnemis.getChildren().slice()) {
    if (!ennemi.active) {
      continue;
    }
    const dx = ennemi.x - joueur.x;
    const dy = (ennemi.y - joueur.y) / ISO.ratioY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > arme.portee + ennemi.type.rayonCorps) {
      continue;
    }
    const angleEnnemi = Math.atan2(dy, dx);
    const dansLArc = Math.abs(Phaser.Math.Angle.Wrap(angleEnnemi - angleVise)) <= demiAngle;
    if (dansLArc || distance < 20) {
      blesserEnnemi(scene, ennemi, arme.degats, joueur.x, joueur.y, arme.recul);
    }
  }
}

function dessinerCoupEpee(scene, joueur, arme, angle, demiAngle) {
  const g = arme.visuel;
  g.clear();
  g.setPosition(joueur.x, joueur.y - 4);
  g.setScale(1, ISO.ratioY);
  g.fillStyle(0xffffff, 0.22);
  g.slice(0, 0, arme.portee, angle - demiAngle, angle + demiAngle, false);
  g.fillPath();
  g.lineStyle(6, 0xffffff, 0.95);
  g.beginPath();
  g.arc(0, 0, arme.portee, angle - demiAngle, angle + demiAngle, false);
  g.strokePath();
  g.setAlpha(1);
  scene.tweens.killTweensOf(g);
  scene.tweens.add({ targets: g, alpha: 0, duration: 220 });
}
