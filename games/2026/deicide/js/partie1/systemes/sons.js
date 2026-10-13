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
// la musique des combats de boss est franchement plus forte que celle du niveau (0,3 avec un morceau plus doux) // la musique metal du boss
// est plus forte à l'origine que celle du niveau : on baisse son volume de base pour qu'elles sonnent pareil
export const VOLUME_MUSIQUE_BOSS = 0.42;
let musique = null; // la musique en cours, une seule à la fois pour tout le jeu
let volumeBase = VOLUME_MUSIQUE; // le volume de base de la musique en cours (avant le réglage du joueur)
export function volumeEffets() { return reglages.effets / VOLUME_MAX; } // réglage des bruitages, entre 0 et 1 (sert aussi au bip de bonus.js)
// applique tout de suite le réglage à la musique qui joue
export function majVolumeMusique() { if (musique) musique.setVolume(volumeBase * reglages.musique / VOLUME_MAX); }

export function chargerSons(scene) { // à appeler dans le preload du niveau 1, avec les autres chargements
    Object.keys(SONS).forEach(nom => scene.load.audio(nom, DOSSIER + nom + ".mp3")); // charge chaque son de la liste
    // l'ogg boucle sans blanc, le mp3 sert si le navigateur ne lit pas l'ogg
    scene.load.audio("musique_niveau", [DOSSIER + "musique_niveau.ogg", DOSSIER + "musique_niveau.mp3"]);
}

// La musique metal du boss : l'introduction (jouée une fois), puis la boucle. Elle n'est pas chargée au lancement avec le reste : décodée, elle pèse
// 21 Mo en mémoire (la moitié de toute la musique), et le Raspberry Pi de la borne a peu de mémoire. Elle se charge en arrière-plan quand le niveau 1
// démarre (niveau.js, create) : elle est prête bien avant l'arène. Le niveau 2 et le 1 contre 1 la chargent dans leur preload (ils en ont besoin tout de suite).
export function chargerMusiqueBoss(scene) {
    if (!scene.cache.audio.exists("musique_boss_intro")) scene.load.audio("musique_boss_intro", [DOSSIER + "musique_boss_intro.ogg", DOSSIER + "musique_boss_intro.mp3"]);
    if (!scene.cache.audio.exists("musique_boss_boucle")) scene.load.audio("musique_boss_boucle", [DOSSIER + "musique_boss_boucle.ogg", DOSSIER + "musique_boss_boucle.mp3"]);
}
export function chargerMusiqueBossEnArrierePlan(scene) { // sans bloquer le jeu : le décodage se fait pendant qu'on joue
    if (scene.cache.audio.exists("musique_boss_boucle")) return; // déjà là (2e partie, retour après une mort...)
    chargerMusiqueBoss(scene);
    scene.load.start(); // un chargement lancé après le preload doit être démarré à la main
}

// --- Les sons de combat accordés avec la musique du boss -----------------------------------------------------------------------
// La musique metal du boss (Boss Battle #8) est à 200 battements par minute (un battement = 300 ms, une croche = 150 ms), en ré. Pendant
// ces combats :
//  - chaque bruitage est transposé sur une note de la gamme de ré mineur (ré mi fa sol la sib do) au lieu d'une hauteur au hasard : ACCORD donne,
//    pour chaque son, de combien de centièmes de ton le décaler (mesuré sur le son : voir DEVLOG.md) ;
//  - les sons d'attaque du boss sont joués sur la croche la plus proche de la musique (jouerSonSurLeTemps), et les attaques elles-mêmes sont calées
//    sur la même grille (surLeTemps) : elles partent en rythme.
const CROCHE = 150; // ms : une croche de la musique du boss
// centièmes de ton, pour tomber sur une note de ré mineur
const ACCORD = { orbe: 400, mage_incante: -200, dash: -141, lanterne: 57, ennemi_touche: 14, ennemi_mort: 240, joueur_mort: -121, tir: 168 };

// Les musiques de boss, une par « version » ("" = celle du boss du niveau 1, les fichiers musique_boss_intro / musique_boss_boucle). Pour chacune :
//   volume : volume de base ; pas : la plus petite durée du rythme (ms) ; ton : décalage des bruitages en centièmes de ton (0 = ré mineur, 200 = mi mineur) ;
//   charger(scene) : charge ses fichiers. La partie 2 y ajoute la version "2", celle du dernier boss, qui a un autre tempo et une autre tonalité.
export const MUSIQUES_BOSS = { "": { volume: VOLUME_MUSIQUE_BOSS, pas: CROCHE, ton: 0, charger: chargerMusiqueBoss } };
function musiqueBossCourante() { // la musique de boss qui joue (une entrée de MUSIQUES_BOSS), ou rien
    if (!musique || !musique.isPlaying) return null;
    const trouve = musique.key.match(/^musique_boss(\d*)_/); // « musique_boss_boucle » → "", « musique_boss2_intro » → "2"
    return trouve ? MUSIQUES_BOSS[trouve[1]] || null : null;
}
function musiqueDeBossEnCours() { return Boolean(musiqueBossCourante()); }
const pas = () => { const m = musiqueBossCourante(); return m ? m.pas : CROCHE; }; // la plus petite durée de la musique en cours
export const quantifier = (ms) => Math.max(pas(), Math.round(ms / pas()) * pas()); // arrondit une durée à un nombre entier de pas (croches)

// le délai (proche de ms) qui fait tomber l'instant visé sur une croche de la musique ; ms sans changement s'il n'y a pas de musique de boss
export function surLeTemps(scene, ms) {
    if (!musiqueDeBossEnCours()) return ms;
    const position = (musique.seek || 0) * 1000; // où en est la musique, en ms
    const cible = Math.ceil((position + ms) / pas()) * pas(); // la prochaine croche à partir de là
    return Math.max(0, cible - position);
}

export function jouerSon(scene, nom, volumeEnPlus = 1) { // joue un son une fois
    const m = musiqueBossCourante();
    const accorde = Boolean(m) && nom in ACCORD; // pendant un combat de boss : sur une note de la gamme
    const variation = accorde ? ACCORD[nom] + m.ton : Phaser.Math.Between(-100, 100); // sinon, petite variation de hauteur au hasard
    // detune change la hauteur : un son répété (tir, flèche) ne sonne pas toujours pareil
    scene.sound.play(nom, { volume: Math.min(1, SONS[nom] * volumeEffets() * volumeEnPlus), detune: variation });
}

// un son d'attaque du boss : joué sur la prochaine croche, et un peu plus fort que d'habitude (la musique est forte)
export function jouerSonSurLeTemps(scene, nom) {
    const delai = surLeTemps(scene, 0);
    if (delai < 20) jouerSon(scene, nom, 1.4);
    else scene.time.delayedCall(delai, () => jouerSon(scene, nom, 1.4));
}

function lancerMusique(scene, nom, base = VOLUME_MUSIQUE, boucle = true) { // lance une musique (en boucle par défaut), à la place de celle qui joue
    if (musique && musique.key === nom && musique.isPlaying) return; // cette musique joue déjà : on ne la relance pas depuis le début
    if (musique && musique.manager) { musique.stop(); musique.destroy(); } // (manager est vide si le son a déjà été détruit) // coupe l'ancienne musique et la libère (sans destroy, chaque nouvelle partie laissait un son de plus en mémoire)
    volumeBase = base; // on retient son volume de base : majVolumeMusique en a besoin quand le joueur règle le volume
    // crée la musique, au volume choisi dans le menu pause
    musique = scene.sound.add(nom, { loop: boucle, volume: base * reglages.musique / VOLUME_MAX });
    musique.play(); // et la lance
    return musique;
}

export function musiqueBoss(scene, version = "", dejaEssaye = false) { // la musique metal du combat de boss : une introduction, puis la boucle (version "2" : dernier boss)
    const musiqueDeBoss = MUSIQUES_BOSS[version];
    if (!musiqueDeBoss) return; // cette version n'existe pas (la partie 2 n'est pas installée) : pas de musique
    if (!scene.cache.audio.exists("musique_boss" + version + "_boucle")) { // pas encore chargée (arène atteinte très vite) : on la charge, puis elle démarre
        if (dejaEssaye) return; // le chargement a échoué : tant pis, pas de musique plutôt qu'une boucle
        musiqueDeBoss.charger(scene);
        scene.load.once(Phaser.Loader.Events.COMPLETE, () => musiqueBoss(scene, version, true));
        scene.load.start();
        return;
    }
    const volume = musiqueDeBoss.volume;
    const intro = lancerMusique(scene, "musique_boss" + version + "_intro", volume, false); // l'introduction, une seule fois
    if (!intro) return;
    // quand elle finit, la boucle prend le relais (sauf si une autre musique l'a déjà remplacée)
    intro.once("complete", () => { if (musique === intro) lancerMusique(scene, "musique_boss" + version + "_boucle", volume); });
}

export function musiqueNiveau(scene) { // remet la musique du niveau (à la mort du boss, pour l'écran de fin)
    lancerMusique(scene, "musique_niveau");
}

// à appeler dans le create d'une scène : sa musique joue à chaque fois qu'on y arrive
export function musiqueDeScene(scene, nom, base = VOLUME_MUSIQUE) {
    lancerMusique(scene, nom, base); // lance la musique tout de suite
    // scene.switch endort et réveille les scènes sans refaire create : on relance la musique au réveil
    const auReveil = () => lancerMusique(scene, nom, base);
    scene.events.on("wake", auReveil);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off("wake", auReveil)); // sans ça, chaque nouvelle partie ajoutait un écouteur de plus
}
