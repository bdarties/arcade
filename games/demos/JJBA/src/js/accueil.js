import Phaser from "phaser";

export default class accueil extends Phaser.Scene {
  constructor() {
    super({ key: "accueil" }); // mettre le meme nom que le nom de la classe
  }

  preload() {
    this.load.audio("StandProud", "src/sounds/StandProud.mp3");
    this.load.image("wallpaper", "src/assets/Wallpaper.jpg");
    this.load.image("start", "src/assets/Bouton-Start.png");
    this.load.image("settings", "src/assets/Bouton-Settings.png");
    this.load.image("training", "src/assets/Bouton-Training.png");
    this.load.image("logo", "src/assets/Jojo_logo.png");
    this.load.image("logoTF", "src/assets/Time Fighters Logo.png");
  }

  create() {
    this.game.config.StandProud;
    this.game.config.StandProud = this.sound.add("StandProud");
    this.game.config.StandProud.loop = true;
    this.game.config.StandProud.play();

    this.add.image(960, 540, "wallpaper");
    this.add.image(960, 300, "logo");
    this.add.image(960, 110, "logoTF");

    var bouton_play = this.add.image(960, 540, "start").setDepth(1);
    var bouton_info = this.add.image(960, 690, "settings").setDepth(1);
    var bouton_training = this.add.image(960, 840, "training").setDepth(1);

    //on rend le bouton interratif
    bouton_play.setInteractive();
    bouton_info.setInteractive();
    bouton_training.setInteractive();

    //Cas ou la souris passe sur le bouton play
    bouton_play.on("pointerover", () => {
      bouton_play.setScale(0.9);
    });

    bouton_info.on("pointerover", () => {
      bouton_info.setScale(0.9);
    });

    bouton_training.on("pointerover", () => {
      bouton_training.setScale(0.9);
    });

    //Cas ou la souris ne passe plus sur le bouton play
    bouton_play.on("pointerout", () => {
      bouton_play.setScale(1);
    });

    bouton_info.on("pointerout", () => {
      bouton_info.setScale(1);
    });

    bouton_training.on("pointerout", () => {
      bouton_training.setScale(1);
    });

    //Cas ou la sourris clique sur le bouton play :
    // on lance le niveau 1
    bouton_play.on("pointerup", () => {
      this.game.config.StandProud.stop();
      this.scene.start("cinematique1");
    });

    bouton_info.on("pointerup", () => {
      this.scene.start("infos");
    });

    bouton_training.on("pointerup", () => {
      this.game.config.StandProud.stop();
      this.scene.start("entrainement");
    });
  }

  update() {}
}
