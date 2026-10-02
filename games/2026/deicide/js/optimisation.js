// optimisation.js : réglages pour que le jeu reste fluide sur la borne (un Raspberry Pi 3, très peu puissant)

// Les calques de tuiles de Phaser sont redessinés tuile par tuile à CHAQUE image : plus de 1 200 tuiles dans le niveau 1,
// et c'est le plus gros travail du processeur. Or le décor ne bouge jamais. On le dessine donc UNE SEULE FOIS, au chargement
// du niveau, dans des images en bandes de 512 px de haut (une bande fait 1280 x 512, ce qui reste petit pour une carte
// graphique de Pi 3). À chaque image il ne reste qu'à afficher les 2 ou 3 bandes qu'on voit, au lieu de 1 200 tuiles.
// Le dessin à l'écran est identique : ce sont les mêmes tuiles, aux mêmes endroits, dans le même ordre.
const HAUTEUR_BANDE = 512;
const MARGE = 32; // pixels de marge autour de l'écran avant de cacher une bande (le tremblement d'écran bouge un peu la vue)
const IMAGES_SANS_TRI = 2; // pendant les 2 premières images la caméra n'est pas encore à sa place : on affiche tout

// calques : les calques de la map à figer, dans l'ordre où ils se superposent (le premier est tout au fond).
// Ils restent dans la scène pour les collisions et pour savoir où est le sol, mais ils ne sont plus dessinés.
// À appeler dans create(), juste après avoir créé les calques et AVANT de créer le joueur et les ennemis
// (les bandes doivent se trouver sous eux dans l'ordre d'affichage). Renvoie la liste des bandes.
export function figerCalques(scene, calques, largeur, hauteur) {
    const bandes = [];
    for (let y0 = 0; y0 < hauteur; y0 += HAUTEUR_BANDE) {
        const bande = scene.add.renderTexture(0, y0, largeur, Math.min(HAUTEUR_BANDE, hauteur - y0)); // une zone de dessin de la taille de la bande
        bande.setOrigin(0, 0);
        bande.draw(calques, 0, -y0); // dessine tous les calques dedans, décalés pour que la bonne tranche de la map tombe dans la bande
        bandes.push(bande);
    }
    calques.forEach(calque => calque.setVisible(false)); // les calques ne sont plus dessinés (mais ils servent toujours aux collisions)

    let images = 0;
    const trier = () => { // chaque image : on n'affiche que les bandes qui touchent l'écran
        const camera = scene.cameras.main;
        const haut = camera.scrollY - MARGE;
        const bas = camera.scrollY + camera.height + MARGE;
        images++;
        bandes.forEach(bande => { bande.visible = images <= IMAGES_SANS_TRI || (bande.y < bas && bande.y + bande.height > haut); });
    };
    scene.events.on(Phaser.Scenes.Events.UPDATE, trier);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, trier));
    return bandes;
}
