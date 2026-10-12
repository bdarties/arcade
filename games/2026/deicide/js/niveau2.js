// niveau2.js : le niveau 2, horizontal : une fuite. Le Soldat de la Lumière enragé poursuit le robot (poursuite.js) ; il faut courir et dasher.
// C'est le même niveau que le niveau 1 (voir niveau1.js : robot, ennemis, lumière, pause, mort) avec une autre config. La map est dessinée dans Tiled
// (assets/maps/niveau2.json, voir assets/maps/LISEZ-MOI.md) : trous à franchir en dashant (vide.js), faisceaux de lumière à traverser au bon moment
// (faisceaux.js), ennemis, et le mur de lumière + le boss qui poursuivent (poursuite.js).
// Arriver au bout de la map termine la partie : le chrono s'arrête et l'écran de classement s'ouvre.
import niveau1, { CONFIG_NIVEAU1, objetsDe } from "./niveau1.js";
import { VOLUME_MUSIQUE_BOSS } from "./sons.js";
import { preparerVide, majVide } from "./vide.js";
import { preparerFaisceaux, majFaisceaux } from "./faisceaux.js";
import { preparerPoursuite, majPoursuite, finirPoursuite } from "./poursuite.js";
import { finDeLaFuite } from "./points.js"; // fin de partie : arrête le chrono, bonus, classement

function creerNiveau2(scene) { // appelée une fois, à la fin du create du niveau
  preparerVide(scene);
  preparerFaisceaux(scene, objetsDe(scene.carte, "faisceau").map((point) => point.x).sort((a, b) => a - b)); // un faisceau par point du calque "faisceau" de Tiled
  const fin = objetsDe(scene.carte, "fin")[0]; // le point d'arrivée posé dans Tiled ; sinon, 100 px avant le bord droit de la map
  scene.xFin = fin ? fin.x : scene.carte.widthInPixels - 100;
  preparerPoursuite(scene);
}

function majNiveau2(scene) { // appelée à chaque image
  majVide(scene);
  majFaisceaux(scene);
  majPoursuite(scene);
  if (!scene.partieFinie && scene.player.x > scene.xFin) { // le robot a atteint la sortie : il a réussi à fuir
    finirPoursuite(scene); // le mur et le boss s'effacent
    finDeLaFuite(scene, scene.player.x, scene.player.y - 80); // bonus, chrono arrêté, puis le classement (2 s plus tard)
    scene.time.delayedCall(1400, () => scene.cameras.main.fadeOut(500, 0, 0, 0)); // fondu au noir avant l'écran de fin
  }
}

const CONFIG_NIVEAU2 = {
  ...CONFIG_NIVEAU1,
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

export default class niveau2 extends niveau1 {
  constructor() {
    super("niveau2", CONFIG_NIVEAU2);
  }
}
