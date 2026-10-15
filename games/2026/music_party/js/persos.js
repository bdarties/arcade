// Les personnages.
//   texture : l'image du perso        tete : sa tete, affichée à coté du score
//   couleur : couleur de son texte     teinte : couleur de ses effets
//   marche : sa spritesheet de marche (Piano Time, quand il change de touche)

// Les 4 persos du document "Idées" (des archétypes d'opéra), pour Music Fall, Piano Time
// et Memory Song. "motif" = son petit air quand on le choisit.
export const PERSOS = [
  {
    cle: "diva",
    nom: "La Reine de la Nuit",
    description: "Reine de la Nuit. \nSa voix brise les verres...",
    texture: "img_diva",
    tete: "img_tete_reine",
    marche: "img_marche_diva",           // spritesheet quand il marche (6 images)
    tailleMarche: [58, 83],              // largeur et hauteur d'une image
    animMarche: "anim_marche_diva",
    // planche d'animation affichée sur l'écran de fin (à la place de diva.png)
    fin: {
      fichier: "reine.png",
      taille: [172, 252],    // largeur et hauteur d'une image (6 images)
      images: 6,
      echelle: 1.1,          // 252 px de haut -> environ 277 px à l'écran
      anim: "anim_fin_diva",
      vitesse: 5
    },
    couleur: "#9dbbff",
    teinte: 0x4f73e8,
    motif: [77, 81, 84, 89, 84, 89],
  },
  {
    cle: "figaro",
    nom: "Figaro",
    description: "Figaro ci, Figaro là...\ntoujours pressé,\njamais fatigué !",
    texture: "img_figaro",
    tete: "img_tete_figaro",
    marche: "img_marche_figaro",           // spritesheet quand il marche (6 images)
    tailleMarche: [47, 74],              // largeur et hauteur d'une image
    animMarche: "anim_marche_figaro",
    fin: {
      fichier: "figaro.png",
      taille: [176, 252],
      images: 6,
      echelle: 1.1,
      anim: "anim_fin_figaro",
      vitesse: 5
    },
    couleur: "#7ee0b8",
    teinte: 0x2aa37c,
    motif: [67, 67, 67, 72, 67, 72, 76],
  },
  {
    cle: "carmen",
    nom: "Carmen",
    description: "Libre comme l'oiseau...\net très mauvaise\nperdante !",
    texture: "img_carmen",
    tete: "img_tete_carmen",
    marche: "img_marche_carmen",           // spritesheet quand il marche (6 images)
    tailleMarche: [48, 64],              // largeur et hauteur d'une image
    animMarche: "anim_marche_carmen",
    fin: {
      fichier: "carmen.png",
      taille: [184, 252],
      images: 6,
      echelle: 1.1,
      anim: "anim_fin_carmen",
      vitesse: 5
    },
    couleur: "#ff8080",
    teinte: 0xd8324a,
    motif: [74, 73, 72, 71, 70, 69],
  },
  {
    cle: "maestro",
    nom: "Le Maestro",
    description: "Il dirige l'orchestre\ndepuis les coulisses...\nsans jamais se montrer.",
    texture: "img_maestro",
    tete: "img_tete_maestro",
    marche: "img_marche_maestro",           // spritesheet quand il marche (6 images)
    tailleMarche: [45, 66],              // largeur et hauteur d'une image
    animMarche: "anim_marche_maestro",
    fin: {
      fichier: "don_giovanni.png",
      taille: [167, 252],
      images: 6,
      echelle: 1.1,
      anim: "anim_fin_maestro",
      vitesse: 5
    },
    couleur: "#c9a2ff",
    teinte: 0x7d4bc9,
    motif: [81, 79, 81, 79, 77, 76, 74, 73, 74],
  }
];


function trouverPerso(cle) {
  return PERSOS.find((p) => p.cle == cle) || PERSOS[0];
}

// les joueurs de la partie : J1 tout seul (solo, pour battre les records)
// ou J1 contre J2 (duo)
export function participants(registry) {
  var duo = registry.get("mode") == "duo";
  // les persos choisis sur l'écran de choix (pour les 2 mini-jeux)
  var persos = [trouverPerso(registry.get("perso1")), trouverPerso(registry.get("perso2"))];  
  var joueurs = [{ ...persos[0], etiquette: "J1" }];
  if (duo) joueurs.push({ ...persos[1], etiquette: "J2" });
  return joueurs;
}