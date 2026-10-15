import { BORNE, creerTouches, uneTouchePressee, COULEURS, TAILLE, css, style } from "./fonctions.js";

export default class classement extends Phaser.Scene {

  constructor() {
    super({ key: "classement" });
  }

  preload() {
    this.load.image("classement_bg", "src/bg/classement_bg.png");
    this.load.image("retour_button", "src/button/retour.png");
  }

  // "async" car on utilise "await" pour lire la sauvegarde
  async create() {

    this.add.image(0, 0, "classement_bg").setOrigin(0).setDepth(0);

    // Bouton retour
    var bouton_play = this.add.image(640, 625, "retour_button").setDepth(1);

    bouton_play.setInteractive();
    bouton_play.on("pointerover", () => bouton_play.setScale(1.1));
    bouton_play.on("pointerout", () => bouton_play.setScale(1));
    bouton_play.on("pointerup", () => this.scene.start("menu"));

    // --- RETOUR AU MENU AVEC LES BOUTONS DE LA BORNE ---
    this.pret = false;   // faux pendant 0,5 s : on ignore l'appui qui nous a amenés ici
    this.time.delayedCall(500, () => {
      this.pret = true;
    });

    this.touchesRetour = creerTouches(this, BORNE.j1.boutons.concat(BORNE.j2.boutons));

    // --- AFFICHAGE DES SCORES ---
    // Ce bloc est placé APRÈS la création des touches : "await" met la fonction en pause,
    // et update() tourne pendant ce temps. Les touches doivent donc déjà exister.
    const donnees = (await lireDonneesJSON()) || {};   // null si personne n'a encore joué

    this.afficherColonne(340, "SOLO", donnees.solo || [], false);
    this.afficherColonne(940, "1V1", donnees.duo || [], true);
  }

  // Affiche le titre d'un mode, puis une ligne par entrée.
  afficherColonne(x, titre, liste, estDuo) {

    this.add.text(x, 110, titre, style(TAILLE.GRAND, css(COULEURS.DORE)))
      .setOrigin(0.5).setDepth(1);

    if (liste.length === 0) {
      this.add.text(x, 300, "Aucune partie jouée", style(TAILLE.PETIT))
        .setOrigin(0.5).setDepth(1);
      return;
    }

    liste.forEach((entree, i) => {

      // Les millisecondes sont converties en date lisible : "14/10 15:32"
      const date = new Date(entree.date).toLocaleString("fr-FR", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
      });

      let ligne = (i + 1) + ".  " + entree.score + " pts";

      if (estDuo) {
        ligne = (i + 1) + ".  J1 " + entree.scoreJ1 + " - " + entree.scoreJ2 + " J2";
      }

      this.add.text(x, 170 + i * 40, ligne + "   " + date, style(TAILLE.PETIT))
        .setOrigin(0.5).setDepth(1);
    });
  }

  // update() est appelée environ 60 fois par seconde
  update() {

    // On lit TOUJOURS les touches, pour "consommer" les appuis
    const retour = uneTouchePressee(this.touchesRetour);

    if (retour && this.pret) {
      this.scene.start("menu");
    }
  }
}