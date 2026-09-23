// chargement des librairies
/*import selection from "./js/selection.js";*/
import scenario from "./js/scenario.js";
import scenario2 from "./js/scenario2.js";
import niveau1 from "./js/niveau1.js";
import niveauciel from "./js/niveauciel.js";
import niveau3 from "./js/niveau3.js";
import menu from "./js/menu.js";
import commandes from "./js/commande.js";
import credits from "./js/credits.js";  
import pause from "./js/pause.js";
import gameover from "./js/gameover.js";
import gameover2 from "./js/gameover2.js";
import niveauville from "./js/niveauville.js";
import niveau3ciel from "./js/niveau3ciel.js";
import niveau3ville from "./js/niveau3ville.js";


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
  scene: [/*selection,*/menu, commandes, credits, scenario, scenario2, niveau1, niveauciel, niveauville, niveau3, gameover, gameover2, niveau3ciel, niveau3ville,pause], // liste des scenes du jeu
  baseURL: window.location.pathname.replace(/\/[^/]*$/, '')
};


// création et lancement du jeu
export var game = new Phaser.Game(config);
game.scene.start("menu");
game.config.idGame = 244455557;
