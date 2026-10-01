export function chargerEnnemis(scene) {
    scene.load.spritesheet("archer_idle", "./assets/images/ennemis/archer_idle.png", { frameWidth: 100, frameHeight: 100 }); // chargement animation idle archer
    scene.load.spritesheet("archer_attaque", "./assets/images/ennemis/archer_attaque.png", { frameWidth: 100, frameHeight: 100 }); // chargement animation attaque archer
    scene.load.spritesheet("archer_touche", "./assets/images/ennemis/archer_touche.png", { frameWidth: 100, frameHeight: 100 }); // chargement animation touche archer
    scene.load.spritesheet("archer_mort", "./assets/images/ennemis/archer_mort.png", { frameWidth: 100, frameHeight: 100 }); // chargement animation mort archer
    scene.load.spritesheet("fleche", "./assets/images/ennemis/fleche.png", { frameWidth: 24, frameHeight: 5 }); // chargement animation fleche archer
}
export function creerAnimationsEnnemis(scene) { // permet de creer les animations des ennemis
    if (scene.anims.exists("archer_idle")) return; // permet de savoir si l'animation archer_idle existe deja, si c est le cas on passe
    scene.anims.create({ key: "archer_idle", frames: scene.anims.generateFrameNumbers("archer_idle"), frameRate: 10, repeat: -1 }); // permet de creer l'animation d'idle
    scene.anims.create({ key: "archer_attaque", frames: scene.anims.generateFrameNumbers("archer_attaque"), frameRate: 12, repeat: 0 }); // permet de creer l'animation d'attaque
    scene.anims.create({ key: "archer_touche", frames: scene.anims.generateFrameNumbers("archer_touche"), frameRate: 12, repeat: 0 });// permet de creer l'animation de touche
    scene.anims.create({ key: "archer_mort", frames: scene.anims.generateFrameNumbers("archer_mort"), frameRate: 12, repeat: 0 });// permet de creer l'animation de mort
    scene.anims.create({ key: "fleche", frames: scene.anims.generateFrameNumbers("fleche"), frameRate: 10, repeat: -1 });// permet de creer l'animation fleche
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
    return archer; // renvoie l'archer à la fonctione qui le demande
}
export function toucherEnnemi(scene, tir, ennemi) { // fonction qui permet de tuer l'ennemi
    tir.destroy(); // si le tir touche l'ennemi, le tir est détruit
    if (ennemi.etat === "mort") return; // si l'ennemi est deja en train de mourir on return
    ennemi.pv -= 1; // on enleve 1 pv au joueur
    if (ennemi.pv <= 0) { // vérifie si l'ennemi à 0pv
        ennemi.etat = "mort"; // si il a 0 pv on passe son état à mort
        ennemi.body.enable = false; // on fait disparaitre le corp physique de l'ennemi
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