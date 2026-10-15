// ⚠ PARTIE 2 : HORS ÉVALUATION. Cette partie n'est pas à prendre en compte dans la partie évaluée (qui est la partie 1, dans js/partie1/).
// Elle a été ajoutée à la fin, uniquement pour rendre le jeu plus intéressant sur la borne et répondre à la demande de Nicolas Maurin :
// rendre le jeu plus difficile et ajouter du contenu. Voir js/partie2/lisez-moi.md.
// RETIRABLE : cette partie est indépendante. Supprimer ce dossier et les 4 références dans index.js (voir js/partie2/lisez-moi.md) : le jeu marche sans elle.
// niveau2.js : le niveau 2, horizontal : une fuite. Le Dieu de la Lumière enragé poursuit le robot (poursuite.js) ; il faut courir et dasher.
// C'est le même niveau que le niveau 1 (voir niveau_de_base.js : robot, ennemis, lumière, pause, mort) avec une autre config. La map est dessinée dans Tiled
// (assets/maps/niveau2.json, voir assets/maps/lisez-moi.md) : trous à franchir en dashant (vide.js), faisceaux de lumière à traverser au bon moment
// (faisceaux.js), ennemis, et le mur de lumière + le boss qui poursuivent (poursuite.js).
// Arriver au bout de la map mène à l'arène du dernier combat (niveau3.js).
import niveau from "../partie1/scenes/niveau_de_base.js";
import { objetsDe } from "../partie1/systemes/chargement.js";
import { VOLUME_MUSIQUE_BOSS } from "../partie1/systemes/sons.js";
import { preparerVide, majVide } from "./vide.js";
import { preparerFaisceaux, majFaisceaux } from "./faisceaux.js";
import { montrerAstuceDash } from "./astuce.js"; // rappel du dash (bouton E)
import { preparerPoursuite, majPoursuite, finirPoursuite } from "./poursuite.js";

function creerNiveau2(scene) { // appelée une fois, à la fin du create du niveau
  preparerVide(scene);
  // un faisceau par point du calque "faisceau" de Tiled
  preparerFaisceaux(scene, objetsDe(scene.carte, "faisceau").map((point) => point.x).sort((a, b) => a - b));
  const fin = objetsDe(scene.carte, "fin")[0]; // le point d'arrivée posé dans Tiled ; sinon, 100 px avant le bord droit de la map
  scene.xFin = fin ? fin.x : scene.carte.widthInPixels - 100;
  preparerPoursuite(scene);
  montrerAstuceDash(scene); // le dash est indispensable ici : on le rappelle une fois
}

function majNiveau2(scene) { // appelée à chaque image
  majVide(scene);
  majFaisceaux(scene);
  majPoursuite(scene);
  if (!scene.partieFinie && scene.player.x > scene.xFin) { // le robot a atteint la sortie : il a réussi à fuir
    scene.partieFinie = true; // plus de pause ni de dégâts pendant le fondu
    finirPoursuite(scene); // le mur et le boss s'effacent
    scene.cameras.main.fadeOut(600, 0, 0, 0);
    scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start("niveau3"));
  }
}

const CONFIG_NIVEAU2 = {
  carte: "carte_niveau2",
  depart: { x: 96, y: 19 * 32 }, // utilisé seulement si la map n'a pas de calque "depart"
  fondVide: 0x0c0c0c, // le vide des trous est presque noir
  musique: "musique_boss_boucle", // le metal continue pendant la fuite
  volumeMusique: VOLUME_MUSIQUE_BOSS,
  salles: [], // pas de salle fermée : on ne peut pas s'arrêter pendant la poursuite
  creer: creerNiveau2,
  arene: majNiveau2,
  teleportBoss: { x: 8500, y: 600 } // touche F8 (test) : téléporte le robot loin dans le niveau
};

export default class niveau2 extends niveau {
  constructor() {
    super("niveau2", CONFIG_NIVEAU2);
  }
}
