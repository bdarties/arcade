// ⚠ PARTIE 2 : HORS ÉVALUATION. Cette partie n'est pas à prendre en compte dans la partie évaluée (qui est la partie 1, dans js/partie1/).
// Elle a été ajoutée à la fin, uniquement pour rendre le jeu plus intéressant sur la borne et répondre à la demande de Nicolas Maurin :
// rendre le jeu plus difficile et ajouter du contenu. Voir js/partie2/lisez-moi.md.
// RETIRABLE : cette partie est indépendante. Supprimer ce dossier et les 4 références dans index.js (voir js/partie2/lisez-moi.md) : le jeu marche sans elle.
// partie2/index.js : la SUITE du jeu, qui commence quand le joueur répond OUI au choix du panthéon (après la défaite du 1er boss) :
//   - la fuite du niveau 2 (niveau2.js, poursuite.js, vide.js, faisceaux.js),
//   - le dernier combat contre le Dieu enragé (niveau3.js).
// Tout ce qui est dans js/partie1 forme un jeu complet qui s'arrête à la fin du 1er boss ; cette partie 2 s'y branche sans le modifier.
// index.js (à la racine du jeu) appelle installerPartie2() avant de créer le jeu, et ajoute les scènes de scenesPartie2 à la liste des scènes.
import niveau2 from "./niveau2.js";
import niveau3 from "./niveau3.js";
import fauxPantheon from "./faux_pantheon.js"; // le faux écran de victoire qui se fissure (avant la forme finale du boss)
import { installerBossFinal } from "./boss_final.js";
import { installerMusique } from "./musique.js";
import { preparerFuite } from "./fuite.js";
import { CHARGEMENTS_SUPPLEMENTAIRES } from "../partie1/systemes/chargement.js";
import { EXTENSIONS_NIVEAU1 } from "../partie1/scenes/niveau1.js";
export { activerTestsPartie2 } from "./tests_borne.js"; // touches de test F9 et F10 (à retirer avant la borne)

export const scenesPartie2 = [niveau2, niveau3, fauxPantheon]; // les écrans de la suite du jeu

function chargerPartie2(scene) { // les maps de la suite (des fichiers Tiled)
    scene.load.tilemapTiledJSON("carte_niveau2", "./assets/maps/niveau2.json"); // map du niveau 2 (dessinée dans Tiled)
    scene.load.tilemapTiledJSON("carte_arene_dieu", "./assets/maps/arene_dieu.json"); // arène du dernier combat
}

export function installerPartie2() { // à appeler une fois, avant la création du jeu
    CHARGEMENTS_SUPPLEMENTAIRES.push(chargerPartie2); // les maps de la suite
    EXTENSIONS_NIVEAU1.push(preparerFuite); // la fuite après le 1er boss (le mur qui se brise, la sortie vers le niveau 2)
    installerBossFinal(); // le boss du dernier combat, ses attaques, et la suite du 1er boss (le Dieu qui s'enrage)
    installerMusique(); // la musique du dernier combat
}
