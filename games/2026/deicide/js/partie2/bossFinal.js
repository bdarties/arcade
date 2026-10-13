// bossFinal.js : le boss du DERNIER COMBAT (niveau3.js) : le Dieu de la Lumière enragé. C'est le même moteur que le boss du niveau 1 (partie1/ennemis/boss.js),
// réglé par un profil : plus de PV, trois phases, des attaques plus rapides et plus nombreuses, et des attaques en plus (attaques.js). Une 4e phase, la FORME FINALE
// (formeFinale.js), arrive après une fausse fin (finDeCombat.js, fauxPantheon.js).
// installerBossFinal() l'ajoute à la table des profils du moteur ; il y ajoute aussi la suite du boss du niveau 1 (profil.suite : la fuite).
import { PROFILS, ATTAQUES } from "../partie1/ennemis/boss.js";
import { balayageApresColonnes, installerAttaques } from "./attaques.js";
import { enrager } from "./fuite.js";
import { finDeCombat } from "./finDeCombat.js";
import { PV_PHASE_3, ATTAQUES_FORME_FINALE, PHASE_FINALE, installerFormeFinale, pvMinimum, choisirAttaque, pvDePhase, appliquerFormeFinale } from "./formeFinale.js";

// Les réglages du boss final, une entrée par phase (voir BASE dans boss.js pour la signification de chaque valeur). Il est dur dès la phase 1.
// La 4e entrée est la forme finale : seuls « charge » (annonces plus courtes) et « periodeMouvement » comptent, ses attaques sont dans attaquesUltimes.js.
const DUR = [
    { charge: 0.8, orbes: 8, ouverture: 85, vitesse: 410, salves: 1, pluie: 14, pluieVitesse: 430, colonnes: [-280, 280], balayage: false, nova: [18, 2, 280], lanternes: 2, periodeMouvement: 1200 },
    { charge: 0.75, orbes: 11, ouverture: 115, vitesse: 460, salves: 2, pluie: 18, pluieVitesse: 460, colonnes: [-240, 240, -480, 480], balayage: true, nova: [22, 3, 310], lanternes: 2, periodeMouvement: 1200 },
    { charge: 0.7, orbes: 14, ouverture: 135, vitesse: 510, salves: 3, pluie: 22, pluieVitesse: 490, colonnes: [-220, 220, -440, 440, -660, 660], balayage: true, nova: [24, 5, 350], lanternes: 2, periodeMouvement: 850 },
    { charge: 0.62, orbes: 16, ouverture: 150, vitesse: 540, salves: 3, pluie: 26, pluieVitesse: 520, colonnes: [-190, 190, -380, 380, -570, 570, -760, 760], balayage: true, nova: [24, 5, 360], lanternes: 2, periodeMouvement: 600 }
    // balayage : les colonnes sont suivies d'un balayage au sol (voir apresColonnes)
];

// des ms en plus à la durée d'une attaque, pour que ses effets (salves suivantes, balayage après les colonnes, 2e vague de geysers) aient le temps de finir
function dureeEnPlus(nom, boss) {
    if (boss.phase === PHASE_FINALE) return -Math.round(ATTAQUES[nom].apres * 0.15); // la forme finale enchaîne ses attaques 15 % plus vite (annonces plus courtes aussi : charge 0,62)
    const r = DUR[boss.phase];
    if (nom === "orbes" && r.salves > 1) return 350 * (r.salves - 1) + 150;
    if (nom === "colonne" && r.balayage) return 1200;
    if (nom === "geysers" && boss.phase >= 2) return 1100;
    return 0;
}

export function installerBossFinal() { // à appeler une fois, avant la création du jeu
    installerAttaques(); // spirale, geysers, lasers, piqué
    installerFormeFinale(); // les attaques combinées de la forme finale
    PROFILS.soldat.suite = enrager; // la suite du boss du niveau 1 : si le joueur répond OUI, il s'enrage et c'est la fuite
    PROFILS.soldat2 = { // le dernier combat : le même boss, enragé, bien plus fort que dans l'arène du niveau 1
        musique: "2", // « Boss Battle #9 » (voir musique.js) : le premier combat garde « Boss Battle #8 »
        pv: 176, seuils: [136, 91], // (176 = 40 + 45 + 91 : les phases 1 et 2 gardent leurs 40 et 45 PV d'avant, la phase 3 en a 91 ; plus aucun soin en cours de combat) echelle: 3.8, teinte: 0xff6a5a, nom: "DIEU DE LA LUMIÈRE ENRAGÉ", cause: "le Dieu enragé", points: 3000,
        pauses: [1250, 900, 220, 120], // des attaques beaucoup plus rapprochées : en phase 3 et en forme finale, presque sans répit
        pvPleinsApresMort: true, // si le robot meurt, le boss garde la phase atteinte mais repart avec TOUS ses PV
        reglages: DUR,
        attaques: [
            ["orbes", "colonne", "pluie", "orbes", "balayage", "colonne", "lasers", "lanternes"], // beaucoup d'orbes et de lasers, lanternes 1 fois sur 8
            ["orbes", "colonne", "balayage", "pluie", "nova", "colonne", "orbes", "balayage", "spirale", "geysers", "lasers", "lanternes"],
            ["orbes", "orbes", "colonne", "balayage", "pluie", "colonne", "balayage", "nova", "pique", "spirale", "geysers", "geysers", "lasers", "lasers", "lanternes"], // beaucoup de lasers (colonne, balayage) et d'orbes, une seule entrée « lanternes » sur 10 (pas plus de nova : 120 orbes d'un coup, trop pour la borne)
            ATTAQUES_FORME_FINALE // la forme finale : six attaques entièrement nouvelles (voir attaquesUltimes.js)
        ],
        dureeEnPlus,
        apresColonnes(scene, boss, valide) { if (DUR[boss.phase].balayage) balayageApresColonnes(scene, boss, valide); }, // dès la phase 2, les colonnes sont suivies d'un balayage
        // phase 3 et forme finale : le boss doit avoir lancé toutes ses attaques avant de pouvoir mourir, et il les tire dans un ordre plus régulier (formeFinale.js)
        pvMinimum,
        choisirAttaque,
        pvDePhase, // la forme finale a ses propres PV
        // La phase 3 commence avec les 91 PV qu'il lui reste : le boss ne se soigne JAMAIS en changeant de phase (avant, il remontait à 91 PV au milieu du combat). Après une mort, il repart
        // de la phase atteinte : en phase 3 avec ses 91 PV (pvApresMort), sinon avec tous ses PV (pvPleinsApresMort).
        pvApresMort: (phase) => (phase === 2 ? PV_PHASE_3 : undefined),
        etiquettePhase: (phase) => (phase === PHASE_FINALE ? "FORME FINALE" : "PHASE " + (phase + 1)),
        apresApparition(scene, boss) { if (boss.phase === PHASE_FINALE) appliquerFormeFinale(scene, boss); }, // le robot est mort contre la forme finale : elle revient telle quelle
        finDeCombat // à 0 PV : fausse fin (phases 1 à 3) ou vraie fin (forme finale), voir finDeCombat.js
    };
}
