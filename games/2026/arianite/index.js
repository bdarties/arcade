// chargement des librairies
import accueil from "./js/accueil.js";
import controls from "./js/controls.js";
import credits from "./js/credits.js";
import histoire from "./js/histoire.js";
import exterieur from "./js/exterieur.js";
import toit from "./js/toit.js";
import opera from "./js/opera.js";
import egouts from "./js/egouts.js";
import VersusScene from "./js/versus/VersusScene.js"; // mode arcade 2 joueurs (isolé du mode narratif)
import victory from "./js/victory.js";

// conteneur du jeu (absent de index.html, on le crée ici)
if (!document.getElementById("game-container")) {
  const conteneur = document.createElement("div");
  conteneur.id = "game-container";
  document.body.appendChild(conteneur);
}

// plein écran : styles injectés depuis le JS
const style = document.createElement("style");
style.textContent = `
  html, body {
    margin: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000;
  }
  #game-container {
    width: 100%;
    height: 100%;
  }
`;
document.head.appendChild(style);

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
        y: 600 // gravité verticale : acceleration ddes corps en pixels par seconde
      },
      debug: false // permet de voir les hitbox et les vecteurs d'acceleration quand mis à true
    }
  },
  scene: [accueil, controls, credits, histoire, exterieur, toit, opera, egouts, VersusScene, victory], // accueil en premier = lancée au démarrage
  baseURL: window.location.pathname.replace(/\/[^/]*$/, '')
};

try {
  // Attend le chargement de la police avant de continuer l'exécution du module
  await document.fonts.load('20px "Press Start 2P"', "ARIANITE");
} catch (erreur) {
  console.error("Impossible de charger la police Press Start 2P.", erreur);
}

// Le jeu est créé et exporté uniquement après la résolution (ou l'échec) du chargement
export var game = new Phaser.Game(config);