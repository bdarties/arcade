// niveau1.js : le niveau 1 : on monte la tour (la map fait 1280 x 6400 px). Il se termine par l'arène du Dieu de la Lumière (mecanismes/arene.js).
// Tout le fonctionnement (robot, ennemis, lumière, pause, mort) est dans niveau.js : ici il n'y a que ce qui est propre à ce niveau.
import niveau from "./niveau.js";
import { verifierArene } from "../mecanismes/arene.js";
import { SALLES_NIVEAU1 } from "../mecanismes/salles.js";

// Des fonctions (scene) => ... appelées à chaque création du niveau 1 : c'est par là que la partie 2 se branche (la fuite après le boss, voir partie2/fuite.js).
// Vide si la partie 2 n'est pas installée.
export const EXTENSIONS_NIVEAU1 = [];

const CONFIG_NIVEAU1 = {
  carte: "carte_niveau1", // la clé de la map Tiled (chargée dans systemes/chargement.js)
  depart: { x: 200, y: 6300 }, // où apparaît le robot : en bas de la tour
  musique: "musique_niveau", // la musique du niveau
  salles: SALLES_NIVEAU1, // les salles de combat fermées (voir mecanismes/salles.js)
  arene: verifierArene, // appelée à chaque image : ferme l'arène du boss quand le robot y arrive
  departArene: { x: 300, y: 760 }, // où le robot réapparaît s'il meurt contre le boss : dans l'arène, pas en bas de la tour (voir niveau.js, mourir)
  teleportBoss: { x: 300, y: 760 }, // touche F8 (test) : téléporte le robot dans l'arène du boss
  extensions: EXTENSIONS_NIVEAU1 // ce que la partie 2 ajoute au niveau
};

export default class niveau1 extends niveau {
  constructor() {
    super("niveau1", CONFIG_NIVEAU1);
  }
}
