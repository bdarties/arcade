// lumiere.js : la lumière, au cœur du jeu : tout est dans l'ombre sauf autour du robot et des lumières, et la lumière BRÛLE.
//   - les zones de lumière (creerZoneRonde) : un halo qui brûle le robot s'il y reste 3 secondes (majLumiere) ;
//   - les lanternes (creerLanterne) : une zone de lumière avec une lanterne qu'un tir éteint (eteindreLanterne) ;
//   - le voile d'obscurité (creerVoile / majVoile) : une image grise qui assombrit l'écran, éclaircie autour du robot et des lumières ;
//   - la luminosité réglable dans le menu pause (appliquerLuminosite).
// Utilisé par : niveau.js (les crée à chaque niveau), pause.js (la luminosité), classement.js et versus.js (le halo).
import { jouerSon } from "../systemes/sons.js"; // permet de jouer les bruitages
import * as effets from "../systemes/effets.js"; // tremblements, flashs, éclats et alertes
import { reglages } from "../systemes/reglages.js"; // luminosité choisie dans le menu pause
import { creerTextureHalo, creerTexturesLanterne } from "../systemes/dessins.js"; // les textures du halo et des lanternes (dessinées en code)
export function creerZoneRonde(scene, x, y, rayon) {
    const halo = scene.add.image(x, y, "halo"); // affiche le halo sur les positions x,y
    halo.setScale(rayon / 128); // permet de creer la forme de rayon
    halo.setBlendMode(Phaser.BlendModes.ADD); // permet de gérer le mode du visuel donc c est additif, il recouvre le décor
    halo.setAlpha(0.45); // baisse l'intensité du halo pour que la lumière ne soit pas aveuglante
    // OPTIMISATION (borne) : tous les halos au même niveau, juste au-dessus des lanternes, des ennemis et du robot (niveau 0) : la carte
    // graphique les dessine d'un seul coup au lieu d'alterner halo, lanterne, halo...
    halo.setDepth(1);
    // OPTIMISATION (borne) : un halo n'a qu'une seule image, on évite le shader qui doit choisir entre plusieurs images (voir optimisation.js)
    halo.setPipeline("SinglePipeline");
    const zone = scene.add.zone(x, y, rayon * 2, rayon * 2); // la zone permet de détecter les choses qui se trouve à l'interieur
    scene.physics.add.existing(zone, true); // donne un corp physique à la zone, on met static à True
    zone.body.setCircle(rayon); // transforme la forme de base de la zone qui est un rectangle en cercle
    scene.zonesLumiere.add(zone); // On range la zone dans le groupe zonesLumiere, créé dans create() du niveau.
    zone.halo = halo;
    return zone; // si une autre fonction appelle le halo, on lui renvoi la zone
}
export function majLumiere(scene) {
    const etaitEclaire = scene.joueurEclaire; // on garde en mémoire si le joueur était dans la lumière à l'image précédente
    // est ce que le joueur touche au moins une zone de lumière maintenant
    scene.joueurEclaire = scene.physics.overlap(scene.player, scene.zonesLumiere);
    if (!scene.joueurEclaire) { // le joueur est dans l'ombre : pas de dégâts
        // il vient d'en sortir : il arrête de clignoter
        if (etaitEclaire && scene.time.now >= (scene.player.flashJusqua ?? 0)) scene.player.clearTint();
        return; // on s'arrête là
    }
    if (!etaitEclaire) { // il vient d'entrer dans la lumière
        scene.prochainDegatLumiere = scene.time.now + 3000; // le premier dégât tombera dans 3 secondes
        scene.delaiBrulure = 3000; // durée totale de l'attente avant ce dégât, pour calculer la vitesse du clignotement
    }
    clignoterBrulure(scene); // le robot clignote de plus en plus vite à l'approche du dégât
    if (scene.time.now >= scene.prochainDegatLumiere) { // le moment du dégât est arrivé
        jouerSon(scene, "brulure"); // bruit de brûlure
        scene.blesserJoueur(1, "Brûlé par la lumière"); // retire un point de vie, avec la cause de la mort
        scene.prochainDegatLumiere = scene.time.now + 2000; // le dégât suivant tombera dans 2 secondes s'il reste dans la lumière
        scene.delaiBrulure = 2000; // et le clignotement repart du début sur 2 secondes
    }
}
function clignoterBrulure(scene) { // fait clignoter le robot en blanc doré, de plus en plus vite à mesure que la brûlure approche
    const joueur = scene.player; // le robot
    if (scene.time.now < (joueur.flashJusqua ?? 0)) return; // il clignote déjà en rouge parce qu'il vient d'être touché : on ne le dérange pas
    // 1 = il vient d'entrer, 0 = le dégât tombe maintenant
    const reste = Phaser.Math.Clamp((scene.prochainDegatLumiere - scene.time.now) / scene.delaiBrulure, 0, 1);
    const periode = 80 + reste * 320; // durée d'un clignotement : 400 ms au début, 80 ms juste avant le dégât
    if (Math.floor(scene.time.now / periode) % 2 === 0) joueur.setTintFill(0xfff2c0); // une période sur deux : le robot est rempli de lumière
    else joueur.clearTint(); // l'autre période : ses vraies couleurs
}
export function eteindreLanterne(scene, tir, lanterne) {
    tir.destroy(); // permet de détruire le tir
    if (lanterne.eteinte) return; // si la lanterne est deja eteinte on return juste
    jouerSon(scene, "lanterne"); // bruit du verre de la lanterne qui casse
    effets.lanterneCassee(scene, lanterne); // éclats de verre et petit tremblement
    lanterne.eteinte = true; // fait en sorte qu'à partir de maintenant la lanterne est considérée comme éteinte
    // donc au prochain tir on sera dans le cas du if juste au dessus
    lanterne.setTexture("lanterne_eteinte"); // remplace le dessin par la lanterne éteinte (verre sombre, plus de flamme)
    const halo = lanterne.zone.halo; // on range l'image du halo dans un variable halo
    scene.zonesLumiere.remove(lanterne.zone, true, true); // on retire alors du groupe des zones de dégats lumineuse la lanterne en question
    scene.tweens.add({ targets: halo, alpha: 0, duration: 300, onComplete: () => halo.destroy() });
}
export function creerLanterne(scene, x, y, rayon) { // fonction  qui permet de creer les lanternes
    creerTexturesLanterne(scene); // dessine les textures de la lanterne si elles n'existent pas encore
    const lanterne = scene.add.image(x, y, "lanterne_allumee"); // affiche la lanterne allumée
    lanterne.setScale(3); // le dessin fait 10 x 14 pixels : on l'agrandit x3 pour qu'elle se voie bien
    scene.physics.add.existing(lanterne, true); // ajoute un corp physique au rectangle
    scene.lanternes.add(lanterne); // ajoute la lanterne crée au groupe lanternes
    lanterne.zone = creerZoneRonde(scene, x, y, rayon); // créer une zone autour de la lanterne
    lanterne.eteinte = false;
    return lanterne;
}
// OPTIMISATION (borne) : l'ombre est un dégradé très doux, on la dessine donc à un quart de la largeur et de la hauteur de
// l'écran (320 x 180) puis on l'agrandit : la carte graphique a 16 fois moins de pixels à repeindre à chaque image,
// et à l'écran la différence est à peine visible. (0.5 = moitié, plus net mais 4 fois plus lourd.)
const ECHELLE_VOILE = 0.25;
// OPTIMISATION (borne) : le voile n'est plus une couche noire à moitié transparente qu'on troue, mais une image grise qu'on
// MULTIPLIE avec l'écran : chaque pixel de l'écran est multiplié par le gris du voile à cet endroit. Un gris de 40 % (0x66)
// assombrit à 40 % : c'est exactement ce que faisait l'ancien voile noir à 60 %. Et là où il y a de la lumière, le gris
// s'éclaircit jusqu'à 100 % (écran inchangé). Le résultat à l'écran est le même, mais le voile se redessine en 2 passes pour
// la carte graphique au lieu de 4 : (1) fond gris + lumières dessinées par-dessus avec le mode "écran" (SCREEN), qui éclaircit,
// (2) copie dans le voile. Plus besoin de vider puis de repeindre le voile avant d'y percer les trous.
// le gris de l'ombre pour chaque réglage de luminosité (1 à 7, le 7 = 0xff : plus aucune ombre) : 3 = 60 % de gris, l'écran assombri de 40
// % (c'était 0x666666 puis 0x808080 : le jeu était trop sombre)
const GRIS_PAR_LUMINOSITE = [0, 0x66, 0x80, 0x99, 0xb3, 0xcc, 0xe6, 0xff];
// le gris du réglage, écrit en couleur (ex. 0x99 donne 0x999999)
function grisOmbre() { const g = GRIS_PAR_LUMINOSITE[reglages.luminosite]; return (g << 16) | (g << 8) | g; }
export function appliquerLuminosite(scene) { // change le gris de l'ombre en direct (menu pause)
    scene.fondVoile.setTint(grisOmbre()); // le fond du voile prend le nouveau gris
    scene.voileEtat.nbZones = -1; // et on force le voile à se redessiner à la prochaine mise à jour
    majVoile(scene); // on le redessine tout de suite : le menu pause est ouvert, le niveau ne se met plus à jour
}
export function creerVoile(scene) { // permet de creer le voile de lumière
    creerTextureHalo(scene);
    // crée une image en premiere plan que l'on peut ensuite modifier (demi-taille)
    const voile = scene.add.renderTexture(0, 0, scene.scale.width * ECHELLE_VOILE, scene.scale.height * ECHELLE_VOILE);
    voile.setOrigin(0, 0); // on place l'origine du voile en 0 0
    voile.setScale(1 / ECHELLE_VOILE); // et on l'agrandit pour qu'il recouvre tout l'écran
    voile.setScrollFactor(0); // on fait en sorte qu'il reste fixe
    voile.setDepth(50); // on met la profondeur au premier pan
    // OPTIMISATION (borne) : le voile couvre tout l'écran, c'est l'image la plus coûteuse à dessiner : on lui donne le shader le plus
    // simple (voir optimisation.js)
    voile.setPipeline("SinglePipeline");
    voile.setBlendMode(Phaser.BlendModes.MULTIPLY); // le voile multiplie l'écran au lieu de se poser dessus
    voile.fill(grisOmbre(), 1); // tout est dans l'ombre au départ
    // un rectangle gris de la taille du voile : le fond qu'on redessine avant les lumières
    scene.fondVoile = scene.make.image({ key: "__WHITE", add: false }).setOrigin(0, 0).setDisplaySize(voile.width, voile.height).setTint(grisOmbre());
    scene.pinceauLumiere = scene.make.image({ key: "halo", add: false }); // le pinceau qui éclaircit le voile autour du joueur et des lumières
    // mode "écran" : éclaircit sans jamais dépasser 100 %, et plusieurs lumières qui se touchent se combinent exactement comme avant
    scene.pinceauLumiere.setBlendMode(Phaser.BlendModes.SCREEN);
    scene.voile = voile; // on le met dans une variable
    // ce qui a servi à dessiner le voile la dernière fois (voir majVoile)
    scene.voileEtat = { camX: NaN, camY: NaN, joueurX: NaN, joueurY: NaN, nbZones: -1, images: 0 };
}
function percerVoile(scene, x, y, rayon, alpha) { // éclaircit le voile autour d'une lumière
    const camera = scene.cameras.main; // camera qui permet de cadrer la position
    const ecranX = x - camera.scrollX; // position de la lumière sur l'écran (x, y sont des positions dans la map)
    const ecranY = y - camera.scrollY;
    // lumière hors de l'écran : inutile de la dessiner
    if (ecranX < -rayon || ecranX > camera.width + rayon || ecranY < -rayon || ecranY > camera.height + rayon) return;
    const pinceau = scene.pinceauLumiere; // la gomme
    // L'image du halo fait 256 px, donc 128 px de rayon. On la met à l'échelle pour obtenir le rayon voulu (réduit comme le voile)
    pinceau.setScale(rayon / 128 * ECHELLE_VOILE);
    pinceau.setAlpha(alpha); // force du pinceau : 1 = éclaircit au maximum, 0.6 = éclaircit en partie
    // place le pinceau à l'endroit de la lumière sur l'écran (réduit comme le voile)
    pinceau.setPosition(ecranX * ECHELLE_VOILE, ecranY * ECHELLE_VOILE);
    scene.voile.texture.batchDraw(pinceau); // ajoute cette lumière au lot, sans la dessiner tout de suite
}
function halosVisibles(scene, tout) { // OPTIMISATION (borne) : ne dessine que les halos qui sont à l'écran
    const vue = scene.cameras.main.worldView; // la partie de la map qu'on voit
    const masquer = (halo) => { // un halo hors écran n'éclaire rien : le cacher évite de le dessiner (chaque halo additif coûte un appel de dessin)
        if (!halo || !halo.active) return;
        const reste = halo.displayWidth / 2 + 32; // son rayon, plus une marge pour les tremblements d'écran
        halo.visible = tout || (halo.x > vue.x - reste && halo.x < vue.right + reste && halo.y > vue.y - reste && halo.y < vue.bottom + reste);
    };
    if (scene.zonesLumiere) { // halos des lanternes et des zones de lumière
        const zones = scene.zonesLumiere.getChildren();
        for (let i = 0; i < zones.length; i++) masquer(zones[i].halo); // (boucle simple : pas de fonction recréée à chaque image)
    }
    if (scene.ennemis) { // halos violets des ennemis
        const liste = scene.ennemis.getChildren();
        for (let i = 0; i < liste.length; i++) masquer(liste[i].halo);
    }
}
export function majVoile(scene) { // met à jour le voile
    const camera = scene.cameras.main;
    const etat = scene.voileEtat;
    etat.images++;
    // cache les halos hors écran (pendant les 2 premières images la caméra n'est pas encore à sa place : on les laisse tous)
    halosVisibles(scene, etat.images <= 2);
    const joueur = scene.player.body.center;
    const nbZones = scene.zonesLumiere ? scene.zonesLumiere.getLength() : 0;
    // rien n'a bougé depuis la dernière fois (ni la caméra, ni le joueur, ni les lumières) : le voile est déjà bon, on ne le redessine pas
    if (etat.camX === camera.scrollX && etat.camY === camera.scrollY && etat.joueurX === joueur.x && etat.joueurY === joueur.y && etat.nbZones === nbZones) return;
    etat.camX = camera.scrollX; etat.camY = camera.scrollY; etat.joueurX = joueur.x; etat.joueurY = joueur.y; etat.nbZones = nbZones;
    // ouvre un lot : le fond et toutes les lumières seront dessinés en une seule passe, au lieu d'une passe de rendu par lumière
    scene.voile.texture.beginDraw();
    scene.voile.texture.batchDraw(scene.fondVoile); // d'abord le fond gris : il remplace tout, donc efface les lumières de l'image précédente
    percerVoile(scene, joueur.x, joueur.y, 170, 1); // lumière autour du joueur, le voile y est complètement éclairci
    if (scene.zonesLumiere) { // une lumière pour chaque zone de lumiere visible à l'écran
        const zones = scene.zonesLumiere.getChildren();
        // autour des lumières on n'éclaircit le voile qu'en partie
        for (let i = 0; i < zones.length; i++) percerVoile(scene, zones[i].x, zones[i].y, zones[i].body.radius * 1.2, 0.6);
    }
    // on repasse en mode normal : sinon la copie du lot dans le voile se ferait aussi en mode "écran" et éclaircirait tout
    scene.sys.renderer.setBlendMode(Phaser.BlendModes.NORMAL);
    scene.voile.texture.endDraw(); // ferme le lot : tout est dessiné et copié dans le voile
}
