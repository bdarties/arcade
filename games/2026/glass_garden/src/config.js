import PreloadScene from './scenes/PreloadScene.js';
import MenuScene from './scenes/MenuScene.js';
import HubScene from './scenes/HubScene.js';
import World1Scene from './scenes/World1Scene.js';
import UIScene from './scenes/UIScene.js';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './utils/constants.js';

// * Configuration Phaser. La résolution est celle de la borne d'arcade : 1280 x 720 (16:9).
export default {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.BACKGROUND,
  pixelArt: true, // pas de lissage : on veut des pixels nets
  scale: {
    // * FIT adapte le jeu à la taille de la fenêtre en gardant le ratio 16:9
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // * La physique « arcade » gère les collisions. Pas de gravité : on joue en vue du dessus.
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false, // passer à true pour voir les boîtes de collision pendant le développement
    },
  },
  // * La première scène de la liste est celle qui démarre
  // PreloadScene charge les cartes de tous les mondes, puis démarre le jardin.
  // ? Elle démarre HubScene directement le temps de développer le joueur. Le menu redeviendra la scène suivante.
  scene: [PreloadScene, HubScene, MenuScene, World1Scene, UIScene],
};
