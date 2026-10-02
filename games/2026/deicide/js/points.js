// points.js : les points gagnés pendant la partie et les bonus de fin
// les points de chaque ennemi sont dans ennemis.js (archer.points, mage.points, orc.points)
import * as effets from "./effets.js"; // pour afficher les points gagnés à l'écran

const BONUS_BOSS = 3000; // points pour avoir tué le boss final
const BONUS_RAPIDE = 1000; // points si la partie est finie assez vite
const DUREE_RAPIDE = 3 * 60 * 1000; // 3 minutes, en millisecondes (le chrono du HUD compte en millisecondes)

export function gagnerPoints(scene, points, x, y) { // ajoute des points au score et les affiche à l'endroit x, y
    if (!scene.hud) return; // pas de HUD dans cette scène : pas de score à mettre à jour
    scene.hud.ajouterScore(points); // ajoute les points au score affiché en haut à droite
    effets.textePoints(scene, x, y, "+" + points); // fait monter le « +100 » au-dessus de l'endroit du gain
}

export function bossTue(scene, boss) { // à appeler dans boss.js quand le boss meurt : c'est la fin de la partie
    gagnerPoints(scene, BONUS_BOSS, boss.x, boss.y); // bonus pour avoir tué le boss
    const temps = scene.registry.get("chrono"); // temps de la partie, en millisecondes
    if (temps < DUREE_RAPIDE) { // la partie a duré moins de 3 minutes
        scene.time.delayedCall(600, () => gagnerPoints(scene, BONUS_RAPIDE, boss.x, boss.y - 40)); // bonus de rapidité, affiché juste après celui du boss
    }
}
