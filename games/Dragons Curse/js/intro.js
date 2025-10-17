import * as fct from "./fonctions.js";

export default class intro extends Phaser.Scene {
  constructor() {
    super({ key: "intro" });
  }
  
  preload() {
    this.load.image("intro_fond", "assets/introduction.jpg");
    this.load.image("imageBoutonPlay", "assets/start.png");
    this.load.audio("confirmSound", "./assets/sounds/menuconfirm.mp3");
    this.load.audio("homemusic", "./assets/sounds/homemusic.mp3");
  }

  create() {
    // Continuer la musique du menu si elle existe, sinon la démarrer
    let homeMusic = this.registry.get('homeMusic');
    if (!homeMusic || !homeMusic.isPlaying) {
      homeMusic = this.sound.add('homemusic', { loop: true, volume: 0.5 });
      homeMusic.play();
      this.registry.set('homeMusic', homeMusic);
    }
    
    this.add
      .image(0, 0, "intro_fond")
      .setOrigin(0)
      .setDepth(0);

    this.boutons = [
      this.add.image(1000, 555, "imageBoutonPlay").setDepth(1),
    ];

    this.boutons.forEach(b => b.setInteractive());

    this.selectedIndex = 0;
    this.updateSelection();

    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    this.actions = [
      () => this.scene.start("selection"),
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
      
      // Arrêter la musique du menu
      const homeMusic = this.registry.get('homeMusic');
      if (homeMusic) {
        homeMusic.stop();
        this.registry.set('homeMusic', null);
      }

      this.registry.set('playerHealth', 5);
      this.registry.set('playerMaxHealth', 5);
      this.registry.set('playerLevel', 1);
      this.registry.set('playerXP', 0);
      this.registry.set('enemiesKilled', 0);
      
      this.registry.set('skillPointsAvailable', 0);
      this.registry.set('skillForce', 0);
      this.registry.set('skillVitesse', 0);
      this.registry.set('skillVie', 0);
      
      fct.resetNbPotions();
      
      if (!this.scene.isActive('hud')) {
        this.scene.launch('hud');
      }
      this.actions[this.selectedIndex]();
    }
  }
}


