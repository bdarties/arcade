/***********************************************************************/
/** DONNÉES DU JEU : personnages, arènes et objets
/** On regroupe ici tous les "chiffres" du jeu pour pouvoir les équilibrer
/** facilement sans toucher à la logique des scènes.
/***********************************************************************/

// Planches de sprites : 14 frames (repos, marche, saut, garde, attaques, touché, K.O., victoire)
//   largeur / hauteur : taille d'une frame      echelle : agrandissement en jeu
//   pixelArt : affichage sans lissage            animations : frames remplaçant celles par défaut
const SPRITE_PIXEL_ART = {
  largeur: 128,
  hauteur: 128,
  echelle: 1.45,
  pixelArt: true,
  // les frames 14 à 16 contiennent la vraie séquence d'attaque
  animations: { lourde: [14, 15, 16], tir: [14, 15, 16] }
};

// vitesse : vitesse de déplacement (px/s)      saut : vitesse initiale du saut (px/s)
// force : multiplicateur de dégâts              vitesseNote : vitesse du projectile (px/s)
// projectile : planche animée du projectile (sinon une note de musique à la couleur du perso)
export const PERSONNAGES = [
  {
    id: "doremi",
    nom: "Doremi",
    role: "Prodige du solfège",
    couleur: 0xf2b632,
    vitesse: 250, saut: 800, force: 1.1, vitesseNote: 540,
    special: "Ah ! vous dirai-je, maman",
    compositeur: "Mozart",
    sprite: SPRITE_PIXEL_ART,
    projectile: "cle_de_fa"
  },
  {
    id: "symphanie",
    nom: "Symphanie",
    role: "Étoile de l'orchestre",
    couleur: 0xe05ab4,
    vitesse: 300, saut: 850, force: 0.9, vitesseNote: 640,
    special: "Danse de la Fée Dragée",
    compositeur: "Tchaïkovski",
    sprite: SPRITE_PIXEL_ART,
    projectile: "cle_de_sol"
  }
];

// sol : hauteur (y) où les pieds des combattants touchent le sol du décor
export const ARENES = [
  {
    id: "opera",
    nom: "L'Opéra",
    description: "Balcons dorés et lustre en mouvement",
    musique: "musique_opera",
    sol: 640
  },
  {
    id: "piano",
    nom: "Le Piano géant",
    description: "Chaque touche foulée joue sa note",
    musique: "musique_piano",
    sol: 620
  },
  {
    id: "coulisses",
    nom: "Les Coulisses",
    description: "Caisses, flight cases et projecteurs",
    musique: "musique_opera",
    sol: 600
  }
];

// objets qui tombent du ciel pendant le combat (poids = probabilité relative d'apparition)
export const OBJETS = [
  { cle: "objet_rose", type: "soin", valeur: 15, poids: 25, texte: "+15 PV" },
  { cle: "objet_partition", type: "energie", valeur: 40, poids: 30, texte: "+2 notes" },
  { cle: "objet_metronome", type: "vitesse", valeur: 1.4, duree: 6000, poids: 25, texte: "Tempo accéléré !" },
  { cle: "objet_baguette", type: "force", valeur: 1.5, duree: 6000, poids: 20, texte: "Force x1,5 !" }
];

export function trouverPerso(id) {
  return PERSONNAGES.find((perso) => perso.id === id);
}

export function trouverArene(id) {
  return ARENES.find((arene) => arene.id === id);
}
