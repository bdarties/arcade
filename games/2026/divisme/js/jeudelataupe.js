import {
    COULEURS,
    COULEUR_J1,
    COULEUR_J2,
    BORNE,
    VIES_MAX,
    TAILLE,
    POINTS,
    MINIJEUX,
    css,
    style,
    creerEnTete,
    creerTexteTemps,
    majTemps,
    creerVies,
    retirerVie,
    afficherResultat,
    texteFlottant,
    explosion,
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

// Scène lancée après ce mini-jeu (c'est le dernier : l'écran de résultat final).
// Si elle n'est pas déclarée dans le jeu, on retourne au menu.
const SCENE_SUIVANTE = "resultat";

// Durée de la manche, en secondes
const DUREE_MANCHE = 20;

// SOLO : nombre de points à atteindre pour que le mini-jeu compte comme RÉUSSI
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
    j1_boutons:  [BORNE.j1.boutons[0], BORNE.j1.boutons[1], BORNE.j1.boutons[2]],   // boutons A B C
    j2_joystick: [BORNE.j2.gauche, BORNE.j2.bas, BORNE.j2.droite],
    j2_boutons:  [BORNE.j2.boutons[0], BORNE.j2.boutons[1], BORNE.j2.boutons[2]]    // boutons A B C
};

// Ce que le joueur lit sous chaque trappe (sur la borne, les boutons s'appellent A B C)
const ETIQUETTES = ["← / A", "↓ / B", "→ / C"];


// ==============================
// SCÈNE JEU DE LA TAUPE (version "bal des masques")
// ==============================
// "this.etat" : "attente" (consigne, compte à rebours) -> "jeu" -> "fin" (résultat affiché)
// -> "sortie" (le rideau se ferme)

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

        // Sons de fin de manche (déjà chargés par le clicker : pas rechargés une 2e fois)
        this.load.audio("harpe_glissando", "src/audio/harpe_glissando.wav");
        this.load.audio("harpe_grave", "src/audio/harpe_grave.wav");
    }


    // ==============================
    // CREATE
    // ==============================

    create() {

        // Lecture du mode choisi dans histoire.js (1 par défaut si rien n'a été choisi)
        const mode = FORCER_MODE || this.registry.get("joueurs") || 1;
        this.nbJoueurs = mode === 2 ? 2 : 1;

        // Tout repart de zéro à chaque partie
        this.etat = "attente";
        this.tempsRestant = DUREE_MANCHE;
        this.timer = null;
        this.viesJ1 = VIES_MAX;
        this.viesJ2 = VIES_MAX;

        // Transition : le rideau s'ouvre
        ouvrirRideau(this, 800);


        // ==============================
        // FOND ET AMBIANCE (comme dans le clicker)
        // ==============================

        if (this.textures.exists("taupe_bg")) {
            this.add.image(640, 360, "taupe_bg").setDepth(-10);
        } else {
            this.cameras.main.setBackgroundColor(COULEURS.NUIT);
        }

        lancerAmbiance(this);


        // ==============================
        // EN-TÊTE (titre, consigne, temps) : identique dans tous les mini-jeux
        // ==============================

        creerEnTete(this, MINIJEUX.taupe.nom, "Frappe les masques joyeux, évite les tristes !");

        this.texteTemps = creerTexteTemps(this, this.tempsRestant);


        // ==============================
        // MODE 1 JOUEUR / 2 JOUEURS
        // ==============================

        if (this.nbJoueurs === 1) {
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

        if (this.nbJoueurs === 1) {
            lignes = [
                "Des masques sortent des trappes. Frappe la trappe où un masque apparaît.",
                "Joystick (gauche, bas, droite) ou boutons A, B, C : une touche par trappe.",
                "Masque joyeux : +1. Masque triste : -1. Atteins " + OBJECTIF_SOLO + " points pour gagner !"
            ];
        } else {
            lignes = [
                "Les mêmes masques sortent chez les deux joueurs. Frappe la bonne trappe le plus vite possible.",
                "Joystick (gauche, bas, droite) ou boutons A, B, C : une touche par trappe.",
                "Masque joyeux : +1. Masque triste : -1. Le meilleur score gagne !"
            ];
        }

        afficherConsigne(this, MINIJEUX.taupe.nom, lignes, () => {
            compteARebours(this, () => this.demarrerManche());
        });
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
            [TOUCHES.j1_joystick, TOUCHES.j1_boutons, TOUCHES.j2_joystick, TOUCHES.j2_boutons]
        );

        this.plateaux = [plateau];

        // Score
        plateau.texteScore = this.add.text(640, 205, this.libelleScore(plateau), style(TAILLE.GRAND)).setOrigin(0.5);

        // Vies (masques)
        this.masquesJ1 = creerVies(this, 640, 270, this.viesJ1);
    }


    // ==============================
    // DUO : une rangée de trappes par joueur
    // ==============================

    creerDuo() {

        const plateau1 = this.creerPlateau(0, 320, 180, 150, 160, COULEUR_J1,
            [TOUCHES.j1_joystick, TOUCHES.j1_boutons]);
        const plateau2 = this.creerPlateau(1, 960, 180, 150, 160, COULEUR_J2,
            [TOUCHES.j2_joystick, TOUCHES.j2_boutons]);

        this.plateaux = [plateau1, plateau2];

        // Étiquettes et scores : texte clair cerclé de la couleur du joueur
        [
            { x: 320, nom: "JOUEUR 1", plateau: plateau1, couleur: COULEUR_J1 },
            { x: 960, nom: "JOUEUR 2", plateau: plateau2, couleur: COULEUR_J2 }
        ].forEach(infos => {

            this.add.text(infos.x, 195, infos.nom,
                style(TAILLE.NORMAL, css(COULEURS.CREME), css(infos.couleur))).setOrigin(0.5);

            infos.plateau.texteScore = this.add.text(
                infos.x, 250, this.libelleScore(infos.plateau),
                style(TAILLE.GRAND, css(COULEURS.CREME), css(infos.couleur))
            ).setOrigin(0.5);
        });

        // Vies (masques)
        this.masquesJ1 = creerVies(this, 320, 310, this.viesJ1);
        this.masquesJ2 = creerVies(this, 960, 310, this.viesJ2);
    }


    // ==============================
    // CRÉATION D'UNE RANGÉE DE TRAPPES POUR UN JOUEUR
    // ==============================

    creerPlateau(id, xCentre, ecart, largeurTrou, tailleMasque, couleur, jeuxTouches) {

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
            const ellipse = this.add.ellipse(x, y, largeurTrou, 52, COULEURS.NUIT, 0.85)
                .setStrokeStyle(6, couleur);

            // Ce que le joueur doit appuyer pour cette trappe
            this.add.text(x, y + 50, ETIQUETTES[i], style(TAILLE.PETIT)).setOrigin(0.5);

            plateau.trous.push({
                x: x,
                y: y,
                ellipse: ellipse,
                masque: null,        // le masque actuellement sorti (null = trappe libre)
                triste: false,
                minuteur: null       // programme la rentrée automatique du masque
            });

            // Les touches de cette trappe (une ou deux, selon le mode)
            plateau.touches.push(creerTouches(this, jeuxTouches.map(jeu => jeu[i])));
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

        majTemps(this, this.texteTemps, this.tempsRestant);

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

            texteFlottant(this, x, y, "-1", COULEURS.ROUGE_CLAIR);
            this.cameras.main.shake(150, 0.006);

        } else {

            // Masque joyeux : point
            plateau.score++;

            texteFlottant(this, x, y, "+1", plateau.couleur);
            explosion(this, x, y, 8, 130, 8);
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
        // SOLO : objectif atteint (réussi) ou une vie perdue (raté)
        // ==============================

        if (this.nbJoueurs === 1) {

            const score = this.plateaux[0].score;
            const points = score * POINTS.PAR_MASQUE;
            const reussi = score >= OBJECTIF_SOLO;

            // Les points s'ajoutent au score total, et "reussi" compte pour la victoire finale
            enregistrerScore(this, "taupe", points, 0, reussi);

            if (reussi) {

                afficherResultat(this, "BRAVO !", score + " points : objectif atteint !  +" + points + " pts", undefined, true);
                jouerSon(this, "harpe_glissando", { volume: 0.7 });

            } else {

                this.viesJ1 = retirerVie(this, this.masquesJ1, this.viesJ1);

                afficherResultat(this, "Temps écoulé !", "Vie perdue !  " + score + " / " + OBJECTIF_SOLO + "  +" + points + " pts", css(COULEURS.ROUGE_CLAIR));

                jouerSon(this, "harpe_grave", { volume: 0.7 });
                this.cameras.main.shake(200, 0.006);
            }
        }


        // ==============================
        // DUO : le meilleur score gagne, l'autre perd une vie
        // ==============================

        else {

            const score1 = this.plateaux[0].score;
            const score2 = this.plateaux[1].score;

            enregistrerScore(this, "taupe", score1 * POINTS.PAR_MASQUE, score2 * POINTS.PAR_MASQUE);

            if (score1 > score2) {

                this.viesJ2 = retirerVie(this, this.masquesJ2, this.viesJ2);
                afficherResultat(this, "JOUEUR 1 GAGNE !", "Le joueur 2 perd une vie !", css(COULEURS.ROUGE_CLAIR), true);
                jouerSon(this, "harpe_glissando", { volume: 0.7 });

            } else if (score2 > score1) {

                this.viesJ1 = retirerVie(this, this.masquesJ1, this.viesJ1);
                afficherResultat(this, "JOUEUR 2 GAGNE !", "Le joueur 1 perd une vie !", css(COULEURS.ROUGE_CLAIR), true);
                jouerSon(this, "harpe_glissando", { volume: 0.7 });

            } else {

                afficherResultat(this, "ÉGALITÉ !", score1 + " points   -   " + score2 + " points");
            }
        }

        attendreContinuer(this, () => this.passerAuSuivant());
    }


    // Fermeture du rideau, puis passage à la scène suivante (le résultat final).
    passerAuSuivant() {

        // Garde-fou : touche ET clic sur la même frame ne lancent qu'une seule transition
        if (this.etat === "sortie") return;

        this.etat = "sortie";

        // Si la scène "resultat" n'est pas déclarée dans le jeu, on retourne au menu
        const cible = this.scene.get(SCENE_SUIVANTE) ? SCENE_SUIVANTE : "menu";

        fermerRideau(this, 800, () => this.scene.start(cible));
    }


    // ==============================
    // UPDATE (environ 60 fois par seconde) : lecture du clavier
    // ==============================

    update() {

        // On lit les touches TOUJOURS (même hors partie), sinon un appui fait
        // pendant la consigne serait compté plus tard. toucher() ignore ce qui
        // n'est pas pendant la partie.
        this.plateaux.forEach(plateau => {

            plateau.touches.forEach((touchesDeLaTrappe, index) => {

                if (uneTouchePressee(touchesDeLaTrappe)) {
                    this.toucher(plateau, index);
                }
            });
        });
    }
}