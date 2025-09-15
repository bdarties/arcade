import menu from "./js/menu.js";
import selection from "./js/selection.js";
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
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600
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
  scene: [menu, selection, niveau1, niveau2, niveau3, niveau4, rules, gameover, gameover2, skin],
  callbacks: {
    postBoot: function (game) {
      // On attend que Phaser soit complètement initialisé
     
      console.log("Scènes disponibles après boot:", game.scene.scenes.map(s => s.scene.key));
     game.scene.start('menu');
    }
  }
};

// création et lancement du jeu
var game = new Phaser.Game(config);

// Initialisation des variables globales
game.config.score = 0;
game.config.skin = 1;

// Pour le debug
console.log("Configuration initiale:", config);


