// ============================================================================
//  js/accueil.js — ÉCRAN D'ACCUEIL : trois boutons PLAY / CONTROLS / CREDITS
//
//  Commandes : gauche / droite pour choisir un bouton, bouton A / Entrée pour valider.
//  CONTROLS et CREDITS ouvrent un petit panneau ; un appui sur A / Entrée le ferme.
// ============================================================================

import { creerClavierMenu } from "./controles.js";

// La scène qui s'ouvre quand on appuie sur PLAY
const SCENE_SUIVANTE = "choix_mode";
const POLICE = 'Georgia, "Goudy Bookletter 1911", Times, serif';

// Les trois boutons, de gauche à droite (l'image de chaque bouton est chargée dans chargement.js)
const BOUTONS = [
  { action: "controls", image: "img_bouton_controls", x: 300, y: 650 },
  { action: "play", image: "img_bouton_play", x: 640, y: 640 },
  { action: "credits", image: "img_bouton_credits", x: 980, y: 650 }
];

// Texte des deux panneaux
const TEXTE_CONTROLS =
  "COMMANDES\n\n" +
  "Joueur 1 · Cantatrice\n" +
  "Flèches : bouger · I : sauter · O : onde · P : changer de note · K : changer de perso (solo)\n\n" +
  "Joueur 2 · Détective\n" +
  "Z Q S D : bouger (Z / S : orienter la lampe) · R : sauter · T : lampe · Y : recharger";
const TEXTE_CREDITS =
  "CRÉDITS\n\n" +
  "MAESTRO — SAE 301, MMI Béziers\n\n" +
  "Laura Gendre · Nerimen Kiouaz\n" +
  "Vincent Bonnery · Mathieu Seres--Perea";

export default class accueil extends Phaser.Scene {
  constructor() {
    super({ key: "accueil" });
  }

  create() {
    // create() est rappelée à chaque retour sur l'accueil : on remet tout à zéro
    this.enTransition = false;
    this.panneauOuvert = false;
    this.choix = 1; // on démarre sur PLAY
    this.clavier = creerClavierMenu(this);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Le fond : l'image du titre, déjà à la taille de l'écran (1280 x 720)
    this.add.image(640, 360, "img_accueil");

    // Les trois boutons (de simples images)
    this.images = BOUTONS.map((b) => this.add.image(b.x, b.y, b.image));

    // Le bouton choisi "respire" pour montrer qu'on peut appuyer dessus
    this.respiration = null;
    this.majSelection();

    // La musique d'accueil (en boucle, coupée quand on quitte l'écran)
    if (this.cache.audio.exists("musique_accueil")) {
      this.musique = this.sound.add("musique_accueil", { loop: true, volume: 0.4 });
      this.musique.play();
      this.events.once("shutdown", () => this.musique.stop());
    }

    // Le panneau d'information (caché tant qu'on n'a pas appuyé sur CONTROLS / CREDITS)
    this.panneau = this.creerPanneau();
  }

  // Met en avant le bouton choisi : plus grand et bien opaque, les autres sont ternes
  majSelection() {
    if (this.respiration) {
      this.respiration.stop();
    }
    this.images.forEach((image, i) => {
      image.setScale(1).setAlpha(i == this.choix ? 1 : 0.65);
    });
    this.respiration = this.tweens.add({
      targets: this.images[this.choix],
      scale: 1.1,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  // Un rectangle sombre + un texte, au-dessus de tout
  creerPanneau() {
    const fond = this.add.rectangle(0, 0, 900, 340, 0x0b1030, 0.94).setStrokeStyle(5, 0xf5d97a);
    this.texteInfo = this.add
      .text(0, -10, "", {
        fontFamily: POLICE,
        fontSize: "17pt",
        color: "#ffffff",
        align: "center",
        lineSpacing: 6,
        wordWrap: { width: 820 }
      })
      .setOrigin(0.5);
    const aide = this.add
      .text(0, 145, "Bouton A / Entrée : retour", { fontFamily: POLICE, fontSize: "13pt", color: "#f5d97a" })
      .setOrigin(0.5);
    return this.add.container(640, 330, [fond, this.texteInfo, aide]).setDepth(10).setVisible(false);
  }

  update() {
    if (this.enTransition == true) {
      return;
    }

    // Panneau ouvert : n'importe quelle validation le referme
    if (this.panneauOuvert == true) {
      if (this.clavier.presse("valider")) {
        this.panneauOuvert = false;
        this.panneau.setVisible(false);
      }
      return;
    }

    // Choix du bouton avec gauche / droite
    if (this.clavier.presse("gauche") && this.choix > 0) {
      this.choix -= 1;
      this.majSelection();
    }
    if (this.clavier.presse("droite") && this.choix < BOUTONS.length - 1) {
      this.choix += 1;
      this.majSelection();
    }

    if (this.clavier.presse("valider")) {
      const action = BOUTONS[this.choix].action;
      if (action == "play") {
        this.lancerLeJeu();
      } else {
        this.texteInfo.setText(action == "controls" ? TEXTE_CONTROLS : TEXTE_CREDITS);
        this.panneau.setVisible(true);
        this.panneauOuvert = true;
      }
    }
  }

  // Fondu au noir, puis on ouvre la scène suivante
  lancerLeJeu() {
    this.enTransition = true; // empêche de valider deux fois
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start(SCENE_SUIVANTE);
    });
  }
}
