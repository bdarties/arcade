import * as fct from "./fonctions.js";

export default class checkpoint2 extends Phaser.Scene {
  constructor() {
    super({ key: "checkpoint2" });
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
    this.add.text(this.sys.game.config.width / 2, 100, "L'affrontement final", {
      fontSize: "42px",
      fontFamily: "Courier",
      fill: "#FFFFFF",
    }).setOrigin(0.5);

    // Texte vide
    this.displayText = this.add.text(640, 250, "", {
      fontSize: "24px",
      fontFamily: "Courier",
      fill: "#FFFFFF",
      wordWrap: { width: 960 },
      align: "left"
    }).setOrigin(0.5, 0);

    // Texte à écrire
    this.fullText = [
      "Vous avez franchi la première étape.",
      "Après deux jours à traverser la ville en ruines à la recherche des composants, le dirigeable qui peut te permettre de t'enfuir apparaît enfin.",
      "Mais pour l'atteindre, il faudra éliminer tous les gardes qui se mettent en travers de ta route et affronter le boss final.",
      "Chaque décision, chaque combat peut te rapprocher ou t'éloigner de la liberté."
    ];

    this.currentIndex = 0;
    this.charIndex = 0;
    this.isTyping = false;

    // Position bouton
    this.btnX = this.sys.game.config.width / 1.25;
    this.btnY = this.sys.game.config.height - 150;

    // Bouton affiché dès le début (mais pas cliquable souris)
    this.btn = this.add.image(this.btnX, this.btnY, "btn_continue")
      .setScale(0.35)
      .setAlpha(1);

    // --- Clavier ---
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    // Lancer le son au début
    this.son_typing.play();
    this.isTyping = true;

    // Animation texte
    this.timerEvent = this.time.addEvent({
      delay: 30,
      callback: this.addLetter,
      callbackScope: this,
      loop: true
    });
  }

  update() {
    // Validation par K
   if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
  this.sonBouton.play(); // 🔊 Joue le son du clic
  console.log("[checkpoint1] Retour vers selection via touche K...");

  // Arrêter le son si encore en cours
  if (this.son_typing.isPlaying) {
    this.son_typing.stop();
  }

  // Laisser le son se jouer un petit instant avant de changer de scène
  this.time.delayedCall(100, () => {
    this.scene.start("niveau2");
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
      console.log("[checkpoint2] Texte terminé, son arrêté");
    }
  }
}