// * Nos fichiers sont des modules : on récupère ce dont on a besoin avec « import ... from '...' ».

import config from './config.js';

// * Point d'entrée : on crée le jeu Phaser avec notre configuration.
// Phaser est chargé avant ce fichier par index.html (variable globale `Phaser`).
const game = new Phaser.Game(config);

// * Le jeu est aussi rangé dans window.game, une variable globale : le lanceur de la borne d'arcade peut en avoir besoin
// (le template du prof déclare `var game`). Dans un module, un simple `var` ne serait PAS visible de l'extérieur.
// ? À confirmer avec le prof ou sur la borne. Sans conséquence si elle n'est pas utilisée.
window.game = game;
