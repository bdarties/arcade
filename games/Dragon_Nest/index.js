// chargement des librairies
import menu from "./js/menu.js";
import intro from "./js/intro.js"; // ⚡ importer intro
import selection from "./js/selection.js";
import niveau1 from "./js/niveau1.js";
import niveau2 from "./js/niveau2.js";
import niveau3 from "./js/niveau3.js";
import credits from "./js/credits.js";
import controles from "./js/controles.js";
import gameover from "./js/gameover.js"; // ⚡ importer la scène Game Over
import confirmationExit from "/static/js/confirmationExit.js";


// configuration générale du jeu
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
      gravity: { y: 300 },
      debug: true,
    },
  },
  scene: [
    menu,
    intro,
    selection,
    niveau1,
    niveau2,
    niveau3,
    credits,
    controles,
    gameover, // ⚡ ajout de l’écran Game Over
    confirmationExit
  ],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, ""),
};

// création et lancement du jeu
var game = new Phaser.Game(config);
game.scene.start("menu");
