// Chargement des librairies et des scènes Phaser
import accueil from "./js/accueil.js";      // Scène d'accueil
import selection from "./js/selection.js";  // Sélection du niveau
import niveau1 from "./js/niveau1.js";      // Niveau 1
import niveau2 from "./js/niveau2.js";      // Niveau 2
import niveau3 from "./js/niveau3.js";      // Niveau 3
import victoire from "./js/victoire.js";    // Écran de victoire
import parametres from "./js/parametres.js";// Paramètres
import controls from "./js/controls.js";    // Contrôles
import credits from "./js/credits.js";      // Crédits

// Variable globale pour la musique de fond
window.globalMusic = null;

// Configuration générale du jeu Phaser
var config = {
  width: 1280,
  height: 720,
  type: Phaser.AUTO,
  scale: {
    parent: 'game-container', // Élément parent dans le HTML
    autoCenter: Phaser.Scale.CENTER_BOTH, // Centrage automatique
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 400 }, // Gravité verticale
      debug: true // Affichage du debug physique
    }
  },
  scene: [
    accueil,      // Scène d'accueil
    selection,    // Sélection du niveau
    niveau1,      // Niveau 1
    niveau2,      // Niveau 2
    niveau3,      // Niveau 3
    victoire,     // Écran de victoire
    parametres,   // Paramètres
    controls,     // Contrôles
    credits       // Crédits
  ],
};

// Création et lancement du jeu
var game = new Phaser.Game(config); // Instancie le jeu avec la config
game.scene.start("accueil"); // Démarre sur accueil.js