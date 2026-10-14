import { INTRO } from "./histoire_data.js";

export default class accueil extends Phaser.Scene {
  constructor() {
    super({ key: "accueil" });
  }

  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    // adapte les chemins à tes vrais fichiers
    this.load.image("fond_accueil", "./assets/ecrans/acceuil.png");
    this.load.audio("musique_menu", "./assets/musique/menu.mp3");
  }

  create() {
    const w = this.game.config.width;
    const h = this.game.config.height;

    // fond : derrière tout le reste
    this.add
      .image(w / 2, h / 2, "fond_accueil")
      .setDisplaySize(w, h)
      .setDepth(-1);

    // boutons sous le titre
    const bouton_play = this.creerBouton(w * 0.75, 420, "JOUER");
    const bouton_controls = this.creerBouton(w * 0.75, 510, "CONTRÔLES");
    const bouton_credits = this.creerBouton(w * 0.75, 600, "CRÉDITS");

    bouton_play.on("pointerup", () =>
      this.scene.start("histoire", { slides: INTRO, suite: "exterieur", suiteData: {} })
    );
    bouton_controls.on("pointerup", () => this.scene.start("controls"));
    bouton_credits.on("pointerup", () => this.scene.start("credits"));

    // musique du menu : si elle joue déjà (retour depuis contrôles/crédits), on ne la relance pas
    let musique =
      this.sound.get("musique_menu") || this.sound.add("musique_menu", { loop: true, volume: 0.5 });
    if (!musique.isPlaying) musique.play();
  }

  // crée un bouton texte avec effet au survol
  creerBouton(x, y, texte) {
    const bouton = this.add
      .text(x, y, texte, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: "40px",
        color: "#ffffff"
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    bouton.on("pointerover", () => {
      bouton.setScale(1.15);
      bouton.setColor("#ff0000");
    });
    bouton.on("pointerout", () => {
      bouton.setScale(1);
      bouton.setColor("#ffffff");
    });
    return bouton;
  }
}
