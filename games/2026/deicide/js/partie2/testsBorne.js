// testsBorne.js : les touches de test de la partie 2 (TEMPORAIRES, à retirer avant la borne). Elles complètent celles de partie1/systemes/raccourcis.js (F8, Z + B).
//   - F9 : lance directement le niveau 2 (la fuite)
//   - F10 : lance directement la phase 3 du dernier boss (niveau 3), le boss avec TOUTE sa vie (130 PV) pour avoir le temps de la tester
import { arreterToutesLesScenes, nouvellePartie } from "../partie1/systemes/raccourcis.js";

function lancerNiveau2(jeu) { // F9 : une partie qui commence directement au niveau 2
    arreterToutesLesScenes(jeu); // (coupe aussi la musique)
    nouvellePartie(jeu);
    jeu.scene.start("niveau2");
}

function lancerPhase3(jeu) { // F10 : une partie qui commence directement à la phase 3 du dernier boss
    arreterToutesLesScenes(jeu);
    nouvellePartie(jeu);
    jeu.registry.set("phaseBoss", { profil: "soldat2", phase: 2, pv: 130 }); // la reprise de boss.js fait le reste : phase 3, tous les PV (130 = pv du profil soldat2)
    jeu.scene.start("niveau3");
}

export function activerTestsPartie2(jeu) { // à appeler une fois, après la création du jeu
    window.addEventListener("keydown", (evenement) => {
        if (evenement.key === "F9") { evenement.preventDefault(); lancerNiveau2(jeu); }
        if (evenement.key === "F10") { evenement.preventDefault(); lancerPhase3(jeu); }
    });
}
