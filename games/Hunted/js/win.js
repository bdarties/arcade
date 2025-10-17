import { resetGame } from "./fonctions.js";

export default class win extends Phaser.Scene {
  constructor() {
    super({ key: "win" });
  }

  preload() {
    this.load.image("fondwin", "./assets/page_win.jpg");
    this.load.image("btn_rejouer", "./assets/btn_rejouer.png");
    this.load.image("btn_menu", "./assets/btn_menu.png");
    this.load.audio("boutonClick", "./assets/boutonclick.mp3");
    this.load.audio("winMusic", "./assets/win.mp3");
  }

  create() {
    if (this.game.musiqueGlobale && this.game.musiqueGlobale.isPlaying) {
      this.game.musiqueGlobale.stop();
    }

    this.winMusic = this.sound.add("winMusic", { loop: true });
    this.winMusic.setVolume(0.2);
    this.winMusic.play();

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const bg = this.add.image(centerX, centerY, "fondwin");
    let scaleX = this.cameras.main.width / bg.width;
    let scaleY = this.cameras.main.height / bg.height;
    let scale = Math.max(scaleX, scaleY);
    bg.setScale(scale).setScrollFactor(0);

    this.boutons = [];

    const bottomY = this.cameras.main.height - 90;

    const boutonRejouer = this.add.image(centerX - 150, bottomY, "btn_rejouer")
      .setScale(0.35)
      .setAlpha(0.7);

    const boutonMenu = this.add.image(centerX + 150, bottomY, "btn_menu")
      .setScale(0.35)
      .setAlpha(0.7);

    this.boutons.push(boutonRejouer, boutonMenu);

    this.selectedIndex = 0;
    this.updateSelection();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    this.sonBouton = this.sound.add("boutonClick");
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.boutons.length) % this.boutons.length;
      this.updateSelection();
      this.sonBouton.play();
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.boutons.length;
      this.updateSelection();
      this.sonBouton.play();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
      this.sonBouton.play();
      this.time.delayedCall(50, () => {
        this.executeAction(this.selectedIndex);
      });
    }
  }

  updateSelection() {
    this.boutons.forEach(btn => btn.setScale(0.4).setAlpha(0.7));
    this.boutons[this.selectedIndex].setScale(0.5).setAlpha(1);
  }

  executeAction(index) {
    if (this.winMusic && this.winMusic.isPlaying) {
      this.winMusic.stop();
    }

    resetGame();
    this.game.config.portalTarget = null;

    if (index === 0) {
      this.scene.stop("niveau1");
      this.scene.stop("niveau2");
      this.scene.stop("niveau3");
      this.scene.stop("acceuil");
      this.scene.stop("checkpoint1");
      this.scene.stop("controles");
      this.scene.start("selection");
    } else {
      this.scene.stop("niveau1");
      this.scene.stop("niveau2");
      this.scene.stop("niveau3");
      this.scene.stop("selection");
      this.scene.stop("controles");
      this.scene.start("accueil");
    }
  }
}