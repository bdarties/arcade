export default class Acceuil extends Phaser.Scene {
  constructor() {
    super({ key: "accueil" });
  }

  preload() {
    // --- Fond ---
    this.load.image("fondAcceuil", "./assets/page_acceuil.jpg");

    // --- Boutons ---
    this.load.image("btn_jouer", "./assets/btn_jouer.png");
    this.load.image("btn_credit", "./assets/btn_credit.png");
    this.load.image("btn_controles", "./assets/btn_controles.png");

    // --- Son du clic ---
    this.load.audio("boutonClick", "./assets/boutonclick.mp3");
    this.load.audio("menuMusic", "./assets/menu.mp3");
  }

  create() {
    // --- NE PAS LANCER LA MUSIQUE SI ON VIENT DE WIN OU GAMEOVER ---
    const previousScene = this.scene.get("win") || this.scene.get("gameover");
    const shouldPlayMusic = !this.sound.get("winMusic")?.isPlaying && 
                           !this.sound.get("gameOverMusic")?.isPlaying;

    if (shouldPlayMusic) {
      if (!this.sound.get("menuMusic")) {
        this.menuMusic = this.sound.add("menuMusic", { loop: true, volume: 0.5 });
        this.menuMusic.play();
      } else {
        this.menuMusic = this.sound.get("menuMusic");
        if (!this.menuMusic.isPlaying) {
          this.menuMusic.play();
        }
      }
    }

    // --- Fond ---
    const bg = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      "fondAcceuil"
    );

    const scaleX = this.cameras.main.width / bg.width;
    const scaleY = this.cameras.main.height / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale).setScrollFactor(0); 

    // --- Boutons ---
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2 + 100;

    this.boutons = [
      this.add.image(centerX - 200, centerY, "btn_credit").setScale(0.5),
      this.add.image(centerX, centerY, "btn_jouer").setScale(0.5),
      this.add.image(centerX + 200, centerY, "btn_controles").setScale(0.5)
    ];

    // --- Index du bouton sélectionné ---
    this.selectedIndex = 1; // par défaut : "Jouer"

    // --- Contrôles clavier ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    // --- Son du bouton ---
    this.sonBouton = this.sound.add("boutonClick");

    // --- Affichage du bouton sélectionné ---
    this.updateSelection();
  }

  update() {
    // --- Navigation gauche ---
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.selectedIndex =
        (this.selectedIndex - 1 + this.boutons.length) % this.boutons.length;
      this.updateSelection();
      this.sonBouton.play();
    }

    // --- Navigation droite ---
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.boutons.length;
      this.updateSelection();
      this.sonBouton.play();
    }

    // --- Validation avec K ---
    if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
      this.sonBouton.play();
      this.validateSelection();
    }
  }

  updateSelection() {
    // Réinitialise tous les boutons
    this.boutons.forEach((b) => b.setScale(0.5).setAlpha(0.7));

    // Met en avant le bouton sélectionné
    this.boutons[this.selectedIndex].setScale(0.6).setAlpha(1);
  }

  validateSelection() {
    switch (this.selectedIndex) {
      case 0:
        this.scene.start("credits");
        break;
      case 1:
        if (this.menuMusic && this.menuMusic.isPlaying) {
          this.menuMusic.stop();
        }
        this.scene.start("checkpoint1");
        break;
      case 2:
        this.scene.start("controles");
        break;
    }
  }
}