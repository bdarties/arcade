export default class Menu extends Phaser.Scene {
  constructor() {
    super("Menu");
  }

  preload() {
    this.load.image("fond_menu", "./presentation.png");
    this.load.image("jouer", "./assets/menu/button_jouer.png");
    this.load.image("controles", "./assets/menu/button_controles.png");
    this.load.image("credits", "./assets/menu/button_credits.png");
    // L'image de l'histoire est bien chargée ici
    this.load.image("story_screen", "./assets/menu/story_screen.png");
  }

  create() {
    this.add.image(0, 0, "fond_menu").setOrigin(0);

    // Liste des actions (dans l'ordre des boutons)
    const actions = [
      // 1. Bouton "Jouer" : Affiche l'écran d'histoire au lieu de lancer directement le niveau
      () => {
        // Option A : Afficher l'image par-dessus le menu actuel en attendant un clic
        const storyImg = this.add.image(0, 0, "story_screen").setOrigin(0).setInteractive();
        storyImg.on("pointerdown", () => {
          this.scene.start("niveau1"); // Lance le niveau après le clic sur l'histoire
        });
        
        // (Optionnel) Permettre aussi de passer l'histoire avec Entrée ou Espace
        const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        enterKey.once("down", () => {
          this.scene.start("Niveau_demo");
        });
      },
      // 2. Bouton "Contrôles"
      () => this.scene.start("Controles"),
      // 3. Bouton "Credits"
      () => this.scene.start("Credits")
    ];

    // Création des 3 boutons du menu
    this.buttons = [
      this.add.image(250, 450, "jouer").setInteractive(),
      this.add.image(250, 550, "controles").setInteractive(),
      this.add.image(250, 650, "credits").setInteractive()
    ];

    this.index = 0; 
    this.updateFocus(); 

    // Navigation clavier (ajustée à 3 boutons au lieu de 4, car "Story" n'est pas un bouton du menu principal)
    this.input.keyboard.on("keydown-UP", () => {
      this.index = (this.index - 1 + 3) % 3;
      this.updateFocus();
    });

    this.input.keyboard.on("keydown-DOWN", () => {
      this.index = (this.index + 1) % 3;
      this.updateFocus();
    });

    this.input.keyboard.on("keydown-ENTER", () => actions[this.index]());

    // Gestion de la souris
    this.buttons.forEach((btn, i) => {
      btn.on("pointerover", () => { this.index = i; this.updateFocus(); });
      btn.on("pointerdown", () => actions[i]());
    });
  }

  updateFocus() {
    this.buttons.forEach((btn, i) => {
      btn.setTint(i === this.index ? 0xffffff : 0x888888);
    });
  }
}