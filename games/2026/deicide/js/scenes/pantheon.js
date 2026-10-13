// pantheon.js : le choix proposé quand le Dieu du niveau 1 est battu : « Si tu veux entrer dans le panthéon, affronte la mort. »
// Comme la pause, c'est une scène posée PAR-DESSUS le niveau : le niveau est figé (boss, chrono, tirs) pendant que le joueur choisit.
// OUI : la suite du jeu commence (le Dieu s'enrage, fuite du niveau 2). NON : la partie s'arrête là et on va au classement (voir boss.js, refuserPantheon).
import { rattraperHorloge } from "./pause.js"; // pour que le niveau « ne sente pas » le temps passé à choisir

const TOUCHES_VALIDER = ["ENTER", "SPACE", "I"]; // les mêmes que le menu pause

// couleurs et police : celles du menu pause
const POLICE = "monospace";
const TEXTE = "#e7e0e9";
const ATTENUE = "#8a779b";
const SELECTION = "#f4b6c2";
const CADRE = 0x5f4f6e;
const FOND_PANNEAU = 0x15111a;

const CHOIX = ["OUI", "NON"];
const EXPLICATIONS = ["La suite du jeu commence.", "La partie s'arrête ici."];

export default class pantheon extends Phaser.Scene {
    constructor() {
        super("pantheon");
    }

    init(donnees) {
        this.origine = donnees.origine; // la clé du niveau figé derrière
        this.accepter = donnees.accepter; // appelée si le joueur dit OUI
        this.refuser = donnees.refuser; // appelée si le joueur dit NON
        this.choix = 0; // OUI sélectionné au départ
        this.debut = 0;
    }

    create() {
        this.debut = this.game.loop.time; // l'instant où le niveau s'est figé
        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.6).setOrigin(0.5); // le jeu reste visible, assombri
        this.add.rectangle(640, 360, 860, 380, FOND_PANNEAU, 0.95).setStrokeStyle(3, CADRE);
        this.add.text(640, 235, "Si tu veux entrer dans le panthéon,", { fontFamily: POLICE, fontSize: "30px", color: TEXTE }).setOrigin(0.5);
        this.add.text(640, 280, "affronte la mort.", { fontFamily: POLICE, fontSize: "30px", color: TEXTE }).setOrigin(0.5);
        this.textes = CHOIX.map((nom, i) => this.add.text(540 + i * 200, 380, nom, { fontFamily: POLICE, fontSize: "40px", color: TEXTE }).setOrigin(0.5));
        this.explication = this.add.text(640, 450, "", { fontFamily: POLICE, fontSize: "18px", color: ATTENUE }).setOrigin(0.5);
        this.add.text(640, 500, "GAUCHE/DROITE : choisir   A : valider", { fontFamily: POLICE, fontSize: "15px", color: ATTENUE }).setOrigin(0.5);
        this.afficher();

        const clavier = this.input.keyboard;
        const sur = (touches, action) => touches.forEach((touche) => clavier.on("keydown-" + touche, action));
        sur(["LEFT", "UP"], () => this.deplacer(-1));
        sur(["RIGHT", "DOWN"], () => this.deplacer(1));
        sur(TOUCHES_VALIDER, (evenement) => { if (!evenement.repeat) this.valider(); }); // pas de répétition : l'appui qui a tiré ne valide pas
    }

    deplacer(sens) {
        this.choix = (this.choix + sens + CHOIX.length) % CHOIX.length;
        this.afficher();
    }

    afficher() { // colore le choix sélectionné et met son explication
        this.textes.forEach((texte, i) => {
            texte.setText((i === this.choix ? "> " : "  ") + CHOIX[i]);
            texte.setColor(i === this.choix ? SELECTION : TEXTE);
        });
        this.explication.setText(EXPLICATIONS[this.choix]);
    }

    valider() {
        const niveau = this.scene.get(this.origine);
        rattraperHorloge(niveau, this.game.loop.time - this.debut); // le niveau ne doit pas « sentir » le temps du choix
        niveau.input.keyboard.resetKeys(); // les touches relâchées pendant le choix n'ont pas été vues par le niveau
        this.scene.resume(this.origine);
        this.scene.stop(); // ferme le choix
        if (this.choix === 0) this.accepter(); // OUI : la suite commence
        else this.refuser(); // NON : la partie s'arrête (le niveau a repris pour pouvoir lancer l'écran de fin)
    }
}
