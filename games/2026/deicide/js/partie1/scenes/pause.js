// pause.js : le menu pause, avec les réglages (musique, bruitages, luminosité) et les crédits
// C'est une scène posée PAR-DESSUS le niveau : le niveau est mis en pause (plus de mouvement, d'ennemis ni de chrono) mais reste affiché
// derrière, ce qui permet de voir la luminosité changer en direct. On l'ouvre avec Échap ou X (le bouton start de la borne) :
// voir preparerPause, appelée dans le create du niveau.
import { reglages, changerReglage, VOLUME_MAX, LUMINOSITE_MAX } from "../systemes/preferences_joueur.js"; // les réglages du joueur
import { jouerSon, majVolumeMusique } from "../systemes/sons.js"; // bruitages et volume de la musique
import { appliquerLuminosite } from "../mecanismes/lumiere.js"; // change le gris du voile d'ombre

const TOUCHES_PAUSE = ["ESC", "X"]; // ouvrent la pause (et la ferment, voir TOUCHES_RETOUR)
const TOUCHES_VALIDER = ["ENTER", "SPACE", "I"]; // valident le choix
const TOUCHES_RETOUR = ["ESC", "X", "K", "O"]; // reviennent en arrière : de la page crédits au menu, du menu au jeu

// couleurs et police : celles du menu et du HUD
const POLICE = "monospace"; // la police de tous les textes
const TEXTE = "#e7e0e9"; // texte normal
const ATTENUE = "#8a779b"; // texte secondaire
const SELECTION = "#f4b6c2"; // le choix sélectionné
const CADRE = 0x5f4f6e; // bord du panneau
const FOND_PANNEAU = 0x15111a; // fond du panneau
const VIDE = 0x3a2f45; // case vide d'un curseur
const PLEIN = 0xe7e0e9; // case pleine d'un curseur

// les lignes de la page crédits : [titre, texte] ("" = pas de titre, la ligne continue la précédente)
const CREDITS = [ // la liste des crédits : [titre, texte]
    ["JEU", "Thomas Siegel-Boissière, Paul Pouyadoux, Mathys Ribes"], // les auteurs du jeu
    ["", "SAÉ borne d'arcade, thème « ombre et lumière »"], // le cadre du projet
    ["GRAPHISMES", "Robot : pack Bot Wheel  /  Décor : Dawn of the Gods"], // les graphismes
    ["", "Ennemis : packs Huntress 2, Bringer of Death et Wizard"], // les ennemis
    ["BRUITAGES", "Kenney (Sci-fi, RPG Audio, Impact Sounds), rubberduck,"], // les bruitages
    ["", "jaggedstone  (licence CC0)"], // suite des bruitages
    ["MUSIQUE", "« Dark Shrine Loop » par qubodup et yd (niveau)"], // la musique du niveau
    ["", "« Boss Battle #8 » et « #9 » (Metal) par nene (boss), CC0"], // la musique des boss
    ["", "« Ending Scene » par nene (crédits de fin), CC0"], // la musique des crédits
    ["CRI DU BOSS", "« Aggressive Monster Roar » par yodguard (Pixabay)"], // le cri du boss
    ["MOTEUR", "Phaser 3.60"], // le moteur de jeu
    ["REMERCIEMENTS", "Nerimen : pour les nombreuses pull requests acceptées"], // remerciements
    ["", "Momo : pour le beta test"] // remerciements (suite)
];

// Ouvre le menu pause quand on appuie sur Échap ou X. À appeler dans le create() d'un niveau.
export function preparerPause(niveau) { // branche l'ouverture de la pause sur les touches
    TOUCHES_PAUSE.forEach((touche) => niveau.input.keyboard.on("keydown-" + touche, (evenement) => { // pour chaque touche de pause
        if (evenement.repeat) return; // touche maintenue : le navigateur répète l'appui, on ne rouvre pas la pause en boucle
        if (niveau.mort || niveau.partieFinie) return; // le robot meurt ou la partie est finie : pas de pause
        if (niveau.scene.isPaused()) return; // déjà en pause
        niveau.scene.launch("pause", { origine: niveau.scene.key }); // ouvre le menu par-dessus le niveau
        niveau.scene.pause(); // et fige le niveau
    }));
}

// Pendant la pause, l'horloge du niveau (scene.time.now) saute en avant : elle suit le temps réel. Tous les délais du jeu (invincibilité,
// brûlure de la lumière, tirs des ennemis, attaques du boss) seraient alors terminés d'un coup à la reprise. On retranche donc la durée
// de la pause à l'horloge du niveau : pour lui, le temps ne s'est pas écoulé.
export function rattraperHorloge(niveau, duree) { // retranche la durée de la pause de l'horloge du niveau
    const horloge = niveau.time; // l'horloge du niveau
    if (horloge.decalagePause === undefined) { // première pause de ce niveau : on remplace la mise à jour de l'horloge, une seule fois
        const evenements = niveau.sys.events; // les événements de la scène
        const miseAJour = horloge.update; // la mise à jour d'origine de Phaser
        horloge.decalagePause = 0; // total des pauses déjà retranchées
        evenements.off(Phaser.Scenes.Events.UPDATE, horloge.update, horloge); // Phaser l'a branchée telle quelle : on la débranche...
        // ...pour mettre la nôtre, qui retranche le décalage...
        horloge.update = function (temps, delta) { return miseAJour.call(this, temps - this.decalagePause, delta); }; // la nouvelle retire le total des pauses du temps
        evenements.on(Phaser.Scenes.Events.UPDATE, horloge.update, horloge); // ...et on la rebranche
    }
    horloge.decalagePause += duree; // on ajoute cette pause au total
}

export default class pause extends Phaser.Scene { // la scène du menu pause
    constructor() { // le constructeur
        super({ key: "pause" }); // on donne son nom à la scène
    }

    init(donnees) { // reçoit ce que le niveau lui transmet
        this.origine = donnees.origine; // la clé du niveau mis en pause
    }

    create() { // construit le menu pause
        this.debutPause = this.game.loop.time; // pour mesurer la durée de la pause (voir rattraperHorloge)
        this.page = "menu"; // "menu" ou "credits"
        this.choix = 0; // la ligne sélectionnée du menu
        this.confirmerQuitter = false; // vrai après un premier appui sur « Menu principal »

        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.45).setOrigin(0.5); // le jeu reste visible, un peu assombri
        this.add.rectangle(640, 360, 760, 560, FOND_PANNEAU, 0.95).setStrokeStyle(3, CADRE); // le panneau du menu
        this.titre = this.add.text(640, 130, "PAUSE", { fontFamily: POLICE, fontSize: "44px", color: TEXTE }).setOrigin(0.5); // le titre
        this.aide = this.add.text(640, 604, "", { fontFamily: POLICE, fontSize: "15px", color: ATTENUE }).setOrigin(0.5); // la ligne d'aide en bas
        this.add.text(640, 624, "Recommencer la partie : maintenir C + F pendant 0,5 s", { fontFamily: POLICE, fontSize: "13px", color: ATTENUE }).setOrigin(0.5); // le rappel pour recommencer la partie
        this.dessin = this.add.graphics(); // les cases des curseurs
        this.lignes = []; // les textes de la page affichée (détruits quand on change de page)

        const clavier = this.input.keyboard; // le clavier
        const sur = (touches, action) => touches.forEach((touche) => clavier.on("keydown-" + touche, action)); // fonction qui associe une action à une liste de touches
        sur(["UP"], () => this.deplacer(-1)); // haut : ligne précédente
        sur(["DOWN"], () => this.deplacer(1)); // bas : ligne suivante
        sur(["LEFT"], () => this.regler(-1)); // gauche : baisse le réglage
        sur(["RIGHT"], () => this.regler(1)); // droite : augmente le réglage
        sur(TOUCHES_VALIDER, (evenement) => { if (!evenement.repeat) this.valider(); }); // valider (sans répétition)
        sur(TOUCHES_RETOUR, (evenement) => { if (!evenement.repeat) this.retour(); }); // retour (sans répétition)

        this.afficherMenu(); // on affiche le menu
    }

    // ---- les lignes du menu : { nom, type: "action" ou "curseur", ... } ----
    lignesMenu() { // la liste des lignes du menu
        const lignes = [ // chaque ligne : un nom, un type et son action ou son réglage
            { nom: "REPRENDRE", type: "action", action: () => this.reprendre() }, // reprendre la partie
            { nom: "MUSIQUE", type: "curseur", reglage: "musique", min: 0, max: VOLUME_MAX }, // curseur du volume de la musique
            { nom: "BRUITAGES", type: "curseur", reglage: "effets", min: 0, max: VOLUME_MAX }, // curseur du volume des bruitages
            { nom: "LUMINOSITÉ", type: "curseur", reglage: "luminosite", min: 1, max: LUMINOSITE_MAX }, // curseur de la luminosité
            { nom: "CRÉDITS", type: "action", action: () => this.afficherCredits() }, // voir les crédits
            { nom: this.confirmerQuitter ? "REAPPUIE POUR QUITTER" : "MENU PRINCIPAL", type: "action", action: () => this.quitter() } // quitter vers le menu principal (avec confirmation)
        ]; // fin de la liste
        return this.origine === "versus" ? lignes.filter((ligne) => ligne.reglage !== "luminosite") : lignes; // le 1 contre 1 n'a pas de voile d'ombre : pas de réglage de luminosité
    }

    vider() { // efface la page affichée
        this.lignes.forEach((objet) => objet.destroy()); // on détruit chaque texte
        this.lignes = []; // la liste est vide
        this.dessin.clear(); // on efface les cases des curseurs
    }

    afficherMenu() { // affiche la page du menu
        this.page = "menu"; // on est sur la page du menu
        this.vider(); // on efface l'ancienne page
        this.titre.setText("PAUSE"); // le titre
        this.aide.setText("HAUT/BAS : choisir   GAUCHE/DROITE : régler   A : valider   START : reprendre"); // l'aide des touches
        this.lignesMenu().forEach((ligne, i) => { // pour chaque ligne du menu
            const y = 220 + i * 62; // une ligne tous les 62 px
            const choisie = i === this.choix; // vrai si c'est la ligne choisie
            const texte = this.add.text(300, y, (choisie ? "> " : "  ") + ligne.nom, { fontFamily: POLICE, fontSize: "28px", color: choisie ? SELECTION : TEXTE }).setOrigin(0, 0.5); // le texte de la ligne, précédé d'une flèche si elle est choisie
            this.lignes.push(texte); // on retient le texte pour pouvoir l'effacer
            if (ligne.type !== "curseur") return; // pas de curseur à dessiner : on passe
            const valeur = reglages[ligne.reglage]; // la valeur actuelle du réglage
            const volume = ligne.max === VOLUME_MAX; // les volumes ont 10 cases fines, la luminosité 7 cases larges
            const nbCases = volume ? VOLUME_MAX : LUMINOSITE_MAX; // nombre de cases du curseur
            const largeur = volume ? 20 : 28; // largeur d'une case : les deux curseurs ont à peu près la même longueur
                        for (let c = 0; c < nbCases; c++) { // pour chaque case
                this.dessin.fillStyle(c < valeur ? PLEIN : VIDE, 1); // pleine si elle est sous la valeur, sinon vide
                this.dessin.fillRect(600 + c * (largeur + 4), y - 11, largeur, 22); // on dessine la case
            } // fin de la boucle
            // 0 donne « OFF », sinon le pourcentage
            const etiquette = volume ? (valeur === 0 ? "OFF" : valeur * 10 + "%") : valeur + "/" + LUMINOSITE_MAX; // le texte à droite du curseur : OFF, pourcentage ou x/7
            this.lignes.push(this.add.text(600 + nbCases * (largeur + 4) + 14, y, etiquette, { fontFamily: POLICE, fontSize: "20px", color: ATTENUE }).setOrigin(0, 0.5)); // on affiche ce texte
        });
    }

    afficherCredits() { // affiche la page des crédits
        this.page = "credits"; // on est sur la page des crédits
        this.vider(); // on efface la page
        this.titre.setText("CRÉDITS"); // le titre
        this.aide.setText("Appuie sur un bouton pour revenir"); // l'aide
        const jeu = this.add.text(640, 190, "DEICIDE", { fontFamily: POLICE, fontSize: "30px", color: SELECTION }).setOrigin(0.5); // le nom du jeu
        this.lignes.push(jeu); // on retient ce texte
        CREDITS.forEach(([titre, texte], i) => { // pour chaque ligne de crédits
            const y = 240 + i * 27; // (27 px entre deux lignes : il y a 13 lignes, elles doivent tenir au-dessus de l'aide)
            if (titre) this.lignes.push(this.add.text(290, y, titre, { fontFamily: POLICE, fontSize: "14px", color: ATTENUE }).setOrigin(0, 0.5)); // le titre de la ligne, s'il y en a un
            this.lignes.push(this.add.text(430, y, texte, { fontFamily: POLICE, fontSize: "16px", color: TEXTE }).setOrigin(0, 0.5)); // le texte de la ligne
        });
    }

    deplacer(sens) { // monte ou descend dans le menu
        if (this.page !== "menu") return; // pas sur la page du menu : rien
        const nb = this.lignesMenu().length; // nombre de lignes du menu
        this.choix = (this.choix + sens + nb) % nb; // revient en haut après la dernière ligne
        this.confirmerQuitter = false; // bouger annule la demande de confirmation
        this.afficherMenu(); // on réaffiche
    }

    regler(sens) { // change le curseur sélectionné
        if (this.page !== "menu") return; // pas sur la page du menu : rien
        const ligne = this.lignesMenu()[this.choix]; // la ligne choisie
        if (ligne.type !== "curseur") return; // ce n'est pas un curseur : rien
        const valeur = Phaser.Math.Clamp(reglages[ligne.reglage] + sens, ligne.min, ligne.max); // la nouvelle valeur, entre le minimum et le maximum
        if (valeur === reglages[ligne.reglage]) return; // déjà au bout
        changerReglage(ligne.reglage, valeur); // on enregistre le réglage
        if (ligne.reglage === "musique") majVolumeMusique(); // la musique change tout de suite
        else if (ligne.reglage === "effets") jouerSon(this, "tir"); // un bruitage pour entendre le nouveau volume
        else appliquerLuminosite(this.scene.get(this.origine)); // le niveau derrière se rééclaire tout de suite
        this.confirmerQuitter = false; // on annule la demande de confirmation
        this.afficherMenu(); // on réaffiche
    }

    valider() { // valide la ligne choisie
        if (this.page !== "menu") { this.afficherMenu(); return; } // page crédits : retour au menu
        const ligne = this.lignesMenu()[this.choix]; // la ligne choisie
        if (ligne.type === "action") ligne.action(); // si c'est une action, on la lance
    }

    retour() { // revient en arrière
        if (this.page === "credits") this.afficherMenu(); // des crédits au menu
        else this.reprendre(); // du menu au jeu
    }

    reprendre() { // reprend la partie
        const niveau = this.scene.get(this.origine); // le niveau en pause
        rattraperHorloge(niveau, this.game.loop.time - this.debutPause); // le niveau ne doit pas « sentir » la pause
        // les touches relâchées pendant la pause n'ont pas été vues par le niveau : sans ça le robot continuerait d'avancer
        niveau.input.keyboard.resetKeys(); // on remet les touches à zéro
        this.scene.resume(this.origine); // le niveau reprend
        this.scene.stop(); // ferme le menu
    }

    quitter() { // retour à l'écran d'accueil (la partie en cours est perdue)
        if (!this.confirmerQuitter) { // premier appui : on demande confirmation
            this.confirmerQuitter = true; // on demande confirmation
            this.afficherMenu(); // on réaffiche le menu
            return; // on s'arrête là
        }
        this.sound.stopAll(); // coupe la musique du niveau
        this.scene.stop(this.origine); // on arrête le niveau
        this.scene.start("menu"); // on retourne au menu principal
    }
}
