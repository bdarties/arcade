// =====================================================================================
// * NPC SYSTEM : LES PERSONNAGES NON JOUEURS
// =====================================================================================
//
// Un PNJ se pose dans Tiled : un objet « point » de classe « npc » dans le calque « objects ». Son NOM donne le
// personnage (une clé de NPCS dans constants.js, ex. « enigme »). Le point marque l'endroit où il a les pieds.
// Changer un PNJ de place se fait donc dans Tiled, sans toucher au code. Une carte sans objet « npc » n'en a pas.
// Selon la version de Tiled, la classe s'appelle « class » ou « type » : on lit les deux.
//
// * COMMENT L'UTILISER
//   preloadNpcs(this);                       // dans preload()
//   this.npcs = createNpcs(this, map, this.player);   // dans create(), une fois le joueur créé
// =====================================================================================

import { NPCS } from '../utils/constants.js';

/** Charge les images de tous les PNJ (à appeler dans preload). */
export function preloadNpcs(scene) {
  Object.values(NPCS).forEach((npc) => scene.load.image(npc.key, npc.image));
}

/**
 * Crée un PNJ à la position de chaque objet « npc » de la carte. Il bloque le joueur comme un mur.
 * @returns {Phaser.Physics.Arcade.Sprite[]} les PNJ créés, avec npc.npcName = le nom de l'objet Tiled
 */
export function createNpcs(scene, map, player) {
  return map
    .getObjectLayer('objects')
    .objects.filter((object) => (object.class || object.type) === 'npc')
    .map((object) => {
      const config = NPCS[object.name];
      if (!config) {
        console.warn(`[NpcSystem] PNJ inconnu : « ${object.name} » (voir NPCS dans constants.js).`);
        return null;
      }

      // * Les pieds sont au point de l'objet : le bas de l'image, centré
      const npc = scene.physics.add.staticSprite(object.x, object.y, config.key).setOrigin(0.5, 1);
      npc.npcName = object.name;

      // * La zone qui bloque est un petit rectangle aux pieds (et non toute l'image, qui est très grande).
      // refreshBody() d'abord : le corps suit le nouveau point d'origine (les pieds), puis on le réduit.
      const { WIDTH, HEIGHT } = config.hitbox;
      npc.refreshBody();
      npc.body.setSize(WIDTH, HEIGHT, false);
      npc.body.setOffset((npc.width - WIDTH) / 2, npc.height - HEIGHT);

      scene.physics.add.collider(player, npc);
      return npc;
    })
    .filter(Boolean);
}
