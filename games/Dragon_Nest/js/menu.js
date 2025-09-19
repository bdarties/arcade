export default class menu extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });
    this.selectedIndex = 0; // bouton sélectionné par défaut
    this.menuItems = [];    // tableau contenant les boutons
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    // image de fond
    this.load.image("menu_bg", "./presentation.png");

    // images des boutons
    this.load.image("btn_jouer", "./assets/bouton_jouer.png");
    this.load.image("btn_controles", "./assets/bouton_controle.png");
    this.load.image("btn_credits", "./assets/bouton_credits.png");
  }

  create() {
    const { width, height } = this.scale;

    // --- Fond ---
    const bg = this.add.image(width / 2, height / 2, "menu_bg").setOrigin(0.5);
    bg.setDisplaySize(width, height);

    // --- Fonction générique pour créer un bouton image ---
    const creerBoutonImage = (y, keyImage, action) => {
      const bouton = this.add.image(width / 2, y, keyImage).setOrigin(0.5);
      bouton.setDisplaySize(200, 60); // taille réduite
      bouton.setInteractive({ useHandCursor: true });
      bouton.action = action; // stocker l'action pour l'activation clavier

      // Effet au survol souris
      bouton.on("pointerover", () => {
        this.setSelection(this.menuItems.indexOf(bouton)); // survol = sélection
      });
      bouton.on("pointerout", () => bouton.clearTint());
      bouton.on("pointerup", action);

      return bouton;
    };

    // --- Espacement vertical ---
    const spacing = 120;
    const startY = height * 0.45;

    // Création des boutons
    this.menuItems = [
      creerBoutonImage(startY, "btn_jouer", () => this.scene.start("intro")),
      creerBoutonImage(startY + spacing, "btn_controles", () => this.scene.start("controles")),
      creerBoutonImage(startY + 2 * spacing, "btn_credits", () => this.scene.start("credits"))
    ];

    // Sélectionner le premier bouton
    this.setSelection(0);

    // --- Gestion clavier ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  // Met à jour la sélection visuelle
  setSelection(index) {
    // retirer le style précédent
    this.menuItems.forEach((btn, i) => {
      btn.clearTint();
      if (i === index) {
        btn.setTint(0xba280b); // bouton sélectionné en rouge foncé
      }
    });
    this.selectedIndex = index;
  }

  update() {
    // Déplacement vers le bas
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      let newIndex = (this.selectedIndex + 1) % this.menuItems.length;
      this.setSelection(newIndex);
    }

    // Déplacement vers le haut
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      let newIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
      this.setSelection(newIndex);
    }

    // Validation avec Entrée
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      const selectedButton = this.menuItems[this.selectedIndex];
      if (selectedButton && typeof selectedButton.action === "function") {
        selectedButton.action();
      }
    }
  }
}
