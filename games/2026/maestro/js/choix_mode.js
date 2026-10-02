// ============================================================================
//  js/choix_mode.js — CHOIX DU MODE : Solo ou Duo
//
//  Le choix est stocké dans le "registry" (une mémoire partagée entre toutes
//  les scènes) :   this.registry.set("mode", "solo")   ou   "duo"
//  Les niveaux le relisent avec :   this.registry.get("mode")
//
//  Commandes : gauche / droite pour choisir, bouton A / Entrée pour valider.
// ============================================================================

import { creerClavierMenu } from "./controles.js";
import { REGLAGES } from "./reglages.js";

const POLICE = 'Georgia, "Goudy Bookletter 1911", Times, serif';
const SCENE_SUIVANTE = "lobby"; // on apparaît dans le lobby, d'où l'on lance le niveau 1

// Les deux choix proposés
const MODES = [
  {
    mode: "solo",
    titre: "SOLO",
    detail: "1 joueur · " + REGLAGES.vies.solo + " cœurs\nBouton D : changer de personnage",
    x: 360
  },
  {
    mode: "duo",
    titre: "DUO",
    detail: "2 joueurs · " + REGLAGES.vies.duo + " cœurs partagés\nJ1 : Cantatrice · J2 : Détective",
    x: 920
  }
];

export default class choix_mode extends Phaser.Scene {
  constructor() {
    super({ key: "choix_mode" });
  }

  create() {
    this.enTransition = false;
    this.choix = 0; // 0 = solo, 1 = duo
    this.clavier = creerClavierMenu(this);
    this.cameras.main.fadeIn(350, 0, 0, 0);

    // Fond : l'image du titre, assombrie pour faire ressortir les deux choix
    this.add.image(640, 360, "img_accueil");
    this.add.rectangle(640, 360, 1280, 720, 0x000010, 0.9);

    this.add
      .text(640, 90, "CHOISIS TON MODE", {
        fontFamily: POLICE,
        fontSize: "34pt",
        fontStyle: "bold",
        color: "#f5d97a",
        stroke: "#000000",
        strokeThickness: 6
      })
      .setOrigin(0.5);

    // ---- Les deux panneaux (un conteneur = cadre + titre + personnages + texte) ----
    this.panneaux = MODES.map((m) => this.creerPanneau(m));

    this.add
      .text(640, 685, "← → choisir · Bouton A / Entrée valider", {
        fontFamily: POLICE,
        fontSize: "14pt",
        color: "#dfe6ff",
        stroke: "#000000",
        strokeThickness: 4
      })
      .setOrigin(0.5);

    this.rafraichir();
  }

  // Construit un panneau et le renvoie
  creerPanneau(m) {
    const cadre = this.add.graphics(); // le dessin du cadre est refait dans rafraichir()
    const titre = this.add
      .text(0, -160, m.titre, {
        fontFamily: POLICE,
        fontSize: "36pt",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6
      })
      .setOrigin(0.5);
    const detail = this.add
      .text(0, 135, m.detail, {
        fontFamily: POLICE,
        fontSize: "15pt",
        color: "#dfe6ff",
        align: "center",
        stroke: "#000000",
        strokeThickness: 3
      })
      .setOrigin(0.5);

    // Les personnages qui jouent dans ce mode (animation "idle" en boucle)
    const elements = [cadre, titre, detail];
    if (m.mode == "solo") {
      elements.push(this.creerApercu("cantatrice", 0, false));
    } else {
      elements.push(this.creerApercu("cantatrice", -80, false));
      elements.push(this.creerApercu("detective", 80, true)); // flipX : il regarde vers la gauche
    }

    const conteneur = this.add.container(m.x, 380, elements);
    return { conteneur: conteneur, cadre: cadre };
  }

  creerApercu(perso, decalageX, retourner) {
    const sprite = this.add.sprite(decalageX, -10, perso + "_idle");
    sprite.setScale(3);
    sprite.setFlipX(retourner);
    sprite.play(perso + "_idle");
    return sprite;
  }

  // Redessine les panneaux : le choisi est doré et un peu plus grand, l'autre est grisé
  rafraichir() {
    this.panneaux.forEach((panneau, i) => {
      const choisi = i == this.choix;
      panneau.cadre.clear();
      panneau.cadre.fillStyle(0x0b1030, 1).fillRoundedRect(-210, -210, 420, 420, 22);
      panneau.cadre
        .lineStyle(choisi ? 6 : 3, choisi ? 0xf5d97a : 0x5a6088)
        .strokeRoundedRect(-210, -210, 420, 420, 22);
      panneau.conteneur.setAlpha(choisi ? 1 : 0.7);
      this.tweens.add({
        targets: panneau.conteneur,
        scale: choisi ? 1.06 : 0.94,
        duration: 150
      });
    });
  }

  update() {
    if (this.enTransition == true) {
      return;
    }
    // gauche / droite (joystick de J1 ou de J2)
    if (this.clavier.presse("gauche") && this.choix != 0) {
      this.choix = 0;
      this.rafraichir();
    }
    if (this.clavier.presse("droite") && this.choix != 1) {
      this.choix = 1;
      this.rafraichir();
    }
    if (this.clavier.presse("valider")) {
      this.valider();
    }
  }

  // On mémorise le mode choisi, puis on lance le niveau 1
  valider() {
    this.enTransition = true;
    this.registry.set("mode", MODES[this.choix].mode);
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start(SCENE_SUIVANTE);
    });
  }
}
