// Importation des scènes
import menu from "./js/menu.js";
import intro from "./js/intro.js";
import { Selection, Niveau1, Niveau2, Niveau3 } from "./js/levels.js";
import bd1 from "./js/bd1.js";
import credits from "./js/credits.js";
import controles from "./js/controles.js";
import gameover from "./js/gameover.js";

// Configuration générale du jeu
const config = {
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
      gravity: { y: 650 },
      debug: true,
    },
  },
  scene: [
    menu,
    intro,
    Selection,
    Niveau1,
    bd1,
    Niveau2,
    Niveau3,
    credits,
    controles,
    gameover,
  ],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, ""),
};

// Création et lancement du jeu
export const game = new Phaser.Game(config);