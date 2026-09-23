export default class bd2 extends Phaser.Scene {
  constructor() {
    super({ key: "bd2" });
  }

  preload() {
    this.load.image("bd2_background", "assets/bd2.jpeg");
  }

  create() {
    const { width, height } = this.scale;
    
    // Créer l'image de fond et l'adapter à tout l'écran
    const background = this.add.image(width / 2, height / 2, "bd2_background");
    
    // Redimensionner l'image pour couvrir tout l'écran tout en conservant les proportions
    background.setDisplaySize(width, height);
    
    // 🔹 Touche I pour passer à la scène suivante
    this.iKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    
    // Optionnel : Ajouter un texte d'instruction
    this.add.text(width / 2, height - 50, "Appuyez sur I pour continuer", {
      fontSize: "24px",
      fill: "#ffffff",
      backgroundColor: "#000000",
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5);
  }

  update() {
    // 🔹 Si la touche I est pressée, on passe vers niveau3
    if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
      this.scene.start("niveau3");
    }
  }
}