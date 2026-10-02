import { SONS } from "../reglages/config.js";

let contexte = null;
let sortie = null;
let bruit = null;
const derniersSons = {};

const INTERVALLES = { touche: 0.05, temple: 0.25, mort_ombre: 0.05, epee: 0.05 };

const FICHIERS = {
  epee: { cles: ["epee"], volume: 0.5 }
};
const sonsFichiers = {};

export function initialiserSons(scene) {
  if (!SONS.actifs || !scene.sound || !scene.sound.context) {
    return;
  }
  if (contexte === scene.sound.context) {
    return;
  }
  for (const nom in FICHIERS) {
    const reglage = FICHIERS[nom];
    sonsFichiers[nom] = {
      sons: reglage.cles.map((cle) => scene.sound.add(cle, { volume: reglage.volume })),
      suivant: 0
    };
  }
  contexte = scene.sound.context;
  sortie = contexte.createGain();
  sortie.gain.value = SONS.volume;
  sortie.connect(contexte.destination);
  bruit = contexte.createBuffer(1, contexte.sampleRate, contexte.sampleRate);
  const donnees = bruit.getChannelData(0);
  for (let i = 0; i < donnees.length; i++) {
    donnees[i] = Math.random() * 2 - 1;
  }
}

function pret() {
  return contexte !== null && contexte.state === "running";
}

function note(type, frequenceDebut, frequenceFin, duree, volume, retard) {
  const t = contexte.currentTime + (retard || 0);
  const osc = contexte.createOscillator();
  const gain = contexte.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequenceDebut, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, frequenceFin), t + duree);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  osc.connect(gain);
  gain.connect(sortie);
  osc.start(t);
  osc.stop(t + duree + 0.02);
}

function souffle(typeFiltre, frequenceDebut, frequenceFin, duree, volume) {
  const t = contexte.currentTime;
  const source = contexte.createBufferSource();
  source.buffer = bruit;
  const filtre = contexte.createBiquadFilter();
  filtre.type = typeFiltre;
  filtre.frequency.setValueAtTime(frequenceDebut, t);
  filtre.frequency.exponentialRampToValueAtTime(Math.max(20, frequenceFin), t + duree);
  const gain = contexte.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  source.connect(filtre);
  filtre.connect(gain);
  gain.connect(sortie);
  source.start(t, Math.random() * 0.5);
  source.stop(t + duree + 0.02);
}

export function jouerSon(nom) {
  if (!pret()) {
    return;
  }
  const maintenant = contexte.currentTime;
  const intervalle = INTERVALLES[nom] || 0.03;
  if (derniersSons[nom] !== undefined && maintenant - derniersSons[nom] < intervalle) {
    return;
  }
  derniersSons[nom] = maintenant;

  if (sonsFichiers[nom]) {
    const fichier = sonsFichiers[nom];
    fichier.sons[fichier.suivant].play();
    fichier.suivant = (fichier.suivant + 1) % fichier.sons.length;
    return;
  }

  switch (nom) {
    case "touche":
      note("triangle", 190, 80, 0.07, 0.12);
      break;
    case "mort_ombre":
      souffle("lowpass", 900, 120, 0.25, 0.18);
      note("sine", 240, 50, 0.25, 0.1);
      break;
    case "blesse":
      note("square", 300, 110, 0.12, 0.1);
      break;
    case "temple":
      note("sine", 95, 45, 0.3, 0.3);
      break;
    case "vague":
      note("sine", 110, 104, 1.6, 0.25);
      note("sine", 165, 160, 1.4, 0.12);
      break;
    case "temple_detruit":
      souffle("lowpass", 1200, 50, 2, 0.4);
      note("sine", 70, 30, 2, 0.35);
      break;
    case "reanimation":
      note("sine", 300, 900, 0.5, 0.15);
      note("triangle", 450, 1350, 0.5, 0.08, 0.05);
      break;
    case "mort_joueur":
      note("triangle", 400, 90, 0.6, 0.18);
      break;
    case "choix":
      note("triangle", 660, 990, 0.12, 0.1);
      break;
    case "curseur":
      note("sine", 520, 560, 0.04, 0.05);
      break;
  }
}

let musique = null;

export function jouerMusique(scene, cle) {
  if (!SONS.actifs || (musique !== null && musique.key === cle)) {
    return;
  }
  if (musique !== null) {
    musique.destroy();
  }
  musique = scene.sound.add(cle, { loop: true, volume: SONS.volumeMusique });
  musique.play();
}
