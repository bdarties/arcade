export default class controles extends Phaser.Scene {
  constructor() {
    super({ key: "controles" });
  }

  preload() {
    // charger l'image du fond et du bouton retour
    this.load.image("fondControles", "./assets/page_controle.jpg");
    this.load.image("btn_retour", "./assets/btn_retour.png");

    // son de clic
    this.load.audio("btnClick", "./assets/boutonclick.mp3"); // remplace par un vrai fichier audio
  }

  create() {
    // --- FOND ---
    const bg = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      "fondControles"
    );
    let scaleX = this.cameras.main.width / bg.width;
    let scaleY = this.cameras.main.height / bg.height;
    let scale = Math.max(scaleX, scaleY);
    bg.setScale(scale).setScrollFactor(0);

    // --- BOUTON RETOUR ---
    this.boutonRetour = this.add.image(
      this.cameras.main.width - 50,
      this.cameras.main.height - 50,
      "btn_retour"
    ).setOrigin(1, 1)
     .setScale(0.45);

    // --- CLAVIER ---
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.selectedIndex = 0; // bouton retour sélectionné par défaut

    // --- SON ---
    this.sndClick = this.sound.add("btnClick");
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
      this.sndClick.play(); // jouer le son avant de revenir
      this.validateSelection();
    }
  }

  validateSelection() {
    if (this.selectedIndex === 0) {
      this.scene.start("accueil");
    }
  }
}