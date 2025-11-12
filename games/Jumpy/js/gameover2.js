export default class gameover2 extends Phaser.Scene {
    constructor() {
      super({ key: "gameover2" });
    }
  
    init(data) {
      // Scores des deux joueurs
      this.scoreJ1 = data.scoreJ1 || 0;
      this.scoreJ2 = data.scoreJ2 || 0;
    }
  
    preload() {
      this.load.image("btn_rejouer", "./assets/button_rejouer1.png");
      this.load.image("btn_menu", "./assets/button_menu1.png");
      this.load.image("fond_gameover2", "./assets/fond_gameover2.jpg");
    }
  
    create() {
      // Fond semi-transparent
      //this.add.rectangle(640, 360, 1280, 720, 0x1a1a1a, 0.9);
      this.add.image(640, 360, "fond_gameover2");

  
      // Calcul du gagnant
      const gagnant = this.scoreJ1 > this.scoreJ2 ? "Joueur 1" : "Joueur 2"; // Permet de gérer les égalités aussi
      const scoreGagnant = this.scoreJ1 > this.scoreJ2 ? this.scoreJ1 : this.scoreJ2; // Score du gagnant
  
      /*
      // Titre
      this.add.text(640, 220, " Tableau des Scores ", {
        fontSize: "44px",
        fill: "#ffff00",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 6
      }).setOrigin(0.5);*/
  
      // Lignes du tableau
      const ligne1 = this.add.rectangle(640, 300, 660, 60, 0x333333, 0.9)
        .setStrokeStyle(2, 0xffffff);
      const ligne2 = this.add.rectangle(640, 370, 660, 60, 0x333333, 0.9)
        .setStrokeStyle(2, 0xffffff);
  
      // Texte joueurs
      this.add.text(400, 300, "Joueur 1", {
        fontSize: "32px",
        fill: this.scoreJ1 >= this.scoreJ2 ? "#00ff00" : "#ff5555",// Vert si gagnant ou égalité, rouge sinon
        fontFamily: "Arial"
      }).setOrigin(0.5);
      this.add.text(880, 300, `${this.scoreJ1} pts`, {// Score joueur 1
        fontSize: "32px",
        fill: "#ffffff",
        fontFamily: "Arial"
      }).setOrigin(0.5);
  
      this.add.text(400, 370, "Joueur 2", {
        fontSize: "32px",
        fill: this.scoreJ2 > this.scoreJ1 ? "#00ff00" : "#ff5555",// Vert si gagnant, rouge sinon
        fontFamily: "Arial"
      }).setOrigin(0.5);
      this.add.text(880, 370, `${this.scoreJ2} pts`, {
        fontSize: "32px",
        fill: "#ffffff",
        fontFamily: "Arial"
      }).setOrigin(0.5);
  
      // Texte gagnant
      this.add.text(640, 460, ` ${gagnant} a gagné avec ${scoreGagnant} points !`, {
        fontSize: "36px",
        fill: "#ffff00",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 5
      }).setOrigin(0.5);
  
      // Boutons "Rejouer" et "Menu"
      this.createImageButtons();
    }
  
    createImageButtons() {
      const centerX = 640;
      const centerY = 550;
      const spacing = 200;
  
      this.buttons = [];
  
      // Rejouer
      const playBtn = this.add.image(centerX - spacing, centerY, "btn_rejouer")
        .setOrigin(0.5)
        .setScale(1)
        .setInteractive();
      playBtn.on("pointerdown", () => this.scene.start("scenario2"));
      this.buttons.push({ image: playBtn, callback: () => this.scene.start("scenario2") });
  
      // Menu
      const menuBtn = this.add.image(centerX + spacing, centerY, "btn_menu")
        .setOrigin(0.5)
        .setScale(1)
        .setInteractive();
      menuBtn.on("pointerdown", () => this.scene.start("menu"));
      this.buttons.push({ image: menuBtn, callback: () => this.scene.start("menu") });
  
      this.selectedButtonIndex = 0;
      this.updateButtonSelection();
  
      // Contrôle clavier
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
  
      this.input.keyboard.on("keydown", (event) => {
        if (event.code === "ArrowRight" || event.code === "ArrowDown") {
          this.selectedButtonIndex = (this.selectedButtonIndex + 1) % this.buttons.length;
          this.updateButtonSelection();
        }
        if (event.code === "ArrowLeft" || event.code === "ArrowUp") {
          this.selectedButtonIndex = (this.selectedButtonIndex - 1 + this.buttons.length) % this.buttons.length;
          this.updateButtonSelection();
        }
        if (event.code === "KeyI") {
          const btn = this.buttons[this.selectedButtonIndex];
          if (btn && btn.callback) btn.callback();
        }
      });
    }
  
    updateButtonSelection() {
      this.buttons.forEach((b, i) => {
        if (i === this.selectedButtonIndex) {
          b.image.setScale(1.2);
        } else {
          b.image.clearTint().setScale(1);
        }
      });
    }
  }