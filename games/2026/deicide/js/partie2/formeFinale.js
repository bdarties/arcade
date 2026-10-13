// formeFinale.js : tout ce qui rend le dernier boss plus difficile à finir (phase 3) et ce qui fait sa FORME FINALE (phase 4) :
//  - le tirage des attaques de la phase 3 (et de la forme finale) n'est plus au hasard pur : le boss lance d'abord toutes celles qu'il n'a pas encore faites ;
//  - il TIENT BON à 1 PV tant qu'il n'a pas lancé chacune de ses attaques au moins une fois : impossible de le finir sans les avoir toutes vues ;
//  - sa forme finale (phase 4) : plus grand, violet, avec six attaques ENTIÈREMENT NOUVELLES (attaquesUltimes.js) et presque aucune pause.
// La fausse fin qui précède la forme finale (le boss se dissout, le panthéon s'affiche, puis l'écran se fissure) est dans finDeCombat.js et fauxPantheon.js.
import { changerDePhase, elementsBarre } from "../partie1/ennemis/boss.js";
import { installerAttaquesUltimes } from "./attaquesUltimes.js";
import { musiqueBoss } from "../partie1/systemes/sons.js";

export const PHASE_FINALE = 3; // l'indice de la forme finale (les phases 1, 2 et 3 sont 0, 1 et 2)
const PV_FINALE = 130; // les PV de la forme finale (100 avant : un peu plus de PV)
const ECHELLE_FINALE = 4.8; // il a grossi (3,8 dans les phases 1 à 3)
const TEINTE_FINALE = 0x9a7cff; // un violet : il n'est plus rouge
export const ATTAQUES_FORME_FINALE = ["meteores", "rideaux", "horloge", "etau", "traque", "damier"]; // celles qu'il tire en forme finale : aucune ne sert avant (voir attaquesUltimes.js)

// Les attaques qu'il doit avoir lancées avant de pouvoir mourir : toutes celles de la liste de la phase (phase 3 et forme finale seulement).
function attaquesRequises(boss) {
    return boss.phase >= 2 ? [...new Set(boss.profil.attaques[boss.phase])] : null;
}

export function pvMinimum(boss) { // il ne peut pas descendre sous 1 PV tant qu'il lui reste une attaque à lancer
    const requises = attaquesRequises(boss);
    return requises && !requises.every((nom) => boss.faits.has(nom)) ? 1 : 0;
}

// Le tirage de la phase 3 et de la forme finale : d'abord, au hasard parmi les attaques pas encore lancées ; ensuite, un « sac » mélangé (chaque attaque de la liste
// ressort avant qu'une autre revienne) : plus de séries de la même attaque ni de longues absences. Phases 1 et 2 : tirage normal du moteur.
export function choisirAttaque(scene, boss) {
    const requises = attaquesRequises(boss);
    if (!requises) return null;
    const dejaLa = scene.lanternesVivantes ? scene.lanternesVivantes.countActive() : 0;
    const permis = (nom) => nom !== boss.derniereAttaque && !(nom === "lanternes" && dejaLa >= 2); // (comme le moteur : pas de lanternes s'il y en a déjà deux)
    const manquantes = requises.filter((nom) => !boss.faits.has(nom) && permis(nom));
    if (manquantes.length) return Phaser.Utils.Array.GetRandom(manquantes);
    if (boss.sacPhase !== boss.phase || !boss.sac || boss.sac.length === 0) { boss.sacPhase = boss.phase; boss.sac = Phaser.Utils.Array.Shuffle([...boss.profil.attaques[boss.phase]]); }
    const i = boss.sac.findIndex(permis);
    return i === -1 ? null : boss.sac.splice(i, 1)[0]; // null : le moteur tire normalement
}

export function pvDePhase(phase) { return phase === PHASE_FINALE ? PV_FINALE : 130; }

export function installerFormeFinale() { // à appeler une fois, avant la création du jeu
    installerAttaquesUltimes(); // les six attaques de la forme finale
}

// Les visuels de la forme finale (aussi appliqués d'un coup quand le robot meurt contre elle et que le combat reprend : voir apresApparition).
export function appliquerFormeFinale(scene, boss) {
    boss.setScale(ECHELLE_FINALE);
    boss.setTint(TEINTE_FINALE);
    boss.teinteBase = TEINTE_FINALE;
    if (boss.halo) boss.halo.setScale(7).setTint(0xb89cff);
    boss.barre.nom.setText("DIEU DE LA LUMIÈRE : FORME FINALE");
    boss.barre.reperes.forEach((repere) => repere.setVisible(false)); // plus de repères de phase : c'est un seul combat
}

// Après la fausse fin (voir finDeCombat.js, fauxPantheon.js) : le boss revient dans sa forme finale, avec tous ses PV.
export function devenirFormeFinale(scene, boss) {
    scene.registry.set("chronoActif", true); // le chrono repart (il était arrêté pendant la fausse fin)
    boss.fige = false;
    boss.intouchable = false;
    boss.setVisible(true).setAlpha(1);
    boss.body.enable = true;
    boss.pvMax = PV_FINALE;
    boss.pv = PV_FINALE;
    boss.barre.plein.width = boss.barre.fond.width - 8; // la barre est de nouveau pleine
    elementsBarre(boss).forEach((element) => element.setAlpha(1));
    appliquerFormeFinale(scene, boss);
    if (boss.halo) boss.halo.setAlpha(0.35);
    musiqueBoss(scene, boss.profil.musique); // le metal reprend
    changerDePhase(scene, boss, PHASE_FINALE); // intouchable 2 s, flash, tremblement, un PV à ramasser, « FORME FINALE »
}
