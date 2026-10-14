import { RARETES } from "../reglages/config.js";
import { BIENFAITS } from "../reglages/bienfaits.js";
import { tiragePondere, formaterNombre } from "../fonctions.js";

function estDisponible(joueur, id) {
  const bienfait = BIENFAITS[id];
  const niveau = joueur.bienfaits[id] || 0;
  if (niveau >= bienfait.niveauMax) {
    return false;
  }
  if (bienfait.requiert && bienfait.requiert !== joueur.classe.armeDeBase) {
    return false;
  }
  return true;
}

export function tirerRarete() {
  return tiragePondere(RARETES, (rarete) => rarete.poids);
}

export function tirerBienfaits(joueur, nombre) {
  const possibles = Object.keys(BIENFAITS).filter((id) => estDisponible(joueur, id));
  const choisis = Phaser.Utils.Array.Shuffle(possibles).slice(0, nombre);
  return choisis.map((id) => {
    const bienfait = BIENFAITS[id];
    const rarete = tirerRarete();
    const valeur = bienfait.valeur * rarete.multiplicateur;
    return {
      id: id,
      bienfait: bienfait,
      rarete: rarete,
      valeur: valeur,
      niveauActuel: joueur.bienfaits[id] || 0,
      description: bienfait.texte.replace("{v}", formaterNombre(valeur))
    };
  });
}

export function appliquerBienfait(scene, joueur, proposition) {
  proposition.bienfait.appliquer(scene, joueur, proposition.valeur);
  joueur.bienfaits[proposition.id] = proposition.niveauActuel + 1;
}
