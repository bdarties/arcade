// PARTIE 2 : nous ne souhaitons pas soumettre cette partie du code à l'évaluation. Nous ne présentons que la partie 1 (js/partie1/).
// La partie 2 est uniquement présente pour améliorer la rejouabilité du jeu sur la borne (un jeu plus difficile et plus de contenu), suite à la demande
// de Nicolas Maurin. Voir js/partie2/lisez-moi.md.
// RETIRABLE : cette partie est indépendante. Supprimer ce dossier et les 4 références dans index.js (voir js/partie2/lisez-moi.md) : le jeu marche sans elle.
// musique.js : la musique du dernier combat : « Boss Battle #9 [Metal] » de nene (CC0, OpenGameArt), 113 battements par minute, en mi mineur.
// Elle s'ajoute à la table MUSIQUES_BOSS de partie1/systemes/sons.js (version "2"). Elle n'est PAS chargée avec le reste du jeu : décodée, elle pèse
// 21 Mo en mémoire (le reste de la musique : 20 Mo au lancement), et le Raspberry Pi de la borne est juste en mémoire. Elle se charge seulement quand on arrive
// au dernier combat (niveau3.js, preload).
import { MUSIQUES_BOSS, musiqueBoss } from "../partie1/systemes/sons.js";

const DOSSIER = "./assets/sons/";
const VOLUME_PHASE_4 = 0.3; // le volume de base de la musique de la phase 4 (la forme finale) : plus fort que celui des phases 1 à 3 (0,18)

// Lance la musique du dernier combat plus fort : c'est celle de la phase 4. Si la musique des phases précédentes joue encore, on la coupe d'abord.
export function lancerMusiquePhase4(scene) {
    const fiche = MUSIQUES_BOSS["2"]; // les réglages de la musique du dernier combat
    const volumeNormal = fiche.volume; // le volume des phases 1 à 3, qu'on remettra ensuite
    ["musique_boss2_intro", "musique_boss2_boucle"].forEach((cle) => scene.sound.getAll(cle).forEach((son) => son.stop())); // on coupe la musique en cours : elle repart plus fort
    fiche.volume = VOLUME_PHASE_4; // le temps du lancement, le volume est celui de la phase 4
    musiqueBoss(scene, "2"); // on lance la musique du dernier combat (l'introduction puis la boucle gardent ce volume)
    fiche.volume = volumeNormal; // on remet le volume des phases 1 à 3 pour la prochaine fois
}

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
