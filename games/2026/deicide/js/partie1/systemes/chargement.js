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
    // arène du 1 contre 1 : le bas de la map 1 (générée par outils/generer_niveaux.py)
    scene.load.tilemapTiledJSON("carte_versus", "./assets/maps/arene_versus.json");
    scene.load.image("tuiles_dawn", "./assets/maps/dawn_of_the_gods_ombre.png"); // tileset principal des maps
    scene.load.image("tuile_blanc", "./assets/maps/blanc.png"); // tuile blanche des maps
    chargerEnnemis(scene); // images des ennemis
    chargerBoss(scene); // feuille du boss
    chargerSons(scene); // bruitages et musique
    CHARGEMENTS_SUPPLEMENTAIRES.forEach((charger) => charger(scene)); // ce que la suite du jeu (js/partie2) a besoin de charger : ses maps
}

// Des fonctions (scene) => ... ajoutées par js/partie2 pour charger ses propres fichiers. Vide si la partie 2 n'est pas installée : le jeu s'arrête alors à la fin du 1er boss.
export const CHARGEMENTS_SUPPLEMENTAIRES = [];

// les points posés dans Tiled sur un calque d'objets (liste vide si le calque n'existe pas : une map peut ne pas avoir tous les calques)
export function objetsDe(carte, nom) {
    const calque = carte.getObjectLayer(nom);
    return calque ? calque.objects : [];
}
