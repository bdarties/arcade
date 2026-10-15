import InputManager from '../systems/InputManager.js';
import timer from '../systems/TimerSystem.js';
import { dropBomb } from '../systems/BombSystem.js';
import { RecolteEtoiles, recolterEtoile } from '../systems/RecolteEtoiles.js';
import { areAllStarsCollected } from '../systems/StarSystem.js';
import { createBulletAnimations, explodeBullet, shoot } from '../systems/fonctionTir.js';
import { preloadCrate, createCrates } from '../systems/CrateSystem.js';
import { preloadDeco, createDeco } from '../systems/DecoSystem.js';
import { isMirrorUsed, markMirrorUsed, shouldMirrorDisappear, getMirrorFacing, preloadMirrorLocks, createMirrorLocks } from '../systems/MirrorSystem.js';
import { applyTint } from '../systems/TintSystem.js';
import { irisClose, irisOpen } from '../systems/TransitionSystem.js';
import { preloadNpcs, createNpcs } from '../systems/NpcSystem.js';
import DialogueBox, { isRiddleSolved } from '../systems/DialogueSystem.js';
import { bounceStar } from '../systems/StarBounce.js';
import Dash from '../systems/DashSystem.js';
import { preloadBubbles, createBubbles } from '../systems/BubbleSystem.js';
import { preloadEnemies, createEnemies, updateEnemies, resetEnemies, isEnemiesCleared, markEnemiesCleared, startEnemyCounter } from '../systems/EnemySystem.js';
import { DIALOGUES } from '../data/dialogues.js';
import { pickVariant } from '../utils/helpers.js';
import { loadSecondPlayer, createSecondPlayer, updateSecondPlayer } from '../systems/SecondPlayer.js';
import { getControlMode } from '../systems/ControlMode.js';
import { ABILITIES, isUnlocked, notifyLocked, isMirrorLocked, getMirrorUnlocker } from '../systems/ProgressSystem.js';
import {
  GAME_WIDTH,
  SCENES,
  ASSETS,
  TILE_SIZE,
  TILE_ANIMATIONS,
  ANIMATED_TILES,
  ANIMATED_TILES_BLOCK_PLAYER,
  WORLDS,
  WORLD_TINTS,
  NORMAL_WORLD,
  MIRROR_SPAWN_OFFSET,
  MIRROR_VANISH,
  PLAYER,
  BULLET,
  INTERACT_DISTANCE,
  MESSAGE_DURATION_MS,
  DEPTH,
  COLORS,
  FONT_FAMILY,
  FONT_SIZE,
  SMOKE,
  WORLD_ART,
  DIALOGUE,
  PROGRESS,
  CONTROL_MODES,
  STAR_BOUNCE,
  BUBBLES,
  ENEMY_AI,
} from '../utils/constants.js';

/**
 * * Scène de base de tous les mondes (jardin compris) : elle charge une carte Tiled,
 * y place le joueur au point de départ, gère les collisions et les miroirs.
 * Chaque monde en hérite et lui indique sa carte ; il n'ajoute que sa mécanique propre.
 */
export default class WorldScene extends Phaser.Scene {
  /**
   * @param {string} sceneKey  Nom de la scène (voir SCENES dans constants.js)
   * @param {string} mapKey    Clé sous laquelle la carte est enregistrée dans Phaser
   * @param {string} mapPath   Chemin du fichier JSON de la carte, exporté de Tiled
   */
  constructor(sceneKey, mapKey, mapPath) {
    super(sceneKey);
    this.mapKey = mapKey;
    this.mapPath = mapPath;
  }

  // * init() reçoit les données passées par this.scene.start(scène, données)
  // Ici : le nom du monde d'où vient le joueur (vide au premier lancement du jeu)
  init(data) {
    this.fromWorld = data?.from;
  }

  // preload() charge les images avant que create() ne démarre
  preload() {
    // * Le spritesheet est découpé en images de 32 x 32 pixels (4 images côte à côte)
    this.load.spritesheet(ASSETS.PLAYER_1, 'assets/images/sprites/player_1_spritesheet.png', {
      frameWidth: PLAYER.FRAME_SIZE,
      frameHeight: PLAYER.FRAME_SIZE,
    });

    // * La carte (JSON exporté de Tiled) et les images de ses deux tilesets :
    // la construction (sol, murs, eau) et les décors
    this.load.tilemapTiledJSON(this.mapKey, this.mapPath);
    this.load.image(ASSETS.TILESET_GARDEN, 'assets/images/tilesets/tileset_garden.png');

    // * Les images recolorées de ce monde, s'il en a (voir WORLD_ART) : sous des clés à part, pour ne pas toucher aux originaux
    const art = WORLD_ART[this.getWorldName()];
    if (art) {
      this.load.image(ASSETS.TILESET_GARDEN + art.suffix, art.tileset);
      this.load.spritesheet(ASSETS.WATER + art.suffix, art.water, { frameWidth: TILE_SIZE, frameHeight: TILE_SIZE });
    }
    this.load.image('etoile', 'assets/images/sprites/Etoile.png');
    preloadCrate(this);
    preloadDeco(this);
    preloadMirrorLocks(this);
    this.load.image(ASSETS.TILESET_DECO, 'assets/images/tilesets/tileset_deco.png');

    // * Les balles : balle.png est une bande de 33 images de 16 x 16 pixels, chargée comme un spritesheet
    this.load.spritesheet(BULLET.KEY, 'assets/images/sprites/balle.png', {
      frameWidth: BULLET.FRAME_SIZE,
      frameHeight: BULLET.FRAME_SIZE,
    });

    // * Les images des personnages non joueurs (voir NPCS dans constants.js)
    preloadNpcs(this);

    // * L'image des bulles du monde magique (voir BUBBLES dans constants.js)
    preloadBubbles(this);

    // * Les images des ennemis (voir ENEMIES dans constants.js)
    preloadEnemies(this);

    // * Le spritesheet du miroir, découpé en images de 32 x 32 pixels.
    // Un sprite créé sans préciser l'image affiche la première (le miroir entier).
    this.load.spritesheet(ASSETS.MIRROR, 'assets/images/sprites/mirror_spritesheet.png', {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });

    // * Le spritesheet des tuiles animées (l'eau), découpé en images de 32 x 32 pixels
    this.load.spritesheet(ASSETS.WATER, 'assets/images/sprites/water_spritesheet.png', {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    });
    loadSecondPlayer(this);
  }

  /**
   * * Définit l'animation de disparition du miroir (voir MIRROR_VANISH dans constants.js).
   * Elle ne se joue qu'une fois (repeat: 0). Comme les autres animations, elle est globale :
   * on ne la crée qu'une seule fois pour tout le jeu.
   */
  createMirrorAnimation() {
    if (this.anims.exists(MIRROR_VANISH.KEY)) return;

    this.anims.create({
      key: MIRROR_VANISH.KEY,
      frames: this.anims.generateFrameNumbers(ASSETS.MIRROR, {
        start: MIRROR_VANISH.FIRST_FRAME,
        end: MIRROR_VANISH.LAST_FRAME,
      }),
      frameRate: MIRROR_VANISH.FRAME_RATE,
      repeat: 0, // 0 = une seule fois
    });
  }

  /**
   * * Définit les animations des tuiles animées (voir TILE_ANIMATIONS dans constants.js).
   * Les animations sont globales à tout le jeu : on ne les crée qu'une fois,
   * même si plusieurs mondes appellent cette méthode.
   */
  createTileAnimations(waterTexture, suffix) {
    TILE_ANIMATIONS.forEach(({ key, sheet, start, end, frameRate }) => {
      // * Une animation est liée à UNE texture : l'eau recolorée d'un monde a donc ses propres animations,
      // reconnaissables à leur suffixe (« water_1@magic »). Celles de l'eau d'origine n'ont pas de suffixe.
      const animationKey = key + suffix;
      if (this.anims.exists(animationKey)) return;

      this.anims.create({
        key: animationKey,
        // L'eau utilise la texture de ce monde (une copie recolorée, ou l'original) ; les autres images gardent la leur
        frames: this.anims.generateFrameNumbers(sheet === ASSETS.WATER ? waterTexture : sheet, { start, end }),
        frameRate,
        repeat: -1, // -1 = en boucle, sans fin
      });
    });
  }

  /**
   * * Remplace les tuiles « repères » du calque animated_tiles par des sprites qui jouent
   * leur animation en boucle (voir ANIMATED_TILES dans constants.js).
   * Les tuiles qui ne sont pas dans cette table (l'eau fixe du centre) restent affichées telles quelles.
   * Une carte sans ce calque est simplement ignorée.
   * @returns {Phaser.Physics.Arcade.StaticGroup|null} les blocs qui bloquent le joueur, ou null
   */
  createAnimatedTiles(map, tilesets, waterTexture, animationSuffix) {
    // ! On teste d'abord l'existence du calque : createLayer afficherait un avertissement sinon
    if (!map.getLayer('animated_tiles')) return null;

    const layer = map.createLayer('animated_tiles', tilesets);

    // * Les tuiles repères sont retirées de la carte plus bas, donc elles ne bloquent plus le joueur.
    // On crée à la place un bloc invisible de la taille d'une tuile (« zone ») sous chaque case d'eau.
    // Un groupe « statique » ne bouge jamais : c'est ce qu'il faut pour un obstacle.
    const blockers = this.physics.add.staticGroup();

    layer.forEachTile((tile) => {
      if (tile.index === -1) return; // case vide

      if (ANIMATED_TILES_BLOCK_PLAYER) {
        blockers.add(this.add.zone(tile.getCenterX(), tile.getCenterY(), TILE_SIZE, TILE_SIZE));
      }

      const variants = ANIMATED_TILES[tile.index];
      if (!variants) return; // tuile vide ou tuile normale : on ne touche à rien

      // * S'il y a plusieurs animations possibles, on en choisit une selon la position de la tuile
      const animation = variants[pickVariant(tile.x, tile.y, variants.length)];

      // * Le sprite prend la place exacte de la tuile (son centre), puis joue son animation.
      // Il utilise la texture d'eau de ce monde et l'animation qui lui correspond (voir createTileAnimations).
      const sprite = this.add.sprite(tile.getCenterX(), tile.getCenterY(), waterTexture);
      this.waterSprites.push(sprite); // pour leur donner la teinte du monde (voir applyTint)
      sprite.play(animation + animationSuffix);

      // * On reporte l'orientation de la tuile (posée dans Tiled avec les touches Z, X, Y) sur le sprite.
      // Phaser a converti les retournements de Tiled en un miroir horizontal (flipX) et une rotation :
      // le miroir est appliqué d'abord, puis la rotation. L'animation de base est orientée « vers le haut ».
      sprite.setFlipX(tile.flipX);
      sprite.setRotation(tile.rotation);

      // * On retire la tuile « repère » pour qu'elle ne reste pas visible sous l'animation
      layer.removeTileAt(tile.x, tile.y);
    });

    return blockers;
  }

  create() {
    // * Une même scène est réutilisée à chaque visite : on remet l'état à zéro
    // ! Sinon un message encore affiché au moment de partir bloquerait le texte d'aide au retour
    this.messageActive = false;
    this.vanishingMirror = null;
    this.dialogueInput = null;
    this.gameWon = false;
    this.transitioning = false; // vrai pendant la FERMETURE de l'iris, quand on prend un miroir : le joueur est figé (voir update)
    this.waterSprites = []; // les sprites de l'eau animée de CETTE visite (remplis par createAnimatedTiles)

    // * Le chronomètre et son affichage sont globaux : ils ne dépendent pas du monde.
    // On lance l'interface une seule fois, puis on la garde au premier plan à chaque monde.
    // ? Le chronomètre démarre ici pour l'instant. À déplacer au lancement de la partie quand le menu existera.
    if (!this.scene.isActive(SCENES.UI)) {
      this.scene.launch(SCENES.UI);
    }
    this.scene.bringToTop(SCENES.UI);
    timer.start(); // sans effet s'il tourne déjà

    // * Les couleurs de ce monde sont une TEINTE (voir WORLD_TINTS), posée plus bas sur les tuiles (voir applyTint).
    // Les textures sont donc toujours les originales.
    // ? Les palettes (PaletteSystem.js, getPaletteTexture) ne sont plus appelées : pour les réactiver, l'eau et le tileset
    // de construction repasseraient par getPaletteTexture, avec WORLD_PALETTES.
    const art = WORLD_ART[this.getWorldName()];
    const animationSuffix = art ? art.suffix : '';
    const waterTexture = ASSETS.WATER + animationSuffix;
    const gardenTexture = ASSETS.TILESET_GARDEN + animationSuffix;

    this.createTileAnimations(waterTexture, animationSuffix);
    this.createMirrorAnimation();

    // * On construit la carte à partir du JSON Tiled
    const map = this.make.tilemap({ key: this.mapKey });
    this.map = map;

    // ! Le 1er nom est celui du tileset DANS Tiled, le 2e est la clé de l'image à utiliser.
    // Une carte peut utiliser plusieurs tilesets : on les passe tous à chaque calque, qui prend dans chacun
    // les tuiles qu'il utilise. Un tileset absent de la carte renvoie null : filter(Boolean) l'écarte.
    const tilesets = [
      map.addTilesetImage('tileset_garden', gardenTexture),
      map.addTilesetImage('tileset_deco', ASSETS.TILESET_DECO),
    ].filter(Boolean);

    // * Les calques sont créés du dessous vers le dessus, dans le même ordre que dans Tiled
    map.createLayer('background', tilesets);
    map.createLayer('ground', tilesets);
    map.createLayer('decor_below', tilesets);

    // * L'eau : créée ici, entre le décor du dessous et les murs, pour passer sous le joueur
    const waterBlockers = this.createAnimatedTiles(map, tilesets, waterTexture, animationSuffix);
    const walls = map.createLayer('walls', tilesets);
    this.walls = walls; // gardés pour savoir où l'étoile de l'énigme peut se poser (voir isFreeGround)
    this.waterBlockers = waterBlockers;

    // * Toute tuile posée dans le calque « walls » devient un obstacle (-1 = case vide)
    walls.setCollisionByExclusion([-1]);

    // * Où faire apparaître le joueur ? (voir getSpawnPosition)
    const spawn = this.getSpawnPosition(map);
    this.spawnPoint = spawn; // pour y renvoyer le joueur quand un ennemi le touche (voir respawnPlayer)

    // * Le joueur est un sprite « physique » : c'est ce qui permet de le faire entrer en collision
    // Il commence de face (vers le bas), sur le point de départ
    this.player = this.physics.add.sprite(spawn.x, spawn.y, ASSETS.PLAYER_1, PLAYER.FRAMES.DOWN);
    this.player.setCollideWorldBounds(true);

    // * Dans quelle direction regarde le joueur ? C'est la direction des tirs. Il commence de face (vers le bas).
    this.facing = 'down';
    this.dash = new Dash(this, this.player); // le dash du joueur (voir DashSystem.js)

    // * La boîte de collision est plus petite que l'image et placée au niveau des pieds :
    // le joueur peut passer « devant » un mur sans que sa tête ne le bloque
    this.player.body.setSize(PLAYER.HITBOX.WIDTH, PLAYER.HITBOX.HEIGHT);
    this.player.body.setOffset(PLAYER.HITBOX.OFFSET_X, PLAYER.HITBOX.OFFSET_Y);

    // * On dit à Phaser : le joueur ne traverse pas les murs
    this.physics.add.collider(this.player, walls);

    // * Et il ne traverse pas l'eau (si ANIMATED_TILES_BLOCK_PLAYER est à true dans constants.js)
    if (waterBlockers) {
      this.physics.add.collider(this.player, waterBlockers);
    }

    // * Les miroirs sont les objets de classe « mirror » placés dans Tiled.
    // Leur nom donne le monde qu'ils ouvrent (ex. « world_1 »).
    // * Selon la version de Tiled, la classe s'appelle « class » ou « type » : on lit les deux.
    this.mirrors = [];

    // * Au retour dans le jardin, le miroir pris pour partir est marqué « utilisé » AVANT de créer les miroirs.
    // Si c'est le cas, vanishingWorld contient son nom : ce miroir va jouer son animation de disparition.
    const vanishingWorld = this.markReturnMirrorUsed();
    let vanishingMirror = null; // le miroir qui disparaît, s'il y en a un (son animation attend la fin de l'iris)

    map
      .getObjectLayer('objects')
      .objects.filter((object) => (object.class || object.type) === 'mirror')
      .forEach((object) => {
        const vanishing = object.name === vanishingWorld;

        // Un miroir utilisé AVANT n'est plus créé : il a déjà disparu (voir isMirrorAvailable)
        if (!vanishing && !this.isMirrorAvailable(object.name)) return;

        // * Le miroir est une image, centrée sur l'objet Tiled (un sprite est centré sur son point de placement,
        // d'où le « + width / 2 »). Elle garde sa taille d'origine, quelle que soit celle de l'objet dans Tiled.
        // « Statique » : le corps ne bouge jamais, et sa zone de blocage a la taille de l'image.
        const mirror = this.physics.add.staticSprite(
          object.x + object.width / 2,
          object.y + object.height / 2,
          ASSETS.MIRROR,
        );
        mirror.world = object.name; // le monde de destination
        // * De quel côté il regarde : à gauche, l'image est inversée (le joueur arrive alors à sa gauche, voir getSpawnPosition)
        mirror.facing = getMirrorFacing(object, map.widthInPixels);
        if (mirror.facing === 'left') mirror.setFlipX(true);

        // * Le miroir bloque le joueur comme un mur
        const collider = this.physics.add.collider(this.player, mirror);

        if (vanishing) {
          // * Il va jouer son animation de disparition. Il n'est PAS ajouté à this.mirrors : on ne peut plus l'utiliser.
          // Quand l'animation est finie, on détruit le miroir et sa collision pour de bon.
          mirror.play(MIRROR_VANISH.KEY);
          this.vanishingMirror = mirror; // le joueur 2 doit aussi être bloqué par lui pendant l'animation
          mirror.once('animationcomplete', () => {
            collider.destroy();
            mirror.destroy();
          });
          vanishingMirror = mirror;
          return;
        }

        this.mirrors.push(mirror);
      });
    // * Un cadenas sur chaque miroir encore verrouillé du jardin (et son animation d'ouverture pour ceux qui viennent de s'ouvrir)
    if (this.isNormalWorld()) createMirrorLocks(this, this.mirrors);


    // * Texte d'aide, affiché en haut de l'écran quand on est près d'un miroir
    this.hint = this.add
      .text(this.scale.width / 2, 40, '', {
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE.HINT,
        color: COLORS.TEXT,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI);

    // * decor_above passe devant le joueur : on le crée après lui avec une profondeur plus grande
    map.createLayer('decor_above', tilesets).setDepth(DEPTH.ABOVE_PLAYER);

    // * Les touches passent par l'InputManager : la scène ne connaît aucune touche
    this.input1 = new InputManager(this, 1);

    // * Les balles : les animations (créées une seule fois pour tout le jeu) et le groupe des balles de ce monde.
    // Le groupe est créé ICI, une fois par visite, et non à chaque tir (voir shoot dans fonctionTir.js).
    // ? Tout monde peut tirer pour l'instant (pour tester) : le GDD ne prévoit le tir que dans les mondes 2 et 4.
    createBulletAnimations(this);
    this.bullets = this.physics.add.group();

    // * Une balle qui touche un mur explose (le premier objet reçu est la balle, le second la tuile du mur)
    this.physics.add.collider(this.bullets, walls, (bullet) => explodeBullet(bullet));

    // * Les étoiles de ce monde, posées dans Tiled (le joueur existe déjà : l'étoile a besoin de lui)
    this.createStars(map);

    // * Les caisses de ce monde, posées dans Tiled (le joueur et le groupe de balles existent déjà)
    this.crates = createCrates(this, map, this.player, this.bullets);
    // * Le décor : les images sont triées en profondeur avec les personnages (voir sortByDepth) ; une partie est solide (voir DECO.SOLID)
    const { images, blockers } = createDeco(this, map);
    this.deco = images;
    this.decoBlockers = blockers;
    this.physics.add.collider(this.player, blockers);
    this.physics.add.collider(this.bullets, blockers, (bullet) => explodeBullet(bullet));

    // * La fumée des cheminées, posée dans Tiled
    this.createSmokes(map);

    // * Les personnages non joueurs, posés dans Tiled (le joueur existe déjà : ils le bloquent comme un mur)
    this.npcs = createNpcs(this, map, this.player);

    // * Une étoile gardée par une énigme n'apparaît qu'une fois l'énigme résolue (elle saute alors de la tête du personnage)
    if (this.npcs.some((npc) => DIALOGUES[npc.npcName]?.riddle && !isRiddleSolved(npc.npcName))) {
      this.stars.forEach((star) => star.disableBody(true, true));
    }

    // * Une étoile cachée dans une caisse (propriété « hasStar ») n'apparaît qu'à la casse de cette caisse
    if (this.crates.getChildren().some((crate) => crate.hasStar)) {
      this.stars.forEach((star) => star.disableBody(true, true));
    }

    // * Les bulles à éclater, posées dans Tiled (le joueur existe déjà). L'étoile du monde est cachée tant qu'il en reste ;
    // quand elles sont toutes éclatées, elle apparaît au centre de la carte.
    this.bubbles = createBubbles(this, map, this.player, () => this.revealStarAtCenter(true));
    if (this.bubbles.total > 0) this.stars.forEach((star) => star.disableBody(true, true));
    if (this.bubbles.done) this.revealStarAtCenter(false); // bulles déjà éclatées lors d'une visite précédente

    // * Les ennemis, posés dans Tiled
    this.enemies = createEnemies(this, map, this.bullets);
    // * Un monde avec des ennemis cache son étoile : elle apparaît (en sautant de l'endroit où meurt le dernier ennemi) quand ils sont tous morts
    if (isEnemiesCleared(this.mapKey)) this.enemies.clear(true, true); // déjà tous tués lors d'une visite précédente : ils ne reviennent pas
    this.enemiesTotal = this.enemies.getChildren().length;
    startEnemyCounter(this.enemiesTotal); // « Ennemis : x / total » dans l'interface
    this.enemiesCleared = false;
    this.lastEnemyDeath = null;
    if (this.enemiesTotal > 0) this.stars.forEach((star) => star.disableBody(true, true));
    // * Les ennemis sont bloqués par les murs, l'eau, les caisses, les personnages, les miroirs et entre eux
    this.enemyObstacles = [this.waterBlockers, this.crates, this.decoBlockers, ...this.npcs, ...this.mirrors].filter(Boolean); // aussi lus par EnemySystem pour contourner
    [this.walls, ...this.enemyObstacles].forEach((obstacle) => {
      this.physics.add.collider(this.enemies, obstacle);
    });
    this.physics.add.collider(this.enemies, this.enemies);
    // * Un ennemi qui touche le joueur le renvoie au départ (il ne le bloque pas : ils se traversent)
    this.physics.add.overlap(this.player, this.enemies, () => this.onEnemyTouch(this.player));

    // * La boîte de dialogue des personnages (cachée tant qu'on ne parle à personne)
    this.dialogue = new DialogueBox(this);

    // * La teinte du monde, posée en dernier : tous les calques et les sprites d'eau existent. Le jardin n'en a pas.
    applyTint(map, this.waterSprites, WORLD_TINTS[this.getWorldName()]);
    this.player2 = createSecondPlayer(this, this.player, walls);
    this.player2Spawn = { x: this.player2.x, y: this.player2.y }; // où il revient quand un ennemi le touche
    this.player.invulnerableUntil = 0;
    this.player2.invulnerableUntil = 0;
    this.physics.add.overlap(this.player2, this.enemies, () => this.onEnemyTouch(this.player2));
    // * Le joueur 2 éclate aussi les bulles
    this.bubbles.addPlayer?.(this.player2);
    // * Le joueur 2 ramasse aussi les étoiles (le joueur 1 est branché dans RecolteEtoiles)
    this.stars.forEach((star) => this.physics.add.overlap(this.player2, star, () => recolterEtoile(this, star)));
    // * Le joueur 2 est bloqué comme le joueur 1 : murs, eau, caisses, miroirs
    [walls, waterBlockers, this.crates, this.decoBlockers, ...this.mirrors].filter(Boolean).forEach((obstacle) => {
      this.physics.add.collider(this.player2, obstacle);
    });
    if (this.vanishingMirror?.active) {
      const collider = this.physics.add.collider(this.player2, this.vanishingMirror);
      this.vanishingMirror.once('destroy', () => collider.destroy());
    }

    // * Arrivée par un miroir : le cercle s'ouvre depuis le miroir d'arrivée (ou depuis celui qui disparaît).
    // Le joueur n'est pas figé pendant l'ouverture : il peut déjà bouger. Sans miroir d'origine (premier lancement),
    // il n'y a pas de transition.
    if (this.fromWorld) {
      const arrival = this.mirrors.find((mirror) => mirror.world === this.fromWorld) || vanishingMirror || this.player;
      irisOpen(this, arrival.x, arrival.y, () => vanishingMirror?.play(MIRROR_VANISH.KEY));
    }
  }

  /**
   * * Crée une fumée à la position de chaque objet de classe « smoke » du calque « objects » (le point se place
   * en haut de la cheminée). Elle passe devant le joueur, comme le décor du dessus. Une carte sans objet « smoke »
   * n'a pas de fumée. Les réglages (durée, vitesse, vent) sont dans SMOKE (constants.js).
   */
  createSmokes(map) {
    const smokes = map
      .getObjectLayer('objects')
      .objects.filter((object) => (object.class || object.type) === 'smoke');
    if (smokes.length === 0) return;

    // La texture d'une bouffée : un petit carré (pixel art), créé une seule fois pour toute la partie
    if (!this.textures.exists(SMOKE.TEXTURE)) {
      const puff = this.make.graphics({ x: 0, y: 0, add: false });
      puff.fillStyle(SMOKE.COLOR, 1);
      puff.fillRect(0, 0, SMOKE.PUFF_SIZE, SMOKE.PUFF_SIZE);
      puff.generateTexture(SMOKE.TEXTURE, SMOKE.PUFF_SIZE, SMOKE.PUFF_SIZE);
      puff.destroy();
    }

    smokes.forEach((object) => {
      this.add
        .particles(object.x, object.y, SMOKE.TEXTURE, {
          lifespan: SMOKE.LIFESPAN_MS,
          frequency: SMOKE.FREQUENCY_MS,
          speedY: { min: -SMOKE.RISE_SPEED.MAX, max: -SMOKE.RISE_SPEED.MIN },
          speedX: { min: SMOKE.DRIFT_X.MIN, max: SMOKE.DRIFT_X.MAX },
          alpha: { start: SMOKE.START_ALPHA, end: 0 },
          scale: { start: SMOKE.SCALE.START, end: SMOKE.SCALE.END },
        })
        .setDepth(DEPTH.ABOVE_PLAYER);
    });
  }

  /**
   * * Crée une étoile à la position de chaque objet de classe « star » posé dans le calque « objects » de la carte.
   * Une carte sans objet « star » (le jardin) n'a donc pas d'étoile. Changer la place d'une étoile se fait dans Tiled.
   * Selon la version de Tiled, la classe s'appelle « class » ou « type » : on lit les deux.
   */
  createStars(map) {
    this.stars = map
      .getObjectLayer('objects')
      .objects.filter((object) => (object.class || object.type) === 'star')
      .map((object) => RecolteEtoiles(this.player, this, object.x, object.y))
      .filter(Boolean); // une étoile déjà prise n'est pas recréée
  }

  /** L'étoile du monde saute de la tête du personnage (récompense de l'énigme), puis le joueur la ramasse. */
  revealWorldStar(npc) {
    const star = this.stars.find((s) => !s.active);
    if (!star) return;
    const from = { x: npc.x, y: npc.y, headHeight: npc.height * STAR_BOUNCE.HEAD_HEIGHT_RATIO };
    bounceStar(this, star, from, (x, y) => this.isFreeGround(x, y));
  }

  /** Un ennemi touche le joueur : sauf s'il vient déjà d'être renvoyé (invincible), ou en plein dialogue ou transition. */
  /** Les joueurs que les ennemis voient et peuvent toucher : le joueur 2 n'existe pas pour eux en mode pc (il ne bouge pas), ni en solo. */
  getEnemyTargets() {
    return getControlMode() === CONTROL_MODES.PC || !this.player2.active ? [this.player] : [this.player, this.player2];
  }

  onEnemyTouch(player) {
    if (!this.getEnemyTargets().includes(player)) return;
    const dash = player === this.player ? this.dash : this.player2.dash;
    if (this.time.now < player.invulnerableUntil || this.time.now < dash.endsAt || this.dialogue.isOpen || this.transitioning) return;
    this.respawnPlayer(player);
  }

  /** Un joueur est pris dans une explosion : le niveau recommence (sauf s'il est invincible, en plein dash, ou si le jeu est figé). */
  onBombHit(player) {
    const dash = player === this.player ? this.dash : this.player2.dash;
    if (this.time.now < player.invulnerableUntil || this.time.now < dash.endsAt || this.dialogue.isOpen || this.transitioning) return;
    this.restartLevel();
  }

  /** Recommence ce monde à zéro (caisses, ennemis, bombes), comme si on y arrivait par le même miroir. */
  restartLevel() {
    const { FLASH } = ENEMY_AI.CONTACT;
    this.transitioning = true; // tout est figé pendant l'éclair
    this.cameras.main.flash(FLASH.DURATION_MS, FLASH.RED, FLASH.GREEN, FLASH.BLUE);
    this.time.delayedCall(FLASH.DURATION_MS + 250, () => this.scene.restart({ from: this.fromWorld }));
  }

  /** Renvoie ce joueur au départ (le joueur 2 à côté du joueur 1), les ennemis reprennent leur place. */
  respawnPlayer(player) {
    const { INVULNERABLE_MS, BLINK_MS, BLINK_ALPHA, FLASH } = ENEMY_AI.CONTACT;

    const spawn = player === this.player ? this.spawnPoint : this.player2Spawn;
    player.setPosition(spawn.x, spawn.y);
    player.setVelocity(0, 0);
    resetEnemies(this.enemies);
    this.cameras.main.flash(FLASH.DURATION_MS, FLASH.RED, FLASH.GREEN, FLASH.BLUE);

    // * Invincible un court instant : le joueur clignote, puis redevient normal
    player.invulnerableUntil = this.time.now + INVULNERABLE_MS;
    this.tweens.killTweensOf(player);
    this.tweens.add({ targets: player, alpha: BLINK_ALPHA, duration: BLINK_MS, yoyo: true, repeat: -1 });
    this.time.delayedCall(INVULNERABLE_MS, () => {
      this.tweens.killTweensOf(player);
      player.setAlpha(1);
    });
  }

  /** La caisse qui cachait l'étoile vient de casser : l'étoile en saute et rebondit, puis le joueur la ramasse. */
  onStarCrateBroken(crate) {
    const star = this.stars.find((s) => !s.active);
    if (!star) return;
    // Elle part du centre de la caisse (la caisse fait 32 pixels : le sol est 16 sous son centre, l'étoile à 20 au-dessus)
    const from = { x: crate.x, y: crate.y + 16, headHeight: 20 + 16 };
    bounceStar(this, star, from, (x, y) => this.isFreeGround(x, y));
  }

  /**
   * Trie l'affichage selon la profondeur du terrain : plus les pieds d'un objet sont bas, plus il passe devant.
   * Sans ça, l'ordre dépend de la création (les caisses, créées après le joueur, le recouvraient toujours).
   */
  sortByDepth() {
    const { SORTED_MIN, SORTED_MAX } = DEPTH;
    const height = this.map.heightInPixels;
    [this.player, this.player2, ...this.enemies.getChildren(), ...this.crates.getChildren(), ...this.npcs, ...this.mirrors, ...this.deco].forEach((sprite) => {
      if (!sprite?.active) return;
      // * Les pieds : le bas du corps physique, ou le point où l'image est posée (le décor n'a pas de corps)
      const feet = sprite.body ? sprite.body.bottom : sprite.y;
      sprite.setDepth(SORTED_MIN + (SORTED_MAX - SORTED_MIN) * Phaser.Math.Clamp(feet / height, 0, 1));
    });
  }

  /** Le dernier ennemi vient de mourir : l'étoile du monde saute de l'endroit où il est mort, puis le joueur la ramasse. */
  onAllEnemiesKilled() {
    const star = this.stars.find((s) => !s.active);
    if (!star) return;
    const spot = this.lastEnemyDeath ?? { x: this.map.widthInPixels / 2, y: this.map.heightInPixels / 2 };
    // * Elle part de l'endroit où l'ennemi avait les pieds, à la hauteur de sa tête (une image de 32 px)
    bounceStar(this, star, { x: spot.x, y: spot.y, headHeight: 30 }, (x, y) => this.isFreeGround(x, y));
  }

  /** Une caisse qui cachait une bombe vient de casser : la bombe saute, se pose et explose (voir BombSystem.js). */
  onBombCrateBroken(crate) {
    dropBomb(this, crate);
  }

  /** L'étoile du monde apparaît au centre de la carte (récompense des bulles), avec un petit effet de rebond si animated. */
  revealStarAtCenter(animated) {
    const star = this.stars[0];
    if (!star || star.starId === undefined) return;
    star.enableBody(true, this.map.widthInPixels / 2, this.map.heightInPixels / 2, true, true);
    if (!animated) return;
    star.setScale(0);
    this.tweens.add({ targets: star, scale: 1, duration: BUBBLES.STAR_POP.DURATION_MS, ease: BUBBLES.STAR_POP.EASE });
  }

  /** L'étoile peut-elle se poser en ce point du sol ? (ni mur, ni eau, ni miroir, ni caisse, ni personnage, ni hors de la carte) */
  isFreeGround(x, y) {
    const margin = 20;
    if (x < margin || y < margin || x > GAME_WIDTH - margin || y > this.map.heightInPixels - margin) return false;
    if (this.walls.hasTileAtWorldXY(x, y)) return false;
    if (this.waterBlockers?.getChildren().some((zone) => Math.abs(zone.x - x) <= 20 && Math.abs(zone.y - y) <= 20)) return false;
    if (this.mirrors.some((mirror) => Phaser.Math.Distance.Between(x, y, mirror.x, mirror.y) < 40)) return false;
    if (this.crates.getChildren().some((crate) => crate.active && crate.hitPoints > 0 && Math.abs(crate.x - x) < 22 && Math.abs(crate.y - y) < 22)) return false;
    if (this.decoBlockers.getChildren().some((zone) => Math.abs(zone.x - x) < zone.width / 2 + 12 && Math.abs(zone.y - y) < zone.height / 2 + 12)) return false;
    return !this.npcs.some((other) => Math.abs(other.x - x) < 34 && y > other.y - 24 && y < other.y + 12);
  }

  // Le nom de ce monde, comme dans la table WORLDS (ex. « hub », « world_1 »)
  getWorldName() {
    return Object.keys(WORLDS).find((name) => WORLDS[name] === this.scene.key);
  }

  // Cette scène est-elle le monde normal (le jardin) ?
  isNormalWorld() {
    return this.getWorldName() === NORMAL_WORLD;
  }

  /**
   * * Au retour dans le jardin, le miroir qu'on avait pris pour partir devient « utilisé ».
   * fromWorld est le monde d'où l'on vient : le miroir du jardin qui y mène porte son nom.
   * Sans effet ailleurs que dans le jardin, ni au premier lancement du jeu (fromWorld est vide).
   * @returns {string|null} le nom du miroir qui vient de disparaître (il doit jouer son animation),
   * ou null s'il n'y en a pas (ou si ce miroir avait déjà disparu avant)
   */
  markReturnMirrorUsed() {
    if (this.isNormalWorld() && this.fromWorld && shouldMirrorDisappear(this.fromWorld)) {
      if (isMirrorUsed(this.fromWorld)) return null; // déjà disparu lors d'un passage précédent

      markMirrorUsed(this.fromWorld);
      return this.fromWorld;
    }
    return null;
  }

  // Ce miroir est-il encore là ? Seuls les miroirs du jardin disparaissent, jamais ceux des autres mondes.
  isMirrorAvailable(name) {
    return !(this.isNormalWorld() && isMirrorUsed(name));
  }

  /**
   * * Position d'apparition du joueur.
   * - S'il arrive par un miroir : à côté du miroir qui mène au monde d'où il vient
   *   (dans Tiled, ce miroir porte le nom de ce monde, ex. « hub »).
   * - Sinon (premier lancement du jeu) : au point « spawn » de la carte.
   * ? Le placement des miroirs n'est pas encore officiel (cartes de test) : la position d'apparition
   * pourra changer avec les cartes définitives.
   * Le miroir d'arrivée disparaît au retour dans le jardin (voir markReturnMirrorUsed), mais sa
   * position reste dans la carte : le joueur apparaît donc toujours à son emplacement.
   * @returns {{x: number, y: number}}
   */
  getSpawnPosition(map) {
    if (this.fromWorld) {
      const mirror = map.findObject(
        'objects',
        (object) => object.name === this.fromWorld && (object.class || object.type) === 'mirror',
      );

      if (mirror) {
        // * Le joueur arrive du côté où le miroir regarde : à sa droite, ou à sa gauche s'il est tourné vers la gauche
        const toLeft = getMirrorFacing(mirror, map.widthInPixels) === 'left';
        return {
          x: toLeft ? mirror.x - MIRROR_SPAWN_OFFSET.X : mirror.x + mirror.width + MIRROR_SPAWN_OFFSET.X,
          y: mirror.y + mirror.height / 2 + MIRROR_SPAWN_OFFSET.Y,
        };
      }
    }

    const spawn = map.findObject('objects', (object) => object.name === 'spawn');
    return { x: spawn.x, y: spawn.y };
  }

  /**
   * * Fin de la partie : on arrête le chronomètre, on fige le joueur et la physique, et l'interface affiche l'écran de victoire.
   */
  winGame() {
    this.gameWon = true;
    timer.stop(); // le temps final est celui de cet instant
    this.player.setVelocity(0, 0);
    this.physics.pause();
    this.scene.get(SCENES.UI).showVictory();
  }

  // update() est appelée à chaque image (environ 60 fois par seconde)
  update() {
    this.sortByDepth();

    // * Partie gagnée : tout est figé, on ne lit plus les touches
    if (this.gameWon) return;

    // * Victoire : toutes les étoiles du jeu sont ramassées ET le joueur est de retour dans le jardin
    if (this.isNormalWorld() && areAllStarsCollected()) {
      this.winGame();
      return;
    }

    // * Les ennemis vivent à chaque image, sauf pendant un dialogue ou une transition (ils s'arrêtent)
    updateEnemies(this, this.enemies, this.getEnemyTargets(), this.dialogue.isOpen || this.transitioning);
    if (this.enemiesTotal > 0 && !this.enemiesCleared && this.enemies.countActive(true) === 0) {
      this.enemiesCleared = true;
      markEnemiesCleared(this.mapKey); // retenu pour les prochaines visites
      this.onAllEnemiesKilled();
    }

    // * Pendant la fermeture de l'iris (on a pris un miroir) : le joueur est figé, on ne lit ni les déplacements, ni le tir, ni l'interaction
    if (this.transitioning) {
      this.player.setVelocity(0, 0);
      this.player2.setVelocity(0, 0);
      return;
    }

    // * Pendant un dialogue : le joueur est figé, les touches servent au dialogue (avancer, choisir une réponse)
    if (this.dialogue.isOpen) {
      this.player.setVelocity(0, 0);
      this.player2.setVelocity(0, 0);
      this.dialogue.update(this.dialogueInput || this.input1); // les touches du joueur qui a lancé le dialogue
      return;
    }

    // * Direction souhaitée, déjà normalisée en diagonale par l'InputManager
    const { x, y } = this.input1.getMove();

    // * On change l'image selon la direction. À l'arrêt, on garde la dernière image.
    // En diagonale, la direction horizontale est prioritaire.
    // * On retient aussi la direction regardée (this.facing) : à l'arrêt, le joueur tire toujours dans la dernière direction.
    if (x > 0) {
      this.player.setFrame(PLAYER.FRAMES.RIGHT);
      this.facing = 'right';
    } else if (x < 0) {
      this.player.setFrame(PLAYER.FRAMES.LEFT);
      this.facing = 'left';
    } else if (y < 0) {
      this.player.setFrame(PLAYER.FRAMES.UP);
      this.facing = 'up';
    } else if (y > 0) {
      this.player.setFrame(PLAYER.FRAMES.DOWN);
      this.facing = 'down';
    }

    // * Tir : une balle par appui, dans la direction regardée
    if (this.input1.justPressed('shoot')) {
      if (isUnlocked(ABILITIES.SHOOT)) shoot(this, this.bullets, this.player, this.facing);
      else notifyLocked(this, ABILITIES.SHOOT); // verrouillé : un message bref, pas de tir
    }

    // * On donne une vitesse (en pixels par seconde) : c'est la physique Phaser qui déplace
    // le joueur et qui l'arrête contre les murs
    // * Le dash impose sa propre vitesse tant qu'il dure ; sinon la vitesse normale
    if (!this.dash.update(this.input1, { x, y }, this.facing)) {
      this.player.setVelocity(x * PLAYER.SPEED, y * PLAYER.SPEED);
    }

    // * Le joueur 2 : déplacement, tir et dash (voir SecondPlayer.js)
    updateSecondPlayer(this, this.player2);

    // * Chaque joueur peut interagir (miroir, personnage). Le joueur 1 est lu en premier. Le joueur 2 ne le peut pas en mode pc.
    if (this.interact(this.player, this.input1, true)) return;
    if (this.player2.active && getControlMode() !== CONTROL_MODES.PC) this.interact(this.player2, this.player2.input2, false);
  }

  /**
   * Un joueur appuie (ou non) sur sa touche d'interaction : parler à un personnage proche, ou prendre un miroir proche.
   * @param {Phaser.Physics.Arcade.Sprite} player  Le joueur qui interagit
   * @param {InputManager} input  Ses touches
   * @param {boolean} showHint  Vrai pour le joueur 1 : c'est lui qui voit l'aide à l'écran
   * @returns {boolean} vrai si un dialogue ou un changement de monde vient de commencer
   */
  interact(player, input, showHint) {
    // * Y a-t-il un miroir assez proche pour interagir ?
    const nearMirror = this.mirrors.find(
      (mirror) =>
        Phaser.Math.Distance.Between(player.x, player.y, mirror.x, mirror.y) <
        INTERACT_DISTANCE,
    );

    // * Y a-t-il un personnage assez proche pour lui parler ?
    const nearNpc = this.npcs.find(
      (npc) =>
        Phaser.Math.Distance.Between(player.x, player.y, npc.body.center.x, npc.body.center.y) <
        DIALOGUE.INTERACT_DISTANCE,
    );

    // * Un miroir du jardin verrouillé (voir ProgressSystem.js) ne s'utilise pas : on dit pourquoi, à la place de l'aide habituelle
    const mirrorLocked = Boolean(nearMirror) && this.isNormalWorld() && isMirrorLocked(nearMirror.world);
    const lockedText = mirrorLocked ? PROGRESS.LOCKED_MIRROR_HINT + (PROGRESS.WORLD_LABELS[getMirrorUnlocker(nearMirror.world)] ?? 'le monde précédent') : '';

    // On ne réécrit pas le texte pendant l'affichage du message d'interaction
    // ? Les touches sont provisoires : à changer avec les boutons de la borne (voir BINDINGS dans InputManager)
    if (showHint && !this.messageActive) {
      // * La touche affichée suit le mode de contrôle (I en arcade, E en pc) : l'aide ne ment jamais
      const key = input.getKeyLabel('interact');
      this.hint.setText(mirrorLocked ? lockedText : nearMirror ? `${key} : entrer dans le miroir` : nearNpc ? `${key} : parler` : '');
    }

    // * Parler à un personnage proche (un miroir proche passe avant)
    if (nearNpc && !nearMirror && input.justPressed('interact')) {
      this.hint.setText('');
      this.dialogueInput = input; // c'est ce joueur qui fait avancer le dialogue
      this.dialogue.open(nearNpc.npcName, DIALOGUES[nearNpc.npcName], () => this.revealWorldStar(nearNpc));
      return true;
    }

    if (mirrorLocked) return this.transitioning; // verrouillé : le message est affiché, rien d'autre

    if (nearMirror && input.justPressed('interact')) {
      // * Le nom du miroir dans Tiled donne le monde visé, la table WORLDS donne sa scène
      const targetScene = WORLDS[nearMirror.world];

      if (targetScene) {
        // * On quitte cette scène et on lance celle du monde visé, en lui disant d'où l'on vient.
        // Le nom de ce monde est la clé de WORLDS dont la valeur est notre scène.
        const currentWorld = this.getWorldName();

        // * Transition : le cercle noir se referme SUR LE MIROIR pris, puis on change de scène
        this.transitioning = true;
        irisClose(this, nearMirror.x, nearMirror.y, () => {
          this.scene.start(targetScene, { from: currentWorld });
        });
      } else {
        // Le miroir existe dans Tiled mais son monde n'est pas encore créé
        this.hint.setText(`Ce monde n'existe pas encore : ${nearMirror.world}`);
        this.messageActive = true;
        this.time.delayedCall(MESSAGE_DURATION_MS, () => {
          this.messageActive = false;
        });
      }
    }
    return this.transitioning;
  }
}
