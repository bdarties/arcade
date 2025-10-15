export default class commandes extends Phaser.Scene {
  constructor() {
    super({ key: "victoire" });
  }

  preload() {
    this.load.image("victoire_fond", "./assets/victoire.jpg");
    this.load.image("imageBoutonRejouer", "./assets/bouton_rejouer.png");
    this.load.image("imageBoutonMenu", "./assets/bouton_menu.png");

    this.load.audio("musique_victoire", "./assets/victoire.ogg");
  }

  create() {

this.sound.stopAll(); // <-- essentiel
this.musiqueVictoire = this.sound.add("musique_victoire", { volume: 0.3 });
this.musiqueVictoire.play();
    
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Fond
    this.add.image(0, 0, "victoire_fond").setOrigin(0).setDepth(0);

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
this.cameras.main.fadeOut(1500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("selection");
    });
        break;
      case 1: // bouton_menu
        this.cameras.main.fadeOut(1500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("menu");
    });
        break;
    }
  }
}