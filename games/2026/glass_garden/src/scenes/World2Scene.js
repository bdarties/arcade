import WorldScene from './WorldScene.js';
import { SCENES, WORLD_MAPS } from '../utils/constants.js';

/**
 * * Monde 2 : le rêve.
 * Des ennemis (le faucheur et la capuche) poursuivent le joueur : il faut les éviter ou les tuer au tir.
 * Tout vient des objets posés dans sa carte (voir WORLD_MAPS dans constants.js), gérés par WorldScene : ce fichier ne fait que nommer le monde.
 */
export default class World2Scene extends WorldScene {
  constructor() {
    super(SCENES.WORLD_2, WORLD_MAPS.world_2.key, WORLD_MAPS.world_2.path);
  }
}
