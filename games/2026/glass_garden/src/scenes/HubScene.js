import WorldScene from './WorldScene.js';
import { SCENES, WORLD_MAPS } from '../utils/constants.js';

/**
 * * Le jardin du spawn : le monde normal, d'où partent les miroirs.
 * Tout le comportement vient de WorldScene : cette scène indique seulement quelle carte afficher
 * (sa carte est décrite dans WORLD_MAPS, dans constants.js).
 */
export default class HubScene extends WorldScene {
  constructor() {
    super(SCENES.HUB, WORLD_MAPS.hub.key, WORLD_MAPS.hub.path);
  }
}
