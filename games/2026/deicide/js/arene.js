// arene.js : l'arène du boss, tout en haut du niveau 1
// quand le joueur arrive au-dessus du grand sol de la ligne 25, la caméra se fige sur l'arène et un mur de lumière ferme la sortie
import { faireApparaitreBoss } from "./boss.js";
import * as effets from "./effets.js"; // éclats
import { jouerSon } from "./sons.js"; // bruitages // le Dieu de la Lumière apparaît quand l'arène se ferme

const HAUT_DU_SOL = 25 * 32; // y du haut du sol de l'arène (ligne 25 de la map Tiled, tuiles de 32 px)

const COLONNES_MUR = [38, 39]; // le mur de droite de l'arène : les deux dernières colonnes de la map
const LIGNES_MUR = [0, 24]; // de la ligne 0 à la ligne 24 (le sol de l'arène est la ligne 25)

export function verifierArene(scene) { // à appeler dans update() : lance l'arène quand le joueur arrive en haut
    if (scene.fuiteOuverte) { sortirParLaDroite(scene); return; } // le Soldat est enragé et le mur est brisé : on fuit
    if (scene.areneLancee) return; // l'arène est déjà lancée : on ne refait rien
    if (scene.player.body.bottom > HAUT_DU_SOL) return; // les pieds du joueur sont encore sous le sol de l'arène : il n'est pas arrivé
    scene.areneLancee = true; // on note que l'arène est lancée, pour ne le faire qu'une seule fois
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
    poserMurDroit(scene); // le mur de droite, qui se brisera quand le Soldat s'enragera
    scene.areneSolY = HAUT_DU_SOL; // le sol de l'arène : la colonne de lumière du boss tombe jusque-là
    scene.areneCentreX = 640; // le milieu de l'arène : le boss flotte autour
    scene.time.delayedCall(1000, () => faireApparaitreBoss(scene, 640, HAUT_DU_SOL - 360 + 32 - 80)); // le boss apparaît en fondu une fois la caméra en place, en haut de la salle
}
// ---------------------------------------------------------------------------------------------
// Le mur de droite : posé quand l'arène se ferme, brisé quand le Soldat s'enrage (boss.js, enrager)
// ---------------------------------------------------------------------------------------------

function casesDuMur() {
    const cases = [];
    for (const colonne of COLONNES_MUR) for (let ligne = LIGNES_MUR[0]; ligne <= LIGNES_MUR[1]; ligne++) cases.push([colonne, ligne]);
    return cases;
}

function poserMurDroit(scene) {
    const visible = scene.carte.createBlankLayer("murDroit", scene.tilesets); // calque qui montre le mur (le calque Gameplay n'est plus dessiné, voir figerCalques)
    visible.setDepth(1);
    for (const [colonne, ligne] of casesDuMur()) {
        visible.putTileAt(633, colonne, ligne); // même pierre que le sol de l'arène
        const solide = scene.groupe_plateformes.putTileAt(633, colonne, ligne); // et solide : le robot ne le traverse pas
        solide.setCollision(true, true, true, true);
    }
    visible.setAlpha(0);
    scene.tweens.add({ targets: visible, alpha: 1, duration: 300 });
    scene.murDroit = visible;
}

export function casserMurDroit(scene) { // le mur éclate : des éclats, un tremblement, puis la sortie est libre
    if (!scene.murDroit) return;
    for (const [colonne, ligne] of casesDuMur()) scene.groupe_plateformes.removeTileAt(colonne, ligne); // plus solide
    const mur = scene.murDroit;
    scene.murDroit = null;
    scene.cameras.main.shake(500, 0.014);
    scene.cameras.main.flash(250, 255, 235, 200);
    jouerSon(scene, "lanterne"); // verre / pierre qui éclate
    for (let i = 0; i < 6; i++) effets.eclats(scene, 1260, scene.areneSolY - 60 - i * 110, 0xb8aec0, 14, 340); // des éclats tout le long du mur
    scene.tweens.add({ targets: mur, alpha: 0, duration: 350, onComplete: () => mur.destroy() });
    scene.fuiteOuverte = true; // verifierArene surveille maintenant la sortie
    const texte = scene.add.text(640, 90, "FUIS !", { fontFamily: "monospace", fontSize: "34px", color: "#ffb4a8", stroke: "#000000", strokeThickness: 6 }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    scene.tweens.add({ targets: texte, alpha: 0, delay: 1400, duration: 600, onComplete: () => texte.destroy() });
}

function sortirParLaDroite(scene) { // le robot passe là où était le mur : fondu, puis le niveau 2 (la poursuite continue là-bas)
    if (scene.partieFinie || scene.player.x < 1250) return;
    scene.partieFinie = true; // plus de pause ni de dégâts pendant le fondu
    scene.cameras.main.fadeOut(500, 0, 0, 0);
    scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start("niveau2"));
}
