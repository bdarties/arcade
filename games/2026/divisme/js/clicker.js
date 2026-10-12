import {
    COULEURS,
    COULEUR_J1,
    COULEUR_J2,
    BORNE,
    VIES_MAX,
    TAILLE,
    MINIJEUX,
    css,
    style,
    hauteurFixe,
    creerEnTete,
    creerTexteTemps,
    majTemps,
    creerVies,
    retirerVie,
    afficherResultat,
    explosion,
    lancerAmbiance,
    jouerHarpe,
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
// RÉGLAGES DE DIFFICULTÉ ( TODO : à modifier pour équilibrer le jeu après le test sur la borne)
// ==============================

// Durée de la manche, en secondes
const DUREE_MANCHE = 20;

// SOLO : le crescendo
const GAIN_PAR_CLIC = 4;        // % de jauge gagnés à chaque clic
const PERTE_PAR_SECONDE = 10;   // % de jauge perdus chaque seconde si on ne clique pas

// DUO : le tir à la corde
const LIMITE_CORDE = 20;        // écart de clics pour gagner tout de suite

// SOLO : points rapportés à la partie
const POINTS_REUSSITE = 100;              // jauge pleine
const POINTS_PAR_SECONDE_RESTANTE = 2;    // bonus de rapidité


// ==============================
// SCÈNE CLICKER
// ==============================
// Pour chaque mini-jeu, l'état de la partie est rangé dans "this.etat" :
//   "attente"  : la consigne ou le compte à rebours sont affichés
//   "jeu"      : on joue
//   "fin"      : le résultat est affiché
//   "sortie"   : le rideau se ferme

export default class clicker extends Phaser.Scene {

    constructor() {
        super({ key: "clicker" });
    }


    // ==============================
    // PRELOAD : charger les fichiers
    // ==============================

    preload() {

        // Dossier de base des fichiers (réglé dans la config du jeu)
        const baseURL = this.sys.game.config.baseURL;
        this.load.setBaseURL(baseURL);

        // Fond
        this.load.image("clicker_bg", "src/bg/clicker_bg.png");

        // Décor et personnages
        this.load.image("maestro", "src/sprite/maestro.png");
        this.load.image("masque_content", "src/sprite/masque_content.png");
        this.load.image("masque_triste", "src/sprite/masque_triste.png");

        // Sons de harpe
        this.load.audio("harpe", "src/audio/harpe.wav");
        this.load.audio("harpe_glissando", "src/audio/harpe_glissando.wav");
        this.load.audio("harpe_grave", "src/audio/harpe_grave.wav");
    }


    // ==============================
    // CREATE : construire la scène (une seule fois, au début)
    // ==============================

    create() {

        // Mode choisi dans histoire.js (1 joueur par défaut)
        this.nombreJoueurs = this.registry.get("joueurs") || 1;

        // Tout repart de zéro à chaque partie
        this.etat = "attente";
        this.clicsJ1 = 0;
        this.clicsJ2 = 0;
        this.viesJ1 = VIES_MAX;
        this.viesJ2 = VIES_MAX;
        this.niveauJauge = 0;            // crescendo (solo) : de 0 à 100
        this.tempsRestant = DUREE_MANCHE;
        this.timer = null;
        this.sensMaestro = 1;            // sens d'inclinaison du Maestro (alterne à chaque clic)
        this.fortissimo = false;         // vrai quand la jauge a dépassé 75 %

        // Transition : le rideau s'ouvre
        ouvrirRideau(this, 800);

        // Fond et notes qui flottent derrière le jeu
        this.add.image(640, 360, "clicker_bg").setDepth(-10);
        lancerAmbiance(this);

        // Titre, consigne courte et temps
        creerEnTete(
            this,
            MINIJEUX.clicker.nom,
            this.nombreJoueurs === 1
                ? "Remplis la jauge en cliquant vite !"
                : "Clique plus vite que l'autre joueur !"
        );

        this.texteTemps = creerTexteTemps(this, this.tempsRestant);

        // Le Maestro (à droite en solo, au milieu en duo)
        this.maestro = this.add.image(this.nombreJoueurs === 1 ? 1050 : 640, 450, "maestro");
        hauteurFixe(this.maestro, 700);
        this.echelleMaestro = this.maestro.scaleX;   // on mémorise sa taille normale

        // Mode 1 joueur ou 2 joueurs
        if (this.nombreJoueurs === 1) {
            this.creerSolo();
        } else {
            this.creerDuo();
        }

        // Consigne -> le joueur appuie -> compte à rebours -> la manche démarre
        this.lancerIntro();
    }


    // ==============================
    // INTRO : CONSIGNE PUIS COMPTE À REBOURS
    // ==============================

    lancerIntro() {

        let lignes;

        if (this.nombreJoueurs === 1) {
            lignes = [
                "Clique sur le gros bouton, ou appuie sur les boutons A à F, le plus vite possible.",
                "La jauge descend toute seule : ne t'arrête pas !",
                "Remplis-la avant la fin du temps pour gagner."
            ];
        } else {
            lignes = [
                "Chacun son bouton : joueur 1 à gauche, joueur 2 à droite.",
                "Appuie sur les boutons A à F de ta manette le plus vite possible.",
                "Le nœud de la corde va vers celui qui clique le plus. Le plus rapide gagne !"
            ];
        }

        afficherConsigne(this, MINIJEUX.clicker.nom, lignes, () => {
            compteARebours(this, () => this.demarrerManche());
        });
    }

    demarrerManche() {

        this.etat = "jeu";

        // Un "tic" toutes les secondes : compte à rebours
        this.timer = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => this.tic()
        });
    }

    tic() {

        if (this.etat !== "jeu") return;

        this.tempsRestant--;

        majTemps(this, this.texteTemps, this.tempsRestant);

        if (this.tempsRestant <= 0) {
            this.finDeManche();
        }
    }


    // ==============================
    // EFFETS D'UN CLIC
    // ==============================

    // Petit "rebond" d'une liste d'objets (écrasement + inclinaison).
    rebondir(cibles, echelleBase, angle) {

        // On arrête l'animation précédente et on remet les objets à leur taille normale :
        // sans ça, des clics rapides feraient "dériver" la taille.
        this.tweens.killTweensOf(cibles);

        cibles.forEach(cible => cible.setScale(echelleBase).setAngle(0));

        this.tweens.add({
            targets: cibles,
            scaleX: echelleBase * 0.92,
            scaleY: echelleBase * 0.92,
            angle: angle,
            duration: 70,
            yoyo: true
        });
    }

    // Une note de musique noire apparaît à (x, y), s'envole en devenant transparente.
    lancerNote(x, y) {

        const note = this.add.text(
            x,
            y,
            Phaser.Utils.Array.GetRandom(["♪", "♫"]),
            { fontFamily: "Georgia, serif", fontSize: "44px", color: "#000000", fontStyle: "bold" }
        ).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: note,
            x: x + Phaser.Math.Between(-60, 60),
            y: y - 160,
            angle: Phaser.Math.Between(-25, 25),
            alpha: 0,
            duration: 800,
            onComplete: () => note.destroy()   // on nettoie, sinon elles s'accumulent
        });
    }

    // Tous les effets visuels d'un clic : bouton, Maestro, note, étincelles.
    // "pointer" : n'importe quel objet qui a un x et un y.
    effetsClic(cibles, pointer, sens) {

        this.rebondir(cibles, 1, 0);
        this.rebondir([this.maestro], this.echelleMaestro, 5 * sens);
        this.lancerNote(pointer.x, pointer.y);
        explosion(this, pointer.x, pointer.y, 4, 70, 6);
    }

    // Fermeture du rideau, puis passage au mini-jeu suivant.
    passerAuSuivant() {

        if (this.etat === "sortie") return;
        this.etat = "sortie";

        fermerRideau(this, 800, () => this.scene.start("jeuderythme"));
    }


    // ==============================
    // SOLO : LE CRESCENDO
    // ==============================

    creerSolo() {

        // La jauge : un fond avec bordure dorée + un rectangle de remplissage
        // dont on change la largeur avec setScale (voir majJauge).
        this.add.rectangle(640, 225, 500, 40, COULEURS.NUIT)
            .setStrokeStyle(4, COULEURS.DORE);

        this.jauge = this.add.rectangle(394, 225, 492, 32, COULEURS.TURQUOISE)
            .setOrigin(0, 0.5);   // origine à gauche : la jauge grandit vers la droite

        this.majJauge();

        // Vies (masques)
        this.masquesJ1 = creerVies(this, 640, 285, this.viesJ1);

        // Gros bouton aux couleurs du joueur 1
        this.boutonJ1 = this.add.rectangle(400, 470, 400, 180, COULEUR_J1)
            .setStrokeStyle(6, COULEURS.DORE)
            .setInteractive({ useHandCursor: true });

        this.texteBoutonJ1 = this.add.text(400, 470, "CLIQUE !", style(TAILLE.ENORME)).setOrigin(0.5);

        // Touches : en solo, les boutons des DEUX côtés de la borne fonctionnent
        this.touchesJ1 = creerTouches(this, BORNE.j1.boutons.concat(BORNE.j2.boutons));
        this.touchesJ2 = [];   // liste vide : uneTouchePressee renverra toujours false

        // Le corps d'un clic est rangé dans une fonction, que la souris ET le clavier appellent
        this.actionJ1 = (pointer) => {

            if (this.etat !== "jeu") return;

            this.clicsJ1++;

            // Chaque clic fait monter la jauge (sans dépasser 100)
            this.niveauJauge = Math.min(100, this.niveauJauge + GAIN_PAR_CLIC);
            this.majJauge();

            // Le Maestro s'incline une fois à gauche, une fois à droite
            this.sensMaestro = -this.sensMaestro;
            this.effetsClic([this.boutonJ1, this.texteBoutonJ1], pointer, this.sensMaestro);

            // Harpe : plus la jauge monte, plus la note est aiguë
            jouerHarpe(this, Math.floor(this.niveauJauge / 10), { volume: 0.5 });

            // Jauge pleine : gagné
            if (this.niveauJauge >= 100) {
                this.reussiteSolo();
            }
        };

        this.boutonJ1.on("pointerdown", (pointer) => this.actionJ1(pointer));
    }

    // Met à jour la jauge : longueur et couleur selon le niveau.
    majJauge() {

        const ratio = this.niveauJauge / 100;

        let couleur = COULEURS.TURQUOISE;            // calme

        if (ratio >= 0.75) {
            couleur = COULEURS.ROUGE;                // fortissimo !
        } else if (ratio >= 0.4) {
            couleur = COULEURS.DORE;                 // ça monte
        }

        this.jauge.setScale(ratio, 1);               // largeur = ratio x largeur d'origine
        this.jauge.setFillStyle(couleur);

        // Premier passage au-dessus de 75 % : un flash doré (une seule fois)
        if (ratio >= 0.75 && !this.fortissimo) {
            this.fortissimo = true;
            this.cameras.main.flash(150, 199, 172, 114);
        }

        if (ratio < 0.6) {
            this.fortissimo = false;
        }
    }


    // ==============================
    // DUO : LE TIR À LA CORDE
    // ==============================

    creerDuo() {

        // --- JOUEUR 1 (à gauche) ---
        this.add.text(320, 195, "JOUEUR 1",
            style(TAILLE.NORMAL, css(COULEURS.CREME), css(COULEUR_J1))).setOrigin(0.5);

        this.texteClicsJ1 = this.add.text(320, 240, "0 clic", style(TAILLE.GRAND)).setOrigin(0.5);

        this.masquesJ1 = creerVies(this, 320, 295, this.viesJ1);

        this.boutonJ1 = this.add.rectangle(320, 470, 350, 200, COULEUR_J1)
            .setStrokeStyle(6, COULEURS.DORE)
            .setInteractive({ useHandCursor: true });

        this.texteBoutonJ1 = this.add.text(320, 470, "JOUEUR 1\nCLIQUE !", style(TAILLE.GRAND)).setOrigin(0.5);

        // --- JOUEUR 2 (à droite) ---
        this.add.text(960, 195, "JOUEUR 2",
            style(TAILLE.NORMAL, css(COULEURS.CREME), css(COULEUR_J2))).setOrigin(0.5);

        this.texteClicsJ2 = this.add.text(960, 240, "0 clic", style(TAILLE.GRAND)).setOrigin(0.5);

        this.masquesJ2 = creerVies(this, 960, 295, this.viesJ2);

        this.boutonJ2 = this.add.rectangle(960, 470, 350, 200, COULEUR_J2)
            .setStrokeStyle(6, COULEURS.DORE)
            .setInteractive({ useHandCursor: true });

        this.texteBoutonJ2 = this.add.text(960, 470, "JOUEUR 2\nCLIQUE !", style(TAILLE.GRAND)).setOrigin(0.5);

        // --- LA CORDE (en bas de l'écran) ---
        this.creerCorde();

        // Touches : chaque joueur utilise ses 6 boutons (A à F)
        this.touchesJ1 = creerTouches(this, BORNE.j1.boutons);
        this.touchesJ2 = creerTouches(this, BORNE.j2.boutons);

        // --- Clic du joueur 1 (le Maestro s'incline à gauche, harpe à gauche) ---
        this.actionJ1 = (pointer) => {

            if (this.etat !== "jeu") return;

            this.clicsJ1++;
            this.texteClicsJ1.setText(this.clicsJ1 + " clics");

            this.effetsClic([this.boutonJ1, this.texteBoutonJ1], pointer, -1);

            // La note change à chaque clic : on monte la gamme, puis on recommence
            jouerHarpe(this, this.clicsJ1 % 5, { volume: 0.45, pan: -0.6 });

            this.apresClicDuo();
        };

        this.boutonJ1.on("pointerdown", (pointer) => this.actionJ1(pointer));

        // --- Clic du joueur 2 (le Maestro s'incline à droite, harpe à droite, plus aiguë) ---
        this.actionJ2 = (pointer) => {

            if (this.etat !== "jeu") return;

            this.clicsJ2++;
            this.texteClicsJ2.setText(this.clicsJ2 + " clics");

            this.effetsClic([this.boutonJ2, this.texteBoutonJ2], pointer, 1);

            // 700 centièmes de demi-ton = une quinte au-dessus du joueur 1
            jouerHarpe(this, this.clicsJ2 % 5, { volume: 0.45, pan: 0.6, decalage: 700 });

            this.apresClicDuo();
        };

        this.boutonJ2.on("pointerdown", (pointer) => this.actionJ2(pointer));
    }

    // Dessine la corde, ses repères, le nœud doré et les deux masques.
    creerCorde() {

        const y = 655;

        this.add.rectangle(640, y, 900, 16, COULEURS.DORE);               // la corde
        this.add.rectangle(190, y, 16, 46, COULEUR_J1);                   // repère J1
        this.add.rectangle(640, y, 4, 30, COULEURS.CREME);                // centre
        this.add.rectangle(1090, y, 16, 46, COULEUR_J2);                  // repère J2

        // Le nœud : il va vers le joueur qui domine
        this.noeudCorde = this.add.circle(640, y, 20, COULEURS.CREME)
            .setStrokeStyle(5, COULEURS.DORE)
            .setDepth(5);

        // Les deux masques aux extrémités
        this.masqueCordeJ1 = this.add.image(120, y, "masque_content");
        this.masqueCordeJ2 = this.add.image(1160, y, "masque_content");
        hauteurFixe(this.masqueCordeJ1, 70);
        hauteurFixe(this.masqueCordeJ2, 70);
    }

    // Déplace le nœud et change les masques selon qui domine.
    majCorde() {

        // Écart de clics : positif = J1 domine, négatif = J2 domine
        const ecart = this.clicsJ1 - this.clicsJ2;

        // On le transforme en nombre entre -1 et 1, puis en position sur la corde
        const ratio = Phaser.Math.Clamp(ecart / LIMITE_CORDE, -1, 1);
        this.noeudCorde.x = 640 - ratio * 450;   // J1 tire vers la gauche

        // Le masque qui est content va au joueur qui domine (les deux contents si égalité)
        this.masqueCordeJ1.setTexture(ecart >= 0 ? "masque_content" : "masque_triste");
        this.masqueCordeJ2.setTexture(ecart <= 0 ? "masque_content" : "masque_triste");
        hauteurFixe(this.masqueCordeJ1, 70);
        hauteurFixe(this.masqueCordeJ2, 70);
    }

    // Après chaque clic en duo : on met la corde à jour, et si l'écart est
    // assez grand la manche s'arrête tout de suite.
    apresClicDuo() {

        this.majCorde();

        if (Math.abs(this.clicsJ1 - this.clicsJ2) >= LIMITE_CORDE) {
            this.finDeManche();
        }
    }


    // ==============================
    // FIN DE MANCHE
    // ==============================

    // Ce qui est commun à toutes les fins : on arrête le temps.
    arreterManche() {

        this.etat = "fin";

        if (this.timer) {
            this.timer.remove();
        }
    }

    // SOLO : jauge pleine = victoire
    reussiteSolo() {

        if (this.etat !== "jeu") return;

        this.arreterManche();

        // Points : 100 pour la réussite + un bonus par seconde restante
        const points = POINTS_REUSSITE + this.tempsRestant * POINTS_PAR_SECONDE_RESTANTE;

        enregistrerScore(this, "clicker", points, 0);

        afficherResultat(this, "BRAVO !", "Fortissimo atteint !  +" + points + " pts", undefined, true);

        jouerSon(this, "harpe_glissando", { volume: 0.7 });

        // Le Maestro saute de joie
        this.tweens.killTweensOf(this.maestro);
        this.maestro.setScale(this.echelleMaestro).setAngle(0);
        this.tweens.add({
            targets: this.maestro,
            y: this.maestro.y - 40,
            duration: 200,
            yoyo: true,
            repeat: 2
        });

        attendreContinuer(this, () => this.passerAuSuivant());
    }

    // Temps écoulé (solo ou duo) ou victoire à la corde (duo)
    finDeManche() {

        if (this.etat !== "jeu") return;

        this.arreterManche();

        if (this.nombreJoueurs === 1) {

            // Jauge pas pleine : une vie perdue, mais on garde les points du niveau atteint
            const points = Math.round(this.niveauJauge);

            enregistrerScore(this, "clicker", points, 0);

            this.viesJ1 = retirerVie(this, this.masquesJ1, this.viesJ1);

            afficherResultat(this, "Temps écoulé !", "Vie perdue !  +" + points + " pts", css(COULEURS.ROUGE_CLAIR));

            jouerSon(this, "harpe_grave", { volume: 0.7 });
            this.cameras.main.shake(200, 0.006);

        } else {

            // En duo, chaque joueur marque autant de points que de clics
            enregistrerScore(this, "clicker", this.clicsJ1, this.clicsJ2);

            if (this.clicsJ1 > this.clicsJ2) {

                this.viesJ2 = retirerVie(this, this.masquesJ2, this.viesJ2);
                afficherResultat(this, "JOUEUR 1 GAGNE !", "Le joueur 2 perd une vie !", css(COULEURS.ROUGE_CLAIR), true);
                jouerSon(this, "harpe_glissando", { volume: 0.7 });

            } else if (this.clicsJ2 > this.clicsJ1) {

                this.viesJ1 = retirerVie(this, this.masquesJ1, this.viesJ1);
                afficherResultat(this, "JOUEUR 2 GAGNE !", "Le joueur 1 perd une vie !", css(COULEURS.ROUGE_CLAIR), true);
                jouerSon(this, "harpe_glissando", { volume: 0.7 });

            } else {

                afficherResultat(this, "ÉGALITÉ !", this.clicsJ1 + " clics   -   " + this.clicsJ2 + " clics");
            }
        }

        attendreContinuer(this, () => this.passerAuSuivant());
    }


    // ==============================
    // UPDATE (environ 60 fois par seconde)
    // ==============================

    // "delta" = temps écoulé depuis la dernière image, en millisecondes.
    update(time, delta) {

        // On lit TOUJOURS les touches (même si on n'en fait rien) pour "consommer" les appuis :
        // sinon un appui fait pendant la consigne serait compté plus tard.
        const appuiJ1 = uneTouchePressee(this.touchesJ1);
        const appuiJ2 = uneTouchePressee(this.touchesJ2);

        if (this.etat !== "jeu") return;

        // Un appui clavier = un clic au centre du bouton.
        if (appuiJ1) this.actionJ1({ x: this.boutonJ1.x, y: this.boutonJ1.y });
        if (appuiJ2) this.actionJ2({ x: this.boutonJ2.x, y: this.boutonJ2.y });

        // Solo : la jauge du crescendo redescend toute seule.
        // On multiplie par delta pour que la vitesse de descente soit la même
        // quel que soit le nombre d'images par seconde de l'ordinateur.
        if (this.nombreJoueurs === 1 && this.etat === "jeu") {

            this.niveauJauge = Math.max(0, this.niveauJauge - PERTE_PAR_SECONDE * delta / 1000);

            this.majJauge();
        }
    }
}