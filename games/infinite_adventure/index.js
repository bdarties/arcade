import MenuScene from "./js/MenuScene.js";
import OptionsScene from "./js/OptionsScene.js";
import UiScene from "./js/UiScene.js";
import GameScene from "./js/GameScene.js";

var config = {
  width: 1280,
  height: 720,
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: "game-container",
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [MenuScene, OptionsScene, GameScene, UiScene],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, ""),
};

// création et lancement du jeu
var game = new Phaser.Game(config);
game.scene.start("MenuScene");
