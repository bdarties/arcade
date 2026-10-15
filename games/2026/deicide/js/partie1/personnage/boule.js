// boule.js : le robot se met « en boule » quand il reste immobile : après 1 seconde sans bouger ni agir, il devient invulnérable aux dégâts, sauf à
// ceux des rayons du boss (colonnes, balayage, geysers, lasers : voir blesserJoueur dans niveau_de_base.js, paramètre « perce »). Dès qu'il bouge, tire, saute
// ou dashe, il sort de la boule. À appeler à chaque image, dans update() du niveau, juste après majPersonnage.
import * as effets from "../systemes/effets.js"; // le clignotement

const DELAI_BOULE = 1000; // ms d'immobilité avant de se mettre en boule

function bouge(scene) { // vrai si le robot fait quoi que ce soit : une touche tenue, une action en cours, un mouvement, ou il n'est pas au sol
    const joueur = scene.player; // le robot
    const clavier = scene.clavier; // les flèches du clavier
    const touches = joueur.touches; // les touches de saut, tir et dash
    const corps = joueur.body; // la hitbox du robot
    const touchesTenues = clavier.left.isDown || clavier.right.isDown || clavier.up.isDown || clavier.down.isDown // vrai si une flèche est tenue...
        || touches.saut.isDown || touches.tir.isDown || touches.dash.isDown; // ...ou une touche d'action
    const auSol = corps.blocked.down || corps.touching.down; // vrai si le robot est au sol
    return touchesTenues || Boolean(joueur.action) || !auSol || Math.abs(corps.velocity.x) > 5; // (pas la vitesse verticale : au sol le robot rebondit un tout petit peu en permanence)
}

export function majBoule(scene) { // appelée à chaque image : décide si le robot se met en boule
    const joueur = scene.player; // le robot
    if (!joueur || !joueur.body) return; // pas de robot : rien à faire
    if (scene.mort || scene.partieFinie || bouge(scene)) { // il bouge (ou la partie s'arrête) : plus de boule, et le compte à rebours repart de zéro
        scene.immobileDepuis = null; // on oublie depuis quand il est immobile
        if (joueur.enBoule) sortirDeLaBoule(scene); // s'il était en boule, il en sort
        return; // on s'arrête là
    }
    if (scene.immobileDepuis === null || scene.immobileDepuis === undefined) scene.immobileDepuis = scene.time.now; // il vient de s'arrêter
    if (!joueur.enBoule && scene.time.now - scene.immobileDepuis >= DELAI_BOULE) entrerEnBoule(scene); // immobile depuis assez longtemps : il se met en boule
}

function entrerEnBoule(scene) { // le robot se met en boule
    const joueur = scene.player; // le robot
    joueur.enBoule = true; // blesserJoueur (niveau_de_base.js) le lit
    // il garde la pose d'attente et clignote, comme pendant l'invincibilité : on voit qu'il est protégé
    joueur.tweenBoule = effets.clignoter(scene, joueur, { alpha: 0.35, duration: 90 }); // il clignote tant qu'il reste en boule
}

function sortirDeLaBoule(scene) { // le robot sort de la boule
    const joueur = scene.player; // le robot
    joueur.enBoule = false; // il n'est plus en boule
    if (joueur.tweenBoule) joueur.tweenBoule.stop(); // le clignotement s'arrête
    joueur.tweenBoule = null; // on arrête le clignotement
    joueur.setAlpha(1); // il redevient bien visible
}
