export default class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: "win" });
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    // Charger l'image de fond Win
    this.load.image("win_bg", "assets/win.jpg");
    
    // Charger la musique de victoire
    this.load.audio("win_music", "assets/win.mp3");
  }

  create() {
    const { width, height } = this.scale;

    // ARRÊTER TOUTES LES MUSIQUES (y compris celle du menu)
    this.sound.stopAll();

    // Lancer UNIQUEMENT la musique de victoire
    this.winMusic = this.sound.add("win_music", { 
      loop: false, 
      volume: 0.5 
    });
    this.winMusic.play();

    // Affiche l'image en fond plein écran
    const bg = this.add.image(width / 2, height / 2, "win_bg").setOrigin(0.5);
    bg.setDisplaySize(width, height);

    // Crée UN SEUL bouton (Retour Menu)
    this.buttons = [];
    this.selectedIndex = 0;

    this.styleNormal = { fontSize: "24px", color: "#ffffff" };
    this.styleSelected = { fontSize: "24px", color: "#0bba6eff" };

    // Un seul bouton centré
    const menuBtn = this.add.text(width / 2, height - 170, "Retour Menu", this.styleNormal).setOrigin(0.5);

    this.buttons.push(menuBtn);

    // Mettre en surbrillance le bouton
    this.updateSelection();

    // Entrées clavier
    this.cursors = this.input.keyboard.createCursorKeys();
    this.iKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // Clique souris
    menuBtn.setInteractive().on("pointerdown", () => this.goMenu());

    // Survol souris = sélection bouton
    menuBtn.setInteractive().on("pointerover", () => {
      this.selectedIndex = 0;
      this.updateSelection();
    });

    // Sélectionne automatiquement le bouton
    this.selectedIndex = 0;
    this.updateSelection();
  }

  update() {
    // Validation avec la touche I (plus besoin de navigation haut/bas)
    if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
      this.goMenu();
    }
  }

  updateSelection() {
    this.buttons.forEach((btn, index) => {
      if (index === this.selectedIndex) btn.setStyle(this.styleSelected);
      else btn.setStyle(this.styleNormal);
    });
  }

  goMenu() {
    // Réinitialiser les stats
    this.registry.set("playerLives", 3);
    this.registry.set("playerPotions", 4);
    this.registry.set("eggsCollected", 0);
    this.registry.set("potionHelpShown", false);
    this.registry.set("currentLevel", "niveau1");
    this.registry.set("lastCheckpoint", null);
    
    // Arrêter la musique de victoire
    if (this.winMusic && this.winMusic.isPlaying) {
      this.winMusic.stop();
    }
    
    // Arrêter toutes les musiques de niveaux
    if (this.sys.game.globals) {
      Object.keys(this.sys.game.globals).forEach(key => {
        if (key.startsWith("musique") && key !== "musiqueMenu") {
          const music = this.sys.game.globals[key];
          if (music && music.stop) {
            music.stop();
            delete this.sys.game.globals[key];
          }
        }
      });
    }
    
    // Relancer la musique du menu
    if (this.sys.game.globals && this.sys.game.globals.musiqueMenu) {
      if (!this.sys.game.globals.musiqueMenu.isPlaying) {
        this.sys.game.globals.musiqueMenu.play();
      }
    }
    
    // Retourner au menu
    this.scene.start("menu");
  }
}