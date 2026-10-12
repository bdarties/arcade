import { ECRANS } from "./maps.js";

// Écran d'histoire : une ou plusieurs images racontent le début de l'aventure,
// puis le jeu démarre. Les images se règlent dans maps.js (ECRANS.histoire).
// Si aucune image n'est trouvée, on passe directement au jeu.
export default class histoire extends Phaser.Scene {
  constructor() {
    super({ key: "histoire" });
  }

  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    ECRANS.histoire.forEach((fichier, i) => {
      if (!this.textures.exists("histoire_" + i)) this.load.image("histoire_" + i, fichier);
    });
  }

  create() {
    // on ne garde que les images qui ont bien été chargées
    this.pages = ECRANS.histoire.map((f, i) => "histoire_" + i).filter((cle) => this.textures.exists(cle));
    if (this.pages.length === 0) {
      this.scene.start("jeu", { map: "map1" });
      return;
    }

    this.cameras.main.fadeIn(300);
    this.numero = 0;
    this.parti = false;
    this.pret = false; // évite de sauter l'image si le joueur garde le doigt sur le bouton
    this.time.delayedCall(600, () => (this.pret = true));

    const L = this.scale.width;
    const H = this.scale.height;
    this.image = this.add.image(L / 2, H / 2, this.pages[0]);
    this.ajuster();

    this.add
      .text(L / 2, H - 25, "Bouton A : continuer", { fontSize: "20px", color: "#cccccc" })
      .setOrigin(0.5)
      .setShadow(2, 2, "#000000", 4)
      .setDepth(10);

    // souris / écran tactile ( JUSTE POUR TESTER, POUR LA BORNE ON L ENLEVERA )
    this.input.on("pointerdown", () => this.suivant());

    // clavier / borne
    const K = Phaser.Input.Keyboard.KeyCodes;
    const valider = [K.ENTER, K.SPACE, K.I, K.R];
    this.input.keyboard.on("keydown", (e) => {
      if (!e.repeat && valider.includes(e.keyCode)) this.suivant();
    });
  }

  // l'image est agrandie ou réduite pour remplir l'écran sans être déformée
  ajuster() {
    const L = this.scale.width;
    const H = this.scale.height;
    const echelle = Math.min(L / this.image.width, H / this.image.height);
    this.image.setScale(echelle);
  }

  // page suivante, ou début du jeu après la dernière page
  suivant() {
    if (!this.pret || this.parti) return;
    this.numero++;
    if (this.numero < this.pages.length) {
      this.image.setTexture(this.pages[this.numero]);
      this.ajuster();
      return;
    }
    this.parti = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("jeu", { map: "map1" }));
  }
}
