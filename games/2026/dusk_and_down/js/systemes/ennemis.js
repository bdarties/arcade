import { VAGUES } from "../reglages/config.js";
import { BESTIAIRE } from "../reglages/bestiaire.js";
import { directionSol, deplacerAuSol, plusProche, trierProfondeur } from "../fonctions.js";
import { blesserTemple } from "./temple.js";
import { blesserJoueur } from "./joueurs.js";
import { jouerSon } from "./sons.js";

export function creerEnnemi(scene, idType, x, y) {
  const type = BESTIAIRE[idType];
  const ennemi = scene.groupeEnnemis.create(x, y, type.texture, 0);
  ennemi.setOrigin(0.5, 0.92);
  const r = type.rayonCorps;
  ennemi.body.setCircle(r, ennemi.width / 2 - r, ennemi.height * 0.92 - 2 * r);
  ennemi.setCollideWorldBounds(true);

  ennemi.type = type;
  ennemi.pv = type.pv;
  ennemi.prochaineAttaque = 0;
  ennemi.finRecul = 0;
  ennemi.finFlash = 0;

  ennemi.play(type.texture + "_marche");
  ennemi.anims.setProgress(Math.random());
  trierProfondeur(ennemi);
  ennemi.setAlpha(0);
  scene.tweens.add({ targets: ennemi, alpha: 1, duration: 300 });
  return ennemi;
}

export function mettreAJourEnnemis(scene) {
  for (const ennemi of scene.groupeEnnemis.getChildren().slice()) {
    if (!ennemi.active) {
      continue;
    }
    trierProfondeur(ennemi);
    mettreAJourTeinte(scene, ennemi);
    if (scene.tempsJeu < ennemi.finRecul) {
      continue;
    }
    deplacerEnnemi(scene, ennemi);
  }
}

function choisirCible(scene, ennemi) {
  const temple = scene.temple;
  const vivants = scene.joueurs.filter((joueur) => !joueur.estMort);
  if (temple.detruit) {
    return plusProche(ennemi.x, ennemi.y, vivants);
  }
  const proie = plusProche(ennemi.x, ennemi.y, vivants, ennemi.type.rayonDetection);
  return proie !== null ? proie : temple;
}

function deplacerEnnemi(scene, ennemi) {
  const cible = choisirCible(scene, ennemi);
  if (cible === null) {
    ennemi.setVelocity(0, 0);
    return;
  }
  const direction = directionSol(ennemi.x, ennemi.y, cible.x, cible.y);
  deplacerAuSol(ennemi, direction.x, direction.y, ennemi.type.vitesse);
  if (Math.abs(direction.x) > 0.1) {
    ennemi.setFlipX(direction.x < 0);
  }
}

function mettreAJourTeinte(scene, ennemi) {
  if (scene.tempsJeu < ennemi.finFlash) {
    ennemi.setTintFill(0xffffff);
  } else {
    ennemi.clearTint();
  }
}

export function blesserEnnemi(scene, ennemi, degats, sourceX, sourceY, recul) {
  if (!ennemi.active) {
    return;
  }
  ennemi.pv -= degats;
  ennemi.finFlash = scene.tempsJeu + 60;
  jouerSon("touche");

  const direction = directionSol(sourceX, sourceY, ennemi.x, ennemi.y);
  deplacerAuSol(ennemi, direction.x, direction.y, recul);
  ennemi.finRecul = scene.tempsJeu + 120;

  if (ennemi.pv <= 0) {
    tuerEnnemi(scene, ennemi);
  }
}

function tuerEnnemi(scene, ennemi) {
  scene.score += ennemi.type.points;
  scene.ennemisVaincus += 1;
  jouerSon("mort_ombre");

  scene.groupeEnnemis.remove(ennemi);
  ennemi.body.enable = false;
  ennemi.setTint(0x6a5a8a);
  ennemi.play(ennemi.type.texture + "_mort");
  ennemi.once("animationcomplete", () => {
    scene.tweens.add({ targets: ennemi, alpha: 0, duration: 300, onComplete: () => ennemi.destroy() });
  });
}

export function ombreAttaqueTemple(scene, ennemi) {
  if (scene.temple.detruit || scene.tempsJeu < ennemi.prochaineAttaque) {
    return;
  }
  ennemi.prochaineAttaque = scene.tempsJeu + ennemi.type.cadenceAttaque;
  jouerAttaque(ennemi);
  blesserTemple(scene, ennemi.type.degatsTemple);
}

export function ombreToucheJoueur(scene, joueur, ennemi) {
  if (joueur.estMort || scene.tempsJeu < joueur.finInvulnerabilite) {
    return;
  }
  jouerAttaque(ennemi);
  blesserJoueur(scene, joueur, ennemi.type.degats);
}

function jouerAttaque(ennemi) {
  const cle = ennemi.type.texture + "_attaque";
  if (ennemi.anims.getName() !== cle) {
    ennemi.play(cle);
    ennemi.anims.chain(ennemi.type.texture + "_marche");
  }
}

export function placeDisponible(scene) {
  return scene.groupeEnnemis.countActive(true) < VAGUES.maxEnnemis;
}
