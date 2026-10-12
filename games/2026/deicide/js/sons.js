// sons.js : chargement et lecture de tous les sons du jeu
// tous les sons sont libres de droit (CC0), la liste des sources est dans assets/sons/LICENCES.md
import { reglages, VOLUME_MAX } from "./reglages.js"; // volumes choisis par le joueur dans le menu pause

const DOSSIER = "./assets/sons/"; // dossier où sont rangés les fichiers audio
const SONS = { // nom du son (= nom du fichier .mp3) : volume de base, entre 0 et 1
    tir: 0.3, // tir du joueur
    saut: 0.25, // saut et saut de mur
    dash: 0.4, // dash du joueur
    joueur_touche: 0.6, // le joueur perd un PV
    joueur_mort: 0.7, // le joueur tombe à 0 PV
    brulure: 0.45, // la lumière brûle le joueur
    fleche: 0.4, // l'archer tire une flèche
    fleche_mur: 0.3, // la flèche se plante dans un mur
    mage_incante: 0.35, // le mage commence son incantation
    orbe: 0.45, // le mage lance son orbe
    ennemi_touche: 0.45, // un ennemi prend un tir
    ennemi_mort: 0.5, // un ennemi meurt
    lanterne: 0.5, // une lanterne est éteinte (verre qui casse)
    porte: 0.5, // le joueur passe une porte
    orc_coup: 0.5 // coup de faux de l'orc
};
const VOLUME_MUSIQUE = 0.3; // volume de base de la musique (pas trop fort pour laisser entendre les bruitages)
export const VOLUME_MUSIQUE_BOSS = 0.42; // la musique des combats de boss est franchement plus forte que celle du niveau (0,3 avec un morceau plus doux) // la musique metal du boss est plus forte à l'origine que celle du niveau : on baisse son volume de base pour qu'elles sonnent pareil
let musique = null; // la musique en cours, une seule à la fois pour tout le jeu
let volumeBase = VOLUME_MUSIQUE; // le volume de base de la musique en cours (avant le réglage du joueur)
export function volumeEffets() { return reglages.effets / VOLUME_MAX; } // réglage des bruitages, entre 0 et 1 (sert aussi au bip de bonus.js)
export function majVolumeMusique() { if (musique) musique.setVolume(volumeBase * reglages.musique / VOLUME_MAX); } // applique tout de suite le réglage à la musique qui joue

export function chargerSons(scene) { // à appeler dans le preload du niveau 1, avec les autres chargements
    Object.keys(SONS).forEach(nom => scene.load.audio(nom, DOSSIER + nom + ".mp3")); // charge chaque son de la liste
    scene.load.audio("musique_niveau", [DOSSIER + "musique_niveau.ogg", DOSSIER + "musique_niveau.mp3"]); // l'ogg boucle sans blanc, le mp3 sert si le navigateur ne lit pas l'ogg
    scene.load.audio("musique_boss_intro", [DOSSIER + "musique_boss_intro.ogg", DOSSIER + "musique_boss_intro.mp3"]); // musique metal du boss : l'introduction (jouée une fois)...
    scene.load.audio("musique_boss_boucle", [DOSSIER + "musique_boss_boucle.ogg", DOSSIER + "musique_boss_boucle.mp3"]); // ...puis la boucle
}

// --- Les sons de combat accordés avec la musique du boss -----------------------------------------------------------------------
// La musique metal du boss (Boss Battle #8) est à 200 battements par minute (un battement = 300 ms, une croche = 150 ms), en ré. Pendant ces combats :
//  - chaque bruitage est transposé sur une note de la gamme de ré mineur (ré mi fa sol la sib do) au lieu d'une hauteur au hasard : ACCORD donne,
//    pour chaque son, de combien de centièmes de ton le décaler (mesuré sur le son : voir DEVLOG.md) ;
//  - les sons d'attaque du boss sont joués sur la croche la plus proche de la musique (jouerSonSurLeTemps), et les attaques elles-mêmes sont calées
//    sur la même grille (surLeTemps) : elles partent en rythme.
const CROCHE = 150; // ms : une croche de la musique du boss
const ACCORD = { orbe: 400, mage_incante: -200, dash: -141, lanterne: 57, ennemi_touche: 14, ennemi_mort: 240, joueur_mort: -121, tir: 168 }; // centièmes de ton, pour tomber sur une note de ré mineur
export function musiqueDeBossEnCours() { return Boolean(musique && musique.isPlaying && musique.key.startsWith("musique_boss")); }
export const quantifier = (ms) => Math.max(CROCHE, Math.round(ms / CROCHE) * CROCHE); // arrondit une durée à un nombre entier de croches

export function surLeTemps(scene, ms) { // le délai (proche de ms) qui fait tomber l'instant visé sur une croche de la musique ; ms sans changement s'il n'y a pas de musique de boss
    if (!musiqueDeBossEnCours()) return ms;
    const position = (musique.seek || 0) * 1000; // où en est la musique, en ms
    const cible = Math.ceil((position + ms) / CROCHE) * CROCHE; // la prochaine croche à partir de là
    return Math.max(0, cible - position);
}

export function jouerSon(scene, nom, volumeEnPlus = 1) { // joue un son une fois
    const accorde = musiqueDeBossEnCours() && nom in ACCORD; // pendant un combat de boss : sur une note de la gamme
    const variation = accorde ? ACCORD[nom] : Phaser.Math.Between(-100, 100); // sinon, petite variation de hauteur au hasard
    scene.sound.play(nom, { volume: Math.min(1, SONS[nom] * volumeEffets() * volumeEnPlus), detune: variation }); // detune change la hauteur : un son répété (tir, flèche) ne sonne pas toujours pareil
}

export function jouerSonSurLeTemps(scene, nom) { // un son d'attaque du boss : joué sur la prochaine croche, et un peu plus fort que d'habitude (la musique est forte)
    const delai = surLeTemps(scene, 0);
    if (delai < 20) jouerSon(scene, nom, 1.4);
    else scene.time.delayedCall(delai, () => jouerSon(scene, nom, 1.4));
}

function lancerMusique(scene, nom, base = VOLUME_MUSIQUE, boucle = true) { // lance une musique (en boucle par défaut), à la place de celle qui joue
    if (musique && musique.key === nom && musique.isPlaying) return; // cette musique joue déjà : on ne la relance pas depuis le début
    if (musique) musique.stop(); // coupe l'ancienne musique
    volumeBase = base; // on retient son volume de base : majVolumeMusique en a besoin quand le joueur règle le volume
    musique = scene.sound.add(nom, { loop: boucle, volume: base * reglages.musique / VOLUME_MAX }); // crée la musique, au volume choisi dans le menu pause
    musique.play(); // et la lance
    return musique;
}

export function musiqueBoss(scene) { // la musique metal du combat de boss : une introduction, puis la boucle
    const intro = lancerMusique(scene, "musique_boss_intro", VOLUME_MUSIQUE_BOSS, false); // l'introduction, une seule fois
    if (!intro) return;
    intro.once("complete", () => { if (musique === intro) lancerMusique(scene, "musique_boss_boucle", VOLUME_MUSIQUE_BOSS); }); // quand elle finit, la boucle prend le relais (sauf si une autre musique l'a déjà remplacée)
}

export function musiqueNiveau(scene) { // remet la musique du niveau (à la mort du boss, pour l'écran de fin)
    lancerMusique(scene, "musique_niveau");
}

export function musiqueDeScene(scene, nom, base = VOLUME_MUSIQUE) { // à appeler dans le create d'une scène : sa musique joue à chaque fois qu'on y arrive
    lancerMusique(scene, nom, base); // lance la musique tout de suite
    scene.events.on("wake", () => lancerMusique(scene, nom, base)); // scene.switch endort et réveille les scènes sans refaire create : on relance la musique au réveil
}
