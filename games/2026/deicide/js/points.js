// points.js : les points gagnés pendant la partie, et la fin de partie (temps net envoyé au classement)
// les points de chaque ennemi sont dans ennemis.js (archer.points, mage.points, orc.points)
// Le classement se fait au TEMPS NET : le chrono, moins du temps pour les points gagnés. Plus petit = meilleur.
import * as effets from "./effets.js"; // pour afficher les points gagnés à l'écran

const DELAI_NIVEAU2 = 2000; // ms entre la mort du Soldat et le début du niveau 2
const MS_RETIREES_PAR_POINT = 10; // 100 points = 1 seconde retirée du temps
const DELAI_FIN = 2000; // ms entre la mort du boss et l'écran de fin : on voit le bonus s'afficher

export function gagnerPoints(scene, points, x, y) { // ajoute des points au score et les affiche à l'endroit x, y
    if (!scene.hud) return; // pas de HUD dans cette scène : pas de score à mettre à jour
    scene.hud.ajouterScore(points); // ajoute les points au score affiché en haut à droite
    effets.textePoints(scene, x, y, "+" + points); // fait monter le « +100 » au-dessus de l'endroit du gain
}

export function tempsNet(tempsBrutMs, points) { // le temps qui sert au classement, jamais en dessous de 0
    return Math.max(0, tempsBrutMs - points * MS_RETIREES_PAR_POINT);
}

export function bossTue(scene, boss, profil) { // à appeler dans boss.js quand un boss meurt
    gagnerPoints(scene, profil.points, boss.x, boss.y); // bonus pour avoir tué le boss (= 10 points par seconde retirée du temps net)
    if (profil.suite) passerAuNiveauSuivant(scene, profil.suite); // le Soldat : le niveau suivant
    else finirPartie(scene); // le Dieu : c'est la fin de la partie, arrête le chrono puis ouvre l'écran de fin
}

function passerAuNiveauSuivant(scene, cle) { // fondu au noir, puis le niveau suivant (le chrono, le score et les vies continuent : ils sont dans le registry)
    scene.partieFinie = true; // plus rien ne blesse le robot ni n'ouvre la pause pendant la transition
    scene.time.delayedCall(DELAI_NIVEAU2, () => scene.cameras.main.fadeOut(600, 0, 0, 0));
    scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start(cle));
}

export function finirPartie(scene) { // arrête le chrono et envoie le joueur à l'écran de classement
    if (scene.partieFinie) return; // déjà appelée (deux déclenchements en même temps) : on ne le fait qu'une fois
    scene.partieFinie = true;
    scene.registry.set("chronoActif", false); // le chrono s'arrête tout de suite : le temps de l'animation ne compte pas
    scene.time.delayedCall(DELAI_FIN, () => {
        const tempsBrutMs = scene.registry.get("chrono");
        const points = scene.registry.get("score");
        scene.scene.start("classement", { tempsBrutMs, points, tempsNetMs: tempsNet(tempsBrutMs, points) });
    });
}
