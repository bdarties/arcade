// chargement des librairies
import chargement from "./js/chargement.js";
import menu from "./js/menu.js";
import jeu from "./js/jeu.js";
import fin from "./js/fin.js";

// configuration générale du jeu
var config = {
  width: 1280, // largeur en pixels
  height: 720, // hauteur en pixels
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: "game-container",
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    // définition des parametres physiques
    default: "arcade", // mode arcade : le plus simple : des rectangles pour gérer les collisions. Pas de pentes
    arcade: {
      // parametres du mode arcade
      gravity: {
        y: 0
      },
      debug: false // permet de voir les hitbox et les vecteurs d'acceleration quand mis à true
    }
  },
  roundPixels: true,
  render: { antialiasGL: false, powerPreference: "high-performance" },
  scene: [chargement, menu, jeu, fin],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, "")
};

// création et lancement du jeu
export var game = new Phaser.Game(config);
game.scene.start("chargement");
