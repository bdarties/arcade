export default class menu extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });
  }

  preload() {
    this.load.audio("musique_menu", "./assets/musique_menu.ogg");

    this.load.image("menu_fond", "./assets/ecran_titre.jpg");
    this.load.image("imageBoutonPlay", "./assets/bouton_jouer.png");
    this.load.image("imageBoutonCommande", "./assets/bouton_commandes.png");
    this.load.image("imageBoutonCredits", "./assets/bouton_credits.png");
  }

  create() {
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // 🔊 Vérifie si la musique du menu existe déjà
    const musiqueExistante = this.sound.get("musique_menu");

    if (!musiqueExistante) {
      this.musiqueMenu = this.sound.add("musique_menu", { loop: true, volume: 0.5 });
      this.musiqueMenu.play();
    } else if (!musiqueExistante.isPlaying) {
      musiqueExistante.play();
    }

    // Fond
    this.add.image(0, 0, "menu_fond").setOrigin(0).setDepth(0);

    // Boutons
    this.boutons = [];
const bouton_commande = this.add.image(320, 600, "imageBoutonCommande").setDepth(1);
const bouton_play = this.add.image(640, 450, "imageBoutonPlay").setDepth(1);
const bouton_credits = this.add.image(960, 600, "imageBoutonCredits").setDepth(1);

this.boutons.push(bouton_commande); // index 0
this.boutons.push(bouton_play);     // index 1
this.boutons.push(bouton_credits);  // index 2

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

    // Validation avec ENTER (touche "I")
    if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey("I"))) {
      this.executeAction(this.indexSelection);
    }
  }

  updateSelection() {
    this.boutons.forEach((btn, i) => {
      if (i === this.indexSelection) {
        btn.setScale(1.2);
        btn.setTint();
      } else {
        btn.setScale(1);
        btn.setTint(0x555555);
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
      case 2: // bouton_credits
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.start("credits"); // Assure-toi que la scène "credits" existe
        });
        break;
    }
  }
}
