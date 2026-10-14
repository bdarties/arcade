import { SCENES, WORLDS, WORLD_MAPS } from '../utils/constants.js';
import { computeStarTotals } from '../systems/StarSystem.js';

/**
 * * Première scène du jeu : elle charge les cartes de TOUS les mondes (liste WORLD_MAPS), puis lance le jardin.
 * Ainsi le jeu connaît toutes les cartes dès le départ, même celles des mondes pas encore visités
 * (par exemple pour compter les étoiles de l'ensemble du jeu).
 * Chaque monde charge toujours sa propre carte dans son preload : Phaser ignore un chargement en double.
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENES.PRELOAD);
  }

  preload() {
    Object.values(WORLD_MAPS).forEach(({ key, path }) => this.load.tilemapTiledJSON(key, path));
  }

  create() {
    // ! Un monde de WORLDS sans carte dans WORLD_MAPS (ou l'inverse), ou un fichier introuvable : on prévient tout de suite
    Object.keys(WORLDS).forEach((name) => {
      if (!WORLD_MAPS[name]) console.warn(`[PreloadScene] Le monde « ${name} » n'a pas de carte dans WORLD_MAPS.`);
    });
    Object.entries(WORLD_MAPS).forEach(([name, { key, path }]) => {
      if (!WORLDS[name]) console.warn(`[PreloadScene] La carte « ${name} » n'est pas un monde de WORLDS.`);
      if (!this.cache.tilemap.exists(key)) console.warn(`[PreloadScene] Carte introuvable pour « ${name} » : ${path}`);
    });

    // * Les cartes sont chargées : on peut compter les étoiles de tout le jeu
    computeStarTotals(this.cache.tilemap);

    // TODO(équipe): démarrer MenuScene à la place quand l'écran d'accueil existera
    this.scene.start(SCENES.HUB);
  }
}
