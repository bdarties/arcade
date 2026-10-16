// PARTIE 2 : nous ne souhaitons pas soumettre cette partie du code à l'évaluation. Nous ne présentons que la partie 1 (js/partie1/).
// La partie 2 est uniquement présente pour améliorer la rejouabilité du jeu sur la borne (un jeu plus difficile et plus de contenu), suite à la demande
// de Nicolas Maurin. Voir js/partie2/lisez-moi.md.
// RETIRABLE : cette partie est indépendante. Supprimer ce dossier et les 4 références dans index.js (voir js/partie2/lisez-moi.md) : le jeu marche sans elle.
// mode_no_hit.js : le mode « NO HIT » : le robot n'a qu'1 seul PV (la barre de vie n'a qu'une cellule) : un seul coup reçu et il recommence TOUT LE JEU, depuis le début du niveau 1.
// On l'active et on le désactive en maintenant O et M pendant 1 seconde (sur le clavier : les touches O et M ; sur la borne : les boutons O et ;).
// Activer le mode ramène au début du niveau 1 (comme une mort) : le mode compte donc toujours depuis le début de la partie. Si on termine le jeu sans avoir quitté le mode, sa ligne du panthéon est affichée en rouge.
// Tant qu'il est actif, une petite phrase blanche « NO HIT » est affichée en bas à droite de l'écran de jeu.
// Ce fichier ne modifie pas la partie 1 : il enveloppe la méthode blesserJoueur de la classe de base des niveaux (niveau_de_base.js).
import niveau from "../partie1/scenes/niveau_de_base.js"; // la classe de base des niveaux : c'est elle qui retire les PV du robot
import { ROBOT } from "../partie1/parametres.js"; // le nombre de PV du robot en mode normal
import classement from "../partie1/scenes/classement.js"; // l'écran du panthéon : on y colore en rouge les lignes jouées en mode NO HIT
import { jouerAction } from "../partie1/personnage/personnage.js"; // pour jouer l'animation de mort du robot
import { nouvellePartie, TOUCHES as TOUCHES_JEU } from "../partie1/systemes/raccourcis.js"; // remet le chrono, le score, les morts et le boss à zéro (comme une nouvelle partie)

const TOUCHES = TOUCHES_JEU.noHit; // O, et la touche M d'un clavier AZERTY (la même touche physique que le bouton « ; » de la borne)
const DUREE_MAINTIEN = 1000; // ms à maintenir les deux touches pour changer de mode
const LARGEUR_IMAGE_BARRE = 112; // largeur d'une image de la barre de vie d'origine, en pixels
const HAUTEUR_IMAGE_BARRE = 20; // hauteur d'une image de la barre de vie d'origine
const LARGEUR_UNE_CELLULE = 49; // la partie gauche de la barre qui contient la 1re cellule : le logo, « PV » et une cellule
const LARGEUR_EXTREMITE = 5; // le bout droit de la barre (le contour qui la ferme), recollé après la 1re cellule
const NB_IMAGES_BARRE = 7; // la barre d'origine a 7 images : 0 à 5 PV, puis « 1 PV atténué » (le clignotement)
const PHRASE = "NO HIT : un seul coup et tu recommences"; // la phrase affichée en bas à droite de l'écran de jeu

const DUREE_AIDE_MS = 5000; // le message d'aide du début de partie reste affiché exactement 5 secondes
const AIDE = "Maintenir B + F pendant 1 seconde pour passer en mode NO HIT"; // le message d'aide (B et F sont les boutons de la borne : les touches O et ;)
const ROUGE_TEXTE = 0xff6a5a; // le rouge du texte d'une ligne jouée en NO HIT
const ROUGE_FOND = 0x4a1a1e; // le rouge sombre du fond de cette ligne
const ROUGE_BARRE = 0xff3030; // le rouge vif du petit trait sur le côté de cette ligne
const ROUGE_SANG = 0xb01818; // le rouge du sang (gouttes, éclaboussures)
const X_CRANE = 640; // x du crâne : le petit espace entre le panneau de gauche et le panthéon
const ECHELLE_CRANE = 3; // le crâne est dessiné en pixels de 3 x 3 à l'écran
const GOUTTES_PAR_LIGNE = 8; // nombre de gouttes qui coulent le long d'une ligne
const ECLABOUSSURES_PAR_LIGNE = 12; // nombre de taches de sang posées sur le fond d'une ligne
const X_MIN_COLONNES_DROITE = 1100; // les lettres des deux dernières colonnes (MORT et HIT, titres et chiffres) commencent à partir de cet x : les autres colonnes finissent plus à gauche
const DECALAGE_COLONNES_DROITE = 8; // de combien on décale ces deux colonnes vers la gauche : les chiffres HIT finissaient à 1186 px, alors que le creux du cadre s'arrête à 1182 px (les deux colonnes bougent ensemble pour garder le même écart)
const LARGEUR_LIGNE = 500; // la largeur du fond rouge d'une ligne : un peu moins que le creux du cadre du panthéon (504 px), pour ne pas toucher le bord
const X_CENTRE_LIGNE = 930; // le centre du creux du cadre du panthéon : le fond rouge y est centré
const LARGEUR_FOND_JOUEUR = 516; // la largeur du fond rose que classement.js pose derrière la ligne du joueur (on le reconnaît à cette largeur)
const Y_PREMIERE_LIGNE = 276; // y de la 1re ligne du panthéon (voir afficherTableau dans classement.js)
const ECART_LIGNES = 34; // écart entre deux lignes du panthéon

let noHit = false; // vrai quand le mode NO HIT est actif (la valeur reste tant que la page n'est pas rechargée)
let partiePropre = false; // vrai si la partie en cours a été jouée EN ENTIER en mode NO HIT (le mode n'a jamais été coupé depuis le début)
let dernierNumeroPartie = -1; // le numéro de la dernière partie vue, pour savoir quand une nouvelle partie commence

export function installerModeNoHit() { // à appeler une fois, avant la création du jeu
    envelopperBlesserJoueur(); // le robot meurt au premier coup quand le mode est actif
    envelopperCreationEtMiseAJour(); // le robot n'a qu'1 PV, et la barre de vie le montre
    envelopperMort(); // en mode NO HIT, mourir ramène au tout début du jeu
    envelopperPantheon(); // la ligne rouge dans le panthéon pour une partie jouée en NO HIT
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

// Le dessin du crâne, pixel par pixel : . = vide, W = os, S = ombre de l'os, K = creux noir (yeux, nez), R = sang
const MOTIF_CRANE = [
    "...WWWWW...",
    "..WWWWWWW..",
    ".WWWWWWWWW.",
    ".WWWWWWWWWS",
    ".WKKKWKKKWS",
    ".WKKKWKKKWS",
    ".WKRKWKRKWS",
    "..WWWKWWW..",
    "..WWWWWWWS.",
    "...WKWKWK..",
    "...WRWRWR..",
    "....R.R....",
];
const COULEURS_CRANE = { W: "#e7e0e9", S: "#ac98b6", K: "#15111a", R: "#d02828" }; // les couleurs du crâne

function fabriquerCrane(scene) { // fabrique (une seule fois) l'image du crâne à partir du motif
    if (scene.textures.exists("crane_no_hit")) return; // elle existe déjà : rien à faire
    const texture = scene.textures.createCanvas("crane_no_hit", 11, MOTIF_CRANE.length); // une image vide de la taille du motif
    const ctx = texture.getContext(); // le pinceau pour dessiner dedans
    MOTIF_CRANE.forEach((ligne, y) => [...ligne].forEach((lettre, x) => { // pour chaque case du motif
        if (lettre === ".") return; // un point : rien à dessiner
        ctx.fillStyle = COULEURS_CRANE[lettre]; // la couleur de cette lettre
        ctx.fillRect(x, y, 1, 1); // un seul pixel
    }));
    texture.refresh(); // on envoie le dessin à Phaser
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou quand on agrandit
}

function faireCouler(scene, x, yBord, longueur) { // une goutte de sang qui s'allonge sous le bord de la ligne, tombe, puis recommence
    const trait = scene.add.rectangle(x, yBord, 4, 1, ROUGE_SANG).setOrigin(0.5, 0); // le trait de sang qui pend (4 px de large), tout petit au départ
    scene.groupeTableau.add(trait); // on le range dans le tableau : il est effacé avec lui
    const couler = () => { // un cycle de la goutte
        if (!trait.scene) return; // le tableau a été redessiné : cette goutte n'existe plus
        trait.setScale(1, 1); // le trait repart tout petit
        const allongement = scene.tweens.add({ targets: trait, scaleY: longueur, duration: Phaser.Math.Between(1200, 2200), ease: "Sine.In", onComplete: () => { // il s'allonge doucement...
            if (!trait.scene) return; // le tableau a été redessiné : on s'arrête
            const goutte = scene.add.rectangle(x, yBord + longueur, 4, 4, ROUGE_SANG); // ...puis une goutte s'en détache
            scene.groupeTableau.add(goutte); // on la range dans le tableau
            scene.tweens.add({ targets: goutte, y: yBord + longueur + 18, alpha: 0, duration: 550, ease: "Quad.In", onComplete: () => goutte.destroy() }); // elle tombe en s'effaçant
            scene.time.delayedCall(Phaser.Math.Between(300, 1500), couler); // et un nouveau cycle commence un peu plus tard
        } });
        trait.once("destroy", () => allongement.stop()); // si le trait est détruit, on arrête son mouvement
    };
    scene.time.delayedCall(Phaser.Math.Between(0, 2500), couler); // chaque goutte démarre à un moment différent
}

function decorerLigneNoHit(scene, y) { // ajoute le crâne, les éclaboussures et les gouttes de sang sur une ligne jouée en NO HIT
    fabriquerCrane(scene); // on s'assure que l'image du crâne existe
    const crane = scene.add.image(X_CRANE, y, "crane_no_hit").setScale(ECHELLE_CRANE); // le crâne, dans l'espace à gauche de la ligne
    scene.groupeTableau.add(crane); // on le range dans le tableau
    scene.tweens.add({ targets: crane, alpha: 0.7, duration: 900, yoyo: true, repeat: -1, ease: "Sine.InOut" }); // il palpite doucement
    const gauche = X_CENTRE_LIGNE - LARGEUR_LIGNE / 2; // le bord gauche de la ligne
    for (let i = 0; i < ECLABOUSSURES_PAR_LIGNE; i++) { // des taches de sang éparpillées sur le fond de la ligne
        const tache = scene.add.rectangle(gauche + Phaser.Math.Between(10, LARGEUR_LIGNE - 10), y + Phaser.Math.Between(-12, 12), Phaser.Math.Between(3, 9), Phaser.Math.Between(2, 5), 0xd02828, 0.7); // une petite tache rouge, de taille et de place au hasard
        scene.groupeTableau.addAt(tache, 2); // on la glisse derrière le texte (juste au-dessus du fond)
    }
    for (let i = 0; i < GOUTTES_PAR_LIGNE; i++) faireCouler(scene, gauche + Phaser.Math.Between(20, LARGEUR_LIGNE - 20), y + 16, Phaser.Math.Between(7, 15)); // des gouttes qui coulent sous le bord de la ligne
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
        const decaler = (lettres) => lettres.forEach((lettre) => { if (lettre && lettre.x >= X_MIN_COLONNES_DROITE) lettre.x -= DECALAGE_COLONNES_DROITE; }); // décale vers la gauche les lettres des colonnes MORT et HIT
        this.groupeTableau.list.forEach((objet) => { if (objet.lettres) decaler(objet.lettres); }); // les chiffres MORT et HIT de chaque ligne (refaits à chaque affichage : on les décale à chaque fois)
        this.titresColonnes.forEach((titre) => { if (!titre.decaleHit) { titre.decaleHit = true; decaler(titre.lettres); } }); // les titres « MORT » et « HIT » (créés une seule fois : on ne le décale qu'une fois)
        this.lignesTableau().forEach((ligne, i) => { // pour chaque ligne affichée
            if (!ligne || !ligne.noHit) return; // les lignes jouées en mode normal gardent leurs couleurs
            const y = Y_PREMIERE_LIGNE + i * ECART_LIGNES; // la hauteur de cette ligne
            const fond = this.add.rectangle(X_CENTRE_LIGNE, y, LARGEUR_LIGNE, 32, ROUGE_FOND, 0.9); // un fond rouge sombre derrière la ligne
            const barre = this.add.rectangle(X_CENTRE_LIGNE - LARGEUR_LIGNE / 2 + 2, y, 4, 32, ROUGE_BARRE); // un trait rouge vif sur le bord gauche de la ligne
            this.groupeTableau.addAt(barre, 0); // le trait est rangé tout au fond du tableau...
            this.groupeTableau.addAt(fond, 0); // ...et le fond derrière lui, pour qu'ils ne cachent pas le texte
            this.groupeTableau.list.forEach((objet) => { // on cherche tout ce qui est écrit sur cette ligne
                if (objet === fond || objet === barre) return; // on ne touche pas au fond ni au trait qu'on vient de poser
                if (objet.lettres) objet.lettres.forEach((lettre) => { if (lettre && lettre.y === y) lettre.setTint(ROUGE_TEXTE); }); // les lettres de cette ligne deviennent rouges
                else if (objet.y === y && objet.type === "Rectangle" && objet.width === LARGEUR_FOND_JOUEUR) objet.setFillStyle(ROUGE_FOND, 0.9).setSize(LARGEUR_LIGNE, 32).setPosition(X_CENTRE_LIGNE, y); // le fond rose de la ligne du joueur devient rouge sombre, de la même taille que les autres : il ne dépasse plus du cadre
            });
            decorerLigneNoHit(this, y); // le crâne et le sang, ajoutés après la recoloration pour ne pas être recolorés
        });
    };
}

function envelopperCreationEtMiseAJour() {
    const creerRobot = niveau.prototype.creerRobot; // la création du robot d'origine (partie 1)
    niveau.prototype.creerRobot = function (carte) { // on la remplace : après la création du robot, on règle ses PV
        creerRobot.call(this, carte); // le robot, son interface et sa barre de vie sont créés normalement (avec tous les PV)
        const numero = this.registry.get("numeroPartie") ?? 0; // le numéro de la partie en cours (il augmente à chaque nouvelle partie)
        if (numero !== dernierNumeroPartie) { // une nouvelle partie commence
            dernierNumeroPartie = numero; partiePropre = noHit; // elle est « propre » seulement si le mode est déjà actif
            if (!noHit && this.scene.key === "niveau1") afficherAide(this); // mode normal : on rappelle comment activer le mode NO HIT (pendant 5 secondes)
        }
        this.etaitNoHit = noHit; // on retient si ce niveau démarre en mode NO HIT
        if (noHit) { choisirBarre(this, true); afficherPhrase(this, true); this.pv = 1; this.hud.majPV(1); } // en mode NO HIT : la barre n'a qu'une cellule et le robot 1 PV
    };
    const miseAJour = niveau.prototype.update; // la mise à jour d'origine, appelée à chaque image
    niveau.prototype.update = function () { // on la remplace : on garde les PV au bon niveau selon le mode
        miseAJour.call(this); // on fait d'abord tout ce que fait le niveau normalement
        if (noHit && !this.etaitNoHit) { // le mode vient d'être activé
            this.etaitNoHit = true; // on ne le fait qu'une fois
            nouvellePartie(this.game); // tout est remis à zéro : chrono, score, morts, phase du boss, reprise dans l'arène
            this.sound.stopAll(); // on coupe la musique en cours (celle du boss par exemple)
            this.scene.start("niveau1"); // on repart du début du niveau 1, comme après une mort : impossible d'activer le mode juste avant la fin du jeu
            return; // le niveau actuel s'arrête : rien d'autre à faire pour cette image
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

function ecrirePetitTexte(niveau, texte) { // un petit texte blanc en bas à droite de l'écran de jeu (même endroit pour la phrase NO HIT et pour l'aide)
    return niveau.add.text(1270, 712, texte, { fontFamily: "monospace", fontSize: "14px", color: "#ffffff", stroke: "#000000", strokeThickness: 3 }) // blanc, avec un contour noir
        .setOrigin(1, 1).setScrollFactor(0).setDepth(110); // son coin bas-droit est placé en bas à droite, il reste fixe à l'écran et au-dessus du reste
}

function afficherAide(niveau) { // affiche le message d'aide pendant 5 secondes, au même endroit que la phrase NO HIT
    const aide = ecrirePetitTexte(niveau, AIDE); // le message d'aide
    niveau.texteAideNoHit = aide; // on le retient pour pouvoir le retirer si le mode est activé avant la fin des 5 secondes
    niveau.time.delayedCall(DUREE_AIDE_MS, () => { if (aide.scene) aide.destroy(); }); // au bout de 5 secondes, il disparaît
}

function afficherPhrase(niveau, visible) { // affiche (ou retire) la petite phrase « NO HIT » en bas à droite de l'écran de jeu
    if (niveau.textePhraseNoHit && niveau.textePhraseNoHit.scene) niveau.textePhraseNoHit.destroy(); // on retire l'ancienne phrase, s'il y en a une
    niveau.textePhraseNoHit = null; // et on oublie sa référence
    if (!visible) return; // pas de phrase à afficher : on s'arrête là
    if (niveau.texteAideNoHit && niveau.texteAideNoHit.scene) niveau.texteAideNoHit.destroy(); // le mode est activé : le message d'aide n'a plus de raison d'être
    niveau.textePhraseNoHit = ecrirePetitTexte(niveau, PHRASE); // la phrase NO HIT, au même endroit que l'aide
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
