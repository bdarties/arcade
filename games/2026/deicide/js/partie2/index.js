// partie2/index.js : la SUITE du jeu, qui commence quand le joueur répond OUI au choix du panthéon (après la défaite du 1er boss) :
//   - la fuite du niveau 2 (niveau2.js, poursuite.js, vide.js, faisceaux.js),
//   - le dernier combat contre le Dieu enragé (niveau3.js).
// Tout ce qui est dans js/partie1 forme un jeu complet qui s'arrête à la fin du 1er boss ; cette partie 2 s'y branche sans le modifier.
// index.js (à la racine du jeu) appelle installerPartie2() avant de créer le jeu, et ajoute les scènes de scenesPartie2 à la liste des scènes.
import niveau2 from "./niveau2.js";
import niveau3 from "./niveau3.js";
import { CHARGEMENTS_SUPPLEMENTAIRES } from "../partie1/systemes/chargement.js";

export const scenesPartie2 = [niveau2, niveau3]; // les écrans de la suite du jeu

function chargerPartie2(scene) { // les maps de la suite (dessinées dans Tiled / générées par outils/generer_niveaux.py)
    scene.load.tilemapTiledJSON("carte_niveau2", "./assets/maps/niveau2.json"); // map du niveau 2 (dessinée dans Tiled)
    scene.load.tilemapTiledJSON("carte_arene_dieu", "./assets/maps/arene_dieu.json"); // arène du dernier combat
}

export function installerPartie2() { // à appeler une fois, avant la création du jeu
    CHARGEMENTS_SUPPLEMENTAIRES.push(chargerPartie2);
}
