import { creerClavierMenu } from "./controles.js";

const POLICE = 'Georgia, "Goudy Bookletter 1911", Times, serif';
const SCENE_RETOUR = "accueil";

export default class gameover extends Phaser.Scene {
  constructor() {
    super({ key: "gameover" });
  }

  create() {
    this.enTransition = false;
    this.clavier = creerClavierMenu(this);
    this.cameras.main.fadeIn(800, 0, 0, 0);

    this.add.image(640, 360, "img_gameover");

    // Le texte clignote doucement pour inviter à appuyer
    const consigne = this.add
      .text(640, 680, "Bouton A / Entrée : retour à l'accueil", {
        fontFamily: POLICE,
        fontSize: "16pt",
        color: "#e8d9b0",
        stroke: "#000000",
        strokeThickness: 5
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: consigne,
      alpha: 0.35,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }

  update() {
    if (this.enTransition == false && this.clavier.presse("valider")) {
      this.enTransition = true;
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start(SCENE_RETOUR);
      });
    }
  }
}
