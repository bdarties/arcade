// * Toutes les valeurs partagées du jeu sont ici : noms de scènes, clés d'assets, vitesses, tailles, couleurs.
// * Aucune valeur « magique » ailleurs dans le code (voir docs/conventions.md).

// Résolution imposée par la borne d'arcade (16:9)
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Noms des scènes
export const SCENES = {
  PRELOAD: 'PreloadScene',
  MENU: 'MenuScene',
  MODE: 'ModeScene',
  CONTROLS: 'ControlsScene',
  CREDITS: 'CreditsScene',
  HUB: 'HubScene',
  WORLD_1: 'World1Scene',
  WORLD_2: 'World2Scene',
  WORLD_3: 'World3Scene',
  WORLD_4: 'World4Scene',
  WORLD_5: 'World5Scene',
  UI: 'UIScene',
};

// * Les images des écrans d'interface (accueil, choix du mode, victoire) : une image plein écran chacune
export const UI_IMAGES = {
  HOME: { KEY: 'ui_accueil', PATH: 'assets/images/ui/accueil.png' },
  MODE_SOLO: { KEY: 'ui_mode_solo', PATH: 'assets/images/ui/mode_solo.png' }, // choix du mode, la carte Solo surlignée
  MODE_MULTI: { KEY: 'ui_mode_multi', PATH: 'assets/images/ui/mode_multi.png' }, // la carte Multi surlignée
  BUTTON: { KEY: 'ui_bouton', PATH: 'assets/images/ui/bouton.png' }, // le bouton vert du menu (42 x 12 px, rogné au contenu)
  // Le joystick de la page Commandes, en deux morceaux de 24 x 24 px pour que le manche puisse s'incliner sur son socle :
  // le socle (fixe) et le manche avec sa boule (violet pour le joueur 1, bleu pour le joueur 2)
  JOYSTICK_BASE: { KEY: 'ui_joystick_socle', PATH: 'assets/images/ui/joystick_base.png' },
  JOYSTICK_STICK_1: { KEY: 'ui_joystick_manche_1', PATH: 'assets/images/ui/joystick_baton_1.png' },
  JOYSTICK_STICK_2: { KEY: 'ui_joystick_manche_2', PATH: 'assets/images/ui/joystick_baton_2.png' },
  // Les boutons d'arcade de la page Commandes (20 x 20 px, une couleur par action)
  ARCADE_GREEN: { KEY: 'ui_arcade_vert', PATH: 'assets/images/ui/bouton_arcade_vert.png' },
  ARCADE_RED: { KEY: 'ui_arcade_rouge', PATH: 'assets/images/ui/bouton_arcade_rouge.png' },
  ARCADE_YELLOW: { KEY: 'ui_arcade_jaune', PATH: 'assets/images/ui/bouton_arcade_jaune.png' },
  WIN: { KEY: 'ui_victoire', PATH: 'assets/images/ui/victoire.png' }, // l'écran de victoire (« You win! »)
};

// * Le monde normal (le jardin), tel qu'il est nommé dans la table WORLDS ci-dessous.
// C'est là que les miroirs utilisés disparaissent.
export const NORMAL_WORLD = 'hub';

// * Table des mondes : le nom d'un miroir dans Tiled -> la scène qu'il ouvre.
// Pour ajouter un monde : créer sa scène, puis ajouter une ligne ici.
export const WORLDS = {
  hub: SCENES.HUB,
  world_1: SCENES.WORLD_1,
  world_2: SCENES.WORLD_2,
  world_3: SCENES.WORLD_3,
  world_4: SCENES.WORLD_4,
  world_5: SCENES.WORLD_5,
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
// ! EN RÉSERVE : ces palettes ne sont plus appelées. Les mondes ont leurs propres images recolorées (voir WORLD_ART plus bas).
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
// Vide exprès : les mondes ont leurs images recolorées (WORLD_ART), une teinte en plus multiplierait deux fois les couleurs.
export const WORLD_TINTS = {
};

// * Images recolorées d'un monde (déjà fabriquées, le script n'est plus dans le dépôt) : le tileset de construction et l'eau animée
// remplacent les originaux dans ce monde. Un monde absent de cette table garde les images d'origine.
// Pas de teinte (WORLD_TINTS) en plus : elle multiplierait une seconde fois les couleurs.
export const WORLD_ART = {
  world_1: {
    suffix: '@nuit',
    tileset: 'assets/images/tilesets/tileset_garden_nuit.png',
    water: 'assets/images/sprites/water_spritesheet_nuit.png',
  },
  world_2: {
    suffix: '@reve', // ajouté aux clés des textures et des animations de ce monde
    tileset: 'assets/images/tilesets/tileset_garden_reve.png',
    water: 'assets/images/sprites/water_spritesheet_reve.png',
  },
  world_3: {
    suffix: '@automne',
    tileset: 'assets/images/tilesets/tileset_garden_automne.png',
    water: 'assets/images/sprites/water_spritesheet_automne.png',
  },
  world_4: {
    suffix: '@apocalypse',
    tileset: 'assets/images/tilesets/tileset_garden_apocalypse.png',
    water: 'assets/images/sprites/water_spritesheet_apocalypse.png',
  },
  world_5: {
    suffix: '@magie',
    tileset: 'assets/images/tilesets/tileset_garden_magie.png',
    water: 'assets/images/sprites/water_spritesheet_magie.png',
  },
};

// * Clés des assets : le nom sous lequel Phaser retrouve un fichier chargé
export const ASSETS = {
  PLAYER_1: 'player_1',
  HUB_MAP: 'hub_map',
  WORLD_1_MAP: 'world_1_map',
  WORLD_2_MAP: 'world_2_map',
  WORLD_3_MAP: 'world_3_map',
  WORLD_4_MAP: 'world_4_map',
  WORLD_5_MAP: 'world_5_map',
  TILESET_GARDEN: 'tileset_garden', // la construction : sol, murs, eau
  TILESET_DECO: 'tileset_deco', // les décors
  WATER: 'water',
  MIRROR: 'mirror',
  NPC_ENIGME: 'pnj_enigme', // le personnage de l'énigme (voir NPCS)
  BUBBLE: 'bulle', // les bulles du monde magique (voir BUBBLES)
  ENEMY_FAUCHEUR: 'ennemi_faucheur', // les ennemis du monde du rêve (voir ENEMIES)
  ENEMY_CAPUCHE: 'ennemi_capuche',
};

// * Les cartes de chaque monde : la clé Phaser et le fichier JSON exporté de Tiled. Le nom du monde est celui de WORLDS.
// Elles sont listées ici pour que le jeu connaisse TOUTES les cartes dès le démarrage (par exemple pour compter les étoiles).
// ! Un monde ajouté dans WORLDS doit aussi l'être ici, et inversement.
export const WORLD_MAPS = {
  hub: { key: ASSETS.HUB_MAP, path: 'assets/maps/hub_test.json' },
  world_1: { key: ASSETS.WORLD_1_MAP, path: 'assets/maps/monde_1.json' },
  world_2: { key: ASSETS.WORLD_2_MAP, path: 'assets/maps/monde_2.json' },
  world_3: { key: ASSETS.WORLD_3_MAP, path: 'assets/maps/monde_3.json' },
  world_4: { key: ASSETS.WORLD_4_MAP, path: 'assets/maps/monde_4.json' },
  world_5: { key: ASSETS.WORLD_5_MAP, path: 'assets/maps/monde_5.json' },
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

// * Le dash (voir DashSystem.js) : une courte accélération dans la direction du déplacement, qui ralentit jusqu'à
// s'arrêter, avec une pause entre deux dash.
export const DASH = {
  DISTANCE: 135, // la distance parcourue, en pixels (toujours la même, quelle que soit la courbe de vitesse)
  DURATION_MS: 220, // durée du dash
  EASE_POWER: 1.5, // la forme du ralentissement : 0 = vitesse constante ; plus c'est grand, plus il part fort puis freine tôt
  COOLDOWN_MS: 500, // pause avant de pouvoir recommencer, comptée à partir de la fin du dash
  STRETCH: { ALONG: 1.4, ACROSS: 0.75 }, // l'étirement du personnage au départ du dash : plus long dans le sens du mouvement, plus fin en travers (1 = normal)
  // * La poussière soulevée au départ et à l'arrivée du dash : de petits carrés beiges qui s'éparpillent et s'estompent
  DUST: {
    TEXTURE: 'dust_puff', // texture générée par le code
    SIZE: 4, // côté d'un carré, en pixels
    COLOR: 0xe6dcc4,
    COUNT_START: 7, // nombre de nuages au départ, derrière le joueur
    COUNT_END: 5, // nombre de nuages à l'arrivée
    LIFESPAN_MS: 420,
    SPEED: { MIN: 25, MAX: 70 }, // la vitesse d'éjection, en pixels par seconde
    ALPHA: 0.75,
    SCALE: { START: 1, END: 2.4 },
    FEET_OFFSET: 13, // la poussière part des pieds : cette distance sous le centre du joueur
  },
  // Les images fantômes laissées derrière le joueur : une par image (INTERVAL_MS = 16 ≈ 60 par seconde), qui reprennent la forme
  // étirée du joueur, passent du blanc-bleuté au bleu au fil du dash, rétrécissent un peu et s'estompent.
  GHOST: { INTERVAL_MS: 16, FADE_MS: 280, ALPHA: 0.55, TINT_START: 0xe0f6ff, TINT_END: 0x4f95ff, SHRINK: 0.88 },
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

// * Les personnages non joueurs (PNJ) : posés dans Tiled par un objet « point » de classe « npc », dont le NOM est la clé de cette table.
// Le point marque l'endroit où le personnage a les pieds (le bas de l'image, centré). La zone de blocage est un petit rectangle aux pieds.
export const NPCS = {
  enigme: {
    key: ASSETS.NPC_ENIGME,
    image: 'assets/images/sprites/pnj_enigme.png',
    hitbox: { WIDTH: 36, HEIGHT: 14 }, // la zone qui bloque le joueur, en pixels
  },
};

// * Ordre d'affichage : plus la valeur est grande, plus l'élément est devant
export const DEPTH = {
  // * Les personnages, caisses, miroirs et ennemis se trient selon leur position : plus un objet est BAS à l'écran (ses pieds),
  // plus il passe devant. Leur profondeur va de SORTED_MIN (haut de la carte) à SORTED_MAX (bas), sous les balles et le décor du dessus.
  SORTED_MIN: 1,
  SORTED_MAX: 8,
  BULLET: 9, // les balles passent devant les personnages (derrière le décor du dessus)
  ABOVE_PLAYER: 10, // calque decor_above
  UI: 20,
  VICTORY: 100, // l'écran de victoire : devant toute l'interface
  DIALOGUE: 30, // la boîte de dialogue des personnages (devant l'interface)
  TRANSITION: 100, // le calque noir de la transition entre deux mondes (devant tout)
};

// * Transition entre deux mondes : un « iris », un cercle noir qui se referme sur le miroir pris puis s'ouvre sur le miroir d'arrivée (voir TransitionSystem.js)
export const TRANSITION = {
  IRIS_CLOSE_MS: 600, // durée de la fermeture du cercle
  IRIS_CLOSE_EASE: 'Quad.easeIn', // le cercle accélère en se refermant
  IRIS_OPEN_MS: 600, // durée de l'ouverture du cercle
  IRIS_OPEN_EASE: 'Quad.easeOut', // le cercle ralentit en s'ouvrant
  COLOR: 0x000000,
};

// * Fumée de cheminée : des objets de classe « smoke » posés dans Tiled (point = le haut de la cheminée)
export const SMOKE = {
  TEXTURE: 'smoke_puff', // texture générée par le code (carré de PUFF_SIZE pixels)
  PUFF_SIZE: 4,
  COLOR: 0xc9ced8,
  LIFESPAN_MS: 2600, // durée de vie d'une bouffée
  FREQUENCY_MS: 420, // une bouffée toutes les ... millisecondes
  RISE_SPEED: { MIN: 14, MAX: 24 }, // pixels par seconde vers le haut
  DRIFT_X: { MIN: 2, MAX: 10 }, // dérive vers la droite (vent léger)
  START_ALPHA: 0.7,
  SCALE: { START: 1, END: 2.6 },
};

// Couleurs
export const COLORS = {
  BACKGROUND: '#2f6b3a',
  TEXT: '#f4f1e8',
  VICTORY_BACKGROUND: '#000000cc', // fond noir semi-transparent derrière le message de fin
};

// Textes
export const VICTORY_MESSAGE = 'Toutes les étoiles sont récupérées';

// * Les boutons du menu d'accueil, empilés au centre sous le titre (dans le miroir de l'image). Le bouton est du pixel art :
// on l'agrandit d'un nombre entier de fois pour garder des pixels nets.
export const MENU_BUTTONS = {
  LABELS: ['Jouer', 'Réglages', 'Commandes', 'Crédits'],
  SCALE: 4,
  SELECTED_SCALE: 5, // le bouton choisi : un cran plus grand (entier, pour garder des pixels nets)
  TINT: 0xaaaaaa, // les boutons non choisis sont un peu assombris (le choisi garde sa couleur d'origine, donc plus clair)
  FIRST_Y: 395, // le centre du premier bouton
  SPACING: 58, // la distance entre les centres de deux boutons
  TEXT: { SIZE: '22px', COLOR: '#ffffff', STROKE: '#1f4d1a', STROKE_THICKNESS: 4 },
};

// * La place de chaque bouton dans MENU_BUTTONS.LABELS (pour revenir sur le bon bouton en quittant sa page)
export const MENU_INDEX = { PLAY: 0, SETTINGS: 1, CONTROLS: 2, CREDITS: 3 };

// * Les pages sur un cadre en parchemin (Commandes, Crédits) : l'image d'accueil assombrie, un cadre aux couleurs de la boîte de
// dialogue (DIALOGUE.COLORS), et un titre en haut. Voir ParchmentPage.js.
export const PARCHMENT_PAGE = {
  DIM_ALPHA: 0.55, // l'image d'accueil est assombrie derrière le cadre
  FRAME: { X: 130, Y: 70, WIDTH: 1020, HEIGHT: 580, RADIUS: 26, BORDER: 5 },
  TITLE: { Y: 125, SIZE: '56px' },
  BACK: { Y: 625, SIZE: '26px', TEXT: 'O : retour' }, // l'indication en bas du cadre (O est le bouton de retour de la borne)
};

// * La page « Commandes » : les touches du mode arcade des deux joueurs, sur un cadre en parchemin (voir PARCHMENT_PAGE)
export const CONTROLS_PAGE = {
  COLUMNS_X: [380, 900], // le centre de la colonne du joueur 1 et de celle du joueur 2
  PLAYER_Y: 215, // le nom du joueur
  PLAYER_SIZE: '38px',
  HEADER_SHIFT: 30, // le nom du joueur est décalé vers la droite pour se centrer sur ses lignes (libellé + icône)
  SPRITE: { SCALE: 3, OFFSET_X: -110 }, // le personnage du joueur, à gauche de son nom (32 px x 3 = 96 px)
  FIRST_ROW_Y: 300,
  ROW_SPACING: 90,
  LABEL_GAP: 24, // l'espace entre le libellé (aligné à droite) et le centre de la colonne
  ICON_OFFSET: 64, // le centre de l'icône (joystick ou bouton), à droite du centre de la colonne
  JOYSTICK_SCALE: 3, // 24 px x 3 = 72 px (entier, pour des pixels nets)
  // * Le manche s'incline autour de son pied (un point de l'image de 24 x 24 px), de -ANGLE à +ANGLE degrés, en va-et-vient
  JOYSTICK_TILT: { PIVOT: { X: 11.5, Y: 17.5 }, ANGLE_DEG: 14, DURATION_MS: 650, EASE: 'Sine.easeInOut', PLAYER_2_DELAY_MS: 325 },
  ARCADE_SCALE: 3, // 20 px x 3 = 60 px
  ARCADE_LETTER_SIZE: '30px', // la lettre posée sur le bouton
  // Quel bouton d'arcade pour quelle action (les deux joueurs ont les mêmes couleurs)
  ARCADE_BUTTONS: { interact: 'ARCADE_GREEN', shoot: 'ARCADE_RED', dash: 'ARCADE_YELLOW' },
  ACTION_SIZE: '32px', // « Déplacer »
  KEY_SIZE: '36px', // la touche
  // Les lignes : [libellé, action de BINDINGS]. « move » est le joystick (haut, bas, gauche, droite).
  ROWS: [
    ['Déplacer', 'move'],
    ['Interagir', 'interact'],
    ['Tirer', 'shoot'],
    ['Dash', 'dash'],
  ],
};

// * La page « Crédits » : le cadre du développement et l'équipe. Chaque ligne : le texte, sa hauteur (Y), sa taille, en gras ou non.
export const CREDITS_PAGE = {
  LINES: [
    { TEXT: 'Glass Garden', Y: 215, SIZE: '64px', BOLD: true },
    { TEXT: 'Projet de SAE · BUT MMI · 2026', Y: 295, SIZE: '34px' },
    { TEXT: 'IUT de Béziers', Y: 340, SIZE: '34px' },
    { TEXT: 'Thème « Monde onirique »', Y: 400, SIZE: '30px' },
    { TEXT: "Jeu pour borne d'arcade, réalisé avec Phaser", Y: 444, SIZE: '30px' },
    { TEXT: 'Équipe', Y: 510, SIZE: '36px', BOLD: true },
    { TEXT: 'Lilian · Léa · Hina', Y: 560, SIZE: '42px', BOLD: true },
  ],
};

// * Le chrono final sur l'écran de victoire : centré sous le titre « YOU WIN! » de l'image, en blanc cerclé de bleu nuit (comme le titre)
export const VICTORY_TIME = { Y: 400, COLOR: '#ffffff', STROKE: '#2b2d5b', STROKE_THICKNESS: 8 };

// * Sous le chrono final : le meilleur temps du mode, ou « Nouveau record ! » (en jaune, comme le titre) si on vient de le battre
export const VICTORY_BEST = { Y: 475, RECORD_TEXT: 'Nouveau record !', RECORD_COLOR: '#fff23a', BEST_LABEL: 'Meilleur temps : ' };

// * Le texte qui invite à rejouer, en bas de l'écran de victoire
export const VICTORY_REPLAY = { Y: 600, TEXT: 'Appuie sur Entrée pour rejouer', SIZE: '32px' };
export const FONT_FAMILY = 'Georgia, serif';
export const FONT_SIZE = {
  TITLE: '96px',
  HINT: '28px',
  TIMER: '36px',
  STARS: '28px',
  VICTORY: '48px',
  VICTORY_TIME: '64px', // le chrono final sur l'écran de victoire
  VICTORY_BEST: '40px', // le meilleur temps et « Nouveau record ! » sur l'écran de victoire
  CONTROL_MODE: '20px',
};

// * Boîte de dialogue des personnages (voir DialogueSystem.js) : un cadre en parchemin en bas de l'écran.
// Les textes des personnages sont dans src/data/dialogues.js.
export const DIALOGUE = {
  INTERACT_DISTANCE: 90, // à quelle distance du personnage on peut lui parler, en pixels
  BOX: { WIDTH: 1100, HEIGHT: 170, RIDDLE_HEIGHT: 310, BOTTOM_MARGIN: 40, RADIUS: 26, PADDING: 36, BORDER: 5 }, // RIDDLE_HEIGHT : le cadre agrandi d'une énigme
  MAX_CHOICES: 4, // nombre de réponses d'une énigme (en 2 colonnes)
  FONT_SIZE: '34px',
  TYPE_DELAY_MS: 28, // délai entre deux lettres (effet machine à écrire)
  COLORS: { PAPER: 0xf7e8c2, BORDER: 0xb98a3f, TEXT: '#7a4a12', TAG: 0x7a4a12, TAG_TEXT: '#f7e8c2' },
};

// * Les ennemis (voir EnemySystem.js) : posés dans Tiled par un objet « point » de classe « enemy », dont le NOM est la clé de
// cette table. Le point marque l'endroit où l'ennemi a les pieds (le bas de l'image, centré). Chaque image fait 32 x 32 pixels.
export const ENEMIES = {
  // Le faucheur : 3 images de la feuille (faux à gauche, faux à droite, de dos)
  faucheur: {
    key: ASSETS.ENEMY_FAUCHEUR,
    image: 'assets/images/sprites/ennemi_faucheur.png',
    frameCount: 3,
    frames: { left: 0, right: 1, up: 2, down: 0 }, // l'image à afficher selon la direction regardée
    hitbox: { WIDTH: 18, HEIGHT: 14 }, // la zone de collision aux pieds, en pixels
    hitPoints: 3, // nombre de tirs pour le tuer (modifiable par une propriété « hitPoints » sur l'objet Tiled)
    speed: 220, // la vitesse de poursuite, en pixels par seconde (le joueur va à 300 : on peut toujours fuir)
    sight: 280, // à quelle distance il voit le joueur, en pixels
  },
  // La capuche (un fantôme à tentacules) : une seule image. L'animation en boucle n'a qu'une image, il suffit d'en ajouter pour l'animer
  capuche: {
    key: ASSETS.ENEMY_CAPUCHE,
    image: 'assets/images/sprites/ennemi_capuche.png',
    frameCount: 1,
    idle: { KEY: 'capuche_idle', FRAME_RATE: 5 }, // l'animation en boucle
    hitbox: { WIDTH: 18, HEIGHT: 14 },
    hitPoints: 2, // plus fragile que le faucheur
    speed: 160, // plus lente que le faucheur
    sight: 200, // et elle voit moins loin
  },
};
export const ENEMY_FRAME_SIZE = 32;

// * Le comportement des ennemis (voir EnemySystem.js) : au repos près de leur point, ils fondent sur le joueur dès qu'ils le voient
// (distance < sight ET aucun mur entre eux), le perdent s'il s'éloigne ou se cache, vont voir où ils l'ont vu en dernier, puis rentrent.
export const ENEMY_AI = {
  LOSE_SIGHT_FACTOR: 1.3, // un ennemi lancé à la poursuite ne lâche le joueur que s'il dépasse sight x ce facteur
  SEARCH: { WAIT_MS: 1200, MAX_MS: 3500 }, // il attend sur place au dernier endroit vu, et abandonne au bout de MAX_MS (s'il est coincé)
  ARRIVE_DISTANCE: 8, // à moins de ce nombre de pixels d'un point, il est « arrivé »
  RETURN_SPEED_FACTOR: 0.7, // il rentre plus calmement qu'il ne poursuit
  WANDER: { RADIUS: 40, SPEED_FACTOR: 0.35, PAUSE_MS: { MIN: 1200, MAX: 2800 } }, // au repos : il flâne autour de son point
  LINE_OF_SIGHT_STEP: 12, // on regarde un point tous les 12 pixels entre l'ennemi et le joueur : un mur sur le chemin coupe la vue
  // Quand un tir touche un ennemi : il clignote en blanc, est repoussé et reste étourdi un instant (il ne bouge plus de lui-même).
  HIT: { FLASH_MS: 80, STUN_MS: 250, KNOCKBACK: 200 },
  // Quand il meurt : un petit nuage de fumée sombre (de petits carrés générés par le code)
  DEATH: { KEY: 'enemy_puff', SIZE: 6, COUNT: 14, COLORS: [0x2a2230, 0x4a3a58, 0x6b5a7a], SPEED: { MIN: 30, MAX: 110 }, LIFETIME_MS: { MIN: 350, MAX: 650 }, DEPTH: 15 },
  // Quand un ennemi touche le joueur : il est renvoyé au point de départ du monde, les ennemis vivants reprennent leur place, et il est
  // invincible un court instant (il clignote) pour ne pas être touché aussitôt. Un éclair rouge marque le contact.
  CONTACT: { INVULNERABLE_MS: 1500, BLINK_MS: 100, BLINK_ALPHA: 0.3, FLASH: { DURATION_MS: 180, RED: 255, GREEN: 60, BLUE: 60 } },
  ALERT: { TEXT: '!', COLOR: '#ff4040', SIZE: '30px', RISE: 16, DURATION_MS: 600 }, // le « ! » qui monte quand il repère le joueur
};

// * Les bulles du monde magique (voir BubbleSystem.js) : posées dans Tiled par des objets « point » de classe « bubble »
// (le point est le CENTRE de la bulle). Le joueur les éclate en les touchant ; quand elles sont toutes éclatées,
// l'étoile du monde apparaît. L'image est une bande de 32 x 32 : la bulle entière (image 0), puis son éclatement.
export const BUBBLES = {
  KEY: ASSETS.BUBBLE,
  IMAGE: 'assets/images/sprites/bulle.png',
  FRAME_SIZE: 32,
  BURST: { KEY: 'bubble_burst', FIRST_FRAME: 1, LAST_FRAME: 6, FRAME_RATE: 16 }, // l'animation d'éclatement
  // La bulle flotte et dérive doucement autour de son point : un balancement horizontal et un vertical de rythmes différents
  // (ça trace une petite boucle irrégulière). Amplitudes en pixels, vitesses en radians par seconde (6,28 = un tour par seconde).
  FLOAT: { AMPLITUDE_X: 10, AMPLITUDE_Y: 6, SPEED_X: 1.3, SPEED_Y: 2.1 },
  HITBOX_RADIUS: 12, // la zone qui éclate la bulle au contact du joueur
  // * Les tailles de bulle (propriété Tiled « size » : large, medium ou small, par défaut small). L'échelle agrandit l'image ET la zone de contact.
  SIZES: {
    large: { SCALE: 2.5 },
    medium: { SCALE: 1.5 },
    small: { SCALE: 1 },
  },
  DEFAULT_SIZE: 'small',
  // * Quand une bulle éclate, elle se divise : COUNT bulles de la taille INTO apparaissent à sa place et s'écartent (une taille absente ne se divise pas)
  SPLIT: {
    large: { INTO: 'medium', COUNT: 4 },
    medium: { INTO: 'small', COUNT: 2, DISTANCE: 48 }, // DISTANCE : l'écartement de ses filles (sinon SPREAD.DISTANCE)
  },
  SPREAD: { DISTANCE: 64, DURATION_MS: 450, EASE: 'Back.easeOut' }, // l'écartement des bulles filles : distance en pixels, durée
  DEPTH: 9, // devant le joueur, derrière le décor du dessus (10)
  STAR_POP: { DURATION_MS: 700, EASE: 'Back.easeOut' }, // l'étoile apparaît au centre de la carte en grossissant, avec un petit rebond
};

// * L'étoile qui saute de la tête du personnage quand l'énigme est résolue (voir StarBounce.js).
// Une direction au hasard (un chemin libre), puis des rebonds de plus en plus petits, comme une vraie balle.
export const STAR_BOUNCE = {
  HEAD_HEIGHT_RATIO: 0.85, // la hauteur de la tête, en part de la hauteur de l'image du personnage
  LAUNCH_SPEED: 300, // la vitesse vers le haut au départ, en pixels par seconde
  GRAVITY: 1100, // pixels par seconde au carré
  RESTITUTION: 0.55, // chaque rebond repart avec 55 % de la vitesse de l'impact
  MIN_BOUNCE_SPEED: 90, // en dessous, l'étoile ne rebondit plus : elle s'arrête
  SPEED: { MIN: 85, MAX: 115 }, // la vitesse de déplacement au sol, en pixels par seconde (la distance reste courte)
  SPIN_DEG_PER_S: 300, // l'étoile tourne sur elle-même en l'air
  DEPTH: 9, // devant le joueur, derrière le décor du dessus (10)
  DIRECTIONS: 24, // combien de directions on essaie (réparties sur le cercle) pour trouver un chemin libre
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

// * Les caisses : des objets Tiled de classe « crate », que le joueur casse en tirant dessus (voir CrateSystem.js).
// ? boite1.png est un nom provisoire : le jour où il change, il n'y a que PATH à modifier.
export const CRATE = {
  KEY: 'crate', // la clé Phaser de la texture
  PATH: 'assets/images/sprites/boite1.png',
  FRAME_SIZE: 32, // l'image fait 32 x 32 pixels, comme une tuile
  TILED_CLASS: 'crate', // la classe de l'objet dans Tiled
  DEFAULT_HIT_POINTS: 1, // nombre de tirs pour la casser, si l'objet Tiled n'a pas de propriété « hitPoints »
  // * Une teinte par monde (le nom du monde est celui de WORLDS) : elle multiplie les couleurs de la caisse, pour qu'elle
  // aille avec l'ambiance du monde (comme les teintes des mondes, voir TINTS). Un monde absent garde l'orange d'origine.
  // Les éclats de bois prennent la même teinte.
  WORLD_TINTS: { world_4: 0x8a7a66 }, // apocalypse : bois brun cendré, usé
  // * Effets visuels (VFX). Éclat blanc à chaque coup qui ne casse pas, gerbe d'éclats de bois quand elle casse.
  VFX: {
    DEBRIS_KEY: 'crate_debris', // texture générée par le code : un petit carré blanc, coloré par les teintes ci-dessous
    DEBRIS_SIZE: 6, // en pixels
    DEBRIS_COLORS: [0x8a5a2b, 0xb8743a, 0xd9a45c, 0xe8c27a], // des bruns de bois
    DEBRIS_COUNT: 20, // nombre d'éclats
    DEBRIS_SPEED: { MIN: 50, MAX: 190 }, // pixels par seconde
    DEBRIS_LIFETIME_MS: { MIN: 350, MAX: 650 },
    DEBRIS_DEPTH: 15, // devant les calques et le joueur
    HIT_FLASH_MS: 70, // durée de l'éclat blanc
    SHAKE: { DURATION_MS: 90, INTENSITY: 0.004 }, // léger tremblement de l'écran quand la caisse casse
  },
};
// * Le décor posé dans les cartes (voir DecoSystem.js) : de petites images (fleurs, lanternes, cristaux, champignons...).
// Dans Tiled : un objet « point » de classe « deco », dont le NOM est une des images ci-dessous. Le point marque les pieds de l'image.
export const DECO = {
  TILED_CLASS: 'deco',
  PATH: 'assets/images/deco/', // le dossier des images (un fichier par nom : « fleur_1.png »)
  KEY_PREFIX: 'deco_', // la clé Phaser d'une image est ce préfixe suivi de son nom
  SMALL_SIZE: 16, // une image de cette taille (ou moins) est agrandie ×2 pour aller avec les tuiles de 32 px
  // * Une teinte par monde (le nom du monde est celui de WORLDS) : elle multiplie les couleurs du décor pour qu'il aille avec la lumière du monde
  // (0xffffff = aucune teinte). Un monde absent garde les couleurs d'origine des images.
  WORLD_TINTS: {
    world_1: 0x8f9cd4, // la nuit : des bleus, le vert des buissons s'assombrit
    world_3: 0xf2d0a0, // l'automne : une lumière chaude
  },
  // * Les sources de lumière ne sont jamais teintées : une lanterne, une bougie ou un cristal reste lumineux, même la nuit
  UNTINTED: ['lanterne_', 'bougie_', 'cristal_'], // les noms d'images qui commencent ainsi
  // * Le décor SOLIDE : le joueur, les ennemis et les balles ne le traversent pas. Les autres (fleurs, herbe, trèfle, plantes,
  // champignons, bougies, crâne) se traversent. Chaque ligne : [début du nom de l'image, largeur, hauteur] de la zone qui bloque, en
  // pixels, posée AUX PIEDS de l'image (pas sur toute l'image : on passe derrière un arbuste, devant sa base on est bloqué).
  SOLID: [
    ['buisson', 30, 14], // les arbustes et les haies (deux arbustes côte à côte ne laissent pas de passage)
    ['lanterne_', 14, 10], // le pied d'une lanterne
    ['panneau', 14, 10],
    ['citrouilles', 28, 14],
    ['sac_', 20, 12],
    ['puits', 28, 16],
    ['cristal_', 22, 12],
    ['livres', 26, 14],
  ],
  IMAGES: [
    'fleur_1', 'fleur_2', 'fleur_3', 'fleur_4', 'fleur_5', 'fleur_6',
    'buisson', 'buisson_automne', 'trefle', 'herbe', 'plante_verte', 'panneau',
    'champignon_1', 'champignon_2', 'champignon_3', 'champignon_4',
    'lanterne_bleue', 'lanterne_orange', 'lanterne_noire', 'lanterne_rose', 'lanterne_verte', 'lanterne_violette',
    'bougie_1', 'bougie_2', 'bougie_3',
    'cristal_bleu', 'cristal_jaune', 'cristal_orange', 'cristal_rose', 'cristal_vert', 'cristal_violet',
    'citrouilles', 'citrouilles_halloween', 'crane', 'livres', 'sac_1', 'sac_2', 'sac_3', 'puits',
  ],
};

// * Le cadenas posé sur un miroir verrouillé (voir MirrorSystem.js) : 16 x 16 px, agrandi ×2. Quand le miroir s'ouvre, il s'ouvre, monte et s'efface.
export const MIRROR_LOCK = {
  CLOSED: { KEY: 'mirror_lock_closed', PATH: 'assets/images/ui/cadenas_ferme.png' },
  OPEN: { KEY: 'mirror_lock_open', PATH: 'assets/images/ui/cadenas_ouvert.png' },
  SCALE: 2,
  DEPTH: 9, // devant les personnages, derrière le décor du dessus
  TINT: 0x9a9a9a, // un miroir verrouillé est un peu assombri
  OPEN_DELAY_MS: 1000, // le temps de laisser l'iris s'ouvrir avant que le cadenas ne s'ouvre
  OPEN_ANIM: { RISE_PX: 22, DURATION_MS: 700 }, // il s'ouvre, puis monte et s'efface
};

// * La progression (voir ProgressSystem.js) : le tir et le dash sont verrouillés au départ. Le message bref affiché quand on appuie dessus.
export const PROGRESS = {
  // * Ce que gagne le joueur en ramassant l'étoile d'un monde (le nom du monde est celui de WORLDS) : la nuit donne le tir, le monde
  // post-apocalyptique donne le dash. Les autres étoiles ne donnent rien de plus.
  STAR_UNLOCKS: { world_1: ['shoot'], world_4: ['dash'] },
  // * Les miroirs du jardin (le nom d'un miroir est le monde qu'il ouvre) : seuls ceux de MIRRORS_OPEN_AT_START sont ouverts au départ.
  // Ramasser l'étoile d'un monde ouvre les miroirs de MIRROR_UNLOCKS : la nuit ouvre le monde post-apocalyptique, qui ouvre tous les autres.
  // Après ça, plus aucun ordre.
  MIRRORS_OPEN_AT_START: ['world_1'],
  MIRROR_UNLOCKS: { world_1: ['world_4'], world_4: ['world_2', 'world_3', 'world_5'] },
  // * Le message sur un miroir verrouillé : « Verrouillé : ramasse l'étoile de la nuit » (le monde dont l'étoile ouvre ce miroir)
  WORLD_LABELS: { world_1: 'la nuit', world_4: "l'apocalypse" },
  LOCKED_MIRROR_HINT: "Verrouillé : ramasse l'étoile de ",
  // * La bannière qui annonce une capacité gagnée : compacte, en haut de l'écran, elle n'arrête PAS le jeu et disparaît seule
  UNLOCK_BANNER: {
    Y: 130, // son centre, en pixels depuis le haut (sous le texte d'aide des miroirs)
    WIDTH: 560,
    HEIGHT: 96,
    SHOW_MS: 3500, // la durée pendant laquelle elle reste affichée
    SLIDE_MS: 350, // la durée de l'arrivée et du départ
    SLIDE_PX: 24, // elle descend de ce nombre de pixels en arrivant
    NAMES: { shoot: 'Tir', dash: 'Dash' },
    TITLE: 'débloqué !',
    BUTTON_SCALE: 2, // 20 px x 2 = 40 px
  },
  LOCKED_TOAST: {
    LABELS: { shoot: 'Tir', dash: 'Dash' }, // devant « pas encore débloqué »
    TEXT: 'pas encore débloqué',
    DURATION_MS: 1300,
    COOLDOWN_MS: 900, // pas de message tant que le précédent n'est pas passé (on ne spamme pas l'écran)
    Y_RATIO: 0.84, // la hauteur du message, en part de la hauteur de l'écran
    SIZE: '34px',
  },
};

// * Les bombes cachées dans certaines caisses (voir BombSystem.js). Dans Tiled : propriété « hasBomb » (booléen) sur la caisse.
export const BOMB = {
  KEY: 'bomb',
  PATH: 'assets/images/sprites/bombe.png',
  TILED_PROPERTY: 'hasBomb',
  DISTANCE_SCALE: 0.5, // elle saute comme l'étoile, mais va deux fois moins loin
  FUSE_MS: 300, // la pause entre l'arrivée au sol et l'explosion : elle clignote (0 = explose dès qu'elle se pose)
  PULSE: { SCALE: 1.25, MS: 100 }, // le gonflement pendant la mèche
  RADIUS: 80, // le rayon de l'explosion, en pixels
  DEPTH: 9, // comme l'étoile : devant le joueur, derrière le décor du dessus
  // * L'explosion : un disque orange qui grandit, des éclats, un tremblement de l'écran
  BLAST: {
    COLOR: 0xffa040,
    START_ALPHA: 0.85,
    DURATION_MS: 300,
    DEPTH: 16,
    PUFF_KEY: 'bomb_puff', // texture générée par le code (un petit carré blanc)
    PUFF_SIZE: 6,
    PUFF_COLORS: [0xffd060, 0xff8030, 0xd04020, 0x302830],
    PUFF_COUNT: 28,
    PUFF_SPEED: { MIN: 60, MAX: 220 },
    PUFF_LIFETIME_MS: { MIN: 300, MAX: 700 },
    SHAKE: { DURATION_MS: 200, INTENSITY: 0.01 },
  },
};
export const P2_SPRITE = {
  key: 'player2',
  path: 'assets/images/sprites/player_2_spritesheet.png',
  frameWidth: 32,
  frameHeight: 32
};

// * Le joueur 2 apparaît à côté du joueur 1, à cette distance (en pixels) : à droite, sinon à gauche, en bas, en haut
export const P2_SPAWN_DISTANCE = 40;
export const P2_SPEED = PLAYER.SPEED; // la même vitesse que le joueur 1
