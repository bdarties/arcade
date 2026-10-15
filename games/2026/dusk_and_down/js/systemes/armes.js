import { ISO, PROFONDEUR } from "../reglages/config.js";
import { ARSENAL } from "../reglages/arsenal.js";
import { directionSol, deplacerAuSol, plusProche } from "../fonctions.js";
import { blesserEnnemi } from "./ennemis.js";
import { jouerEffet } from "./effets.js";
import { jouerSon } from "./sons.js";

export function creerArme(scene, id) {
  const arme = Object.assign({ id: id, prochaineAttaque: 0 }, ARSENAL[id].base);
  if (id === "epee") {
    arme.visuel = scene.add.graphics().setDepth(PROFONDEUR.lumieres);
  }
  return arme;
}

export function mettreAJourArme(scene, joueur) {
  const arme = joueur.arme;
  if (joueur.estMort || scene.tempsJeu < arme.prochaineAttaque) {
    return;
  }
  arme.prochaineAttaque = scene.tempsJeu + Math.max(arme.rechargeMin, arme.recharge * joueur.stats.recharge);
  if (arme.id === "epee") {
    coupEpee(scene, joueur, arme);
  } else {
    lancerFlammes(scene, joueur, arme);
  }
}

export function infligerDegats(scene, joueur, ennemi, degats, sourceX, sourceY, recul) {
  let total = degats;
  let critique = false;
  if (Math.random() < joueur.stats.critique) {
    total *= 2;
    critique = true;
  }
  blesserEnnemi(scene, ennemi, total, sourceX, sourceY, recul, critique);
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
  const portee = arme.portee * joueur.stats.portee;
  const demiAngle = Phaser.Math.DegToRad(arme.angle) / 2;
  const angleVise = angleDeVisee(scene, joueur, Math.max(arme.visee, portee * 1.5));

  const nbCoups = 1 + joueur.stats.coupsEpee;
  const angles = [];
  for (let i = 0; i < nbCoups; i++) {
    angles.push(angleVise + (i * Math.PI * 2) / nbCoups);
  }

  joueur.finAttaque = scene.tempsJeu + 320;
  joueur.anims.play(joueur.cleTexture + "_attaque", true);
  dessinerCoupEpee(scene, joueur, arme, portee, angles, demiAngle);
  jouerSon("epee");

  for (const ennemi of scene.groupeEnnemis.getChildren().slice()) {
    if (!ennemi.active) {
      continue;
    }
    const dx = ennemi.x - joueur.x;
    const dy = (ennemi.y - joueur.y) / ISO.ratioY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > portee + ennemi.type.rayonCorps * ennemi.scaleX) {
      continue;
    }
    const angleEnnemi = Math.atan2(dy, dx);
    const dansUnArc = angles.some((angle) => Math.abs(Phaser.Math.Angle.Wrap(angleEnnemi - angle)) <= demiAngle);
    if (dansUnArc || distance < 20) {
      infligerDegats(scene, joueur, ennemi, arme.degats, joueur.x, joueur.y, arme.recul);
    }
  }
}

function dessinerCoupEpee(scene, joueur, arme, portee, angles, demiAngle) {
  const g = arme.visuel;
  g.clear();
  g.setPosition(joueur.x, joueur.y - 4);
  g.setScale(1, ISO.ratioY);
  for (const angle of angles) {
    g.fillStyle(0xffffff, 0.22);
    g.slice(0, 0, portee, angle - demiAngle, angle + demiAngle, false);
    g.fillPath();
    g.lineStyle(6, 0xffffff, 0.95);
    g.beginPath();
    g.arc(0, 0, portee, angle - demiAngle, angle + demiAngle, false);
    g.strokePath();
  }
  g.setAlpha(1);
  scene.tweens.killTweensOf(g);
  scene.tweens.add({ targets: g, alpha: 0, duration: 220 });
}

function lancerFlammes(scene, joueur, arme) {
  const ennemisActifs = scene.groupeEnnemis.getChildren().filter((ennemi) => ennemi.active);
  const cible = plusProche(joueur.x, joueur.y, ennemisActifs, arme.portee * joueur.stats.portee);
  if (cible === null) {
    arme.prochaineAttaque = scene.tempsJeu + 150;
    return;
  }
  joueur.setFlipX(joueur.classe.regardeAGauche ? cible.x > joueur.x : cible.x < joueur.x);
  joueur.finAttaque = scene.tempsJeu + 380;
  joueur.anims.play(joueur.cleTexture + "_attaque", true);

  const direction = directionSol(joueur.x, joueur.y, cible.x, cible.y);
  const angleCible = Math.atan2(direction.y, direction.x);
  for (let i = 0; i < arme.nombre; i++) {
    const angle = angleCible + (i - (arme.nombre - 1) / 2) * 0.2;
    const vx = Math.cos(angle);
    const vy = Math.sin(angle);
    const flamme = scene.groupeProjectiles.create(joueur.x, joueur.y - 30, "trait_solaire", 0);
    flamme.play("anim_trait_solaire");
    flamme.body.setCircle(9, flamme.width / 2 - 9, flamme.height / 2 - 9 + 18);
    flamme.setScale(joueur.stats.portee);
    flamme.setBlendMode(Phaser.BlendModes.ADD);
    flamme.setDepth(PROFONDEUR.lumieres);
    deplacerAuSol(flamme, vx, vy, arme.vitesse);
    flamme.setRotation(Math.atan2(vy * ISO.ratioY, vx));
    flamme.joueur = joueur;
    flamme.degats = arme.degats;
    flamme.recul = arme.recul;
    flamme.finVie = scene.tempsJeu + arme.duree;
  }
  jouerSon("mage");
}

export function projectileTouche(scene, projectile, ennemi) {
  if (!projectile.active || !ennemi.active) {
    return;
  }
  jouerEffet(scene, "anim_impact_sacre", ennemi.x, ennemi.y - 16, {});
  infligerDegats(scene, projectile.joueur, ennemi, projectile.degats, projectile.x, projectile.y + 18, projectile.recul);
  projectile.destroy();
}

export function mettreAJourProjectiles(scene) {
  for (const projectile of scene.groupeProjectiles.getChildren().slice()) {
    if (scene.tempsJeu > projectile.finVie) {
      projectile.destroy();
    }
  }
}
