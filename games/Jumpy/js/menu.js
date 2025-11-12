export default class menu extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });
  }

  preload() {
    // Chargement des images
    this.load.image("menu_fond", "./assets/fond_menu.jpg");
    this.load.image("imageBoutonPlay", "./assets/button_1joueur1.png");
    this.load.image("imageBouton2Joueurs", "./assets/button_2joueur1.png");
    this.load.image("imageBoutonCommandes", "./assets/button_commandes1.png");
    this.load.image("imageBoutonCredits", "./assets/button_credit1.png");
    this.load.audio("musiqueFond", "./assets/musiquefond.mp3");
  }

  create() {

    if (!this.sound.get("musiqueFond")) {
      const musique = this.sound.add("musiqueFond", {
        volume: 0.1,  // ajuste le volume
        loop: true
      });
      musique.play();
    }


    // On place l'image de fond
    this.add.image(640, 360, "menu_fond");

    // Création des boutons
    var bouton_play = this.add.image(270, 300, "imageBoutonPlay").setDepth(1);  
    var bouton_2joueur = this.add.image(270, 400, "imageBouton2Joueurs").setDepth(1);
    var bouton_commandes = this.add.image(270, 500, "imageBoutonCommandes").setDepth(1);
    var bouton_credits = this.add.image(270, 600, "imageBoutonCredits").setDepth(1);


    // On stocke les boutons dans un tableau (ordre vertical)
    this.boutons = [bouton_play, bouton_2joueur, bouton_commandes, bouton_credits];

    // Index du bouton sélectionné (par défaut = 0 → le premier)
    this.boutonSelectionne = 0;

    // On applique un scale augmenté sur le premier bouton pour montrer qu’il est sélectionné
    this.boutons[this.boutonSelectionne].setScale(1.2);

    // Raccourcis clavier (flèches et touche "I")
    this.cursors = this.input.keyboard.createCursorKeys(); // flèches
    this.toucheValidation = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    // Actions associées à chaque bouton quand il est "validé"
    this.actions = [
      () => this.scene.start("scenario"),     // bouton 0 : play
      () => this.scene.start("scenario2"),     // bouton 1 : 2 joueurs
      () => this.scene.start("commandes"),   // bouton 2 : commandes
      () => this.scene.start("credits"),     // bouton 3 : crédits
    ];
  }

  update() {
    // Gestion des flèches haut et bas (navigation entre boutons)
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      // Réinitialise l’échelle du bouton actuel
      this.boutons[this.boutonSelectionne].setScale(1);

      // Décrémente l’index → bouton précédent
      this.boutonSelectionne--;

      // Si on dépasse le haut, on revient au dernier
      if (this.boutonSelectionne < 0) {
        this.boutonSelectionne = this.boutons.length - 1;
      }

      // Met le bouton sélectionné en "focus"
      this.boutons[this.boutonSelectionne].setScale(1.2);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      // Réinitialise l’échelle du bouton actuel
      this.boutons[this.boutonSelectionne].setScale(1);

      // Incrémente l’index → bouton suivant
      this.boutonSelectionne++;

      // Si on dépasse le dernier, on revient au premier
      if (this.boutonSelectionne >= this.boutons.length) {
        this.boutonSelectionne = 0;
      }

      // Met le bouton sélectionné en "focus"
      this.boutons[this.boutonSelectionne].setScale(1.2);
    }

    // Validation avec la touche I
    if (Phaser.Input.Keyboard.JustDown(this.toucheValidation)) {
      // Exécute l’action du bouton sélectionné
      this.actions[this.boutonSelectionne]();
    }
  }
}
