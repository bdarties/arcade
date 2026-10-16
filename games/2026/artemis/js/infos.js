import * as fct from "./fonctions.js";
import { BOUTONS_VALIDER } from "./menu.js";

/***********************************************************************/
/** ECRANS D'INFORMATIONS DU MENU : commandes et crédits
/** n'importe quel bouton d'un joueur ramène au menu
/***********************************************************************/

const DUREE_FONDU = 300; // ms
const DELAI_RETOUR_PAUSE = 250; // ms

// actions de la borne, dans l'ordre des deux rangées de boutons (cf. TOUCHES_J1 / TOUCHES_J2 dans fonctions.js)
const ACTIONS = [
  ["pause", "Pause"],
  ["interagir", "Interagir (échelle, statue)"],
  ["torche", "Allumer / éteindre la lampe"],
  ["frapper_tirer", "Frapper / tirer"],
  ["sprint", "Sprint"],
  ["changer_equipement", "Changer d'équipement"]
];
const JOYSTICKS = ["Flèches", "Z Q S D"]; // joystick du joueur 1, du joueur 2

// l'équipe et les ressources : à compléter / corriger ici
const EQUIPE = [
  ["Lino Volle", "Employer avec des sourires"],
  ["Inas Ouarich", "Employer avec enocre plus de sourires"],
  ["Liku Soane Liku o Hihifo Iloai", "chef de projet, ping pong ? (mais il souris beaucoup)"]
];

// sections du défilement des crédits : [titre, [[ligne principale, détail], ...]] ; le détail est facultatif
// les musiques arriveront plus tard : ajouter une section "Musiques" ici
const SECTIONS = [
  ["Équipe", EQUIPE],
  ["Personnages", [
    ["Character Templates Pack", "erisesra · itch.io"],
    ["Inspirations", "Stardew Valley · Fields of Mistria · Ulysse 31"]
  ]],
  ["Décors", [
    ["Free 2D Top-Down Pixel Dungeon Asset Pack", "CraftPix.net"],
    ["Free Ruined Temple Top-Down Location Pixel Art", "CraftPix.net"]
  ]],
  ["Objets", [
    ["Free Rocks and Stones Top-Down Pixel Art", "pierres · CraftPix.net"],
    ["Free Guns Icon 32x32 Pixel Pack", "fusil · CraftPix.net"],
    ["Pickaxes", "pioche · joosyjud · itch.io"],
    ["Free Crystal Pack", "cristaux · flamezin · itch.io"],
    ["Statue d'Artémis", "générée avec Pixellab"]
  ]],
  ["Typographies", [
    ["Origin Tech Demo Regular", "logo"],
    ["Ethnocentric Regular", "boutons"],
    ["Kallisto Medium", "textes"]
  ]],
  ["Moteur", [["Phaser 3", "moteur de jeu"]]]
];

// défilement "Star Wars" : le texte part du bas de l'écran et s'éloigne vers un point de fuite
// profondeur z (px) : 0 en bas de l'écran, elle augmente avec le temps ; échelle = PROFONDEUR / (PROFONDEUR + z)
const HORIZON_Y = 150; // px : point de fuite, où le texte se réduit à rien
const BASE_Y = 640; // px : bas du défilement (échelle 1) ; la consigne de retour est dessous
const PROFONDEUR = 260; // plus grand = perspective plus douce
const VITESSE_DEFILEMENT = 62; // px/s en profondeur
const ECHELLE_DISPARITION = 0.16; // en dessous, le texte est invisible
const PAUSE_BOUCLE = 1500; // ms entre la fin du défilement et son redémarrage
const COULEUR_TITRE = "#EC8697";
const COULEUR_TEXTE = "#E8EBF0";
const COULEUR_DETAIL = "#BFC3CC";

export default class infos extends Phaser.Scene {
  constructor() {
    super({ key: "infos" });
  }

  create(data) {
    this.page = data.page; // "commandes" ou "credits"
    this.choix = data.choix; // bouton du menu à retrouver au retour
    this.depuis_pause = data.depuis_pause === true; // ouvert depuis le menu pause : on y revient sans passer par le menu
    this.retour = this.depuis_pause; // le bouton qui a ouvert l'écran est encore enfoncé : retour bloqué un instant
    if (this.depuis_pause) this.time.delayedCall(DELAI_RETOUR_PAUSE, () => { this.retour = false; });
    this.cameras.main.setBackgroundColor("#080D1C");
    this.cameras.main.fadeIn(DUREE_FONDU);
    if (this.page === "commandes") {
      // une image de 1280x720 qui contient tout : fond, titre et schéma des deux joueurs
      const imageCommandes = this.depuis_pause && this.registry.get("nb_joueurs") === 1
        ? "img_commandes_solo"
        : "img_commandes_duo";
      this.add.image(0, 0, imageCommandes).setOrigin(0, 0);
    } else {
      this.add.image(0, 0, "img_fond_menu").setOrigin(0, 0);
      // voile sombre sous le texte, pour qu'il reste lisible sur le décor
      this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x080d1c, 0.72).setOrigin(0, 0);
      this.dessinerCredits();
    }

    // le contour garde la consigne lisible sur l'image des commandes
    this.add.text(this.scale.width / 2, this.scale.height - 34, "Appuie sur le bouton " + fct.ETIQUETTES.frapper_tirer + " pour revenir", { fontFamily: fct.POLICES.texte, fontSize: "22px", color: "#E8EBF0", stroke: "#080D1C", strokeThickness: 5 })
      .setOrigin(0.5);

    this.touches = fct.JOUEURS.map((joueur) => fct.creerTouches(this, joueur.touches));
  }

  titre(texte) {
    this.add.text(this.scale.width / 2, 70, texte, { fontFamily: fct.POLICES.bouton, fontSize: "40px", color: "#EC8697", stroke: "#20283A", strokeThickness: 6 })
      .setOrigin(0.5);
  }

  // deux colonnes, une par joueur : joystick puis les 6 boutons
  dessinerCommandes() {
    this.titre("COMMANDES");
    fct.JOUEURS.forEach((joueur, i) => {
      const x = this.scale.width * (i === 0 ? 0.27 : 0.73);
      this.add.text(x, 150, "JOUEUR " + joueur.numero, { fontFamily: fct.POLICES.bouton, fontSize: "24px", color: "#E8EBF0" }).setOrigin(0.5);
      this.add.text(x, 192, "Joystick : " + JOYSTICKS[i], { fontFamily: fct.POLICES.texte, fontSize: "22px", color: "#BFC3CC" }).setOrigin(0.5);
      ACTIONS.forEach(([action, libelle], rang) => {
        const y = 250 + rang * 62;
        this.add.text(x - 235, y, "[" + joueur.touches[action] + "]", { fontFamily: fct.POLICES.bouton, fontSize: "20px", color: "#EC8697" }).setOrigin(0, 0.5);
        this.add.text(x - 170, y, libelle, { fontFamily: fct.POLICES.texte, fontSize: "20px", color: "#E8EBF0" }).setOrigin(0, 0.5);
      });
    });
  }

  dessinerCredits() {
    this.titre("CREDITS");
    this.lignes = []; // { texte, depart } : depart = profondeur au début (négative : la ligne attend sous l'écran)
    let distance = 0; // profondeur cumulée entre la première ligne et la ligne en cours
    const ajouter = (message, police, taille, couleur, ecart) => {
      const texte = this.add.text(this.scale.width / 2, BASE_Y, message, { fontFamily: police, fontSize: taille + "px", color: couleur, stroke: "#080D1C", strokeThickness: 4 })
        .setOrigin(0.5).setVisible(false);
      texte.texture.setFilter(Phaser.Textures.FilterMode.LINEAR); // pixelArt est actif : sans cela le texte réduit scintille
      this.lignes.push({ texte: texte, depart: -distance });
      distance += ecart; // espace jusqu'à la ligne suivante
    };

    ajouter("ARTEMIS", fct.POLICES.logo, 72, COULEUR_TEXTE, 70);
    ajouter("SAÉ 301", fct.POLICES.texte, 26, COULEUR_TITRE, 90);
    SECTIONS.forEach(([titre, entrees]) => {
      ajouter(titre.toUpperCase(), fct.POLICES.bouton, 30, COULEUR_TITRE, 60);
      entrees.forEach(([principal, detail]) => {
        ajouter(principal, fct.POLICES.texte, 26, COULEUR_TEXTE, detail ? 34 : 50);
        if (detail) ajouter(detail, fct.POLICES.texte, 20, COULEUR_DETAIL, 56);
      });
      distance += 40; // respiration entre deux sections
    });
    ajouter("Merci d'avoir joué", fct.POLICES.bouton, 32, COULEUR_TEXTE, 0);

    // le défilement redémarre quand la dernière ligne a disparu au loin
    const profondeur_disparition = PROFONDEUR * (1 / ECHELLE_DISPARITION - 1);
    this.duree_defilement = ((profondeur_disparition + distance) / VITESSE_DEFILEMENT) * 1000 + PAUSE_BOUCLE;
    this.ecoule = 0;
    this.majDefilement(0);
  }

  // place chaque ligne selon sa profondeur : plus elle est loin, plus elle est petite, haute à l'écran et transparente
  majDefilement(delta) {
    this.ecoule = (this.ecoule + delta) % this.duree_defilement;
    const avance = (this.ecoule / 1000) * VITESSE_DEFILEMENT;
    this.lignes.forEach(({ texte, depart }) => {
      const z = depart + avance;
      const echelle = PROFONDEUR / (PROFONDEUR + z);
      if (z < 0 || echelle <= ECHELLE_DISPARITION) { // pas encore entrée, ou déjà perdue de vue
        texte.setVisible(false);
        return;
      }
      const y = HORIZON_Y + (BASE_Y - HORIZON_Y) * echelle;
      // fondu à l'entrée (les 45 px au-dessus du bas) et à la sortie (au loin)
      const alpha = Math.min(1, (BASE_Y - y) / 45, (echelle - ECHELLE_DISPARITION) / 0.3);
      texte.setVisible(true).setY(y).setScale(echelle).setAlpha(alpha);
    });
  }

  update(temps, delta) {
    if (this.lignes) this.majDefilement(delta);
    if (this.retour) return;
    const appuye = (touche) => Phaser.Input.Keyboard.JustDown(touche);
    if (!this.touches.some((t) => BOUTONS_VALIDER.some((bouton) => appuye(t[bouton])))) return;
    this.retour = true;
    /* >>>>> AJOUT SON <<<<< */ this.sound.play("son_touche_sortant"); // on quitte la page (commandes ou crédits)
    if (this.depuis_pause) {
      this.scene.stop();
      this.scene.resume("pause");
      return;
    }
    this.cameras.main.fadeOut(DUREE_FONDU);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("menu", { choix: this.choix }));
  }
}
