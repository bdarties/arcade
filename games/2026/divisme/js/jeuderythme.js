import {
    COULEURS,
    BORNE,
    VIES_MAX,
    TAILLE,
    POS,
    POINTS,
    MINIJEUX,
    css,
    style,
    creerEnTete,
    creerVies,
    retirerVie,
    afficherResultat,
    lancerAmbiance,
    jouerSon,
    ouvrirRideau,
    fermerRideau,
    afficherConsigne,
    compteARebours,
    attendreContinuer,
    enregistrerScore,
    creerTouches,
    uneTouchePressee
} from "./fonctions.js";

// ==============================
// RÉGLAGES ( TODO : à modifier pour équilibrer le jeu après le test sur la borne)
// ==============================

// Pour tester ce mini-jeu SEUL, sans passer par histoire.js : écrire 1 ou 2.
// En jeu normal : laisser null (le mode vient alors du registry, choisi dans histoire.js).
const FORCER_MODE = null;

// Volume de la musique de fond pendant ce mini-jeu (pour ne pas couvrir les voix)
const VOLUME_MUSIQUE = 0.25;

// SOLO : nombre de mélodies à réussir pour que le mini-jeu compte comme RÉUSSI
const OBJECTIF_SOLO = 5;

// Gris des symboles "pas encore joués" (les autres couleurs viennent de la palette)
const GRIS_NEUTRE = 0x556B72;

const CONFIG = {
    largeur: 1280,
    hauteur: 720,

    dureeManche: 4300,
    augmentationVitesse: 0.12,
    vitesseMax: 2.5,

    // --- Les "boutons" du jeu ---
    symboles: [
        { id: "gauche", dessin: "◀", couleur: COULEURS.TURQUOISE_CLAIR, son: "voix_gauche" },
        { id: "droite", dessin: "▶", couleur: COULEURS.ROUGE_CLAIR, son: "voix_droite" },
        { id: "action", dessin: "●", couleur: COULEURS.DORE, son: "voix_action" }
    ],

    longueurMin: 3,
    longueurMax: 5,

    // Touches de chaque joueur : [gauche, droite, action] (le joystick + le bouton A).
    // Elles viennent de BORNE (fonctions.js) : si la borne change, rien à modifier ici.
    // (en mode 1 joueur, le joueur 1 peut utiliser les deux jeux de touches)
    touches: {
        j1: [BORNE.j1.gauche, BORNE.j1.droite, BORNE.j1.boutons[0]],
        j2: [BORNE.j2.gauche, BORNE.j2.droite, BORNE.j2.boutons[0]]
    },

    // Réglages propres à chaque joueur (mode 2 joueurs)
    joueurs: [
        {
            x: 250,                              // position de la chanteuse
            flip: false,                         // miroir
            couleur: COULEURS.TURQUOISE,         // couleur du joueur 1 (étiquette, pastilles)
            teinte: COULEURS.TURQUOISE_CLAIR,    // teinte de la chanteuse (version claire : sinon trop sombre)
            sonPan: -0.6,                        // son plutôt à gauche
            sonDetune: 0                         // hauteur normale
        },
        {
            x: 1030,
            flip: true,
            couleur: COULEURS.ROUGE,             // couleur du joueur 2
            teinte: COULEURS.ROUGE_CLAIR,
            sonPan: 0.6,                         // son plutôt à droite
            sonDetune: 500                       // +5 demi-tons : voix plus aiguë pour la distinguer
        }
    ]
};


// ==============================
// SCÈNE JEU DE RYTHME
// ==============================
// "this.etat" : "attente" (consigne, compte à rebours) -> "jeu" -> "resultat" (entre deux
// mélodies) -> ... -> "fin" (résultat final affiché) -> "sortie" (le rideau se ferme)

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
        this.load.image("chanteuse", "src/sprite/sprite_mj.png");

        // Masques : ce sont les mêmes que dans clicker.js.
        // Si la clé existe déjà dans le jeu, Phaser ne recharge pas le fichier.
        this.load.image("masque_content", "src/sprite/masque_content.png");
        this.load.image("masque_triste", "src/sprite/masque_triste.png");

        // Audio
        this.load.audio("voix_gauche", "src/audio/OperaChant1.ogg");
        this.load.audio("voix_droite", "src/audio/OperaChant2.ogg");
        this.load.audio("voix_action", "src/audio/OperaChant3.ogg");
        this.load.audio("son_erreur", "src/audio/OperaChantBad.ogg");

        // Sons de fin de partie (déjà chargés par le clicker : pas rechargés une 2e fois)
        this.load.audio("harpe_glissando", "src/audio/harpe_glissando.wav");
        this.load.audio("harpe_grave", "src/audio/harpe_grave.wav");
    }


    // ==============================
    // CREATE
    // ==============================

    create() {

        const C = CONFIG;

        // Lecture du mode choisi dans histoire.js (1 par défaut si rien n'a été choisi)
        const mode = FORCER_MODE || this.registry.get("joueurs") || 1;
        this.nbJoueurs = mode === 2 ? 2 : 1;

        // Tant que la consigne et le compte à rebours ne sont pas finis, la partie n'a pas commencé
        this.etat = "attente";

        // Transition : le rideau s'ouvre
        ouvrirRideau(this, 800);


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
        // FOND ET AMBIANCE (comme dans le clicker)
        // ==============================

        this.add.image(C.largeur / 2, C.hauteur / 2, "rythme_bg").setDepth(-10);
        lancerAmbiance(this);


        // ==============================
        // EN-TÊTE (titre + consigne) ET SCORE, aux places standard
        // ==============================

        creerEnTete(
            this,
            MINIJEUX.rythme.nom,
            this.nbJoueurs === 1
                ? "Reproduis la suite avant la fin de la barre !"
                : "Reproduis la suite sans te tromper !"
        );

        // Le score prend la place du "Temps : ..." des autres mini-jeux (ici, c'est la barre qui chronomètre)
        this.txtInfo = this.add.text(POS.LARGEUR / 2, POS.TEMPS_Y, "", style(TAILLE.GRAND)).setOrigin(0.5);
        this.txtInfo.setText(this.nbJoueurs === 2 ? "J1 : 0   |   J2 : 0" : "Score : 0");


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

        // Même look que la jauge du clicker : fond nuit, bordure dorée
        this.barreFond = this.add.rectangle(C.largeur / 2, yBarre, this.largeurBarre, hauteurBarre, COULEURS.NUIT, 0.85)
            .setStrokeStyle(4, COULEURS.DORE)
            .setDepth(4);

        this.barreTimer = this.add.rectangle(margeBarre, yBarre, this.largeurBarre, hauteurBarre - 8, COULEURS.TURQUOISE)
            .setOrigin(0, 0.5)
            .setScale(0, 1)
            .setDepth(4);


        // Consigne -> le joueur appuie -> compte à rebours -> la première manche démarre
        this.lancerIntro();
    }


    // ==============================
    // INTRO : CONSIGNE PUIS COMPTE À REBOURS
    // ==============================

    lancerIntro() {

        let lignes;

        if (this.nbJoueurs === 1) {
            lignes = [
                "Une suite de symboles apparaît : ◀ ▶ ●",
                "Reproduis-la dans l'ordre : joystick à gauche pour ◀, à droite pour ▶, bouton A pour ●.",
                "Une erreur ou le temps écoulé te fait perdre une vie. Réussis " + OBJECTIF_SOLO + " mélodies pour gagner !"
            ];
        } else {
            lignes = [
                "La même suite apparaît pour les deux joueurs : ◀ ▶ ●",
                "Reproduis-la avec ton joystick (gauche ◀, droite ▶) et ton bouton A ●.",
                "Une erreur te fait perdre une vie. Celui qui n'a plus de vie perd !"
            ];
        }

        afficherConsigne(this, MINIJEUX.rythme.nom, lignes, () => {
            compteARebours(this, () => this.demarrerManche());
        });
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

        // Pour chaque symbole : la liste de ses touches (une par jeu de touches)
        const touches = C.symboles.map((_, i) =>
            creerTouches(this, jeuxTouches.map(jeu => jeu[i]))
        );


        // --- Chanteuse ---
        const posX = deux ? cfg.x : 250;
        const chanteur = this.add.image(posX, 0, "chanteuse").setOrigin(0.5, 1);
        const baseY = 520 + chanteur.displayHeight / 2;
        chanteur.y = baseY;

        if (deux && cfg.flip) chanteur.setFlipX(true);
        if (deux) chanteur.setTint(cfg.teinte);

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


        // --- Masques de vie (les mêmes que dans tous les mini-jeux : creerVies) ---
        // Duo : au-dessus de chaque chanteuse. Solo : au centre, sous le score.
        const masques = creerVies(this, deux ? posX : 640, deux ? 115 : 230, VIES_MAX);


        // --- Étiquette "JOUEUR 1" / "JOUEUR 2" (mode 2 joueurs) ---
        if (deux) {
            this.add.text(posX, 175, "JOUEUR " + (j + 1),
                style(TAILLE.PETIT, css(COULEURS.CREME), css(cfg.couleur))).setOrigin(0.5);
        }


        // --- Texte de résultat de la manche (BRAVO / RATÉ) ---
        const reglage = style(TAILLE.GRAND);
        reglage.backgroundColor = css(COULEURS.NUIT);
        reglage.padding = { x: 16, y: 10 };

        const txtResultat = this.add.text(
            deux ? posX : C.largeur / 2,
            deux ? 300 : C.hauteur / 2,
            "",
            reglage
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
    // SON : une voix par joueur, avec un "filtre" propre à chacun
    // (pan + detune gérés nativement par Phaser, WebAudio uniquement)
    // ==============================

    jouerVoix(p, clefSon) {

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

        // Même logique de couleurs que la jauge du clicker : calme -> ça se tend -> urgent
        let couleur = COULEURS.TURQUOISE;

        if (progression >= 0.75) {
            couleur = COULEURS.ROUGE;
        } else if (progression >= 0.4) {
            couleur = COULEURS.DORE;
        }

        this.barreTimer.setFillStyle(couleur);
    }


    // ==============================
    // DÉROULEMENT D'UNE MANCHE (= une mélodie à reproduire)
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
        this.barreTimer.setFillStyle(COULEURS.TURQUOISE);

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
            }).setOrigin(0.5).setTint(GRIS_NEUTRE);

            this.groupeTouches.add(texte);
            this.symbolesVisuels.push(texte);

            // En 2 joueurs : une pastille de progression par joueur sous chaque symbole
            if (deux) {
                this.joueurs.forEach((p, j) => {

                    const pastille = this.add.circle(cx, cy + 45 + j * 18, 6, GRIS_NEUTRE)
                        .setStrokeStyle(2, C.joueurs[j].couleur);

                    this.groupeTouches.add(pastille);
                    this.pastilles[j].push(pastille);
                });
            }
        });
    }


    // Renvoie le numéro du symbole pressé par ce joueur (0, 1 ou 2), ou -1 si rien.
    // uneTouchePressee lit (et "consomme") toutes les touches d'un symbole :
    // pas d'appui "fantôme" à l'image suivante.
    lireTouche(p) {

        const appuis = p.touches.map(touchesDuSymbole => uneTouchePressee(touchesDuSymbole));

        return appuis.indexOf(true);
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
        p.vies = retirerVie(this, p.masques, p.vies);

        p.etat = "perdu";
        this.jouerVoix(p, "son_erreur");
        p.txtResultat.setText("RATÉ…").setVisible(true);
    }


    // ==============================
    // FIN DE PARTIE
    // ==============================

    finDePartie() {

        this.etat = "fin";

        this.joueurs.forEach(p => p.txtResultat.setVisible(false));

        if (this.nbJoueurs === 1) {

            // SOLO : réussi si on a joué assez de mélodies. Les points s'ajoutent au score total.
            const melodies = this.joueurs[0].score;
            const points = melodies * POINTS.PAR_MELODIE;
            const reussi = melodies >= OBJECTIF_SOLO;

            enregistrerScore(this, "rythme", points, 0, reussi);

            if (reussi) {

                afficherResultat(this, "BRAVO !", melodies + " mélodies : objectif atteint !  +" + points + " pts", undefined, true);
                jouerSon(this, "harpe_glissando", { volume: 0.7 });

            } else {

                afficherResultat(this, "Plus de vies !", melodies + " / " + OBJECTIF_SOLO + " mélodies  +" + points + " pts", css(COULEURS.ROUGE_CLAIR));
                jouerSon(this, "harpe_grave", { volume: 0.7 });
                this.cameras.main.shake(200, 0.006);
            }

        } else {

            // DUO : chaque joueur marque des points pour chaque mélodie réussie
            const [a, b] = this.joueurs;

            enregistrerScore(this, "rythme", a.score * POINTS.PAR_MELODIE, b.score * POINTS.PAR_MELODIE);

            let titre;

            if (a.vies > 0 && b.vies <= 0) titre = "JOUEUR 1 GAGNE !";
            else if (b.vies > 0 && a.vies <= 0) titre = "JOUEUR 2 GAGNE !";
            else if (a.score > b.score) titre = "JOUEUR 1 GAGNE !";
            else if (b.score > a.score) titre = "JOUEUR 2 GAGNE !";
            else titre = "ÉGALITÉ !";

            const egalite = titre === "ÉGALITÉ !";

            afficherResultat(this, titre, "Mélodies - J1 : " + a.score + "   J2 : " + b.score, undefined, !egalite);

            if (!egalite) jouerSon(this, "harpe_glissando", { volume: 0.7 });
        }

        attendreContinuer(this, () => this.passerAuSuivant());
    }


    // Fermeture du rideau, puis passage au mini-jeu suivant.
    passerAuSuivant() {

        // Garde-fou : touche ET clic sur la même frame ne lancent qu'une seule transition
        if (this.etat === "sortie") return;

        this.etat = "sortie";

        fermerRideau(this, 800, () => this.scene.start("jeudelataupe"));
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

        // Avant le début (consigne, compte à rebours), à l'écran final, ou pendant la sortie : rien à faire
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

                    this.jouerVoix(p, C.symboles[touchePressee].son);
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

            let couleur = GRIS_NEUTRE;                                        // pas encore joué

            if (tousPerdu && i === idxRef) couleur = COULEURS.ROUGE_CLAIR;    // erreur
            else if (i < idxRef) couleur = COULEURS.CREME;                    // validé
            else if (i === idxRef) couleur = flash ? 0xffffff : sym.couleur;  // en cours

            this.symbolesVisuels[i].setTint(couleur);
        });

        // Pastilles de progression individuelles (2 joueurs)
        if (deux) {

            this.joueurs.forEach((p, j) => {
                this.pastilles[j].forEach((pastille, i) => {

                    let c = GRIS_NEUTRE;

                    if (i < p.indexCourant) c = COULEURS.CREME;
                    else if (p.etat === "perdu" && i === p.indexCourant) c = COULEURS.ROUGE_CLAIR;

                    pastille.setFillStyle(c);
                });
            });

            this.txtInfo.setText("J1 : " + this.joueurs[0].score + "   |   J2 : " + this.joueurs[1].score);

        } else {

            this.txtInfo.setText("Score : " + this.joueurs[0].score);
        }
    }
}