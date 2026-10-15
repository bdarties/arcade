// Barre de vie du joueur (HUD)
//
// L'image assets/spritesheet/hud/barre_pv.png est une bande de 7 images de 112 x 20 pixels, dessinée
// pixel par pixel avec la palette du Bot Wheel : une roue avec la tête du robot, et 5 cellules.
//   images 0 à 5 : la barre avec 0, 1, 2, 3, 4 puis 5 cellules allumées (les yeux du robot s'éteignent à 0 PV)
//   image 6      : 1 PV, version atténuée. À 1 PV la barre alterne entre les images 1 et 6 : elle clignote.
// L'image est prévue pour 5 PV maximum (une cellule par PV).
//
// Quand les PV changent, la barre change simplement d'image : une cellule de moins (ou de plus). Il n'y a pas d'animation.
//
// Utilisation :
//   preload() de "niveau1"    : chargerBarreDeVie(this)
//   create()  d'un niveau     : this.barrePV = creerBarreDeVie(this, 20, 20, this.pv)
//   quand les PV changent     : majBarreDeVie(this.barrePV, this.pv)

const CLE = "barre_pv"; // le nom de la bande d'images dans Phaser
const FICHIER = "./assets/spritesheet/hud/barre_pv.png"; // le fichier de la bande d'images
const LARGEUR = 112; // taille d'une image de la bande
const HAUTEUR = 20; // hauteur d'une image, en pixels
export const HAUTEUR_BARRE = HAUTEUR; // (hud.js s'en sert pour poser les plaques sous la barre)
export const ECHELLE_HUD = 3; // agrandissement de tout le HUD (barre, vies, jauge, score, chrono) : le robot, lui, reste à x2
const ECHELLE = ECHELLE_HUD; // agrandissement de la barre
export const PV_MAX_BARRE = 5; // nombre de cellules de la barre
const IMAGE_FAIBLE = 6; // "1 PV" atténué
const DELAI_CLIGNOTEMENT = 400; // ms entre deux images quand il ne reste qu'1 PV

// à appeler dans preload()
export function chargerBarreDeVie(scene) { // charge la bande d'images de la barre de vie (dans preload)
    scene.load.spritesheet(CLE, FICHIER, { frameWidth: LARGEUR, frameHeight: HAUTEUR }); // on la découpe en images de 112 x 20
}

// crée la barre en (x, y) (coin haut-gauche) avec "pv" cellules allumées
export function creerBarreDeVie(scene, x, y, pv) { // crée la barre à l'écran
    scene.textures.get(CLE).setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou quand on agrandit
    const barre = scene.add.image(x, y, CLE); // on crée l'image de la barre
    barre.setOrigin(0, 0); // son point d'ancrage est son coin haut-gauche
    barre.setScale(ECHELLE); // on l'agrandit
    barre.setScrollFactor(0); // reste fixe à l'écran quand la caméra bouge
    barre.setDepth(100); // au-dessus du décor et du joueur
    barre.attenuee = false; // vrai quand le clignotement est sur l'image atténuée
    barre.pvAffiches = imagePour(pv); // l'image qui correspond aux PV de départ
    barre.setFrame(barre.pvAffiches); // on affiche cette image
    // le clignotement ne fait rien tant qu'il reste plus d'1 PV
    const minuteur = scene.time.addEvent({ // un minuteur qui fait clignoter la barre
        delay: DELAI_CLIGNOTEMENT, // toutes les 400 ms
        loop: true, // en boucle
        callback: () => { // à chaque tic :
            if (!barre.active || barre.pvAffiches !== 1) return; // si la barre est détruite ou s'il reste plus d'1 PV, rien
            barre.attenuee = !barre.attenuee; // on alterne entre image normale et image atténuée
            barre.setFrame(barre.attenuee ? IMAGE_FAIBLE : 1); // on affiche l'image correspondante
        }
    });
    barre.once("destroy", () => minuteur.remove()); // quand la barre est détruite, on arrête le minuteur
    return barre; // on renvoie la barre
}

// à appeler quand les PV changent : la barre prend l'image qui correspond au nombre de cellules
export function majBarreDeVie(barre, pv) { // met la barre à jour quand les PV changent
    barre.pvAffiches = imagePour(pv); // on calcule la nouvelle image
    barre.attenuee = false; // on repart de l'image normale
    barre.setFrame(barre.pvAffiches); // on affiche cette image
}

// les PV peuvent être négatifs ou décimaux : on les ramène à une image de la bande (0 à 5)
function imagePour(pv) { // transforme des PV en numéro d'image
    return Phaser.Math.Clamp(Math.round(pv), 0, PV_MAX_BARRE); // on le garde entre 0 et 5
}
