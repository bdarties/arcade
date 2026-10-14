// arene.js : l'arène du Dieu de la Lumière, tout en haut du niveau 1 (appelée à chaque image par niveau1.js : verifierArene)
//  1. Quand le robot arrive au-dessus du grand sol de la ligne 25, la caméra se fige sur l'arène, l'ouverture du sol se referme et le
//    Dieu apparaît.
//  2. Un mur de pierre ferme aussi le côté droit de l'arène (poserMurDroit) : le robot ne peut pas sortir pendant le combat.
// (Si le joueur répond OUI au choix du panthéon, la partie 2 brise ce mur : voir partie2/fuite.js.)
import { faireApparaitreBoss } from "../ennemis/boss.js";
import { creerTextureMur } from "../systemes/dessins.js"; // la texture du mur (dessinée en code)

const HAUT_DU_SOL = 25 * 32; // y du haut du sol de l'arène (ligne 25 de la map Tiled, tuiles de 32 px)

export const COLONNES_MUR = [38, 39]; // le mur de droite de l'arène : les deux dernières colonnes de la map
const LIGNES_MUR = [0, 24]; // de la ligne 0 à la ligne 24 (le sol de l'arène est la ligne 25)

export function verifierArene(scene) { // à appeler dans update() : lance l'arène quand le joueur arrive en haut
    if (scene.areneLancee) return; // l'arène est déjà lancée : on ne refait rien
    if (scene.player.body.bottom > HAUT_DU_SOL) return; // les pieds du joueur sont encore sous le sol de l'arène : il n'est pas arrivé
    scene.areneLancee = true; // on note que l'arène est lancée, pour ne le faire qu'une seule fois
    scene.registry.set("scoreArene", scene.registry.get("score")); // le score en entrant : si le robot meurt ici, il le retrouve (voir niveau.js, mourir)
    const camera = scene.cameras.main; // la caméra du niveau
    camera.stopFollow(); // la caméra arrête de suivre le joueur...
    camera.pan(640, HAUT_DU_SOL - 360 + 32, 800, "Sine.easeInOut"); // ...et glisse en 0,8 s pour cadrer toute l'arène, sol compris
    const mur = scene.carte.createBlankLayer("murArene", scene.tilesets); // nouveau calque vide, de la taille de la map
    for (let colonne = 33; colonne <= 39; colonne++) { // on parcourt les colonnes de l'ouverture, de 33 à 39
        const tuile = colonne % 2 === 1 ? 632 : 631; // colonne impaire = tuile 632, paire = 631, comme le sol à côté
        mur.putTileAt(tuile, colonne, 25); // pose la tuile de sol dans la case (colonne, ligne 25)
    }
    mur.setCollision([631, 632]); // les tuiles 631 et 632 de ce calque deviennent solides
    mur.setDepth(1); // au-dessus du décor mais SOUS le voile (50) : le sol ajouté est assombri comme le reste
    scene.physics.add.collider(scene.player, mur); // le joueur ne peut plus redescendre
    mur.setAlpha(0); // le mur est invisible au départ...
    scene.tweens.add({ targets: mur, alpha: 1, duration: 300 }); // ...et apparaît en 0,3 s
    camera.shake(300, 0.01); // tremblement : on sent que la salle se referme
    poserMurDroit(scene); // le mur de droite, qui ferme l'arène
    scene.areneSolY = HAUT_DU_SOL; // le sol de l'arène : la colonne de lumière du boss tombe jusque-là
    scene.areneCentreX = 640; // le milieu de l'arène : le boss flotte autour
    // le boss apparaît en fondu une fois la caméra en place, en haut de la salle
    scene.time.delayedCall(1000, () => faireApparaitreBoss(scene, 640, HAUT_DU_SOL - 360 + 32 - 80));
}
// ---------------------------------------------------------------------------------------------
// Le mur de droite : posé quand l'arène se ferme (brisé seulement dans la partie 2, quand le Dieu s'enrage)
// ---------------------------------------------------------------------------------------------

export function casesDuMur() {
    const cases = [];
    for (const colonne of COLONNES_MUR) for (let ligne = LIGNES_MUR[0]; ligne <= LIGNES_MUR[1]; ligne++) cases.push([colonne, ligne]);
    return cases;
}


function poserMurDroit(scene) {
    creerTextureMur(scene);
    for (const [colonne, ligne] of casesDuMur()) { // solide dans le calque Gameplay : le robot ne le traverse pas
        const solide = scene.groupe_plateformes.putTileAt(633, colonne, ligne);
        solide.setCollision(true, true, true, true);
    }
    // au-dessus du voile d'ombre (50) : on voit le mur même dans le noir
    const mur = scene.add.image(COLONNES_MUR[0] * 32, 0, "mur_arene").setOrigin(0, 0).setDepth(51).setAlpha(0);
    scene.tweens.add({ targets: mur, alpha: 1, duration: 300 });
    scene.murDroit = mur;
}
