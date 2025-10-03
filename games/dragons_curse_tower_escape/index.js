// chargement des librairies
import hud from "./js/hud.js";
import menu from "./js/menu.js";
import Coffre from "./js/coffre.js";
import selection from "./js/selection.js";
import niveau1 from "./js/niveau1.js";
import niveau2 from "./js/niveau2.js";
import niveau3 from "./js/niveau3.js";
import Inventory from "./js/inventory.js";
import PauseManager from "./js/pause.js";
import niveau4 from "./js/niveau4.js";
import intro from "./js/intro.js";
import credits from "./js/credits.js";
import controls from "./js/controls.js";

// configuration générale du jeu
var config = {
  width: 1280,
  height: 720,
  pixelArt: true,
  roundPixels: true,
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'game-container',
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [hud, menu, credits, controls, intro, selection, niveau1, niveau2, niveau3, niveau4, PauseManager, Inventory, Coffre],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, '')
};

let game = null;

  game = new Phaser.Game(config);
  game.scene.start("menu");

