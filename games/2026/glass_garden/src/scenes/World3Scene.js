import WorldScene from './WorldScene.js';
import { SCENES, WORLD_MAPS } from '../utils/constants.js';

/**
 * * Monde 3 : l'automne.
 * Un personnage pose une énigme : la bonne réponse fait sauter l'étoile de sa tête.
 * Tout vient des objets posés dans sa carte (voir WORLD_MAPS dans constants.js), gérés par WorldScene : ce fichier ne fait que nommer le monde.
 */
export default class World3Scene extends WorldScene {
  constructor() {
    super(SCENES.WORLD_3, WORLD_MAPS.world_3.key, WORLD_MAPS.world_3.path);
  }
}
