import Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.esm.js';

// chargement des librairies
import selection from "./js/selection.js";
import menu from "./js/menu.js";
import niveau1 from "./js/niveau1.js";
import niveau2 from "./js/niveau2.js";
import niveau3 from "./js/niveau3.js";
import niveau4 from "./js/niveau4.js";
import rules from "./js/rules.js";
import gameover from "./js/gameover.js";
import skin from "./js/skin.js";
import gameover2 from "./js/gameover2.js";

// configuration générale du jeu
var config = {
  type: Phaser.AUTO,
  width: 800, // largeur en pixels
  height: 600, // hauteur en pixels
   scale: {
        // Or set parent divId here
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
   },
  physics: {
    // définition des parametres physiques
    default: "arcade", // mode arcade : le plus simple : des rectangles pour gérer les collisions. Pas de pentes
    arcade: {
      // parametres du mode arcade
      gravity: {
        y: 300 // gravité verticale : acceleration ddes corps en pixels par seconde
      },
      debug: false // permet de voir les hitbox et les vecteurs d'acceleration quand mis à true
    }
  },
  scene: [menu, selection, niveau1, niveau2, niveau3, niveau4, rules, gameover, skin, gameover2]
};

// création et lancement du jeu
var game = new Phaser.Game(config);
game.scene.start("menu");
game.config.score =0;
game.config.skin =1;
