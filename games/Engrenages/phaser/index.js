// Chargement des librairies et des scènes Phaser
import accueil from "./js/accueil.js";      // Scène d'accueil
import selection from "./js/selection.js";  // Sélection du niveau
import niveau1 from "./js/niveau1.js";      // Niveau 1
import niveau2 from "./js/niveau2.js";      // Niveau 2
import niveau3 from "./js/niveau3.js";      // Niveau 3
import victoire from "./js/victoire.js";    // Écran de victoire
import defaite from "./js/defaite.js";      // Écran de défaite
import parametres from "./js/parametres.js";// Paramètres
import controls from "./js/controls.js";    // Contrôles
import credits from "./js/credits.js";      // Crédits
import pause from "./js/pause.js";          // Scène de pause

// Variable globale pour la musique de fond
window.globalMusic = null;

// Configuration générale du jeu Phaser
var config = {
  width: 1280,
  height: 720,
  type: Phaser.AUTO,
  scale: {
    mode : Phaser.Scale.FIT,
    parent: 'game-container', // Élément parent dans le HTML
    autoCenter: Phaser.Scale.CENTER_BOTH, // Centrage automatique
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 600 }, // Gravité verticale
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
    defaite,      // Écran de défaite
    parametres,   // Paramètres
    controls,     // Contrôles
    credits,       // Crédits
    pause       // Pause
  ],
};

// Création et lancement du jeu
export var game = new Phaser.Game(config); // Instancie le jeu avec la config
game.scene.start("accueil"); // Démarre sur accueil.js

// Gestion de l'overlay (si les éléments existent)
const overlay = document.getElementById('overlay');
const closeBtn = document.getElementById('closeOverlay');

document.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'p' && overlay) {
    overlay.classList.toggle('show');
  }
});

if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    if (overlay) {
      overlay.classList.remove('show');
    }
  });
}
