export default class commandes extends Phaser.Scene {
  constructor() {
    super({ key: "histoire" });
  }

  preload() {
    this.load.image("histoire_fond", "./assets/histoire.jpg");
    this.load.image("imageBoutonJouer", "./assets/bouton_jouer.png");
  }

  create() {
    // Fond
    this.add.image(0, 0, "histoire_fond").setOrigin(0);

    // Bouton retour
    this.boutonRetour = this.add.image(650, 650, "imageBoutonJouer");
    this.boutonRetour.setInteractive();


    // Clique souris
    this.boutonRetour.on("pointerup", () => {
              let musique = this.sound.get("musique_menu");
            if (musique && musique.isPlaying) {
                musique.stop();
        }
      this.scene.start("selection");
    });

    // Validation clavier
    this.keyEnter = this.input.keyboard.addKey("I");

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyEnter)) {
        let musique = this.sound.get("musique_menu");
            if (musique && musique.isPlaying) {
                musique.stop();
        }

        this.cameras.main.fadeOut(1500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("selection");
         });
  };

}
}
