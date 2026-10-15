// Nous ne présentons que la PARTIE 1 (js/partie1/) : le jeu jusqu'à la fin du premier boss. C'est sur elle que s'est concentrée notre compréhension du code.
// Nous ne souhaitons pas soumettre la partie 2 (js/partie2/) à l'évaluation : elle est uniquement présente pour améliorer la rejouabilité du jeu sur la borne
// (un jeu plus difficile et plus de contenu), suite à la demande de Nicolas Maurin. Elle s'ajoute par installerPartie2() et on peut la retirer.
// RETIRER LA PARTIE 2 (elle est indépendante) : supprimer le dossier js/partie2/, puis dans CE fichier la ligne « import ... from ./js/partie2/index.js »,
// l'appel installerPartie2(), l'appel activerTestsPartie2(game) et « ...scenesPartie2 » dans la liste des scènes. Rien d'autre : la partie 1 ne l'importe jamais.
// index.js : le point de départ du jeu (chargé par index.html). Il règle Phaser (taille, physique, cadence d'images, rendu pour la borne),
// donne la liste des scènes (les écrans du jeu, dans js/partie1/scenes/) et lance le jeu. La première scène de la liste, le menu, démarre toute seule.

// les scènes du jeu et les outils
import "./js/donnees.js"; // la sauvegarde des données (le panthéon) : lireDonneesJSON et ecrireDonneesJSON, voir js/donnees.js
import { MONDE } from "./js/partie1/parametres.js"; // les chiffres de réglage du jeu (gravité, cadence...)
import { compteurImages, regulerCadence } from "./js/partie1/systemes/optimisation.js";
import menu from "./js/partie1/scenes/menu.js";
import niveau1 from "./js/partie1/scenes/niveau1.js";
import { installerPartie2, scenesPartie2, activerTestsPartie2 } from "./js/partie2/index.js"; // la suite du jeu (fuite, dernier combat) : à retirer pour s'arrêter à la fin du 1er boss
import versus from "./js/partie1/scenes/versus.js"; // le mode 1 contre 1
import pantheon from "./js/partie1/scenes/pantheon.js"; // choix « entrer dans le panthéon » avant la phase 2 du dernier boss
import pause from "./js/partie1/scenes/pause.js"; // menu pause : réglages et crédits (posé par-dessus le niveau)
import { activerRaccourcis } from "./js/partie1/systemes/raccourcis.js"; // reset de la borne (C + F maintenus) et touches de test (F4, F8)
import credits from "./js/partie1/scenes/credits.js"; // les crédits, après le panthéon
import classement from "./js/partie1/scenes/classement.js"; // écran de fin : temps, saisie du nom et top 10 de la borne

const IMAGES_PAR_SECONDE = MONDE.imagesParSeconde; // le jeu est bloqué à ce nombre d'images par seconde (réglé dans parametres.js).
// Un écran de 60 Hz affiche 60 images par seconde. Quand le chiffre ci-dessus divise 60 (60, 30, 20), le jeu saute simplement
// une image d'écran sur deux (sur trois...) : toutes les images durent exactement le même temps. Sinon (40, 25...), il est cadencé
// par une minuterie, ce qui donne bien la bonne moyenne mais des durées d'image un peu inégales à l'écran.
const SUIT_L_ECRAN = 60 % IMAGES_PAR_SECONDE === 0;

// configuration générale du jeu
const config = {
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
        y: MONDE.gravite // gravité verticale (réglée dans parametres.js)
      },
      debug: false, // permet de voir les hitbox et les vecteurs d'acceleration quand mis à true
      // la profondeur (en px) jusqu'à laquelle un corps qui s'enfonce dans une tuile est remis dessus. Par défaut 16 : à 900 px/s en chute
      // libre, le robot avance de 22 px par image (25 ms) et traversait les plateformes ou s'enfonçait dans le sol. 48 couvre une image
      // jusqu'à 53 ms.
      tileBias: 48,
      // la physique avance du temps réellement écoulé à chaque image (au lieu de pas fixes de 1/60 s) : quand la borne tombe sous 60 images
      // par seconde, le robot et la caméra avancent régulièrement au lieu de saccader (une image sur trois faisait deux pas d'un coup)
      fixedStep: false
    }
  },
  fps: {
    target: IMAGES_PAR_SECONDE, // durée visée d'une image (33 ms pour 30)
    // suit l'écran : une image du jeu dès que le temps écoulé atteint la durée voulue (7 % de marge, sinon une image d'écran un peu courte
    // ferait sauter une image de trop)
    limit: SUIT_L_ECRAN ? Math.round(IMAGES_PAR_SECONDE * 1.07) : 0,
    forceSetTimeOut: !SUIT_L_ECRAN, // sinon, cadencé par une minuterie plutôt que par l'écran
    min: 25 // en dessous de 25 images par seconde le jeu ralentit au lieu de faire des pas trop grands (un tir ou le robot ne traverse pas un mur)
  },
  render: { // réglages du rendu pour la borne (Raspberry Pi 3)
    // pas de lissage MSAA du canvas : lourd pour la carte graphique d'un Pi 3, et sans effet visible ici (tout est aligné sur les pixels)
    antialiasGL: false,
    powerPreference: "high-performance", // demande au navigateur la carte graphique la plus rapide
    // le shader de Phaser choisit, pour chaque pixel, parmi 16 images possibles : sur un Pi 3 c'est lourd. Avec 4 il est bien plus court
    // (voir optimisation.js)
    maxTextures: 4
  },
  scene: [menu, niveau1, ...scenesPartie2, versus, classement, credits, pause, pantheon], // la première scène (le menu) démarre toute seule
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
installerPartie2(); // branche la suite du jeu (ses maps à charger) avant de créer le jeu
export var game = new Phaser.Game(config); // le menu s'affiche, puis le bouton Jouer lance le niveau 1
// identifiant du jeu (comme les autres jeux : posé après la création, Phaser ignorerait cette clé dans config) ; les données du panthéon, elles, sont rangées sous le nom du dossier (voir js/donnees.js)
game.config.idGame = "deicide";
regulerCadence(game, IMAGES_PAR_SECONDE); // corrige la petite dérive de la minuterie pour tomber pile sur la cadence voulue
activerRaccourcis(game); // C + F (P et ;) maintenus 0,5 s : remet le jeu à zéro sans relancer la borne
activerTestsPartie2(game); // F9, F10 et F5 (test : niveau 2, phase 3 et forme finale du dernier boss) : à retirer avec la partie 2
compteurImages(game); // F3 affiche le nombre d'images par seconde (pour mesurer sur la borne)
