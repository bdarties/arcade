// ⚠ PARTIE 2 : HORS ÉVALUATION. Cette partie n'est pas à prendre en compte dans la partie évaluée (qui est la partie 1, dans js/partie1/).
// Elle a été ajoutée à la fin, uniquement pour rendre le jeu plus intéressant sur la borne et répondre à la demande de Nicolas Maurin :
// rendre le jeu plus difficile et ajouter du contenu. Voir js/partie2/lisez-moi.md.
// RETIRABLE : cette partie est indépendante. Supprimer ce dossier et les 4 références dans index.js (voir js/partie2/lisez-moi.md) : le jeu marche sans elle.
// fin_de_combat.js : ce qui se passe quand le boss final tombe à 0 PV.
//  - En phase 3 (ou avant) : c'est une FAUSSE FIN. Il se dissout comme pour une vraie victoire, l'écran du panthéon s'affiche... puis l'écran se fissure et le boss revient
//    en arrière-plan sous sa forme finale (faux_pantheon.js, forme_finale.js).
//  - Dans sa forme finale : c'est la VRAIE fin, il meurt pour de bon et on accède vraiment au panthéon (le classement).
import { jouerSon, musiqueNiveau } from "../partie1/systemes/sons.js";
import * as effets from "../partie1/systemes/effets.js";
import { bossTue, tempsNet } from "../partie1/systemes/points.js";
import { nettoyerCombat, elementsBarre, ECLATS_OR, ECLATS_BLANC } from "../partie1/ennemis/boss.js";
import { PHASE_FINALE, devenirFormeFinale } from "./forme_finale.js";

// Le boss se dissout : des éclairs, des éclats, un fondu d'une seconde. `apres()` est appelée quand il a disparu.
function dissoudre(scene, boss, apres) {
    nettoyerCombat(scene, boss);
    boss.etat = "mort";
    boss.fige = true; // il ne flotte plus
    boss.intouchable = true; // les tirs du robot ne lui font plus rien
    musiqueNiveau(scene); // le metal s'arrête : la musique du niveau revient pour l'écran de fin
    boss.body.enable = false;
    if (scene.lanternesVivantes) scene.lanternesVivantes.clear(true, true); // ses lanternes s'éteignent avec lui
    jouerSon(scene, "ennemi_mort");
    jouerSon(scene, "joueur_mort");
    scene.cameras.main.shake(1500, 0.008);
    boss.play("boss_mort"); // il se dissout en 1 s
    scene.tweens.add({ targets: boss.halo, alpha: 0, duration: 1100 });
    scene.tweens.add({ targets: elementsBarre(boss), alpha: 0, duration: 800 });
    scene.time.addEvent({ delay: 140, repeat: 8, callback: () => { // des éclairs et des éclats pendant qu'il disparaît
        if (!boss.active) return;
        effets.flash(boss, 0xffffff, 60);
        effets.eclats(scene, boss.x + Phaser.Math.Between(-140, 140), boss.y + Phaser.Math.Between(-100, 100), ECLATS_OR[0], 10, ECLATS_OR[1]);
    } });
    boss.once("animationcomplete-boss_mort", () => {
        scene.cameras.main.flash(500, 255, 255, 255); // un dernier éclair blanc
        effets.eclats(scene, boss.x, boss.y, ECLATS_OR[0], 30, ECLATS_OR[1]);
        effets.eclats(scene, boss.x, boss.y, ECLATS_BLANC[0], 20, ECLATS_BLANC[1]);
        apres();
    });
}

function mourir(scene, boss) { // la VRAIE fin : le dernier boss meurt pour de bon, puis c'est la fin de la partie
    dissoudre(scene, boss, () => {
        const { x, y } = boss;
        boss.destroy();
        elementsBarre(boss).forEach((e) => e.destroy());
        bossTue(scene, { x, y }, boss.profil); // points du boss, chrono arrêté, classement
    });
}

function faussePremiereFin(scene, boss) { // la FAUSSE fin : même dissolution, puis un faux écran de victoire
    scene.registry.set("chronoActif", false); // le chrono s'arrête comme pour une vraie victoire
    dissoudre(scene, boss, () => {
        boss.setVisible(false); // le boss n'est pas détruit : il reviendra
        scene.time.delayedCall(2000, () => { // comme la vraie fin, 2 s plus tard : l'écran du panthéon
            const tempsBrutMs = scene.registry.get("chrono");
            const points = scene.registry.get("score");
            scene.scene.launch("fauxPantheon", {
                origine: scene.scene.key, tempsBrutMs, points, tempsNetMs: tempsNet(tempsBrutMs, points), morts: scene.registry.get("morts") ?? 0, coups: scene.registry.get("coups") ?? 0,
                retour: () => devenirFormeFinale(scene, boss) // appelée quand l'écran s'est brisé et que le jeu reprend
            });
            scene.scene.pause(); // le jeu s'arrête derrière le faux écran
        });
    });
}

export function finDeCombat(scene, boss) { // à 0 PV
    if (boss.phase >= PHASE_FINALE) mourir(scene, boss); else faussePremiereFin(scene, boss);
}
