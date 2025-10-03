// chargement des librairies
import selection from "./js/selection.js";
import niveau2 from "./js/niveau2.js";
import niveau3 from "./js/niveau3.js";
<<<<<<<< HEAD:games/HeroTrench/index.js
import menu from "./js/menu.js";
========
>>>>>>>> 4568b2524a8cf712656d018d79bae6114ed8886d:games/Alvin York/index.js

// configuration générale du jeu
var config = {
  width: 1280, // largeur en pixels
  height: 720, // hauteur en pixels
  pixelArt: true,
<<<<<<<< HEAD:games/HeroTrench/index.js
  roundPixels: true, // IMPORTANT: arrondit les positions des pixels
  antialias: false  ,  // IMPORTANT: désactive l'antialiasing
  
========
  // roundPixels: true, // IMPORTANT: arrondit les positions des pixels
  // antialias: false  ,  // IMPORTANT: désactive l'antialiasing
  render: {
    pixelArt: true,
    antialias: false,
  },
>>>>>>>> 4568b2524a8cf712656d018d79bae6114ed8886d:games/Alvin York/index.js
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: "game-container",
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    // définition des parametres physiques
    default: "arcade", // mode arcade : le plus simple : des rectangles pour gérer les collisions. Pas de pentes
    arcade: {
      // parametres du mode arcade
      gravity: {
        y: 300, // gravité verticale : acceleration ddes corps en pixels par seconde
      },
      debug: true, // permet de voir les hitbox et les vecteurs d'acceleration quand mis à true
    },
  },
<<<<<<<< HEAD:games/HeroTrench/index.js
  scene: [menu, selection, niveau2, niveau3],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, '')
========
  scene: [selection, niveau2, niveau3],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, ""),
>>>>>>>> 4568b2524a8cf712656d018d79bae6114ed8886d:games/Alvin York/index.js
};

// création et lancement du jeu
export var game = new Phaser.Game(config);
<<<<<<<< HEAD:games/HeroTrench/index.js
game.scene.start("menu");
========
game.scene.start("selection");
>>>>>>>> 4568b2524a8cf712656d018d79bae6114ed8886d:games/Alvin York/index.js
