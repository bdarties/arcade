export default class victory extends Phaser.Scene {
  constructor() {
    super({ key: "victory" });
  }
  preload() {
    this.load.image("win_fond", "./assets/victoire.jpg");
    this.load.image("imageBoutonBack", "./assets/retour.png");
    this.load.audio("confirmSound", "./assets/sounds/menuconfirm.mp3");
    this.load.audio("victorySound", "./assets/sounds/victory.mp3");
  }

  create() {
    const music = this.registry.get('backgroundMusic');
    if (music) {
      music.stop();
      this.registry.set('backgroundMusic', null);
    }
    
    this.sound.play("victorySound", { volume: 0.7 });

    if (this.scene.isActive('hud')) {
      this.scene.stop('hud');
    }

    this.add
      .image(0, 0, "win_fond")
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
    if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
      this.sound.play("confirmSound");
      if (this.scene.isActive('hud')) {
        this.scene.stop('hud');
      }
      
      this.actions[this.selectedIndex]();
    }
  }
}


