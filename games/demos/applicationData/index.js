import "./js/donnees.js";
import menu from "./js/menu.js";
import ajouter from "./js/ajouter.js";
import lire from "./js/lire.js";

var config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: "game-container",
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  backgroundColor: "#101020",
  scene: [menu, ajouter, lire],
};

export var game = new Phaser.Game(config);
