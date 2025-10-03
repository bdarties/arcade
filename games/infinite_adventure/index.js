import MenuScene from "./js/menuscene.js";
import OptionsScene from "./js/optionsscene.js";
import GameScene from "./js/gamescene.js";
import UiScene from "./js/uiscene.js";
import StoryScene from "./js/storyscene.js";

var config = {
  type: Phaser.AUTO,
  width: 1280, 
  height: 720, 
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'game-container',
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: [MenuScene, OptionsScene, StoryScene, GameScene, UiScene],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, '')
};

export var game = new Phaser.Game(config);