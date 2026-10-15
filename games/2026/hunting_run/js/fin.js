import { ECRANS } from "./maps.js";
import { scoresDeLaPartie } from "./scores.js";

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

    // score final : un par joueur en duo
    this.scores = scoresDeLaPartie(this.registry);
    const txt = this.scores.map((x) => (x.joueur ? "J" + x.joueur + " : " : "SCORE : ") + x.score).join("      ");
    this.add
      .text(L / 2, 335, txt, { fontFamily: "Georgia, serif", fontSize: this.scores.length > 1 ? "38px" : "44px", color: "#ffd24a", fontStyle: "bold" })
      .setOrigin(0.5)
      .setShadow(3, 3, "#000000", 6);

    if (this.textures.exists("rejouer")) {
      // bouton Rejouer (ton image) : ramène à l'accueil
      const bouton = this.add.image(L / 2, H - 80, "rejouer").setScale(0.5).setInteractive({ useHandCursor: true });
      bouton.on("pointerover", () => bouton.setScale(0.55)); // grossit un peu au survol
      bouton.on("pointerout", () => bouton.setScale(0.5));
      bouton.on("pointerdown", () => this.retour());
      this.add
        .text(L / 2, H - 24, "(ou appuie sur le bouton B)", { fontSize: "16px", color: "#cccccc" })
        .setOrigin(0.5)
        .setShadow(2, 2, "#000000", 4);
    } else {
      this.add
        .text(L / 2, H - 25, "Bouton B : retour à l'accueil", { fontSize: "20px", color: "#cccccc" })
        .setOrigin(0.5)
        .setShadow(2, 2, "#000000", 4);
    }

    // souris / écran tactile ( JUSTE POUR TESTER, POUR LA BORNE ON L ENLEVERA )
    this.input.on("pointerdown", () => this.retour());

    // clavier / borne
    const K = Phaser.Input.Keyboard.KeyCodes;
    const valider = [K.ENTER, K.SPACE, K.O, K.G];
    this.input.keyboard.on("keydown", (e) => {
      if (!e.repeat && valider.includes(e.keyCode)) this.retour();
    });
  }

  retour() {
    if (!this.pret || this.parti) return;
    this.parti = true;
    // on passe par l'écran des scores pour sauvegarder le score (la partie est remise à zéro là-bas)
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("scores", { scores: this.scores, suite: "accueil" }));
  }
}
