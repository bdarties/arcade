// sons.js : chargement et lecture de tous les sons du jeu
// tous les sons sont libres de droit (CC0), la liste des sources est dans assets/sons/LICENCES.md

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
let musique = null; // la musique en cours, une seule à la fois pour tout le jeu

export function chargerSons(scene) { // à appeler dans le preload du niveau 1, avec les autres chargements
    Object.keys(SONS).forEach(nom => scene.load.audio(nom, DOSSIER + nom + ".mp3")); // charge chaque son de la liste
    scene.load.audio("musique_niveau", [DOSSIER + "musique_niveau.ogg", DOSSIER + "musique_niveau.mp3"]); // l'ogg boucle sans blanc, le mp3 sert si le navigateur ne lit pas l'ogg
}

export function jouerSon(scene, nom) { // joue un son une fois
    const variation = Phaser.Math.Between(-100, 100); // petite variation de hauteur au hasard
    scene.sound.play(nom, { volume: SONS[nom], detune: variation }); // detune change la hauteur : un son répété (tir, flèche) ne sonne pas toujours pareil
}

function lancerMusique(scene, nom) { // lance une musique en boucle, à la place de celle qui joue
    if (musique && musique.key === nom && musique.isPlaying) return; // cette musique joue déjà : on ne la relance pas depuis le début
    if (musique) musique.stop(); // coupe l'ancienne musique
    musique = scene.sound.add(nom, { loop: true, volume: 0.3 }); // crée la musique, en boucle et pas trop forte pour laisser entendre les bruitages
    musique.play(); // et la lance
}

export function musiqueDeScene(scene, nom) { // à appeler dans le create d'une scène : sa musique joue à chaque fois qu'on y arrive
    lancerMusique(scene, nom); // lance la musique tout de suite
    scene.events.on("wake", () => lancerMusique(scene, nom)); // scene.switch endort et réveille les scènes sans refaire create : on relance la musique au réveil
}
