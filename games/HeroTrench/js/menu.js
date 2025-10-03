export default class menu extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });
  }

  preload() {
    this.load.image("menu1", "./assets/menu/menu1.jpg");
    this.load.image("menu2", "./assets/menu/menu2.jpg");
    this.load.image("menu3", "./assets/menu/menu3.jpg");
    this.load.image("bouton_credits", "./assets/menu/bouton_credits.png");
    this.load.image("bouton_jouer", "./assets/menu/bouton_jouer.png");
    this.load.image("bouton_oui", "./assets/menu/bouton_oui.png");
    this.load.image("bouton_non", "./assets/menu/bouton_non.png");
    this.load.image("bouton_quitter", "./assets/menu/bouton_quitter.png");
    this.load.image("bouton_rejouer", "./assets/menu/bouton_rejouer.png");
  }

  create() {
    this.afficherMenu3();
  }

  afficherMenu3() {
    // Nettoyer la scène
    this.children.removeAll();

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Fond menu3
    this.add.image(0, 0, "menu3").setOrigin(0);

    let indexSelection = 0;

    // Bouton Jouer
    var bouton_jouer = this.add.image(centerX, centerY - 50, "bouton_jouer").setOrigin(0.5);
    bouton_jouer.setScale(1.5);
    bouton_jouer.setInteractive();

    // Bouton Crédits
    var bouton_credits = this.add.image(centerX, centerY + 40, "bouton_credits").setOrigin(0.5);
    bouton_credits.setScale(1.5);
    bouton_credits.setInteractive();

    // Bouton Quitter
    var bouton_quitter = this.add.image(centerX, centerY + 120, "bouton_quitter").setOrigin(0.5);
    bouton_quitter.setScale(1.5);
    bouton_quitter.setInteractive();

    const boutons = [bouton_jouer, bouton_credits, bouton_quitter];

    const mettreAJourSelection = () => {
      boutons.forEach((bouton, index) => {
        if (index === indexSelection) {
          bouton.setScale(1.7);
        } else {
          bouton.setScale(1.5);
        }
      });
    };

    mettreAJourSelection();

    bouton_jouer.on("pointerover", () => {
      indexSelection = 0;
      mettreAJourSelection();
    });

    bouton_jouer.on("pointerdown", () => {
      this.afficherMenu1();
    });

    bouton_credits.on("pointerover", () => {
      indexSelection = 1;
      mettreAJourSelection();
    });

    bouton_credits.on("pointerdown", () => {
      this.afficherCredits();
    });

    bouton_quitter.on("pointerover", () => {
      indexSelection = 2;
      mettreAJourSelection();
    });

    bouton_quitter.on("pointerdown", () => {
      this.game.destroy(true);
    });

    // Clavier
    this.toucheHaut = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.toucheBas = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.toucheK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    this.toucheHaut.on('down', () => {
      indexSelection = (indexSelection - 1 + boutons.length) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheBas.on('down', () => {
      indexSelection = (indexSelection + 1) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheK.on('down', () => {
      if (indexSelection === 0) {
        this.afficherMenu1();
      } else if (indexSelection === 1) {
        this.afficherCredits();
      } else {
        this.game.destroy(true);
      }
    });
  }

  afficherMenu1() {
    // Nettoyer la scène
    this.children.removeAll();

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Fond menu1
    this.add.image(0, 0, "menu1").setOrigin(0);

    // Texte
    this.add.text(centerX, centerY - 150, "VOULEZ VOUS VOUS ENTRAINER SOLDAT", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(centerX, centerY - 110, "(didacticiel)", {
      fontSize: "18px",
      color: "#ffffff"
    }).setOrigin(0.5);

    let indexSelection = 0;

    // Bouton OUI (à gauche)
    var bouton_oui = this.add.image(centerX - 150, centerY, "bouton_oui").setOrigin(0.5);
    bouton_oui.setScale(1.5);
    bouton_oui.setInteractive();

    // Bouton NON (à droite)
    var bouton_non = this.add.image(centerX + 150, centerY, "bouton_non").setOrigin(0.5);
    bouton_non.setScale(1.5);
    bouton_non.setInteractive();

    // Bouton Quitter
    var bouton_quitter = this.add.image(centerX, centerY + 100, "bouton_quitter").setOrigin(0.5);
    bouton_quitter.setScale(1.5);
    bouton_quitter.setInteractive();

    const boutons = [bouton_oui, bouton_non, bouton_quitter];

    const mettreAJourSelection = () => {
      boutons.forEach((bouton, index) => {
        if (index === indexSelection) {
          bouton.setScale(1.7);
        } else {
          bouton.setScale(1.5);
        }
      });
    };

    mettreAJourSelection();

    bouton_oui.on("pointerover", () => {
      indexSelection = 0;
      mettreAJourSelection();
    });

    bouton_oui.on("pointerdown", () => {
      this.afficherDidacticiel();
    });

    bouton_non.on("pointerover", () => {
      indexSelection = 1;
      mettreAJourSelection();
    });

    bouton_non.on("pointerdown", () => {
      this.scene.start("selection");
    });

    bouton_quitter.on("pointerover", () => {
      indexSelection = 2;
      mettreAJourSelection();
    });

    bouton_quitter.on("pointerdown", () => {
      this.afficherMenu3();
    });

    // Clavier
    this.toucheHaut = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.toucheBas = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.toucheK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    this.toucheHaut.on('down', () => {
      indexSelection = (indexSelection - 1 + boutons.length) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheBas.on('down', () => {
      indexSelection = (indexSelection + 1) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheK.on('down', () => {
      if (indexSelection === 0) {
        this.afficherDidacticiel();
      } else if (indexSelection === 1) {
        this.scene.start("selection");
      } else {
        this.afficherMenu3();
      }
    });
  }

  afficherCredits() {
    // Nettoyer la scène
    this.children.removeAll();

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Fond noir
    this.add.rectangle(0, 0, 800, 600, 0x000000).setOrigin(0);

    // Texte "En travaux"
    this.add.text(centerX, centerY - 50, "En travaux", {
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    let indexSelection = 0;

    // Bouton Quitter
    var bouton_quitter = this.add.image(centerX, centerY + 100, "bouton_quitter").setOrigin(0.5);
    bouton_quitter.setScale(1.5);
    bouton_quitter.setInteractive();

    const boutons = [bouton_quitter];

    const mettreAJourSelection = () => {
      boutons.forEach((bouton, index) => {
        if (index === indexSelection) {
          bouton.setScale(1.7);
        } else {
          bouton.setScale(1.5);
        }
      });
    };

    mettreAJourSelection();

    bouton_quitter.on("pointerover", () => {
      indexSelection = 0;
      mettreAJourSelection();
    });

    bouton_quitter.on("pointerdown", () => {
      this.afficherMenu3();
    });

    // Clavier
    this.toucheHaut = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.toucheBas = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.toucheK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    this.toucheHaut.on('down', () => {
      indexSelection = (indexSelection - 1 + boutons.length) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheBas.on('down', () => {
      indexSelection = (indexSelection + 1) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheK.on('down', () => {
      this.afficherMenu3();
    });
  }

  afficherDidacticiel() {
    // Nettoyer la scène
    this.children.removeAll();

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Fond noir
    this.add.rectangle(0, 0, 800, 600, 0x000000).setOrigin(0);

    // Texte "En travaux"
    this.add.text(centerX, centerY - 100, "En travaux", {
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // Instructions
    this.add.text(centerX, centerY, "Déplacez vous avec le joystick\net arrêtez vous pour tirer", {
      fontSize: "24px",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5);

    let indexSelection = 0;

    // Bouton Quitter
    var bouton_quitter = this.add.image(centerX, centerY + 100, "bouton_quitter").setOrigin(0.5);
    bouton_quitter.setScale(1.5);
    bouton_quitter.setInteractive();

    const boutons = [bouton_quitter];

    const mettreAJourSelection = () => {
      boutons.forEach((bouton, index) => {
        if (index === indexSelection) {
          bouton.setScale(1.7);
        } else {
          bouton.setScale(1.5);
        }
      });
    };

    mettreAJourSelection();

    bouton_quitter.on("pointerover", () => {
      indexSelection = 0;
      mettreAJourSelection();
    });

    bouton_quitter.on("pointerdown", () => {
      this.afficherMenu3();
    });

    // Clavier
    this.toucheHaut = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.toucheBas = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.toucheK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    this.toucheHaut.on('down', () => {
      indexSelection = (indexSelection - 1 + boutons.length) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheBas.on('down', () => {
      indexSelection = (indexSelection + 1) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheK.on('down', () => {
      this.afficherMenu3();
    });
  }
}