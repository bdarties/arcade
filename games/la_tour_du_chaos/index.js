import MainScene from './mainScene.js'; // Assure-toi que le chemin est correct
import SecondScene from './SecondScene.js'; // Vérifie également ce chemin
import accueil from './accueil.js';
import controls from './controls.js';
import credits from './credits.js';
import story from './story.js';
import lose from './Lose.js';
import Scene3 from './Scene3.js';
import Scene4 from './Scene4.js';
import Scene5 from './Scene5.js';
import PowerUpScene from './PowerUpScene.js';


const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#028af8o',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [accueil, controls, lose, credits, story, MainScene, SecondScene, Scene3, Scene4, Scene5, PowerUpScene ], // Assurez-vous que le nom de la scène est correct
};

export var game = new Phaser.Game(config);