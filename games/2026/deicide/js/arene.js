// arene.js : l'arène du boss, tout en haut du niveau 1
// quand le joueur arrive au-dessus du grand sol de la ligne 25, la caméra se fige sur l'arène et un mur de lumière ferme la sortie

const HAUT_DU_SOL = 25 * 32; // y du haut du sol de l'arène (ligne 25 de la map Tiled, tuiles de 32 px)

export function verifierArene(scene) { // à appeler dans update() : lance l'arène quand le joueur arrive en haut
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
}