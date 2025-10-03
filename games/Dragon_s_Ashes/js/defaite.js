export default class commandes extends Phaser.Scene {
  constructor() {
    super({ key: "defaite" });
  }

  preload() {
    this.load.audio("musique_defaite", "./assets/musique_defaite.ogg");

    this.load.image("defaite_fond", "./assets/defaite.jpg");
    this.load.image("imageBoutonRejouer", "./assets/bouton_rejouer.png");
    this.load.image("imageBoutonMenu", "./assets/bouton_menu.png");
  }

  create() {
    // Musique de fond
    if (!this.sound.get("musique_defaite")) {
      this.musiqueDefaite = this.sound.add("musique_defaite", { loop: true, volume: 0.5 });
      this.musiqueDefaite.play();
    }

    // Fond
    this.add.image(0, 0, "defaite_fond").setOrigin(0).setDepth(0);

    // Boutons
    this.boutons = [];
    const bouton_menu = this.add.image(950, 600, "imageBoutonMenu").setDepth(1);
    const bouton_rejouer = this.add.image(300, 600, "imageBoutonRejouer").setDepth(1);

    this.boutons.push(bouton_rejouer); // index 0
    this.boutons.push(bouton_menu);     // index 1

    // Définir bouton sélectionné
    this.indexSelection = 0;
    this.updateSelection();

    // Rendre tous interactifs
    this.boutons.forEach((btn, i) => {
      btn.setInteractive();
      btn.on("pointerup", () => {
        this.executeAction(i);
      });
    });

    // Gestion clavier
    this.cursors = this.input.keyboard.createCursorKeys();

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  update() {
    // Navigation gauche/droite
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.indexSelection--;
      if (this.indexSelection < 0) this.indexSelection = this.boutons.length - 1;
      this.updateSelection();
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.indexSelection++;
      if (this.indexSelection >= this.boutons.length) this.indexSelection = 0;
      this.updateSelection();
    }


    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey("I"))) {
      this.executeAction(this.indexSelection);
    }
  }

  updateSelection() {
    // Boutons non sélectionnés : plus sombre
    this.boutons.forEach((btn, i) => {
      if (i === this.indexSelection) {
        btn.setScale(1.2);
        btn.setTint();
      } else {
        btn.setScale(1);
        btn.setTint(0x555555); // bouton non sélectionné sombre
      }
    });
  }

  executeAction(index) {
    switch (index) {
      case 0: // bouton_rejouer
        this.musiqueDefaite.stop();
        this.cameras.main.fadeOut(1500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("selection");
    });
        break;
      case 1: // bouton_menu
        this.musiqueDefaite.stop();       
        this.cameras.main.fadeOut(1500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("menu");
    });
        break;
    }
  }
}