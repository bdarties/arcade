import { MONDE, ISO, VAGUES } from "../reglages/config.js";
import { BESTIAIRE } from "../reglages/bestiaire.js";
import { tiragePondere } from "../fonctions.js";
import { creerEnnemi, placeDisponible } from "./ennemis.js";
import { reconstruireTemple } from "./temple.js";
import { estVisible } from "./carte.js";
import { annoncer } from "./hud.js";
import { flashLumineux } from "./effets.js";
import { jouerSon } from "./sons.js";

export function demarrerVagues(scene) {
  scene.vague = { numero: 0, aFaireApparaitre: [], timerApparition: null, timerFin: null };
  scene.time.delayedCall(VAGUES.delaiPremiereVague, () => lancerVague(scene));
}

function composerVague(scene) {
  let nombre = VAGUES.ennemisBase + VAGUES.ennemisParVague * (scene.vague.numero - 1);
  if (scene.joueurs.length > 1) {
    nombre = Math.round(nombre * VAGUES.multiplicateurDuo);
  }
  const typesDisponibles = Object.keys(BESTIAIRE).filter((id) => BESTIAIRE[id].niveauMin <= scene.niveau);

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

  vague.aFaireApparaitre = composerVague(scene);
  annoncer(scene, "Vague " + vague.numero, "Les ombres s'élèvent…");
  jouerSon("vague");

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

  flashLumineux(scene, position.x, position.y - 20, 0x9b4dff, 160);
  groupe.forEach((idType, i) => {
    const angle = (i / groupe.length) * Math.PI * 2;
    creerEnnemi(scene, idType, position.x + Math.cos(angle) * 20, position.y + Math.sin(angle) * 20 * ISO.ratioY);
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
      if (restantes <= VAGUES.seuilVagueSuivante || scene.tempsJeu - debut > VAGUES.attenteMax) {
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
