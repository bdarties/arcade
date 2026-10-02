// chargement des librairies
import chargement from "./js/chargement.js";
import accueil from "./js/accueil.js";
import choix_mode from "./js/choix_mode.js";
import selection from "./js/selection.js";
import niveau1 from "./js/niveau1.js";
import niveau2 from "./js/niveau2.js";
import niveau3 from "./js/niveau3.js";
import niveau_termine from "./js/niveau_termine.js";
import gameover from "./js/gameover.js";

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
      debug: false // mettre true pour voir les hitbox et les vecteurs d'acceleration
    }
  },
  // la PREMIÈRE scène de la liste est celle qui démarre : "chargement", puis "accueil"
  scene: [chargement, accueil, choix_mode, selection, niveau1, niveau2, niveau3, niveau_termine, gameover],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, '')
};


// création et lancement du jeu
export var game = new Phaser.Game(config);
