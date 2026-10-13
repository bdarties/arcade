/***********************************************************************/
/** BIOMES : le décor change tous les NIVEAUX_PAR_BIOME niveaux, et la salle safe ferme chaque biome
/** le biome ne dépend que du numéro du niveau : on retrouve le même en remontant, sans rien sauvegarder
/***********************************************************************/

export const NIVEAUX_PAR_BIOME = 5; // niveaux 1 à 5 : premier biome (le 5 est la salle safe), 6 à 10 : le suivant...

// tileset : clé Phaser des murs (cf. selection.js) ; cristal et anim_cristal : sprite et animation des cristaux
// les tuiles de mur ont les mêmes numéros dans tous les tilesets (cf. TUILES dans generation.js) ; le sol reste celui du biome gris
export const BIOMES = [
  { nom: "gris", tileset: "tiles_walls_floor", cristal: "sprite_cristal", anim_cristal: "anim_cristal" },
  { nom: "bleu", tileset: "tiles_bleu", cristal: "sprite_cristal_bleu", anim_cristal: "anim_cristal_bleu" },
  { nom: "vert", tileset: "tiles_vert", cristal: "sprite_cristal_vert", anim_cristal: "anim_cristal_vert" },
  { nom: "violet", tileset: "tiles_violet", cristal: "sprite_cristal_violet", anim_cristal: "anim_cristal_violet" }
];

// le biome d'un niveau : on les enchaine dans l'ordre, puis on recommence
export function biomeDuNiveau(niveau) {
  const rang = Math.floor((Math.max(niveau, 1) - 1) / NIVEAUX_PAR_BIOME);
  return BIOMES[rang % BIOMES.length];
}

// la salle safe est le dernier niveau de chaque biome (5, 10, 15...)
export function estNiveauSafe(niveau) {
  return niveau > 0 && niveau % NIVEAUX_PAR_BIOME === 0;
}
