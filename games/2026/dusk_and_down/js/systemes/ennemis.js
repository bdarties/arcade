import { VAGUES, ISO, PROFONDEUR } from "../reglages/config.js";
import { BESTIAIRE, BOSS } from "../reglages/bestiaire.js";
import { distanceSol, directionSol, deplacerAuSol, plusProche, trierProfondeur } from "../fonctions.js";
import { blesserTemple } from "./temple.js";
import { blesserJoueur } from "./joueurs.js";
import { lacherEclatDeLumiere } from "./butin.js";
import { jouerEffet, afficherChiffre } from "./effets.js";
import { jouerSon } from "./sons.js";

export function bonusNiveau(niveau) {
  return {
    pv: 1 + VAGUES.bonusPvParNiveau * (niveau - 1),
    degats: 1 + VAGUES.bonusDegatsParNiveau * (niveau - 1)
  };
}

export function creerEnnemi(scene, idType, x, y) {
  const type = idType === "boss" ? BOSS : BESTIAIRE[idType];
  const bonus = bonusNiveau(scene.niveau);
  const ennemi = scene.groupeEnnemis.create(x, y, type.texture, 0);
  ennemi.setOrigin(0.5, 0.92);
  const r = type.rayonCorps;
  ennemi.body.setCircle(r, ennemi.width / 2 - r, ennemi.height * 0.92 - 2 * r);
  ennemi.setCollideWorldBounds(true);
  if (type.echelle) {
    ennemi.setScale(type.echelle);
  }

  ennemi.type = type;
  ennemi.estBoss = idType === "boss";
  ennemi.pvMax = Math.round(type.pv * bonus.pv);
  ennemi.vitesse = type.vitesse;
  ennemi.degats = type.degats * bonus.degats;
  ennemi.degatsTemple = type.degatsTemple * bonus.degats;
  ennemi.xp = type.xp;
  ennemi.points = type.points;
  ennemi.prochaineAttaque = 0;
  ennemi.prochaineSalve = scene.tempsJeu + 2000;
  ennemi.finRecul = 0;
  ennemi.finFlash = 0;

  if (ennemi.estBoss) {
    ennemi.pvMax = Math.round(BOSS.pv * bonus.pv * (1 + 0.25 * (scene.nbBossApparus - 1)));
  }
  ennemi.pv = ennemi.pvMax;

  if (type.texture === "spectre") {
    ennemi.play("spectre_apparition");
    ennemi.anims.chain("spectre_marche");
  } else {
    ennemi.play(type.texture + "_marche");
    ennemi.anims.setProgress(Math.random());
  }
  mettreAJourTeinte(scene, ennemi);
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
    if (ennemi.estBoss) {
      salveDuBoss(scene, ennemi);
    }
    if (scene.tempsJeu < ennemi.finRecul) {
      continue;
    }
    deplacerEnnemi(scene, ennemi);
  }
}

function choisirCible(scene, ennemi) {
  const temple = scene.temple;
  const vivants = scene.joueurs.filter((joueur) => !joueur.estMort);
  const joueurProche = plusProche(ennemi.x, ennemi.y, vivants);
  if (temple.detruit) {
    return joueurProche;
  }
  switch (ennemi.type.comportement) {
    case "chasseur":
      return joueurProche !== null ? joueurProche : temple;
    case "opportuniste": {
      const proie = plusProche(ennemi.x, ennemi.y, vivants, ennemi.type.rayonDetection);
      return proie !== null ? proie : temple;
    }
    default:
      return temple;
  }
}

function deplacerEnnemi(scene, ennemi) {
  const cible = choisirCible(scene, ennemi);
  if (cible === null) {
    ennemi.setVelocity(0, 0);
    return;
  }
  const distance = distanceSol(ennemi.x, ennemi.y, cible.x, cible.y);
  let direction = directionSol(ennemi.x, ennemi.y, cible.x, cible.y);
  let vitesse = ennemi.vitesse;

  if (ennemi.type.comportement === "tireur") {
    if (distance < ennemi.type.portee * 0.7) {
      direction = { x: -direction.x, y: -direction.y };
    } else if (distance < ennemi.type.portee) {
      vitesse = 0;
    }
    if (distance < ennemi.type.portee * 1.15 && scene.tempsJeu >= ennemi.prochaineAttaque) {
      ennemi.prochaineAttaque = scene.tempsJeu + ennemi.type.cadenceAttaque;
      tirerCrane(scene, ennemi, cible.x, cible.y, ennemi.type.vitesseProjectile, ennemi.degatsTemple);
    }
  }

  deplacerAuSol(ennemi, direction.x, direction.y, vitesse);
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

export function blesserEnnemi(scene, ennemi, degats, sourceX, sourceY, recul, critique) {
  if (!ennemi.active) {
    return;
  }
  ennemi.pv -= degats;
  ennemi.finFlash = scene.tempsJeu + 60;
  if (critique) {
    afficherChiffre(scene, ennemi.x, ennemi.y - ennemi.displayHeight, Math.round(degats) + " !", "#ffd84a");
  }
  jouerSon("touche");

  const force = recul * ennemi.type.sensibiliteRecul;
  if (force > 0) {
    const direction = directionSol(sourceX, sourceY, ennemi.x, ennemi.y);
    deplacerAuSol(ennemi, direction.x, direction.y, force);
    ennemi.finRecul = scene.tempsJeu + 120;
  }

  if (ennemi.pv <= 0) {
    tuerEnnemi(scene, ennemi);
  }
}

function tuerEnnemi(scene, ennemi) {
  scene.score += ennemi.points;
  scene.ennemisVaincus += 1;
  lacherEclatDeLumiere(scene, ennemi.x, ennemi.y - 6, ennemi.xp);
  jouerSon("mort_ombre");

  scene.groupeEnnemis.remove(ennemi);
  ennemi.body.enable = false;
  ennemi.clearTint();
  ennemi.setTint(0x6a5a8a);
  const animMort = ennemi.type.texture + "_mort";
  ennemi.anims.chain();
  ennemi.play(animMort);
  ennemi.once("animationcomplete", () => {
    scene.tweens.add({ targets: ennemi, alpha: 0, duration: 300, onComplete: () => ennemi.destroy() });
  });

  if (ennemi.estBoss) {
    bossVaincu(scene);
  }
}

function bossVaincu(scene) {
  scene.bossActif = null;
  scene.bossVaincus += 1;
}

export function ombreAttaqueTemple(scene, ennemi) {
  if (scene.temple.detruit || scene.tempsJeu < ennemi.prochaineAttaque || ennemi.type.comportement === "tireur") {
    return;
  }
  ennemi.prochaineAttaque = scene.tempsJeu + ennemi.type.cadenceAttaque;
  jouerAttaque(ennemi);
  blesserTemple(scene, ennemi.degatsTemple);
}

export function ombreToucheJoueur(scene, joueur, ennemi) {
  if (joueur.estMort || scene.tempsJeu < joueur.finInvulnerabilite) {
    return;
  }
  jouerAttaque(ennemi);
  blesserJoueur(scene, joueur, ennemi.degats);
}

function jouerAttaque(ennemi) {
  const cle = ennemi.type.texture + "_attaque";
  if (ennemi.scene.anims.exists(cle) && ennemi.anims.getName() !== cle) {
    ennemi.play(cle);
    ennemi.anims.chain(ennemi.type.texture + "_marche");
  }
}

export function tirerCrane(scene, ennemi, cibleX, cibleY, vitesse, degats) {
  const direction = directionSol(ennemi.x, ennemi.y, cibleX, cibleY);
  lancerCrane(scene, ennemi.x, ennemi.y - 14, Math.atan2(direction.y, direction.x), vitesse, degats);
}

function lancerCrane(scene, x, y, angleSol, vitesse, degats) {
  const crane = scene.groupeCranes.create(x, y, "crane_ombre", 0);
  crane.play("anim_crane_ombre");
  crane.body.setCircle(10, crane.width / 2 - 10, crane.height / 2 - 10 + 14);
  crane.setDepth(PROFONDEUR.lumieres);
  const vx = Math.cos(angleSol);
  const vy = Math.sin(angleSol);
  deplacerAuSol(crane, vx, vy, vitesse);
  crane.setRotation(Math.atan2(vy * ISO.ratioY, vx));
  crane.degats = degats;
  crane.finVie = scene.tempsJeu + 3500;
}

function salveDuBoss(scene, boss) {
  if (scene.tempsJeu < boss.prochaineSalve) {
    return;
  }
  boss.prochaineSalve = scene.tempsJeu + BOSS.cadenceSalve;
  jouerAttaque(boss);
  for (let i = 0; i < BOSS.nbCranesSalve; i++) {
    const angle = (i / BOSS.nbCranesSalve) * Math.PI * 2 + scene.tempsJeu / 1000;
    lancerCrane(scene, boss.x, boss.y - 40, angle, BOSS.vitesseProjectile, boss.degats * BOSS.degatsCrane);
  }
  jouerSon("salve");
}

export function craneToucheJoueur(scene, crane, joueur) {
  if (!crane.active || joueur.estMort) {
    return;
  }
  blesserJoueur(scene, joueur, crane.degats);
  exploserCrane(scene, crane);
}

export function craneToucheTemple(scene, crane) {
  if (!crane.active) {
    return;
  }
  blesserTemple(scene, crane.degats);
  exploserCrane(scene, crane);
}

export function exploserCrane(scene, crane) {
  jouerEffet(scene, "anim_crane_impact", crane.x, crane.y, {});
  crane.destroy();
}

export function mettreAJourCranes(scene) {
  for (const crane of scene.groupeCranes.getChildren().slice()) {
    if (scene.tempsJeu > crane.finVie) {
      crane.destroy();
    }
  }
}

export function placeDisponible(scene) {
  return scene.groupeEnnemis.countActive(true) < VAGUES.maxEnnemis;
}
