import { musicManager } from './MusicManager.js';

// Scène d'accueil du jeu : écran principal avec boutons
export default class accueil extends Phaser.Scene {
  // Constructeur : définit la clé de la scène
  constructor() {
    super({ key: "accueil" });
  }

  // Préchargement des images utilisées dans la scène
  preload() {
    // Précharger les musiques
    musicManager.preloadMusic(this);
    this.load.image("screen_welcome", "assets/screen_welcome.jpg"); // Fond d'accueil
    this.load.image("button_play", "assets/button_play.png"); // Bouton Jouer
    this.load.image("button_parametres", "assets/button_parametres.png"); // Bouton Paramètres
    this.load.image("button_controls", "assets/button_controls.png"); // Bouton Contrôles
    this.load.image("button_credits", "assets/button_credits.png"); // Bouton Crédits
    this.load.audio("navig_bouton", "assets/son/navig_bouton.mp3"); // Son de navigation des boutons
    this.load.audio("clic_bouton", "assets/son/clic_bouton.mp3"); // Son de clic des boutons

}

  // Création des éléments visuels et interactivité
  create() {
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    

    // Initialiser la musique de l'accueil
    musicManager.scene = this;
    musicManager.play('accueil');

    this.navSound = this.sound.add("navig_bouton", { volume: 0.5 });
    this.clicSound = this.sound.add("clic_bouton", { volume: 0.5 });

    // Ajout du fond d'écran
    this.add.image(this.game.config.width / 2, this.game.config.height / 2, "screen_welcome");

    // Positionnement des boutons
    const xBoutons = 235; // Position X des boutons
    const yDebut = 360;   // Position Y du premier bouton
    const ecart = 90;     // Espace vertical entre les boutons

    // Création des boutons (non-interactifs pour la navigation clavier)
    const bouton_play = this.add.image(xBoutons, yDebut, "button_play").setScale(0.7); // Jouer
    const bouton_parametres = this.add.image(xBoutons, yDebut + ecart, "button_parametres").setScale(0.7); // Paramètres
    const bouton_controls = this.add.image(xBoutons, yDebut + ecart * 2, "button_controls").setScale(0.7); // Contrôles
    const bouton_credits = this.add.image(xBoutons, yDebut + ecart * 3, "button_credits").setScale(0.7); // Crédits

    // Système de navigation par touches
    this.boutons = [bouton_play, bouton_parametres, bouton_controls, bouton_credits];
    this.scenes = ["choixmode", "parametres", "controls", "credits"];
    this.selectedIndex = 0; // Par défaut sur "Jouer"

    // Mise en surbrillance du bouton sélectionné
    this.updateSelection();

    // Contrôles clavier
  this.cursors = this.input.keyboard.createCursorKeys();
  // Use 'I' for selection instead of Enter
  this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  // Méthode pour mettre à jour la sélection visuelle
  updateSelection() {
    // Réinitialise tous les boutons à leur taille normale
    this.boutons.forEach((bouton, index) => {
      if (index === this.selectedIndex) {
        bouton.setScale(0.85); // Agrandir le bouton sélectionné
        bouton.clearTint(); // Supprimer la teinte
      } else {
        bouton.setScale(0.7); // Taille normale
        bouton.setTint(0xEBCF88); // Teinte orange pour le bouton sélectionné
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
      this.navSound.play();
    }

    // Navigation vers le bas
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.selectedIndex++;
      if (this.selectedIndex >= this.boutons.length) {
        this.selectedIndex = 0; // Boucle vers le haut
      }
      this.updateSelection();
      this.navSound.play();
    }

    // Sélection avec I ou Espace
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.clicSound.play();
      // Fade out avant de changer de scène
    this.cameras.main.fadeOut(200, 0, 0, 0); // 500ms, couleur noire

      // Attendre la fin du fade avant de changer de scène
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(this.scenes[this.selectedIndex]);
    });
    }
  }
}