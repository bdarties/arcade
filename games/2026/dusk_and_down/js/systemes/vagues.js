import { MONDE, ISO, VAGUES } from "../reglages/config.js";
import { BESTIAIRE, BOSS } from "../reglages/bestiaire.js";
import { tiragePondere } from "../fonctions.js";
import { creerEnnemi, placeDisponible } from "./ennemis.js";
import { reconstruireTemple } from "./temple.js";
import { estVisible } from "./carte.js";
import { annoncer } from "./hud.js";
import { jouerEffet, flashLumineux } from "./effets.js";
import { jouerSon } from "./sons.js";

export function demarrerVagues(scene) {
  scene.vague = { numero: 0, aFaireApparaitre: [], timerApparition: null, timerFin: null };
  scene.time.delayedCall(VAGUES.delaiPremiereVague, () => lancerVague(scene));
}

export function composerVague(niveau, numeroVague, nbJoueurs) {
  let nombre =
    VAGUES.ennemisBase +
    VAGUES.ennemisParNiveau * (niveau - 1) +
    VAGUES.ennemisParVague * (numeroVague - 1);
  if (nbJoueurs > 1) {
    nombre *= VAGUES.multiplicateurDuo;
  }
  nombre = Math.round(nombre);

  const typesDisponibles = Object.keys(BESTIAIRE).filter((id) => BESTIAIRE[id].niveauMin <= niveau);

  const liste = [];
  for (let i = 0; i < nombre; i++) {
    liste.push(tiragePondere(typesDisponibles, (id) => BESTIAIRE[id].poids));
  }
  return liste;
}

function lancerVague(scene) {
  if (scene.partieTerminee) {
    return;
  }
  const vague = scene.vague;
  vague.numero += 1;

  if (scene.temple.detruit && vague.numero >= scene.temple.vagueReconstruction) {
    reconstruireTemple(scene);
  }

  const vagueDeBoss = vague.numero % VAGUES.frequenceBoss === 0;
  vague.aFaireApparaitre = composerVague(scene.niveau, vague.numero, scene.joueurs.length);
  if (vagueDeBoss) {
    vague.aFaireApparaitre = vague.aFaireApparaitre.slice(0, Math.ceil(vague.aFaireApparaitre.length * 0.6));
    scene.time.delayedCall(1500, () => reveillerBoss(scene));
  } else {
    annoncer(scene, "Vague " + vague.numero, "Les ombres s'élèvent…");
    jouerSon("vague");
  }

  vague.timerApparition = scene.time.addEvent({
    delay: VAGUES.intervalleApparition,
    callback: () => apparitionGroupe(scene),
    loop: true
  });
}

function apparitionGroupe(scene) {
  const vague = scene.vague;
  if (vague.aFaireApparaitre.length === 0) {
    vague.timerApparition.remove();
    attendreFinVague(scene);
    return;
  }
  if (!placeDisponible(scene)) {
    return;
  }
  const taille = Phaser.Math.Between(VAGUES.tailleGroupeMin, VAGUES.tailleGroupeMax);
  const groupe = vague.aFaireApparaitre.splice(0, taille);
  const position = positionApparition(scene);

  jouerEffet(scene, "anim_ombre_apparition", position.x, position.y, { origineY: 0.9 });
  flashLumineux(scene, position.x, position.y - 20, 0x9b4dff, 160);
  scene.time.delayedCall(450, () => {
    if (scene.partieTerminee) {
      return;
    }
    groupe.forEach((idType, i) => {
      const angle = (i / groupe.length) * Math.PI * 2;
      creerEnnemi(scene, idType, position.x + Math.cos(angle) * 20, position.y + Math.sin(angle) * 20 * ISO.ratioY);
    });
  });
}

function attendreFinVague(scene) {
  const vague = scene.vague;
  const debut = scene.tempsJeu;
  vague.timerFin = scene.time.addEvent({
    delay: 500,
    loop: true,
    callback: () => {
      const restantes = scene.groupeEnnemis.countActive(true);
      const bossEnVie = scene.bossActif !== null;
      if ((restantes <= VAGUES.seuilVagueSuivante && !bossEnVie) || scene.tempsJeu - debut > VAGUES.attenteMax) {
        vague.timerFin.remove();
        scene.time.delayedCall(VAGUES.pauseEntreVagues, () => lancerVague(scene));
      }
    }
  });
}

function positionApparition(scene) {
  let x = 0;
  let y = 0;
  for (let essai = 0; essai < 10; essai++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Phaser.Math.FloatBetween(VAGUES.distanceMin, VAGUES.distanceMax);
    x = Phaser.Math.Clamp(scene.temple.x + Math.cos(angle) * distance, 60, MONDE.largeur - 60);
    y = Phaser.Math.Clamp(scene.temple.y + Math.sin(angle) * distance * ISO.ratioY, 80, MONDE.hauteur - 20);
    if (!estVisible(scene, x, y, 40)) {
      break;
    }
  }
  return { x: x, y: y };
}

function reveillerBoss(scene) {
  if (scene.partieTerminee) {
    return;
  }
  scene.nbBossApparus += 1;
  const x = scene.trone.x;
  const y = scene.trone.y + 52;
  jouerEffet(scene, "anim_ombre_apparition", x, y, { origineY: 0.9, echelle: 3 });
  flashLumineux(scene, x, y - 60, 0x7a3dff, 500);
  scene.cameras.main.shake(700, 0.008);
  jouerSon("boss");
  annoncer(scene, BOSS.nom.toUpperCase(), "Le roi déchu s'éveille sur son trône…");
  scene.time.delayedCall(600, () => {
    if (!scene.partieTerminee) {
      scene.bossActif = creerEnnemi(scene, "boss", x, y);
    }
  });
}
