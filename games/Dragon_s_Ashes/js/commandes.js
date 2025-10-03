export default class commandes extends Phaser.Scene {
  constructor() {
    super({ key: "commandes" });
  }

  preload() {
    this.load.image("commandes_fond", "./assets/commande.jpg");
    this.load.image("imageBoutonRetour", "./assets/bouton_retour.png");
  }

  create() {
    // Fond
    this.add.image(0, 0, "commandes_fond").setOrigin(0);

    // Bouton retour
    this.boutonRetour = this.add.image(650, 650, "imageBoutonRetour");
    this.boutonRetour.setInteractive();


    // Clique souris
    this.boutonRetour.on("pointerup", () => {
      this.scene.start("menu");
    });

    // Validation clavier
    this.keyEnter = this.input.keyboard.addKey("I");

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyEnter)) {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("menu");
    });

    }
  }
}
