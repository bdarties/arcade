// =====================================================================================
// * CRATE SYSTEM : LES CAISSES QU'ON CASSE EN TIRANT
// =====================================================================================
//
// * POURQUOI CE FICHIER EXISTE
// Une caisse est un objet Tiled de classe « crate ». Elle bloque le joueur comme un mur, et chaque balle qui la touche
// lui retire une vie (hitPoints) : à zéro, elle est détruite. La carte décide donc où sont les caisses et combien
// de tirs il faut pour les casser, sans toucher au code.
//
// * DANS TILED
//   1. Dans le calque d'objets « objects », ajouter un objet (un POINT suffit : il est posé au centre de la caisse,
//      comme les étoiles ; un rectangle marche aussi).
//   2. Lui donner la classe « crate » (CRATE.TILED_CLASS).
//   3. Facultatif : une propriété personnalisée « hitPoints » (entier) = nombre de tirs pour la casser.
//      Sans elle, CRATE.DEFAULT_HIT_POINTS (1).
//
// * COMMENT L'UTILISER (dans une scène de monde qui a un joueur et un groupe de balles)
//   import { preloadCrate, createCrates } from '../systems/CrateSystem.js';
//
//   preload() { preloadCrate(this); }
//   create()  { ... this.crates = createCrates(this, map, this.player, this.bullets); }
//
// La collision balle/caisse est celle des cibles (addTargetCollision, dans fonctionTir.js) : la balle explose,
// la caisse perd une vie.
//
// * LES EFFETS (VFX)
// Un coup qui ne casse pas fait clignoter la caisse en blanc. Le coup fatal projette des éclats de bois et fait
// légèrement trembler l'écran. Tout se règle dans CRATE.VFX (constants.js). Les effets passent par la fonction
// facultative onHit de chaque caisse, appelée par hitTarget (voir fonctionTir.js).
// =====================================================================================

import { CRATE } from '../utils/constants.js';
import { addTargetCollision } from './fonctionTir.js';

/**
 * Charge l'image des caisses. À appeler dans preload().
 * @param {Phaser.Scene} scene
 */
export function preloadCrate(scene) {
  scene.load.image(CRATE.KEY, CRATE.PATH);
}

/**
 * La valeur d'une propriété personnalisée d'un objet Tiled, ou la valeur par défaut si elle n'existe pas.
 * (Tiled stocke les propriétés dans un tableau [{ name, type, value }, ...].)
 * @param {object} object  Un objet Tiled
 * @param {string} name
 * @param {*} defaultValue
 */
export function getTiledProperty(object, name, defaultValue) {
  const property = (object.properties ?? []).find((p) => p.name === name);
  return property ? property.value : defaultValue;
}

/**
 * Crée (une seule fois) la petite texture des éclats : un carré blanc, que les émetteurs colorent.
 * @param {Phaser.Scene} scene
 */
function ensureDebrisTexture(scene) {
  const { DEBRIS_KEY, DEBRIS_SIZE } = CRATE.VFX;
  if (scene.textures.exists(DEBRIS_KEY)) return;

  const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
  graphics.fillStyle(0xffffff);
  graphics.fillRect(0, 0, DEBRIS_SIZE, DEBRIS_SIZE);
  graphics.generateTexture(DEBRIS_KEY, DEBRIS_SIZE, DEBRIS_SIZE);
  graphics.destroy();
}

/**
 * L'effet d'un coup reçu par une caisse : un éclat blanc, ou la casse si c'était le dernier coup.
 * Appelé par hitTarget AVANT que la caisse ne soit détruite : elle a encore sa position et ses points de vie à jour.
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Sprite} crate
 */
function playHitEffect(scene, crate) {
  const { VFX } = CRATE;

  if (crate.hitPoints > 0) {
    // * Elle tient encore : un éclat blanc très court
    crate.setTintFill(0xffffff);
    scene.time.delayedCall(VFX.HIT_FLASH_MS, () => crate.active && crate.clearTint());
    return;
  }

  // * Elle casse : une gerbe d'éclats dans toutes les directions, qui rétrécissent puis disparaissent
  const debris = scene.add.particles(crate.x, crate.y, VFX.DEBRIS_KEY, {
    speed: { min: VFX.DEBRIS_SPEED.MIN, max: VFX.DEBRIS_SPEED.MAX },
    angle: { min: 0, max: 360 },
    lifespan: { min: VFX.DEBRIS_LIFETIME_MS.MIN, max: VFX.DEBRIS_LIFETIME_MS.MAX },
    scale: { start: 1, end: 0 },
    tint: VFX.DEBRIS_COLORS,
    emitting: false,
  });
  debris.setDepth(VFX.DEBRIS_DEPTH);
  debris.explode(VFX.DEBRIS_COUNT);

  // * L'émetteur n'a plus de raison d'exister une fois les éclats éteints
  scene.time.delayedCall(VFX.DEBRIS_LIFETIME_MS.MAX + 100, () => debris.destroy());

  scene.cameras.main.shake(VFX.SHAKE.DURATION_MS, VFX.SHAKE.INTENSITY);
}

/**
 * Crée les caisses d'une carte : un groupe statique, bloquant pour le joueur et cassable par les balles.
 * Sans objet « crate » dans la carte (ou sans calque « objects »), le groupe est simplement vide.
 * @param {Phaser.Scene} scene
 * @param {Phaser.Tilemaps.Tilemap} map  La carte Tiled
 * @param {Phaser.GameObjects.Sprite} player  Le joueur : il ne traverse pas les caisses
 * @param {Phaser.Physics.Arcade.Group} bullets  Le groupe de balles (voir fonctionTir.js)
 * @returns {Phaser.Physics.Arcade.StaticGroup} le groupe de caisses
 */
export function createCrates(scene, map, player, bullets) {
  ensureDebrisTexture(scene);
  const crates = scene.physics.add.staticGroup();
  const objects = map.getObjectLayer('objects')?.objects ?? [];

  objects
    .filter((object) => (object.class || object.type) === CRATE.TILED_CLASS)
    .forEach((object) => {
      // * Un point est posé au centre ; un rectangle Tiled a son coin en haut à gauche : on vise son centre
      const x = object.x + (object.width ?? 0) / 2;
      const y = object.y + (object.height ?? 0) / 2;

      const crate = crates.create(x, y, CRATE.KEY);
      crate.hitPoints = getTiledProperty(object, 'hitPoints', CRATE.DEFAULT_HIT_POINTS);
      crate.onHit = () => playHitEffect(scene, crate);
    });

  scene.physics.add.collider(player, crates);
  addTargetCollision(scene, bullets, crates);

  return crates;
}
