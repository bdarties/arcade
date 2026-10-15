// ⚠ PARTIE 2 : HORS ÉVALUATION. Cette partie n'est pas à prendre en compte dans la partie évaluée (qui est la partie 1, dans js/partie1/).
// Elle a été ajoutée à la fin, uniquement pour rendre le jeu plus intéressant sur la borne et répondre à la demande de Nicolas Maurin :
// rendre le jeu plus difficile et ajouter du contenu. Voir js/partie2/lisez-moi.md.
// RETIRABLE : cette partie est indépendante. Supprimer ce dossier et les 4 références dans index.js (voir js/partie2/lisez-moi.md) : le jeu marche sans elle.
// mode_no_hit.js : le mode « NO HIT » : le robot n'a qu'1 seul PV (la barre de vie n'a qu'une cellule) : un seul coup reçu et il recommence le niveau.
// On l'active et on le désactive en maintenant O et M pendant 1 seconde (sur le clavier : les touches O et M ; sur la borne : les boutons O et ;).
// Tant qu'il est actif, une petite phrase blanche « NO HIT » est affichée en bas à droite de l'écran de jeu.
// Ce fichier ne modifie pas la partie 1 : il enveloppe la méthode blesserJoueur de la classe de base des niveaux (niveau_de_base.js).
import niveau from "../partie1/scenes/niveau_de_base.js"; // la classe de base des niveaux : c'est elle qui retire les PV du robot
import { ROBOT } from "../partie1/parametres.js"; // le nombre de PV du robot en mode normal

const TOUCHES = ["KeyO", "Semicolon"]; // O, et la touche M d'un clavier AZERTY (la même touche physique que le bouton « ; » de la borne)
const DUREE_MAINTIEN = 1000; // ms à maintenir les deux touches pour changer de mode
const LARGEUR_IMAGE_BARRE = 112; // largeur d'une image de la barre de vie d'origine, en pixels
const HAUTEUR_IMAGE_BARRE = 20; // hauteur d'une image de la barre de vie d'origine
const LARGEUR_UNE_CELLULE = 49; // la partie gauche de la barre qui contient la 1re cellule : le logo, « PV » et une cellule
const LARGEUR_EXTREMITE = 5; // le bout droit de la barre (le contour qui la ferme), recollé après la 1re cellule
const NB_IMAGES_BARRE = 7; // la barre d'origine a 7 images : 0 à 5 PV, puis « 1 PV atténué » (le clignotement)
const PHRASE = "NO HIT : un seul coup et tu recommences"; // la phrase affichée en bas à droite de l'écran de jeu

let noHit = false; // vrai quand le mode NO HIT est actif (la valeur reste tant que la page n'est pas rechargée)

export function installerModeNoHit() { // à appeler une fois, avant la création du jeu
    envelopperBlesserJoueur(); // le robot meurt au premier coup quand le mode est actif
    envelopperCreationEtMiseAJour(); // le robot n'a qu'1 PV, et la barre de vie le montre
    brancherClavier(); // le raccourci O + M
}

function envelopperBlesserJoueur() {
    const original = niveau.prototype.blesserJoueur; // la méthode d'origine de la partie 1
    niveau.prototype.blesserJoueur = function (degats, cause, perce = false) { // on la remplace par une version qui sait lire le mode NO HIT
        if (noHit) degats = Math.max(degats, this.pv); // NO HIT : les dégâts valent au moins tous les PV restants, donc le robot meurt
        return original.call(this, degats, cause, perce); // puis on laisse la méthode d'origine faire son travail (invincibilité, mort, effets...)
    };
}

function envelopperCreationEtMiseAJour() {
    const creerRobot = niveau.prototype.creerRobot; // la création du robot d'origine (partie 1)
    niveau.prototype.creerRobot = function (carte) { // on la remplace : après la création du robot, on règle ses PV
        creerRobot.call(this, carte); // le robot, son interface et sa barre de vie sont créés normalement (avec tous les PV)
        this.etaitNoHit = noHit; // on retient si ce niveau démarre en mode NO HIT
        if (noHit) { choisirBarre(this, true); afficherPhrase(this, true); this.pv = 1; this.hud.majPV(1); } // en mode NO HIT : la barre n'a qu'une cellule et le robot 1 PV
    };
    const miseAJour = niveau.prototype.update; // la mise à jour d'origine, appelée à chaque image
    niveau.prototype.update = function () { // on la remplace : on garde les PV au bon niveau selon le mode
        miseAJour.call(this); // on fait d'abord tout ce que fait le niveau normalement
        if (noHit && !this.etaitNoHit) { this.etaitNoHit = true; choisirBarre(this, true); afficherPhrase(this, true); } // le mode vient d'être activé : la barre passe à une cellule et la phrase s'affiche
        if (noHit && this.pv > 1) { this.pv = 1; this.hud.majPV(1); } // NO HIT : même une croix de soin ne peut pas dépasser 1 PV
        if (!noHit && this.etaitNoHit) { this.etaitNoHit = false; choisirBarre(this, false); afficherPhrase(this, false); this.pv = ROBOT.pvDepart; this.hud.majPV(this.pv); } // le mode vient d'être désactivé : la barre d'origine et tous les PV reviennent
    };
}

function fabriquerBarreUneCellule(scene) { // fabrique (une seule fois) une barre de vie qui n'a qu'une cellule, à partir de l'image d'origine
    if (scene.textures.exists("barre_pv_nohit")) return; // elle existe déjà : rien à faire
    const source = scene.textures.get("barre_pv").getSourceImage(); // l'image de la barre d'origine (les 7 images l'une sous l'autre)
    const largeur = LARGEUR_UNE_CELLULE + LARGEUR_EXTREMITE; // la largeur de la nouvelle barre
    const texture = scene.textures.createCanvas("barre_pv_nohit", largeur, HAUTEUR_IMAGE_BARRE * NB_IMAGES_BARRE); // une image vide de 7 images de haut
    const ctx = texture.getContext(); // le pinceau pour dessiner dedans
    for (let i = 0; i < NB_IMAGES_BARRE; i++) { // pour chacune des 7 images
        const y = i * HAUTEUR_IMAGE_BARRE; // sa position dans la bande
        ctx.drawImage(source, 0, y, LARGEUR_UNE_CELLULE, HAUTEUR_IMAGE_BARRE, 0, y, LARGEUR_UNE_CELLULE, HAUTEUR_IMAGE_BARRE); // on recopie le début de la barre : logo, « PV » et la 1re cellule
        ctx.drawImage(source, LARGEUR_IMAGE_BARRE - LARGEUR_EXTREMITE, y, LARGEUR_EXTREMITE, HAUTEUR_IMAGE_BARRE, LARGEUR_UNE_CELLULE, y, LARGEUR_EXTREMITE, HAUTEUR_IMAGE_BARRE); // et on lui recolle le bout droit : la barre est fermée après 1 cellule
        texture.add(i, 0, 0, y, largeur, HAUTEUR_IMAGE_BARRE); // on découpe l'image numéro i, comme dans la barre d'origine
    }
    texture.refresh(); // on envoie le dessin à Phaser
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou quand on agrandit
}

function afficherPhrase(niveau, visible) { // affiche (ou retire) la petite phrase « NO HIT » en bas à droite de l'écran de jeu
    if (niveau.textePhraseNoHit && niveau.textePhraseNoHit.scene) niveau.textePhraseNoHit.destroy(); // on retire l'ancienne phrase, s'il y en a une
    niveau.textePhraseNoHit = null; // et on oublie sa référence
    if (!visible) return; // pas de phrase à afficher : on s'arrête là
    niveau.textePhraseNoHit = niveau.add.text(1270, 712, PHRASE, { fontFamily: "monospace", fontSize: "14px", color: "#ffffff", stroke: "#000000", strokeThickness: 3 }) // un petit texte blanc avec un contour noir
        .setOrigin(1, 1).setScrollFactor(0).setDepth(110); // son coin bas-droit est placé en bas à droite, il reste fixe à l'écran et au-dessus du reste
}

function choisirBarre(niveau, uneCellule) { // met sur le HUD la barre à une cellule (mode NO HIT) ou la barre d'origine (5 cellules)
    const barre = niveau.hud.barre; // l'image de la barre de vie à l'écran
    if (uneCellule) fabriquerBarreUneCellule(niveau); // on s'assure que la barre à une cellule existe
    barre.setTexture(uneCellule ? "barre_pv_nohit" : "barre_pv", barre.frame.name); // on change de dessin en gardant la même image (même nombre de PV affichés)
}

function brancherClavier() {
    const enfoncees = new Set(); // les touches du raccourci actuellement maintenues
    let debut = 0; // l'instant où les deux touches ont été enfoncées ensemble (0 : pas de maintien en cours)
    let verrou = false; // vrai juste après un changement : il faut relâcher une touche avant de pouvoir en refaire un

    window.addEventListener("keydown", (evenement) => { // à chaque touche appuyée
        if (evenement.repeat || !TOUCHES.includes(evenement.code)) return; // une répétition ou une autre touche : rien à faire
        enfoncees.add(evenement.code); // on note que cette touche est maintenue
        if (!verrou && debut === 0 && TOUCHES.every((code) => enfoncees.has(code))) debut = performance.now(); // les deux sont maintenues : le chronomètre démarre
    });
    window.addEventListener("keyup", (evenement) => { // à chaque touche relâchée
        if (!TOUCHES.includes(evenement.code)) return; // une autre touche : rien à faire
        enfoncees.delete(evenement.code); // on note qu'elle n'est plus maintenue
        debut = 0; // le maintien est interrompu
        if (enfoncees.size === 0) verrou = false; // tout est relâché : on peut de nouveau changer de mode
    });
    window.addEventListener("blur", () => { enfoncees.clear(); debut = 0; verrou = false; }); // la page perd le focus : on oublie les touches

    setInterval(() => { // toutes les 50 ms, on regarde si le maintien a duré assez longtemps
        if (debut === 0 || performance.now() - debut < DUREE_MAINTIEN) return; // pas de maintien, ou trop court : rien
        noHit = !noHit; // on change de mode : actif devient inactif et inversement
        debut = 0; // le chronomètre s'arrête
        verrou = true; // il faut relâcher avant de recommencer, sinon le mode changerait toutes les secondes
    }, 50);
}
