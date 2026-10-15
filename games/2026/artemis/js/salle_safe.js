/***********************************************************************/
/** SALLE SAFE : une salle de temple (map faite sous Tiled) qui ferme chaque biome (niveaux 5, 10, 15...)
/** toujours éclairée, sans ennemi ni caillou ; on y entre par l'échelle de montée et on en repart par le trou
/***********************************************************************/

export const CLE_MAP = "map_safe";
export const FICHIER_MAP = "./assets/map/safe_map_test.tmj";

// tilesets de la map : [nom dans Tiled, clé Phaser de l'image, fichier] ; la map n'en utilise plus qu'un, qui regroupe tout
export const TILESETS = [
  ["safe_map_tilest", "tiles_safe", "./assets/map/safe_map_tilest.png"]
];

// la salle safe a sa place fixe, à la fin de chaque biome (cf. biomes.js) ;
// en ouvrant le jeu avec "?safe" dans l'adresse elle apparait en plus à chaque niveau (pour la tester)
export const safeForcee = () => new URLSearchParams(window.location.search).has("safe");

// positions des deux passages, en pixels (cases de 32 px) : l'échelle pour remonter à gauche, le trou pour descendre à droite
export const MONTEE = { x: 12 * 32 + 16, y: 12 * 32 + 16 };
export const TROU = { x: 30 * 32 + 16, y: 12 * 32 + 16 };

// la statue (cf. offrande.js) : rectangle solide [x, y, largeur, hauteur] ; sa tête dépasse en haut, vers y = 199
export const STATUE = { rect: [617, 258, 76, 94], centre_x: 655, tete_y: 199 }; // rect : le socle et le corps ; au-dessus, on passe derrière la statue

// objets de décor : leurs tuiles dans la map et leur zone solide
// tuiles : [colonne, ligne, largeur, hauteur] en tuiles, coin haut gauche ; sauf : tuiles de cette boîte qui appartiennent à un autre décor
// rect : zone solide en pixels de la map [x, y, largeur, hauteur] (les tuiles du calque "assets" ne sont pas solides : on pose des rectangles invisibles)
const DECORS = [
  { tuiles: [19, 6, 3, 5], rect: STATUE.rect }, // statue
  { tuiles: [15, 4, 2, 2], rect: [497, 164, 30, 22] }, // vase gauche
  { tuiles: [24, 4, 2, 2], rect: [785, 164, 30, 22] }, // vase droit
  { tuiles: [30, 4, 1, 2], rect: [964, 158, 24, 34] }, // colonne en haut à droite
  { tuiles: [10, 16, 1, 2], rect: [323, 544, 26, 32] }, // colonne en bas à gauche
  { tuiles: [8, 4, 4, 3], rect: [292, 176, 60, 30] }, // gravats en haut à gauche
  { tuiles: [8, 14, 4, 3], sauf: [[10, 16]], rect: [292, 496, 60, 30] }, // gravats en bas à gauche
  { tuiles: [29, 7, 4, 3], rect: [960, 272, 60, 30] }, // gravats à droite, au milieu
  { tuiles: [29, 16, 4, 3], rect: [970, 548, 60, 48] } // gravats en bas à droite
];
const OBSTACLES = DECORS.map((decor) => decor.rect);

// construit la map Tiled : renvoie { map, calque_sol, calque_murs } comme pour un niveau généré
export function creerCarte(scene) {
  const map = scene.make.tilemap({ key: CLE_MAP });
  const tilesets = TILESETS.map(([nom, cle]) => map.addTilesetImage(nom, cle));
  const calques = {};
  ["background", "sol", "murs", "assets"].forEach((nom) => { calques[nom] = map.createLayer(nom, tilesets); });
  calques.murs.setCollisionByExclusion([-1]); // toutes les tuiles du calque "murs" sont solides
  DECORS.forEach((decor) => extraireDecor(scene, calques.assets, decor));
  return { map: map, calque_sol: calques.sol, calque_murs: calques.murs };
}

// les tuiles d'un calque sont toujours dessinées sous les joueurs : chaque décor en sort pour devenir une image, triée comme un joueur
// profondeur = bas de la zone solide moins 16 px : un joueur est trié sur le centre de son sprite et ses pieds sont plus bas,
// donc devant le décor il est dessiné par-dessus, et derrière (plus haut dans la map) il passe dessous
function extraireDecor(scene, calque, decor) {
  const [colonne, ligne, largeur, hauteur] = decor.tuiles;
  const cle = TILESETS[0][1];
  const texture = scene.textures.get(cle);
  const tileset = scene.cache.tilemap.get(CLE_MAP).data.tilesets[0];
  const image = scene.add.renderTexture(colonne * 32, ligne * 32, largeur * 32, hauteur * 32).setOrigin(0, 0).setDepth(decor.rect[1] + decor.rect[3] - 16);
  const pinceau = scene.make.image({ key: cle }, false).setOrigin(0, 0); // jamais affiché : sert à recopier chaque tuile dans l'image
  for (let i = 0; i < largeur; i++) {
    for (let j = 0; j < hauteur; j++) {
      const x = colonne + i;
      const y = ligne + j;
      const tuile = calque.getTileAt(x, y);
      if (!tuile || (decor.sauf ?? []).some(([c, l]) => c === x && l === y)) continue;
      const numero = tuile.index - tileset.firstgid; // place de la tuile dans l'image du tileset
      const nom = "decor_" + numero;
      if (!texture.has(nom)) texture.add(nom, 0, (numero % tileset.columns) * 32, Math.floor(numero / tileset.columns) * 32, 32, 32);
      image.draw(pinceau.setFrame(nom).setFlipX(tuile.flipX), i * 32, j * 32);
      calque.removeTileAt(x, y);
    }
  }
  pinceau.destroy();
  image.texture.setFilter(Phaser.Textures.FilterMode.NEAREST); // pas de flou : les pixels du décor restent nets, comme les tuiles
}

// rectangles invisibles des objets solides (un groupe statique : joueurs et lasers s'y arrêtent)
export function creerObstacles(scene) {
  const groupe = scene.physics.add.staticGroup();
  OBSTACLES.forEach(([x, y, largeur, hauteur]) => {
    const zone = scene.add.zone(x + largeur / 2, y + hauteur / 2, largeur, hauteur);
    groupe.add(zone); // le corps statique prend la taille de la zone
  });
  return groupe;
}
