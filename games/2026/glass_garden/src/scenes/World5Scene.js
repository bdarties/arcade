import WorldScene from './WorldScene.js';
import { SCENES, WORLD_MAPS } from '../utils/constants.js';

/**
 * * Monde 5 : la magie.
 * Des bulles à éclater (elles se divisent en plus petites) : l'étoile apparaît quand elles le sont toutes.
 * Tout vient des objets posés dans sa carte (voir WORLD_MAPS dans constants.js), gérés par WorldScene : ce fichier ne fait que nommer le monde.
 */
export default class World5Scene extends WorldScene {
  constructor() {
    super(SCENES.WORLD_5, WORLD_MAPS.world_5.key, WORLD_MAPS.world_5.path);
  }
}
