import InputManager from '../systems/InputManager.js';
import timer from '../systems/TimerSystem.js';
import { RecolteEtoiles } from '../systems/RecolteEtoiles.js';
import { areAllStarsCollected } from '../systems/StarSystem.js';
import { isMirrorUsed, markMirrorUsed, shouldMirrorDisappear } from '../systems/MirrorSystem.js';
import { getPaletteTexture } from '../systems/PaletteSystem.js';
import { pickVariant } from '../utils/helpers.js';
import {
  SCENES,
  ASSETS,
  TILE_SIZE,
  TILE_ANIMATIONS,
  ANIMATED_TILES,
  ANIMATED_TILES_BLOCK_PLAYER,
  WORLDS,
  WORLD_PALETTES,
  NORMAL_WORLD,
  MIRROR_SPAWN_OFFSET,
  MIRROR_VANISH,
  PLAYER,
  INTERACT_DISTANCE,
  MESSAGE_DURATION_MS,
  DEPTH,
  COLORS,
  FONT_FAMILY,
  FONT_SIZE,
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
    this.load.image('etoile', 'assets/images/sprites/Etoile.png');
    this.load.image(ASSETS.TILESET_DECO, 'assets/images/tilesets/tileset_deco.png');

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
    this.gameWon = false;

    // * Le chronomètre et son affichage sont globaux : ils ne dépendent pas du monde.
    // On lance l'interface une seule fois, puis on la garde au premier plan à chaque monde.
    // ? Le chronomètre démarre ici pour l'instant. À déplacer au lancement de la partie quand le menu existera.
    if (!this.scene.isActive(SCENES.UI)) {
      this.scene.launch(SCENES.UI);
    }
    this.scene.bringToTop(SCENES.UI);
    timer.start(); // sans effet s'il tourne déjà

    // * La palette de couleurs de ce monde (voir WORLD_PALETTES dans constants.js). Sans palette (le jardin),
    // on garde les textures d'origine ; avec une palette, on utilise des copies recolorées.
    const paletteName = WORLD_PALETTES[this.getWorldName()];

    // * L'eau : une copie recolorée du spritesheet (avec ses images numérotées de 32 x 32), ou l'original.
    // Les images numérotées doivent exister AVANT de créer les animations, sinon Phaser les ignore sans erreur.
    const waterTexture = getPaletteTexture(this, ASSETS.WATER, paletteName, { width: TILE_SIZE, height: TILE_SIZE });
    const animationSuffix = waterTexture === ASSETS.WATER ? '' : `@${paletteName}`;

    this.createTileAnimations(waterTexture, animationSuffix);
    this.createMirrorAnimation();

    // * On construit la carte à partir du JSON Tiled
    const map = this.make.tilemap({ key: this.mapKey });

    // * Le tileset de construction (sol, murs) : une copie recolorée si ce monde a une palette (voir plus haut).
    // Les décors (tileset_deco) ne sont jamais recolorés : ils gardent leurs couleurs.
    const gardenTexture = getPaletteTexture(this, ASSETS.TILESET_GARDEN, paletteName);

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

    // * Toute tuile posée dans le calque « walls » devient un obstacle (-1 = case vide)
    walls.setCollisionByExclusion([-1]);

    // * Où faire apparaître le joueur ? (voir getSpawnPosition)
    const spawn = this.getSpawnPosition(map);

    // * Le joueur est un sprite « physique » : c'est ce qui permet de le faire entrer en collision
    // Il commence de face (vers le bas), sur le point de départ
    this.player = this.physics.add.sprite(spawn.x, spawn.y, ASSETS.PLAYER_1, PLAYER.FRAMES.DOWN);
    this.player.setCollideWorldBounds(true);

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

        // * Le miroir bloque le joueur comme un mur
        const collider = this.physics.add.collider(this.player, mirror);

        if (vanishing) {
          // * Il joue son animation de disparition. Il n'est PAS ajouté à this.mirrors : on ne peut plus l'utiliser.
          // Quand l'animation est finie, on détruit le miroir et sa collision pour de bon.
          mirror.play(MIRROR_VANISH.KEY);
          mirror.once('animationcomplete', () => {
            collider.destroy();
            mirror.destroy();
          });
          return;
        }

        this.mirrors.push(mirror);
      });

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

    // * Les étoiles de ce monde, posées dans Tiled (le joueur existe déjà : l'étoile a besoin de lui)
    this.createStars(map);
  }

  /**
   * * Crée une étoile à la position de chaque objet de classe « star » posé dans le calque « objects » de la carte.
   * Une carte sans objet « star » (le jardin) n'a donc pas d'étoile. Changer la place d'une étoile se fait dans Tiled.
   * Selon la version de Tiled, la classe s'appelle « class » ou « type » : on lit les deux.
   */
  createStars(map) {
    map
      .getObjectLayer('objects')
      .objects.filter((object) => (object.class || object.type) === 'star')
      .forEach((object) => RecolteEtoiles(this.player, this, object.x, object.y));
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
        return {
          x: mirror.x + mirror.width + MIRROR_SPAWN_OFFSET.X,
          y: mirror.y + mirror.height / 2 + MIRROR_SPAWN_OFFSET.Y,
        };
      }
    }

    const spawn = map.findObject('objects', (object) => object.name === 'spawn');
    return { x: spawn.x, y: spawn.y };
  }

  /**
   * * Fin de la partie : on arrête le chronomètre, on fige le joueur et la physique, et l'interface affiche le message.
   * TODO(équipe): écran de fin (temps final, record via saveBestTime, rejouer), à la place du simple message
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
    // * Partie gagnée : tout est figé, on ne lit plus les touches
    if (this.gameWon) return;

    // * Victoire : toutes les étoiles du jeu sont ramassées ET le joueur est de retour dans le jardin
    if (this.isNormalWorld() && areAllStarsCollected()) {
      this.winGame();
      return;
    }

    // * Direction souhaitée, déjà normalisée en diagonale par l'InputManager
    const { x, y } = this.input1.getMove();

    // * On change l'image selon la direction. À l'arrêt, on garde la dernière image.
    // En diagonale, la direction horizontale est prioritaire.
    if (x > 0) this.player.setFrame(PLAYER.FRAMES.RIGHT);
    else if (x < 0) this.player.setFrame(PLAYER.FRAMES.LEFT);
    else if (y < 0) this.player.setFrame(PLAYER.FRAMES.UP);
    else if (y > 0) this.player.setFrame(PLAYER.FRAMES.DOWN);

    // * On donne une vitesse (en pixels par seconde) : c'est la physique Phaser qui déplace
    // le joueur et qui l'arrête contre les murs
    this.player.setVelocity(x * PLAYER.SPEED, y * PLAYER.SPEED);

    // * Y a-t-il un miroir assez proche pour interagir ?
    const nearMirror = this.mirrors.find(
      (mirror) =>
        Phaser.Math.Distance.Between(this.player.x, this.player.y, mirror.x, mirror.y) <
        INTERACT_DISTANCE,
    );

    // On ne réécrit pas le texte pendant l'affichage du message d'interaction
    // ? La touche affichée (E) est provisoire : à changer avec les boutons de la borne
    // TODO(équipe): changer le message d'interaction (utiliser une icône de touche au-dessus des miroirs)
    if (!this.messageActive) {
      this.hint.setText(nearMirror ? 'E : entrer dans le miroir' : '');
    }

    if (nearMirror && this.input1.justPressed('interact')) {
      // * Le nom du miroir dans Tiled donne le monde visé, la table WORLDS donne sa scène
      const targetScene = WORLDS[nearMirror.world];

      if (targetScene) {
        // TODO(équipe): SFX du passage par le miroir, à ajouter au plus vite
        // TODO(équipe): timer global et score, à ajouter au plus vite (ils doivent survivre au changement de scène)
        // TODO(équipe): VFX du passage par le miroir (fondu, effet visuel), à ajouter plus tard
        // TODO(équipe): bloquer les touches pendant le changement de monde, à ajouter plus tard
        // (sans ça, un double appui rapide sur E peut relancer la scène)
        // * On quitte cette scène et on lance celle du monde visé, en lui disant d'où l'on vient.
        // Le nom de ce monde est la clé de WORLDS dont la valeur est notre scène.
        const currentWorld = this.getWorldName();
        this.scene.start(targetScene, { from: currentWorld });
      } else {
        // Le miroir existe dans Tiled mais son monde n'est pas encore créé
        this.hint.setText(`Ce monde n'existe pas encore : ${nearMirror.world}`);
        this.messageActive = true;
        this.time.delayedCall(MESSAGE_DURATION_MS, () => {
          this.messageActive = false;
        });
      }
    }
  }
}
