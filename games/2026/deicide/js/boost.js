// boost.js : le boost du robot, que lui donnent les lanternes vivantes qu'il abat (voir lanterneVivante.js)
// Chaque lanterne abattue ajoute un niveau de boost (3 au maximum) et relance le compte à rebours de 8 secondes.
// À chaque niveau, le robot :
//   - marche 10 % plus vite     (personnage.js, BONUS_VITESSE_BOOST)
//   - tire une balle de plus à chaque tir : une rafale  (personnage.js, DELAI_RAFALE)
// Tant que le boost dure, un reflet blanc balaie le robot toutes les 0,9 s, et il laisse de petites images fantômes dorées quand il court.
// Le niveau est dans joueur.boostNiveau (0 = pas de boost) ; personnage.js le lit.
import { textePoints, flash } from "./effets.js"; // le texte « BOOST 2 » et l'éclair blanc sur le robot

const DUREE_BOOST = 8000; // ms de boost après la dernière lanterne abattue
const NIVEAU_MAX = 3;
const PERIODE_REFLET = 900; // ms entre deux reflets
const DUREE_REFLET = 320; // ms que dure un balayage
const LARGEUR_REFLET = 6; // largeur de la bande claire, en pixels de l'image du robot (avant agrandissement)
const AMPLITUDE_REFLET = 18; // la bande va de 18 px à gauche du torse à 18 px à droite
const DELAI_TRACE = 90; // ms entre deux images fantômes quand le robot court

// à appeler dans create() d'un niveau, une fois le joueur créé
export function preparerBoost(scene) {
    const joueur = scene.player;
    joueur.boostNiveau = 0;
    joueur.boostJusqua = 0;
    // le reflet est une copie du robot, remplie de blanc, dont on ne montre qu'une bande : il épouse donc la silhouette du robot
    const reflet = scene.add.image(0, 0, joueur.texture.key, joueur.frame.name);
    reflet.setVisible(false).setTintFill(0xfff6d8).setAlpha(0.85); // blanc légèrement doré, comme la lumière des lanternes
    const etat = { reflet, debutReflet: -1e9, derniereTrace: 0 };
    scene.boostEtat = etat;
    const maj = () => majBoost(scene, joueur, etat);
    scene.events.on(Phaser.Scenes.Events.UPDATE, maj);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        scene.events.off(Phaser.Scenes.Events.UPDATE, maj);
        reflet.destroy();
    });
}

// une lanterne vivante vient d'être abattue : un niveau de boost de plus
export function donnerBoost(scene) {
    const joueur = scene.player;
    if (!joueur || joueur.boostNiveau === undefined || !scene.boostEtat) return; // cette scène n'a pas de boost
    joueur.boostNiveau = Math.min(NIVEAU_MAX, joueur.boostNiveau + 1);
    joueur.boostJusqua = scene.time.now + DUREE_BOOST;
    scene.boostEtat.debutReflet = scene.time.now; // un reflet part tout de suite
    flash(joueur, 0xffffff, 90); // éclair blanc sur le robot
    textePoints(scene, joueur.x, joueur.y - 70, "BOOST " + joueur.boostNiveau); // au-dessus de sa tête
}

function majBoost(scene, joueur, etat) {
    const maintenant = scene.time.now;
    const reflet = etat.reflet;
    if (joueur.boostNiveau === 0) { // pas de boost
        if (reflet.visible) reflet.setVisible(false);
        return;
    }
    if (maintenant >= joueur.boostJusqua) { // le boost est fini
        joueur.boostNiveau = 0;
        reflet.setVisible(false);
        return;
    }

    // le reflet : une bande claire qui traverse le robot de gauche à droite
    if (maintenant - etat.debutReflet >= PERIODE_REFLET) etat.debutReflet = maintenant; // nouveau balayage
    const phase = (maintenant - etat.debutReflet) / DUREE_REFLET; // 0 = la bande entre à gauche de l'écran, 1 = elle sort à droite
    const image = joueur.frame;
    // Phaser ne sait pas découper correctement une image retournée (flipX). Le reflet n'est donc jamais retourné avec flipX : quand le
    // robot regarde à gauche, on l'affiche avec une échelle négative, ancrée sur le même torse, ce qui donne exactement le même dessin.
    const miroir = joueur.flipX; // le robot regarde à gauche
    const origineX = miroir ? 1 - joueur.originX : joueur.originX; // ancrage dans l'image d'origine (non retournée)
    const centre = origineX * image.width; // colonne du torse dans l'image d'origine
    const progression = miroir ? 1 - phase : phase; // dans l'image d'origine la bande va dans l'autre sens, mais à l'écran elle va toujours de gauche à droite
    const gauche = centre - AMPLITUDE_REFLET + progression * 2 * AMPLITUDE_REFLET - LARGEUR_REFLET / 2; // position de la bande dans l'image d'origine
    const bordGauche = Math.max(0, gauche);
    const bordDroit = Math.min(image.width, gauche + LARGEUR_REFLET);
    if (phase > 1 || bordDroit <= bordGauche) {
        reflet.setVisible(false);
    } else {
        reflet.setTexture(joueur.texture.key, image.name); // la même image que le robot à cet instant
        reflet.setFlipX(false).setOrigin(origineX, joueur.originY).setPosition(joueur.x, joueur.y);
        reflet.setScale(miroir ? -joueur.scaleX : joueur.scaleX, joueur.scaleY).setDepth(joueur.depth + 1);
        reflet.setCrop(bordGauche, 0, bordDroit - bordGauche, image.height); // on ne montre que la bande
        reflet.setVisible(true);
    }

    // images fantômes dorées quand il court : un petit effet de vitesse
    if (Math.abs(joueur.body.velocity.x) > 120 && maintenant - etat.derniereTrace >= DELAI_TRACE) {
        etat.derniereTrace = maintenant;
        const trace = scene.add.image(joueur.x, joueur.y, joueur.texture.key, image.name);
        trace.setOrigin(joueur.originX, joueur.originY).setScale(joueur.scaleX, joueur.scaleY).setFlipX(joueur.flipX);
        trace.setDepth(joueur.depth - 1).setTintFill(0xfff2c0).setAlpha(0.35);
        scene.tweens.add({ targets: trace, alpha: 0, duration: 200, onComplete: () => trace.destroy() });
    }
}
