// ⚠ PARTIE 2 : HORS ÉVALUATION. Cette partie n'est pas à prendre en compte dans la partie évaluée (qui est la partie 1, dans js/partie1/).
// Elle a été ajoutée à la fin, uniquement pour rendre le jeu plus intéressant sur la borne et répondre à la demande de Nicolas Maurin :
// rendre le jeu plus difficile et ajouter du contenu. Voir js/partie2/lisez-moi.md.
// RETIRABLE : cette partie est indépendante. Supprimer ce dossier et les 4 références dans index.js (voir js/partie2/lisez-moi.md) : le jeu marche sans elle.
// mode_no_hit.js : le mode « NO HIT » : le robot n'a qu'1 seul PV (la barre de vie n'a qu'une cellule) : un seul coup reçu et il recommence TOUT LE JEU, depuis le début du niveau 1.
// On l'active et on le désactive en maintenant O et M pendant 1 seconde (sur le clavier : les touches O et M ; sur la borne : les boutons O et ;).
// Si on termine le jeu en étant resté en mode NO HIT depuis le début de la partie, une petite pastille « NO HIT » apparaît à côté de la ligne dans le panthéon.
// Tant qu'il est actif, une petite phrase blanche « NO HIT » est affichée en bas à droite de l'écran de jeu.
// Ce fichier ne modifie pas la partie 1 : il enveloppe la méthode blesserJoueur de la classe de base des niveaux (niveau_de_base.js).
import niveau from "../partie1/scenes/niveau_de_base.js"; // la classe de base des niveaux : c'est elle qui retire les PV du robot
import { ROBOT } from "../partie1/parametres.js"; // le nombre de PV du robot en mode normal
import classement, { ecrire } from "../partie1/scenes/classement.js"; // l'écran du panthéon : on y ajoute la pastille NO HIT à côté des lignes concernées
import { jouerAction } from "../partie1/personnage/personnage.js"; // pour jouer l'animation de mort du robot
import { nouvellePartie } from "../partie1/systemes/raccourcis.js"; // remet le chrono, le score, les morts et le boss à zéro (comme une nouvelle partie)

const TOUCHES = ["KeyO", "Semicolon"]; // O, et la touche M d'un clavier AZERTY (la même touche physique que le bouton « ; » de la borne)
const DUREE_MAINTIEN = 1000; // ms à maintenir les deux touches pour changer de mode
const LARGEUR_IMAGE_BARRE = 112; // largeur d'une image de la barre de vie d'origine, en pixels
const HAUTEUR_IMAGE_BARRE = 20; // hauteur d'une image de la barre de vie d'origine
const LARGEUR_UNE_CELLULE = 49; // la partie gauche de la barre qui contient la 1re cellule : le logo, « PV » et une cellule
const LARGEUR_EXTREMITE = 5; // le bout droit de la barre (le contour qui la ferme), recollé après la 1re cellule
const NB_IMAGES_BARRE = 7; // la barre d'origine a 7 images : 0 à 5 PV, puis « 1 PV atténué » (le clignotement)
const PHRASE = "NO HIT : un seul coup et tu recommences"; // la phrase affichée en bas à droite de l'écran de jeu

const DEBUT_DE_PARTIE_MS = 10000; // activer le mode dans les 10 premières secondes d'une partie compte comme un début en NO HIT (la touche O lance le jeu depuis le menu : on ne peut pas l'activer avant)
const COULEUR_PASTILLE = 0xffd45c; // le fond doré de la pastille
const COULEUR_TEXTE_PASTILLE = 0x15111a; // le texte sombre de la pastille
const X_PASTILLE = 640; // x de la pastille : le petit espace entre le panneau de gauche et le panthéon
const Y_PREMIERE_LIGNE = 276; // y de la 1re ligne du panthéon (voir afficherTableau dans classement.js)
const ECART_LIGNES = 34; // écart entre deux lignes du panthéon

let noHit = false; // vrai quand le mode NO HIT est actif (la valeur reste tant que la page n'est pas rechargée)
let partiePropre = false; // vrai si la partie en cours a été jouée EN ENTIER en mode NO HIT (le mode n'a jamais été coupé depuis le début)
let dernierNumeroPartie = -1; // le numéro de la dernière partie vue, pour savoir quand une nouvelle partie commence

export function installerModeNoHit() { // à appeler une fois, avant la création du jeu
    envelopperBlesserJoueur(); // le robot meurt au premier coup quand le mode est actif
    envelopperCreationEtMiseAJour(); // le robot n'a qu'1 PV, et la barre de vie le montre
    envelopperMort(); // en mode NO HIT, mourir ramène au tout début du jeu
    envelopperPantheon(); // la pastille NO HIT dans le panthéon
    brancherClavier(); // le raccourci O + M
}

function envelopperBlesserJoueur() {
    const original = niveau.prototype.blesserJoueur; // la méthode d'origine de la partie 1
    niveau.prototype.blesserJoueur = function (degats, cause, perce = false) { // on la remplace par une version qui sait lire le mode NO HIT
        if (noHit) degats = Math.max(degats, this.pv); // NO HIT : les dégâts valent au moins tous les PV restants, donc le robot meurt
        return original.call(this, degats, cause, perce); // puis on laisse la méthode d'origine faire son travail (invincibilité, mort, effets...)
    };
}

function envelopperMort() {
    const mourir = niveau.prototype.mourir; // la mort d'origine : elle recommence le niveau en cours (ou seulement le combat du boss)
    niveau.prototype.mourir = function () { // on la remplace par une version qui sait lire le mode NO HIT
        if (!noHit) return mourir.call(this); // mode normal : on laisse la mort d'origine faire son travail
        this.mort = true; // le robot est mort : plus aucun coup ne compte, plus de pause
        jouerAction(this.player, "mort"); // animation de mort du robot (il ne peut plus bouger)
        this.time.delayedCall(1300, () => this.cameras.main.fadeOut(500, 0, 0, 0)); // 1,3 s plus tard, l'écran s'assombrit
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => { // quand il est tout noir...
            nouvellePartie(this.game); // ...tout est remis à zéro : chrono, score, morts, phase du boss, reprise dans l'arène
            this.sound.stopAll(); // on coupe la musique en cours (celle du boss par exemple)
            this.scene.start("niveau1"); // et on repart du début du niveau 1, même si on était dans le niveau 2 ou 3
        });
    };
}

function envelopperPantheon() {
    const monResultat = classement.prototype.monResultat; // les chiffres de la partie, tels qu'ils sont rangés dans le panthéon
    classement.prototype.monResultat = function () { // on les complète
        const resultat = monResultat.call(this); // les chiffres d'origine : temps net, temps total, morts, coups
        return partiePropre && noHit ? { ...resultat, noHit: true } : resultat; // on ajoute « noHit » seulement si la partie a été jouée en entier en mode NO HIT
    };
    const afficherTableau = classement.prototype.afficherTableau; // le dessin des 10 lignes du panthéon
    classement.prototype.afficherTableau = function () { // on le complète
        afficherTableau.call(this); // le tableau d'origine est dessiné normalement
        this.lignesTableau().forEach((ligne, i) => { // pour chaque ligne affichée
            if (!ligne || !ligne.noHit) return; // les lignes jouées en mode normal n'ont pas de pastille
            const y = Y_PREMIERE_LIGNE + i * ECART_LIGNES; // la hauteur de cette ligne
            const fond = this.add.rectangle(X_PASTILLE, y, 40, 12, COULEUR_PASTILLE); // le fond doré de la pastille
            const texte = ecrire(this, X_PASTILLE, y, "NO HIT", 1, { teinte: COULEUR_TEXTE_PASTILLE }); // le texte « NO HIT » en petit, au centre du fond
            this.groupeTableau.add([fond, texte]); // on les range dans le tableau : ils sont effacés avec lui quand il est redessiné
        });
    };
}

function envelopperCreationEtMiseAJour() {
    const creerRobot = niveau.prototype.creerRobot; // la création du robot d'origine (partie 1)
    niveau.prototype.creerRobot = function (carte) { // on la remplace : après la création du robot, on règle ses PV
        creerRobot.call(this, carte); // le robot, son interface et sa barre de vie sont créés normalement (avec tous les PV)
        const numero = this.registry.get("numeroPartie") ?? 0; // le numéro de la partie en cours (il augmente à chaque nouvelle partie)
        if (numero !== dernierNumeroPartie) { dernierNumeroPartie = numero; partiePropre = noHit; } // une nouvelle partie commence : elle est « propre » seulement si le mode est déjà actif
        this.etaitNoHit = noHit; // on retient si ce niveau démarre en mode NO HIT
        if (noHit) { choisirBarre(this, true); afficherPhrase(this, true); this.pv = 1; this.hud.majPV(1); } // en mode NO HIT : la barre n'a qu'une cellule et le robot 1 PV
    };
    const miseAJour = niveau.prototype.update; // la mise à jour d'origine, appelée à chaque image
    niveau.prototype.update = function () { // on la remplace : on garde les PV au bon niveau selon le mode
        miseAJour.call(this); // on fait d'abord tout ce que fait le niveau normalement
        if (noHit && !this.etaitNoHit) { // le mode vient d'être activé
            this.etaitNoHit = true; choisirBarre(this, true); afficherPhrase(this, true); // la barre passe à une cellule et la phrase s'affiche
            if (this.scene.key === "niveau1" && !this.areneLancee && this.registry.get("chrono") < DEBUT_DE_PARTIE_MS) partiePropre = true; // on est tout au début de la partie : elle compte comme jouée en NO HIT
        }
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
        if (!noHit) partiePropre = false; // couper le mode en cours de partie : la partie ne compte plus comme jouée en NO HIT
        debut = 0; // le chronomètre s'arrête
        verrou = true; // il faut relâcher avant de recommencer, sinon le mode changerait toutes les secondes
    }, 50);
}
