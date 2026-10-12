// classement.js : l'écran de fin de partie. Il montre le temps de la partie, demande le nom du joueur (3 lettres, au joystick)
// si le temps entre dans le top 10 de la borne, envoie le score à l'API de la borne, puis affiche le classement.
//
// Utilisation : this.scene.start("classement", { tempsBrutMs, points, tempsNetMs }) à la fin de la partie.
//   tempsBrutMs : le chrono tel qu'il s'est arrêté (millisecondes)
//   points      : le score de la partie (chaque point retire du temps, voir tempsNet)
//   tempsNetMs  : le temps qui sert au classement (plus petit = meilleur)
//
// L'API de la borne classe du plus GRAND score au plus petit (voir app/db.py). Pour classer du plus RAPIDE au plus lent,
// on envoie donc "SCORE_BASE - temps net" : plus le temps est court, plus ce nombre est grand. On refait le calcul à l'envers
// pour afficher.
export const SCORE_BASE = 10000000; // 10 millions de ms = presque 3 h : aucun temps réel ne peut le dépasser

const LETTRES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NB_LETTRES = 3; // le nom fait 3 lettres, comme sur une vraie borne
const TOUCHES_VALIDER = ["KeyI", "Enter", "Space"]; // I = le bouton de saut de la borne
const DELAI_AVANT_VALIDER = 1500; // ms : le joueur tient encore ses boutons de jeu, on ignore les appuis au début
const POLICE = "monospace";
const COULEUR_CLAIRE = "#e7e0e9";
const COULEUR_ATTENUEE = "#8a779b";
const COULEUR_ACCENT = "#f4b6c2"; // le rose pâle du projet

export function formaterTemps(ms) { // 83450 -> "01:23.45" (minutes:secondes.centièmes)
    const total = Math.max(0, Math.floor(ms / 10)); // en centièmes de seconde
    const centiemes = total % 100;
    const secondes = Math.floor(total / 100) % 60;
    const minutes = Math.floor(total / 6000);
    const deux = (n) => String(n).padStart(2, "0");
    return deux(minutes) + ":" + deux(secondes) + "." + deux(centiemes);
}

export function tempsVersScore(tempsNetMs) { return SCORE_BASE - Math.round(tempsNetMs); } // ce qu'on envoie à l'API (entier)
export function scoreVersTemps(score) { return SCORE_BASE - score; } // ce qu'on affiche

// le module de score de la borne n'existe que quand le jeu tourne dans la borne : on le charge au moment d'en avoir besoin,
// et s'il manque (jeu ouvert à part, pendant les tests) on continue sans classement au lieu de planter
async function chargerApi() {
    try { return await import("/static/js/score.js"); } catch (erreur) { console.warn("API de score indisponible :", erreur); return null; }
}

export default class classement extends Phaser.Scene {
    constructor() { super({ key: "classement" }); }

    init(donnees) { // reçoit les données passées par scene.start
        this.tempsBrutMs = donnees.tempsBrutMs ?? 0;
        this.points = donnees.points ?? 0;
        this.tempsNetMs = donnees.tempsNetMs ?? this.tempsBrutMs;
    }

    create() {
        this.cameras.main.setBackgroundColor("#0e0e11");
        this.cameras.main.fadeIn(400, 0, 0, 0);
        this.pret = false; // devient vrai après DELAI_AVANT_VALIDER
        this.etape = "chargement"; // chargement -> saisie (nouveau record) -> envoi -> classement
        this.nom = Array(NB_LETTRES).fill("A");
        this.curseur = 0;
        this.api = null;
        this.tableau = [];
        this.groupeTableau = this.add.group();

        const t = (x, y, texte, taille, couleur) => this.add.text(x, y, texte, { fontFamily: POLICE, fontSize: taille + "px", color: couleur, stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5);
        t(640, 50, "FIN DE PARTIE", 40, COULEUR_CLAIRE);
        t(640, 115, "TEMPS  " + formaterTemps(this.tempsBrutMs), 24, COULEUR_ATTENUEE);
        t(640, 148, "POINTS " + this.points + "  =  -" + formaterTemps(this.tempsBrutMs - this.tempsNetMs), 24, COULEUR_ATTENUEE);
        t(640, 205, "TEMPS FINAL  " + formaterTemps(this.tempsNetMs), 40, COULEUR_ACCENT);
        this.consigne = t(640, 270, "CHARGEMENT DU CLASSEMENT...", 22, COULEUR_ATTENUEE).setAlign("center");
        this.textesLettres = Array.from({ length: NB_LETTRES }, (_, i) => t(580 + i * 60, 340, "A", 56, COULEUR_ATTENUEE).setVisible(false));

        // des écouteurs d'événements plutôt que JustDown dans update : un appui très court (joystick de la borne, 30 images par seconde)
        // peut commencer et finir entre deux images, et JustDown le rate ; un écouteur reçoit tous les appuis
        this.input.keyboard.on("keydown", (evenement) => this.touche(evenement.code));
        this.time.delayedCall(DELAI_AVANT_VALIDER, () => { this.pret = true; });
        this.charger();
    }

    async charger() { // va chercher le top 10 et décide si le joueur y entre
        this.api = await chargerApi();
        if (this.api) this.tableau = await this.api.get_tab_score(this.sys.game.config.idGame);
        const score = tempsVersScore(this.tempsNetMs);
        const dernier = this.tableau[this.tableau.length - 1];
        const nouveauRecord = Boolean(this.api) && (this.tableau.length < 10 || score > dernier.score); // à égalité on ne passe pas devant
        if (nouveauRecord) {
            this.etape = "saisie";
            this.consigne.setText("NOUVEAU RECORD !\nHAUT/BAS : lettre   GAUCHE/DROITE : position   I : valider").setColor(COULEUR_CLAIRE);
            this.textesLettres.forEach((texte) => texte.setVisible(true));
            this.afficherNom();
        } else {
            this.etape = "classement";
            this.consigne.setText(this.api ? "PAS DANS LE TOP 10" : "CLASSEMENT INDISPONIBLE").setColor(COULEUR_ATTENUEE);
            this.afficherTableau();
        }
    }

    afficherNom() { // la lettre sélectionnée est en rose, les autres en gris
        this.textesLettres.forEach((texte, i) => texte.setText(this.nom[i]).setColor(i === this.curseur ? COULEUR_ACCENT : COULEUR_ATTENUEE));
    }

    touche(code) { // appelée à chaque touche pressée
        const valider = TOUCHES_VALIDER.includes(code);
        if (this.etape === "saisie") {
            if (code === "ArrowUp" || code === "ArrowDown") {
                const decalage = code === "ArrowUp" ? 1 : -1;
                const index = (LETTRES.indexOf(this.nom[this.curseur]) + decalage + LETTRES.length) % LETTRES.length; // % : on boucle de Z à A
                this.nom[this.curseur] = LETTRES[index];
            } else if (code === "ArrowLeft") {
                this.curseur = Math.max(0, this.curseur - 1);
            } else if (code === "ArrowRight") {
                this.curseur = Math.min(NB_LETTRES - 1, this.curseur + 1);
            } else if (valider && this.pret) {
                this.envoyer();
                return;
            }
            this.afficherNom();
        } else if (this.etape === "classement" && valider && this.pret) {
            this.scene.start("menu"); // retour à l'accueil, pour la partie suivante
        }
    }

    async envoyer() {
        this.etape = "envoi"; // bloque les appuis pendant l'envoi
        this.consigne.setText("ENVOI...").setColor(COULEUR_ATTENUEE);
        this.textesLettres.forEach((texte) => texte.setVisible(false));
        const nom = this.nom.join("");
        const resultat = await this.api.ajoute_score(this.sys.game.config.idGame, nom, tempsVersScore(this.tempsNetMs));
        this.tableau = await this.api.get_tab_score(this.sys.game.config.idGame); // le tableau à jour, avec le nouveau temps
        this.nomJoueur = resultat.success ? nom : null; // pour surligner sa ligne
        this.consigne.setText(resultat.success ? "ENREGISTRÉ" : "ERREUR D'ENVOI").setColor(resultat.success ? COULEUR_ACCENT : "#ff6b6b");
        this.etape = "classement";
        this.pret = false;
        this.time.delayedCall(DELAI_AVANT_VALIDER, () => { this.pret = true; });
        this.afficherTableau();
    }

    afficherTableau() { // le top 10, une ligne par joueur : rang, nom, temps
        this.groupeTableau.clear(true, true);
        const debutY = 340;
        this.tableau.forEach((ligne, i) => {
            const estLui = this.nomJoueur === ligne.player && tempsVersScore(this.tempsNetMs) === ligne.score;
            const texte = String(i + 1).padStart(2, " ") + ".  " + String(ligne.player).padEnd(NB_LETTRES, " ") + "   " + formaterTemps(scoreVersTemps(ligne.score));
            this.groupeTableau.add(this.add.text(640, debutY + i * 30, texte, { fontFamily: POLICE, fontSize: "24px", color: estLui ? COULEUR_ACCENT : COULEUR_CLAIRE, stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5));
        });
        this.groupeTableau.add(this.add.text(640, 680, "APPUIE SUR I POUR REJOUER", { fontFamily: POLICE, fontSize: "20px", color: COULEUR_ATTENUEE }).setOrigin(0.5));
    }
}
