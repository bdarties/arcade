// chargement des librairies
import niveau1 from "./js/Niveau1.js";
import niveau2 from "./js/niveau2.js";
import Ecran_score from "./js/Ecran_score.js";
import Game_over from "./js/Game_over.js";
import Menu from "./js/menu.js";

// configuration générale du jeu
var config = {
  width: 1280, // largeur en pixels
  height: 720, // hauteur en pixels
  render:{
    pixelArt : true
  },
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
        y: 0 //on désactive la gravité par ce qu'on a un jeu en vue de desssu. De ce fait, il sera nécésssaire de se deplacer en haut, en bas a gauche et a droite.
      },
      debug: true // permet de voir les hitbox et les vecteurs d'acceleration quand mis à true
    }
  },
  scene: [Menu, niveau1, niveau2, Ecran_score, Game_over],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, '')
};


// création et lancement du jeu
var game = new Phaser.Game(config);
