export default class debut extends Phaser.Scene {
  constructor() {
    super({ key: "debut" });
  }

  preload() {
    // Background
    this.load.image("back1", "./assets/back1fini.jpg");

    // Boutons
    this.load.image("boutonJouer", "./assets/boutonjouer.png");
    this.load.image("boutonControles", "./assets/boutoncontroles.png");
    this.load.image("boutonCredits", "./assets/boutoncredit.png");
    this.load.image("boutonRetour", "./assets/boutonretour.png");
    this.load.image("oui", "./assets/oui.png");
    this.load.image("non", "./assets/non.png");

    // Pages
    this.load.image("pageControles", "./assets/commandes.jpg");
    this.load.image("pageCredits", "./assets/credits.jpg");

    //Musik
    this.load.audio("music", "./assets/musique_sfx/musique_1.mp3");
    this.load.audio("whoosh", "./assets/musique_sfx/whoosh.mp3");
    this.load.audio("select", "./assets/musique_sfx/select.mp3");
    this.load.audio("click", "./assets/musique_sfx/click.mp3");
  }

  create() {
  this.whoosh = this.sound.add('whoosh', { volume: 0.4, loop: false });
  this.click = this.sound.add('click', { volume: 0.4, loop: false });
  this.select = this.sound.add('select', { volume: 0.4, loop: false });
  // Stop toutes les musiques et relance celle du menu
  this.sound.stopAll();
  this.music = this.sound.add("music", { volume: 0.3, loop: true });
  this.music.play();
    this.currentMode = "menu";
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
      
        this.click.play();
    }, buttonScale);
    this.menuButtons.push(this.boutonJouer);

    this.boutonControles = this.createButton(centerX + offsetX, offsetY + 125, "boutonControles", () => {
      this.showPage(this.pageControles, this.retour1);
      
        this.click.play();
    }, buttonScale);
    this.menuButtons.push(this.boutonControles);

    this.boutonCredits = this.createButton(centerX + offsetX, offsetY + 250, "boutonCredits", () => {
      this.showPage(this.pageCredits, this.retour2);
      
        this.click.play();
    }, buttonScale);
    this.menuButtons.push(this.boutonCredits);

    this.menu.add(this.menuButtons);

    // --- PAGES ---
    this.pageControles = this.add.container(0, 0).setVisible(false);
    this.pageCredits = this.add.container(0, 0).setVisible(false);

    const controlesBG = this.add.image(centerX, centerY, "pageControles");
    const creditsBG = this.add.image(centerX, centerY, "pageCredits");

    // Boutons retour
    this.retour1 = this.createButton(centerX, centerY + 290, "boutonRetour", () => this.hidePages(), buttonScale);
    this.retour2 = this.createButton(centerX, centerY + 305, "boutonRetour", () => this.hidePages(), buttonScale);

    this.pageControles.add([controlesBG, this.retour1]);
    this.pageCredits.add([creditsBG, this.retour2]);

    // --- Navigation clavier ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // On commence avec le menu actif
    this.activeButtons = this.menuButtons;
    this.selectedIndex = 0;
    this.updateButtonSelection();




    //TUTO
    this.askTutorialContainer = this.add.container(0, 0).setVisible(false);
    this.askTutorialBg = this.add.rectangle(centerX, centerY, 400, 200, 0x000000, 0.7);
    this.askTutorialText = this.add.text(centerX, centerY - 50, "Veux-tu ignorer le tutoriel ?", {
        fontSize: "24px",
        color: "#ffffff",
        fontFamily: "Arial",
    }).setOrigin(0.5);

    this.btnOui = this.createButton(centerX - 80, centerY + 40, "oui", () => this.startSelection(), 0.4);
    this.btnNon = this.createButton(centerX + 80, centerY + 40, "non", () => this.startTutorial(), 0.4);

    // On stocke les boutons pour navigation clavier
    this.askButtons = [this.btnOui, this.btnNon];
    this.askSelectedIndex = 0;
    

    // Ajout au container
    this.askTutorialContainer.add([this.askTutorialBg, this.askTutorialText, this.btnOui, this.btnNon]);

    // --- Nouvelle fonction pour l'animation du menu principal ---
    this.boutonJouer.callback = () => this.showTutorialPrompt();

  }

  update() {
    if (this.currentMode === "menu") {
        // --- Main menu navigation (up/down + I) ---
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.selectedIndex = (this.selectedIndex + 1) % this.activeButtons.length;
            this.updateButtonSelection();
            this.select.play();
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.selectedIndex = (this.selectedIndex - 1 + this.activeButtons.length) % this.activeButtons.length;
            this.updateButtonSelection();
            this.select.play();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
          
        this.click.play();
            const btn = this.activeButtons[this.selectedIndex];
            if (btn.callback) btn.callback();
        }
    } 
    
    else if (this.currentMode === "ask") {
        // --- Tutorial prompt navigation (left/right + I) ---
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.askSelectedIndex = (this.askSelectedIndex - 1 + this.askButtons.length) % this.askButtons.length;
            this.updateAskSelection();
            this.select.play();
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.askSelectedIndex = (this.askSelectedIndex + 1) % this.askButtons.length;
            this.updateAskSelection();
            this.select.play();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
          
        this.click.play();
            const btn = this.askButtons[this.askSelectedIndex];
            if (btn.callback) btn.callback();
        }
    }
}


  createButton(x, y, key, callback, scale = 1) {
    const btn = this.add.image(x, y, key).setInteractive({ useHandCursor: true }).setScale(scale);
    btn.callback = callback;

    btn.on("pointerover", () => this.setSelectedButton(btn));this.select.play();
    btn.on("pointerout", () => this.updateButtonSelection());
    btn.on("pointerdown", () => {
      this.setSelectedButton(btn);
      if (btn.callback) btn.callback();
    });

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
        const isSelected = i === this.selectedIndex;
        if (btn === this.retour1 || btn === this.retour2) {
            btn.setScale(isSelected ? 0.35 : 0.3);
        } else {
            btn.setScale(isSelected ? 0.5 : 0.4);
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
    this.currentMode = "menu";
  }

  hidePages() {
    this.pageControles.setVisible(false);
    this.pageCredits.setVisible(false);
    this.menu.setVisible(true);
        this.click.play();

    // Retour au menu principal
    this.activeButtons = this.menuButtons;
    this.selectedIndex = 0;
    this.updateButtonSelection();
    this.currentMode = "menu";
  }

  showTutorialPrompt() {
    // Slide des boutons du menu principal vers la droite
    this.whoosh.play();
    this.menuButtons.forEach(btn => {
        this.tweens.add({
            targets: btn,
            x: this.cameras.main.width + 200,
            duration: 500,
            ease: 'Cubic.easeInOut'
        });
    });

    // Slide du rectangle semi-transparent depuis la gauche
    this.askTutorialContainer.setVisible(true);
    this.askTutorialContainer.x = -this.cameras.main.width;
    this.tweens.add({
        targets: this.askTutorialContainer,
        x: 0,
        duration: 500,
        ease: 'Cubic.easeInOut'
    });

    // Active la navigation clavier sur OUI/NON
    this.activeButtons = this.askButtons;
    this.askSelectedIndex = 0;
    this.updateAskSelection();
    this.currentMode = "ask";
}

// Navigation clavier pour OUI/NON
updateAskSelection() {
    this.askButtons.forEach((btn, i) => {
        btn.setScale(i === this.askSelectedIndex ? 0.5 : 0.4);
    });
}

startSelection() {
    this.scene.start("selection");
this.music.stop();
}

startTutorial() {
    this.scene.start("tutoriel");
}

}

