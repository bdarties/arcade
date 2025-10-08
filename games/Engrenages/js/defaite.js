export default class defaite extends Phaser.Scene {
  constructor() {
    super({ key: "defaite" });
  }

  preload() {
    this.load.image("screen_defaite", "assets/screen_defaite.png");
    this.load.image("retour_menu", "assets/retour_menu.png");
  }

  create() {
    // Affichage de l'écran de défaite en plein écran
    this.add.image(640, 360, "screen_defaite")
      .setOrigin(0.5, 0.5)
      .setDisplaySize(1280, 720);

    // Bouton retour au menu avec image
    const boutonRetour = this.add.image(100, 60, "retour_menu")
      .setInteractive()
      .setOrigin(0.5);

    boutonRetour.on('pointerdown', () => {
      this.scene.start('accueil');
    });

    // Configuration des touches clavier pour retour menu
    this.toucheMenu = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    
  }

  update() {
    // Retour au menu avec la touche M
    if (Phaser.Input.Keyboard.JustDown(this.toucheMenu)) {
      this.scene.start('accueil');
    }
  }
}