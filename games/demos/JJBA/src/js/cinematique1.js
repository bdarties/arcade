import Phaser from "phaser";

var claviercinematique;
var cpt = 2;
var a = true;
var SPvsTW;
var StandExplain;
var Stando;
var JvsD;
var OSTDio;
var TimeStop;
var TimeResume;

export default class cinematique1 extends Phaser.Scene {
  constructor() {
    super({ key: "cinematique1" }); // mettre le meme nom que le nom de la classe
  }

  preload() {
    this.load.audio("HFH", "src/sounds/HungryForHeaven.mp3");
    this.load.audio("SPvsTW", "src/sounds/SPvsTW.mp3");
    this.load.audio("StandExplain", "src/sounds/StandExplain.mp3");
    this.load.audio("Stando", "src/sounds/STANDO.mp3");
    this.load.audio("JvsD", "src/sounds/JotaroVsDio.mp3");
    this.load.audio("OSTDio", "src/sounds/OST Dio.mp3");
    this.load.audio("TimeResumeC", "src/sounds/TimeResume.mp3");
    this.load.audio("TimeStopC", "src/sounds/TimeStop.mp3");

    this.load.image("f1", "src/assets/Screen1.jpg");
    this.load.image("f2", "src/assets/Screen2.jpg");
    this.load.image("f3", "src/assets/Screen3.jpg");
    this.load.image("f4", "src/assets/Screen4.jpg");
    this.load.image("f5", "src/assets/Screen5.jpg");
    this.load.image("f6", "src/assets/Screen6.jpg");
    this.load.image("f7", "src/assets/Screen7.jpg");
    this.load.image("f8", "src/assets/Screen8.jpg");

    this.load.image("skip", "src/assets/Bouton-Skip.png");
  }

  create() {
    var bouton_skip = this.add.image(1800, 50, "skip").setDepth(1);
    bouton_skip.setInteractive();

    bouton_skip.on("pointerover", () => {
      bouton_skip.setScale(0.9);
    });

    bouton_skip.on("pointerout", () => {
      bouton_skip.setScale(1);
    });

    bouton_skip.on("pointerup", () => {
      cpt = 2;
      Stando.stop();
      StandExplain.stop();
      JvsD.stop();
      SPvsTW.stop();
      OSTDio.stop();

      this.scene.start("round1");
    });

    SPvsTW = this.sound.add("SPvsTW");
    StandExplain = this.sound.add("StandExplain");
    Stando = this.sound.add("Stando");
    JvsD = this.sound.add("JvsD");
    OSTDio = this.sound.add("OSTDio");
    TimeStop = this.sound.add("TimeStopC");
    TimeResume = this.sound.add("TimeResumeC");
    OSTDio.volume = 0.6;
    OSTDio.play();

    this.add.image(960, 540, "f1");

    claviercinematique = this.input.keyboard.createCursorKeys();
  }

  update() {
    if (claviercinematique.space.isDown && a == true) {
      if (cpt == 2) {
        this.add.image(960, 540, "f2");
        Stando.play();
      } else if (cpt == 3) {
        this.add.image(960, 540, "f3");
        StandExplain.play();
      } else if (cpt == 4) {
        this.add.image(960, 540, "f4");
      } else if (cpt == 5) {
        this.add.image(960, 540, "f5");
        TimeStop.play();
        OSTDio.stop();
        StandExplain.stop();
      } else if (cpt == 6) {
        this.add.image(960, 540, "f6");
        TimeResume.play();
        setTimeout(() => {
          OSTDio.play();
          JvsD.play();
        }, 1500);
      } else if (cpt == 7) {
        this.add.image(960, 540, "f7");
      } else if (cpt == 8) {
        this.add.image(960, 540, "f8");
        SPvsTW.play();
        Stando.stop();
        JvsD.stop();
        OSTDio.stop();
      } else if (cpt == 9) {
        cpt = 1;
        Stando.stop();
        StandExplain.stop();
        JvsD.stop();
        SPvsTW.stop();
        OSTDio.stop();

        this.scene.start("round1");
      }
      cpt += 1;
      a = false;
    }
    if (claviercinematique.space.isUp) {
      a = true;
    }
  }
}
