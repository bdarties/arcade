export default class victoire extends Phaser.Scene {
  constructor() {
    super({ key: "victoire" });
  }

  preload() {
    this.load.image("screen_victoire", "assets/screen_victoire.png");
    this.load.image("retour_menu", "assets/retour_menu.png");
  }

  create() {
    // Affichage de l'écran de victoire en plein écran
    this.add.image(640, 360, "screen_victoire")
      .setOrigin(0.5, 0.5)
      .setDisplaySize(1280, 720);

    // Bouton retour au menu avec image
    const boutonRetour = this.add.image(100, 60, "retour_menu")
      .setInteractive()
      .setOrigin(0.5);

    boutonRetour.on('pointerdown', () => {
      this.scene.start('accueil');
    });
  }
}