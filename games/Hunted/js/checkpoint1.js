import * as fct from "./fonctions.js";

export default class checkpoint1 extends Phaser.Scene {
  constructor() {
    super({ key: "checkpoint1" });
  }

  preload() {
    this.load.image("fond_noir", "./assets/fond_noir1.jpg");
    this.load.image("btn_continue", "./assets/btn_continuer.png");

    this.load.audio("typing", "./assets/typing.mp3");
    this.load.audio("boutonClick", "./assets/boutonclick.mp3");
  }

  create() {
    this.son_typing = this.sound.add('typing', { loop: true });
    console.log("[checkpoint1] Scene create OK");

    this.sonBouton = this.sound.add("boutonClick");

    // Fond noir
    this.add.image(0, 0, "fond_noir").setOrigin(0, 0).setDepth(-1);

    // Carré noir semi-transparent
    this.textBackground = this.add.rectangle(
      640, 350, 1000, 600, 0x000000, 0.7
    ).setOrigin(0.5).setDepth(0);

    // Titre
    this.add.text(this.sys.game.config.width / 2, 100, "La cellule du scientifique", {
      fontSize: "42px",
      fontFamily: "Courier",
      fill: "#FFFFFF",
    }).setOrigin(0.5);

    // Texte vide au départ
    this.displayText = this.add.text(640, 250, "", {
      fontSize: "24px",
      fontFamily: "Courier",
      fill: "#FFFFFF",
      wordWrap: { width: 960 },
      align: "left"
    }).setOrigin(0.5, 0);

    // Texte à écrire phrase par phrase
    this.fullText = [
      "Tu es le Dr Elian Voss, scientifique de génie, enfermé à cause de l'arme surpuissante que tu as créé.",
      "Tes ennemis ont voulu te neutraliser, mais la liberté est encore à portée de main.",
      "Pour t'échapper, il faut retrouver les fragments de ton invention et la reconstruire, en contournant les pièges et obstacles qui se dressent sur ton chemin.",
      "Bonne chance."
    ];

    this.currentIndex = 0;
    this.charIndex = 0;
    this.isTyping = false;

    // Position du bouton
    this.btnX = this.sys.game.config.width / 1.25;
    this.btnY = this.sys.game.config.height - 150;

    // Bouton affiché dès le début (non cliquable souris)
    this.btn = this.add.image(this.btnX, this.btnY, "btn_continue")
      .setScale(0.35)
      .setAlpha(1);

    // --- Gestion clavier ---
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    // Lancer le son au début
    this.son_typing.play();
    this.isTyping = true;

    // Lancer l'écriture lettre par lettre
    this.timerEvent = this.time.addEvent({
      delay: 30,
      callback: this.addLetter,
      callbackScope: this,
      loop: true
    });
  }

  update() {
    // Vérifie si K est pressé
    if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
  this.sonBouton.play(); // 🔊 Joue le son du clic
  console.log("[checkpoint1] Retour vers selection via touche K...");

  // Arrêter le son si encore en cours
  if (this.son_typing.isPlaying) {
    this.son_typing.stop();
  }

  // Laisser le son se jouer un petit instant avant de changer de scène
  this.time.delayedCall(100, () => {
    this.scene.start("selection");
  });
}
  }

  addLetter() {
    const phrase = this.fullText[this.currentIndex];

    if (this.charIndex < phrase.length) {
      this.displayText.text += phrase[this.charIndex];
      this.charIndex++;
    } else {
      this.displayText.text += "\n\n";
      this.currentIndex++;
      this.charIndex = 0;
    }

    // Si tout le texte est affiché, arrêter le son et le timer
    if (this.currentIndex >= this.fullText.length) {
      this.timerEvent.remove();
      if (this.son_typing.isPlaying) {
        this.son_typing.stop();
      }
      this.isTyping = false;
      console.log("[checkpoint1] Texte terminé, son arrêté");
    }
  }
}