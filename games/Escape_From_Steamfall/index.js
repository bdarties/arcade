// chargement des librairies
import selection from "./js/selection.js";
import niveau1 from "./js/niveau1.js";
import niveau2 from "./js/niveau2.js";
import niveau3 from "./js/niveau3.js";

// configuration générale du jeu
var config = {
  width: 1280,
  height: 720,
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'game-container',
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: true
    }
  },
  scene: [selection, niveau1, niveau2, niveau3],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, '')
};

let game = null;

// On attend le clic sur le bouton Start
document.getElementById("startButton").addEventListener("click", () => {
  // Masquer le menu
  document.getElementById("menu").style.display = "none";
  // Afficher le jeu
  document.getElementById("game-container").style.display = "block";

  // Créer et lancer le jeu
  game = new Phaser.Game(config);
  game.scene.start("selection");
});
