// chargement des librairies
import menu from "./js/menu.js";
import commandes from "./js/commandes.js";
import selection from "./js/selection.js";
import defaite from "./js/defaite.js";
import victoire from "./js/victoire.js";
import histoire from "./js/histoire.js";
import credits from "./js/credits.js";

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

  pixelArt: true,
  antialias: false,
  autoRound: true,
  roundPixels: true,

// ⚙️ Rendu
  powerPreference: 'high-performance', // hint GPU “perf”
  antialias: false,                    // pas de lissage → moins cher
  pixelArt: true,                      // utile si assets pixel → pas de filtrage
  roundPixels: true,                   // évite le subpixel (cache)
  failIfMajorPerformanceCaveat: true,  // refuse les fallback très lents (software)
  clearBeforeRender: true,             // par défaut; garde propre entre frames

  // ⚙️ WebGL batch
  batchSize: 4096,                     // augmente si énormément de sprites
  maxLights: 1,                        // mets 0/1 si tu n’utilises pas le système de lights

  // ⚙️ FPS
  fps: { target: 60, min: 30 },

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


  scene: [menu, commandes, credits, histoire, selection, defaite, victoire],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, '')
};


// création et lancement du jeu
export var game = new Phaser.Game(config);
game.scene.start("menu");
