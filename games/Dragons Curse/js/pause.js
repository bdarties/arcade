// pause.js
export default class PauseManager extends Phaser.Scene {
  constructor() {
    super({ key: "PauseScene" });
  }

  init(data) {
    // On enregistre le niveau depuis lequel la pause a été déclenchée
    this.currentLevel = data.from;
  }

  create() {
    // Fond semi-transparent qui recouvre l'écran
    this.add.rectangle(640, 365, 1280, 720, 0x000000, 0.6);

    // Titre Pause
    this.add.text(540, 250, "Pause", {
      fontSize: "64px",
      fontFamily: "Arial",
      color: "#ffffff"
    });

    // Texte instructions
    this.add.text(450, 380, "Appuie sur R pour reprendre", {
      fontSize: "28px",
      color: "#ffffff"
    });

    this.add.text(450, 430, "Appuie sur Q pour retourner au menu", {
      fontSize: "28px",
      color: "#ffffff"
    });

    // Créer les touches R et Q pour pouvoir les vérifier dans update()
    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
  }

  update() {
    // Touche I → Reprendre le jeu
    if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
      this.scene.stop(); // ferme la scène Pause
      this.scene.resume(this.currentLevel); // reprend le niveau courant
    }

    // Touche A → Quitter vers menu principal
    if (Phaser.Input.Keyboard.JustDown(this.keyA)) {
      this.scene.stop();
      this.scene.stop(this.currentLevel); // stoppe aussi le niveau en pause
      this.scene.start("menu"); // ou "selection" si c'est ton hub
    }
  }
}
