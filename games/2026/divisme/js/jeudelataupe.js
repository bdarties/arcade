import * as fct from "./fonctions.js";
import {
    BORNE,
    COULEUR_J1,
    COULEUR_J2,
    VIES_MAX,
    css,
    creerVies,
    retirerVie,
    afficherResultat
} from "./outils.js";

// ==============================
// RÉGLAGES (à modifier pour équilibrer le jeu)
// ==============================

// Pour tester ce mini-jeu SEUL, sans passer par histoire.js : écrire 1 ou 2.
// En jeu normal : laisser null (le mode vient alors du registry, choisi dans histoire.js).
const FORCER_MODE = null;

// Scène lancée après ce mini-jeu (c'est le dernier : on va au classement).
// Si elle n'existe pas, on retourne au menu.
const SCENE_SUIVANTE = "classement";

// Durée de la manche, en secondes
const DUREE_MANCHE = 20;

// SOLO : nombre de points à atteindre pour ne pas perdre de vie
const OBJECTIF_SOLO = 15;

// Rythme des apparitions : il ACCÉLÈRE au fil de la manche (début -> fin)
const DELAI_DEBUT = 800;      // ms entre deux masques au début
const DELAI_FIN = 450;        // ms entre deux masques à la fin
const VISIBLE_DEBUT = 1300;   // ms pendant lesquelles un masque reste sorti, au début
const VISIBLE_FIN = 800;      // ... à la fin

// Probabilité qu'un masque soit triste (= à éviter !)
const PROBA_TRISTE = 0.25;

// Nombre de trappes par joueur
const TROUS_PAR_JOUEUR = 3;

// Touches : [trappe de gauche, du milieu, de droite]
// (en mode 1 joueur, les deux jeux de touches marchent, comme dans le jeu de rythme)
const TOUCHES = {
    j1_joystick: [BORNE.j1.gauche, BORNE.j1.bas, BORNE.j1.droite],
    j1_boutons:  [BORNE.j1.boutons[0], BORNE.j1.boutons[1], BORNE.j1.boutons[2]],   // I O P
    j2_joystick: [BORNE.j2.gauche, BORNE.j2.bas, BORNE.j2.droite],
    j2_boutons:  [BORNE.j2.boutons[0], BORNE.j2.boutons[1], BORNE.j2.boutons[2]]    // R T Y
};


// ==============================
// VARIABLES
// ==============================

// Vies : variables du fichier, comme dans clicker.js
var viesJ1 = VIES_MAX;
var viesJ2 = VIES_MAX;


// ==============================
// SCÈNE JEU DE LA TAUPE (version "bal des masques")
// ==============================

export default class jeudelataupe extends Phaser.Scene {

    constructor() {
        super({ key: "jeudelataupe" });
    }


    // ==============================
    // PRELOAD
    // ==============================

    preload() {

        const baseURL = this.sys.game.config.baseURL;
        this.load.setBaseURL(baseURL);

        // Fond (s'il n'existe pas encore, un fond uni le remplace)
        this.load.image("taupe_bg", "src/bg/taupe_bg.png");

        // Masques : les mêmes que dans clicker.js et jeuderythme.js.
        // Si la clé existe déjà dans le jeu, Phaser ne recharge pas le fichier.
        this.load.image("masque_content", "src/sprite/masque_content.png");
        this.load.image("masque_triste", "src/sprite/masque_triste.png");
    }


    // ==============================
    // CREATE
    // ==============================

    create() {

        // Lecture du mode choisi dans histoire.js (1 par défaut si rien n'a été choisi)
        const mode = FORCER_MODE || this.registry.get("joueurs") || 1;
        this.nbJoueurs = mode === 2 ? 2 : 1;

        // "attente" (rideau) -> "jeu" -> "fin" (résultat affiché) -> "sortie"
        this.etat = "attente";
        this.tempsRestant = DUREE_MANCHE;
        this.timer = null;

        // Transition : le rideau s'ouvre
        fct.ouvrirRideau(this, 800);


        // ==============================
        // FOND
        // ==============================

        if (this.textures.exists("taupe_bg")) {
            this.add.image(640, 360, "taupe_bg");
        } else {
            this.cameras.main.setBackgroundColor(0x10252B);
        }


        // ==============================
        // STYLE DE TEXTE RÉUTILISABLE
        // ==============================

        this.style = (taille, options = {}) => ({
            fontSize: taille,
            color: "#ffffff",
            fontStyle: "bold",
            align: "center",
            ...options
        });


        // ==============================
        // TEXTES COMMUNS
        // ==============================

        this.add.text(640, 50, "LE BAL DES MASQUES !", this.style("40px")).setOrigin(0.5);

        this.texteTemps = this.add.text(640, 105, "Temps : " + this.tempsRestant, this.style("32px")).setOrigin(0.5);

        this.add.text(
            640,
            150,
            "Frappe les masques joyeux (+1), évite les tristes (-1) !",
            this.style(this.nbJoueurs === 1 ? "28px" : "22px")
        ).setOrigin(0.5);


        // ==============================
        // MODE 1 JOUEUR / 2 JOUEURS
        // ==============================

        if (this.nbJoueurs === 1) {
            this.creerSolo();
        } else {
            this.creerDuo();
        }


        // ==============================
        // LA MANCHE DÉMARRE QUAND LE RIDEAU EST OUVERT
        // ==============================

        this.time.delayedCall(800, () => this.demarrerManche());
    }


    // ==============================
    // SOLO : une seule rangée de trappes, au centre
    // ==============================

    creerSolo() {

        const plateau = this.creerPlateau(
            0,                                   // numéro du joueur
            640,                                 // centre de la rangée
            300,                                 // écart entre deux trappes
            220,                                 // largeur d'une trappe
            230,                                 // hauteur d'un masque sorti
            COULEUR_J1,
            [TOUCHES.j1_joystick, TOUCHES.j1_boutons, TOUCHES.j2_joystick, TOUCHES.j2_boutons],
            ["← / I", "↓ / O", "→ / P"]
        );

        this.plateaux = [plateau];

        // Score
        plateau.texteScore = this.add.text(640, 205, this.libelleScore(plateau), this.style("36px")).setOrigin(0.5);

        // Vies (masques)
        this.masquesJ1 = creerVies(this, 640, 270, viesJ1);
    }


    // ==============================
    // DUO : une rangée de trappes par joueur
    // ==============================

    creerDuo() {

        const plateau1 = this.creerPlateau(0, 320, 180, 150, 160, COULEUR_J1,
            [TOUCHES.j1_joystick, TOUCHES.j1_boutons], ["← / I", "↓ / O", "→ / P"]);
        const plateau2 = this.creerPlateau(1, 960, 180, 150, 160, COULEUR_J2,
            [TOUCHES.j2_joystick, TOUCHES.j2_boutons], ["Q / R", "S / T", "D / Y"]);

        this.plateaux = [plateau1, plateau2];

        // Étiquettes et scores : texte blanc cerclé de la couleur du joueur
        [
            { x: 320, nom: "JOUEUR 1", plateau: plateau1, couleur: COULEUR_J1 },
            { x: 960, nom: "JOUEUR 2", plateau: plateau2, couleur: COULEUR_J2 }
        ].forEach(infos => {

            const contour = { stroke: css(infos.couleur), strokeThickness: 6 };

            this.add.text(infos.x, 195, infos.nom, this.style("30px", contour)).setOrigin(0.5);

            infos.plateau.texteScore = this.add.text(
                infos.x, 250, this.libelleScore(infos.plateau), this.style("44px", contour)
            ).setOrigin(0.5);
        });

        // Vies (masques)
        this.masquesJ1 = creerVies(this, 320, 310, viesJ1);
        this.masquesJ2 = creerVies(this, 960, 310, viesJ2);
    }


    // ==============================
    // CRÉATION D'UNE RANGÉE DE TRAPPES POUR UN JOUEUR
    // ==============================

    creerPlateau(id, xCentre, ecart, largeurTrou, tailleMasque, couleur, jeuxTouches, etiquettes) {

        const y = 560; // hauteur des trappes

        const plateau = {
            id: id,
            couleur: couleur,
            tailleMasque: tailleMasque,
            score: 0,
            trous: [],
            touches: [],
            texteScore: null
        };

        for (let i = 0; i < TROUS_PAR_JOUEUR; i++) {

            const x = xCentre + (i - 1) * ecart;

            // La trappe : une ellipse sombre, au bord de la couleur du joueur
            const ellipse = this.add.ellipse(x, y, largeurTrou, 52, 0x000000, 0.75)
                .setStrokeStyle(6, couleur);

            // La touche qui correspond à cette trappe
            this.add.text(x, y + 50, etiquettes[i], this.style("24px")).setOrigin(0.5);

            plateau.trous.push({
                x: x,
                y: y,
                ellipse: ellipse,
                masque: null,        // le masque actuellement sorti (null = trappe libre)
                triste: false,
                minuteur: null       // programme la rentrée automatique du masque
            });

            // Les touches de cette trappe (une ou deux, selon le mode)
            plateau.touches.push(jeuxTouches.map(jeu => this.input.keyboard.addKey(jeu[i])));
        }

        return plateau;
    }


    // Texte du score : "Score : 3 / 15" en solo, "3" en duo.
    libelleScore(plateau) {

        if (this.nbJoueurs === 1) {
            return "Score : " + plateau.score + " / " + OBJECTIF_SOLO;
        }

        return String(plateau.score);
    }


    // ==============================
    // DÉROULEMENT DE LA MANCHE
    // ==============================

    demarrerManche() {

        this.etat = "jeu";

        // Un "tic" toutes les secondes : compte à rebours
        this.timer = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => this.tic()
        });

        this.programmerApparition();
    }


    tic() {

        if (this.etat !== "jeu") return;

        this.tempsRestant--;

        this.texteTemps.setText("Temps : " + this.tempsRestant);

        // Les 5 dernières secondes : le temps devient rouge et "pulse"
        if (this.tempsRestant <= 5) {
            this.texteTemps.setColor("#ff6b6b");
            this.tweens.add({
                targets: this.texteTemps,
                scale: { from: 1.4, to: 1 },
                duration: 300
            });
        }

        if (this.tempsRestant <= 0) {
            this.finDeManche();
        }
    }


    // Avancement de la manche : 0 au début, 1 à la fin.
    progression() {

        return 1 - this.tempsRestant / DUREE_MANCHE;
    }


    // Programme la prochaine apparition. Le délai raccourcit avec la progression :
    // le jeu s'accélère tout seul.
    programmerApparition() {

        if (this.etat !== "jeu") return;

        const delai = Phaser.Math.Linear(DELAI_DEBUT, DELAI_FIN, this.progression());

        this.time.delayedCall(delai, () => {
            this.faireApparaitre();
            this.programmerApparition(); // et on recommence
        });
    }


    // Choisit une trappe libre et y fait sortir un masque (le même sur tous les plateaux,
    // pour que les deux joueurs aient exactement la même partie).
    faireApparaitre() {

        if (this.etat !== "jeu") return;

        // Trappes libres sur TOUS les plateaux
        const libres = [];

        for (let i = 0; i < TROUS_PAR_JOUEUR; i++) {
            if (this.plateaux.every(plateau => !plateau.trous[i].masque)) {
                libres.push(i);
            }
        }

        if (libres.length === 0) return;

        const index = Phaser.Utils.Array.GetRandom(libres);
        const triste = Phaser.Math.FloatBetween(0, 1) < PROBA_TRISTE;
        const duree = Phaser.Math.Linear(VISIBLE_DEBUT, VISIBLE_FIN, this.progression());

        this.plateaux.forEach(plateau => this.sortirMasque(plateau, index, triste, duree));
    }


    // ==============================
    // UN MASQUE SORT, PUIS RENTRE
    // ==============================

    sortirMasque(plateau, index, triste, duree) {

        const trou = plateau.trous[index];

        // L'origine est en bas au centre : le masque "pousse" vers le haut depuis la trappe
        const masque = this.add.image(trou.x, trou.y, triste ? "masque_triste" : "masque_content")
            .setOrigin(0.5, 1);

        const echelle = plateau.tailleMasque / masque.height;

        if (triste) masque.setTint(0xff6666); // même teinte rouge que les vies perdues

        masque.setScale(0);
        masque.setInteractive({ useHandCursor: true });

        // Clic (ou toucher) sur le masque
        masque.on("pointerdown", () => this.toucher(plateau, index));

        trou.masque = masque;
        trou.triste = triste;

        // Apparition avec un petit rebond
        this.tweens.add({
            targets: masque,
            scale: echelle,
            duration: 180,
            ease: "Back.easeOut"
        });

        // S'il n'est pas touché, il rentre tout seul
        trou.minuteur = this.time.delayedCall(duree, () => this.rentrerMasque(trou));
    }


    // Fait rentrer le masque d'une trappe (touché ou non) et libère la trappe.
    rentrerMasque(trou) {

        if (!trou.masque) return;

        const masque = trou.masque;

        // La trappe est libre tout de suite
        trou.masque = null;

        if (trou.minuteur) {
            trou.minuteur.remove();
            trou.minuteur = null;
        }

        masque.disableInteractive();
        this.tweens.killTweensOf(masque);

        this.tweens.add({
            targets: masque,
            scale: 0,
            duration: 150,
            ease: "Back.easeIn",
            onComplete: () => masque.destroy() // on nettoie toujours
        });
    }


    // ==============================
    // UN JOUEUR FRAPPE UNE TRAPPE (clic sur le masque OU touche du clavier)
    // ==============================

    toucher(plateau, index) {

        if (this.etat !== "jeu") return;

        const trou = plateau.trous[index];

        // Rien dans la trappe : on ne gagne rien, la trappe tressaille
        if (!trou.masque) {
            this.tressaillir(trou);
            return;
        }

        const x = trou.x;
        const y = trou.y - plateau.tailleMasque / 2;

        if (trou.triste) {

            // Masque triste : pénalité
            plateau.score = Math.max(0, plateau.score - 1);

            this.texteFlottant(x, y, "-1", 0xff6b6b);
            this.cameras.main.shake(150, 0.006);

        } else {

            // Masque joyeux : point
            plateau.score++;

            this.texteFlottant(x, y, "+1", plateau.couleur);
            this.etincelles(x, y, plateau.couleur);
        }

        this.rentrerMasque(trou);
        this.majScore(plateau);
    }


    // Met à jour le texte du score, avec un petit "pop".
    majScore(plateau) {

        plateau.texteScore.setText(this.libelleScore(plateau));

        this.tweens.killTweensOf(plateau.texteScore);
        plateau.texteScore.setScale(1);

        this.tweens.add({
            targets: plateau.texteScore,
            scale: { from: 1.3, to: 1 },
            duration: 200
        });
    }


    // La trappe se pince un instant (touche appuyée alors qu'il n'y a rien).
    tressaillir(trou) {

        this.tweens.killTweensOf(trou.ellipse);
        trou.ellipse.setScale(1);

        this.tweens.add({
            targets: trou.ellipse,
            scaleX: 0.85,
            duration: 60,
            yoyo: true
        });
    }


    // ==============================
    // EFFETS VISUELS
    // ==============================

    // "+1" ou "-1" qui monte et disparaît (texte blanc cerclé de la couleur donnée).
    texteFlottant(x, y, texte, couleurContour) {

        const objet = this.add.text(x, y, texte, this.style("48px", {
            stroke: css(couleurContour),
            strokeThickness: 8
        })).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: objet,
            y: y - 100,
            alpha: 0,
            duration: 700,
            ease: "Cubic.easeOut",
            onComplete: () => objet.destroy()
        });
    }


    // Petite gerbe de particules qui part dans toutes les directions.
    etincelles(x, y, couleur) {

        const couleurs = [couleur, 0xC7AC72, 0xffffff];

        for (let i = 0; i < 8; i++) {

            const particule = this.add.circle(
                x,
                y,
                Phaser.Math.Between(4, 8),
                Phaser.Utils.Array.GetRandom(couleurs)
            ).setDepth(50);

            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const distance = Phaser.Math.Between(60, 130);

            this.tweens.add({
                targets: particule,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0.3,
                duration: 450,
                ease: "Cubic.easeOut",
                onComplete: () => particule.destroy()
            });
        }
    }


    // ==============================
    // FIN DE MANCHE
    // ==============================

    finDeManche() {

        if (this.etat !== "jeu") return;

        this.etat = "fin";

        if (this.timer) {
            this.timer.remove();
        }

        // Tous les masques encore sortis rentrent
        this.plateaux.forEach(plateau => {
            plateau.trous.forEach(trou => this.rentrerMasque(trou));
        });


        // ==============================
        // SOLO : objectif atteint ou une vie perdue
        // ==============================

        if (this.nbJoueurs === 1) {

            const score = this.plateaux[0].score;

            if (score >= OBJECTIF_SOLO) {

                afficherResultat(this, "🎉 BRAVO ! 🎉", score + " points : objectif atteint !");

            } else {

                viesJ1 = retirerVie(this, this.masquesJ1, viesJ1);

                afficherResultat(this, "Temps écoulé !", "🎭 Vie perdue ! (" + score + " / " + OBJECTIF_SOLO + ")", "#ff6b6b");
            }
        }


        // ==============================
        // DUO : le meilleur score gagne, l'autre perd une vie
        // ==============================

        else {

            const score1 = this.plateaux[0].score;
            const score2 = this.plateaux[1].score;

            if (score1 > score2) {

                viesJ2 = retirerVie(this, this.masquesJ2, viesJ2);

                afficherResultat(this, "🏆 JOUEUR 1 GAGNE !", "🎭 Le Joueur 2 perd une vie !", "#ff6b6b");

            } else if (score2 > score1) {

                viesJ1 = retirerVie(this, this.masquesJ1, viesJ1);

                afficherResultat(this, "🏆 JOUEUR 2 GAGNE !", "🎭 Le Joueur 1 perd une vie !", "#ff6b6b");

            } else {

                afficherResultat(this, "🤝 ÉGALITÉ !", score1 + " points   —   " + score2 + " points");
            }
        }

        this.proposerSuite();
    }


    // Après un court délai (pour que le joueur voie le résultat, même s'il martèle
    // les touches), une touche ou un clic permet de continuer.
    proposerSuite() {

        this.time.delayedCall(1200, () => {

            if (this.etat !== "fin") return;

            const indication = this.add.text(
                640,
                480,
                "Appuie sur une touche ou clique pour continuer",
                this.style("20px", { color: "#cccccc" })
            ).setOrigin(0.5).setDepth(61);

            this.tweens.add({
                targets: indication,
                alpha: 0.3,
                duration: 600,
                yoyo: true,
                repeat: -1
            });

            const suite = () => this.passerAuSuivant();

            this.input.keyboard.once("keydown", suite);
            this.input.once("pointerdown", suite);
        });
    }


    // Fermeture du rideau, puis passage à la scène suivante.
    passerAuSuivant() {

        // Garde-fou : touche ET clic sur la même frame ne lancent qu'une seule transition
        if (this.etat === "sortie") return;

        this.etat = "sortie";

        const cible = this.scene.get(SCENE_SUIVANTE) ? SCENE_SUIVANTE : "menu";

        fct.fermerRideau(this, 800, () => this.scene.start(cible));
    }


    // ==============================
    // UPDATE (environ 60 fois par seconde) : lecture du clavier
    // ==============================

    update() {

        // On lit les touches TOUJOURS (même hors partie), sinon un appui fait
        // pendant l'attente serait compté plus tard. toucher() ignore ce qui
        // n'est pas pendant la partie.
        this.plateaux.forEach(plateau => {

            plateau.touches.forEach((touchesDeLaTrappe, index) => {

                touchesDeLaTrappe.forEach(touche => {
                    if (Phaser.Input.Keyboard.JustDown(touche)) {
                        this.toucher(plateau, index);
                    }
                });
            });
        });
    }
}