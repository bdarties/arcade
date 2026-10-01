export function creerTextureHalo(scene) {
    if (scene.textures.exists("halo")) return; // si le halo existe deja il est réutilisé ici
    const tex = scene.textures.createCanvas("halo", 256, 256); // permet de créer la zone de dessin
    const ctx = tex.getContext(); // ctx est une constante qui fait office de pinceau à chaque fois qu'on veut creer quelque chose
    const degrade = ctx.createRadialGradient(128, 128, 0, 128, 128, 128); // créer le dégradé pour le halo de lumière
    degrade.addColorStop(0, "rgba(255,255,255,0.8)"); // haut du dégradé
    degrade.addColorStop(1, "rgba(255,255,255,0)");// bas du dégradé
    ctx.fillStyle = degrade; // dis au pinceau de pindre avec le dégradé qu'on a crée
    ctx.fillRect(0, 0, 256, 256);
    tex.refresh();
}
export function creerZoneRonde(scene, x, y, rayon) {
    const halo = scene.add.image(x, y, "halo"); // affiche le halo sur les positions x,y
    halo.setScale(rayon / 128); // permet de creer la forme de rayon
    halo.setBlendMode(Phaser.BlendModes.ADD); // permet de gérer le mode du visuel donc c est additif, il recouvre le décor
    const zone = scene.add.zone(x, y, rayon * 2, rayon * 2); // la zone permet de détecter les choses qui se trouve à l'interieur
    scene.physics.add.existing(zone, true); // donne un corp physique à la zone, on met static à True
    zone.body.setCircle(rayon); // transforme la forme de base de la zone qui est un rectangle en cercle
    scene.zonesLumiere.add(zone); // On range la zone dans le groupe zonesLumiere, créé dans create() du niveau.
    zone.halo = halo;
    return zone; // si une autre fonction appelle le halo, on lui renvoi la zone
}
export function majLumiere(scene) {
    scene.joueurEclaire = scene.physics.overlap(scene.player, scene.zonesLumiere); // pause la question est ce que scene.player touche t'il au moins un élément de scene.zonesLumiere
    // on teste ça dans scene.joueurEclair pour pouvour l'utiliser plus tard dans la création des ennemis
    if (scene.joueurEclaire && scene.time.now > scene.prochainDegatLumiere) { // permet de mettre un délais sur les dégats que prend le joueur quand il est dans la lumiere
        // de cette façon il ne meurt pas d'un coup en étant dans la lumière
        scene.blesserJoueur(1, "Brûlé par la lumière"); // retire un point de vie au personnage et si le joueur meurt la cause de la mort est écrite
        scene.prochainDegatLumiere = scene.time.now + 1500; // le prochaine tic de dégat ne peut etre pris que dans 1,5 secondes
    }
}
export function eteindreLanterne(scene, tir, lanterne) {
    tir.destroy(); // permet de détruire le tir
    if (lanterne.eteinte) return; // si la lanterne est deja eteinte on return juste
    lanterne.eteinte = true; // fait en sorte qu'à partir de maintenant la lanterne est considérée comme éteinte
    // donc au prochain tir on sera dans le cas du if juste au dessus
    lanterne.setFillStyle(0x555555); // crée un rectangle gris pour la lanterne
    const halo = lanterne.zone.halo; // on range l'image du halo dans un variable halo
    scene.zonesLumiere.remove(lanterne.zone, true, true); // on retire alors du groupe des zones de dégats lumineuse la lanterne en question
    scene.tweens.add({ targets: halo, alpha: 0, duration: 300, onComplete: () => halo.destroy() });
}
export function creerLanterne(scene, x, y, rayon) { // fonction  qui permet de creer les lanternes
    const lanterne = scene.add.rectangle(x, y, 16, 24, 0xffffff); // dessine une lanterne
    scene.physics.add.existing(lanterne, true); // ajoute un corp physique au rectangle
    scene.lanternes.add(lanterne); // ajoute la lanterne crée au groupe lanternes
    lanterne.zone = creerZoneRonde(scene, x, y, rayon); // créer une zone autour de la lanterne
    lanterne.eteinte = false;
    return lanterne;
}