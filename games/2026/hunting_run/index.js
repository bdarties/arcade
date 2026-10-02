// chargement des scènes
import accueil from "./js/accueil.js";
import menu from "./js/menu.js";
import histoire from "./js/histoire.js";
import jeu from "./js/jeu.js";
import fin from "./js/fin.js";

// configuration générale du jeu
var config = {
  width: 1280, // largeur en pixels
  height: 720, // hauteur en pixels
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 800},
      debug: false
    }
  },
  scene: [accueil, menu, histoire, jeu, fin], // accueil (Play) -> menu (solo / duo) -> histoire -> jeu -> fin
  baseURL: window.location.pathname.replace(/\/[^/]*$/, "")
};

// création et lancement du jeu
new Phaser.Game(config);
