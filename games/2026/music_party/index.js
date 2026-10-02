// Music Party : 3 mini-jeux musicaux pour la borne d'arcade, en solo ou à deux.

// chargement des scènes (une scène = un fichier du dossier js)
import chargement from "./js/chargement.js";        // charge les images et la musique
import accueil from "./js/accueil.js";              // écran titre
import selection from "./js/selection.js";          // choix du mini-jeu
import menu from "./js/menu.js";                    // solo ou duo
import choix from "./js/choix.js";                  // choix des persos
import music_fall from "./js/music_fall.js";        // mini-jeu Music Fall
import piano_time from "./js/piano_time.js";        // mini-jeu piano Time
import resultats from "./js/resultats.js";          // S cores et gagnant 

// configuration générale du jeu

var config = {
  type: Phaser.AUTO, 
  width: 1280,               // largeur en pixels
  height: 720,               // hauteur en pixels
  backgroundColor: "#140a24",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  
  // pas de moteur physique : les music_falls et les rebonds des notes sont
  // calculés à la main (voir music_fall.js)
  scene: [chargement, accueil, selection, menu, choix, music_fall, piano_time, resultats],
  baseURL: window.location.pathname.replace(/\/[^/]*$/, "")
};

// création et lancement du jeu (la 1re scène de la liste démarre toute seule)
export var game = new Phaser.Game(config);
