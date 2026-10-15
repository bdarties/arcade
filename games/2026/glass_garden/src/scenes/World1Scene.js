import WorldScene from './WorldScene.js';
import { SCENES, WORLD_MAPS } from '../utils/constants.js';

/**
 * * Monde 1 : la nuit.
 * Ici, il suffit de ramasser l'étoile.
 * Tout vient des objets posés dans sa carte (voir WORLD_MAPS dans constants.js), gérés par WorldScene : ce fichier ne fait que nommer le monde.
 */
export default class World1Scene extends WorldScene {
  constructor() {
    super(SCENES.WORLD_1, WORLD_MAPS.world_1.key, WORLD_MAPS.world_1.path);
  }
}
