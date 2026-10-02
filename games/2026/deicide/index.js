// chargement des librairies
import { compteurImages } from "./js/optimisation.js";
import menu from "./js/menu.js";
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
      debug: false, // permet de voir les hitbox et les vecteurs d'acceleration quand mis à true
      fixedStep: false // la physique avance du temps réellement écoulé à chaque image (au lieu de pas fixes de 1/60 s) : quand la borne tombe sous 60 images par seconde, le robot et la caméra avancent régulièrement au lieu de saccader (une image sur trois faisait deux pas d'un coup)
    }
  },
  fps: { min: 25 }, // en dessous de 25 images par seconde le jeu ralentit au lieu de faire des pas trop grands (un tir ou le robot ne traverse pas un mur)
  render: { // réglages du rendu pour la borne (Raspberry Pi 3)
    antialiasGL: false, // pas de lissage MSAA du canvas : lourd pour la carte graphique d'un Pi 3, et sans effet visible ici (tout est aligné sur les pixels)
    powerPreference: "high-performance", // demande au navigateur la carte graphique la plus rapide
    maxTextures: 4 // le shader de Phaser choisit, pour chaque pixel, parmi 16 images possibles : sur un Pi 3 c'est lourd. Avec 4 il est bien plus court (voir optimisation.js)
  },
  scene: [menu, niveau1, niveau2, niveau3], // la première scène (le menu) démarre toute seule
  baseURL: window.location.pathname.replace(/\/[^/]*$/, '')
};


// OPTIMISATION (borne) : on crée nous-mêmes le contexte WebGL, sans tampon de profondeur ni de stencil. Phaser les demande
// toujours, mais ce jeu n'en a pas besoin (aucun masque, tout est dessiné dans l'ordre) : la carte graphique a une grande
// zone de mémoire de moins à effacer et à écrire à chaque image. Si le navigateur refuse, Phaser crée son contexte normal.
const toile = document.createElement("canvas");
const contexte = toile.getContext("webgl", { alpha: false, depth: false, stencil: false, antialias: false, premultipliedAlpha: true, powerPreference: "high-performance", preserveDrawingBuffer: false });
if (contexte) {
  config.canvas = toile;
  config.context = contexte;
  config.type = Phaser.WEBGL; // avec notre propre contexte, Phaser veut qu'on lui dise explicitement que c'est du WebGL
}

// création et lancement du jeu
export var game = new Phaser.Game(config); // le menu s'affiche, puis le bouton Jouer lance le niveau 1
compteurImages(game); // F3 affiche le nombre d'images par seconde (pour mesurer sur la borne)
