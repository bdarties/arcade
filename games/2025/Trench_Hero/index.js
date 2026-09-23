// chargement des librairies
import selection from "./js/selection.js";
import niveau2 from "./js/niveau2.js";
import niveau3 from "./js/niveau3.js";
import menu from "./js/menu.js";
import transition1 from "./js/transition1.js";
import transition2 from "./js/transition2.js";
import transition3 from "./js/transition3.js";
import mode1vs1 from "./js/1vs1.js";
import victoire from "./js/victoire.js";


// configuration générale du jeu
var config = {
  width: 1280, // largeur en pixels
  height: 720, // hauteur en pixels
  pixelArt: true,
  roundPixels: true, // IMPORTANT: arrondit les positions des pixels
  antialias: false  ,  // IMPORTANT: désactive l'antialiasing
  
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
  scene: [menu,mode1vs1, transition1, selection, transition2, niveau2, transition3,  niveau3, victoire],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, '')
};

// création et lancement du jeu
export var game = new Phaser.Game(config);
game.scene.start("menu");