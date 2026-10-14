export const ECRAN = { largeur: 1280, hauteur: 720 };

export const MONDE = { largeur: 2048, hauteur: 1152 };

export const ISO = { ratioY: 0.5 };

export const PROFONDEUR = {
  sol: -30,
  parvis: -25,
  decorSol: -20,
  tenebres: 100000,
  lumieres: 100010,
  textes: 100020,
  hud: 200000
};

export const TENEBRES = {
  actives: true,
  couleur: 0x05030c,
  opacite: 0.78,
  opaciteSansTemple: 0.9
};

export const TEMPLE = {
  pvMax: 600,
  rayonLumiere: 660,
  lumiereMin: 0.35,
  vaguesReconstruction: 2
};

export const JOUEUR = {
  rayonLumiere: 190,
  invulnerabilite: 700,
  ecartMaxX: 1160,
  ecartMaxY: 580
};

export const XP = {
  base: 5,
  croissance: 4,
  exposant: 1.25,
  vitesseAttraction: 420,
  maxGemmes: 80
};

export const VAGUES = {
  delaiPremiereVague: 3500,
  pauseEntreVagues: 3000,
  ennemisBase: 8,
  ennemisParVague: 3,
  multiplicateurDuo: 1.6,
  intervalleApparition: 1100,
  tailleGroupeMin: 2,
  tailleGroupeMax: 4,
  seuilVagueSuivante: 3,
  attenteMax: 25000,
  maxEnnemis: 150,
  distanceMin: 650,
  distanceMax: 1000
};

export const RARETES = [
  { id: "commun", nom: "Commun", poids: 60, multiplicateur: 1, couleur: 0xc9c3b6 },
  { id: "rare", nom: "Rare", poids: 26, multiplicateur: 1.5, couleur: 0x4d9dff },
  { id: "epique", nom: "Épique", poids: 10, multiplicateur: 2, couleur: 0xb15cff },
  { id: "heroique", nom: "Héroïque", poids: 4, multiplicateur: 2.5, couleur: 0xff5c3d }
];

export const SONS = { actifs: true, volume: 0.35, volumeMusique: 0.2 };

export const POLICE_TITRE = "Cormorant SC";
export const POLICE_TEXTE = "Lora";

export const BARRES = {
  temple: { x: 22, y: 16 },
  joueur_1: { x: 52, y: 18 },
  joueur_2: { x: 15, y: 16 }
};
