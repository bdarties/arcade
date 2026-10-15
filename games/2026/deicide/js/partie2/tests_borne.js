// PARTIE 2 : nous ne souhaitons pas soumettre cette partie du code à l'évaluation. Nous ne présentons que la partie 1 (js/partie1/).
// La partie 2 est uniquement présente pour améliorer la rejouabilité du jeu sur la borne (un jeu plus difficile et plus de contenu), suite à la demande
// de Nicolas Maurin. Voir js/partie2/lisez-moi.md.
// RETIRABLE : cette partie est indépendante. Supprimer ce dossier et les 4 références dans index.js (voir js/partie2/lisez-moi.md) : le jeu marche sans elle.
// tests_borne.js : les touches de test de la partie 2 (TEMPORAIRES, à retirer avant la borne). Elles complètent celle de partie1/systemes/raccourcis.js (F8).
//   - F9 : lance directement le niveau 2 (la fuite)
//   - F10 : lance directement la phase 3 du dernier boss (niveau 3), le boss avec TOUTE sa vie (91 PV) pour avoir le temps de la tester
//   - F5 : lance le dernier combat et déclenche tout de suite la fausse fin (le boss se dissout, le faux écran du panthéon, la fissure de l'écran), puis la phase 4
//          (la forme finale, 180 PV). F5 ne recharge donc plus la page.
import { arreterToutesLesScenes, nouvellePartie } from "../partie1/systemes/raccourcis.js";
import { finDeCombat } from "./fin_de_combat.js";

function lancerNiveau2(jeu) { // F9 : une partie qui commence directement au niveau 2
    arreterToutesLesScenes(jeu); // (coupe aussi la musique)
    nouvellePartie(jeu);
    jeu.scene.start("niveau2");
}

function lancerPhase3(jeu) { // F10 : une partie qui commence directement à la phase 3 du dernier boss
    arreterToutesLesScenes(jeu);
    nouvellePartie(jeu);
    jeu.registry.set("phaseBoss", { profil: "soldat2", phase: 2, pv: 91 }); // la reprise de boss.js fait le reste : phase 3, tous ses PV (91)
    jeu.scene.start("niveau3");
}

let attenteBoss = null; // l'attente du boss de F5 (une seule à la fois)

function lancerPhase4(jeu) { // F5 : le dernier combat, avec la fausse fin déclenchée dès que le boss est prêt : la fissure, puis la forme finale
    clearInterval(attenteBoss);
    arreterToutesLesScenes(jeu);
    nouvellePartie(jeu);
    jeu.registry.set("phaseBoss", { profil: "soldat2", phase: 2 }); // le boss arrive en phase 3
    jeu.scene.start("niveau3");
    const debut = Date.now();
    attenteBoss = setInterval(() => { // le boss apparaît en fondu un peu après l'arrivée dans l'arène
        const niveau = jeu.scene.getScene("niveau3");
        if (Date.now() - debut > 20000) clearInterval(attenteBoss); // il n'est jamais venu : on abandonne
        else if (niveau && niveau.boss && niveau.boss.etat === "combat") { clearInterval(attenteBoss); finDeCombat(niveau, niveau.boss); }
    }, 200);
}

export function activerTestsPartie2(jeu) { // à appeler une fois, après la création du jeu
    window.addEventListener("keydown", (evenement) => {
        if (evenement.key === "F9") { evenement.preventDefault(); lancerNiveau2(jeu); }
        if (evenement.key === "F10") { evenement.preventDefault(); lancerPhase3(jeu); }
        if (evenement.key === "F5") { evenement.preventDefault(); lancerPhase4(jeu); } // (preventDefault : F5 ne recharge plus la page)
    });
}
