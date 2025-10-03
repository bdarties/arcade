export default class tutoriel extends Phaser.Scene {
  constructor() {
    super({ key: "tutoriel" });
  }

  preload() {
    // Backgrounds
    this.load.image("tuto0", "./assets/tuto0.jpg");
    this.load.image("tuto1", "./assets/tuto1.jpg");
    this.load.image("tuto2", "./assets/tuto2.jpg");
    this.load.audio("click", "./assets/musique_sfx/click.mp3");

    // Texts
    for (let i = 0; i <= 12; i++) {
      this.load.image("text" + i, `./assets/text${i}.png`);
    }
  }

  create() {
this.music = this.sound.get('music');
this.click = this.sound.add('click', { volume: 0.5, loop: false });
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // --- Inputs ---
    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.keyL = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);

    // --- Background ---
    this.background = this.add.image(centerX, centerY, "tuto0").setDepth(0);

    // --- Overlay semi-transparent ---
    this.overlay = this.add.rectangle(
      centerX,
      centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.6
    ).setVisible(true).setDepth(1);

    // --- Text image ---
    this.textImage = this.add.image(centerX, centerY, "text0").setDepth(2).setScale(1);

    // Suivi d’étape
    this.step = 0;
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
      this.nextStep();
    }

    if (this.step === 8 && Phaser.Input.Keyboard.JustDown(this.keyL)) {
      this.nextStep(true); // Passage spécial avec "L"
    }
  }

  nextStep(forceL = false) {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.step++;

    // Reset position/overlay à chaque étape
    this.textImage.setVisible(true);
    this.overlay.setVisible(false);

    switch (this.step) {
      case 1:
        this.click.play();
        this.overlay.setVisible(false);
        this.textImage.setTexture("text1").setPosition(20, 150).setOrigin(0,0).setScale(0.8);
        break;
      case 2:
this.click.play();
        this.textImage.setTexture("text2").setPosition(centerX +50, 150).setOrigin(0.5,0).setScale(0.8);
        break;
      case 3:
this.click.play();
        this.textImage.setTexture("text3").setPosition(this.cameras.main.width - 10, 70).setOrigin(1,0).setScale(0.7);
        break;
      case 4:
this.click.play();
        this.textImage.setTexture("text4").setPosition(240, this.cameras.main.height - 60).setOrigin(0,1).setScale(0.6);
        break;
      case 5:
this.click.play();
        this.textImage.setTexture("text5").setPosition(this.cameras.main.width - 20, this.cameras.main.height - 70).setOrigin(1,1);
        break;
      case 6:
this.click.play();
        this.overlay.setVisible(true);
        this.textImage.setTexture("text6").setPosition(centerX, centerY).setOrigin(0.5).setScale(0.9);
        break;
      case 7:
        this.click.play();
        this.overlay.setVisible(true);
        this.textImage.setTexture("text7").setPosition(centerX, centerY).setOrigin(0.5);
        break;
      case 8:
        this.click.play();
        this.overlay.setVisible(true);
        this.textImage.setTexture("text8").setPosition(centerX, centerY).setOrigin(0.5);
        break;
      case 9:
        
        // Ici il faut appuyer sur L pour continuer
        if (!forceL) {
        this.overlay.setVisible(true);
          this.step--; // on bloque si pas "L"
          return;
        }
        this.click.play();
        this.background.setTexture("tuto1");
        this.textImage.setTexture("text9").setPosition(this.cameras.main.width - 30, centerY + 60).setOrigin(1,0.5).setScale(0.9);
        break;
      case 10:
        this.click.play();
        this.background.setTexture("tuto2");
        this.textImage.setTexture("text10").setPosition(20, 20).setOrigin(0,0);
        break;
      case 11:
        this.click.play();
        this.textImage.setTexture("text11").setPosition(20, 20).setOrigin(0,0);
        break;
      case 12:
        this.click.play();
        this.overlay.setVisible(true);
        this.textImage.setTexture("text12").setPosition(centerX, centerY).setOrigin(0.5).setScale(1);
        break;
      case 13:
        this.click.play();
        if (this.music) this.music.stop();
        this.scene.start("selection");
        

        break;
    }
  }
}
