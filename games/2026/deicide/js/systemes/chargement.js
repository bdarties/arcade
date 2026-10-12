// chargement.js : le chargement des images, sons et cartes du jeu, et la lecture des points posés dans Tiled.
// Utilisé par : le menu (il charge tout pendant qu'il affiche la barre de chargement), les niveaux, l'arène du 1 contre 1.
import { chargerPersonnage } from "../personnage/personnage.js";
import { chargerHud } from "../personnage/hud.js";
import { chargerEnnemis } from "../ennemis/ennemis.js";
import { chargerBoss } from "../ennemis/boss.js";
import { chargerSons } from "./sons.js";

// charge tous les assets du jeu (le cache est partagé entre les scènes). Le menu l'appelle dans son preload, avec une barre de
// chargement : quand on clique sur Jouer tout est déjà chargé. Le preload d'un niveau le rappelle, mais il n'a plus rien à charger.
export function chargerJeu(scene) {
    scene.load.setBaseURL(scene.sys.game.config.baseURL); // chemin du jeu, pour que les assets se chargent aussi depuis la borne
    chargerPersonnage(scene); // images du robot
    chargerHud(scene); // images du HUD
    scene.load.tilemapTiledJSON("carte_niveau1", "./assets/maps/niveau1.json"); // map du niveau 1 exportée depuis Tiled
    scene.load.tilemapTiledJSON("carte_niveau2", "./assets/maps/niveau2.json"); // map du niveau 2 (dessinée dans Tiled)
    scene.load.tilemapTiledJSON("carte_versus", "./assets/maps/arene_versus.json"); // arène du 1 contre 1 : le bas de la map 1 (générée par outils/generer_niveaux.py)
    scene.load.tilemapTiledJSON("carte_arene_dieu", "./assets/maps/arene_dieu.json"); // arène du dernier combat (générée par outils/generer_niveaux.py)
    scene.load.image("tuiles_dawn", "./assets/maps/dawn_of_the_gods_ombre.png"); // tileset principal des maps
    scene.load.image("tuile_blanc", "./assets/maps/blanc.png"); // tuile blanche des maps
    chargerEnnemis(scene); // images des ennemis
    chargerBoss(scene); // feuille du boss
    chargerSons(scene); // bruitages et musique
}

// les points posés dans Tiled sur un calque d'objets (liste vide si le calque n'existe pas : une map peut ne pas avoir tous les calques)
export function objetsDe(carte, nom) {
    const calque = carte.getObjectLayer(nom);
    return calque ? calque.objects : [];
}
