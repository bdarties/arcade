export default class credits extends Phaser.Scene {
  constructor() {
    super({ key: "credits" });
  }

  preload() {
    // charger l'image du fond et du bouton retour
    this.load.image("page_acceuil", "./assets/page_acceuil.jpg");
    this.load.image("btn_retour", "./assets/btn_retour.png");

    // son de clic
    this.load.audio("btnClick", "./assets/boutonclick.mp3"); // remplace par un vrai fichier audio
  }

  create() {
    // --- FOND ---
    const bg = this.add.image(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      "page_acceuil"
    );
    let scaleX = this.cameras.main.width / bg.width;
    let scaleY = this.cameras.main.height / bg.height;
    let scale = Math.max(scaleX, scaleY);
    bg.setScale(scale).setScrollFactor(0);

    // --- FILTRE NOIR (60% opacity) ---
    const filtreNoir = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.6
    );
    filtreNoir.setScrollFactor(0);

    // --- TITRE ---
    this.add.text(
      this.cameras.main.width / 2,
      100,
      "Crédits",
      { font: "48px Courier", fill: "#fff" }
    ).setOrigin(0.5);

    // --- EXPLICATIONS ---
    this.add.text(
      this.cameras.main.width / 2,
      250,
      "Tileset: craftpix.net & KnoblePersona\nEnnemis: craftpix.net",
      { font: "32px Courier", fill: "#fff", align: "center" }
    ).setOrigin(0.5);

    // --- BOUTON RETOUR ---
    this.boutonRetour = this.add.image(
      this.cameras.main.width - 50,
      this.cameras.main.height - 50,
      "btn_retour"
    ).setOrigin(1, 1)
     .setScale(0.45);

    // --- CLAVIER ---
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.selectedIndex = 0; // bouton retour sélectionné

    // --- SON ---
    this.sndClick = this.sound.add("btnClick");
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
      this.sndClick.play(); // jouer le son au retour
      this.validateSelection();
    }
  }

  validateSelection() {
    if (this.selectedIndex === 0) {
      this.scene.start("accueil");
    }
  }
}