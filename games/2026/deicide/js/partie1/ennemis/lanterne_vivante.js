// lanterne_vivante.js : les lanternes vivantes (une lanterne avec de petites ailes)
// Toutes les 15 secondes, une lanterne vivante apparaît juste au-dessus de l'écran, à un endroit au hasard où il n'y a pas de mur,
// et vole vers le robot à la moitié de sa vitesse. Elle ne traverse pas les murs : elle les contourne en glissant dessus.
// Au contact du robot, elle lui retire 1 PV et se brise. Un tir l'abat : gerbe d'éclats dorés, et le robot gagne un niveau de boost (voir boost.js :
// un peu plus de vitesse, une balle de plus à chaque tir, un reflet blanc). La visée auto la prend pour cible (voir personnage.js).
// Utilisation : preparerLanternesVivantes(this) dans create() de niveau1, après la création du joueur et du groupe tirsJoueur.
import { creerTextureLanterneVivante } from "../systemes/dessins_en_code.js"; // le dessin de la lanterne ailée (en code, avec le même motif que les lanternes accrochées)
import { ROBOT, LANTERNES_VIVANTES, DEGATS } from "../parametres.js"; // la vitesse du robot et les réglages des lanternes
import { lanterneVivanteMorte } from "../systemes/effets.js"; // éclats, éclair
import { donnerBoost } from "../mecanismes/boost.js"; // le boost donné au robot
import { jouerSon } from "../systemes/sons.js"; // bruit du verre qui casse

const VITESSE = ROBOT.vitesse / 2; // la moitié de la vitesse du robot (130 px/s)
// px : elle fonce jusqu'au robot sans s'arrêter (avant : 80, pour qu'on puisse la viser) ; au contact elle le blesse (voir toucherJoueur)
const DISTANCE_ARRET = 0; // distance à laquelle elle s'arrête du robot : 0 = elle fonce jusqu'à lui
const ECHELLE = 3; // comme les lanternes accrochées
const ESSAIS = 40; // nombre de places essayées pour l'apparition

// Les deux images des ailes (8 lignes, 9 colonnes ; la colonne 0 touche la lanterne). W = blanc, L = contour lavande
// ailes levées : attachées en bas à gauche
// ailes baissées : attachées en haut à gauche


export function preparerLanternesVivantes(scene) { // prépare les lanternes vivantes dans un niveau (appelée à la création du niveau)
    creerTextureLanterneVivante(scene); // fabrique l'image de la lanterne ailée
    if (!scene.anims.exists("lanterne_vivante_vol")) { // si l'animation de vol n'existe pas encore...
        // les ailes battent
        scene.anims.create({ key: "lanterne_vivante_vol", frames: scene.anims.generateFrameNumbers("lanterne_vivante", { start: 0, end: 1 }), frameRate: 6, repeat: -1 }); // ...on la crée : deux images, en boucle
    }
    scene.maxLanternes = undefined; // (la scène est réutilisée après une mort : on repart du maximum normal)
    const groupe = scene.physics.add.group({ allowGravity: false }); // le groupe qui contiendra toutes les lanternes vivantes (sans gravité)
    scene.lanternesVivantes = groupe; // (personnage.js s'en sert pour la visée auto)
    if (scene.groupe_plateformes) scene.physics.add.collider(groupe, scene.groupe_plateformes); // elle ne traverse pas les murs
    if (scene.tirsJoueur) scene.physics.add.overlap(scene.tirsJoueur, groupe, (tir, lanterne) => abattre(scene, lanterne, tir)); // un tir l'abat
    scene.physics.add.overlap(scene.player, groupe, (joueur, lanterne) => toucherJoueur(scene, lanterne)); // elle touche le robot : elle lui fait mal
    const diriger = () => groupe.getChildren().forEach(lanterne => dirigerLanterne(scene, lanterne)); // fonction qui dirige chaque lanterne vivante
    scene.events.on(Phaser.Scenes.Events.UPDATE, diriger); // on l'appelle à chaque image du jeu
    const minuterie = scene.time.addEvent({ delay: LANTERNES_VIVANTES.delaiApparition, loop: true, callback: () => faireApparaitre(scene) }); // un minuteur fait apparaître une lanterne à intervalle régulier
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { // quand la scène s'arrête...
        scene.events.off(Phaser.Scenes.Events.UPDATE, diriger); // ...on arrête de diriger les lanternes
        minuterie.remove(); // ...et on arrête le minuteur
    });
}

// vrai s'il n'y a aucune tuile solide dans le carré de 48 px autour du point (la lanterne y tiendrait sans toucher un mur)
function placeLibre(scene, x, y) { // vrai s'il n'y a pas de mur à cet endroit
    const calque = scene.groupe_plateformes; // le calque des plateformes
    if (!calque || !calque.getTilesWithinWorldXY) return true; // pas de carte de tuiles : rien à éviter
    return calque.getTilesWithinWorldXY(x - 24, y - 24, 48, 48, { isColliding: true }).length === 0; // on compte les tuiles solides dans le carré : aucune = place libre
}

// une place au hasard juste au-dessus de l'écran, hors de tout mur. Renvoie null si on n'en trouve pas.
function placeApparition(scene) { // cherche une place pour faire apparaître une lanterne
    const monde = scene.physics.world.bounds; // les limites de la carte
    const haut = scene.cameras.main.worldView.y; // le haut de l'écran
    for (let essai = 0; essai < ESSAIS; essai++) { // on essaie plusieurs places au hasard
        const x = Phaser.Math.Between(monde.x + 40, monde.right - 40); // un x au hasard sur la largeur de la carte
        // juste au-dessus de l'écran ; si c'est un mur, on essaie un peu plus haut
        const y = Math.max(monde.y + 40, haut - 70 - Math.floor(essai / 8) * 40); // un y juste au-dessus de l'écran, un peu plus haut à chaque série d'essais
        if (placeLibre(scene, x, y)) return { x, y }; // si la place est libre, on la renvoie
    }
    return null; // aucune place trouvée
}

// fait apparaître une lanterne vivante (renvoie null s'il y en a déjà trop ou s'il n'y a pas de place)
export function faireApparaitre(scene) { // fait apparaître une lanterne vivante (appelée par le minuteur ou par le boss)
    const groupe = scene.lanternesVivantes; // le groupe des lanternes
    if (!groupe || groupe.countActive() >= (scene.maxLanternes ?? LANTERNES_VIVANTES.maximum)) return null; // s'il y en a déjà le maximum, on n'en crée pas
    const place = placeApparition(scene); // on cherche une place
    if (!place) return null; // pas de place : pas de lanterne
    const lanterne = groupe.create(place.x, place.y, "lanterne_vivante", 0); // on crée la lanterne
    lanterne.setScale(ECHELLE).setDepth(51); // au-dessus du voile d'ombre (50) : on la voit venir même dans le noir
    lanterne.body.setSize(10, 14).setOffset(9, 2); // la hitbox est la lanterne, sans les ailes
    lanterne.setCollideWorldBounds(true); // elle reste dans la carte
    lanterne.play("lanterne_vivante_vol"); // elle bat des ailes
    lanterne.naissance = scene.time.now; // on note quand elle est née (pour sa durée de vie)
    lanterne.phase = Math.random() * 6.28; // pour qu'elles ne flottent pas toutes en même temps
    lanterne.dernierX = place.x; // pour repérer une lanterne coincée contre un mur
    lanterne.dernierY = place.y; // sa dernière position en y
    lanterne.derniereVerif = scene.time.now; // quand on a vérifié pour la dernière fois si elle avançait
    lanterne.detourJusqua = 0; // jusqu'à quand elle fait un détour
    lanterne.detourSens = 1; // le côté du détour (1 ou -1)
    lanterne.setAlpha(0); // invisible au départ (elle apparaît en fondu)
    scene.tweens.add({ targets: lanterne, alpha: 1, duration: 300 }); // elle apparaît en fondu
    if (scene.textures.exists("halo_doux")) { // une lueur dorée autour (la texture vient d'ennemis_normaux.js)
        const halo = scene.add.image(place.x, place.y, "halo_doux"); // l'image de la lueur dorée
        halo.setScale(0.55).setTint(0xffd45c).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setAlpha(0.8).setPipeline("SinglePipeline"); // on la réduit, la teinte et la fait briller
        lanterne.halo = halo; // la lanterne retient sa lueur
        lanterne.once("destroy", () => halo.destroy()); // la lueur disparaît avec la lanterne
    }
    return lanterne; // on renvoie la lanterne créée
}

// chaque image : la lanterne se dirige vers le robot, flotte, contourne un mur si elle est coincée, et s'éteint si elle dure trop longtemps
function dirigerLanterne(scene, lanterne) { // fait bouger une lanterne (appelée à chaque image)
    if (!lanterne.active) return; // si elle est détruite, on ne fait rien
    const joueur = scene.player; // le robot
    const maintenant = scene.time.now; // l'heure actuelle
    if (maintenant - lanterne.naissance > LANTERNES_VIVANTES.dureeDeVie && !lanterne.sEteint) { // trop vieille : elle s'éteint
        lanterne.sEteint = true; // elle est marquée comme éteinte
        scene.tweens.add({ targets: lanterne, alpha: 0, duration: 500, onComplete: () => lanterne.destroy() }); // elle s'efface puis disparaît
    }
    const dx = joueur.x - lanterne.x; // écart horizontal avec le robot
    const dy = (joueur.y - 26) - lanterne.y; // elle vise le milieu du corps du robot (joueur.y = ses pieds)
    const distance = Math.hypot(dx, dy) || 1; // distance jusqu'au robot
    let vx = 0; // vitesse horizontale, nulle au départ
    let vy = 0; // vitesse verticale, nulle au départ
    if (distance > DISTANCE_ARRET) { // elle fonce vers le robot, à la moitié de sa vitesse
        vx = dx / distance * VITESSE; // on calcule la vitesse dans la direction du robot
        vy = dy / distance * VITESSE; // idem à la verticale
    }
    if (maintenant - lanterne.derniereVerif > 600) { // toutes les 0,6 s : a-t-elle avancé ? Sinon elle est coincée contre un mur
        const avance = Math.hypot(lanterne.x - lanterne.dernierX, lanterne.y - lanterne.dernierY); // la distance parcourue depuis la dernière vérification
        if (avance < 12 && distance > DISTANCE_ARRET + 30) { // elle a presque fait du sur-place alors qu'elle devrait avancer
            lanterne.detourJusqua = maintenant + 1200; // elle part sur le côté pendant 1,2 s
            lanterne.detourSens = Math.random() < 0.5 ? -1 : 1; // on choisit le côté du détour au hasard
        }
        lanterne.dernierX = lanterne.x; // on retient la position actuelle
        lanterne.dernierY = lanterne.y; // idem en y
        lanterne.derniereVerif = maintenant; // et l'heure de cette vérification
    }
    if (maintenant < lanterne.detourJusqua && distance > 1) { // détour : surtout sur le côté, un peu vers le robot
        const cote = lanterne.detourSens; // le côté du détour
        const ux = (-dy / distance * cote * 0.85 + dx / distance * 0.15); // direction horizontale du détour
        const uy = (dx / distance * cote * 0.85 + dy / distance * 0.15); // direction verticale du détour
        const norme = Math.hypot(ux, uy) || 1; // longueur de cette direction (pour la ramener à 1)
        vx = ux / norme * VITESSE; // vitesse horizontale du détour
        vy = uy / norme * VITESSE; // vitesse verticale du détour
    }
    vy += Math.sin((maintenant / 280) + lanterne.phase) * 18; // elle flotte doucement de haut en bas
    lanterne.body.setVelocity(vx, vy); // on applique la vitesse à la lanterne
    if (Math.abs(dx) > 8) lanterne.setFlipX(dx < 0); // elle regarde vers le robot
    if (lanterne.halo) lanterne.halo.setPosition(lanterne.x, lanterne.y); // la lueur suit la lanterne
}

// une lanterne vivante touche le robot : il perd 1 PV et la lanterne se brise (sans boost)
function toucherJoueur(scene, lanterne) { // la lanterne touche le robot
    if (!lanterne.active) return; // si elle est déjà détruite, rien
    const x = lanterne.x; // sa position en x
    const y = lanterne.y; // sa position en y
    lanterne.destroy(); // détruite au contact : elle ne peut pas blesser à chaque image
    jouerSon(scene, "lanterne"); // le verre qui casse
    lanterneVivanteMorte(scene, x, y); // éclats dorés et blancs
    scene.blesserJoueur(DEGATS.lanterneVivante, "Percuté par une lanterne vivante"); // le robot perd des PV
}

// un tir touche une lanterne vivante
function abattre(scene, lanterne, tir) { // un tir du robot touche la lanterne
    if (!lanterne.active) return; // si elle est déjà détruite, rien
    tir.destroy(); // le tir disparaît
    const x = lanterne.x; // sa position en x
    const y = lanterne.y; // sa position en y
    lanterne.destroy(); // sa lueur disparaît avec elle
    jouerSon(scene, "lanterne"); // le verre qui casse
    lanterneVivanteMorte(scene, x, y); // éclats dorés et blancs, éclair
    donnerBoost(scene); // le robot est boosté
}
