// arene.js : l'arène du boss, tout en haut du niveau 1
// quand le joueur arrive au-dessus du grand sol de la ligne 25, la caméra se fige sur l'arène et un mur de lumière ferme la sortie
import { faireApparaitreBoss } from "./boss.js";
import * as effets from "./effets.js"; // éclats
import { jouerSon } from "./sons.js"; // bruitages // le Soldat de la Lumière apparaît quand l'arène se ferme

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

// La texture du mur : de grosses briques de pierre claire, avec un liseré chaud sur le bord intérieur (côté arène) pour qu'il se voie dans le noir
function creerTextureMur(scene) {
    if (scene.textures.exists("mur_arene")) return;
    const largeur = 64, hauteur = 800;
    const texture = scene.textures.createCanvas("mur_arene", largeur, hauteur);
    const ctx = texture.getContext();
    ctx.fillStyle = "#3b3640"; ctx.fillRect(0, 0, largeur, hauteur); // le fond des joints
    for (let y = 0, rang = 0; y < hauteur; y += 32, rang++) { // des briques de 64 x 32 : une rangée sur deux décalée de la moitié
        for (let x = (rang % 2 ? -32 : 0); x < largeur; x += 64) {
            ctx.fillStyle = (rang * 7 + x) % 3 === 0 ? "#6d6676" : "#5f5968";
            ctx.fillRect(x + 2, y + 2, 60, 28);
            ctx.fillStyle = "rgba(255,255,255,0.10)"; ctx.fillRect(x + 2, y + 2, 60, 4); // le haut de la brique est plus clair
        }
    }
    ctx.fillStyle = "rgba(255,190,120,0.55)"; ctx.fillRect(0, 0, 5, hauteur); // le liseré chaud, à gauche
    texture.refresh();
}

function poserMurDroit(scene) {
    creerTextureMur(scene);
    for (const [colonne, ligne] of casesDuMur()) { // solide dans le calque Gameplay : le robot ne le traverse pas
        const solide = scene.groupe_plateformes.putTileAt(633, colonne, ligne);
        solide.setCollision(true, true, true, true);
    }
    const mur = scene.add.image(COLONNES_MUR[0] * 32, 0, "mur_arene").setOrigin(0, 0).setDepth(51).setAlpha(0); // au-dessus du voile d'ombre (50) : on voit le mur même dans le noir
    scene.tweens.add({ targets: mur, alpha: 1, duration: 300 });
    scene.murDroit = mur;
}

// Le Soldat enragé détruit le mur, en plusieurs temps bien visibles : il charge une boule d'énergie, tire un rayon sur le mur, le mur s'embrase puis éclate.
// `boss` : le sprite du Soldat. Le robot peut bouger pendant ce temps ; la sortie ne s'ouvre qu'à l'explosion.
export function briserMurDroit(scene, boss) {
    if (!scene.murDroit) return;
    const mur = scene.murDroit;
    const xMur = COLONNES_MUR[0] * 32;
    const y = boss.y;
    // 1. la charge : une boule rouge-orangé qui grossit devant le boss (0,7 s)
    jouerSon(scene, "mage_incante");
    const boule = scene.add.image(boss.x + 140, y, "halo").setTint(0xff7a40).setBlendMode(Phaser.BlendModes.ADD).setDepth(52).setScale(0.1);
    scene.tweens.add({ targets: boule, scale: 1.7, duration: 700, ease: "Quad.In" });
    scene.cameras.main.shake(700, 0.006);
    scene.time.delayedCall(700, () => {
        // 2. le rayon : une bande de lumière du boss jusqu'au mur
        jouerSon(scene, "dash");
        boule.destroy();
        const rayon = scene.add.rectangle((boss.x + 140 + xMur) / 2, y, xMur - boss.x - 140, 70, 0xffd0a0, 0.95).setBlendMode(Phaser.BlendModes.ADD).setDepth(52);
        scene.tweens.add({ targets: rayon, alpha: 0, scaleY: 0.2, duration: 450, ease: "Quad.In", onComplete: () => rayon.destroy() });
        scene.cameras.main.flash(150, 255, 220, 180);
        mur.setTint(0xff9a60); // le mur rougeoie à l'endroit touché
        effets.eclats(scene, xMur, y, 0xffc080, 18, 360);
        scene.time.delayedCall(450, () => casserMurDroit(scene)); // 3. l'explosion
    });
}

function casserMurDroit(scene) { // le mur éclate : gros éclats de pierre, flash, tremblement ; puis la sortie est libre et bien indiquée
    if (!scene.murDroit) return;
    for (const [colonne, ligne] of casesDuMur()) scene.groupe_plateformes.removeTileAt(colonne, ligne); // plus solide
    const mur = scene.murDroit;
    scene.murDroit = null;
    scene.cameras.main.shake(900, 0.02);
    scene.cameras.main.flash(400, 255, 240, 210);
    jouerSon(scene, "lanterne");
    jouerSon(scene, "ennemi_mort");
    mur.destroy();
    const xMur = COLONNES_MUR[0] * 32;
    const hauteur = scene.areneSolY; // le mur va du haut de la map au sol de l'arène
    for (let i = 0; i < 34; i++) { // des morceaux de pierre projetés vers la gauche (dans l'arène) et vers le haut, qui retombent
        const taille = Phaser.Math.Between(12, 34);
        const morceau = scene.add.rectangle(xMur + Phaser.Math.Between(0, 64), Phaser.Math.Between(60, hauteur - 20), taille, taille * Phaser.Math.FloatBetween(0.6, 1), 0x6d6676).setDepth(52);
        morceau.setStrokeStyle(2, 0x2a262e);
        const vx = Phaser.Math.Between(-420, 160);
        const vy = Phaser.Math.Between(-260, 60);
        scene.tweens.add({ targets: morceau, x: morceau.x + vx, angle: Phaser.Math.Between(-360, 360), duration: 1400, ease: "Quad.Out" });
        scene.tweens.add({ targets: morceau, y: { value: morceau.y + vy, duration: 450, ease: "Quad.Out" }, alpha: { value: 0, duration: 500, delay: 1000 },
            onComplete: () => morceau.destroy() });
        scene.tweens.add({ targets: morceau, y: Math.min(hauteur - taille / 2, morceau.y + vy + 380), duration: 900, delay: 450, ease: "Quad.In" });
    }
    for (let i = 0; i < 8; i++) effets.eclats(scene, xMur + 32, 80 + i * (hauteur - 100) / 7, 0xd8d0e0, 14, 380); // de la poussière tout le long du mur
    // la lumière qui entre par l'ouverture, et les flèches vers la droite
    const lumiere = scene.add.rectangle(xMur + 40, hauteur / 2, 130, hauteur, 0xffe6b0, 0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(52);
    scene.tweens.add({ targets: lumiere, alpha: { from: 0.18, to: 0.5 }, duration: 380, yoyo: true, repeat: -1 });
    const fleches = [0, 1, 2].map((i) => scene.add.text(1050 + i * 62, hauteur - 130, ">", { fontFamily: "monospace", fontSize: "88px", color: "#ffd9a0", stroke: "#000000", strokeThickness: 8 }).setOrigin(0.5).setDepth(100));
    fleches.forEach((f, i) => scene.tweens.add({ targets: f, alpha: { from: 0.15, to: 1 }, duration: 260, delay: i * 130, yoyo: true, repeat: -1, repeatDelay: 260 })); // elles clignotent l'une après l'autre : ça « court » vers la droite
    const texte = scene.add.text(640, 90, "FUIS  >>>", { fontFamily: "monospace", fontSize: "48px", color: "#ffb4a8", stroke: "#000000", strokeThickness: 8 }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    scene.tweens.add({ targets: texte, scale: { from: 1, to: 1.12 }, duration: 320, yoyo: true, repeat: -1 });
    scene.elementsFuite = [lumiere, texte, ...fleches]; // supprimés quand on quitte l'arène
    scene.fuiteOuverte = true; // verifierArene surveille maintenant la sortie
}

function sortirParLaDroite(scene) { // le robot passe là où était le mur : fondu, puis le niveau 2 (la poursuite continue là-bas)
    if (scene.partieFinie || scene.player.x < 1250) return;
    scene.partieFinie = true; // plus de pause ni de dégâts pendant le fondu
    (scene.elementsFuite || []).forEach((e) => scene.tweens.add({ targets: e, alpha: 0, duration: 300 })); // la lumière, les flèches et le texte s'effacent
    scene.cameras.main.fadeOut(500, 0, 0, 0);
    scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start("niveau2"));
}
