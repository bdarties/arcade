// chargement des librairies
import selection from "./js/selection.js";
import niveau1 from "./js/niveau1.js";
import niveau2 from "./js/niveau2.js";
import niveau3 from "./js/niveau3.js";
import confirmationExit from "/static/js/confirmationExit.js";

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
      debug: true // permet de voir les hitbox et les vecteurs d'acceleration quand mis à true
    }
  },
  scene: [selection, niveau1, niveau2, niveau3, confirmationExit],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, '')
};


// création et lancement du jeu
var game = new Phaser.Game(config);

game.scene.start("selection");


// Ajout d'un écouteur global pour la touche W
window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'w') {
        // Récupère la scène active
        const activeScene = game.scene.scenes.find(scene => 
            scene.scene.settings.active && 
            !scene.scene.key.includes('confirmationExit')
        );
        
        if (activeScene) {
            // Stocke le nom de la scène active
            game.registry.set('previousScene', activeScene.scene.key);
            // Met en pause la scène active
            game.scene.pause(activeScene.scene.key);
            // Lance la scène de confirmation
            game.scene.start('confirmationExit');
        }
    }
});


