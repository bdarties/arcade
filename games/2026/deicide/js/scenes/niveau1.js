// niveau1.js : le niveau 1 : on monte la tour (la map fait 1280 x 6400 px). Il se termine par l'arène du Soldat de la Lumière (mecanismes/arene.js).
// Tout le fonctionnement (robot, ennemis, lumière, pause, mort) est dans niveau.js : ici il n'y a que ce qui est propre à ce niveau.
import niveau from "./niveau.js";
import { verifierArene } from "../mecanismes/arene.js";
import { SALLES_NIVEAU1 } from "../mecanismes/salles.js";

const CONFIG_NIVEAU1 = {
  carte: "carte_niveau1", // la clé de la map Tiled (chargée dans systemes/chargement.js)
  depart: { x: 200, y: 6300 }, // où apparaît le robot : en bas de la tour
  musique: "musique_niveau", // la musique du niveau
  salles: SALLES_NIVEAU1, // les salles de combat fermées (voir mecanismes/salles.js)
  arene: verifierArene, // appelée à chaque image : ferme l'arène du boss quand le robot y arrive
  teleportBoss: { x: 300, y: 760 } // touche F8 (test) : téléporte le robot dans l'arène du boss
};

export default class niveau1 extends niveau {
  constructor() {
    super("niveau1", CONFIG_NIVEAU1);
  }
}
