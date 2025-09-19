import MenuScene from "./MenuScene.js";
import OptionsScene from "./OptionsScene.js";
import GameScene from "./GameScene.js";
import UiScene from "./UiScene.js";

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    pixelArt: true,
    physics: {
        default: "arcade",
        arcade: {
            debug: false,
        },
    },
    scene: [MenuScene, OptionsScene, GameScene, UiScene], 
};

const game = new Phaser.Game(config);

game.scene.start("MenuScene");

window.addEventListener("resize", () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});