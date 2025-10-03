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

    // Touche R → Reprendre le jeu
    this.input.keyboard.on("keydown-R", () => {
      this.scene.stop(); // ferme la scène Pause
      this.scene.resume(this.currentLevel); // reprend le niveau courant
    });

    // Touche Q → Quitter vers menu principal
    this.input.keyboard.on("keydown-Q", () => {
      this.scene.stop();
      this.scene.stop(this.currentLevel); // stoppe aussi le niveau en pause
      this.scene.start("menu"); // ou "selection" si c’est ton hub
    });
  }
}
