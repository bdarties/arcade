// pause.js
import * as fct from "./fonctions.js";

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

    // Créer les touches pour pouvoir les vérifier dans update()
    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
  }

  update() {
    // Touche I → Reprendre le jeu
    if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
      this.scene.stop(); // ferme la scène Pause
      this.scene.resume(this.currentLevel); // reprend le niveau courant
    }

    // Touche Q → Quitter vers menu principal
    if (Phaser.Input.Keyboard.JustDown(this.keyM)) {
      // Réinitialiser toutes les stats du registry
      this.registry.set('playerHealth', 5);
      this.registry.set('playerMaxHealth', 5);
      this.registry.set('playerLevel', 1);
      this.registry.set('playerXP', 0);
      this.registry.set('enemiesKilled', 0);
      
      // Réinitialiser les skills
      this.registry.set('skillPointsAvailable', 0);
      this.registry.set('skillForce', 0);
      this.registry.set('skillVitesse', 0);
      this.registry.set('skillVie', 0);
      
      // Réinitialiser les potions
      fct.resetNbPotions();
      
      // Stopper la scène HUD
      this.scene.stop('hud');
      
      // Stopper la scène de pause et le niveau actuel
      this.scene.stop();
      this.scene.stop(this.currentLevel);
      
      // Retourner au menu
      this.scene.start("menu");
    }
  }
}
