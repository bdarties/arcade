export default class Game_over extends Phaser.Scene {
  constructor() {
    super({
      key: "Game_over"
    });
  }

  init(data) {
    this.donnees = data || {}; // { raison, niveau, scoreJ1, scoreJ2, deux_joueurs }
  }

  create() {
    const { raison, niveau, scoreJ1, scoreJ2, deux_joueurs } = this.donnees;

    let message = "Vous êtes tombé au combat...";
    if (raison === "temps") {
      message = "Le temps est écoulé !";
    } else if (raison === "vie_J1") {
      message = deux_joueurs ? "Le joueur 1 est tombé au combat..." : message;
    } else if (raison === "vie_J2") {
      message = "Le joueur 2 est tombé au combat...";
    }

    const style = (taille, couleur = "#ffffff") => ({
      fontFamily: "Arial, sans-serif",
      fontSize: taille + "px",
      color: couleur,
      align: "center"
    });

    this.cameras.main.setBackgroundColor("#1a0a0a");
    this.add.text(640, 190, "GAME OVER", style(72, "#c04545")).setOrigin(0.5);
    this.add.text(640, 290, message, style(30)).setOrigin(0.5);

    const texte_score = deux_joueurs
      ? `Score J1 : ${scoreJ1 ?? 0}   -   Score J2 : ${scoreJ2 ?? 0}`
      : `Score : ${scoreJ1 ?? 0}`;
    this.add.text(640, 370, texte_score, style(26)).setOrigin(0.5);

    const rejouer = this.add.text(640, 490, "Entrée : rejouer le niveau", style(26, "#f1c489"))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    const menu = this.add.text(640, 550, "Échap : retour au menu", style(26, "#f1c489"))
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    const relancer = () => this.scene.start(niveau || "niveau1", { mode: deux_joueurs ? 2 : 1 });
    const retour_menu = () => this.scene.start("Menu");

    rejouer.on("pointerdown", relancer);
    menu.on("pointerdown", retour_menu);
    this.input.keyboard.once("keydown-ENTER", relancer);
    this.input.keyboard.once("keydown-ESC", retour_menu);
  }
}