// pause.js : le menu pause, avec les réglages (musique, bruitages, luminosité) et les crédits
// C'est une scène posée PAR-DESSUS le niveau : le niveau est mis en pause (plus de mouvement, d'ennemis ni de chrono) mais reste affiché
// derrière, ce qui permet de voir la luminosité changer en direct. On l'ouvre avec Échap ou X (le bouton start de la borne) :
// voir preparerPause, appelée dans le create du niveau.
import { reglages, changerReglage, VOLUME_MAX, LUMINOSITE_MAX } from "./reglages.js"; // les réglages du joueur
import { jouerSon, majVolumeMusique } from "./sons.js"; // bruitages et volume de la musique
import { appliquerLuminosite } from "./lumiere.js"; // change le gris du voile d'ombre

const TOUCHES_PAUSE = ["ESC", "X"]; // ouvrent la pause (et la ferment, voir TOUCHES_RETOUR)
const TOUCHES_VALIDER = ["ENTER", "SPACE", "I"]; // valident le choix
const TOUCHES_RETOUR = ["ESC", "X", "K", "O"]; // reviennent en arrière : de la page crédits au menu, du menu au jeu

// couleurs et police : celles du menu et du HUD
const POLICE = "monospace";
const TEXTE = "#e7e0e9"; // texte normal
const ATTENUE = "#8a779b"; // texte secondaire
const SELECTION = "#f4b6c2"; // le choix sélectionné
const CADRE = 0x5f4f6e; // bord du panneau
const FOND_PANNEAU = 0x15111a; // fond du panneau
const VIDE = 0x3a2f45; // case vide d'un curseur
const PLEIN = 0xe7e0e9; // case pleine d'un curseur

// les lignes de la page crédits : [titre, texte] ("" = pas de titre, la ligne continue la précédente)
const CREDITS = [
    ["JEU", "Thomas Siegel-Boissière, Paul Pouyadoux, Mathys Ribes"],
    ["", "SAÉ borne d'arcade, thème « ombre et lumière »"],
    ["GRAPHISMES", "Robot : pack Bot Wheel  /  Décor : Dawn of the Gods"],
    ["", "Ennemis : packs Huntress 2, Bringer of Death et Wizard"],
    ["BRUITAGES", "Kenney (Sci-fi, RPG Audio, Impact Sounds), rubberduck,"],
    ["", "jaggedstone  (licence CC0)"],
    ["MUSIQUE", "« Dark Shrine Loop » par qubodup et yd (niveau)"],
    ["", "« Boss Battle #8 Metal » par nene (boss), OpenGameArt, CC0"],
    ["MOTEUR", "Phaser 3.60"]
];

// Ouvre le menu pause quand on appuie sur Échap ou X. À appeler dans le create() d'un niveau.
export function preparerPause(niveau) {
    const toucheZ = niveau.input.keyboard.addKey("Z", false); // Z + X = reset (reset.js) : dans ce cas X n'ouvre pas la pause
    TOUCHES_PAUSE.forEach((touche) => niveau.input.keyboard.on("keydown-" + touche, (evenement) => {
        if (evenement.repeat) return; // touche maintenue : le navigateur répète l'appui, on ne rouvre pas la pause en boucle
        if (toucheZ.isDown) return; // Z est maintenu : c'est le combo de reset, pas une demande de pause
        if (niveau.mort || niveau.partieFinie) return; // le robot meurt ou la partie est finie : pas de pause
        if (niveau.scene.isPaused()) return; // déjà en pause
        niveau.scene.launch("pause", { origine: niveau.scene.key }); // ouvre le menu par-dessus le niveau
        niveau.scene.pause(); // et fige le niveau
    }));
}

// Pendant la pause, l'horloge du niveau (scene.time.now) saute en avant : elle suit le temps réel. Tous les délais du jeu (invincibilité,
// brûlure de la lumière, tirs des ennemis, attaques du boss) seraient alors terminés d'un coup à la reprise. On retranche donc la durée
// de la pause à l'horloge du niveau : pour lui, le temps ne s'est pas écoulé.
function rattraperHorloge(niveau, duree) {
    const horloge = niveau.time;
    if (horloge.decalagePause === undefined) { // première pause de ce niveau : on remplace la mise à jour de l'horloge, une seule fois
        const evenements = niveau.sys.events;
        const miseAJour = horloge.update; // la mise à jour d'origine de Phaser
        horloge.decalagePause = 0; // total des pauses déjà retranchées
        evenements.off(Phaser.Scenes.Events.UPDATE, horloge.update, horloge); // Phaser l'a branchée telle quelle : on la débranche...
        horloge.update = function (temps, delta) { return miseAJour.call(this, temps - this.decalagePause, delta); }; // ...pour mettre la nôtre, qui retranche le décalage...
        evenements.on(Phaser.Scenes.Events.UPDATE, horloge.update, horloge); // ...et on la rebranche
    }
    horloge.decalagePause += duree;
}

export default class pause extends Phaser.Scene {
    constructor() {
        super({ key: "pause" });
    }

    init(donnees) {
        this.origine = donnees.origine; // la clé du niveau mis en pause
    }

    create() {
        this.debutPause = this.game.loop.time; // pour mesurer la durée de la pause (voir rattraperHorloge)
        this.page = "menu"; // "menu" ou "credits"
        this.choix = 0; // la ligne sélectionnée du menu
        this.confirmerQuitter = false; // vrai après un premier appui sur « Menu principal »

        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.45).setOrigin(0.5); // le jeu reste visible, un peu assombri
        this.add.rectangle(640, 360, 760, 560, FOND_PANNEAU, 0.95).setStrokeStyle(3, CADRE);
        this.titre = this.add.text(640, 130, "PAUSE", { fontFamily: POLICE, fontSize: "44px", color: TEXTE }).setOrigin(0.5);
        this.aide = this.add.text(640, 604, "", { fontFamily: POLICE, fontSize: "15px", color: ATTENUE }).setOrigin(0.5);
        this.add.text(640, 624, "Recommencer la partie : maintenir Z + X pendant 1,5 s", { fontFamily: POLICE, fontSize: "13px", color: ATTENUE }).setOrigin(0.5);
        this.dessin = this.add.graphics(); // les cases des curseurs
        this.lignes = []; // les textes de la page affichée (détruits quand on change de page)

        const clavier = this.input.keyboard;
        const sur = (touches, action) => touches.forEach((touche) => clavier.on("keydown-" + touche, action));
        sur(["UP"], () => this.deplacer(-1));
        sur(["DOWN"], () => this.deplacer(1));
        sur(["LEFT"], () => this.regler(-1));
        sur(["RIGHT"], () => this.regler(1));
        sur(TOUCHES_VALIDER, (evenement) => { if (!evenement.repeat) this.valider(); });
        sur(TOUCHES_RETOUR, (evenement) => { if (!evenement.repeat) this.retour(); });

        this.afficherMenu();
    }

    // ---- les lignes du menu : { nom, type: "action" ou "curseur", ... } ----
    lignesMenu() {
        return [
            { nom: "REPRENDRE", type: "action", action: () => this.reprendre() },
            { nom: "MUSIQUE", type: "curseur", reglage: "musique", min: 0, max: VOLUME_MAX },
            { nom: "BRUITAGES", type: "curseur", reglage: "effets", min: 0, max: VOLUME_MAX },
            { nom: "LUMINOSITÉ", type: "curseur", reglage: "luminosite", min: 1, max: LUMINOSITE_MAX },
            { nom: "CRÉDITS", type: "action", action: () => this.afficherCredits() },
            { nom: this.confirmerQuitter ? "REAPPUIE POUR QUITTER" : "MENU PRINCIPAL", type: "action", action: () => this.quitter() }
        ];
    }

    vider() { // efface la page affichée
        this.lignes.forEach((objet) => objet.destroy());
        this.lignes = [];
        this.dessin.clear();
    }

    afficherMenu() {
        this.page = "menu";
        this.vider();
        this.titre.setText("PAUSE");
        this.aide.setText("HAUT/BAS : choisir   GAUCHE/DROITE : régler   I : valider   X : reprendre");
        this.lignesMenu().forEach((ligne, i) => {
            const y = 220 + i * 62; // une ligne tous les 62 px
            const choisie = i === this.choix;
            const texte = this.add.text(300, y, (choisie ? "> " : "  ") + ligne.nom, { fontFamily: POLICE, fontSize: "28px", color: choisie ? SELECTION : TEXTE }).setOrigin(0, 0.5);
            this.lignes.push(texte);
            if (ligne.type !== "curseur") return;
            const valeur = reglages[ligne.reglage];
            const volume = ligne.max === VOLUME_MAX; // les volumes ont 10 cases fines, la luminosité 7 cases larges
            const nbCases = volume ? VOLUME_MAX : LUMINOSITE_MAX;
            const largeur = volume ? 20 : 28; // largeur d'une case : les deux curseurs ont à peu près la même longueur
                        for (let c = 0; c < nbCases; c++) {
                this.dessin.fillStyle(c < valeur ? PLEIN : VIDE, 1);
                this.dessin.fillRect(600 + c * (largeur + 4), y - 11, largeur, 22);
            }
            const etiquette = volume ? (valeur === 0 ? "OFF" : valeur * 10 + "%") : valeur + "/" + LUMINOSITE_MAX; // 0 donne « OFF », sinon le pourcentage
            this.lignes.push(this.add.text(600 + nbCases * (largeur + 4) + 14, y, etiquette, { fontFamily: POLICE, fontSize: "20px", color: ATTENUE }).setOrigin(0, 0.5));
        });
    }

    afficherCredits() {
        this.page = "credits";
        this.vider();
        this.titre.setText("CRÉDITS");
        this.aide.setText("Appuie sur un bouton pour revenir");
        const jeu = this.add.text(640, 190, "DEICIDE", { fontFamily: POLICE, fontSize: "30px", color: SELECTION }).setOrigin(0.5);
        this.lignes.push(jeu);
        CREDITS.forEach(([titre, texte], i) => {
            const y = 245 + i * 38;
            if (titre) this.lignes.push(this.add.text(290, y, titre, { fontFamily: POLICE, fontSize: "14px", color: ATTENUE }).setOrigin(0, 0.5));
            this.lignes.push(this.add.text(430, y, texte, { fontFamily: POLICE, fontSize: "16px", color: TEXTE }).setOrigin(0, 0.5));
        });
    }

    deplacer(sens) { // monte ou descend dans le menu
        if (this.page !== "menu") return;
        const nb = this.lignesMenu().length;
        this.choix = (this.choix + sens + nb) % nb; // revient en haut après la dernière ligne
        this.confirmerQuitter = false; // bouger annule la demande de confirmation
        this.afficherMenu();
    }

    regler(sens) { // change le curseur sélectionné
        if (this.page !== "menu") return;
        const ligne = this.lignesMenu()[this.choix];
        if (ligne.type !== "curseur") return;
        const valeur = Phaser.Math.Clamp(reglages[ligne.reglage] + sens, ligne.min, ligne.max);
        if (valeur === reglages[ligne.reglage]) return; // déjà au bout
        changerReglage(ligne.reglage, valeur);
        if (ligne.reglage === "musique") majVolumeMusique(); // la musique change tout de suite
        else if (ligne.reglage === "effets") jouerSon(this, "tir"); // un bruitage pour entendre le nouveau volume
        else appliquerLuminosite(this.scene.get(this.origine)); // le niveau derrière se rééclaire tout de suite
        this.confirmerQuitter = false;
        this.afficherMenu();
    }

    valider() {
        if (this.page !== "menu") { this.afficherMenu(); return; } // page crédits : retour au menu
        const ligne = this.lignesMenu()[this.choix];
        if (ligne.type === "action") ligne.action();
    }

    retour() {
        if (this.page === "credits") this.afficherMenu(); // des crédits au menu
        else this.reprendre(); // du menu au jeu
    }

    reprendre() {
        const niveau = this.scene.get(this.origine);
        rattraperHorloge(niveau, this.game.loop.time - this.debutPause); // le niveau ne doit pas « sentir » la pause
        niveau.input.keyboard.resetKeys(); // les touches relâchées pendant la pause n'ont pas été vues par le niveau : sans ça le robot continuerait d'avancer
        this.scene.resume(this.origine);
        this.scene.stop(); // ferme le menu
    }

    quitter() { // retour à l'écran d'accueil (la partie en cours est perdue)
        if (!this.confirmerQuitter) { // premier appui : on demande confirmation
            this.confirmerQuitter = true;
            this.afficherMenu();
            return;
        }
        this.sound.stopAll(); // coupe la musique du niveau
        this.scene.stop(this.origine);
        this.scene.start("menu");
    }
}
