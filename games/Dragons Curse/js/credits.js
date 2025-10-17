export default class credits extends Phaser.Scene {
  constructor() {
    super({ key: "credits" });
  }
  //on charge les images
  preload() {
    this.load.image("credit_fond", "assets/credit_background.jpg");
    this.load.image("imageBoutonBack", "assets/retour.png");
    this.load.audio("homemusic", "./assets/sounds/homemusic.mp3");
    this.load.audio("confirmSound", "./assets/sounds/menuconfirm.mp3");

  }

  create() {
    // Continuer la musique du menu si elle existe, sinon la démarrer
    let homeMusic = this.registry.get('homeMusic');
    if (!homeMusic || !homeMusic.isPlaying) {
      homeMusic = this.sound.add('homemusic', { loop: true, volume: 0.5 });
      homeMusic.play();
      this.registry.set('homeMusic', homeMusic);
    }
    
   // on place les éléments de fond
    this.add
      .image(0, 0, "credit_fond")
      .setOrigin(0)
      .setDepth(0);

    // Boutons
    this.boutons = [
      this.add.image(1000, 555, "imageBoutonBack").setDepth(1),
    ];

    this.boutons.forEach(b => b.setInteractive());

    // Index du bouton sélectionné
    this.selectedIndex = 0;
    this.updateSelection();

    // Clavier
    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // Action sur validation
    this.actions = [
      () => this.scene.start("menu"),
    ];
  }

  updateSelection() {
    this.boutons.forEach((b, i) => {
      // Scale progressif vers 1.1 si sélectionné, sinon vers 1
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
      this.actions[this.selectedIndex]();
    }
  }
}

//export default credits;

