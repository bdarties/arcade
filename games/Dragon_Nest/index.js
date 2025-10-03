// chargement des librairies
import menu from "./js/menu.js";
import intro from "./js/intro.js";
import selection from "./js/selection.js";
import niveau1 from "./js/niveau1.js";
import bd1 from "./js/bd1.js";
import niveau2 from "./js/niveau2.js";
import niveau3 from "./js/niveau3.js";
import credits from "./js/credits.js";
import controles from "./js/controles.js";
import gameover from "./js/gameover.js";

// configuration générale du jeu
var config = {
  width: 1280,
  height: 720,
  type: Phaser.AUTO,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: "game-container",
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false, // Mettre à false pour la version finale
    },
  },
  scene: [
    menu,
    intro,
    selection,
    niveau1,
    bd1,
    niveau2,
    niveau3,
    credits,
    controles,
    gameover,
  ],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, ""),
};

// création et lancement du jeu
export var game = new Phaser.Game(config);