import { ECRANS } from "./maps.js";

export default class fin extends Phaser.Scene {
  constructor() {
    super({ key: "fin" });
  }

  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    if (!this.textures.exists("fin_image")) this.load.image("fin_image", ECRANS.fin);
    if (!this.textures.exists("rejouer")) this.load.image("rejouer", ECRANS.boutonRejouer);
  }

  create() {
    this.cameras.main.fadeIn(500);
    this.parti = false;
    this.pret = false; // évite de quitter l'écran tout de suite si le bouton est encore appuyé
    this.time.delayedCall(1000, () => (this.pret = true));

    const L = this.scale.width;
    const H = this.scale.height;

    if (this.textures.exists("fin_image")) {
      const image = this.add.image(L / 2, H / 2, "fin_image");
      image.setScale(Math.min(L / image.width, H / image.height));
    } else {
      this.add
        .text(L / 2, H / 2, "Vous avez réussi à vous échapper !", { fontSize: "48px", color: "#ffffff" })
        .setOrigin(0.5);
    }

    if (this.textures.exists("rejouer")) {
      // bouton Rejouer (ton image) : ramène à l'accueil
      const bouton = this.add.image(L / 2, H - 80, "rejouer").setScale(0.5).setInteractive({ useHandCursor: true });
      bouton.on("pointerover", () => bouton.setScale(0.55)); // grossit un peu au survol
      bouton.on("pointerout", () => bouton.setScale(0.5));
      bouton.on("pointerdown", () => this.retour());
      this.add
        .text(L / 2, H - 24, "(ou appuie sur le bouton A)", { fontSize: "16px", color: "#cccccc" })
        .setOrigin(0.5)
        .setShadow(2, 2, "#000000", 4);
    } else {
      this.add
        .text(L / 2, H - 25, "Bouton A : retour à l'accueil", { fontSize: "20px", color: "#cccccc" })
        .setOrigin(0.5)
        .setShadow(2, 2, "#000000", 4);
    }

    // souris / écran tactile ( JUSTE POUR TESTER, POUR LA BORNE ON L ENLEVERA )
    this.input.on("pointerdown", () => this.retour());

    // clavier / borne
    const K = Phaser.Input.Keyboard.KeyCodes;
    const valider = [K.ENTER, K.SPACE, K.I, K.R];
    this.input.keyboard.on("keydown", (e) => {
      if (!e.repeat && valider.includes(e.keyCode)) this.retour();
    });
  }

  retour() {
    if (!this.pret || this.parti) return;
    this.parti = true;
    this.registry.remove("finPartie"); // le timer repartira de zéro à la prochaine partie
    this.registry.remove("cle");
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("accueil"));
  }
}
