/***********************************************************************/
/** BIOMES : le décor change tous les NIVEAUX_PAR_BIOME niveaux, et la salle safe ferme chaque biome
/** le biome ne dépend que du numéro du niveau : on retrouve le même en remontant, sans rien sauvegarder
/***********************************************************************/

export const NIVEAUX_PAR_BIOME = 5; // niveaux 1 à 5 : premier biome (le 5 est la salle safe), 6 à 10 : le suivant...

// tileset : clé Phaser des murs (cf. selection.js) ; cristal et anim_cristal : sprite et animation des cristaux
// lumiere : couleur de la lueur des cristaux (la teinte moyenne de leurs pixels colorés)
// les tuiles de mur ont les mêmes numéros dans tous les tilesets (cf. TUILES dans generation.js) ; le sol reste celui du biome gris
export const BIOMES = [
  { nom: "gris", tileset: "tiles_gris", cristal: "sprite_cristal", anim_cristal: "anim_cristal", lumiere: 0xffc060 },
  { nom: "bleu", tileset: "tiles_bleu", cristal: "sprite_cristal_bleu", anim_cristal: "anim_cristal_bleu", lumiere: 0x619add },
  { nom: "vert", tileset: "tiles_vert", cristal: "sprite_cristal_vert", anim_cristal: "anim_cristal_vert", lumiere: 0x6ec76c },
  { nom: "violet", tileset: "tiles_violet", cristal: "sprite_cristal_violet", anim_cristal: "anim_cristal_violet", lumiere: 0xa878c8 }
];

// les cailloux : quatre images par biome, dans assets/map (les deux dernières sont les cailloux lunaires à cristaux)
// le biome gris n'a pas de suffixe ("caillou.png"), les autres finissent par leur nom ("caillou_bleu.png")
const FICHIERS_CAILLOUX = ["caillou", "caillou2", "caillou_lune", "caillou_lune2"];

// clé Phaser et fichier de chaque caillou d'un biome : { cle, fichier }
export function cailloux(biome) {
  const suffixe = biome.nom === "gris" ? "" : "_" + biome.nom;
  return FICHIERS_CAILLOUX.map((nom, i) => ({ cle: "img_caillou_" + biome.nom + "_" + (i + 1), fichier: "./assets/map/" + nom + suffixe + ".png" }));
}

// le biome d'un niveau : on les enchaine dans l'ordre, puis on recommence
export function biomeDuNiveau(niveau) {
  const rang = Math.floor((Math.max(niveau, 1) - 1) / NIVEAUX_PAR_BIOME);
  return BIOMES[rang % BIOMES.length];
}

// la salle safe est le dernier niveau de chaque biome (5, 10, 15...)
export function estNiveauSafe(niveau) {
  return niveau > 0 && niveau % NIVEAUX_PAR_BIOME === 0;
}
