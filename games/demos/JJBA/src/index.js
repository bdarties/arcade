import Phaser from "phaser";
import accueil from "/src/js/accueil.js";
import cinematique1 from "/src/js/cinematique1.js";
import round1 from "/src/js/round1.js";
import round2 from "/src/js/round2.js";
import round3 from "/src/js/round3.js";
import transition12 from "/src/js/transition12.js";
import transition23 from "/src/js/transition23.js";
import finjotaro from "/src/js/finjotaro.js";
import findio from "/src/js/findio.js";
import infos from "/src/js/infos.js";
import entrainement from "/src/js/entrainement.js";

var config = {
  type: Phaser.AUTO,
  width: 1920,
  height: 1080,
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        y: 3000
      },
      debug: false
    }
  },
  scene: [
    accueil,
    cinematique1,
    round1,
    round2,
    round3,
    transition12,
    transition23,
    finjotaro,
    findio,
    infos,
    entrainement
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

var game = new Phaser.Game(config);
game.scene.start("accueil");
