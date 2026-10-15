import WorldScene from './WorldScene.js';
import { SCENES, WORLD_MAPS } from '../utils/constants.js';

/**
 * * Monde 4 : l'apocalypse.
 * Des caisses à casser au tir : l'étoile est cachée dans l'une d'elles, et certaines cachent une bombe.
 * Tout vient des objets posés dans sa carte (voir WORLD_MAPS dans constants.js), gérés par WorldScene : ce fichier ne fait que nommer le monde.
 */
export default class World4Scene extends WorldScene {
  constructor() {
    super(SCENES.WORLD_4, WORLD_MAPS.world_4.key, WORLD_MAPS.world_4.path);
  }
}
