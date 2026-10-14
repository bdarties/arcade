import Phaser from "phaser";
import round1 from "./round1";

var Dio;
var TheWorld;
var Jotaro;
var StarPlatinium;
var numAnimJotaro = 0;
var numAnimDio = 0;
var Groupe_Plateformes;
var Fond;
var Z;
var Q;
var S;
var D;
var A;
var E;
var R;
var F;

var O;
var K;
var L;
var M;
var I;
var P;
var U;
var J;

var Space;

var GroupeCuts;
var cut = null;
var m = false;
var coefDir;
var nbCutsJotaro = 15;
var nbCutsDio = 15;

var GroupeAsteroides;
var Asteroide;

var BarreHPJotaro;
var BarreHPDio;
var BarreSP;
var BarreTW;

var cptJotaroHP;
var cptDioHP;
var j = true;
var d = true;

var AuraJotaro;
var AuraDio;
var SuperAuraJotaro;
var SuperAuraDio;

var JotaroCut1;
var JotaroCut2;
var JotaroCut3;
var JotaroCut4;
var JotaroCut5;
var JotaroCut6;
var JotaroCut7;
var JotaroCut8;
var JotaroCut9;
var JotaroCut10;
var JotaroCut11;
var JotaroCut12;
var JotaroCut13;
var JotaroCut14;
var JotaroCut15;

var DioCut1;
var DioCut2;
var DioCut3;
var DioCut4;
var DioCut5;
var DioCut6;
var DioCut7;
var DioCut8;
var DioCut9;
var DioCut10;
var DioCut11;
var DioCut12;
var DioCut13;
var DioCut14;
var DioCut15;

var Muda;
var Muda_Barrage;
var TW_TimeStop;
var TW_Summon;

var Ora;
var Ora_Barrage;
var SP_TimeStop;
var SP_Summon;

var Stand_Dissapear;

var Cut_Throw;
var Cut_Stab;

var MB = false;
var OB = false;

var OSTGiorno;

var coeff;

var TimeStop = false;
var k = false;

var TimeStopSound;
var TimeResumeSound;

export default class round3 extends Phaser.Scene {
  constructor() {
    super({
      key: "round3",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 1500 }
        }
      }
    });
  }
  preload() {
    this.load.audio("OSTGiorno", "src/sounds/OST Giorno.mp3");

    this.load.image("fond3", "src/assets/FutureWallpaper.jpg");
    this.load.image("Asteroide", "src/assets/Asteroide.png");
  }

  create() {
    OSTGiorno = this.sound.add("OSTGiorno");
    OSTGiorno.loop = true;
    OSTGiorno.play();

    TimeStopSound = this.sound.add("TimeStop");
    TimeResumeSound = this.sound.add("TimeResume");

    var bouton_pause = this.add.image(960, 200, "pause").setDepth(11);
    var bouton_exit = this.add.image(960, 500, "exit").setDepth(11);
    var bouton_resume = this.add.image(960, 650, "resume").setDepth(11);

    bouton_exit.setVisible(false);
    bouton_resume.setVisible(false);

    bouton_pause.setScale(0.7);
    bouton_pause.setInteractive();
    bouton_exit.setInteractive();
    bouton_resume.setInteractive();

    bouton_pause.on("pointerover", () => {
      bouton_pause.setScale(0.6);
    });

    bouton_exit.on("pointerover", () => {
      bouton_exit.setScale(0.9);
    });

    bouton_resume.on("pointerover", () => {
      bouton_resume.setScale(0.9);
    });

    bouton_pause.on("pointerout", () => {
      bouton_pause.setScale(0.7);
    });

    bouton_exit.on("pointerout", () => {
      bouton_exit.setScale(1);
    });

    bouton_resume.on("pointerout", () => {
      bouton_resume.setScale(1);
    });

    bouton_pause.on("pointerup", () => {
      TimeStopSound.play();
      OSTGiorno.volume = 0;

      Dio.isFreeze = true;
      Dio.stop();
      TheWorld.stop();
      Dio.body.allowGravity = false;
      Dio.setVelocity(0, 0);
      Dio.setTint(0x444444);
      TheWorld.setTint(0x444444);

      Jotaro.isFreeze = true;
      Jotaro.stop();
      StarPlatinium.stop();
      Jotaro.body.allowGravity = false;
      Jotaro.setVelocity(0, 0);
      Jotaro.setTint(0x444444);
      StarPlatinium.setTint(0x444444);
      Fond.setTint(0x444444);

      if (Asteroide == null) {
      } else {
        Asteroide.setMaxVelocity(0, 0);
        Asteroide.setTint(0x444444);
        k = true;
      }

      TimeStop = true;

      bouton_exit.setVisible(true);
      bouton_resume.setVisible(true);
    });

    bouton_exit.on("pointerup", () => {
      nbCutsJotaro = 15;
      nbCutsDio = 15;
      this.scene.start("accueil");
    });

    bouton_resume.on("pointerup", () => {
      TimeResumeSound.play();
      OSTGiorno.volume = 1;
      Jotaro.body.allowGravity = true;
      Jotaro.isFreeze = false;
      Jotaro.setTint(0xffffff);
      StarPlatinium.setTint(0xffffff);

      Dio.body.allowGravity = true;
      Dio.isFreeze = false;
      Dio.setTint(0xffffff);
      TheWorld.setTint(0xffffff);

      Fond.setTint(0xffffff);

      if (k == true) {
        k = false;
        Asteroide.setMaxVelocity(10000, 10000);
        Asteroide.setTint(0xffffff);
      }

      TimeStop = false;

      bouton_exit.setVisible(false);
      bouton_resume.setVisible(false);
    });

    Muda = this.sound.add("Muda");
    Muda_Barrage = this.sound.add("Muda_Barrage");
    TW_TimeStop = this.sound.add("TheWorld_StopTime");
    TW_Summon = this.sound.add("TheWorld_Summon");

    Muda_Barrage.loop = true;

    Ora = this.sound.add("Ora");
    Ora_Barrage = this.sound.add("Ora_Barrage");
    SP_TimeStop = this.sound.add("StarPlatinium_TimeStop");
    SP_Summon = this.sound.add("StarPlatinium_Summon");

    Ora_Barrage.loop = true;

    Stand_Dissapear = this.sound.add("Stand_Dissapear");

    Cut_Stab = this.sound.add("Cut_Stab");
    Cut_Throw = this.sound.add("Cut_Throw");

    Cut_Throw.volume = 0.5;

    Groupe_Plateformes = this.physics.add.staticGroup();
    Groupe_Plateformes.create(960, 1030, "plateformesol");
    Fond = this.add.image(960, 540, "fond3");
    GroupeCuts = this.physics.add.group();
    GroupeAsteroides = this.physics.add.group();

    this.physics.world.on("worldbounds", function (body) {
      var objet = body.gameObject;
      if (GroupeCuts.contains(objet)) {
        cut = null;
        m = false;
        objet.destroy();
      }
    });

    this.add.image(960, 90, "VS");

    BarreHPJotaro = this.physics.add.sprite(550, 200, "Barre_HP_Jotaro");
    BarreHPJotaro.body.allowGravity = false;
    BarreHPJotaro.body.immovable = true;

    BarreHPDio = this.physics.add.sprite(1370, 200, "Barre_HP_Dio");
    BarreHPDio.body.allowGravity = false;
    BarreHPDio.body.immovable = true;

    BarreSP = this.physics.add.sprite(371, 250, "Barre_SP");
    BarreSP.body.allowGravity = false;
    BarreSP.body.immovable = true;

    BarreTW = this.physics.add.sprite(1549, 250, "Barre_TW");
    BarreTW.body.allowGravity = false;
    BarreTW.body.immovable = true;

    AuraJotaro = this.physics.add.sprite(150, 150, "Aura");
    AuraJotaro.body.allowGravity = false;
    AuraJotaro.body.immovable = true;
    AuraJotaro.setVisible(false);

    AuraDio = this.physics.add.sprite(1770, 150, "Aura");
    AuraDio.body.allowGravity = false;
    AuraDio.body.immovable = true;
    AuraDio.setVisible(false);

    SuperAuraJotaro = this.physics.add.sprite(150, 120, "SuperAura");
    SuperAuraJotaro.body.allowGravity = false;
    SuperAuraJotaro.body.immovable = true;
    SuperAuraJotaro.setVisible(false);

    SuperAuraDio = this.physics.add.sprite(1770, 120, "SuperAura");
    SuperAuraDio.body.allowGravity = false;
    SuperAuraDio.body.immovable = true;
    SuperAuraDio.setVisible(false);

    this.add.image(150, 150, "Jotaro_icon");
    this.add.image(1770, 150, "Dio_icon");

    JotaroCut1 = this.physics.add.sprite(300, 110, "Cut");
    JotaroCut1.body.allowGravity = false;
    JotaroCut1.body.immovable = true;

    JotaroCut2 = this.physics.add.sprite(340, 110, "Cut");
    JotaroCut2.body.allowGravity = false;
    JotaroCut2.body.immovable = true;

    JotaroCut3 = this.physics.add.sprite(380, 110, "Cut");
    JotaroCut3.body.allowGravity = false;
    JotaroCut3.body.immovable = true;

    JotaroCut4 = this.physics.add.sprite(420, 110, "Cut");
    JotaroCut4.body.allowGravity = false;
    JotaroCut4.body.immovable = true;

    JotaroCut5 = this.physics.add.sprite(460, 110, "Cut");
    JotaroCut5.body.allowGravity = false;
    JotaroCut5.body.immovable = true;

    JotaroCut6 = this.physics.add.sprite(500, 110, "Cut");
    JotaroCut6.body.allowGravity = false;
    JotaroCut6.body.immovable = true;

    JotaroCut7 = this.physics.add.sprite(540, 110, "Cut");
    JotaroCut7.body.allowGravity = false;
    JotaroCut7.body.immovable = true;

    JotaroCut8 = this.physics.add.sprite(580, 110, "Cut");
    JotaroCut8.body.allowGravity = false;
    JotaroCut8.body.immovable = true;

    JotaroCut9 = this.physics.add.sprite(620, 110, "Cut");
    JotaroCut9.body.allowGravity = false;
    JotaroCut9.body.immovable = true;

    JotaroCut10 = this.physics.add.sprite(660, 110, "Cut");
    JotaroCut10.body.allowGravity = false;
    JotaroCut10.body.immovable = true;

    JotaroCut11 = this.physics.add.sprite(700, 110, "Cut");
    JotaroCut11.body.allowGravity = false;
    JotaroCut11.body.immovable = true;

    JotaroCut12 = this.physics.add.sprite(740, 110, "Cut");
    JotaroCut12.body.allowGravity = false;
    JotaroCut12.body.immovable = true;

    JotaroCut13 = this.physics.add.sprite(780, 110, "Cut");
    JotaroCut13.body.allowGravity = false;
    JotaroCut13.body.immovable = true;

    JotaroCut14 = this.physics.add.sprite(820, 110, "Cut");
    JotaroCut14.body.allowGravity = false;
    JotaroCut14.body.immovable = true;

    JotaroCut15 = this.physics.add.sprite(860, 110, "Cut");
    JotaroCut15.body.allowGravity = false;
    JotaroCut15.body.immovable = true;

    DioCut1 = this.physics.add.sprite(1620, 110, "Cut");
    DioCut1.body.allowGravity = false;
    DioCut1.body.immovable = true;

    DioCut2 = this.physics.add.sprite(1580, 110, "Cut");
    DioCut2.body.allowGravity = false;
    DioCut2.body.immovable = true;

    DioCut3 = this.physics.add.sprite(1540, 110, "Cut");
    DioCut3.body.allowGravity = false;
    DioCut3.body.immovable = true;

    DioCut4 = this.physics.add.sprite(1500, 110, "Cut");
    DioCut4.body.allowGravity = false;
    DioCut4.body.immovable = true;

    DioCut5 = this.physics.add.sprite(1460, 110, "Cut");
    DioCut5.body.allowGravity = false;
    DioCut5.body.immovable = true;

    DioCut6 = this.physics.add.sprite(1420, 110, "Cut");
    DioCut6.body.allowGravity = false;
    DioCut6.body.immovable = true;

    DioCut7 = this.physics.add.sprite(1380, 110, "Cut");
    DioCut7.body.allowGravity = false;
    DioCut7.body.immovable = true;

    DioCut8 = this.physics.add.sprite(1340, 110, "Cut");
    DioCut8.body.allowGravity = false;
    DioCut8.body.immovable = true;

    DioCut9 = this.physics.add.sprite(1300, 110, "Cut");
    DioCut9.body.allowGravity = false;
    DioCut9.body.immovable = true;

    DioCut10 = this.physics.add.sprite(1260, 110, "Cut");
    DioCut10.body.allowGravity = false;
    DioCut10.body.immovable = true;

    DioCut11 = this.physics.add.sprite(1220, 110, "Cut");
    DioCut11.body.allowGravity = false;
    DioCut11.body.immovable = true;

    DioCut12 = this.physics.add.sprite(1180, 110, "Cut");
    DioCut12.body.allowGravity = false;
    DioCut12.body.immovable = true;

    DioCut13 = this.physics.add.sprite(1140, 110, "Cut");
    DioCut13.body.allowGravity = false;
    DioCut13.body.immovable = true;

    DioCut14 = this.physics.add.sprite(1100, 110, "Cut");
    DioCut14.body.allowGravity = false;
    DioCut14.body.immovable = true;

    DioCut15 = this.physics.add.sprite(1060, 110, "Cut");
    DioCut15.body.allowGravity = false;
    DioCut15.body.immovable = true;

    Z = this.input.keyboard.addKey("Z");
    Q = this.input.keyboard.addKey("Q");
    S = this.input.keyboard.addKey("S");
    D = this.input.keyboard.addKey("D");
    A = this.input.keyboard.addKey("A");
    E = this.input.keyboard.addKey("E");
    R = this.input.keyboard.addKey("R");
    F = this.input.keyboard.addKey("F");

    O = this.input.keyboard.addKey("O");
    K = this.input.keyboard.addKey("K");
    L = this.input.keyboard.addKey("L");
    M = this.input.keyboard.addKey("M");
    I = this.input.keyboard.addKey("I");
    P = this.input.keyboard.addKey("P");
    U = this.input.keyboard.addKey("U");
    J = this.input.keyboard.addKey("J");

    Space = this.input.keyboard.addKey("Space");

    Dio = this.physics.add.sprite(1420, 800, "Dio_Standing_G");
    Dio.setDepth(10);
    TheWorld = this.add.sprite(900, 700, "Dio_Standing_TW_G");
    TheWorld.setVisible(false);
    Dio.direction = "gauche";
    Dio.setCollideWorldBounds(true);
    Dio.setSize(160, 370);
    Dio.setOffset(0, 0);
    Dio.stand = false;
    Dio.attaque = false;
    Dio.rush = false;
    Dio.tir = false;
    Dio.TW = false;
    Dio.Ulti = false;
    Dio.HP = 100;
    Dio.nbDegats = 0;
    Dio.recul = false;
    Dio.DoubleJump = false;
    Dio.SauterOK = true;
    Dio.isFreeze = false;
    Dio.TS = true;

    Jotaro = this.physics.add.sprite(500, 800, "Jotaro_Standing_D");
    Jotaro.setDepth(10);
    StarPlatinium = this.add.sprite(400, 700, "Jotaro_Standing_SP_D");
    StarPlatinium.setVisible(false);
    Jotaro.direction = "droite";
    Jotaro.setCollideWorldBounds(true);
    Jotaro.setSize(160, 370);
    Jotaro.setOffset(0, 0);
    Jotaro.stand = false;
    Jotaro.attaque = false;
    Jotaro.rush = false;
    Jotaro.tir = false;
    Jotaro.SP = false;
    Jotaro.Ulti = false;
    Jotaro.HP = 100;
    Jotaro.nbDegats = 0;
    Jotaro.recul = false;
    Jotaro.DoubleJump = false;
    Jotaro.SauterOK = true;
    Jotaro.isFreeze = false;
    Jotaro.TS = true;

    this.physics.add.collider(Dio, Groupe_Plateformes);
    this.physics.add.collider(Jotaro, Groupe_Plateformes);

    this.physics.add.overlap(GroupeCuts, Dio, hitJoueur, null, this);
    this.physics.add.overlap(GroupeCuts, Jotaro, hitJoueur, null, this);
    this.physics.add.overlap(
      GroupeAsteroides,
      Dio,
      hitJoueurAsteroide,
      null,
      this
    );
    this.physics.add.overlap(
      GroupeAsteroides,
      Jotaro,
      hitJoueurAsteroide,
      null,
      this
    );

    SuperAuraJotaro.anims.play("Anim_SuperAura", true);
    SuperAuraDio.anims.play("Anim_SuperAura", true);
    AuraJotaro.anims.play("Anim_Aura", true);
    AuraDio.anims.play("Anim_Aura", true);

    var TimerJotaroHP = this.time.addEvent({
      delay: 1000,
      callback: recupHPJotaro,
      args: [],
      callbackScope: this,
      repeat: -1
    });

    var TimerDioHP = this.time.addEvent({
      delay: 1000,
      callback: recupHPDio,
      args: [],
      callbackScope: this,
      repeat: -1
    });

    var TimerAsteroides = this.time.addEvent({
      delay: 3000,
      callback: TirAsteroides,
      args: [],
      callbackScope: this,
      repeat: -1
    });
  }

  update() {
    if (Jotaro.HP <= 0) {
      Muda_Barrage.stop();
      Ora_Barrage.stop();
      Jotaro.setVisible(true);
      StarPlatinium.setVisible(false);
      Dio.setVisible(true);
      TheWorld.setVisible(false);
      Dio.isFreeze = true;
      Jotaro.isFreeze = true;
      Jotaro.setVelocityX(0);
      Dio.setVelocityX(0);
      if (Jotaro.direction == "droite") {
        Jotaro.anims.play("Anim_Jotaro_Dead_D", true);
      } else {
        Jotaro.anims.play("Anim_Jotaro_Dead_G", true);
      }
      if (Dio.direction == "droite") {
        Dio.anims.play("Anim_Dio_Win_D", true);
      } else {
        Dio.anims.play("Anim_Dio_Win_G", true);
      }
      setTimeout(() => {
        nbCutsJotaro = 15;
        nbCutsDio = 15;
        OSTGiorno.stop();
        this.scene.start("findio");
      }, 3000);
    }
    if (Dio.HP <= 0) {
      Muda_Barrage.stop();
      Ora_Barrage.stop();
      Jotaro.setVisible(true);
      StarPlatinium.setVisible(false);
      Dio.setVisible(true);
      TheWorld.setVisible(false);
      Dio.isFreeze = true;
      Jotaro.isFreeze = true;
      Jotaro.setVelocityX(0);
      Dio.setVelocityX(0);
      if (Dio.direction == "droite") {
        Dio.anims.play("Anim_Dio_Dead_D", true);
      } else {
        Dio.anims.play("Anim_Dio_Dead_G", true);
      }
      if (Jotaro.direction == "droite") {
        Jotaro.anims.play("Anim_Jotaro_Win_D", true);
      } else {
        Jotaro.anims.play("Anim_Jotaro_Win_G", true);
      }
      setTimeout(() => {
        nbCutsJotaro = 15;
        nbCutsDio = 15;
        OSTGiorno.stop();
        this.scene.start("finjotaro");
      }, 3000);
    }

    if (nbCutsJotaro == 14) {
      JotaroCut15.setVisible(false);
    }
    if (nbCutsJotaro == 13) {
      JotaroCut14.setVisible(false);
    }
    if (nbCutsJotaro == 12) {
      JotaroCut13.setVisible(false);
    }
    if (nbCutsJotaro == 11) {
      JotaroCut12.setVisible(false);
    }
    if (nbCutsJotaro == 10) {
      JotaroCut11.setVisible(false);
    }
    if (nbCutsJotaro == 9) {
      JotaroCut10.setVisible(false);
    }
    if (nbCutsJotaro == 8) {
      JotaroCut9.setVisible(false);
    }
    if (nbCutsJotaro == 7) {
      JotaroCut8.setVisible(false);
    }
    if (nbCutsJotaro == 6) {
      JotaroCut7.setVisible(false);
    }
    if (nbCutsJotaro == 5) {
      JotaroCut6.setVisible(false);
    }
    if (nbCutsJotaro == 4) {
      JotaroCut5.setVisible(false);
    }
    if (nbCutsJotaro == 3) {
      JotaroCut4.setVisible(false);
    }
    if (nbCutsJotaro == 2) {
      JotaroCut3.setVisible(false);
    }
    if (nbCutsJotaro == 1) {
      JotaroCut2.setVisible(false);
    }
    if (nbCutsJotaro == 0) {
      JotaroCut1.setVisible(false);
    }

    if (nbCutsDio == 14) {
      DioCut15.setVisible(false);
    }
    if (nbCutsDio == 13) {
      DioCut14.setVisible(false);
    }
    if (nbCutsDio == 12) {
      DioCut13.setVisible(false);
    }
    if (nbCutsDio == 11) {
      DioCut12.setVisible(false);
    }
    if (nbCutsDio == 10) {
      DioCut11.setVisible(false);
    }
    if (nbCutsDio == 9) {
      DioCut10.setVisible(false);
    }
    if (nbCutsDio == 8) {
      DioCut9.setVisible(false);
    }
    if (nbCutsDio == 7) {
      DioCut8.setVisible(false);
    }
    if (nbCutsDio == 6) {
      DioCut7.setVisible(false);
    }
    if (nbCutsDio == 5) {
      DioCut6.setVisible(false);
    }
    if (nbCutsDio == 4) {
      DioCut5.setVisible(false);
    }
    if (nbCutsDio == 3) {
      DioCut4.setVisible(false);
    }
    if (nbCutsDio == 2) {
      DioCut3.setVisible(false);
    }
    if (nbCutsDio == 1) {
      DioCut2.setVisible(false);
    }
    if (nbCutsDio == 0) {
      DioCut1.setVisible(false);
    }

    if (Jotaro.nbDegats >= 80) {
      setTimeout(() => {
        Jotaro.SP = true;
      }, 300);
    }

    if (Dio.nbDegats >= 80) {
      setTimeout(() => {
        Dio.TW = true;
      }, 300);
    }

    if (Jotaro.HP <= 30 && Jotaro.TS) {
      Jotaro.Ulti = true;
    }

    if (Dio.HP <= 30 && Dio.TS) {
      Dio.Ulti = true;
    }

    if (Jotaro.isFreeze == false) {
      if (Jotaro.SP && Jotaro.Ulti) {
        SuperAuraJotaro.setVisible(true);
        AuraJotaro.setVisible(false);
      }
      if (Jotaro.SP && Jotaro.Ulti == false) {
        SuperAuraJotaro.setVisible(false);
        AuraJotaro.setVisible(true);
      }
      if (Jotaro.Ulti && Jotaro.SP == false) {
        SuperAuraJotaro.setVisible(true);
        AuraJotaro.setVisible(false);
      }
      if (Jotaro.SP == false && Jotaro.Ulti == false) {
        SuperAuraJotaro.setVisible(false);
        AuraJotaro.setVisible(false);
      }
    }

    if (Dio.isFreeze == false) {
      if (Dio.TW && Dio.Ulti) {
        SuperAuraDio.setVisible(true);
        AuraDio.setVisible(false);
      }
      if (Dio.TW && Dio.Ulti == false) {
        SuperAuraDio.setVisible(false);
        AuraDio.setVisible(true);
      }
      if (Dio.Ulti && Dio.TW == false) {
        SuperAuraDio.setVisible(true);
        AuraDio.setVisible(false);
      }
      if (Dio.TW == false && Dio.Ulti == false) {
        SuperAuraDio.setVisible(false);
        AuraDio.setVisible(false);
      }
    }

    if (
      Phaser.Input.Keyboard.JustDown(F) &&
      Jotaro.Ulti &&
      Jotaro.isFreeze == false
    ) {
      OSTGiorno.volume = 0;
      TimeStop = true;
      SP_TimeStop.play();
      Jotaro.TS = false;
      Dio.isFreeze = true;
      Dio.stop();
      TheWorld.stop();
      Dio.body.allowGravity = false;
      Dio.setVelocity(0, 0);
      Dio.setTint(0x444444);
      TheWorld.setTint(0x444444);
      Fond.setTint(0x444444);
      AuraDio.setVisible(false);
      SuperAuraDio.setVisible(false);
      if (Asteroide == null) {
      } else {
        Asteroide.setMaxVelocity(0, 0);
        Asteroide.setTint(0x444444);
        k = true;
      }
      if (cut == null) {
      } else {
        cut.setMaxVelocity(0, 0);
        cut.setTint(0x444444);
        m = true;
      }
      setTimeout(() => {
        OSTGiorno.volume = 1;
        TimeStop = false;
        Jotaro.Ulti = false;
        Dio.body.allowGravity = true;
        Dio.isFreeze = false;
        Dio.setTint(0xffffff);
        TheWorld.setTint(0xffffff);
        Fond.setTint(0xffffff);
        if (k == true) {
          k = false;
          Asteroide.setMaxVelocity(10000, 10000);
          Asteroide.setTint(0xffffff);
        }
      }, 4000);
    }

    if (
      Phaser.Input.Keyboard.JustDown(J) &&
      Dio.Ulti &&
      Dio.isFreeze == false
    ) {
      OSTGiorno.volume = 0;
      TimeStop = true;
      TW_TimeStop.play();
      Dio.TS = false;
      Jotaro.isFreeze = true;
      Jotaro.stop();
      StarPlatinium.stop();
      Jotaro.body.allowGravity = false;
      Jotaro.setVelocity(0, 0);
      Jotaro.setTint(0x444444);
      StarPlatinium.setTint(0x444444);
      Fond.setTint(0x444444);
      AuraJotaro.setVisible(false);
      SuperAuraJotaro.setVisible(false);
      if (Asteroide == null) {
      } else {
        Asteroide.setMaxVelocity(0, 0);
        Asteroide.setTint(0x444444);
        k = true;
      }
      if (cut == null) {
      } else {
        cut.setMaxVelocity(0, 0);
        cut.setTint(0x444444);
        m = true;
      }
      setTimeout(() => {
        OSTGiorno.volume = 1;
        TimeStop = false;
        Dio.Ulti = false;
        Jotaro.body.allowGravity = true;
        Jotaro.isFreeze = false;
        Jotaro.setTint(0xffffff);
        StarPlatinium.setTint(0xffffff);
        Fond.setTint(0xffffff);
        if (k == true) {
          k = false;
          Asteroide.setMaxVelocity(10000, 10000);
          Asteroide.setTint(0xffffff);
        }
        if (m == true) {
          m = false;
          cut.setMaxVelocity(10000, 10000);
          cut.setTint(0xffffff);
          cut.setVelocity(1500 * coefDir, 0);
        }
      }, 4000);
    }

    //////////////////
    //// BarresHP ////
    //////////////////

    if (Jotaro.HP == 100) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_100", true);
    }
    if (Jotaro.HP == 95) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_95", true);
    }
    if (Jotaro.HP == 90) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_90", true);
    }
    if (Jotaro.HP == 85) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_85", true);
    }
    if (Jotaro.HP == 80) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_80", true);
    }
    if (Jotaro.HP == 75) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_75", true);
    }
    if (Jotaro.HP == 70) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_70", true);
    }
    if (Jotaro.HP == 65) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_65", true);
    }
    if (Jotaro.HP == 60) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_60", true);
    }
    if (Jotaro.HP == 55) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_55", true);
    }
    if (Jotaro.HP == 50) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_50", true);
    }
    if (Jotaro.HP == 45) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_45", true);
    }
    if (Jotaro.HP == 40) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_40", true);
    }
    if (Jotaro.HP == 35) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_35", true);
    }
    if (Jotaro.HP == 30) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_30", true);
    }
    if (Jotaro.HP == 25) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_25", true);
    }
    if (Jotaro.HP == 20) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_20", true);
    }
    if (Jotaro.HP == 15) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_15", true);
    }
    if (Jotaro.HP == 10) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_10", true);
    }
    if (Jotaro.HP == 5) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_5", true);
    }
    if (Jotaro.HP == 0) {
      BarreHPJotaro.anims.play("Anim_Barre_HP_Jotaro_0", true);
    }

    if (Dio.HP == 100) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_100", true);
    }
    if (Dio.HP == 95) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_95", true);
    }
    if (Dio.HP == 90) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_90", true);
    }
    if (Dio.HP == 85) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_85", true);
    }
    if (Dio.HP == 80) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_80", true);
    }
    if (Dio.HP == 75) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_75", true);
    }
    if (Dio.HP == 70) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_70", true);
    }
    if (Dio.HP == 65) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_65", true);
    }
    if (Dio.HP == 60) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_60", true);
    }
    if (Dio.HP == 55) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_55", true);
    }
    if (Dio.HP == 50) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_50", true);
    }
    if (Dio.HP == 45) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_45", true);
    }
    if (Dio.HP == 40) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_40", true);
    }
    if (Dio.HP == 35) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_35", true);
    }
    if (Dio.HP == 30) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_30", true);
    }
    if (Dio.HP == 25) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_25", true);
    }
    if (Dio.HP == 20) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_20", true);
    }
    if (Dio.HP == 15) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_15", true);
    }
    if (Dio.HP == 10) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_10", true);
    }
    if (Dio.HP == 5) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_5", true);
    }
    if (Dio.HP == 0) {
      BarreHPDio.anims.play("Anim_Barre_HP_Dio_0", true);
    }

    if (Jotaro.nbDegats >= 100) {
      BarreSP.anims.play("Anim_Barre_SP_100", true);
    }
    if (Jotaro.nbDegats == 95) {
      BarreSP.anims.play("Anim_Barre_SP_95", true);
    }
    if (Jotaro.nbDegats == 90) {
      BarreSP.anims.play("Anim_Barre_SP_90", true);
    }
    if (Jotaro.nbDegats == 85) {
      BarreSP.anims.play("Anim_Barre_SP_85", true);
    }
    if (Jotaro.nbDegats == 80) {
      BarreSP.anims.play("Anim_Barre_SP_80", true);
    }
    if (Jotaro.nbDegats == 75) {
      BarreSP.anims.play("Anim_Barre_SP_75", true);
    }
    if (Jotaro.nbDegats == 70) {
      BarreSP.anims.play("Anim_Barre_SP_70", true);
    }
    if (Jotaro.nbDegats == 65) {
      BarreSP.anims.play("Anim_Barre_SP_65", true);
    }
    if (Jotaro.nbDegats == 60) {
      BarreSP.anims.play("Anim_Barre_SP_60", true);
    }
    if (Jotaro.nbDegats == 55) {
      BarreSP.anims.play("Anim_Barre_SP_55", true);
    }
    if (Jotaro.nbDegats == 50) {
      BarreSP.anims.play("Anim_Barre_SP_50", true);
    }
    if (Jotaro.nbDegats == 45) {
      BarreSP.anims.play("Anim_Barre_SP_45", true);
    }
    if (Jotaro.nbDegats == 40) {
      BarreSP.anims.play("Anim_Barre_SP_40", true);
    }
    if (Jotaro.nbDegats == 35) {
      BarreSP.anims.play("Anim_Barre_SP_35", true);
    }
    if (Jotaro.nbDegats == 30) {
      BarreSP.anims.play("Anim_Barre_SP_30", true);
    }
    if (Jotaro.nbDegats == 25) {
      BarreSP.anims.play("Anim_Barre_SP_25", true);
    }
    if (Jotaro.nbDegats == 20) {
      BarreSP.anims.play("Anim_Barre_SP_20", true);
    }
    if (Jotaro.nbDegats == 15) {
      BarreSP.anims.play("Anim_Barre_SP_15", true);
    }
    if (Jotaro.nbDegats == 10) {
      BarreSP.anims.play("Anim_Barre_SP_10", true);
    }
    if (Jotaro.nbDegats == 5) {
      BarreSP.anims.play("Anim_Barre_SP_5", true);
    }
    if (Jotaro.nbDegats == 0) {
      BarreSP.anims.play("Anim_Barre_SP_0", true);
    }

    if (Dio.nbDegats >= 100) {
      BarreTW.anims.play("Anim_Barre_TW_100", true);
    }
    if (Dio.nbDegats == 95) {
      BarreTW.anims.play("Anim_Barre_TW_95", true);
    }
    if (Dio.nbDegats == 90) {
      BarreTW.anims.play("Anim_Barre_TW_90", true);
    }
    if (Dio.nbDegats == 85) {
      BarreTW.anims.play("Anim_Barre_TW_85", true);
    }
    if (Dio.nbDegats == 80) {
      BarreTW.anims.play("Anim_Barre_TW_80", true);
    }
    if (Dio.nbDegats == 75) {
      BarreTW.anims.play("Anim_Barre_TW_75", true);
    }
    if (Dio.nbDegats == 70) {
      BarreTW.anims.play("Anim_Barre_TW_70", true);
    }
    if (Dio.nbDegats == 65) {
      BarreTW.anims.play("Anim_Barre_TW_65", true);
    }
    if (Dio.nbDegats == 60) {
      BarreTW.anims.play("Anim_Barre_TW_60", true);
    }
    if (Dio.nbDegats == 55) {
      BarreTW.anims.play("Anim_Barre_TW_55", true);
    }
    if (Dio.nbDegats == 50) {
      BarreTW.anims.play("Anim_Barre_TW_50", true);
    }
    if (Dio.nbDegats == 45) {
      BarreTW.anims.play("Anim_Barre_TW_45", true);
    }
    if (Dio.nbDegats == 40) {
      BarreTW.anims.play("Anim_Barre_TW_40", true);
    }
    if (Dio.nbDegats == 35) {
      BarreTW.anims.play("Anim_Barre_TW_35", true);
    }
    if (Dio.nbDegats == 30) {
      BarreTW.anims.play("Anim_Barre_TW_30", true);
    }
    if (Dio.nbDegats == 25) {
      BarreTW.anims.play("Anim_Barre_TW_25", true);
    }
    if (Dio.nbDegats == 20) {
      BarreTW.anims.play("Anim_Barre_TW_20", true);
    }
    if (Dio.nbDegats == 15) {
      BarreTW.anims.play("Anim_Barre_TW_15", true);
    }
    if (Dio.nbDegats == 10) {
      BarreTW.anims.play("Anim_Barre_TW_10", true);
    }
    if (Dio.nbDegats == 5) {
      BarreTW.anims.play("Anim_Barre_TW_5", true);
    }
    if (Dio.nbDegats == 0) {
      BarreTW.anims.play("Anim_Barre_TW_0", true);
    }

    //////////////////////////
    //// CONTROLES JOTARO ////
    //////////////////////////

    if (E.isUp) {
      Ora_Barrage.stop();
      OB = false;
      Jotaro.rush = false;
    }
    if (Jotaro.direction == "droite") {
      if (numAnimJotaro == 1) {
        StarPlatinium.x = Jotaro.x + 78;
        StarPlatinium.y = Jotaro.y - 54;
      }
      if (numAnimJotaro == 2) {
        StarPlatinium.x = Jotaro.x + 82;
        StarPlatinium.y = Jotaro.y - 60;
      }
      if (numAnimJotaro == 3) {
        StarPlatinium.x = Jotaro.x + 173;
        StarPlatinium.y = Jotaro.y - 51;
      }
      if (numAnimJotaro == 4) {
        StarPlatinium.x = Jotaro.x + 37;
        StarPlatinium.y = Jotaro.y - 99;
      }
      if (numAnimJotaro == 5) {
        StarPlatinium.x = Jotaro.x + 70;
        StarPlatinium.y = Jotaro.y - 15;
      }
      if (numAnimJotaro == 6) {
        StarPlatinium.x = Jotaro.x + 40;
        StarPlatinium.y = Jotaro.y;
      }
    }
    if (Jotaro.direction == "gauche") {
      if (numAnimJotaro == 1) {
        StarPlatinium.x = Jotaro.x - 78;
        StarPlatinium.y = Jotaro.y - 54;
      }
      if (numAnimJotaro == 2) {
        StarPlatinium.x = Jotaro.x - 82;
        StarPlatinium.y = Jotaro.y - 60;
      }
      if (numAnimJotaro == 3) {
        StarPlatinium.x = Jotaro.x - 173;
        StarPlatinium.y = Jotaro.y - 51;
      }
      if (numAnimJotaro == 4) {
        StarPlatinium.x = Jotaro.x - 37;
        StarPlatinium.y = Jotaro.y - 99;
      }
      if (numAnimJotaro == 5) {
        StarPlatinium.x = Jotaro.x - 70;
        StarPlatinium.y = Jotaro.y - 15;
      }
      if (numAnimJotaro == 6) {
        StarPlatinium.x = Jotaro.x - 40;
        StarPlatinium.y = Jotaro.y;
      }
    }

    if (Phaser.Input.Keyboard.JustDown(A) && Jotaro.isFreeze == false) {
      ActiverDesactiverSP();
      if (Jotaro.stand) {
        SP_Summon.play();
      } else {
        Stand_Dissapear.play();
      }
    }

    if (Jotaro.body.touching.down == false && Jotaro.isFreeze == false) {
      if (Phaser.Input.Keyboard.JustDown(E) && Jotaro.stand == false) {
        JotaroTir();
        var timer = this.time.delayedCall(300, ChangerJotaroTir, null, this);
      } else if (D.isDown && MvtJotaroOK()) {
        Jotaro.direction = "droite";
        Jotaro.setVelocityX(400);
      } else if (Q.isDown && MvtJotaroOK()) {
        Jotaro.direction = "gauche";
        Jotaro.setVelocityX(-400);
      } else if (MvtJotaroOK()) {
        Jotaro.setVelocityX(0);
      }
      if (Jotaro.stand && Jotaro.tir == false) {
        numAnimJotaro = 4;
        if (Jotaro.direction == "droite") {
          StarPlatinium.anims.play("Anim_Jotaro_Air_SP_D", true);
        }
        if (Jotaro.direction == "gauche") {
          StarPlatinium.anims.play("Anim_Jotaro_Air_SP_G", true);
        }
      } else {
        if (Jotaro.direction == "droite") {
          Jotaro.anims.play("Anim_Jotaro_Air_D", true);
          Jotaro.setSize(160, 370);
        }
        if (Jotaro.direction == "gauche") {
          Jotaro.anims.play("Anim_Jotaro_Air_G", true);
          Jotaro.setSize(160, 370);
        }
      }
      if (Phaser.Input.Keyboard.JustDown(Z) && Jotaro.DoubleJump) {
        Jotaro.setVelocityY(-1000);
        Jotaro.DoubleJump = false;
      }
    }

    if (Jotaro.body.touching.down && Jotaro.isFreeze == false) {
      Jotaro.DoubleJump = true;
      if (Jotaro.stand) {
        if (Jotaro.SP) {
          if (E.isDown && Jotaro.tir == false) {
            JotaroBarrage();
          }
        } else {
          if (Phaser.Input.Keyboard.JustDown(E) && MvtJotaroOK()) {
            JotaroOra();
            var timer = this.time.delayedCall(
              400,
              ChangerJotaroAttaque,
              null,
              this
            );
          }
        }
      } else {
        if (Phaser.Input.Keyboard.JustDown(E)) {
          JotaroTir();
          var timer = this.time.delayedCall(300, ChangerJotaroTir, null, this);
        }
      }
      if (
        Phaser.Input.Keyboard.JustDown(Z) &&
        MvtJotaroOK() &&
        Jotaro.SauterOK
      ) {
        Jotaro.setVelocityY(-1500);
        Jotaro.SauterOK = false;
        setTimeout(() => {
          Jotaro.SauterOK = true;
        }, 2000);
      } else if (D.isDown && MvtJotaroOK()) {
        numAnimJotaro = 2;
        Jotaro.direction = "droite";
        Jotaro.setVelocityX(300);
        Jotaro.anims.play("Anim_Jotaro_Walking_D", true);
        StarPlatinium.anims.play("Anim_Jotaro_Walking_SP_D", true);
        Jotaro.setSize(160, 370);
      } else if (Q.isDown && MvtJotaroOK()) {
        numAnimJotaro = 2;
        Jotaro.direction = "gauche";
        Jotaro.setVelocityX(-300);
        Jotaro.anims.play("Anim_Jotaro_Walking_G", true);
        StarPlatinium.anims.play("Anim_Jotaro_Walking_SP_G", true);
        Jotaro.setSize(160, 370);
      } else if (MvtJotaroOK()) {
        numAnimJotaro = 1;
        Jotaro.setVelocityX(0);
        if (Jotaro.direction == "droite") {
          Jotaro.anims.play("Anim_Jotaro_Standing_D", true);
          StarPlatinium.anims.play("Anim_Jotaro_Standing_SP_D", true);
          Jotaro.setSize(160, 370);
        }
        if (Jotaro.direction == "gauche") {
          Jotaro.anims.play("Anim_Jotaro_Standing_G", true);
          StarPlatinium.anims.play("Anim_Jotaro_Standing_SP_G", true);
          Jotaro.setSize(160, 370);
        }
      }
    }

    ///////////////////////
    //// CONTROLES DIO ////
    ///////////////////////

    if (I.isUp) {
      Dio.rush = false;
      Muda_Barrage.stop();
      MB = false;
    }
    if (Dio.direction == "droite") {
      if (numAnimDio == 1) {
        TheWorld.x = Dio.x + 53;
        TheWorld.y = Dio.y - 36;
      }
      if (numAnimDio == 2) {
        TheWorld.x = Dio.x + 17;
        TheWorld.y = Dio.y - 33;
      }
      if (numAnimDio == 3) {
        TheWorld.x = Dio.x + 250;
        TheWorld.y = Dio.y - 31;
      }
      if (numAnimDio == 4) {
        TheWorld.x = Dio.x + 83;
        TheWorld.y = Dio.y;
      }
      if (numAnimDio == 5) {
        TheWorld.x = Dio.x + 73;
        TheWorld.y = Dio.y - 23;
      }
      if (numAnimDio == 6) {
        TheWorld.x = Dio.x + 80;
        TheWorld.y = Dio.y;
      }
    }
    if (Dio.direction == "gauche") {
      if (numAnimDio == 1) {
        TheWorld.x = Dio.x - 53;
        TheWorld.y = Dio.y - 36;
      }
      if (numAnimDio == 2) {
        TheWorld.x = Dio.x - 17;
        TheWorld.y = Dio.y - 33;
      }
      if (numAnimDio == 3) {
        TheWorld.x = Dio.x - 250;
        TheWorld.y = Dio.y - 31;
      }
      if (numAnimDio == 4) {
        TheWorld.x = Dio.x - 83;
        TheWorld.y = Dio.y;
      }
      if (numAnimDio == 5) {
        TheWorld.x = Dio.x - 73;
        TheWorld.y = Dio.y - 23;
      }
      if (numAnimDio == 6) {
        TheWorld.x = Dio.x - 80;
        TheWorld.y = Dio.y;
      }
    }

    if (Phaser.Input.Keyboard.JustDown(P) && Dio.isFreeze == false) {
      ActiverDesactiverTW();
      if (Dio.stand) {
        TW_Summon.play();
      } else {
        Stand_Dissapear.play();
      }
    }

    if (Dio.body.touching.down == false && Dio.isFreeze == false) {
      if (Phaser.Input.Keyboard.JustDown(I) && Dio.stand == false) {
        DioTir();
        var timer = this.time.delayedCall(300, ChangerDioTir, null, this);
      } else if (M.isDown && MvtDioOK()) {
        Dio.direction = "droite";
        Dio.setVelocityX(400);
      } else if (K.isDown && MvtDioOK()) {
        Dio.direction = "gauche";
        Dio.setVelocityX(-400);
      } else if (MvtDioOK()) {
        Dio.setVelocityX(0);
      }
      if (Dio.stand && Dio.tir == false) {
        numAnimDio = 4;
        if (Dio.direction == "droite") {
          TheWorld.anims.play("Anim_Dio_Air_TW_D", true);
        }
        if (Dio.direction == "gauche") {
          TheWorld.anims.play("Anim_Dio_Air_TW_G", true);
        }
      } else {
        if (Dio.direction == "droite") {
          Dio.anims.play("Anim_Dio_Air_D", true);
          Dio.setSize(160, 370);
        }
        if (Dio.direction == "gauche") {
          Dio.anims.play("Anim_Dio_Air_G", true);
          Dio.setSize(160, 370);
        }
      }
      if (Phaser.Input.Keyboard.JustDown(O) && Dio.DoubleJump) {
        Dio.setVelocityY(-1000);
        Dio.DoubleJump = false;
      }
    }

    if (Dio.body.touching.down && Dio.isFreeze == false) {
      Dio.DoubleJump = true;
      if (Dio.stand) {
        if (Dio.TW) {
          if (I.isDown && Dio.tir == false) {
            DioBarrage();
          }
        } else {
          if (Phaser.Input.Keyboard.JustDown(I) && MvtDioOK()) {
            DioMuda();
            var timer = this.time.delayedCall(
              400,
              ChangerDioAttaque,
              null,
              this
            );
          }
        }
      } else {
        if (Phaser.Input.Keyboard.JustDown(I)) {
          DioTir();
          var timer = this.time.delayedCall(300, ChangerDioTir, null, this);
        }
      }
      if (Phaser.Input.Keyboard.JustDown(O) && MvtDioOK() && Dio.SauterOK) {
        Dio.setVelocityY(-1500);
        Dio.SauterOK = false;
        setTimeout(() => {
          Dio.SauterOK = true;
        }, 2000);
      } else if (M.isDown && MvtDioOK()) {
        numAnimDio = 2;
        Dio.direction = "droite";
        Dio.setVelocityX(300);
        Dio.anims.play("Anim_Dio_Walking_D", true);
        TheWorld.anims.play("Anim_Dio_Walking_TW_D", true);
        Dio.setSize(160, 370);
      } else if (K.isDown && MvtDioOK()) {
        numAnimDio = 2;
        Dio.direction = "gauche";
        Dio.setVelocityX(-300);
        Dio.anims.play("Anim_Dio_Walking_G", true);
        TheWorld.anims.play("Anim_Dio_Walking_TW_G", true);
        Dio.setSize(160, 370);
      } else if (MvtDioOK()) {
        numAnimDio = 1;
        Dio.setVelocityX(0);
        if (Dio.direction == "droite") {
          Dio.anims.play("Anim_Dio_Standing_D", true);
          TheWorld.anims.play("Anim_Dio_Standing_TW_D", true);
          Dio.setSize(160, 370);
        }
        if (Dio.direction == "gauche") {
          Dio.anims.play("Anim_Dio_Standing_G", true);
          TheWorld.anims.play("Anim_Dio_Standing_TW_G", true);
          Dio.setSize(160, 370);
        }
      }
    }
  }
}

//////////////////////////
//// Fonctions Jotaro ////
//////////////////////////

function JotaroTir() {
  ActiverDesactiverSP();
  Jotaro.tir = true;
  Jotaro.setVelocityX(0);
  numAnimJotaro = 6;
  if (Jotaro.direction == "droite") {
    StarPlatinium.anims.play("Anim_Jotaro_Tir_D", true);
  }
  if (Jotaro.direction == "gauche") {
    StarPlatinium.anims.play("Anim_Jotaro_Tir_G", true);
  }
  if (nbCutsJotaro > 0) {
    Cut_Throw.play();
    if (Jotaro.direction == "droite") {
      coefDir = 1;
      cut = GroupeCuts.create(
        Jotaro.x + 105 * coefDir,
        Jotaro.y - 100,
        "Cut_D"
      );
    } else {
      coefDir = -1;
      cut = GroupeCuts.create(
        Jotaro.x + 105 * coefDir,
        Jotaro.y - 100,
        "Cut_G"
      );
    }
    nbCutsJotaro--;
    cut.setCollideWorldBounds(true);
    cut.body.onWorldBounds = true;
    cut.body.allowGravity = false;
    cut.setVelocity(1500 * coefDir, 0);
  }
}

function JotaroOra() {
  Ora.play();
  var X;
  var Y;
  var x1;
  var y1;
  var x2;
  var y2;
  var reculX;

  Jotaro.setVelocityX(0);
  Jotaro.attaque = true;
  numAnimJotaro = 5;
  if (Jotaro.direction == "droite") {
    StarPlatinium.anims.play("Anim_Jotaro_Ora_D", true);
    X = Jotaro.x + 220;
    Y = Jotaro.y - 50;
    reculX = 500;
  }
  if (Jotaro.direction == "gauche") {
    StarPlatinium.anims.play("Anim_Jotaro_Ora_G", true);
    X = Jotaro.x - 220;
    Y = Jotaro.y - 50;
    reculX = -500;
  }
  x1 = X - 120;
  x2 = X + 120;
  y1 = Y - 200;
  y2 = Y + 100;
  if (Dio.x > x1 && Dio.x < x2) {
    if (Dio.y > y1 && Dio.y < y2) {
      degatJoueur(Dio, 10);
      if (Dio.isFreeze == false) {
        ChangerDioRecul();
        Dio.setVelocityX(reculX);
        Dio.setVelocityY(-1200);
        setTimeout(() => {
          ChangerDioRecul();
        }, 800);
      }
    }
  }
}

function JotaroBarrage() {
  if (OB == false) {
    Ora_Barrage.play();
  }
  OB = true;
  var X;
  var Y;
  var x1;
  var y1;
  var x2;
  var y2;
  var reculX;

  Jotaro.setVelocityX(0);
  Jotaro.rush = true;
  numAnimJotaro = 3;
  if (Jotaro.direction == "droite") {
    StarPlatinium.anims.play("Anim_Jotaro_Barrage_Ora_D", true);
    X = Jotaro.x + 300;
    Y = Jotaro.y - 50;
    reculX = 300;
  }
  if (Jotaro.direction == "gauche") {
    StarPlatinium.anims.play("Anim_Jotaro_Barrage_Ora_G", true);
    X = Jotaro.x - 300;
    Y = Jotaro.y - 50;
    reculX = -300;
  }
  x1 = X - 160;
  x2 = X + 160;
  y1 = Y - 200;
  y2 = Y + 100;
  if (Dio.x > x1 && Dio.x < x2) {
    if (Dio.y > y1 && Dio.y < y2) {
      if (j == true) {
        j = false;
        degatJoueur(Dio, 5);
        ChangerDioRecul();
        if (Dio.isFreeze == false) {
          Dio.setVelocityX(reculX);
          Dio.setVelocityY(-800);
        }
        setTimeout(() => {
          ChangerDioRecul();
          j = true;
        }, 300);
      }
    }
  }
}

function MvtJotaroOK() {
  if (
    Jotaro.attaque == false &&
    Jotaro.rush == false &&
    Jotaro.tir == false &&
    Jotaro.recul == false &&
    Jotaro.isFreeze == false
  ) {
    return true;
  } else {
    return false;
  }
}

function ChangerJotaroAttaque() {
  if (Jotaro.attaque) {
    Jotaro.attaque = false;
  } else {
    Jotaro.attaque = true;
  }
}

function ChangerJotaroRush() {
  if (Jotaro.rush) {
    Jotaro.rush = false;
  } else {
    Jotaro.rush = true;
  }
}

function ChangerJotaroRecul() {
  if (Jotaro.recul) {
    Jotaro.recul = false;
  } else {
    Jotaro.recul = true;
  }
}

function ChangerJotaroTir() {
  if (Jotaro.tir) {
    Jotaro.tir = false;
  } else {
    Jotaro.tir = true;
  }
  ActiverDesactiverSP();
}

function ActiverDesactiverSP() {
  if (Jotaro.stand) {
    Jotaro.stand = false;
    Jotaro.setVisible(true);
    StarPlatinium.setVisible(false);
  } else {
    Jotaro.stand = true;
    Jotaro.setVisible(false);
    StarPlatinium.setVisible(true);
  }
}

///////////////////////
//// Fonctions Dio ////
///////////////////////

function DioTir() {
  ActiverDesactiverTW();
  Dio.tir = true;
  Dio.setVelocityX(0);
  numAnimDio = 6;
  if (Dio.direction == "droite") {
    TheWorld.anims.play("Anim_Dio_Tir_D", true);
  }
  if (Dio.direction == "gauche") {
    TheWorld.anims.play("Anim_Dio_Tir_G", true);
  }
  if (nbCutsDio > 0) {
    Cut_Throw.play();
    if (Dio.direction == "droite") {
      coefDir = 1;
      cut = GroupeCuts.create(Dio.x + 105 * coefDir, Dio.y - 100, "Cut_D");
    } else {
      coefDir = -1;
      cut = GroupeCuts.create(Dio.x + 105 * coefDir, Dio.y - 100, "Cut_G");
    }
    nbCutsDio--;
    cut.setCollideWorldBounds(true);
    cut.body.onWorldBounds = true;
    cut.body.allowGravity = false;
    cut.setVelocity(1500 * coefDir, 0);
  }
}

function DioMuda() {
  Muda.play();
  var X;
  var Y;
  var x1;
  var y1;
  var x2;
  var y2;
  var reculX;

  Dio.setVelocityX(0);
  Dio.attaque = true;
  numAnimDio = 5;
  if (Dio.direction == "droite") {
    TheWorld.anims.play("Anim_Dio_Muda_D", true);
    X = Dio.x + 220;
    Y = Dio.y - 50;
    reculX = 500;
  }
  if (Dio.direction == "gauche") {
    TheWorld.anims.play("Anim_Dio_Muda_G", true);
    X = Dio.x - 220;
    Y = Dio.y - 50;
    reculX = -500;
  }
  x1 = X - 120;
  x2 = X + 120;
  y1 = Y - 200;
  y2 = Y + 100;
  if (Jotaro.x > x1 && Jotaro.x < x2) {
    if (Jotaro.y > y1 && Jotaro.y < y2) {
      degatJoueur(Jotaro, 10);
      if (Jotaro.isFreeze == false) {
        ChangerJotaroRecul();
        Jotaro.setVelocityX(reculX);
        Jotaro.setVelocityY(-1200);
        setTimeout(() => {
          ChangerJotaroRecul();
        }, 800);
      }
    }
  }
}

function DioBarrage() {
  if (MB == false) {
    Muda_Barrage.play();
  }
  MB = true;
  var X;
  var Y;
  var x1;
  var y1;
  var x2;
  var y2;
  var reculX;

  Dio.setVelocityX(0);
  Dio.rush = true;
  numAnimDio = 3;
  if (Dio.direction == "droite") {
    TheWorld.anims.play("Anim_Dio_Barrage_Muda_D", true);
    X = Dio.x + 300;
    Y = Dio.y - 50;
    reculX = 300;
  }
  if (Dio.direction == "gauche") {
    TheWorld.anims.play("Anim_Dio_Barrage_Muda_G", true);
    X = Dio.x - 300;
    Y = Dio.y - 50;
    reculX = -300;
  }
  x1 = X - 160;
  x2 = X + 160;
  y1 = Y - 200;
  y2 = Y + 100;
  if (Jotaro.x > x1 && Jotaro.x < x2) {
    if (Jotaro.y > y1 && Jotaro.y < y2) {
      if (d == true) {
        d = false;
        degatJoueur(Jotaro, 5);
        ChangerJotaroRecul();
        if (Jotaro.isFreeze == false) {
          Jotaro.setVelocityX(reculX);
          Jotaro.setVelocityY(-800);
        }
        setTimeout(() => {
          ChangerJotaroRecul();
          d = true;
        }, 300);
      }
    }
  }
}

function MvtDioOK() {
  if (
    Dio.attaque == false &&
    Dio.rush == false &&
    Dio.tir == false &&
    Dio.recul == false &&
    Dio.isFreeze == false
  ) {
    return true;
  } else {
    return false;
  }
}

function ChangerDioAttaque() {
  if (Dio.attaque) {
    Dio.attaque = false;
  } else {
    Dio.attaque = true;
  }
}

function ChangerDioRush() {
  if (Dio.rush) {
    Dio.rush = false;
  } else {
    Dio.rush = true;
  }
}

function ChangerDioRecul() {
  if (Dio.recul) {
    Dio.recul = false;
  } else {
    Dio.recul = true;
  }
}

function ChangerDioTir() {
  if (Dio.tir) {
    Dio.tir = false;
  } else {
    Dio.tir = true;
  }
  ActiverDesactiverTW();
}

function ActiverDesactiverTW() {
  if (Dio.stand) {
    Dio.stand = false;
    Dio.setVisible(true);
    TheWorld.setVisible(false);
  } else {
    Dio.stand = true;
    Dio.setVisible(false);
    TheWorld.setVisible(true);
  }
}

//////////////////////////
//// Fonctions degats ////
//////////////////////////

function hitJoueur(unJoueur, unCouteau) {
  m = false;
  cut = null;
  unCouteau.destroy();
  degatJoueur(unJoueur, 5);
  Cut_Stab.play();
}

function degatJoueur(Joueur, degat) {
  Joueur.HP -= degat;
  if (Joueur.isFreeze == false) {
    Joueur.setTint(0xff0000);
    if (Joueur == Jotaro) {
      StarPlatinium.setTint(0xff0000);
    }
    if (Joueur == Dio) {
      TheWorld.setTint(0xff0000);
    }
    setTimeout(() => {
      Joueur.setTint(0xffffff);
      StarPlatinium.setTint(0xffffff);
      TheWorld.setTint(0xffffff);
    }, 50);
  }

  if (Joueur == Jotaro) {
    cptJotaroHP = 0;
    Dio.nbDegats += degat;
  }
  if (Joueur == Dio) {
    cptDioHP = 0;
    Jotaro.nbDegats += degat;
  }
}

function recupHPJotaro() {
  if (Jotaro.HP == 100) {
    cptJotaroHP = 0;
  } else {
    cptJotaroHP += 1;
    if (cptJotaroHP == 5) {
      Jotaro.HP += 5;
      cptJotaroHP = 4;
    }
  }
}

function recupHPDio() {
  if (Dio.HP == 100) {
    cptDioHP = 0;
  } else {
    cptDioHP += 1;
    if (cptDioHP == 5) {
      Dio.HP += 5;
      cptDioHP = 4;
    }
  }
}

function TirAsteroides() {
  if (TimeStop) {
  } else {
    var H = Phaser.Math.Between(0, 1000);
    if (H < 200) {
      H = 0;
    } else {
      H = 1;
    }
    if (H == 0) {
      var y = Phaser.Math.Between(100, 1000);
      var x = Phaser.Math.Between(0, 1000);
      if (x < 500) {
        x = 0;
        coeff = 1;
      } else {
        x = 1920;
        coeff = -1;
      }
      Asteroide = GroupeAsteroides.create(x, y, "Asteroide");
      Asteroide.setCollideWorldBounds(false);
      Asteroide.body.allowGravity = true;
      Asteroide.setVelocity(
        Phaser.Math.Between(800, 2000) * coeff,
        Phaser.Math.Between(-1000, 1000)
      );
    } else {
      var y = 0;
      var x = Phaser.Math.Between(0, 1920);
      if (x < 960) {
        coeff = 1;
      } else {
        coeff = -1;
      }
      Asteroide = GroupeAsteroides.create(x, y, "Asteroide");
      Asteroide.setCollideWorldBounds(false);
      Asteroide.body.allowGravity = true;
      Asteroide.setVelocity(
        Phaser.Math.Between(200, 800) * coeff,
        Phaser.Math.Between(800, 1600)
      );
    }
  }
}

function hitJoueurAsteroide(unJoueur, unAsteroide) {
  unAsteroide.destroy();
  Asteroide = null;
  k = false;

  degatJoueurAsteroides(unJoueur, 10);
  var reculX = Phaser.Math.Between(600, 1000) * coeff;
  if (unJoueur == Jotaro) {
    ChangerJotaroRecul();
    Jotaro.setVelocityX(reculX);
    Jotaro.setVelocityY(-Phaser.Math.Between(600, 1000));
    setTimeout(() => {
      ChangerJotaroRecul();
    }, 800);
  }
  if (unJoueur == Dio) {
    ChangerDioRecul();
    Dio.setVelocityX(reculX);
    Dio.setVelocityY(-Phaser.Math.Between(600, 1000));
    setTimeout(() => {
      ChangerDioRecul();
    }, 800);
  }
}

function degatJoueurAsteroides(Joueur, degat) {
  Joueur.HP -= degat;
  if (Joueur.isFreeze == false) {
    Joueur.setTint(0xff0000);
    if (Joueur == Jotaro) {
      StarPlatinium.setTint(0xff0000);
    }
    if (Joueur == Dio) {
      TheWorld.setTint(0xff0000);
    }
    setTimeout(() => {
      Joueur.setTint(0xffffff);
      StarPlatinium.setTint(0xffffff);
      TheWorld.setTint(0xffffff);
    }, 50);
  }

  if (Joueur == Jotaro) {
    cptJotaroHP = 0;
  }
  if (Joueur == Dio) {
    cptDioHP = 0;
  }
}
