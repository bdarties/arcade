// boule.js : le robot se met « en boule » quand il reste immobile : après 1 seconde sans bouger ni agir, il devient invulnérable aux dégâts, sauf à
// ceux des rayons du boss (colonnes, balayage, geysers, lasers : voir blesserJoueur dans niveau.js, paramètre « perce »). Dès qu'il bouge, tire, saute
// ou dashe, il sort de la boule. À appeler à chaque image, dans update() du niveau, juste après majPersonnage.
import * as effets from "../systemes/effets.js"; // le clignotement

const DELAI_BOULE = 1000; // ms d'immobilité avant de se mettre en boule

function bouge(scene) { // vrai si le robot fait quoi que ce soit : une touche tenue, une action en cours, un mouvement, ou il n'est pas au sol
    const joueur = scene.player;
    const clavier = scene.clavier;
    const touches = joueur.touches;
    const corps = joueur.body;
    const touchesTenues = clavier.left.isDown || clavier.right.isDown || clavier.up.isDown || clavier.down.isDown
        || touches.saut.isDown || touches.tir.isDown || touches.dash.isDown;
    const auSol = corps.blocked.down || corps.touching.down;
    return touchesTenues || Boolean(joueur.action) || !auSol || Math.abs(corps.velocity.x) > 5; // (pas la vitesse verticale : au sol le robot rebondit un tout petit peu en permanence)
}

export function majBoule(scene) {
    const joueur = scene.player;
    if (!joueur || !joueur.body) return;
    if (scene.mort || scene.partieFinie || bouge(scene)) { // il bouge (ou la partie s'arrête) : plus de boule, et le compte à rebours repart de zéro
        scene.immobileDepuis = null;
        if (joueur.enBoule) sortirDeLaBoule(scene);
        return;
    }
    if (scene.immobileDepuis === null || scene.immobileDepuis === undefined) scene.immobileDepuis = scene.time.now; // il vient de s'arrêter
    if (!joueur.enBoule && scene.time.now - scene.immobileDepuis >= DELAI_BOULE) entrerEnBoule(scene);
}

function entrerEnBoule(scene) {
    const joueur = scene.player;
    joueur.enBoule = true; // blesserJoueur (niveau.js) le lit
    // il garde la pose d'attente et clignote, comme pendant l'invincibilité : on voit qu'il est protégé
    joueur.tweenBoule = effets.clignoter(scene, joueur, { alpha: 0.35, duration: 90 });
}

function sortirDeLaBoule(scene) {
    const joueur = scene.player;
    joueur.enBoule = false;
    if (joueur.tweenBoule) joueur.tweenBoule.stop(); // le clignotement s'arrête
    joueur.tweenBoule = null;
    joueur.setAlpha(1);
}
