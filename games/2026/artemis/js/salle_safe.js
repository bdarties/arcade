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
export const STATUE = { rect: [617, 258, 76, 94], centre_x: 655, tete_y: 199 };

// objets de décor solides, en pixels de la map : [x, y, largeur, hauteur]
// (les tuiles du calque "assets" ne sont pas solides : on pose ici des rectangles invisibles sous la statue, les vases, etc.)
// la statue descend jusqu'au mur : on ne peut pas passer derrière
const OBSTACLES = [
  STATUE.rect, // statue
  [497, 164, 30, 22], // vase gauche
  [785, 164, 30, 22], // vase droit
  [964, 158, 24, 34], // colonne en haut à droite
  [323, 544, 26, 32], // colonne en bas à gauche
  [292, 176, 60, 30], // gravats en haut à gauche
  [292, 496, 60, 30], // gravats en bas à gauche
  [960, 272, 60, 30], // gravats à droite, au milieu
  [970, 548, 60, 48] // gravats en bas à droite
];

// construit la map Tiled : renvoie { map, calque_sol, calque_murs } comme pour un niveau généré
export function creerCarte(scene) {
  const map = scene.make.tilemap({ key: CLE_MAP });
  const tilesets = TILESETS.map(([nom, cle]) => map.addTilesetImage(nom, cle));
  const calques = {};
  ["background", "sol", "murs", "assets"].forEach((nom) => { calques[nom] = map.createLayer(nom, tilesets); });
  calques.murs.setCollisionByExclusion([-1]); // toutes les tuiles du calque "murs" sont solides
  return { map: map, calque_sol: calques.sol, calque_murs: calques.murs };
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
