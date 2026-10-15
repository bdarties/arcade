// pantheon.js : le choix proposé quand le Dieu du niveau 1 est battu : « Si tu veux entrer dans le panthéon, affronte la mort. »
// Comme la pause, c'est une scène posée PAR-DESSUS le niveau : le niveau est figé (boss, chrono, tirs) pendant que le joueur choisit.
// OUI : la suite du jeu commence (le Dieu s'enrage, fuite du niveau 2). NON : la partie s'arrête là et on retourne directement au menu (voir boss.js, refuserPantheon).
// Le décor reprend celui de l'écran de fin (classement.js) : la même police pixel et les mêmes plaques d'armure que le HUD.
import { rattraperHorloge } from "./pause.js"; // pour que le niveau « ne sente pas » le temps passé à choisir
import { ecrire, OR, CLAIR, LAVANDE, GRIS_VIOLET } from "./classement.js"; // l'écriture en police pixel et les couleurs
import { creerPolice, plaque } from "../systemes/dessins_en_code.js"; // la police pixel et les plaques (dessinées en code)
import { jouerSon } from "../systemes/sons.js"; // un petit bruit quand on change de choix

const TOUCHES_VALIDER = ["ENTER", "SPACE", "I"]; // les mêmes que le menu pause (I = le bouton de saut de la borne)

const E = 4; // une plaque est dessinée en pixels de 4 x 4 à l'écran
const CHOIX = ["OUI", "NON"]; // les deux choix proposés
const EXPLICATIONS = ["LA SUITE DU JEU COMMENCE", "RETOUR AU MENU"]; // (la police n'a ni accents ni apostrophe)
const X_BOUTONS = [490, 790]; // le centre de chaque bouton
const Y_BOUTONS = 438; // y des boutons
const L_BOUTON = 52, H_BOUTON = 22; // un bouton fait 52 x 22 pixels de dessin

export default class pantheon extends Phaser.Scene { // la scène du choix, posée par-dessus le niveau
    constructor() { // le constructeur
        super("pantheon"); // on donne son nom à la scène
    }

    init(donnees) { // reçoit ce que le niveau lui transmet
        this.origine = donnees.origine; // la clé du niveau figé derrière
        this.accepter = donnees.accepter; // appelée si le joueur dit OUI
        this.refuser = donnees.refuser; // appelée si le joueur dit NON
        this.choix = 0; // OUI sélectionné au départ
    }

    create() { // construit l'écran du choix
        this.debut = this.game.loop.time; // l'instant où le niveau s'est figé
        creerPolice(this); // on prépare la police pixel
        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.78).setDepth(0); // le jeu reste visible, très assombri
        this.tout = this.add.container(0, 0).setDepth(1).setAlpha(0); // tout le panneau : il apparaît en fondu
        const ajouter = (objet) => { this.tout.add(objet); return objet; }; // fonction qui ajoute un objet au panneau

        // la grande plaque, avec son creux sombre
        ajouter(this.add.image(260, 120, plaque(this, 190, 120)).setOrigin(0, 0).setScale(E)); // la grande plaque du panneau
        ajouter(ecrire(this, 640, 188, "DIEU DE LA LUMIERE VAINCU", 3, { teinte: GRIS_VIOLET })); // le titre « DIEU DE LA LUMIERE VAINCU »
        // un filet doré, interrompu au milieu par un losange
        ajouter(this.add.rectangle(480, 224, 240, 4, OR, 0.8)); // le filet doré à gauche
        ajouter(this.add.rectangle(800, 224, 240, 4, OR, 0.8)); // le filet doré à droite
        ajouter(this.add.rectangle(640, 224, 14, 14, OR).setAngle(45)); // un losange doré au milieu
        ajouter(ecrire(this, 640, 276, "SI TU VEUX ENTRER DANS LE PANTHEON", 3, { teinte: CLAIR })); // la phrase d'introduction
        this.defi = ajouter(ecrire(this, 640, 342, "AFFRONTE LA MORT", 7, { teinte: OR })); // le défi, en grand et doré
        this.tweens.add({ targets: this.defi, alpha: 0.72, duration: 700, yoyo: true, repeat: -1, ease: "Sine.InOut" }); // il palpite

        // les deux boutons : une plaque, un mot, et un cadre doré autour de celui qui est choisi
        this.boutons = CHOIX.map((nom, i) => { // on crée les deux boutons
            const fond = ajouter(this.add.image(X_BOUTONS[i], Y_BOUTONS, plaque(this, L_BOUTON, H_BOUTON, false)).setScale(E)); // la plaque du bouton
            const mot = ajouter(ecrire(this, X_BOUTONS[i], Y_BOUTONS, nom, 6)); // le mot (OUI ou NON)
            return { fond, mot }; // on renvoie les deux morceaux
        });
        this.cadre = ajouter(this.add.graphics()); // le cadre doré du choix
        this.tweens.add({ targets: this.cadre, alpha: 0.55, duration: 450, yoyo: true, repeat: -1, ease: "Sine.InOut" }); // il clignote doucement
        this.explication = null; // le texte sous les boutons : recréé à chaque changement de choix
        ajouter(ecrire(this, 640, 566, "GAUCHE DROITE  CHOISIR      A  VALIDER", 2, { teinte: GRIS_VIOLET })); // l'aide des touches en bas
        this.afficher(); // on affiche le choix sélectionné

        this.tweens.add({ targets: this.tout, alpha: 1, duration: 300 }); // le panneau apparaît en fondu

        const clavier = this.input.keyboard; // le clavier
        const sur = (touches, action) => touches.forEach((touche) => clavier.on("keydown-" + touche, action)); // fonction qui associe une action à une liste de touches
        sur(["LEFT", "UP"], () => this.deplacer(-1)); // gauche ou haut : choix précédent
        sur(["RIGHT", "DOWN"], () => this.deplacer(1)); // droite ou bas : choix suivant
        sur(TOUCHES_VALIDER, (evenement) => { if (!evenement.repeat) this.valider(); }); // pas de répétition : l'appui qui a tiré ne valide pas
    }

    deplacer(sens) { // change de choix (sens = -1 ou 1)
        this.choix = (this.choix + sens + CHOIX.length) % CHOIX.length; // on passe au choix voisin, en revenant au début à la fin
        jouerSon(this, "tir"); // un petit bruit, comme dans le menu pause
        this.afficher(); // on affiche le nouveau choix
    }

    afficher() { // met en avant le choix sélectionné : cadre doré, mot doré, l'autre bouton éteint
        this.boutons.forEach((bouton, i) => { // pour chaque bouton
            const choisi = i === this.choix; // vrai si c'est le bouton choisi
            bouton.fond.setAlpha(choisi ? 1 : 0.5); // le bouton choisi est plein, l'autre est atténué
            bouton.mot.lettres.forEach((lettre) => lettre && lettre.setTint(choisi ? OR : GRIS_VIOLET)); // le mot choisi est doré, l'autre gris
        });
        const w = L_BOUTON * E + 16, h = H_BOUTON * E + 16; // le cadre dépasse la plaque de 8 px de chaque côté
        this.cadre.clear().lineStyle(4, OR, 1).strokeRect(X_BOUTONS[this.choix] - w / 2, Y_BOUTONS - h / 2, w, h); // on redessine le cadre doré autour du bouton choisi
        if (this.explication) this.explication.destroy(); // on efface l'ancienne explication
        this.explication = ecrire(this, 640, 523, EXPLICATIONS[this.choix], 3, { teinte: LAVANDE }); // la nouvelle explication sous les boutons
        this.tout.add(this.explication); // on l'ajoute au panneau
    }

    valider() { // valide le choix du joueur
        const niveau = this.scene.get(this.origine); // le niveau figé derrière
        rattraperHorloge(niveau, this.game.loop.time - this.debut); // le niveau ne doit pas « sentir » le temps du choix
        niveau.input.keyboard.resetKeys(); // les touches relâchées pendant le choix n'ont pas été vues par le niveau
        this.scene.resume(this.origine); // le niveau reprend
        this.scene.stop(); // ferme le choix
        if (this.choix === 0) this.accepter(); // OUI : la suite commence
        else this.refuser(); // NON : la partie s'arrête (le niveau a repris pour pouvoir fermer le jeu proprement et retourner au menu)
    }
}
