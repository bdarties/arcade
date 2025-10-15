// chargement des librairies
import hud from "./js/hud.js";
import menu from "./js/menu.js";
import selection from "./js/selection.js";
import niveau1 from "./js/niveau1.js";
import niveau2 from "./js/niveau2.js";
import niveau3 from "./js/niveau3.js";
import PauseManager from "./js/pause.js";
import niveau4 from "./js/niveau4.js";
import intro from "./js/intro.js";
import salleporte from "./js/salleporte.js";
import gameover from "./js/gameover.js";
import credits from "./js/credits.js";
import controls from "./js/controls.js";

// configuration générale du jeu
const config = {
  width: 1280,
  height: 720,
  type: Phaser.AUTO,
  antialias: false,
  roundPixels: true,

  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'game-container',
    autoCenter: Phaser.Scale.CENTER_BOTH,
    fullscreenTarget: 'game-container',
    expandParent: true
  },

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false, 
      fps: 60,
      overlapBias: 4
    }
  },

  scene: [hud, menu, credits, controls, intro, gameover, selection, salleporte, niveau1, niveau2, niveau3, niveau4, PauseManager],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, ''),

  pixelArt: true,
  
  fps: {
    target: 60,
  },

  banner: false,

  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    transparent: false,
    clearBeforeRender: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false
  }

};

//let game = null;

  export var game = new Phaser.Game(config);
  game.scene.start("menu");

