export default class gameover extends Phaser.Scene {
  constructor() {
    super({ key: "gameover" });
  }
  preload() {
    this.load.image("gm_fond", "assets/gameover.jpg");
    this.load.image("imageBoutonBack", "assets/retour.png");
    this.load.audio("confirmSound", "./assets/sounds/menuconfirm.mp3");
    this.load.audio("gameOverSound", "./assets/sounds/gameover.mp3");
  }

  create() {
    const music = this.registry.get('backgroundMusic');
    if (music) {
      music.stop();
      this.registry.set('backgroundMusic', null);
    }
    this.sound.play("gameOverSound");

    if (this.scene.isActive('hud')) {
      this.scene.stop('hud');
    }
    
    this.add
      .image(0, 0, "gm_fond")
      .setOrigin(0)
      .setDepth(0);

    this.boutons = [
      this.add.image(625, 555, "imageBoutonBack").setDepth(1),
    ];

    this.boutons.forEach(b => b.setInteractive());

    this.selectedIndex = 0;
    this.updateSelection();

    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    this.actions = [
      () => this.scene.start("menu"),
    ];
  }

  updateSelection() {
    this.boutons.forEach((b, i) => {
      const targetScale = i === this.selectedIndex ? 1.1 : 1;
      this.tweens.add({
        targets: b,
        scale: targetScale,
        duration: 150,
        ease: 'Power2'
      });
    });
  }

  update() {
    // Validation
    if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
      this.sound.play("confirmSound");
      if (this.scene.isActive('hud')) {
        this.scene.stop('hud');
      }
      
      this.actions[this.selectedIndex]();
    }
  }
}

//export default intro;

