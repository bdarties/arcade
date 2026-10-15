// PARTIE 2 : nous ne souhaitons pas soumettre cette partie du code à l'évaluation. Nous ne présentons que la partie 1 (js/partie1/).
// La partie 2 est uniquement présente pour améliorer la rejouabilité du jeu sur la borne (un jeu plus difficile et plus de contenu), suite à la demande
// de Nicolas Maurin. Voir js/partie2/lisez-moi.md.
// RETIRABLE : cette partie est indépendante. Supprimer ce dossier et les 4 références dans index.js (voir js/partie2/lisez-moi.md) : le jeu marche sans elle.
// niveau3.js : l'arène du dernier combat : le Dieu de la Lumière enragé, version 2 (plus fort que dans l'arène du niveau 1)
// Une seule salle, de la taille de l'écran (assets/maps/arene_dieu.json, fichier Tiled), comme l'arène du Dieu en haut
// du niveau 1. Le boss apparaît dès qu'on arrive (voir boss.js, profil "soldat2"). Sa mort arrête le chrono et ouvre le classement.
import niveau from "../partie1/scenes/niveau_de_base.js";
import { faireApparaitreBoss } from "../partie1/ennemis/boss.js";
import { chargerMusiqueDernierBoss } from "./musique.js"; // la musique de ce combat, chargée seulement ici (voir musique.js)

const HAUT_DU_SOL = 22 * 32; // y du haut du sol de l'arène (ligne 22 de la map)

function lancerArene(scene) { // appelée à chaque image : au premier appel, fige la caméra et fait apparaître le boss
    if (scene.areneLancee) return;
    scene.areneLancee = true;
    scene.registry.set("scoreArene", scene.registry.get("score")); // le score en entrant : si le robot meurt ici, il le retrouve (voir niveau_de_base.js, mourir)
    const camera = scene.cameras.main;
    camera.stopFollow(); // la caméra cadre toute l'arène : le sol se trouve à 688 px du haut de l'écran, comme dans l'arène du Dieu
    camera.setScroll(0, HAUT_DU_SOL - 688);
    scene.areneSolY = HAUT_DU_SOL; // le sol : les colonnes de lumière du boss tombent jusque-là
    scene.areneCentreX = 640; // le milieu de l'arène : le boss flotte autour
    scene.time.delayedCall(1000, () => faireApparaitreBoss(scene, 640, HAUT_DU_SOL - 408, "soldat2"));
}

const CONFIG_NIVEAU3 = {
  carte: "carte_arene_dieu",
  musique: "musique_niveau", // (le metal du boss prend le relais quand il apparaît)
  depart: { x: 200, y: HAUT_DU_SOL - 60 },
  salles: [], // pas de salle de combat ici
  arene: lancerArene,
  teleportBoss: { x: 300, y: HAUT_DU_SOL - 60 }
};

export default class niveau3 extends niveau {
  constructor() {
    super("niveau3", CONFIG_NIVEAU3);
  }

  preload() {
    super.preload(); // le reste du jeu est déjà chargé
    chargerMusiqueDernierBoss(this); // la musique du dernier boss (rien à faire si elle est déjà chargée)
  }
}
