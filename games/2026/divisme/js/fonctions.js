// ==============================================================
// FONCTIONS.JS : LA BOÎTE À OUTILS COMMUNE À TOUTES LES SCÈNES
// ==============================================================
// Ce fichier contient tout ce qui sert dans PLUSIEURS scènes.
// (Il remplace les anciens fonctions.js ET outils.js : un seul endroit.)
//
// Une scène qui a besoin d'une fonction l'IMPORTE en haut de son fichier :
//
//     import { COULEURS, style } from "./fonctions.js";
//
// Sommaire :
//    1. La borne d'arcade (les touches)
//    2. Couleurs, textes, tailles
//    3. Petite aide : hauteurFixe
//    4. Rideau de transition
//    5. En-tête et temps
//    6. Vies (masques)
//    7. Cadre de résultat
//    8. Effets visuels
//    9. Sons
//   10. Consigne, compte à rebours, "appuie pour continuer"
//   11. Scores
//
// Pour changer l'allure du jeu, on modifie CE fichier : toutes les scènes suivent.


// ==============================================================
// 1. LA BORNE D'ARCADE
// ==============================================================
// Sur la borne, les boutons n'ont AUCUNE lettre dessus. Pour le joueur ils
// s'appellent A B C (rangée du haut) et D E F (rangée du bas).
// Pour nous (développeurs), chaque bouton envoie une touche du clavier.
// Si la borne change, on modifie UNIQUEMENT ce tableau.

export const BORNE = {
    j1: {
        gauche: "LEFT", droite: "RIGHT", haut: "UP", bas: "DOWN",
        boutons: ["I", "O", "P", "K", "L", "M"]     //  A  B  C  D  E  F
    },
    j2: {
        gauche: "Q", droite: "D", haut: "Z", bas: "S",
        boutons: ["R", "T", "Y", "F", "G", "H"]     //  A  B  C  D  E  F
    }
};

// Tous les boutons qui servent à "valider" (+ ESPACE pour tester sur PC)
const TOUCHES_VALIDER = BORNE.j1.boutons.concat(BORNE.j2.boutons, ["SPACE"]);

// Transforme une liste de noms ("I", "O"...) en objets "Key" que Phaser surveille.
// À appeler dans create().
export function creerTouches(scene, noms) {
    return noms.map(nom => scene.input.keyboard.addKey(nom));
}

// Vrai si AU MOINS UNE touche de la liste vient d'être enfoncée (à cette image précise).
// À appeler dans update().
export function uneTouchePressee(touches) {

    let pressee = false;

    // On utilise forEach (et pas "some") : JustDown "consomme" l'appui.
    // Si on s'arrêtait à la première touche trouvée, les autres garderaient
    // leur appui en mémoire et le déclencheraient à l'image suivante.
    touches.forEach(touche => {
        if (Phaser.Input.Keyboard.JustDown(touche)) {
            pressee = true;
        }
    });

    return pressee;
}


// ==============================================================
// 2. COULEURS, TEXTES, TAILLES
// ==============================================================

export const COULEURS = {
    // Palette de la direction artistique
    DORE: 0xC7AC72,
    ROUGE: 0xAE5050,
    TURQUOISE: 0x19798D,

    // Compléments : fond sombre, texte clair, variantes lisibles sur fond sombre
    NUIT: 0x10252B,
    CREME: 0xF6EBD0,
    TURQUOISE_CLAIR: 0x4FC3D9,
    ROUGE_CLAIR: 0xE07B7B,
    RIDEAU: 0x8B0000
};

// Couleurs des joueurs : les mêmes dans TOUS les mini-jeux
export const COULEUR_J1 = COULEURS.TURQUOISE;
export const COULEUR_J2 = COULEURS.ROUGE;

// Les formes de Phaser (rectangle, cercle...) veulent une couleur NOMBRE (0x19798D)
// mais les textes veulent une couleur TEXTE ("#19798d"). Cette fonction convertit.
// (toString(16) écrit le nombre en hexadécimal, padStart ajoute des 0 devant si besoin)
export function css(couleur) {
    return "#" + couleur.toString(16).padStart(6, "0");
}

export const POLICE = "Arial, sans-serif";

// Tailles de texte. Règle d'accessibilité : rien d'important sous 24 px.
export const TAILLE = {
    PETIT: 24,
    NORMAL: 30,
    GRAND: 40,
    TITRE: 46,
    ENORME: 56
};

// Renvoie le "style" d'un texte Phaser.
//   taille  : en pixels (utiliser TAILLE.xxx)
//   couleur : texte CSS, par exemple css(COULEURS.DORE)
//   contour : (facultatif) couleur CSS du contour, par exemple pour reconnaître un joueur
// Le contour sombre rend le texte lisible sur tous les fonds.
export function style(taille = TAILLE.NORMAL, couleur = css(COULEURS.CREME), contour = null) {

    return {
        fontFamily: POLICE,
        fontSize: taille + "px",
        color: couleur,
        fontStyle: "bold",
        align: "center",
        stroke: contour || css(COULEURS.NUIT),
        strokeThickness: contour ? 7 : 4
    };
}

// Positions identiques dans tous les mini-jeux
export const POS = {
    LARGEUR: 1280,
    HAUTEUR: 720,
    TITRE_Y: 50,
    TEMPS_Y: 105,
    CONSIGNE_Y: 150
};


// ==============================================================
// 3. PETITE AIDE
// ==============================================================

// Redimensionne une image pour qu'elle ait la hauteur voulue,
// sans la déformer (on garde les proportions).
export function hauteurFixe(image, hauteur) {
    image.setScale(hauteur / image.height);
}


// ==============================================================
// 4. RIDEAU DE TRANSITION
// ==============================================================
// Deux rectangles rouges (les deux pans du rideau), posés au-dessus de tout
// (depth 1000), qu'on déplace avec des tweens.

// Le rideau démarre FERMÉ et S'OUVRE. À appeler au début du create() d'une scène.
export function ouvrirRideau(scene, duree = 800) {

    const moitie = POS.LARGEUR / 2;

    const gauche = scene.add.rectangle(0, 0, moitie, POS.HAUTEUR, COULEURS.RIDEAU)
        .setOrigin(0, 0).setDepth(1000);

    const droite = scene.add.rectangle(moitie, 0, moitie, POS.HAUTEUR, COULEURS.RIDEAU)
        .setOrigin(0, 0).setDepth(1000);

    jouerSon(scene, "son_rideau", { volume: 0.7 });

    // Le pan gauche sort par la gauche, le pan droit par la droite
    scene.tweens.add({
        targets: gauche,
        x: -moitie,
        duration: duree,
        ease: "Cubic.easeInOut",
        onComplete: () => gauche.destroy()
    });

    scene.tweens.add({
        targets: droite,
        x: POS.LARGEUR,
        duration: duree,
        ease: "Cubic.easeInOut",
        onComplete: () => droite.destroy()
    });
}

// Le rideau se FERME, puis on exécute "quandFerme" (par exemple : changer de scène).
export function fermerRideau(scene, duree, quandFerme) {

    const moitie = POS.LARGEUR / 2;

    // Les deux pans démarrent HORS de l'écran
    const gauche = scene.add.rectangle(-moitie, 0, moitie, POS.HAUTEUR, COULEURS.RIDEAU)
        .setOrigin(0, 0).setDepth(1000);

    const droite = scene.add.rectangle(POS.LARGEUR, 0, moitie, POS.HAUTEUR, COULEURS.RIDEAU)
        .setOrigin(0, 0).setDepth(1000);

    jouerSon(scene, "son_rideau", { volume: 0.7 });

    scene.tweens.add({
        targets: gauche,
        x: 0,
        duration: duree,
        ease: "Cubic.easeInOut"
    });

    scene.tweens.add({
        targets: droite,
        x: moitie,
        duration: duree,
        ease: "Cubic.easeInOut",
        onComplete: () => {
            if (quandFerme) quandFerme();
        }
    });
}


// ==============================================================
// 5. EN-TÊTE ET TEMPS
// ==============================================================

// Titre (en haut) + consigne courte (dessous), toujours aux mêmes endroits.
export function creerEnTete(scene, nomMiniJeu, consigne) {

    scene.add.text(POS.LARGEUR / 2, POS.TITRE_Y, nomMiniJeu.toUpperCase(),
        style(TAILLE.TITRE, css(COULEURS.DORE))).setOrigin(0.5);

    scene.add.text(POS.LARGEUR / 2, POS.CONSIGNE_Y, consigne,
        style(TAILLE.NORMAL)).setOrigin(0.5);
}

// Le texte "Temps : 20", à sa place standard
export function creerTexteTemps(scene, secondes) {

    return scene.add.text(POS.LARGEUR / 2, POS.TEMPS_Y, "Temps : " + secondes,
        style(TAILLE.GRAND)).setOrigin(0.5);
}

// Met à jour le temps. Pendant les 5 dernières secondes : le texte devient rouge et "pulse".
export function majTemps(scene, texte, secondes) {

    texte.setText("Temps : " + secondes);

    if (secondes <= 5) {
        texte.setColor(css(COULEURS.ROUGE_CLAIR));
        scene.tweens.add({ targets: texte, scale: { from: 1.4, to: 1 }, duration: 300 });
    }
}


// ==============================================================
// 6. VIES (MASQUES)
// ==============================================================

// Nombre de masques (= vies de chaque joueur dans un mini-jeu)
export const VIES_MAX = 3;

// Crée la rangée de masques centrée en x, et renvoie la liste des images.
// "vies" = nombre de masques encore contents.
export function creerVies(scene, x, y, vies) {

    const masques = [];

    for (let i = 0; i < VIES_MAX; i++) {
        masques.push(scene.add.image(x + (i - 1) * 70, y, "masque_content"));
    }

    majVies(masques, vies);

    return masques;
}

// Vie restante : masque content. Vie perdue : masque triste et rougeâtre.
function majVies(masques, vies) {

    masques.forEach((masque, i) => {

        if (i < vies) {
            masque.setTexture("masque_content");
            masque.clearTint();
        } else {
            masque.setTexture("masque_triste");
            masque.setTint(0xff6666);
        }

        // Changer de texture change la taille : on remet la hauteur voulue
        hauteurFixe(masque, 60);
    });
}

// Retire une vie (jamais sous 0), met à jour les masques et renvoie le nouveau nombre de vies.
export function retirerVie(scene, masques, vies) {

    const nouvellesVies = Math.max(0, vies - 1);

    majVies(masques, nouvellesVies);

    // Si une vie a vraiment été perdue, le masque concerné tremble
    if (nouvellesVies < vies) {

        const masque = masques[nouvellesVies];

        scene.tweens.add({
            targets: masque,
            angle: { from: -15, to: 15 },
            duration: 60,
            yoyo: true,
            repeat: 4,
            onComplete: () => masque.setAngle(0)
        });
    }

    return nouvellesVies;
}


// ==============================================================
// 7. CADRE DE RÉSULTAT
// ==============================================================

// Affiche un résultat lisible : panneau sombre + titre + sous-titre.
// couleurSousTitre : facultatif (texte CSS). fete = true : gerbe d'étincelles (victoire).
export function afficherResultat(scene, titre, sousTitre, couleurSousTitre, fete = false) {

    const panneau = scene.add.rectangle(640, 385, 880, 140, COULEURS.NUIT, 0.9)
        .setStrokeStyle(4, COULEURS.DORE)
        .setDepth(60);

    const elements = [panneau];

    elements.push(
        scene.add.text(640, 355, titre, style(TAILLE.TITRE, css(COULEURS.DORE)))
            .setOrigin(0.5).setDepth(61)
    );

    if (sousTitre) {

        const couleur = couleurSousTitre || css(COULEURS.CREME);

        elements.push(
            scene.add.text(640, 420, sousTitre, style(TAILLE.NORMAL, couleur))
                .setOrigin(0.5).setDepth(61)
        );
    }

    // Apparition : fondu + léger zoom
    scene.tweens.add({
        targets: elements,
        alpha: { from: 0, to: 1 },
        scale: { from: 0.85, to: 1 },
        duration: 250,
        ease: "Back.easeOut"
    });

    if (fete) {
        explosion(scene, 640, 330, 40, 260, 9);
    }
}


// ==============================================================
// 8. EFFETS VISUELS
// ==============================================================

// Gerbe de particules colorées (des cercles + des tweens) qui part dans toutes les directions.
export function explosion(scene, x, y, nombre = 18, portee = 220, taille = 9) {

    const couleurs = [COULEURS.DORE, COULEURS.TURQUOISE_CLAIR, COULEURS.ROUGE_CLAIR, COULEURS.CREME];

    for (let i = 0; i < nombre; i++) {

        const particule = scene.add.circle(
            x,
            y,
            Phaser.Math.Between(Math.max(2, taille - 4), taille),
            Phaser.Utils.Array.GetRandom(couleurs)
        ).setDepth(70);

        // Chaque particule part dans une direction au hasard
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = Phaser.Math.Between(portee * 0.4, portee);

        scene.tweens.add({
            targets: particule,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            alpha: 0,
            scale: 0.2,
            duration: Phaser.Math.Between(500, 900),
            ease: "Cubic.easeOut",
            onComplete: () => particule.destroy()   // on nettoie toujours
        });
    }
}

// "+1" ou "-1" qui monte et disparaît (texte clair cerclé de la couleur donnée).
export function texteFlottant(scene, x, y, texte, couleurContour) {

    const objet = scene.add.text(x, y, texte, style(TAILLE.GRAND, css(COULEURS.CREME), css(couleurContour)))
        .setOrigin(0.5).setDepth(50);

    scene.tweens.add({
        targets: objet,
        y: y - 100,
        alpha: 0,
        duration: 700,
        ease: "Cubic.easeOut",
        onComplete: () => objet.destroy()
    });
}

// Notes de musique qui flottent doucement DERRIÈRE le jeu, en permanence.
// (profondeur -5 : l'image de fond de la scène doit être en profondeur -10)
export function lancerAmbiance(scene) {

    const couleurs = [COULEURS.DORE, COULEURS.TURQUOISE_CLAIR, COULEURS.ROUGE_CLAIR];

    return scene.time.addEvent({

        delay: 600,
        loop: true,

        callback: () => {

            const x = Phaser.Math.Between(40, POS.LARGEUR - 40);

            const note = scene.add.text(
                x,
                POS.HAUTEUR + 30,
                Phaser.Utils.Array.GetRandom(["♪", "♫", "♩", "♬"]),
                {
                    fontFamily: POLICE,
                    fontSize: Phaser.Math.Between(28, 60) + "px",
                    color: css(Phaser.Utils.Array.GetRandom(couleurs))
                }
            ).setOrigin(0.5).setAlpha(0.3).setDepth(-5);

            scene.tweens.add({
                targets: note,
                x: x + Phaser.Math.Between(-80, 80),
                y: -40,
                angle: Phaser.Math.Between(-40, 40),
                duration: Phaser.Math.Between(5000, 8000),
                onComplete: () => note.destroy()
            });
        }
    });
}


// ==============================================================
// 9. SONS
// ==============================================================

// Joue un son seulement s'il a bien été chargé (sinon : silence, mais pas de plantage).
export function jouerSon(scene, cle, config = {}) {

    if (scene.cache.audio.exists(cle)) {
        scene.sound.play(cle, config);
    }
}

// Gamme pentatonique majeure : ces notes sonnent toujours bien ensemble (do ré mi sol la)
const GAMME = [0, 2, 4, 7, 9];

// Joue une note de harpe. Un seul fichier son existe (harpe.wav, un do) :
// on change sa hauteur avec "detune", exprimé en centièmes de demi-ton.
//   degre   : 0 = do, 1 = ré, 2 = mi, 3 = sol, 4 = la, 5 = do (octave au-dessus)...
//   options : volume, pan (-1 = gauche, +1 = droite), decalage (centièmes de demi-ton)
export function jouerHarpe(scene, degre, options = {}) {

    const octave = Math.floor(degre / GAMME.length);
    const demiTons = GAMME[degre % GAMME.length] + 12 * octave;

    jouerSon(scene, "harpe", {
        detune: demiTons * 100 + (options.decalage || 0),
        volume: options.volume || 0.5,
        pan: options.pan || 0
    });
}


// ==============================================================
// 10. CONSIGNE, COMPTE À REBOURS, "APPUIE POUR CONTINUER"
// ==============================================================
// Objectif d'accessibilité : le joueur arrive à la borne sans rien connaître.
// Avant chaque mini-jeu on lui explique les règles, et c'est LUI qui décide
// quand commencer. Ensuite un compte à rebours 3-2-1 le laisse se préparer.
// À la fin, le résultat reste affiché jusqu'à ce qu'il appuie.

// Temps pendant lequel on laisse le résultat affiché avant d'accepter un appui (en ms).
// (sinon un joueur qui martèle ses boutons sauterait le résultat sans le lire)
const DELAI_RESULTAT = 2000;

// Appelle "action" au PREMIER appui sur un bouton de la borne OU au premier clic.
// "delai" : on attend un peu avant d'écouter, pour ignorer l'appui qui nous a amenés ici.
export function attendreAppui(scene, action, delai = 500) {

    let fait = false;

    const declencher = () => {

        // Garde-fou : touche ET clic en même temps ne déclenchent qu'une seule fois
        if (fait) return;
        fait = true;

        // On arrête d'écouter
        TOUCHES_VALIDER.forEach(nom => scene.input.keyboard.off("keydown-" + nom, declencher));
        scene.input.off("pointerdown", declencher);

        action();
    };

    scene.time.delayedCall(delai, () => {

        // "keydown-I" est l'évènement envoyé par Phaser quand la touche I est enfoncée
        TOUCHES_VALIDER.forEach(nom => scene.input.keyboard.on("keydown-" + nom, declencher));
        scene.input.on("pointerdown", declencher);
    });
}

// Écran d'explication affiché AVANT un mini-jeu.
//   titre      : nom du mini-jeu
//   lignes     : liste de phrases courtes (3 ou 4 maximum)
//   quandPret  : fonction exécutée quand le joueur appuie pour commencer
export function afficherConsigne(scene, titre, lignes, quandPret) {

    // Fond sombre plein écran. setInteractive() lui fait "avaler" les clics :
    // on ne peut pas cliquer sur le jeu qui est derrière.
    const fond = scene.add.rectangle(640, 360, POS.LARGEUR, POS.HAUTEUR, COULEURS.NUIT, 0.94)
        .setDepth(200)
        .setInteractive();

    const texteTitre = scene.add.text(640, 110, titre.toUpperCase(), style(TAILLE.TITRE, css(COULEURS.DORE)))
        .setOrigin(0.5).setDepth(201);

    // Les phrases, séparées par une ligne vide. "wordWrap" = retour à la ligne automatique.
    const reglage = style(TAILLE.NORMAL);
    reglage.wordWrap = { width: 1000 };

    const texteLignes = scene.add.text(640, 340, lignes.join("\n\n"), reglage)
        .setOrigin(0.5).setDepth(201);

    const indication = scene.add.text(640, 620, "Appuie sur un bouton pour commencer",
        style(TAILLE.NORMAL, css(COULEURS.DORE))).setOrigin(0.5).setDepth(201);

    scene.tweens.add({ targets: indication, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });

    attendreAppui(scene, () => {

        fond.destroy();
        texteTitre.destroy();
        texteLignes.destroy();
        indication.destroy();

        quandPret();

    }, 700);
}

// Compte à rebours "3, 2, 1, GO !" au milieu de l'écran.
// "quandFini" est exécuté au moment où GO ! apparaît : c'est le départ de la manche.
export function compteARebours(scene, quandFini) {

    const etapes = ["3", "2", "1", "GO !"];
    let i = 0;

    const texte = scene.add.text(640, 360, etapes[0], style(160, css(COULEURS.DORE)))
        .setOrigin(0.5).setDepth(150);

    scene.tweens.add({ targets: texte, scale: { from: 1.5, to: 1 }, duration: 400 });

    // Un évènement toutes les 800 ms. "repeat" = nombre de répétitions APRÈS la première
    // fois : il y a 3 passages ("2", "1", "GO !"), donc repeat = 2.
    scene.time.addEvent({

        delay: 800,
        repeat: etapes.length - 2,

        callback: () => {

            i++;
            texte.setText(etapes[i]);
            scene.tweens.add({ targets: texte, scale: { from: 1.5, to: 1 }, duration: 400 });

            // Dernière étape : la manche démarre, et "GO !" disparaît un peu après
            if (i === etapes.length - 1) {
                quandFini();
                scene.time.delayedCall(600, () => texte.destroy());
            }
        }
    });
}

// Fin de manche : après un court délai, affiche "Appuie sur un bouton pour continuer"
// puis exécute "action" au premier appui.
export function attendreContinuer(scene, action) {

    scene.time.delayedCall(DELAI_RESULTAT, () => {

        // Fond sombre derrière le texte : lisible même sur un décor chargé
        const reglage = style(TAILLE.NORMAL, css(COULEURS.CREME));
        reglage.backgroundColor = css(COULEURS.NUIT);
        reglage.padding = { x: 16, y: 8 };

        const indication = scene.add.text(640, 480, "Appuie sur un bouton pour continuer", reglage)
            .setOrigin(0.5).setDepth(61);

        scene.tweens.add({ targets: indication, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
    });

    attendreAppui(scene, action, DELAI_RESULTAT);
}


// ==============================================================
// 11. SCORES
// ==============================================================
// Chaque mini-jeu enregistre ses points dans le "registry" (la mémoire commune
// à toutes les scènes). La scène "classement" les lit à la fin.

// Les trois mini-jeux (leur nom sert de titre ET de ligne du classement)
export const MINIJEUX = {
    clicker: { nom: "Le Grand Concert" },
    rythme:  { nom: "L'Air d'Opéra" },
    taupe:   { nom: "Le Bal des Masques" }
};

// Combien de points rapporte chaque réussite
export const POINTS = {
    PAR_MELODIE: 10,    // rythme : une mélodie réussie
    PAR_MASQUE: 5       // taupe : un point de score
};

// À appeler au début d'une nouvelle partie
export function reinitialiserScores(scene) {
    scene.registry.set("scores", {});
}

// À appeler à la fin d'un mini-jeu : cle = "clicker", "rythme" ou "taupe"
export function enregistrerScore(scene, cle, pointsJ1, pointsJ2 = 0) {

    const scores = scene.registry.get("scores") || {};

    scores[cle] = [pointsJ1, pointsJ2];

    scene.registry.set("scores", scores);
}

export function lireScores(scene) {
    return scene.registry.get("scores") || {};
}