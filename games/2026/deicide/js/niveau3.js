// niveau3.js : l'arène du dernier combat : le Soldat de la Lumière enragé, version 2 (plus fort que dans l'arène du niveau 1)
// Une seule salle, de la taille de l'écran (assets/maps/arene_dieu.json, générée par outils/generer_niveaux.py), comme l'arène du Soldat en haut
// du niveau 1. Le boss apparaît dès qu'on arrive (voir boss.js, profil "soldat2"). Sa mort arrête le chrono et ouvre le classement.
import niveau1, { CONFIG_NIVEAU1 } from "./niveau1.js";
import { faireApparaitreBoss } from "./boss.js";

const HAUT_DU_SOL = 22 * 32; // y du haut du sol de l'arène (ligne 22 de la map)

function lancerArene(scene) { // appelée à chaque image : au premier appel, fige la caméra et fait apparaître le boss
    if (scene.areneLancee) return;
    scene.areneLancee = true;
    const camera = scene.cameras.main;
    camera.stopFollow(); // la caméra cadre toute l'arène : le sol se trouve à 688 px du haut de l'écran, comme dans l'arène du Soldat
    camera.setScroll(0, HAUT_DU_SOL - 688);
    scene.areneSolY = HAUT_DU_SOL; // le sol : les colonnes de lumière du boss tombent jusque-là
    scene.areneCentreX = 640; // le milieu de l'arène : le boss flotte autour
    scene.time.delayedCall(1000, () => faireApparaitreBoss(scene, 640, HAUT_DU_SOL - 408, "soldat2"));
}

const CONFIG_NIVEAU3 = {
  ...CONFIG_NIVEAU1,
  carte: "carte_arene_dieu",
  depart: { x: 200, y: HAUT_DU_SOL - 60 },
  salles: [], // pas de salle de combat ici
  arene: lancerArene,
  teleportBoss: { x: 300, y: HAUT_DU_SOL - 60 }
};

export default class niveau3 extends niveau1 {
  constructor() {
    super("niveau3", CONFIG_NIVEAU3);
  }
}
