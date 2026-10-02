// * Toutes les valeurs partagées du jeu sont ici : noms de scènes, clés d'assets, vitesses, tailles, couleurs.
// * Aucune valeur « magique » ailleurs dans le code (voir docs/conventions.md).

// Résolution imposée par la borne d'arcade (16:9)
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Noms des scènes
export const SCENES = {
  PRELOAD: 'PreloadScene',
  MENU: 'MenuScene',
  HUB: 'HubScene',
  WORLD_1: 'World1Scene',
  UI: 'UIScene',
};

// * Le monde normal (le jardin), tel qu'il est nommé dans la table WORLDS ci-dessous.
// C'est là que les miroirs utilisés disparaissent.
export const NORMAL_WORLD = 'hub';

// * Table des mondes : le nom d'un miroir dans Tiled -> la scène qu'il ouvre.
// Pour ajouter un monde : créer sa scène, puis ajouter une ligne ici.
export const WORLDS = {
  hub: SCENES.HUB,
  world_1: SCENES.WORLD_1,
};

// * La couleur d'origine de l'eau principale dans les images (elle sert de référence aux palettes ci-dessous)
const WATER_ORIGINAL_COLOR = '#6bc2bd';

// ! DÉSACTIVÉ pour l'instant : les palettes (et WORLD_PALETTES ci-dessous) ne sont plus appelées, les mondes utilisent les TEINTES
// (TINTS plus bas). La logique est gardée (palette.js, PaletteSystem.js) pour une vraie recoloration plus tard.
// * PALETTES DE COULEURS : une par ambiance. Le détail des réglages est expliqué dans src/utils/palette.js.
// Chaque famille de couleurs (grass = herbe, stone = pierre, water = eau) se règle de l'une de ces façons :
//   { hue, saturation, lightness }  teinte en degrés (28 = orange, 285 = violet), saturation en multiplicateur
//                                   (1 = inchangé), luminosité en décalage (0 = inchangé)
//   { color, reference }            « la couleur d'origine reference devient color », les nuances suivent
// Une famille absente d'une palette garde ses couleurs. Le joueur, le miroir et l'interface ne sont jamais recolorés.
export const PALETTES = {
  // Automne : herbe orange, pierre chaude, eau « thé ambré » (plus foncée que l'herbe pour rester lisible)
  autumn: {
    grass: { hue: 28, saturation: 1.05, lightness: -0.02 },
    stone: { hue: 32, saturation: 1.6, lightness: -0.04 },
    water: { color: '#a8703f', reference: WATER_ORIGINAL_COLOR },
  },
  // Magie : herbe violette, pierre rose, eau « rose bonbon »
  // ? Risque : l'eau rose et la pierre rose peuvent se confondre là où elles se touchent
  magic: {
    grass: { hue: 285, saturation: 0.95, lightness: 0 },
    stone: { hue: 320, saturation: 1.4, lightness: 0 },
    water: { color: '#ff86c4', reference: WATER_ORIGINAL_COLOR },
  },
};

// * Quelle palette pour quel monde (le nom du monde est celui de la table WORLDS).
// Un monde absent de cette table garde ses couleurs d'origine : c'est le cas du jardin (le monde normal).
// ! TEST : monde_1 est censé devenir la nuit (monde 1 du GDD). Il porte la palette « magic » le temps de
// développer la recoloration, parce que c'est la seule carte qui existe en plus du jardin.
// TODO(équipe): remplacer par la vraie palette de chaque monde quand les mondes seront créés
export const WORLD_PALETTES = {
  world_1: 'magic',
};

// * LES TEINTES : la version simple des couleurs de monde, sans toucher aux images.
// Une teinte MULTIPLIE les couleurs de la tuile : elle assombrit et nuance, mais ne change pas vraiment de couleur
// (une herbe verte teintée en violet devient un brun sombre). La nuit marche très bien, l'automne et la magie sont ternes.
// ? Pour de vraies couleurs : repartir d'un tileset gris, ou réactiver les palettes ci-dessus.

// * Les groupes de tuiles de tileset_garden qui reçoivent une teinte, par famille : des plages [premier, dernier]
// de numéros de tuile (ceux de Tiled, la première tuile est la 1). Les autres tuiles ne sont jamais teintées :
// le noir (11), le tileset de décors (tileset_deco, à partir de 33) et les cases vides.
// ? Trouvés en analysant les couleurs de chaque tuile. À revoir si les tuiles de tileset_garden changent de place.
export const TILE_GROUPS = {
  stone: [[1, 3], [9, 9], [17, 18]],
  grass: [[4, 8], [10, 10], [12, 14], [20, 22]], // 7 et 8 : les plantes, teintées comme l'herbe
  water: [[25, 27]],
};

// * Une teinte par famille, en hexadécimal (0xffffff = aucune teinte). L'eau animée prend la teinte « water ».
export const TINTS = {
  night: { grass: 0x5560a0, stone: 0x6070a8, water: 0x4060b0 },
  autumn: { grass: 0xd89a50, stone: 0xe0b080, water: 0xc09050 },
  magic: { grass: 0xc060e0, stone: 0xe080c0, water: 0xff90d0 },
};

// * Quelle teinte pour quel monde (le nom du monde est celui de la table WORLDS).
// Un monde absent de cette table garde ses couleurs d'origine : c'est le cas du jardin (le monde normal).
// TODO(équipe): définir la teinte de chaque monde quand les mondes seront créés (monde 1 = la nuit)
export const WORLD_TINTS = {
  world_1: 'magic', // ! TEST : remettre 'night' (le monde 1 est la nuit)
};

// * Clés des assets : le nom sous lequel Phaser retrouve un fichier chargé
export const ASSETS = {
  PLAYER_1: 'player_1',
  HUB_MAP: 'hub_map',
  WORLD_1_MAP: 'world_1_map',
  TILESET_GARDEN: 'tileset_garden', // la construction : sol, murs, eau
  TILESET_DECO: 'tileset_deco', // les décors
  WATER: 'water',
  MIRROR: 'mirror',
};

// * Les cartes de chaque monde : la clé Phaser et le fichier JSON exporté de Tiled. Le nom du monde est celui de WORLDS.
// Elles sont listées ici pour que le jeu connaisse TOUTES les cartes dès le démarrage (par exemple pour compter les étoiles).
// ! Un monde ajouté dans WORLDS doit aussi l'être ici, et inversement.
export const WORLD_MAPS = {
  hub: { key: ASSETS.HUB_MAP, path: 'assets/maps/hub_test.json' },
  world_1: { key: ASSETS.WORLD_1_MAP, path: 'assets/maps/monde_1.json' },
};

// * Les deux façons de jouer : « arcade » (joystick et boutons de la borne) ou « pc » (clavier).
// Les touches de chaque mode sont dans InputManager.js. Le mode de départ est arcade : sur la borne,
// il n'y a pas de clavier pour changer de mode.
export const CONTROL_MODES = {
  ARCADE: 'arcade',
  PC: 'pc',
};
export const DEFAULT_CONTROL_MODE = CONTROL_MODES.ARCADE;

// * Le raccourci de test qui change de mode : Ctrl (ou Cmd sur Mac) + cette touche.
// CODE est la position physique de la touche (« KeyC »), donc la même en AZERTY et en QWERTY.
// ! À ne pas faire sur la borne : il n'y a pas de clavier, le mode arcade doit rester celui de départ.
export const CONTROL_MODE_SHORTCUT = { CODE: 'KeyC' };

// Taille d'une tuile, en pixels (la même dans Tiled et dans les spritesheets de tuiles animées)
export const TILE_SIZE = 32;

// * VITESSE DES ANIMATIONS DE TUILES, en images par seconde : c'est ICI qu'on la règle.
// Plus la valeur est petite, plus l'eau est lente et douce (4 = une image toutes les 0,25 s).
// Elle s'applique à toutes les animations ci-dessous. Pour une seule animation, remplacer
// sa ligne par un nombre (ex. frameRate: 2).
export const TILE_ANIMATION_FRAME_RATE = 4;

// * Animations des tuiles animées, toutes tirées du spritesheet de l'eau (water_spritesheet.png).
// start et end sont des numéros d'images, comptés ligne par ligne depuis 0 (8 images par ligne).
// L'image 0 (état neutre) et les images vierges (7 et 17) ne sont jamais utilisées.
export const TILE_ANIMATIONS = [
  { key: 'water_1', sheet: ASSETS.WATER, start: 1, end: 6, frameRate: TILE_ANIMATION_FRAME_RATE },
  { key: 'water_2', sheet: ASSETS.WATER, start: 8, end: 16, frameRate: TILE_ANIMATION_FRAME_RATE },
  { key: 'water_3', sheet: ASSETS.WATER, start: 18, end: 26, frameRate: TILE_ANIMATION_FRAME_RATE },
];

// * Est-ce que le joueur est bloqué par les tuiles du calque animated_tiles (l'eau) ?
// true : il ne peut pas marcher dessus. false : il passe par-dessus.
export const ANIMATED_TILES_BLOCK_PLAYER = true;

// * Tuiles « repères » du tileset (posées dans le calque animated_tiles de Tiled) -> animation qui les remplace.
// 26 = bord (flèche vers le haut), 27 = angle (haut droite). La 25 (eau fixe) n'est pas ici : elle reste telle quelle.
// L'orientation de chaque tuile (rotation, miroir) est reprise par son sprite : les animations de base sont orientées vers le haut.
// Chaque tuile a une LISTE d'animations possibles : s'il y en a plusieurs, l'une est choisie selon la position de la tuile.
export const ANIMATED_TILES = {
  26: ['water_1', 'water_2'],
  27: ['water_3'],
};

// Joueur
export const PLAYER = {
  SPEED: 300, // pixels par seconde
  FRAME_SIZE: 32, // taille d'une image du spritesheet, en pixels
  // * Numéro de l'image du spritesheet pour chaque direction
  FRAMES: { UP: 0, RIGHT: 1, LEFT: 2, DOWN: 3 },
  // * Boîte de collision : plus petite que l'image, placée au niveau des pieds
  // ? À ajuster à l'oeil (activer debug dans config.js)
  HITBOX: { WIDTH: 20, HEIGHT: 16, OFFSET_X: 6, OFFSET_Y: 16 },
};

// Distance (en pixels) à laquelle le joueur peut interagir avec un miroir
export const INTERACT_DISTANCE = 64;

// * Où apparaît le joueur quand il arrive par un miroir : à droite du miroir, en pixels.
// X est mesuré depuis le bord droit du miroir, Y depuis son milieu.
// ? Valeurs à ajuster : 32 px = une tuile. À changer si un miroir est contre un mur à sa droite.
// ? Le placement des miroirs n'est pas encore officiel : les cartes actuelles sont des cartes de test.
export const MIRROR_SPAWN_OFFSET = { X: 32, Y: 0 };

// * Animation de disparition du miroir, jouée UNE SEULE fois (mirror_spritesheet.png : 17 images de 32 x 32
// sur une ligne). L'image 0 est le miroir entier (c'est aussi son aspect fixe), l'image 16 est vide.
// ? La vitesse (FRAME_RATE, en images par seconde) est à régler à l'oeil : 12 donne environ 1,4 seconde.
export const MIRROR_VANISH = { KEY: 'mirror_vanish', FIRST_FRAME: 0, LAST_FRAME: 16, FRAME_RATE: 12 };

// Durée d'affichage d'un message d'interaction, en millisecondes
export const MESSAGE_DURATION_MS = 2000;

// * Ordre d'affichage : plus la valeur est grande, plus l'élément est devant
export const DEPTH = {
  ABOVE_PLAYER: 10, // calque decor_above
  UI: 20,
};

// Couleurs
export const COLORS = {
  BACKGROUND: '#2f6b3a',
  TEXT: '#f4f1e8',
  VICTORY_BACKGROUND: '#000000cc', // fond noir semi-transparent derrière le message de fin
};

// Textes
export const VICTORY_MESSAGE = 'Toutes les étoiles sont récupérées';
export const FONT_FAMILY = 'Georgia, serif';
export const FONT_SIZE = {
  TITLE: '96px',
  HINT: '28px',
  TIMER: '36px',
  STARS: '28px',
  VICTORY: '48px',
  CONTROL_MODE: '20px',
};

// * Modes de jeu : chacun a son propre meilleur temps
export const GAME_MODES = {
  SOLO: 'solo',
  MULTI: 'multi',
};

// * Noms sous lesquels les données sont rangées dans le navigateur (localStorage)
export const STORAGE_KEYS = {
  BEST_TIME_PREFIX: 'glass_garden_best_time_', // suivi du mode : « ..._solo », « ..._multi »
};

// * Les quatre directions du jeu (vue du dessus) : le vecteur (x, y) de chacune et l'angle d'un sprite dessiné vers la DROITE
// qu'on veut orienter dans cette direction (en radians : un quart de tour = Math.PI / 2).
export const DIRECTION_VECTORS = {
  right: { x: 1, y: 0, angle: 0 },
  down: { x: 0, y: 1, angle: Math.PI / 2 },
  left: { x: -1, y: 0, angle: Math.PI },
  up: { x: 0, y: -1, angle: -Math.PI / 2 },
};

// * Les balles. balle.png est une bande de 33 images de 16 x 16 pixels (528 x 16), pas une image seule :
// images 0 à 5 = le projectile en vol (dessiné vers la droite), 6 à 15 = l'impact (explosion),
// 16 à 32 = un rayon qui grandit puis s'efface (inutilisé pour l'instant). Les numéros sont dans FLY_ANIM et HIT_ANIM.
export const BULLET = {
  KEY: 'bullet',
  FRAME_SIZE: 16,
  FIRST_FRAME: 0, // l'image du projectile en vol
  SPEED: 600, // pixels par seconde
  START_OFFSET: 24, // distance entre le centre du joueur et l'endroit où la balle apparaît, en pixels
  LIFETIME_MS: 1200, // au bout de ce temps, la balle explose toute seule (sinon elle volerait indéfiniment)
  FLY_ANIM: { KEY: 'bullet_fly', FIRST_FRAME: 0, LAST_FRAME: 5, FRAME_RATE: 18 }, // en boucle
  HIT_ANIM: { KEY: 'bullet_hit', FIRST_FRAME: 6, LAST_FRAME: 15, FRAME_RATE: 24 }, // une seule fois, puis la balle disparaît
};
// Marge (en pixels) entre les éléments d'interface et le bord de l'écran
export const UI_MARGIN = 24;
