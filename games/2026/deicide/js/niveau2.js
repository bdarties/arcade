// niveau2.js : le niveau 2, horizontal : on traverse la tour de gauche à droite, et le dash devient indispensable
// C'est le même niveau que le niveau 1 (voir niveau1.js : robot, ennemis, lumière, pause, mort) avec une autre config : map plus large que haute,
// trous à franchir en dashant (vide.js), faisceaux de lumière à traverser au bon moment (faisceaux.js), une salle de combat fermée (salles.js).
// À la fin de la map on arrive dans l'arène du Dieu de la Lumière (niveau3.js).
import niveau1, { CONFIG_NIVEAU1 } from "./niveau1.js";
import { SALLES_NIVEAU2 } from "./salles.js";
import { preparerVide, majVide } from "./vide.js";
import { preparerFaisceaux, majFaisceaux } from "./faisceaux.js";

const COLONNES_FAISCEAUX = [196, 202, 208, 214, 220, 226]; // les mêmes que FAISCEAUX_NIVEAU2 dans outils/generer_niveaux.py
const COLONNE_FIN = 277; // en arrivant à cette colonne on passe à l'arène du Dieu

function majNiveau2(scene) { // appelée à chaque image
    majVide(scene);
    majFaisceaux(scene);
    if (!scene.partieFinie && scene.player.x > COLONNE_FIN * 32) { // le robot a atteint la sortie
        scene.partieFinie = true; // plus de pause ni de dégâts pendant le fondu
        scene.cameras.main.fadeOut(600, 0, 0, 0);
        scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start("niveau3"));
    }
}

const CONFIG_NIVEAU2 = {
  ...CONFIG_NIVEAU1, // la musique et le reste sont ceux du niveau 1
  carte: "carte_niveau2",
  fondVide: 0x0c0c0c, // le vide des trous est presque noir
  depart: { x: 96, y: 19 * 32 }, // le robot apparaît sur le sol de gauche
  salles: SALLES_NIVEAU2,
  creer: (scene) => { preparerVide(scene); preparerFaisceaux(scene, COLONNES_FAISCEAUX); },
  arene: majNiveau2,
  teleportBoss: { x: 8500, y: 600 } // touche F8 (test) : téléporte le robot à la fin du niveau
};

export default class niveau2 extends niveau1 {
  constructor() {
    super("niveau2", CONFIG_NIVEAU2);
  }
}
