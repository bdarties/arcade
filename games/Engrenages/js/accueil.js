// Scène d'accueil du jeu : écran principal avec boutons
export default class accueil extends Phaser.Scene {
  // Constructeur : définit la clé de la scène
  constructor() {
    super({ key: "accueil" });
  }

  // Préchargement des images utilisées dans la scène
  preload() {
    this.load.image("screen_welcome", "assets/screen_welcome.png"); // Fond d'accueil
    this.load.image("button_play", "assets/button_play.png"); // Bouton Jouer
    this.load.image("button_parametres", "assets/button_parametres.png"); // Bouton Paramètres
    this.load.image("button_controls", "assets/button_controls.png"); // Bouton Contrôles
    this.load.image("button_credits", "assets/button_credits.png"); // Bouton Crédits
    this.load.audio("background_music", "assets/music_engrenage.mp3"); // Musique de fond globale
  }

  // Création des éléments visuels et interactivité
  create() {
    // Musique de fond globale (une seule fois pour tout le jeu)
    if (!window.globalMusic || !window.globalMusic.isPlaying) {
      window.globalMusic = this.sound.add('background_music', { 
        loop: true, 
        volume: 0.2 
      });
      window.globalMusic.play();
    }

    // Ajout du fond d'écran
    this.add.image(this.game.config.width / 2, this.game.config.height / 2, "screen_welcome");

    // Positionnement des boutons
    const xBoutons = 215; // Position X des boutons
    const yDebut = 400;   // Position Y du premier bouton
    const ecart = 80;     // Espace vertical entre les boutons

    // Création des boutons (non-interactifs pour la navigation clavier)
    const bouton_play = this.add.image(xBoutons, yDebut, "button_play").setScale(0.7); // Jouer
    const bouton_parametres = this.add.image(xBoutons, yDebut + ecart, "button_parametres").setScale(0.7); // Paramètres
    const bouton_controls = this.add.image(xBoutons, yDebut + ecart * 2, "button_controls").setScale(0.7); // Contrôles
    const bouton_credits = this.add.image(xBoutons, yDebut + ecart * 3, "button_credits").setScale(0.7); // Crédits

    // Système de navigation par touches
    this.boutons = [bouton_play, bouton_parametres, bouton_controls, bouton_credits];
    this.scenes = ["selection", "parametres", "controls", "credits"];
    this.selectedIndex = 0; // Par défaut sur "Jouer"

    // Mise en surbrillance du bouton sélectionné
    this.updateSelection();

    // Contrôles clavier
    this.cursors = this.input.keyboard.createCursorKeys();
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  // Méthode pour mettre à jour la sélection visuelle
  updateSelection() {
    // Réinitialise tous les boutons à leur taille normale
    this.boutons.forEach((bouton, index) => {
      if (index === this.selectedIndex) {
        bouton.setScale(0.85); // Agrandir le bouton sélectionné
        bouton.setTint(0xff8800); // Teinte orange pour le bouton sélectionné
      } else {
        bouton.setScale(0.7); // Taille normale
        bouton.clearTint(); // Supprimer la teinte
      }
    });
  }

  // Boucle de mise à jour pour la navigation
  update() {
    // Navigation vers le haut
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.selectedIndex--;
      if (this.selectedIndex < 0) {
        this.selectedIndex = this.boutons.length - 1; // Boucle vers le bas
      }
      this.updateSelection();
    }

    // Navigation vers le bas
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.selectedIndex++;
      if (this.selectedIndex >= this.boutons.length) {
        this.selectedIndex = 0; // Boucle vers le haut
      }
      this.updateSelection();
    }

    // Sélection avec Entrée ou Espace
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.scene.start(this.scenes[this.selectedIndex]);
    }
  }
}