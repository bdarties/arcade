// optimisation.js : réglages pour que le jeu reste fluide sur la borne (un Raspberry Pi 3, très peu puissant)

// 1. Le décor figé -------------------------------------------------------------------------------------------------------
// Les calques de tuiles de Phaser sont redessinés tuile par tuile à CHAQUE image : plus de 1 200 tuiles dans le niveau 1,
// et c'est le plus gros travail du processeur. Or le décor ne bouge jamais. On le dessine donc UNE SEULE FOIS, au chargement
// du niveau, dans des images en bandes de 512 px de haut (une bande fait 1280 x 512, ce qui reste petit pour une carte
// graphique de Pi 3). À chaque image il ne reste qu'à afficher les 2 ou 3 bandes qu'on voit, au lieu de 1 200 tuiles.
// Le dessin à l'écran est identique : ce sont les mêmes tuiles, aux mêmes endroits, dans le même ordre.
//
// 2. Le shader le plus simple pour les grandes images -------------------------------------------------------------------
// Phaser dessine tout avec un "shader" qui, pour CHAQUE pixel, doit d'abord chercher dans laquelle des images (textures)
// qu'il peut utiliser (16 par défaut) se trouve le pixel à lire. Sur la carte graphique d'un Pi 3, ce choix coûte bien plus
// cher que le reste. Les bandes du décor et le voile d'obscurité couvrent tout l'écran (1,8 million de pixels à chaque
// image), et les halos sont de grosses taches : ils n'ont qu'une seule image à lire. On leur donne donc le shader
// "SinglePipeline" de Phaser, qui lit directement la bonne image sans chercher. Le dessin est identique.
// (Le reste, petit, garde le shader normal, réglé sur 4 images au lieu de 16 dans index.js.)
//
// 3. Les ennemis qui dorment --------------------------------------------------------------------------------------------
// Les ennemis ne repèrent le joueur qu'à moins de 400 px : ceux qui sont loin ne font rien. On les endort (plus de physique,
// plus d'animation, plus de test) tant que le joueur est à plus d'un écran d'eux.
const HAUTEUR_BANDE = 512;
const MARGE = 32; // pixels de marge autour de l'écran avant de cacher une bande (le tremblement d'écran bouge un peu la vue)
const IMAGES_SANS_TRI = 2; // pendant les 2 premières images la caméra n'est pas encore à sa place : on affiche tout
const DISTANCE_VEILLE = 900; // un ennemi est réveillé quand le joueur est à moins de 900 px de hauteur de lui (un écran fait 720 px)
const IMAGES_AVANT_VEILLE = 90; // 1,5 s au départ : le temps que les ennemis tombent sur le sol

// calques : les calques de la map à figer, dans l'ordre où ils se superposent (le premier est tout au fond).
// Ils restent dans la scène pour les collisions et pour savoir où est le sol, mais ils ne sont plus dessinés.
// couleurFond : la couleur qu'on voit derrière les tuiles là où la map est vide. Elle est peinte dans les bandes elles-mêmes,
// donc le niveau n'a plus besoin de peindre le fond de la caméra (un rectangle de la taille de l'écran en moins à chaque image).
// À appeler dans create(), juste après avoir créé les calques et AVANT de créer le joueur et les ennemis
// (les bandes doivent se trouver sous eux dans l'ordre d'affichage). Renvoie la liste des bandes.
export function figerCalques(scene, calques, largeur, hauteur, couleurFond) {
    const bandes = [];
    for (let y0 = 0; y0 < hauteur; y0 += HAUTEUR_BANDE) {
        const bande = scene.add.renderTexture(0, y0, largeur, Math.min(HAUTEUR_BANDE, hauteur - y0)); // une zone de dessin de la taille de la bande
        bande.setOrigin(0, 0);
        bande.fill(couleurFond); // le fond d'abord, les tuiles par-dessus
        bande.draw(calques, 0, -y0); // dessine tous les calques dedans, décalés pour que la bonne tranche de la map tombe dans la bande
        bande.setPipeline("SinglePipeline"); // shader simple : une bande = une seule image (voir plus haut)
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

// Cadence fixe : le jeu est cadencé par une minuterie (fps.forceSetTimeOut dans index.js), qui attend toujours un peu plus que prévu
// (environ 0,8 ms de trop à chaque image : 38,7 images par seconde au lieu de 40). Chaque seconde on regarde le temps réel entre
// deux images et on raccourcit l'attente de ce qui manque, pour tomber pile sur le nombre d'images par seconde voulu.
export function regulerCadence(jeu, imagesParSeconde) {
    const but = 1000 / imagesParSeconde; // durée voulue d'une image, en ms
    const boucle = jeu.loop;
    let debut = 0; // début de la seconde en cours
    let images = 0; // images comptées depuis ce début
    jeu.events.on(Phaser.Core.Events.STEP, (maintenant) => {
        if (!boucle.raf.isSetTimeOut) return; // pas cadencé par minuterie : rien à régler
        if (!debut) { debut = maintenant; return; }
        images++;
        if (maintenant - debut < 1000) return;
        const periode = (maintenant - debut) / images; // durée moyenne réelle d'une image pendant cette seconde
        if (periode < but * 3) boucle.raf.delay = Phaser.Math.Clamp(boucle.raf.delay + (but - periode) * 0.6, 1, but); // (si c'est bien plus long, la page était cachée : on ne règle rien)
        debut = maintenant;
        images = 0;
    });
}

// Pour mesurer sur la borne : la touche F3 affiche ou cache le nombre d'images par seconde, en haut à gauche de la page
// (on peut aussi l'afficher dès le départ en ajoutant ?fps à l'adresse du jeu). Caché, il ne coûte rien.
export function compteurImages(jeu) {
    const boite = document.createElement("div");
    boite.style.cssText = "position:fixed;left:6px;top:6px;padding:2px 8px;background:rgba(0,0,0,.75);color:#8f8;font:16px monospace;z-index:10;pointer-events:none;display:" + (location.search.includes("fps") ? "block" : "none");
    document.body.appendChild(boite);
    setInterval(() => { if (boite.style.display !== "none") boite.textContent = Math.round(jeu.loop.actualFps) + " images/s"; }, 500);
    window.addEventListener("keydown", (evenement) => {
        if (evenement.key === "F3") { evenement.preventDefault(); boite.style.display = boite.style.display === "none" ? "block" : "none"; }
    });
}

// À appeler dans create(), une fois les ennemis créés (scene.ennemis et scene.player doivent exister).
// Chaque image, un ennemi loin du joueur s'endort : ennemi.endormi = true, son corps physique et son animation s'arrêtent
// (majEnnemis, dans ennemis.js, l'ignore aussi). Il se réveille quand le joueur revient à moins de DISTANCE_VEILLE px.
// Rien ne s'endort pendant la première seconde et demie, le temps que tous les ennemis tombent et se posent sur le sol, ni
// un ennemi en l'air, ni un ennemi touché ou en train de mourir (il finit son animation, qui le fait disparaître).
export function endormirLesLoins(scene) {
    let images = 0;
    const surveiller = () => {
        const joueur = scene.player;
        if (!joueur || !joueur.body) return;
        if (images < IMAGES_AVANT_VEILLE) { images++; return; } // les ennemis se posent d'abord
        const liste = scene.ennemis.getChildren();
        for (let i = 0; i < liste.length; i++) {
            const ennemi = liste[i];
            if (ennemi.etat === "mort" || ennemi.etat === "touche") continue; // il finit sa mort ou son coup reçu
            const loin = Math.abs(ennemi.y - joueur.y) > DISTANCE_VEILLE;
            if (loin === Boolean(ennemi.endormi)) continue; // rien ne change pour lui
            if (loin && !ennemi.body.blocked.down) continue; // encore en l'air : il doit d'abord se poser
            ennemi.endormi = loin;
            ennemi.body.enable = !loin; // plus de physique
            ennemi.setActive(!loin); // plus d'animation (Phaser ne met à jour que les objets actifs)
        }
    };
    scene.events.on(Phaser.Scenes.Events.UPDATE, surveiller);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, surveiller));
}
