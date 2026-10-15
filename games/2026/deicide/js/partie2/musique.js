// ⚠ PARTIE 2 : HORS ÉVALUATION. Cette partie n'est pas à prendre en compte dans la partie évaluée (qui est la partie 1, dans js/partie1/).
// Elle a été ajoutée à la fin, uniquement pour rendre le jeu plus intéressant sur la borne et répondre à la demande de Nicolas Maurin :
// rendre le jeu plus difficile et ajouter du contenu. Voir js/partie2/lisez-moi.md.
// RETIRABLE : cette partie est indépendante. Supprimer ce dossier et les 4 références dans index.js (voir js/partie2/lisez-moi.md) : le jeu marche sans elle.
// musique.js : la musique du dernier combat : « Boss Battle #9 [Metal] » de nene (CC0, OpenGameArt), 113 battements par minute, en mi mineur.
// Elle s'ajoute à la table MUSIQUES_BOSS de partie1/systemes/sons.js (version "2"). Elle n'est PAS chargée avec le reste du jeu : décodée, elle pèse
// 21 Mo en mémoire (le reste de la musique : 20 Mo au lancement), et le Raspberry Pi de la borne est juste en mémoire. Elle se charge seulement quand on arrive
// au dernier combat (niveau3.js, preload).
import { MUSIQUES_BOSS } from "../partie1/systemes/sons.js";

const DOSSIER = "./assets/sons/";

export function chargerMusiqueDernierBoss(scene) {
    if (scene.cache.audio.exists("cri_boss")) return; // (déjà chargés : le niveau a déjà été joué)
    scene.load.audio("cri_boss", [DOSSIER + "cri_boss.ogg", DOSSIER + "cri_boss.mp3"]); // le cri du boss quand il revient (faux_pantheon.js) : 2,5 s, 41 Ko
    scene.load.audio("musique_boss2_intro", [DOSSIER + "musique_boss2_intro.ogg", DOSSIER + "musique_boss2_intro.mp3"]);
    scene.load.audio("musique_boss2_boucle", [DOSSIER + "musique_boss2_boucle.ogg", DOSSIER + "musique_boss2_boucle.mp3"]);
}

export function installerMusique() { // à appeler une fois, avant la création du jeu
    MUSIQUES_BOSS["2"] = {
        volume: 0.18, // 7 dB plus forte que la musique du premier boss (mesure en LUFS) : volume de base plus bas
        // un battement = 531 ms. Son pas est la double-croche (133 ms) : plus fin que la croche (265 ms), pour garder les annonces d'attaque courtes tout en restant en rythme
        pas: 60000 / 113 / 4,
        ton: 200, // un ton au-dessus de ré mineur : les bruitages accordés prennent +200 centièmes de ton
        charger: chargerMusiqueDernierBoss
    };
}
