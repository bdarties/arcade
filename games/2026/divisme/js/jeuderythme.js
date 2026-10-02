import * as fct from "./fonctions.js";

// ==============================
// RÉGLAGES
// ==============================

// Pour tester ce mini-jeu SEUL, sans passer par histoire.js : écrire 1 ou 2.
// En jeu normal : laisser null (le mode vient alors du registry, choisi dans histoire.js).
const FORCER_MODE = null;

// Scène lancée après ce mini-jeu.
// Si elle n'existe pas encore (jeudelataupe.js est vide), on retourne au menu.
const SCENE_SUIVANTE = "jeudelataupe";

// Volume de la musique de fond pendant ce mini-jeu (pour ne pas couvrir les voix)
const VOLUME_MUSIQUE = 0.25;

// Nombre de masques (= vies de chaque joueur)
const VIES_MAX = 3;

const CONFIG = {
    largeur: 1280,
    hauteur: 720,

    dureeManche: 4300,
    augmentationVitesse: 0.12,
    vitesseMax: 2.5,

    // --- Les "boutons" du jeu ---
    symboles: [
        { id: "gauche", dessin: "◀", couleur: 0x6ec1ff, son: "voix_gauche" },
        { id: "droite", dessin: "▶", couleur: 0xffb86e, son: "voix_droite" },
        { id: "action", dessin: "●", couleur: 0xffd23f, son: "voix_action" }
    ],

    longueurMin: 3,
    longueurMax: 5,

    // Touches de chaque joueur : [gauche, droite, action]
    // (en mode 1 joueur, le joueur 1 peut utiliser les deux jeux de touches)
    touches: {
        j1: ["LEFT", "RIGHT", "I"],   // joystick J1 + bouton en haut à gauche
        j2: ["Q", "D", "R"]           // joystick J2 + bouton en haut à gauche
    },

    // Réglages propres à chaque joueur (mode 2 joueurs)
    joueurs: [
        {
            x: 250,              // position de la chanteuse
            flip: false,         // miroir
            teinte: 0xAE505,    // violet = couleur du joueur 1 dans le clicker (null = pas de teinte)
            sonPan: -0.6,        // son plutôt à gauche
            sonDetune: 0         // hauteur normale
        },
        {
            x: 1030,
            flip: true,
            teinte: 0xf5b041,    // orange = couleur du joueur 2 dans le clicker
            sonPan: 0.6,         // son plutôt à droite
            sonDetune: 500       // +5 demi-tons : voix plus aiguë pour la distinguer
        }
    ]
};


// ==============================
// FONCTION UTILITAIRE
// ==============================

// Redimensionne une image pour qu'elle ait la hauteur voulue,
// sans la déformer (on garde les proportions).
function hauteurFixe(image, hauteur) {
    image.setScale(hauteur / image.height);
}


// ==============================
// SCÈNE JEU DE RYTHME
// ==============================

export default class jeuderythme extends Phaser.Scene {

    constructor() {
        super({ key: "jeuderythme" });
    }


    // ==============================
    // PRELOAD
    // ==============================

    preload() {

        const baseURL = this.sys.game.config.baseURL;
        this.load.setBaseURL(baseURL);

        // Images
        this.load.image("rythme_bg", "src/bg/rythme_bg.png");
        this.load.image("chanteuse", "src/sprite/spriteMJ.png");

        // Masques : ce sont les mêmes que dans clicker.js.
        // Si la clé existe déjà dans le jeu, Phaser ne recharge pas le fichier.
        this.load.image("masque_content", "src/sprite/masque_content.png");
        this.load.image("masque_triste", "src/sprite/masque_triste.png");

        // Audio
        this.load.audio("voix_gauche", "src/audio/OperaChant1.ogg");
        this.load.audio("voix_droite", "src/audio/OperaChant2.ogg");
        this.load.audio("voix_action", "src/audio/OperaChant3.ogg");
        this.load.audio("son_erreur", "src/audio/OperaChantBad.ogg");
    }


    // ==============================
    // CREATE
    // ==============================

    create() {

        const C = CONFIG;

        // Lecture du mode choisi dans histoire.js (1 par défaut si rien n'a été choisi)
        const mode = FORCER_MODE || this.registry.get("joueurs") || 1;
        this.nbJoueurs = mode === 2 ? 2 : 1;

        // Tant que le rideau n'est pas ouvert, la partie n'a pas commencé
        this.etat = "attente";

        // Transition : le rideau s'ouvre
        fct.ouvrirRideau(this, 800);


        // ==============================
        // MUSIQUE DE FOND : on la baisse pendant ce mini-jeu
        // ==============================

        this.musiqueFond = this.sound.get("background");

        if (this.musiqueFond) {
            this.volumeAvant = this.musiqueFond.volume;
            this.musiqueFond.volume = VOLUME_MUSIQUE;
        }

        // En quittant la scène : on rend le volume et on coupe les voix en cours
        this.events.once("shutdown", () => {

            if (this.musiqueFond) {
                this.musiqueFond.volume = this.volumeAvant;
            }

            this.joueurs.forEach(p => {
                if (p.sonActif) p.sonActif.stop();
            });
        });


        // ==============================
        // FOND
        // ==============================

        this.add.image(C.largeur / 2, C.hauteur / 2, "rythme_bg");


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

        this.add.text(C.largeur / 2, 60, "L'AIR D'OPÉRA !", this.style("40px")).setOrigin(0.5);

        this.txtInfo = this.add.text(C.largeur / 2, 20, "", this.style("16px")).setOrigin(0.5);

        // Rappel des touches (le joueur arrive de l'histoire, il ne les connaît pas)
        const aide = this.nbJoueurs === 2
            ? "J1 : ← ◀  → ▶  I ●        J2 : Q ◀  D ▶  R ●"
            : "← ◀  → ▶  I ●      ou      Q ◀  D ▶  R ●";

        this.add.text(C.largeur / 2, 165, aide, this.style("18px", { color: "#cccccc" })).setOrigin(0.5);


        // ==============================
        // CRÉATION DES JOUEURS (chanteuse, masques, touches, textes)
        // ==============================

        this.joueurs = [];

        for (let j = 0; j < this.nbJoueurs; j++) {
            this.joueurs.push(this.creerJoueur(j));
        }


        // ==============================
        // GROUPE POUR L'AFFICHAGE DES TOUCHES (barre commune)
        // ==============================

        this.groupeTouches = this.add.group();


        // ==============================
        // BARRE DE TIMER (en bas de l'écran), commune aux deux joueurs
        // ==============================

        const margeBarre = 40;
        const hauteurBarre = 24;
        const yBarre = C.hauteur - 35;
        this.largeurBarre = C.largeur - margeBarre * 2;

        this.barreFond = this.add.rectangle(C.largeur / 2, yBarre, this.largeurBarre, hauteurBarre, 0x000000, 0.5)
            .setStrokeStyle(3, 0xffffff)
            .setDepth(4);

        this.barreTimer = this.add.rectangle(margeBarre, yBarre, this.largeurBarre, hauteurBarre - 8, 0x4ee0a0)
            .setOrigin(0, 0.5)
            .setScale(0, 1)
            .setDepth(4);


        // ==============================
        // LA PREMIÈRE MANCHE DÉMARRE QUAND LE RIDEAU EST OUVERT
        // ==============================

        this.time.delayedCall(800, () => this.demarrerManche());
    }


    // ==============================
    // CRÉATION D'UN JOUEUR
    // ==============================

    creerJoueur(j) {

        const C = CONFIG;
        const cfg = C.joueurs[j];
        const deux = this.nbJoueurs === 2;
        const sens = cfg.flip ? -1 : 1; // inverse les balancements pour le miroir

        // --- Touches : tableau [symbole] -> liste de Key ---
        const jeuxTouches = [j === 0 ? C.touches.j1 : C.touches.j2];

        if (!deux) {
            jeuxTouches.push(C.touches.j2); // 1 joueur : les deux jeux de touches marchent
        }

        const touches = C.symboles.map((_, i) =>
            jeuxTouches.map(jeu => this.input.keyboard.addKey(jeu[i]))
        );


        // --- Chanteuse ---
        const posX = deux ? cfg.x : 250;
        const chanteur = this.add.image(posX, 0, "chanteuse").setOrigin(0.5, 1);
        const baseY = 520 + chanteur.displayHeight / 2;
        chanteur.y = baseY;

        if (deux && cfg.flip) chanteur.setFlipX(true);
        if (deux && cfg.teinte !== null) chanteur.setTint(cfg.teinte);

        // Idle : balancement gauche/droite
        chanteur.setAngle(-8 * sens);

        const tweenIdle = this.tweens.add({
            targets: chanteur,
            angle: 8 * sens,
            duration: 1500,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1
        });


        // --- Masques de vie (mêmes images et mêmes animations que dans clicker.js) ---
        const masqueY = 115;
        const espaceMasque = 80;
        const masques = [];

        for (let i = 0; i < VIES_MAX; i++) {

            let x;

            if (!deux) {
                x = 560 + i * espaceMasque;                  // position d'origine
            } else {
                const xJ1 = 170 + i * espaceMasque;
                x = j === 0 ? xJ1 : C.largeur - xJ1;         // miroir pour le joueur 2
            }

            const masque = this.add.image(x, masqueY, "masque_content").setDepth(3);
            masque.baseY = masqueY;

            masques.push(masque);
        }

        this.majVies(masques, VIES_MAX);


        // --- Étiquette "JOUEUR 1" / "JOUEUR 2" (mode 2 joueurs) ---
        if (deux) {
            this.add.text(posX, masqueY + 55, "JOUEUR " + (j + 1), this.style("18px"))
                .setOrigin(0.5)
                .setColor(cfg.teinte !== null ? "#" + cfg.teinte.toString(16).padStart(6, "0") : "#ffffff");
        }


        // --- Texte de résultat de la manche (BRAVO / RATÉ) ---
        const txtResultat = this.add.text(
            deux ? posX : C.largeur / 2,
            deux ? 300 : C.hauteur / 2,
            "",
            this.style("30px", { backgroundColor: "#000a", padding: { x: 16, y: 10 } })
        ).setOrigin(0.5).setDepth(5).setVisible(false);


        return {
            id: j,
            touches,
            chanteur, baseY, tweenIdle, tweenSaut: null,
            masques,
            txtResultat,
            sonActif: null,
            vies: VIES_MAX,
            score: 0,
            indexCourant: 0,
            flashTimer: 0,
            etat: "jeu" // "jeu" | "gagne" | "perdu"
        };
    }


    // ==============================
    // MASQUES (même logique que dans clicker.js)
    // ==============================

    // Met à jour les masques :
    // - vie restante : masque content, qui se balance doucement
    // - vie perdue   : masque triste, rougeâtre, immobile
    majVies(masques, vies) {

        masques.forEach((masque, i) => {

            // On repart de zéro : plus d'animation, position et angle normaux
            this.tweens.killTweensOf(masque);
            masque.setY(masque.baseY).setAngle(0);

            if (i < vies) {
                masque.setTexture("masque_content");
                masque.clearTint();
                hauteurFixe(masque, 60);
                this.animerMasque(masque, i);
            } else {
                masque.setTexture("masque_triste");
                masque.setTint(0xff6666); // teinte rouge
                hauteurFixe(masque, 60);
            }
        });
    }


    // Balancement permanent d'un masque (monte, descend, se penche).
    animerMasque(masque, index) {

        masque.setAngle(-5);

        this.tweens.add({
            targets: masque,
            y: masque.baseY - 6,
            angle: 5,
            duration: 900,
            delay: index * 150,      // décalage : les masques ne bougent pas tous en même temps
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1               // -1 = pour toujours
        });
    }


    // Animation du masque qui vient de perdre : il grossit et tremble.
    animerPerte(masque) {

        const echelle = masque.scaleX;

        this.tweens.add({
            targets: masque,
            scaleX: echelle * 1.6,
            scaleY: echelle * 1.6,
            duration: 150,
            yoyo: true,
            ease: "Quad.easeOut"
        });

        this.tweens.add({
            targets: masque,
            angle: { from: -15, to: 15 },
            duration: 60,
            yoyo: true,
            repeat: 4,
            onComplete: () => masque.setAngle(0)
        });
    }


    // Retire une vie (jamais sous 0), met les masques à jour et renvoie le nouveau nombre de vies.
    retirerVie(masques, vies) {

        const nouvellesVies = Math.max(0, vies - 1);

        this.majVies(masques, nouvellesVies);

        // Si une vie a vraiment été perdue, le masque concerné réagit
        if (nouvellesVies < vies) {
            this.animerPerte(masques[nouvellesVies]);
        }

        return nouvellesVies;
    }


    // ==============================
    // RÉSULTAT (même cadre que dans clicker.js)
    // ==============================

    // Affiche un résultat lisible : rectangle noir transparent + titre + sous-titre.
    afficherResultat(titre, sousTitre, couleurSousTitre) {

        // Rectangle noir à 65 % d'opacité (le 5e paramètre est l'opacité de la couleur)
        const panneau = this.add.rectangle(640, 385, 820, 130, 0x000000, 0.65)
            .setStrokeStyle(2, 0xffffff, 0.5)
            .setDepth(60);

        const elements = [panneau];

        elements.push(
            this.add.text(640, 355, titre, {
                fontSize: "50px",
                color: "#ffffff",
                fontStyle: "bold"
            }).setOrigin(0.5).setDepth(61)
        );

        if (sousTitre) {
            elements.push(
                this.add.text(640, 420, sousTitre, {
                    fontSize: "30px",
                    color: couleurSousTitre || "#ffffff",
                    fontStyle: "bold"
                }).setOrigin(0.5).setDepth(61)
            );
        }

        // Apparition : fondu + léger zoom
        this.tweens.add({
            targets: elements,
            alpha: { from: 0, to: 1 },
            scale: { from: 0.85, to: 1 },
            duration: 250,
            ease: "Back.easeOut"
        });
    }


    // ==============================
    // SON : un son par joueur, avec un "filtre" propre à chacun
    // (pan + detune gérés nativement par Phaser, WebAudio uniquement)
    // ==============================

    jouerSon(p, clefSon) {

        // On coupe uniquement l'ancien son de CE joueur
        if (p.sonActif) p.sonActif.stop();

        const cfg = CONFIG.joueurs[p.id];
        const config = this.nbJoueurs === 2
            ? { detune: cfg.sonDetune, pan: cfg.sonPan }
            : {};

        const son = this.sound.add(clefSon, config);
        p.sonActif = son;

        const nettoyer = () => {
            if (p.sonActif === son) p.sonActif = null;
            son.destroy();
        };

        son.once("complete", nettoyer);
        son.once("stop", nettoyer);

        son.play();
    }


    sauter(p) {

        if (p.tweenSaut) {
            p.tweenSaut.stop();
            p.chanteur.y = p.baseY;
        }

        p.tweenSaut = this.tweens.add({
            targets: p.chanteur,
            y: p.baseY - 70,
            duration: 140,
            ease: "Quad.easeOut",
            yoyo: true,
            onComplete: () => { p.tweenSaut = null; }
        });
    }


    // ==============================
    // BARRE DE TIMER
    // ==============================

    majBarreTimer() {

        const C = CONFIG;
        const progression = Phaser.Math.Clamp(this.chrono / (C.dureeManche / this.vitesse), 0, 1);

        this.barreTimer.scaleX = progression;

        // Dégradé vert → rouge selon l'avancement
        const vert = Phaser.Display.Color.ValueToColor(0x4ee0a0);
        const rouge = Phaser.Display.Color.ValueToColor(0xff5d5d);
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(vert, rouge, 100, progression * 100);

        this.barreTimer.setFillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
    }


    // ==============================
    // DÉROULEMENT D'UNE MANCHE
    // ==============================

    demarrerManche() {

        const C = CONFIG;
        const meilleurScore = Math.max(...this.joueurs.map(p => p.score));
        this.vitesse = Math.min(C.vitesseMax, 1 + C.augmentationVitesse * meilleurScore);

        // Une seule suite, partagée par les deux joueurs
        const longueur = Phaser.Math.Between(C.longueurMin, C.longueurMax);
        this.suite = Array.from({ length: longueur }, () => Phaser.Math.Between(0, C.symboles.length - 1));

        this.etat = "jeu";
        this.chrono = 0;

        this.joueurs.forEach(p => {
            p.indexCourant = 0;
            p.flashTimer = 0;
            p.etat = "jeu";
            p.txtResultat.setVisible(false);
        });

        this.barreTimer.setScale(0, 1);
        this.barreTimer.setFillStyle(0x4ee0a0);

        this.construireSymboles();
    }


    // Crée la barre de touches commune (une seule fois par manche)
    construireSymboles() {

        const C = CONFIG;
        const deux = this.nbJoueurs === 2;

        this.groupeTouches.clear(true, true);
        this.symbolesVisuels = [];
        this.pastilles = this.joueurs.map(() => []);

        const cy = C.hauteur / 2;
        const pas = 80;
        const startX = C.largeur / 2 - (this.suite.length - 1) * pas / 2;

        this.suite.forEach((symIndex, i) => {

            const sym = C.symboles[symIndex];
            const cx = startX + i * pas;

            const texte = this.add.text(cx, cy, sym.dessin, {
                fontFamily: "system-ui",
                fontSize: "40px",
                color: "#ffffff"
            }).setOrigin(0.5).setTint(0x555577);

            this.groupeTouches.add(texte);
            this.symbolesVisuels.push(texte);

            // En 2 joueurs : une pastille de progression par joueur sous chaque symbole
            if (deux) {
                this.joueurs.forEach((p, j) => {

                    const teinte = C.joueurs[j].teinte;

                    const pastille = this.add.circle(cx, cy + 45 + j * 18, 6, 0x555577)
                        .setStrokeStyle(2, teinte !== null ? teinte : 0xffffff);

                    this.groupeTouches.add(pastille);
                    this.pastilles[j].push(pastille);
                });
            }
        });
    }


    // Lit les touches d'un joueur (consomme TOUTES les touches pour éviter les appuis "fantômes")
    lireTouche(p) {

        const J = Phaser.Input.Keyboard.JustDown;
        let resultat = -1;

        p.touches.forEach((keys, i) => {
            keys.forEach(k => {
                if (J(k) && resultat === -1) resultat = i;
            });
        });

        return resultat;
    }


    // La manche se termine quand plus aucun joueur n'est en train de jouer
    verifierFinManche() {

        if (this.etat !== "jeu") return;
        if (this.joueurs.some(p => p.etat === "jeu")) return;

        this.etat = "resultat";

        this.time.delayedCall(700, () => {
            if (this.joueurs.some(p => p.vies <= 0)) this.finDePartie();
            else this.demarrerManche();
        });
    }


    reussir(p) {

        p.score++;
        p.etat = "gagne";
        p.txtResultat.setText("BRAVO !").setVisible(true);
    }


    echouer(p) {

        // Le masque le plus à droite devient triste en premier
        p.vies = this.retirerVie(p.masques, p.vies);

        p.etat = "perdu";
        this.jouerSon(p, "son_erreur");
        p.txtResultat.setText("RATÉ…").setVisible(true);
    }


    // ==============================
    // FIN DE PARTIE
    // ==============================

    finDePartie() {

        this.etat = "fin";

        this.joueurs.forEach(p => p.txtResultat.setVisible(false));

        if (this.nbJoueurs === 1) {

            this.afficherResultat("GAME OVER", "Mélodies réussies : " + this.joueurs[0].score);

        } else {

            const [a, b] = this.joueurs;
            let titre;

            if (a.vies > 0 && b.vies <= 0) titre = "🏆 JOUEUR 1 GAGNE !";
            else if (b.vies > 0 && a.vies <= 0) titre = "🏆 JOUEUR 2 GAGNE !";
            else if (a.score > b.score) titre = "🏆 JOUEUR 1 GAGNE !";
            else if (b.score > a.score) titre = "🏆 JOUEUR 2 GAGNE !";
            else titre = "🤝 ÉGALITÉ !";

            this.afficherResultat(titre, "Mélodies — J1 : " + a.score + " | J2 : " + b.score);
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


    // Fermeture du rideau, puis passage au mini-jeu suivant.
    passerAuSuivant() {

        // Garde-fou : touche ET clic sur la même frame ne lancent qu'une seule transition
        if (this.etat === "sortie") return;

        this.etat = "sortie";

        const cible = this.scene.get(SCENE_SUIVANTE) ? SCENE_SUIVANTE : "menu";

        fct.fermerRideau(this, 800, () => this.scene.start(cible));
    }


    // ==============================
    // UPDATE (environ 60 fois par seconde)
    // ==============================

    // "dt" = temps écoulé depuis la dernière image, en millisecondes.
    update(_, dt) {

        const C = CONFIG;

        // On lit les touches TOUJOURS (même quand on n'en fait rien),
        // sinon un appui fait pendant l'attente serait compté plus tard.
        const appuis = this.joueurs.map(p => this.lireTouche(p));

        // Avant le début (rideau), à l'écran final, ou pendant la sortie : rien à faire
        if (this.etat === "attente" || this.etat === "fin" || this.etat === "sortie") return;

        this.chrono += dt;

        this.joueurs.forEach(p => {
            if (p.flashTimer > 0) p.flashTimer -= dt;
        });

        if (this.etat === "jeu") {

            this.majBarreTimer();

            this.joueurs.forEach((p, j) => {

                if (p.etat !== "jeu") return;

                const touchePressee = appuis[j];

                if (touchePressee === -1) return;

                if (touchePressee === this.suite[p.indexCourant]) {

                    this.jouerSon(p, C.symboles[touchePressee].son);
                    this.sauter(p);

                    p.indexCourant++;
                    p.flashTimer = 150;

                    if (p.indexCourant >= this.suite.length) this.reussir(p);

                } else {

                    this.echouer(p);
                }
            });

            // Temps écoulé : tous ceux qui n'ont pas fini ratent
            if (this.chrono >= C.dureeManche / this.vitesse) {
                this.joueurs.forEach(p => {
                    if (p.etat === "jeu") this.echouer(p);
                });
            }

            this.verifierFinManche();
        }

        this.dessiner();
    }


    // ==============================
    // AFFICHAGE DES SYMBOLES ET DES SCORES
    // ==============================

    dessiner() {

        const C = CONFIG;
        const deux = this.nbJoueurs === 2;

        // Progression de référence de la barre commune = joueur le plus lent
        const idxRef = Math.min(...this.joueurs.map(p => p.indexCourant));
        const flash = this.joueurs.some(p => p.flashTimer > 0);
        const tousPerdu = this.joueurs.every(p => p.etat === "perdu");

        this.suite.forEach((symIndex, i) => {

            const sym = C.symboles[symIndex];

            let couleur = 0x555577; // Gris par défaut

            if (tousPerdu && i === idxRef) couleur = 0xff5d5d;                // Rouge erreur
            else if (i < idxRef) couleur = 0x4ee0a0;                          // Vert validé
            else if (i === idxRef) couleur = flash ? 0xffffff : sym.couleur;  // En cours

            this.symbolesVisuels[i].setTint(couleur);
        });

        // Pastilles de progression individuelles (2 joueurs)
        if (deux) {

            this.joueurs.forEach((p, j) => {
                this.pastilles[j].forEach((pastille, i) => {

                    let c = 0x555577;

                    if (i < p.indexCourant) c = 0x4ee0a0;
                    else if (p.etat === "perdu" && i === p.indexCourant) c = 0xff5d5d;

                    pastille.setFillStyle(c);
                });
            });

            this.txtInfo.setText("J1 : " + this.joueurs[0].score + "   |   J2 : " + this.joueurs[1].score);

        } else {

            this.txtInfo.setText("Score : " + this.joueurs[0].score);
        }
    }
}