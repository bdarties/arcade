// bossFinal.js : le boss du DERNIER COMBAT (niveau3.js) : le Dieu de la Lumière enragé. C'est le même moteur que le boss du niveau 1 (partie1/ennemis/boss.js),
// réglé par un profil : plus de PV, trois phases, des attaques plus rapides et plus nombreuses, et des attaques en plus (attaques.js).
// installerBossFinal() l'ajoute à la table des profils du moteur ; il y ajoute aussi la suite du boss du niveau 1 (profil.suite : la fuite).
import { jouerSon, musiqueNiveau } from "../partie1/systemes/sons.js";
import * as effets from "../partie1/systemes/effets.js";
import { bossTue } from "../partie1/systemes/points.js";
import { PROFILS, nettoyerCombat, elementsBarre, ECLATS_OR, ECLATS_BLANC } from "../partie1/ennemis/boss.js";
import { balayageApresColonnes, installerAttaques } from "./attaques.js";
import { enrager } from "./fuite.js";

// Les réglages du boss final, une entrée par phase (voir BASE dans boss.js pour la signification de chaque valeur). Il est dur dès la phase 1.
const DUR = [
    { charge: 0.8, orbes: 8, ouverture: 85, vitesse: 410, salves: 1, pluie: 14, pluieVitesse: 430, colonnes: [-280, 280], balayage: false, nova: [18, 2, 280], lanternes: 2, periodeMouvement: 1200 },
    { charge: 0.75, orbes: 11, ouverture: 115, vitesse: 460, salves: 2, pluie: 18, pluieVitesse: 460, colonnes: [-240, 240, -480, 480], balayage: true, nova: [22, 3, 310], lanternes: 2, periodeMouvement: 1200 },
    { charge: 0.7, orbes: 14, ouverture: 135, vitesse: 510, salves: 3, pluie: 22, pluieVitesse: 490, colonnes: [-220, 220, -440, 440, -660, 660], balayage: true, nova: [24, 5, 350], lanternes: 2, periodeMouvement: 850 }
    // balayage : les colonnes sont suivies d'un balayage au sol (voir apresColonnes)
];

function mourir(scene, boss) { // le dernier boss meurt pour de bon : il se dissout, puis c'est la fin de la partie
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
        const { x, y } = boss;
        scene.cameras.main.flash(500, 255, 255, 255); // un dernier éclair blanc
        effets.eclats(scene, x, y, ECLATS_OR[0], 30, ECLATS_OR[1]);
        effets.eclats(scene, x, y, ECLATS_BLANC[0], 20, ECLATS_BLANC[1]);
        boss.destroy();
        elementsBarre(boss).forEach((e) => e.destroy());
        bossTue(scene, { x, y }, boss.profil); // points du boss, chrono arrêté, classement
    });
}

export function installerBossFinal() { // à appeler une fois, avant la création du jeu
    installerAttaques(); // spirale, geysers, lasers, piqué
    PROFILS.soldat.suite = enrager; // la suite du boss du niveau 1 : si le joueur répond OUI, il s'enrage et c'est la fuite
    PROFILS.soldat2 = { // le dernier combat : le même boss, enragé, bien plus fort que dans l'arène du niveau 1
        musique: "2", // « Boss Battle #9 » (voir musique.js) : le premier combat garde « Boss Battle #8 »
        pv: 130, seuils: [90, 45], echelle: 3.8, teinte: 0xff6a5a, nom: "DIEU DE LA LUMIÈRE ENRAGÉ", cause: "le Dieu enragé", points: 3000,
        pauses: [1250, 900, 220], // des attaques beaucoup plus rapprochées : en phase 3, presque sans répit
        pvPleinsApresMort: true, // si le robot meurt, le boss garde la phase atteinte mais repart avec TOUS ses PV
        reglages: DUR,
        attaques: [
            ["orbes", "colonne", "pluie", "orbes", "balayage", "colonne", "lasers", "lanternes"], // beaucoup d'orbes et de lasers, lanternes 1 fois sur 8
            ["orbes", "colonne", "balayage", "pluie", "nova", "colonne", "orbes", "balayage", "spirale", "geysers", "lasers", "lanternes"],
            ["orbes", "orbes", "colonne", "balayage", "pluie", "colonne", "balayage", "nova", "pique", "spirale", "geysers", "geysers", "lasers", "lasers", "lanternes"] // beaucoup de lasers (colonne, balayage) et d'orbes, une seule entrée « lanternes » sur 10 (pas plus de nova : 120 orbes d'un coup, trop pour la borne)
        ],
        // des ms en plus à la durée d'une attaque, pour que ses effets (salves suivantes, balayage après les colonnes, 2e vague de geysers) aient le temps de finir
        dureeEnPlus(nom, boss) {
            const r = DUR[boss.phase];
            if (nom === "orbes" && r.salves > 1) return 350 * (r.salves - 1) + 150;
            if (nom === "colonne" && r.balayage) return 1200;
            if (nom === "geysers" && boss.phase === 2) return 1100;
            return 0;
        },
        apresColonnes(scene, boss, valide) { if (DUR[boss.phase].balayage) balayageApresColonnes(scene, boss, valide); }, // dès la phase 2, les colonnes sont suivies d'un balayage
        finDeCombat: mourir // à 0 PV il meurt pour de bon (le boss du niveau 1, lui, propose le choix du panthéon)
    };
}
