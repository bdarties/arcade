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
    if (!this.textures.exists("retour_menu")) this.load.image("retour_menu", ECRANS.boutonMenu);
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

    // 2 boutons : Rejouer (nouvelle partie) / Retour au menu. Joystick gauche / droite pour choisir, bouton B pour valider.
    this.choix = 0;
    this.boutons = [];
    [["rejouer", "rejouer"], ["retour_menu", "accueil"]].forEach(([cle, suite], i) => {
      if (!this.textures.exists(cle)) return;
      const b = this.add.image(L / 2 + (i === 0 ? -230 : 230), H - 80, cle).setInteractive({ useHandCursor: true });
      b.suite = suite;
      b.on("pointerover", () => {
        this.choix = this.boutons.indexOf(b);
        this.majBoutons();
      });
      b.on("pointerdown", () => this.quitter(b.suite));
      this.boutons.push(b);
    });
    this.majBoutons();
    this.add
      .text(L / 2, H - 24, "Joystick : choisir      Bouton B : valider", { fontSize: "16px", color: "#cccccc" })
      .setOrigin(0.5)
      .setShadow(2, 2, "#000000", 4);

    // clavier / borne
    const K = Phaser.Input.Keyboard.KeyCodes;
    const valider = [K.ENTER, K.SPACE, K.O, K.T];
    const gauche = [K.LEFT, K.UP, K.Q, K.Z];
    const droite = [K.RIGHT, K.DOWN, K.D, K.S];
    this.input.keyboard.on("keydown", (e) => {
      if (e.repeat) return;
      if (gauche.includes(e.keyCode) || droite.includes(e.keyCode)) {
        this.choix = Phaser.Math.Clamp(this.choix + (droite.includes(e.keyCode) ? 1 : -1), 0, this.boutons.length - 1);
        this.majBoutons();
      } else if (valider.includes(e.keyCode) && this.boutons.length) {
        this.quitter(this.boutons[this.choix].suite);
      }
    });
  }

  // le bouton choisi grossit, l'autre est assombri
  majBoutons() {
    this.boutons.forEach((b, i) => {
      const actif = i === this.choix;
      b.setScale(actif ? 0.55 : 0.47);
      actif ? b.clearTint() : b.setTint(0x888888);
    });
  }

  // suite : "rejouer" (nouvelle partie) ou "accueil" (retour au menu)
  quitter(suite) {
    if (!this.pret || this.parti) return;
    this.parti = true;
    // on passe par l'écran des scores pour sauvegarder le score (la partie est remise à zéro là-bas)
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("scores", { scores: this.scores, suite: suite }));
  }
}