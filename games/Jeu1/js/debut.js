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
    this.load.image("boutonCredits", "./assets/boutonCRÉDIT.png");
    this.load.image("boutonRetour", "./assets/boutonRETOUR.png");

    // Pages
    this.load.image("pageControles", "./assets/contrele jeuv2.png");
    this.load.image("pageCredits", "./assets/page crédit.png");
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Background centré
    this.add.image(centerX, centerY, "back1").setDepth(0);

    // --- MENU PRINCIPAL ---
    this.menu = this.add.container(0, 0);

    const buttonScale = 0.4; // boutons plus petits
    const offsetX = 350; // à droite
    const offsetY = 450; // bas

    this.boutonJouer = this.createButton(centerX + offsetX, offsetY, "boutonJouer", () => {
      this.scene.start("selection");
    }).setScale(buttonScale);

    this.boutonControles = this.createButton(centerX + offsetX, offsetY + 100, "boutonControles", () => {
      this.showPage(this.pageControles);
    }).setScale(buttonScale);

    this.boutonCredits = this.createButton(centerX + offsetX, offsetY + 200, "boutonCredits", () => {
      this.showPage(this.pageCredits);
    }).setScale(buttonScale);

    this.menu.add([this.boutonJouer, this.boutonControles, this.boutonCredits]);

    // --- PAGES ---
    this.pageControles = this.add.container(0, 0).setVisible(false);
    this.pageCredits = this.add.container(0, 0).setVisible(false);

    const controlesBG = this.add.image(centerX, centerY, "pageControles");
    const creditsBG = this.add.image(centerX, centerY, "pageCredits");

    const retour1 = this.createButton(centerX + 500, centerY - 250, "boutonRetour", () => {
      this.hidePages();
    }).setScale(buttonScale);

    const retour2 = this.createButton(centerX, centerY + 300, "boutonRetour", () => {
      this.hidePages();
    }).setScale(buttonScale);

    this.pageControles.add([controlesBG, retour1]);
    this.pageCredits.add([creditsBG, retour2]);
  }

  createButton(x, y, key, callback) {
    const btn = this.add.image(x, y, key).setInteractive({ useHandCursor: true });

    btn.on("pointerover", () => btn.setScale(btn.scale * 1.2));
    btn.on("pointerout", () => btn.setScale(btn.scale / 1.2));
    btn.on("pointerdown", () => callback());

    return btn;
  }

  showPage(page) {
    this.menu.setVisible(false);
    page.setVisible(true);
  }

  hidePages() {
    this.pageControles.setVisible(false);
    this.pageCredits.setVisible(false);
    this.menu.setVisible(true);
  }
}
