// chargement des librairies
import accueil from "./js/page_accueil.js";
import credits from "./js/credits.js";
import controles from "./js/controles.js";
import checkpoint1 from "./js/checkpoint1.js";
import selection from "./js/selection.js";
import niveau1 from "./js/niveau1.js";
import checkpoint2 from "./js/checkpoint2.js";
import niveau2 from "./js/niveau2.js";
import niveau3 from "./js/niveau3.js";
import gameover from "./js/game_over.js";
import win from "./js/win.js";



// configuration générale du jeu
var config = {
  width: 1280, // largeur en pixels
  height: 720, // hauteur en pixels
   type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'game-container',
    autoCenter: Phaser.Scale.CENTER_BOTH,
  
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

  scene: [ accueil, controles, credits, checkpoint1, selection, niveau1, checkpoint2, niveau2, niveau3, gameover, win],

  baseURL: window.location.pathname.replace(/\/[^/]*$/, '')
};


// création et lancement du jeu
export var game = new Phaser.Game(config);
game.scene.start("accueil", { config: config });