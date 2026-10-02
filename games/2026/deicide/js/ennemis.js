import { jouerSon } from "./sons.js"; // permet de jouer les bruitages
import * as effets from "./effets.js"; // tremblements, flashs, éclats et alertes
import { gagnerPoints } from "./points.js"; // ajoute les points au score
const PORTEE_COUP = 90; // distance (px) à partir de laquelle l'orc donne son coup de faux (la faux porte jusqu'à environ 130 px)
const VITESSE_ORC = 90; // vitesse de marche de l'orc (px/s)
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
    scene.load.spritesheet("orc_idle", "./assets/images/ennemis/orc_idle.png", { frameWidth: 140, frameHeight: 93 }); // chargement animation idle orc
    scene.load.spritesheet("orc_marche", "./assets/images/ennemis/orc_marche.png", { frameWidth: 140, frameHeight: 93 }); // chargement animation marche orc
    scene.load.spritesheet("orc_attaque", "./assets/images/ennemis/orc_attaque.png", { frameWidth: 140, frameHeight: 93 }); // chargement animation attaque orc (coup de faux)
    scene.load.spritesheet("orc_touche", "./assets/images/ennemis/orc_touche.png", { frameWidth: 140, frameHeight: 93 }); // chargement animation touche orc
    scene.load.spritesheet("orc_mort", "./assets/images/ennemis/orc_mort.png", { frameWidth: 140, frameHeight: 93 }); // chargement animation mort orc
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
    scene.anims.create({ key: "orc_idle", frames: scene.anims.generateFrameNumbers("orc_idle"), frameRate: 8, repeat: -1 }); // permet de creer l'animation d'idle de l'orc, en boucle
    scene.anims.create({ key: "orc_marche", frames: scene.anims.generateFrameNumbers("orc_marche"), frameRate: 10, repeat: -1 }); // permet de creer l'animation de marche de l'orc, en boucle
    scene.anims.create({ key: "orc_attaque", frames: scene.anims.generateFrameNumbers("orc_attaque"), frameRate: 12, repeat: 0 }); // permet de creer l'animation d'attaque de l'orc, jouée une fois
    scene.anims.create({ key: "orc_touche", frames: scene.anims.generateFrameNumbers("orc_touche"), frameRate: 10, repeat: 0 }); // permet de creer l'animation de touche de l'orc
    scene.anims.create({ key: "orc_mort", frames: scene.anims.generateFrameNumbers("orc_mort"), frameRate: 10, repeat: 0 }); // permet de creer l'animation de mort de l'orc
}
export function creerArcher(scene, x, y) { // fonction qui permet de creer un archer
    const archer = scene.ennemis.create(x, y, "archer_idle");
    archer.setScale(1.5); // agrandit la taille de l'écran
    archer.body.setSize(20, 35); // met la taille du corp physique de l'archer
    archer.body.setOffset(40, 31);// permet de centrer correctement l'archer par rapport à l'image, il commence le visuel au coin haut gauche
    archer.type = "archer"; // défini le type des archer en archer
    archer.pv = 2; // nombre de pv de l'archer 
    archer.points = 100; // nombre de points quand on tue l'archer
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
    mage.points = 200; // nombre de points quand on tue le mage
    mage.etat = "attente"; // etat de départ du mage
    mage.prochainTir = 0; // moment à partir duquel le mage peut tirer, 0 veut dire tout de suite
    mage.play("mage_idle"); // de base le mage joue l'idle
    ajouterHalo(scene, mage, 130); // halo violet large et diffus autour du mage
    return mage; // renvoie le mage à la fonction qui le demande
}
export function creerOrc(scene, x, y) { // fonction qui permet de creer un orc, l'ennemi de corps à corps
    const orc = scene.ennemis.create(x, y, "orc_idle"); // crée l'orc dans le groupe ennemis, comme les archers et les mages
    orc.setScale(1.3); // l'orc est un peu plus grand que les autres ennemis : c'est le costaud
    orc.body.setSize(30, 54); // taille du corps physique : le corps seul, sans la faux
    orc.type = "orc"; // défini le type en orc, toucherEnnemi s'en sert pour jouer orc_touche et orc_mort
    orc.pv = 4; // nombre de pv de l'orc, le plus résistant des ennemis
    orc.points = 400; // nombre de points quand on tue l'orc, le plus dur à abattre
    orc.etat = "attente"; // etat de départ de l'orc
    orc.prochainCoup = 0; // moment à partir duquel l'orc peut frapper, 0 veut dire tout de suite
    orienterOrc(orc, false); // l'image est dessinée tournée vers la gauche : on cale la hitbox dans ce sens
    orc.play("orc_idle"); // de base l'orc joue l'idle
    ajouterHalo(scene, orc, 120); // halo violet large et diffus autour de l'orc
    return orc; // renvoie l'orc à la fonction qui le demande
}
function orienterOrc(orc, versDroite) { // tourne l'orc et recale sa hitbox sur son corps
    if (orc.body.offset.y === 38 && orc.flipX === versDroite) return; // déjà tourné dans le bon sens (et hitbox déjà réglée) : rien à faire
    const ancienX = orc.body.x; // position du corps avant de se retourner
    orc.setFlipX(versDroite); // l'image regarde à gauche : on la retourne quand l'orc doit regarder à droite
    orc.body.setOffset(versDroite ? 20 : 90, 38); // dans l'image le corps est à droite (x 90 à 120) ; une fois retournée il passe à gauche (x 20 à 50)
    orc.body.updateFromGameObject(); // recalcule la position du corps avec le nouveau décalage
    orc.x += ancienX - orc.body.x; // décale l'image d'autant : le corps ne bouge pas quand l'orc se retourne, seule l'image change de sens
    orc.body.updateFromGameObject(); // et remet le corps à sa place
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
        jouerSon(scene, "ennemi_mort"); // cri de mort de l'ennemi
        effets.ennemiMort(scene, ennemi); // flash blanc, gerbe d'éclats, tremblement et micro-pause
        gagnerPoints(scene, ennemi.points, ennemi.body.center.x, ennemi.body.top); // ajoute les points de cet ennemi au score
        ennemi.etat = "mort"; // si il a 0 pv on passe son état à mort
        ennemi.body.enable = false; // on fait disparaitre le corp physique de l'ennemi
        scene.tweens.add({ targets: ennemi.halo, alpha: 0, duration: 500, onComplete: () => ennemi.halo.destroy() }); // le halo s'éteint en 0,5 s puis il est supprimé
        ennemi.play(ennemi.type + "_mort"); // il joue alors son animation de mort
        ennemi.once("animationcomplete-" + ennemi.type + "_mort", () => ennemi.destroy()); // quand l'animation de mort est fini on fait disparaitre l'archer
        return;
    }
    jouerSon(scene, "ennemi_touche"); // bruit d'impact sur l'ennemi
    effets.ennemiTouche(scene, ennemi); // flash blanc et quelques éclats
    ennemi.etat = "touche"; // passe l'état de l'ennemi à touché
    ennemi.play(ennemi.type + "_touche"); // il joue l'animation de dégat prit
    ennemi.once("animationcomplete-" + ennemi.type + "_touche", () => {
        ennemi.etat = "attente";
        ennemi.play(ennemi.type + "_idle");
    });
}
function repere(scene, ennemi) { // permet d'implémenter le fait que l'ennemi ne vois le joueur que quand il est dans la lumière
    const portee = scene.joueurEclaire ? 400 : 120; // si le joueur est éclairé la portée de l'arché est de 400 sinon 120
    return Phaser.Math.Distance.Between(ennemi.body.center.x, ennemi.body.center.y, scene.player.body.center.x, scene.player.body.center.y) < portee; // calcule la distance entre le centre du corps de l'ennemi et celui du joueur (l'image de l'orc est décalée par rapport à son corps)
}
export function majEnnemis(scene) { // fonction qui sera appelé presque chaque seconde pour vérifier les informations liées à l'ennemi
    scene.ennemis.getChildren().forEach(ennemi => { // renvoie un tableau avec la liste de tous les ennemis du groupe, exectute le code dans les accolades pour chaque éléments
        if (ennemi.halo) ennemi.halo.setPosition(ennemi.body.center.x, ennemi.body.center.y); // le halo suit le centre de l'ennemi à chaque image
        if (ennemi.etat !== "mort") { // un ennemi en train de mourir ne repère plus personne
            const voit = repere(scene, ennemi); // est ce que l'ennemi voit le joueur à cette image
            if (voit !== Boolean(ennemi.voitJoueur) && scene.time.now >= (ennemi.prochaineAlerte ?? 0)) { // il vient de le repérer ou de le perdre, et il n'a pas affiché d'alerte récemment
                effets.alerte(scene, ennemi, voit ? "!" : "?"); // « ! » : il t'a vu, « ? » : tu as disparu dans l'ombre
                ennemi.prochaineAlerte = scene.time.now + 1500; // pas plus d'une alerte toutes les 1,5 s, sinon elles clignotent à la limite de la portée
            }
            ennemi.voitJoueur = voit; // on retient s'il voit le joueur pour comparer à l'image suivante
        }
        if (ennemi.type === "archer") majArcher(scene, ennemi);
        if (ennemi.type === "mage") majMage(scene, ennemi); // si l'ennemi est un mage, on appelle son comportement
        if (ennemi.type === "orc") majOrc(scene, ennemi); // si l'ennemi est un orc, on appelle son comportement
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
function majMage(scene, mage) { // permet de choisir ce que fait le mage a chaque frame
    if (mage.etat === "touche" || mage.etat === "mort" || mage.etat === "attaque") return; // pendant qu'il encaisse, meurt ou incante, on ne change rien
    if (!repere(scene, mage)) { // appelle repere qui determine si le joueur est à portée du mage
        mage.etat = "attente"; // le joueur est trop loin : le mage attend
        return; // on s'arrête là
    }
    mage.etat = "alerte"; // le mage a vu le joueur
    mage.setFlipX(scene.player.x < mage.x); // le mage se tourne vers le joueur
    if (scene.time.now < mage.prochainTir) return; // si le dernier tir est trop récent, il n'a pas encore le droit de tirer
    mage.prochainTir = scene.time.now + 2500; // prochain tir possible dans 2,5 s
    mage.etat = "attaque"; // le mage commence son incantation
    mage.play("mage_attaque"); // joue l'animation d'attaque
    jouerSon(scene, "mage_incante"); // bruit de l'incantation pendant l'animation
    mage.off("animationcomplete-mage_attaque"); // retire une ancienne attente si une attaque a été interrompue
    mage.once("animationcomplete-mage_attaque", () => { // quand l'animation d'attaque est finie
        lancerOrbe(scene, mage); // le mage lance son orbe
        mage.etat = "alerte"; // il redevient attentif
        mage.play("mage_idle"); // et rejoue son idle
    });
}
function majOrc(scene, orc) { // permet de choisir ce que fait l'orc a chaque frame
    if (orc.etat === "mort") return; // une fois mort, il ne fait plus rien
    if (orc.etat === "touche" || orc.etat === "attaque") { // pendant qu'il encaisse ou qu'il frappe
        orc.setVelocityX(0); // il reste sur place
        return; // et on ne change rien d'autre
    }
    if (!repere(scene, orc)) { // appelle repere qui determine si le joueur est à portée de l'orc
        orc.setVelocityX(0); // le joueur est trop loin : l'orc s'arrête
        if (orc.etat !== "attente") { // s'il ne l'était pas déjà
            orc.etat = "attente"; // il repasse en attente
            orc.play("orc_idle"); // et rejoue son idle
        }
        return; // on s'arrête là
    }
    const versDroite = scene.player.x > orc.body.center.x; // vrai si le joueur est à droite de l'orc
    const sens = versDroite ? 1 : -1; // 1 = il va vers la droite, -1 = vers la gauche
    orienterOrc(orc, versDroite); // l'orc se tourne vers le joueur
    const distance = Math.abs(scene.player.x - orc.body.center.x); // écart horizontal entre l'orc et le joueur
    if (distance < PORTEE_COUP && scene.time.now >= orc.prochainCoup) { // le joueur est assez près et l'orc a le droit de frapper
        frapper(scene, orc); // il lance son coup de faux
        return;
    }
    if (distance < PORTEE_COUP - 30 || videDevant(scene, orc, sens)) { // déjà collé au joueur, ou un trou devant ses pieds
        orc.setVelocityX(0); // il attend sur place au lieu de tomber de sa plateforme
        if (orc.etat !== "alerte") { // s'il ne l'était pas déjà
            orc.etat = "alerte"; // il est en alerte
            orc.play("orc_idle"); // et joue son idle
        }
        return;
    }
    orc.setVelocityX(sens * VITESSE_ORC); // il marche vers le joueur
    if (orc.etat !== "marche") { // s'il ne marchait pas déjà
        orc.etat = "marche"; // il passe en marche
        orc.play("orc_marche"); // et joue l'animation de marche
    }
}
function videDevant(scene, orc, sens) { // renvoie vrai s'il n'y a pas de sol juste devant les pieds de l'orc
    const calque = scene.groupe_plateformes; // le calque Gameplay de la map Tiled
    if (!calque.getTileAtWorldXY) return false; // ce n'est pas une map Tiled (niveaux 2 et 3) : on ne teste pas
    const x = orc.body.center.x + sens * (orc.body.halfWidth + 6); // un point juste devant son pied
    const tuile = calque.getTileAtWorldXY(x, orc.body.bottom + 4); // la tuile juste sous ce point
    return !tuile || !tuile.collides; // pas de tuile, ou une tuile pas solide : c'est un trou
}
function frapper(scene, orc) { // l'orc donne un coup de faux devant lui
    orc.etat = "attaque"; // il passe en attaque
    orc.prochainCoup = scene.time.now + 1500; // prochain coup possible dans 1,5 s
    orc.setVelocityX(0); // il s'arrête pour frapper
    orc.play("orc_attaque"); // joue l'animation d'attaque
    orc.off("animationcomplete-orc_attaque"); // retire une ancienne attente si une attaque a été interrompue
    orc.once("animationcomplete-orc_attaque", () => { // quand l'animation d'attaque est finie
        orc.etat = "alerte"; // il redevient attentif
        orc.play("orc_idle"); // et rejoue son idle
    });
    scene.time.delayedCall(350, () => { // la faux touche à la 5e image de l'animation (4 images à 12 par seconde = 0,35 s)
        if (orc.etat !== "attaque") return; // l'orc a été touché ou tué entre temps : le coup est annulé
        jouerSon(scene, "orc_coup"); // bruit de la faux
        const devant = (scene.player.body.center.x - orc.body.center.x) * (orc.flipX ? 1 : -1); // distance du joueur devant l'orc, négative s'il est derrière
        const hauteur = Math.abs(scene.player.body.center.y - orc.body.center.y); // écart de hauteur entre les deux
        if (devant > -20 && devant < 130 && hauteur < 60) scene.blesserJoueur(1, "Fauché par un orc"); // le joueur est dans la zone de la faux : il perd un pv
    });
}
function lancerOrbe(scene, mage) { // fait apparaitre l'orbe de lumière et l'envoie vers le joueur
    const orbe = scene.tirsEnnemis.create(mage.body.center.x, mage.body.center.y - 10, "halo"); // crée l'orbe au niveau des mains du mage, dans le groupe des tirs ennemis
    orbe.setScale(0.25); // l'image fait 256 px : à 0.25 l'orbe fait 64 px de large
    orbe.body.setCircle(40, 88, 88); // hitbox ronde de 40 px de rayon, centrée dans l'image
    orbe.setTint(0xfff2c0); // teinte doré pâle, la couleur de la lumière divine
    orbe.setBlendMode(Phaser.BlendModes.ADD); // mode additif : l'orbe brille
    orbe.setDepth(51); // au-dessus du voile pour qu'on la voie arriver dans le noir
    jouerSon(scene, "orbe"); // bruit du sort lancé
    scene.physics.moveToObject(orbe, scene.player, 220); // envoie l'orbe vers la position du joueur à 220 px/s
    scene.time.delayedCall(4000, () => orbe.destroy()); // l'orbe disparait au bout de 4 s si elle n'a rien touché
}
function tirerFleche(scene, archer) { // permet de faire apparaitre la fleche de l'archer
    const sens = archer.flipX ? -1 : 1; // permet de gérer l'orientation de l'archer
    const fleche = scene.tirsEnnemis.create(archer.x + sens * 20, archer.y - 5, "fleche"); // permet de creer la fleche et de la stocker dans le groupe tirennemis
    fleche.setScale(1.5); // gère la taille de la fleche
    fleche.setFlipX(sens === -1); // gere l'orientation de la fleche
    fleche.play("fleche"); // joue l'animation de la fleche
    jouerSon(scene, "fleche"); // sifflement de la flèche
    fleche.setVelocityX(sens * 450); // gere la vitesse de la fleche 
    scene.time.delayedCall(2000, () => fleche.destroy()); // gere le temps avant que la fleche soit détruuite (2s)
}