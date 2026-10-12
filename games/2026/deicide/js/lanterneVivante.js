// lanterneVivante.js : les lanternes vivantes (une lanterne avec de petites ailes)
// Toutes les 15 secondes, une lanterne vivante apparaît juste au-dessus de l'écran, à un endroit au hasard où il n'y a pas de mur,
// et vole vers le robot à la moitié de sa vitesse. Elle ne traverse pas les murs : elle les contourne en glissant dessus.
// Elle ne fait pas de dégâts. Un tir l'abat : gerbe d'éclats dorés, et le robot gagne un niveau de boost (voir boost.js :
// un peu plus de vitesse, une balle de plus à chaque tir, un reflet blanc). La visée auto la prend pour cible (voir personnage.js).
// Utilisation : preparerLanternesVivantes(this) dans create() de niveau1, après la création du joueur et du groupe tirsJoueur.
import { MOTIF_LANTERNE } from "./lumiere.js"; // le dessin de la lanterne (le même que les lanternes accrochées)
import { VITESSE_JOUEUR } from "./Personnage/personnage.js"; // la vitesse du robot
import { lanterneVivanteMorte } from "./effets.js"; // éclats, éclair
import { donnerBoost } from "./boost.js"; // le boost donné au robot
import { jouerSon } from "./sons.js"; // bruit du verre qui casse

const DELAI_APPARITION = 15000; // ms entre deux lanternes vivantes
const MAX_VIVANTES = 3; // pas plus de 3 en même temps
const VITESSE = VITESSE_JOUEUR / 2; // la moitié de la vitesse du robot (130 px/s)
const DISTANCE_ARRET = 80; // px : elle s'arrête à cette distance du robot et flotte, pour qu'on puisse la viser
const DUREE_VIE = 40000; // ms : une lanterne que personne n'abat finit par s'éteindre et disparaître
const ECHELLE = 3; // comme les lanternes accrochées
const ESSAIS = 40; // nombre de places essayées pour l'apparition

// Les deux images des ailes (8 lignes, 9 colonnes ; la colonne 0 touche la lanterne). W = blanc, L = contour lavande
const AILE_HAUT = [".....LLL.", "...LLWWWL", "..LWWWWWL", ".LWWWWWL.", "LWWWWWL..", "LWWWWL...", ".LWWL....", "..LL....."]; // ailes levées : attachées en bas à gauche
const AILE_BAS = ["..LL.....", ".LWWL....", "LWWWWL...", "LWWWWWL..", ".LWWWWWL.", "..LWWWWWL", "...LLWWWL", ".....LLL."]; // ailes baissées : attachées en haut à gauche
const COULEURS_LANTERNE = { "#": "#3b3634", V: "#f3e6b8", J: "#ffd45c", B: "#ffffff" }; // la lanterne allumée
const COULEURS_AILE = { W: "#ffffff", L: "#8a779b" };
const LARGEUR_IMAGE = 28; // une image de la lanterne ailée : 28 x 16 (la lanterne fait 10 x 14, les ailes dépassent de 9 de chaque côté)
const HAUTEUR_IMAGE = 16;

// dessine les deux images (ailes levées, ailes baissées) dans une seule texture, l'une sous l'autre
function creerTexture(scene) {
    if (scene.textures.exists("lanterne_vivante")) return;
    const texture = scene.textures.createCanvas("lanterne_vivante", LARGEUR_IMAGE, HAUTEUR_IMAGE * 2);
    const ctx = texture.getContext();
    const pixel = (x, y, couleur) => { ctx.fillStyle = couleur; ctx.fillRect(x, y, 1, 1); };
    [AILE_HAUT, AILE_BAS].forEach((aile, image) => {
        const haut = image * HAUTEUR_IMAGE; // première ligne de cette image dans la texture
        MOTIF_LANTERNE.forEach((ligne, y) => [...ligne].forEach((lettre, x) => { if (lettre !== ".") pixel(9 + x, haut + 2 + y, COULEURS_LANTERNE[lettre]); }));
        const departAile = haut + (image === 0 ? 1 : 5); // où commence la première ligne de l'aile
        aile.forEach((ligne, y) => [...ligne].forEach((lettre, x) => {
            if (lettre === ".") return;
            pixel(19 + x, departAile + y, COULEURS_AILE[lettre]); // aile droite
            pixel(8 - x, departAile + y, COULEURS_AILE[lettre]); // aile gauche : la même, retournée
        }));
        texture.add(image, 0, 0, haut, LARGEUR_IMAGE, HAUTEUR_IMAGE); // image numéro 0 puis 1
    });
    texture.refresh();
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou quand on agrandit
}

export function preparerLanternesVivantes(scene) {
    creerTexture(scene);
    if (!scene.anims.exists("lanterne_vivante_vol")) {
        scene.anims.create({ key: "lanterne_vivante_vol", frames: scene.anims.generateFrameNumbers("lanterne_vivante", { start: 0, end: 1 }), frameRate: 6, repeat: -1 }); // les ailes battent
    }
    const groupe = scene.physics.add.group({ allowGravity: false });
    scene.lanternesVivantes = groupe; // (personnage.js s'en sert pour la visée auto)
    if (scene.groupe_plateformes) scene.physics.add.collider(groupe, scene.groupe_plateformes); // elle ne traverse pas les murs
    if (scene.tirsJoueur) scene.physics.add.overlap(scene.tirsJoueur, groupe, (tir, lanterne) => abattre(scene, lanterne, tir)); // un tir l'abat
    const diriger = () => groupe.getChildren().forEach(lanterne => dirigerLanterne(scene, lanterne));
    scene.events.on(Phaser.Scenes.Events.UPDATE, diriger);
    const minuterie = scene.time.addEvent({ delay: DELAI_APPARITION, loop: true, callback: () => faireApparaitre(scene) });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        scene.events.off(Phaser.Scenes.Events.UPDATE, diriger);
        minuterie.remove();
    });
}

// vrai s'il n'y a aucune tuile solide dans le carré de 48 px autour du point (la lanterne y tiendrait sans toucher un mur)
function placeLibre(scene, x, y) {
    const calque = scene.groupe_plateformes;
    if (!calque || !calque.getTilesWithinWorldXY) return true; // pas de carte de tuiles : rien à éviter
    return calque.getTilesWithinWorldXY(x - 24, y - 24, 48, 48, { isColliding: true }).length === 0;
}

// une place au hasard juste au-dessus de l'écran, hors de tout mur. Renvoie null si on n'en trouve pas.
function placeApparition(scene) {
    const monde = scene.physics.world.bounds;
    const haut = scene.cameras.main.worldView.y; // le haut de l'écran
    for (let essai = 0; essai < ESSAIS; essai++) {
        const x = Phaser.Math.Between(monde.x + 40, monde.right - 40);
        const y = Math.max(monde.y + 40, haut - 70 - Math.floor(essai / 8) * 40); // juste au-dessus de l'écran ; si c'est un mur, on essaie un peu plus haut
        if (placeLibre(scene, x, y)) return { x, y };
    }
    return null;
}

// fait apparaître une lanterne vivante (renvoie null s'il y en a déjà trop ou s'il n'y a pas de place)
export function faireApparaitre(scene) {
    const groupe = scene.lanternesVivantes;
    if (!groupe || groupe.countActive() >= MAX_VIVANTES) return null;
    const place = placeApparition(scene);
    if (!place) return null;
    const lanterne = groupe.create(place.x, place.y, "lanterne_vivante", 0);
    lanterne.setScale(ECHELLE).setDepth(51); // au-dessus du voile d'ombre (50) : on la voit venir même dans le noir
    lanterne.body.setSize(10, 14).setOffset(9, 2); // la hitbox est la lanterne, sans les ailes
    lanterne.setCollideWorldBounds(true);
    lanterne.play("lanterne_vivante_vol");
    lanterne.naissance = scene.time.now;
    lanterne.phase = Math.random() * 6.28; // pour qu'elles ne flottent pas toutes en même temps
    lanterne.dernierX = place.x; // pour repérer une lanterne coincée contre un mur
    lanterne.dernierY = place.y;
    lanterne.derniereVerif = scene.time.now;
    lanterne.detourJusqua = 0;
    lanterne.detourSens = 1;
    lanterne.setAlpha(0);
    scene.tweens.add({ targets: lanterne, alpha: 1, duration: 300 }); // elle apparaît en fondu
    if (scene.textures.exists("halo_doux")) { // une lueur dorée autour (la texture vient d'ennemis.js)
        const halo = scene.add.image(place.x, place.y, "halo_doux");
        halo.setScale(0.55).setTint(0xffd45c).setBlendMode(Phaser.BlendModes.ADD).setDepth(51).setAlpha(0.8).setPipeline("SinglePipeline");
        lanterne.halo = halo;
        lanterne.once("destroy", () => halo.destroy());
    }
    return lanterne;
}

// chaque image : la lanterne se dirige vers le robot, flotte, contourne un mur si elle est coincée, et s'éteint si elle dure trop longtemps
function dirigerLanterne(scene, lanterne) {
    if (!lanterne.active) return;
    const joueur = scene.player;
    const maintenant = scene.time.now;
    if (maintenant - lanterne.naissance > DUREE_VIE && !lanterne.sEteint) { // trop vieille : elle s'éteint
        lanterne.sEteint = true;
        scene.tweens.add({ targets: lanterne, alpha: 0, duration: 500, onComplete: () => lanterne.destroy() });
    }
    const dx = joueur.x - lanterne.x;
    const dy = (joueur.y - 26) - lanterne.y; // elle vise le milieu du corps du robot (joueur.y = ses pieds)
    const distance = Math.hypot(dx, dy) || 1;
    let vx = 0;
    let vy = 0;
    if (distance > DISTANCE_ARRET) { // elle fonce vers le robot, à la moitié de sa vitesse
        vx = dx / distance * VITESSE;
        vy = dy / distance * VITESSE;
    }
    if (maintenant - lanterne.derniereVerif > 600) { // toutes les 0,6 s : a-t-elle avancé ? Sinon elle est coincée contre un mur
        const avance = Math.hypot(lanterne.x - lanterne.dernierX, lanterne.y - lanterne.dernierY);
        if (avance < 12 && distance > DISTANCE_ARRET + 30) { // elle a presque fait du sur-place alors qu'elle devrait avancer
            lanterne.detourJusqua = maintenant + 1200; // elle part sur le côté pendant 1,2 s
            lanterne.detourSens = Math.random() < 0.5 ? -1 : 1;
        }
        lanterne.dernierX = lanterne.x;
        lanterne.dernierY = lanterne.y;
        lanterne.derniereVerif = maintenant;
    }
    if (maintenant < lanterne.detourJusqua && distance > 1) { // détour : surtout sur le côté, un peu vers le robot
        const cote = lanterne.detourSens;
        const ux = (-dy / distance * cote * 0.85 + dx / distance * 0.15);
        const uy = (dx / distance * cote * 0.85 + dy / distance * 0.15);
        const norme = Math.hypot(ux, uy) || 1;
        vx = ux / norme * VITESSE;
        vy = uy / norme * VITESSE;
    }
    vy += Math.sin((maintenant / 280) + lanterne.phase) * 18; // elle flotte doucement de haut en bas
    lanterne.body.setVelocity(vx, vy);
    if (Math.abs(dx) > 8) lanterne.setFlipX(dx < 0); // elle regarde vers le robot
    if (lanterne.halo) lanterne.halo.setPosition(lanterne.x, lanterne.y);
}

// un tir touche une lanterne vivante
function abattre(scene, lanterne, tir) {
    if (!lanterne.active) return;
    tir.destroy();
    const x = lanterne.x;
    const y = lanterne.y;
    lanterne.destroy(); // sa lueur disparaît avec elle
    jouerSon(scene, "lanterne"); // le verre qui casse
    lanterneVivanteMorte(scene, x, y); // éclats dorés et blancs, éclair
    donnerBoost(scene); // le robot est boosté
}
