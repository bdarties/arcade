// =====================================================================================
// * DECO SYSTEM : LE DÉCOR DES MONDES
// =====================================================================================
//
// Le décor se pose dans Tiled : des objets « point » de classe « deco » (DECO.TILED_CLASS) dans le calque « objects ». Le NOM de
// l'objet est l'image à afficher (voir DECO.IMAGES dans constants.js : « fleur_1 », « lanterne_bleue »...). Le point marque les
// PIEDS de l'image (le bas, centré). Changer, déplacer ou ajouter du décor se fait dans Tiled, sans toucher au code.
//
// Chaque monde peut avoir une teinte de décor (DECO.WORLD_TINTS), sauf pour les lanternes, bougies et cristaux (lumineux).
// Une partie du décor est SOLIDE (arbustes, lanternes, panneau, citrouilles, sacs, puits, cristaux, livres : DECO.SOLID) : une petite zone
// invisible aux pieds de l'image bloque le passage. Les fleurs, l'herbe, le trèfle et les champignons se traversent.
// Le décor est trié en profondeur avec les personnages (voir WorldScene.sortByDepth) : le joueur passe devant ou derrière
// selon sa position. Une image de 16 px est agrandie ×2 pour aller avec les tuiles de 32 px.
//
// * COMMENT L'UTILISER
//   preloadDeco(this);                       // dans preload()
//   const { images, blockers } = createDeco(this, map);   // dans create() : les images, et les zones solides (voir DECO.SOLID)
//   this.physics.add.collider(this.player, blockers);
// =====================================================================================

import { DECO } from '../utils/constants.js';

/** Charge les images du décor. À appeler dans preload(). */
export function preloadDeco(scene) {
  DECO.IMAGES.forEach((name) => scene.load.image(DECO.KEY_PREFIX + name, `${DECO.PATH}${name}.png`));
}

/**
 * Crée le décor de la carte : une image à chaque objet « deco ».
 * @param {Phaser.Scene} scene
 * @param {Phaser.Tilemaps.Tilemap} map
 * @returns {{images: Phaser.GameObjects.Image[], blockers: Phaser.Physics.Arcade.StaticGroup}} les images posées (vide s'il n'y a pas de décor),
 *   et le groupe des zones solides (à brancher sur le joueur, les ennemis, les balles)
 */
export function createDeco(scene, map) {
  const blockers = scene.physics.add.staticGroup();
  const objects = map.getObjectLayer('objects')?.objects ?? [];
  const images = objects
    .filter((object) => (object.class || object.type) === DECO.TILED_CLASS)
    .map((object) => {
      const key = DECO.KEY_PREFIX + object.name;
      if (!scene.textures.exists(key)) {
        console.warn(`[DecoSystem] Décor inconnu : « ${object.name} » (voir DECO.IMAGES dans constants.js).`);
        return null;
      }
      const image = scene.add.image(object.x, object.y, key).setOrigin(0.5, 1);
      image.texture.setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art net, même agrandi
      if (image.width <= DECO.SMALL_SIZE) image.setScale(2);

      // * La teinte du monde (sauf pour les sources de lumière, qui gardent leurs couleurs)
      const tint = DECO.WORLD_TINTS[scene.getWorldName()];
      if (tint !== undefined && !DECO.UNTINTED.some((prefix) => object.name.startsWith(prefix))) image.setTint(tint);

      // * Les éléments solides : une zone invisible aux pieds de l'image
      const solid = DECO.SOLID.find(([prefix]) => object.name.startsWith(prefix));
      if (solid) {
        const [, width, height] = solid;
        const zone = scene.add.zone(object.x, object.y - height / 2, width, height);
        scene.physics.add.existing(zone, true);
        blockers.add(zone);
      }
      return image;
    })
    .filter(Boolean);
  return { images, blockers };
}
