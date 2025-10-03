export default class menu extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });
  }

  preload() {
    this.load.audio("musique_menu", "./assets/musique_menu.ogg");

    this.load.image("menu_fond", "./assets/ecran_titre.jpg");
    this.load.image("imageBoutonPlay", "./assets/bouton_jouer.png");
    this.load.image("imageBoutonCommande", "./assets/bouton_commandes.png");

  }

create() {
    // Musique de fond
    if (!this.sound.get("musique_menu")) {
      this.musiqueMenu = this.sound.add("musique_menu", { loop: true, volume: 0.5 });
      this.musiqueMenu.play();
    }
    // Fond
    this.add.image(0, 0, "menu_fond").setOrigin(0).setDepth(0);

    // Boutons
    this.boutons = [];
    const bouton_play = this.add.image(950, 600, "imageBoutonPlay").setDepth(1);
    const bouton_commande = this.add.image(300, 600, "imageBoutonCommande").setDepth(1);

    this.boutons.push(bouton_commande); // index 0
    this.boutons.push(bouton_play);     // index 1

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

    // Validation avec ENTER
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
      case 0: // bouton_commande
this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("commandes");
    });
        break;
      case 1: // bouton_play
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("histoire");
    });
        break;
    }
  }
}