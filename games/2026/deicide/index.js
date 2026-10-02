// chargement des librairies
import niveau1 from "./js/niveau1.js";
import niveau2 from "./js/niveau2.js";
import niveau3 from "./js/niveau3.js";

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
  render: { // réglages du rendu pour la borne (Raspberry Pi 3)
    antialiasGL: false, // pas de lissage MSAA du canvas : lourd pour la carte graphique d'un Pi 3, et sans effet visible ici (tout est aligné sur les pixels)
    powerPreference: "high-performance" // demande au navigateur la carte graphique la plus rapide
  },
  scene: [niveau1, niveau2, niveau3],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, '')
};


// création et lancement du jeu
export var game = new Phaser.Game(config);
game.scene.start("niveau1"); // le joueur arrive directement dans le niveau 1
