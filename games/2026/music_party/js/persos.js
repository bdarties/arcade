// Les personnages.
//   texture : l'image du perso        tete : sa tete, affichée à coté du score
//   echelle : taille quand on l'affiche en grand (écran des résultats)
//   couleur : couleur de son texte     teinte : couleur de ses effets
//   marche : sa spritesheet de marche (Piano Time, quand il change de touche)

// Les 4 persos d'opéra, communs aux trois mini-jeux et à l'écran de sélection.
// "motif" = son petit air quand on le choisit.
export const PERSOS = [
  {
    cle: "carmen",
    nom: "Carmen",
    titre: "La Rebelle",
    description:
      "Carmen est une femme libre et rebelle qui refuse de se laisser dicter les règles. Son grand besoin de liberté " +
      "et ses amours passionnées la conduisent vers un destin tragique. Aujourd'hui, elle débarque sur le plateau " +
      "avec la ferme intention de faire la fête et de gagner !",
    texture: "img_carmen",
    tete: "img_tete_carmen",
    marche: "img_marche_carmen",           // spritesheet quand il marche (6 images)
    tailleMarche: [48, 64],              // largeur et hauteur d'une image
    animMarche: "anim_marche_carmen",
    echelle: 1.1,
    fin: {
      texture: "img_fin_carmen",
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
    cle: "diva",
    nom: "Reine de la Nuit",
    titre: "La Diva dramatique",
    description:
      "La majestueuse Reine de la nuit règne sur les étoiles et l'obscurité. Issue d'un grand conte magique rempli " +
      "d'épreuves mystérieuses où elle utilise sa voix puissante pour manipuler un jeune prince, elle descend " +
      "aujourd'hui de son royaume céleste. Elle débarque sur le plateau comptant bien éblouir tous ses adversaires " +
      "lors des mini-jeux !",
    texture: "img_diva",
    tete: "img_tete_reine",
    marche: "img_marche_diva",           // spritesheet quand il marche (6 images)
    tailleMarche: [58, 83],              // largeur et hauteur d'une image
    animMarche: "anim_marche_diva",
    echelle: 1.1,
    // planche d'animation affichée sur l'écran de fin (à la place de diva.png)
    fin: {
      texture: "img_fin_diva",
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
    titre: "Le Barbier hyperactif",
    description:
      "Figaro est le barbier le plus malin et le plus bavard de toute la ville. Toujours au cœur des secrets, ce " +
      "petit futé court dans tous les sens pour régler les problèmes des autres à toute vitesse. Avec son énergie " +
      "débordante et sa bonne humeur, ce grand farceur est prêt à bondir sur le plateau pour s'amuser !",
    texture: "img_figaro",
    tete: "img_tete_figaro",
    marche: "img_marche_figaro",           // spritesheet quand il marche (6 images)
    tailleMarche: [47, 74],              // largeur et hauteur d'une image
    animMarche: "anim_marche_figaro",
    echelle: 1.1,
    fin: {
      texture: "img_fin_figaro",
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
    cle: "maestro",
    nom: "Don Giovanni",
    titre: "Le Maestro mystérieux",
    description:
      "Ce noble arrogant et grand charmeur passe son temps à tromper son monde, jusqu'au jour où ses mauvaises " +
      "actions finissent par être punies. Malgré son histoire tragique, cet aventurier très fier et toujours " +
      "élégant n'a absolument peur de rien. Très sûr de lui, il entre dans la partie comme un vrai défi, prêt à " +
      "prouver à tout le monde qu'il est le meilleur !",
    texture: "img_maestro",
    tete: "img_tete_maestro",
    marche: "img_marche_maestro",           // spritesheet quand il marche (6 images)
    tailleMarche: [45, 66],              // largeur et hauteur d'une image
    animMarche: "anim_marche_maestro",
    echelle: 1.1,
    fin: {
      texture: "img_fin_maestro",
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
  var persos = [trouverPerso(registry.get("perso1")), trouverPerso(registry.get("perso2"))];  var joueurs = [{ ...persos[0], etiquette: "J1" }];
  if (duo) joueurs.push({ ...persos[1], etiquette: "J2" });
  return joueurs;
}