export default class credits extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
      super({
          key: "credits" // ici on précise le nom de la classe en tant qu'identifiant
      });
  }

  preload() {
      this.load.image("button_back", "src/assets/retour.png");
      this.load.image("screen_credits", "src/assets/backdebut.png");
      this.load.image("credit1", "src/assets/credits1.png");
      this.load.image("credit2", "src/assets/credits2.png");
      this.load.image("suite", "src/assets/fleche_droite.png");
      this.load.image("retour", "src/assets/fleche_gauche.png");
      this.load.audio("click_sound", "src/assets/click.mp3"); // Charger le son
  }

  create(){
      // Créer l'image de fond
      const screen_credits = this.add.image(
          this.game.config.width / 2, 
          this.game.config.height / 2, 
          "screen_credits"
      );

      const scaleX = this.game.config.width / screen_credits.width;
      const scaleY = this.game.config.height / screen_credits.height;
      const scale = Math.max(scaleX, scaleY);
      screen_credits.setScale(scale).setScrollFactor(0);

      // Ajout des différentes images de crédits
      const credit = [
          this.add.image(400, 250, "credit1").setVisible(true),
          this.add.image(400, 250, "credit2").setVisible(false)
      ];

      let currentCreditIndex = 0;

      // Ajout du bouton "Retour"
      const button_back = this.add.image(400, 500, "button_back").setScale(0.7);

      // Ajout du bouton "Suite"
      const suite = this.add.image(400, 400, "suite").setScale(0.5);

      // Stocker les valeurs d'échelle
      const originalScale = 0.7;
      const hoverScale = 0.75;
      const originalScaleSuite = 0.5;
      const hoverScaleSuite = 0.55;

      // Charger le son pour le survol
      const clickSound = this.sound.add("click_sound");

      // Rendre les boutons interactifs
      button_back.setInteractive();    
      suite.setInteractive();

      // Gestion du survol de la souris avec son
      button_back.on("pointerover", () => {
          button_back.setScale(hoverScale);
          button_back.setTint(0xC0C0C0);
          clickSound.play();  // Jouer le son lors du survol
      });

      suite.on("pointerover", () => {
          suite.setScale(hoverScaleSuite);
          suite.setTint(0xC0C0C0);
          clickSound.play();  // Jouer le son lors du survol
      });

      // Gestion du départ de la souris
      button_back.on("pointerout", () => {
          button_back.setScale(originalScale);
          button_back.clearTint();
      });

      suite.on("pointerout", () => {
          suite.setScale(originalScaleSuite);
          suite.clearTint();
      });

      // Gestion du clic sur "Retour" (retourner à l'accueil)
      button_back.on("pointerup", () => {
        clickSound.play();
          this.scene.switch("accueil");
      });

      // Gestion du clic sur "Suite" ou "Retour"
      suite.on("pointerup", () => {
          if (currentCreditIndex < credit.length - 1) {
              credit[currentCreditIndex].setVisible(false);
              currentCreditIndex++;
              clickSound.play();
              credit[currentCreditIndex].setVisible(true);

              if (currentCreditIndex === credit.length - 1) {
                  suite.setTexture("retour");
              }
          } else {
              credit[currentCreditIndex].setVisible(false);
              currentCreditIndex--;
              clickSound.play();
              credit[currentCreditIndex].setVisible(true);

              if (currentCreditIndex === 0) {
                  suite.setTexture("suite");
              }
          }
      });
  }

  update() {
      // Fonction vide, tu peux ajouter du contenu ici si nécessaire
  }
}
