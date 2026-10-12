import { JOUEUR, PROFONDEUR, POLICE_TITRE } from "../reglages/config.js";
import { CLASSES } from "../reglages/classes.js";
import { creerControles } from "../reglages/controles.js";
import { deplacerAuSol, trierProfondeur } from "../fonctions.js";
import { creerArme } from "./armes.js";
import { jouerSon } from "./sons.js";

export function creerJoueur(scene, numero, idClasse) {
  const classe = CLASSES[idClasse];
  const cleTexture = classe.texture + "_j" + numero;

  const decalage = scene.nbJoueurs === 1 ? 0 : numero === 1 ? -60 : 60;
  const joueur = scene.physics.add.sprite(scene.temple.x + decalage, scene.temple.y + 110, cleTexture, 0);
  joueur.setOrigin(0.5, classe.origineY);
  const r = classe.rayonCorps;
  joueur.body.setCircle(r, joueur.width / 2 - r, joueur.height * classe.origineY - 2 * r);
  joueur.setCollideWorldBounds(true);

  joueur.numero = numero;
  joueur.classe = classe;
  joueur.cleTexture = cleTexture;
  joueur.touches = creerControles(scene, numero);
  joueur.stats = {
    pvMax: classe.pvMax,
    vitesse: classe.vitesse,
    rayonLumiere: JOUEUR.rayonLumiere
  };
  joueur.pv = classe.pvMax;
  joueur.estMort = false;
  joueur.finInvulnerabilite = 0;
  joueur.finAttaque = 0;
  joueur.directionX = 1;
  joueur.directionY = 0;

  const couleur = numero === 1 ? "#ff8f7a" : "#ffcf7a";
  joueur.etiquette = scene.add
    .text(joueur.x, joueur.y, "J" + numero, { fontFamily: POLICE_TITRE, fontSize: "13px", color: couleur, stroke: "#000000", strokeThickness: 3 })
    .setOrigin(0.5, 1)
    .setDepth(PROFONDEUR.textes);
  joueur.barreFond = scene.add.rectangle(joueur.x, joueur.y, 34, 5, 0x000000, 0.7).setDepth(PROFONDEUR.textes);
  joueur.barrePv = scene.add
    .rectangle(joueur.x, joueur.y, 32, 3, numero === 1 ? 0xe8483c : 0xffc15a)
    .setOrigin(0, 0.5)
    .setDepth(PROFONDEUR.textes);

  joueur.arme = creerArme(scene, classe.armeDeBase);

  joueur.anims.play(cleTexture + "_repos");
  joueur.setFlipX(classe.regardeAGauche);
  return joueur;
}

export function mettreAJourJoueur(scene, joueur) {
  if (joueur.estMort) {
    return;
  }

  let dx = 0;
  let dy = 0;
  if (joueur.touches.gauche.isDown) dx -= 1;
  if (joueur.touches.droite.isDown) dx += 1;
  if (joueur.touches.haut.isDown) dy -= 1;
  if (joueur.touches.bas.isDown) dy += 1;

  const enAttaque = scene.tempsJeu < joueur.finAttaque;
  if (dx !== 0 || dy !== 0) {
    const longueur = Math.sqrt(dx * dx + dy * dy);
    joueur.directionX = dx / longueur;
    joueur.directionY = dy / longueur;
    deplacerAuSol(joueur, joueur.directionX, joueur.directionY, joueur.stats.vitesse);
    if (!enAttaque) {
      joueur.anims.play(joueur.cleTexture + "_marche", true);
    }
    if (dx !== 0 && !enAttaque) {
      joueur.setFlipX(joueur.classe.regardeAGauche ? dx > 0 : dx < 0);
    }
  } else {
    joueur.setVelocity(0, 0);
    if (!enAttaque) {
      joueur.anims.play(joueur.cleTexture + "_repos", true);
    }
  }

  if (scene.tempsJeu < joueur.finInvulnerabilite) {
    joueur.setAlpha(Math.floor(scene.tempsJeu / 80) % 2 === 0 ? 0.4 : 1);
  } else {
    joueur.setAlpha(1);
  }

  trierProfondeur(joueur);
  placerInfosJoueur(joueur);
}

function placerInfosJoueur(joueur) {
  joueur.etiquette.setPosition(joueur.x, joueur.y - joueur.classe.hauteurTete - 5);
  joueur.barreFond.setPosition(joueur.x, joueur.y - joueur.classe.hauteurTete - 2);
  joueur.barrePv.setPosition(joueur.x - 16, joueur.y - joueur.classe.hauteurTete - 2);
  joueur.barrePv.setScale(Math.max(0, joueur.pv / joueur.stats.pvMax), 1);
}

export function garderJoueursEnsemble(scene) {
  const vivants = scene.joueurs.filter((joueur) => !joueur.estMort);
  if (vivants.length < 2) {
    return;
  }
  const a = vivants[0];
  const b = vivants[1];
  for (const [joueur, autre] of [[a, b], [b, a]]) {
    joueur.x = Phaser.Math.Clamp(joueur.x, autre.x - JOUEUR.ecartMaxX, autre.x + JOUEUR.ecartMaxX);
    joueur.y = Phaser.Math.Clamp(joueur.y, autre.y - JOUEUR.ecartMaxY, autre.y + JOUEUR.ecartMaxY);
  }
}

export function blesserJoueur(scene, joueur, degats) {
  if (joueur.estMort || scene.tempsJeu < joueur.finInvulnerabilite) {
    return;
  }
  joueur.pv -= degats;
  joueur.finInvulnerabilite = scene.tempsJeu + JOUEUR.invulnerabilite;
  joueur.setTint(0xff5555);
  scene.time.delayedCall(120, () => joueur.clearTint());
  scene.cameras.main.shake(80, 0.004);
  jouerSon("blesse");
  if (joueur.pv <= 0) {
    tuerJoueur(scene, joueur);
  }
}

function tuerJoueur(scene, joueur) {
  joueur.pv = 0;
  joueur.estMort = true;
  joueur.setVelocity(0, 0);
  joueur.body.enable = false;
  joueur.setAlpha(1);
  joueur.anims.play(joueur.cleTexture + "_mort");
  joueur.etiquette.setVisible(false);
  joueur.barreFond.setVisible(false);
  joueur.barrePv.setVisible(false);
  jouerSon("mort_joueur");
}

export function tousTombes(scene) {
  return scene.joueurs.every((joueur) => joueur.estMort);
}
