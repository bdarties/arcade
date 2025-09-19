export default class debut extends Phaser.Scene {
  constructor() {
    super({ key: "debut" });
  }

  preload() {
    // Background
    this.load.image("back1", "./assets/back1fini.png");

    // Boutons
    this.load.image("boutonJouer", "./assets/boutonjouer.png");
    this.load.image("boutonControles", "./assets/boutoncontroles.png");
    this.load.image("boutonCredits", "./assets/boutonCREDIT.png");
    this.load.image("boutonRetour", "./assets/boutonRETOUR.png");

    // Pages
    this.load.image("pageControles", "./assets/contrele jeuv2.png");
    this.load.image("pageCredits", "./assets/page credit.png");
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.add.image(centerX, centerY, "back1").setDepth(0);

    const buttonScale = 0.25;
    const offsetX = 350;
    const offsetY = 400;

    // --- MENU PRINCIPAL ---
    this.menu = this.add.container(0, 0);
    this.menuButtons = [];

    this.boutonJouer = this.createButton(centerX + offsetX, offsetY, "boutonJouer", () => {
      this.scene.start("selection");
    }, buttonScale);
    this.menuButtons.push(this.boutonJouer);

    this.boutonControles = this.createButton(centerX + offsetX, offsetY + 125, "boutonControles", () => {
      this.showPage(this.pageControles, this.retour1);
    }, buttonScale);
    this.menuButtons.push(this.boutonControles);

    this.boutonCredits = this.createButton(centerX + offsetX, offsetY + 250, "boutonCredits", () => {
      this.showPage(this.pageCredits, this.retour2);
    }, buttonScale);
    this.menuButtons.push(this.boutonCredits);

    this.menu.add(this.menuButtons);

    // --- PAGES ---
    this.pageControles = this.add.container(0, 0).setVisible(false);
    this.pageCredits = this.add.container(0, 0).setVisible(false);

    const controlesBG = this.add.image(centerX, centerY, "pageControles");
    const creditsBG = this.add.image(centerX, centerY, "pageCredits");

    // Boutons retour
    this.retour1 = this.createButton(centerX + 500, centerY - 250, "boutonRetour", () => this.hidePages(), buttonScale);
    this.retour2 = this.createButton(centerX, centerY + 300, "boutonRetour", () => this.hidePages(), buttonScale);

    this.pageControles.add([controlesBG, this.retour1]);
    this.pageCredits.add([creditsBG, this.retour2]);

    // --- Navigation clavier ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // On commence avec le menu actif
    this.activeButtons = this.menuButtons;
    this.selectedIndex = 0;
    this.updateButtonSelection();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.selectedIndex = (this.selectedIndex + 1) % this.activeButtons.length;
      this.updateButtonSelection();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.selectedIndex = (this.selectedIndex - 1 + this.activeButtons.length) % this.activeButtons.length;
      this.updateButtonSelection();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
      const btn = this.activeButtons[this.selectedIndex];
      if (btn.callback) btn.callback();
    }
  }

  createButton(x, y, key, callback, scale = 1) {
    const btn = this.add.image(x, y, key).setInteractive({ useHandCursor: true }).setScale(scale);
    btn.callback = callback;

    btn.on("pointerover", () => this.setSelectedButton(btn));
    btn.on("pointerout", () => this.updateButtonSelection());
    btn.on("pointerdown", () => callback());

    return btn;
  }

  setSelectedButton(btn) {
    const idx = this.activeButtons.indexOf(btn);
    if (idx >= 0) {
      this.selectedIndex = idx;
      this.updateButtonSelection();
    }
  }

  updateButtonSelection() {
  this.activeButtons.forEach((btn, i) => {
    // Si c'est un bouton retour, on garde sa taille initiale
    if (btn === this.retour1 || btn === this.retour2) {
      btn.setScale(0.3); // taille originale
    } else {
      btn.setScale(i === this.selectedIndex ? 1.2 * 0.4 : 0.4);
    }
  });
}


  showPage(page, retourBtn) {
    this.menu.setVisible(false);
    page.setVisible(true);

    // Active seulement le bouton retour
    this.activeButtons = [retourBtn];
    this.selectedIndex = 0;
    this.updateButtonSelection();
  }

  hidePages() {
    this.pageControles.setVisible(false);
    this.pageCredits.setVisible(false);
    this.menu.setVisible(true);

    // Retour au menu principal
    this.activeButtons = this.menuButtons;
    this.selectedIndex = 0;
    this.updateButtonSelection();
  }
}
