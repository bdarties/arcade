import {
    COULEURS,
    COULEUR_J1,
    COULEUR_J2,
    TAILLE,
    MINIJEUX,
    REUSSITES_POUR_GAGNER,
    css,
    style,
    creerEnTete,
    lancerAmbiance,
    explosion,
    jouerSon,
    ouvrirRideau,
    fermerRideau,
    attendreContinuer,
    lireScores,
    lireReussites,
    totalJoueur,
    nombreReussites
} from "./fonctions.js";

// ==============================
// SCÈNE RÉSULTAT FINAL
// ==============================
// Lancée après le dernier mini-jeu. Elle ne calcule rien elle-même : elle LIT ce que
// les mini-jeux ont rangé dans le registry (enregistrerScore) et l'affiche.
//
//   SOLO : victoire si au moins REUSSITES_POUR_GAGNER mini-jeux sur 3 sont réussis,
//          sinon game over. Dans les deux cas, le score total est affiché.
//   DUO  : le joueur qui a le plus de points au total gagne. Les deux totaux sont affichés.

export default class resultat extends Phaser.Scene {

    constructor() {
        super({ key: "resultat" });
    }

    preload() {

        // Dossier de base des fichiers (réglé dans la config du jeu)
        const baseURL = this.sys.game.config.baseURL;
        this.load.setBaseURL(baseURL);

        // Les trois fonds de l'écran final
        this.load.image("screen_game_over", "src/bg/screen_game_over.png");   // solo : perdu
        this.load.image("victoire_un", "src/bg/victoire_un.png");             // duo : le joueur 1 gagne
        this.load.image("victoire_deux", "src/bg/victoire_deux.png");         // duo : le joueur 2 gagne
    }

    create() {

        const nombreJoueurs = this.registry.get("joueurs") || 1;

        this.sortie = false;   // empêche de lancer deux fois la transition

        // Pas d'image de fond pour cet écran : un fond uni de la couleur "nuit"
        this.cameras.main.setBackgroundColor(COULEURS.NUIT);

        ouvrirRideau(this, 800);
        lancerAmbiance(this);

        if (nombreJoueurs === 1) {
            this.afficherSolo();
        } else {
            this.afficherDuo();
        }

        // Le message "Appuie sur un bouton pour continuer" est placé tout en bas (y = 650)
        attendreContinuer(this, () => this.retourMenu(), 650);
    }


    // ==============================
    // SOLO
    // ==============================

    afficherSolo() {

        const scores = lireScores(this);
        const reussites = lireReussites(this);
        const cles = Object.keys(MINIJEUX);

        const nbReussites = nombreReussites(this);
        const gagne = nbReussites >= REUSSITES_POUR_GAGNER;

        // Perdu : on affiche le fond "game over"
        if (!gagne) this.poserFond("screen_game_over");

        creerEnTete(
            this,
            "Fin du spectacle",
            "Mini-jeux réussis : " + nbReussites + " sur " + cles.length +
            "  (il en faut " + REUSSITES_POUR_GAGNER + ")"
        );

        // Grand titre : victoire ou game over
        const titre = this.add.text(
            640, 235,
            gagne ? "VICTOIRE !" : "GAME OVER",
            style(TAILLE.ENORME, css(gagne ? COULEURS.DORE : COULEURS.ROUGE_CLAIR))
        ).setOrigin(0.5);

        this.tweens.add({ targets: titre, scale: { from: 0.5, to: 1 }, duration: 500, ease: "Back.easeOut" });

        // Une ligne par mini-jeu : nom, réussi ou raté, points gagnés
        cles.forEach((cle, i) => {

            const y = 320 + i * 55;
            const reussi = reussites[cle];
            const points = (scores[cle] || [0, 0])[0];

            this.add.text(300, y, MINIJEUX[cle].nom, style(TAILLE.NORMAL)).setOrigin(0, 0.5);

            this.add.text(
                760, y,
                reussi ? "RÉUSSI" : "RATÉ",
                style(TAILLE.NORMAL, css(reussi ? COULEURS.TURQUOISE_CLAIR : COULEURS.ROUGE_CLAIR))
            ).setOrigin(0.5);

            this.add.text(980, y, points + " pts", style(TAILLE.NORMAL)).setOrigin(1, 0.5);
        });

        // Score final : la somme des points de tous les mini-jeux
        this.add.text(
            640, 530,
            "SCORE FINAL : " + totalJoueur(this, 0) + " pts",
            style(TAILLE.GRAND, css(COULEURS.DORE))
        ).setOrigin(0.5);

        this.annoncer(gagne);
    }


    // ==============================
    // DUO
    // ==============================

    afficherDuo() {

        const scores = lireScores(this);
        const cles = Object.keys(MINIJEUX);

        const total1 = totalJoueur(this, 0);
        const total2 = totalJoueur(this, 1);

        let nomGagnant = "ÉGALITÉ !";
        if (total1 > total2) nomGagnant = "JOUEUR 1 GAGNE !";
        if (total2 > total1) nomGagnant = "JOUEUR 2 GAGNE !";

        const egalite = total1 === total2;

        // Le fond dépend du gagnant (en cas d'égalité : fond uni)
        if (total1 > total2) this.poserFond("victoire_un");
        if (total2 > total1) this.poserFond("victoire_deux");

        creerEnTete(this, "Fin du spectacle", "Les points de chaque mini-jeu sont additionnés");

        // Grand titre : le gagnant
        const titre = this.add.text(640, 235, nomGagnant, style(TAILLE.ENORME, css(COULEURS.DORE))).setOrigin(0.5);

        this.tweens.add({ targets: titre, scale: { from: 0.5, to: 1 }, duration: 500, ease: "Back.easeOut" });

        // Deux colonnes, une par joueur (texte clair cerclé de la couleur du joueur)
        this.add.text(800, 300, "JOUEUR 1",
            style(TAILLE.NORMAL, css(COULEURS.CREME), css(COULEUR_J1))).setOrigin(0.5);

        this.add.text(1000, 300, "JOUEUR 2",
            style(TAILLE.NORMAL, css(COULEURS.CREME), css(COULEUR_J2))).setOrigin(0.5);

        // Une ligne par mini-jeu
        cles.forEach((cle, i) => {

            const y = 355 + i * 50;
            const points = scores[cle] || [0, 0];

            this.add.text(300, y, MINIJEUX[cle].nom, style(TAILLE.NORMAL)).setOrigin(0, 0.5);
            this.add.text(800, y, String(points[0]), style(TAILLE.NORMAL)).setOrigin(0.5);
            this.add.text(1000, y, String(points[1]), style(TAILLE.NORMAL)).setOrigin(0.5);
        });

        // Ligne des totaux : celui du gagnant est en doré
        const couleurTotal1 = css(total1 >= total2 && !egalite ? COULEURS.DORE : COULEURS.CREME);
        const couleurTotal2 = css(total2 >= total1 && !egalite ? COULEURS.DORE : COULEURS.CREME);

        this.add.text(300, 530, "SCORE FINAL", style(TAILLE.GRAND, css(COULEURS.DORE))).setOrigin(0, 0.5);
        this.add.text(800, 530, String(total1), style(TAILLE.GRAND, couleurTotal1)).setOrigin(0.5);
        this.add.text(1000, 530, String(total2), style(TAILLE.GRAND, couleurTotal2)).setOrigin(0.5);

        // Il y a toujours quelque chose à fêter, sauf en cas d'égalité
        this.annoncer(!egalite);
    }


    // Pose une image de fond (derrière tout le reste : depth -10).
    // Si l'image n'a pas pu être chargée, on ne fait rien : le fond uni reste en place
    // (sinon Phaser afficherait un carré vert "image manquante").
    poserFond(cle) {

        if (this.textures.exists(cle)) {
            this.add.image(640, 360, cle).setDepth(-10);
        }
    }


    // Son + effet : fête si c'est une victoire, secousse sinon
    annoncer(victoire) {

        this.time.delayedCall(700, () => {

            if (victoire) {
                jouerSon(this, "harpe_glissando", { volume: 0.7 });
                explosion(this, 640, 235, 40, 300, 9);
            } else {
                jouerSon(this, "harpe_grave", { volume: 0.7 });
                this.cameras.main.shake(200, 0.006);
            }
        });
    }


    // ==============================
    // SORTIE
    // ==============================

    // Fermeture du rideau, puis retour au menu.
    retourMenu() {

        if (this.sortie) return;
        this.sortie = true;

        fermerRideau(this, 800, () => this.scene.start("menu"));
    }
}