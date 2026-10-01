import { ISO } from "./reglages/config.js";

export function distanceSol(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = (y2 - y1) / ISO.ratioY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function directionSol(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = (y2 - y1) / ISO.ratioY;
  const longueur = Math.sqrt(dx * dx + dy * dy);
  if (longueur === 0) {
    return { x: 0, y: 0 };
  }
  return { x: dx / longueur, y: dy / longueur };
}

export function deplacerAuSol(sprite, directionX, directionY, vitesse) {
  sprite.setVelocity(directionX * vitesse, directionY * vitesse * ISO.ratioY);
}

export function plusProche(x, y, liste, distanceMax) {
  let meilleur = null;
  let meilleureDistance = distanceMax === undefined ? Infinity : distanceMax;
  for (const objet of liste) {
    const d = distanceSol(x, y, objet.x, objet.y);
    if (d < meilleureDistance) {
      meilleureDistance = d;
      meilleur = objet;
    }
  }
  return meilleur;
}

export function tiragePondere(liste, poidsDe) {
  let total = 0;
  for (const element of liste) {
    total += poidsDe(element);
  }
  let tirage = Math.random() * total;
  for (const element of liste) {
    tirage -= poidsDe(element);
    if (tirage <= 0) {
      return element;
    }
  }
  return liste[liste.length - 1];
}

export function trierProfondeur(sprite) {
  sprite.setDepth(sprite.y);
}

export function formaterNombre(valeur) {
  const arrondi = Math.round(valeur * 100) / 100;
  return String(arrondi).replace(".", ",");
}

export function formaterTemps(ms) {
  const secondes = Math.floor(ms / 1000);
  const minutes = Math.floor(secondes / 60);
  const reste = secondes % 60;
  return String(minutes).padStart(2, "0") + ":" + String(reste).padStart(2, "0");
}
