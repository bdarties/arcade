import { TOUCHES } from "./touches.js";

export default class Ecran_score extends Phaser.Scene {
  constructor() {
    super({
      key: "Ecran_score"
    });
  }

  init(data) {
    this.resultats = data || {}; // { mode, scoreJ1, scoreJ2, gagnant, raison }
  }

  create() {
    const { mode, scoreJ1, scoreJ2, gagnant, raison } = this.resultats;
    const valeurOuIndisponible = valeur => valeur ?? "Non renseigné";
    const style = (taille, couleur = "#ffffff") => ({
      fontFamily: "Arial, sans-serif",
      fontSize: taille + "px",
      color: couleur,
      align: "center"
    });

    this.cameras.main.setBackgroundColor("#101820");

    if (mode === 2) {
      // ----- Mode compétitif : on annonce le vainqueur -----
      this.add.text(640, 130, "Fin du match", style(42)).setOrigin(0.5);

      let annonce = "Égalité parfaite !";
      let couleur = "#ffffff";
      if (gagnant === 1) {
        annonce = "Le joueur 1 remporte la partie !";
        couleur = "#3bd5f0";
      } else if (gagnant === 2) {
        annonce = "Le joueur 2 remporte la partie !";
        couleur = "#ff8c42";
      }
      this.add.text(640, 230, annonce, style(48, couleur)).setOrigin(0.5);

      let detail = "Le temps est écoulé";
      if (raison === "vie_J1") {
        detail = "Le joueur 1 est tombé au combat...";
      } else if (raison === "vie_J2") {
        detail = "Le joueur 2 est tombé au combat...";
      }
      this.add.text(640, 300, detail, style(24, "#aaaaaa")).setOrigin(0.5);

      this.add.text(640, 400, `Joueur 1 : ${valeurOuIndisponible(scoreJ1)}   -   Joueur 2 : ${valeurOuIndisponible(scoreJ2)}`, style(32)).setOrigin(0.5);
    } else {
      // ----- Mode histoire (1 joueur) -----
      this.add.text(640, 190, "Bilan de la partie", style(42)).setOrigin(0.5);
      this.add.text(640, 340, `Score : ${valeurOuIndisponible(scoreJ1)}`, style(30)).setOrigin(0.5);
    }

    // ----- Navigation -----
    const libelle_rejouer = mode === 2 ? "I / R : nouvelle partie (carte au hasard)" : "I : rejouer l'histoire";
    const rejouer = this.add.text(640, 520, libelle_rejouer, style(26, "#f1c489"))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    const menu = this.add.text(640, 580, "K / F : retour au menu", style(26, "#f1c489"))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    const relancer = () => {
      if (mode === 2) {
        const carte = Phaser.Utils.Array.GetRandom(["niveau1", "niveau2"]);
        this.scene.start(carte, { mode: 2 });
      } else {
        this.scene.start("niveau1", { mode: 1 });
      }
    };
    const retour_menu = () => this.scene.start("Menu");

    rejouer.on("pointerdown", relancer);
    menu.on("pointerdown", retour_menu);
    //petit délai : évite de passer l'écran par erreur si les joueurs sont encore en train d'appuyer sur I / R / O / T
    this.time.delayedCall(700, () => {
      let choisi = false;
      const une_fois = (action) => () => { if (!choisi) { choisi = true; action(); } };
      TOUCHES.valider.forEach((t) => this.input.keyboard.on("keydown-" + t, une_fois(relancer)));
      TOUCHES.retour.forEach((t) => this.input.keyboard.on("keydown-" + t, une_fois(retour_menu)));
    });
  }
}