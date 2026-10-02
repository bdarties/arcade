export default class menu extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "menu" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }

  preload() {
    //TODO : Remplacer tous les chemin absolus en chemins relatifs
    // Background
    this.load.image("menu_bg", "src/bg/menu_bg.png");
    // Boutons
    this.load.image("start_button", "src/button/start.png");
    this.load.image("credits_button", "src/button/credits.png");
    this.load.image("classement_button", "src/button/classement.png");
    // Audio
    this.load.audio('background', 'src/audio/gnossienne.mp3');
    this.load.audio('son_rideau', 'src/audio/rideau.mp3');
    this.load.audio('selection', 'src/audio/selection.mp3');
  }

  create() {

    // Ne lance la musique que si elle n'est pas déjà en train de jouer dans le jeu
    if (!this.sound.get('background')) {
      var musique_de_fond = this.sound.add('background', { loop: true }); 
      musique_de_fond.play();  // lancement du son background
    }

    var son_selection = this.sound.add('selection');

    this.add
      .image(0, 0, "menu_bg")
      .setOrigin(0)
      .setDepth(0);

    // Bouton Start
    var bouton_start = this.add.image(640, 250, "start_button").setDepth(1);

    bouton_start.setInteractive();

    bouton_start.on("pointerover", () => {
      bouton_start.setScale(1);
      son_selection.play();
    });

    bouton_start.on("pointerout", () => {
      bouton_start.setScale(0.8);
    });

    bouton_start.on("pointerup", () => {
        this.cameras.main.fade(1000, 0, 0, 0); // Fondu sortant

        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start("histoire");
        });
    }, this); // Ajoutez "this" ici pour forcer Phaser à garder le contexte de la scène

    // Bouton Crédits
    var bouton_credits = this.add.image(640, 400, "credits_button").setDepth(1);

    bouton_credits.setInteractive();

    bouton_credits.on("pointerover", () => {
      bouton_credits.setScale(1);
      son_selection.play();
    });

    bouton_credits.on("pointerout", () => {
      bouton_credits.setScale(0.8);
    });

    bouton_credits.on("pointerup", () => {
      this.scene.start("credits"); // on utilise le nom de la clé associée à credits.js
    });
  
    // Bouton Classement
    var bouton_classement = this.add.image(640, 550, "classement_button").setDepth(1);

    bouton_classement.setInteractive();

    bouton_classement.on("pointerover", () => {
      bouton_classement.setScale(1);
      son_selection.play();
    });

    bouton_classement.on("pointerout", () => {
      bouton_classement.setScale(0.8);
    });

    bouton_classement.on("pointerup", () => {
      this.scene.start("classement"); // on utilise le nom de la clé associée à classement.js
    });
  }

}