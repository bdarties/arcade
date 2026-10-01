export function chargerEnnemis(scene) {
    scene.load.spritesheet("archer_idle", "./assets/images/ennemis/archer_idle.png", { frameWidth: 100, frameHeight: 100 }); // chargement animation idle archer
    scene.load.spritesheet("archer_attaque", "./assets/images/ennemis/archer_attaque.png", { frameWidth: 100, frameHeight: 100 }); // chargement animation attaque archer
    scene.load.spritesheet("archer_touche", "./assets/images/ennemis/archer_touche.png", { frameWidth: 100, frameHeight: 100 }); // chargement animation touche archer
    scene.load.spritesheet("archer_mort", "./assets/images/ennemis/archer_mort.png", { frameWidth: 100, frameHeight: 100 }); // chargement animation mort archer
    scene.load.spritesheet("fleche", "./assets/images/ennemis/fleche.png", { frameWidth: 24, frameHeight: 5 }); // chargement animation fleche archer
    scene.load.spritesheet("mage_idle", "./assets/images/ennemis/mage_idle.png", { frameWidth: 231, frameHeight: 190 }); // chargement animation idle mage
    scene.load.spritesheet("mage_attaque", "./assets/images/ennemis/mage_attaque.png", { frameWidth: 231, frameHeight: 190 }); // chargement animation attaque mage
    scene.load.spritesheet("mage_touche", "./assets/images/ennemis/mage_touche.png", { frameWidth: 231, frameHeight: 190 }); // chargement animation touche mage
    scene.load.spritesheet("mage_mort", "./assets/images/ennemis/mage_mort.png", { frameWidth: 231, frameHeight: 190 }); // chargement animation mort mage
}
export function creerAnimationsEnnemis(scene) { // permet de creer les animations des ennemis
    if (scene.anims.exists("archer_idle")) return; // permet de savoir si l'animation archer_idle existe deja, si c est le cas on passe
    scene.anims.create({ key: "archer_idle", frames: scene.anims.generateFrameNumbers("archer_idle"), frameRate: 10, repeat: -1 }); // permet de creer l'animation d'idle
    scene.anims.create({ key: "archer_attaque", frames: scene.anims.generateFrameNumbers("archer_attaque"), frameRate: 12, repeat: 0 }); // permet de creer l'animation d'attaque
    scene.anims.create({ key: "archer_touche", frames: scene.anims.generateFrameNumbers("archer_touche"), frameRate: 12, repeat: 0 });// permet de creer l'animation de touche
    scene.anims.create({ key: "archer_mort", frames: scene.anims.generateFrameNumbers("archer_mort"), frameRate: 12, repeat: 0 });// permet de creer l'animation de mort
    scene.anims.create({ key: "fleche", frames: scene.anims.generateFrameNumbers("fleche"), frameRate: 10, repeat: -1 });// permet de creer l'animation fleche
    scene.anims.create({ key: "mage_idle", frames: scene.anims.generateFrameNumbers("mage_idle"), frameRate: 8, repeat: -1 }); // permet de creer l'animation d'idle du mage, en boucle
    scene.anims.create({ key: "mage_attaque", frames: scene.anims.generateFrameNumbers("mage_attaque"), frameRate: 12, repeat: 0 }); // permet de creer l'animation d'attaque du mage, jouée une fois
    scene.anims.create({ key: "mage_touche", frames: scene.anims.generateFrameNumbers("mage_touche"), frameRate: 10, repeat: 0 }); // permet de creer l'animation de touche du mage
    scene.anims.create({ key: "mage_mort", frames: scene.anims.generateFrameNumbers("mage_mort"), frameRate: 10, repeat: 0 }); // permet de creer l'animation de mort du mage
}
export function creerArcher(scene, x, y) { // fonction qui permet de creer un archer
    const archer = scene.ennemis.create(x, y, "archer_idle");
    archer.setScale(1.5); // agrandit la taille de l'écran
    archer.body.setSize(20, 35); // met la taille du corp physique de l'archer
    archer.body.setOffset(40, 31);// permet de centrer correctement l'archer par rapport à l'image, il commence le visuel au coin haut gauche
    archer.type = "archer"; // défini le type des archer en archer
    archer.pv = 2; // nombre de pv de l'archer 
    archer.points = 100; // nombre de point quand on tu l'archer 
    archer.etat = "attente"; // etat de l'archer
    archer.prochainTir = 0; // moment à partir du quel l'archer peut tirer, 0 veut dire tout de suite 
    archer.play("archer_idle"); // fait en sorte que de base le joueur joue l'idle
    ajouterHalo(scene, archer, 110); // halo violet large et diffus autour de l'archer
    return archer; // renvoie l'archer à la fonctione qui le demande
}
export function creerMage(scene, x, y) { // fonction qui permet de creer un mage
    const mage = scene.ennemis.create(x, y, "mage_idle"); // crée le mage dans le groupe ennemis, comme les archers
    mage.setScale(0.8); // réduit le mage pour qu'il fasse la taille des autres personnages
    mage.body.setSize(30, 70); // met la taille du corps physique du mage (largeur de son corps, de la tête aux pieds)
    mage.type = "mage"; // défini le type en mage, toucherEnnemi s'en sert pour jouer mage_touche et mage_mort
    mage.pv = 3; // nombre de pv du mage, plus résistant que l'archer
    mage.points = 150; // nombre de points quand on tue le mage
    mage.etat = "attente"; // etat de départ du mage
    mage.prochainTir = 0; // moment à partir duquel le mage peut tirer, 0 veut dire tout de suite
    mage.play("mage_idle"); // de base le mage joue l'idle
    ajouterHalo(scene, mage, 130); // halo violet large et diffus autour du mage
    return mage; // renvoie le mage à la fonction qui le demande
}
function creerTextureHaloDoux(scene) { // dessine un dégradé large et peu concentré pour les halos des ennemis
    if (scene.textures.exists("halo_doux")) return; // si la texture existe deja on la réutilise
    const tex = scene.textures.createCanvas("halo_doux", 256, 256); // crée une zone de dessin de 256 x 256 px
    const ctx = tex.getContext(); // récupère le pinceau pour dessiner dans la zone
    const degrade = ctx.createRadialGradient(128, 128, 0, 128, 128, 128); // dégradé rond qui part du centre jusqu'au bord
    degrade.addColorStop(0, "rgba(255,255,255,0.35)"); // centre : seulement 35 % d'opacité, au lieu de 80 %
    degrade.addColorStop(0.5, "rgba(255,255,255,0.15)"); // à mi-chemin il reste encore de la lumière
    degrade.addColorStop(1, "rgba(255,255,255,0)"); // au bord : complètement transparent
    ctx.fillStyle = degrade; // dit au pinceau de peindre avec ce dégradé
    ctx.fillRect(0, 0, 256, 256); // peint tout le carré avec le dégradé
    tex.refresh(); // envoie le dessin à Phaser pour qu'il puisse l'utiliser
}
function ajouterHalo(scene, ennemi, rayon) { // fonction qui ajoute un halo violet autour d'un ennemi
    creerTextureHaloDoux(scene); // crée la texture du halo doux si elle n'existe pas encore
    const halo = scene.add.image(ennemi.x, ennemi.y, "halo_doux"); // affiche le dégradé doux à la position de l'ennemi
    halo.setScale(rayon / 128); // met le halo à la bonne taille (l'image fait 128 px de rayon)
    halo.setTint(0xc79bff); // colore le halo en violet clair
    halo.setBlendMode(Phaser.BlendModes.ADD); // mode additif : le halo éclaire ce qu'il y a dessous au lieu de le cacher
    halo.setAlpha(0.8); // le dégradé est déjà faible, on garde donc une transparence légère
    halo.setDepth(51); // place le halo juste au-dessus du voile (50) mais sous le HUD (100)
    ennemi.halo = halo; // range le halo dans l'ennemi pour le retrouver plus tard
}
export function toucherEnnemi(scene, tir, ennemi) { // fonction qui permet de tuer l'ennemi
    tir.destroy(); // si le tir touche l'ennemi, le tir est détruit
    if (ennemi.etat === "mort") return; // si l'ennemi est deja en train de mourir on return
    ennemi.pv -= 1; // on enleve 1 pv au joueur
    if (ennemi.pv <= 0) { // vérifie si l'ennemi à 0pv
        ennemi.etat = "mort"; // si il a 0 pv on passe son état à mort
        ennemi.body.enable = false; // on fait disparaitre le corp physique de l'ennemi
        scene.tweens.add({ targets: ennemi.halo, alpha: 0, duration: 500, onComplete: () => ennemi.halo.destroy() }); // le halo s'éteint en 0,5 s puis il est supprimé
        ennemi.play(ennemi.type + "_mort"); // il joue alors son animation de mort
        ennemi.once("animationcomplete-" + ennemi.type + "_mort", () => ennemi.destroy()); // quand l'animation de mort est fini on fait disparaitre l'archer
        return;
    }
    ennemi.etat = "touche"; // passe l'état de l'ennemi à touché
    ennemi.play(ennemi.type + "_touche"); // il joue l'animation de dégat prit
    ennemi.once("animationcomplete-" + ennemi.type + "_touche", () => {
        ennemi.etat = "attente";
        ennemi.play(ennemi.type + "_idle");
    });
}
function repere(scene, ennemi) { // permet d'implémenter le fait que l'ennemi ne vois le joueur que quand il est dans la lumière
    const portee = scene.joueurEclaire ? 400 : 120; // si le joueur est éclairé la portée de l'arché est de 400 sinon 120
    return Phaser.Math.Distance.Between(ennemi.x, ennemi.y, scene.player.x, scene.player.y) < portee; // calcule la distance entre l'arché est le joueur
}
export function majEnnemis(scene) { // fonction qui sera appelé presque chaque seconde pour vérifier les informations liées à l'ennemi
    scene.ennemis.getChildren().forEach(ennemi => { // renvoie un tableau avec la liste de tous les ennemis du groupe, exectute le code dans les accolades pour chaque éléments
        if (ennemi.halo) ennemi.halo.setPosition(ennemi.body.center.x, ennemi.body.center.y); // le halo suit le centre de l'ennemi à chaque image
        if (ennemi.type === "archer") majArcher(scene, ennemi);
    });
}
function majArcher(scene, archer) { // permet de choisir ce que fait l'archer a chaque frame
    if (archer.etat === "touche" || archer.etat === "mort") return; // le joueur ne peux plus repasser sur un autre mode que mort
    if (!repere(scene, archer)) { // appelle repere qui determine si le joueur est à range de l'archer
        archer.etat = "attente"; // défini l'état de l'archer à l'attente
        return;
    }
    archer.etat = "alerte";
    archer.setFlipX(scene.player.x < archer.x);
    if (scene.time.now >= archer.prochainTir) { // permet de savoir si l'archer peut tirer ou pas en fonction de l'intervalle de tir
        archer.prochainTir = scene.time.now + 1800; // défini l'intervalle de tir
        tirerFleche(scene, archer); // fait tirer l'archer
    }
}
function tirerFleche(scene, archer) { // permet de faire apparaitre la fleche de l'archer
    const sens = archer.flipX ? -1 : 1; // permet de gérer l'orientation de l'archer
    const fleche = scene.tirsEnnemis.create(archer.x + sens * 20, archer.y - 5, "fleche"); // permet de creer la fleche et de la stocker dans le groupe tirennemis
    fleche.setScale(1.5); // gère la taille de la fleche
    fleche.setFlipX(sens === -1); // gere l'orientation de la fleche
    fleche.play("fleche"); // joue l'animation de la fleche
    fleche.setVelocityX(sens * 450); // gere la vitesse de la fleche 
    scene.time.delayedCall(2000, () => fleche.destroy()); // gere le temps avant que la fleche soit détruuite (2s)
}