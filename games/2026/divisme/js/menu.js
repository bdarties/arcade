import { BORNE, creerTouches, uneTouchePressee } from "./outils.js";

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
  }

  create() {

    // Ne lance la musique que si elle n'est pas déjà en train de jouer dans le jeu
    if (!this.sound.get('background')) {
      var musique_de_fond = this.sound.add('background', { loop: true }); 
      musique_de_fond.play();  // lancement du son background
    }

    this.add
      .image(0, 0, "menu_bg")
      .setOrigin(0)
      .setDepth(0);

    // Bouton Start
    var bouton_start = this.add.image(640, 250, "start_button").setDepth(1);

    bouton_start.setInteractive();

    // Souris : survoler un bouton le sélectionne (comme le joystick)
    bouton_start.on("pointerover", () => {
      this.selection = 0;
      this.majSelection();
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
      this.selection = 1;
      this.majSelection();
    });

    bouton_credits.on("pointerup", () => {
      this.scene.start("credits"); // on utilise le nom de la clé associée à credits.js
    });
  
    // Bouton Classement
    var bouton_classement = this.add.image(640, 550, "classement_button").setDepth(1);

    bouton_classement.setInteractive();

    bouton_classement.on("pointerover", () => {
      this.selection = 2;
      this.majSelection();
    });

    bouton_classement.on("pointerup", () => {
      this.scene.start("classement"); // on utilise le nom de la clé associée à classement.js
    });


    // --- NAVIGATION AU JOYSTICK ---

    // Les boutons dans l'ordre d'affichage (de haut en bas)
    this.boutons = [bouton_start, bouton_credits, bouton_classement];

    this.selection = 0;      // numéro du bouton "pointé" (0 = Start)
    this.sortie = false;     // vrai quand on a déjà validé un choix
    this.pret = false;       // faux pendant 0,5 s : on ignore l'appui qui nous a amenés ici

    this.time.delayedCall(500, () => {
      this.pret = true;
    });

    // Joystick haut / bas des deux joueurs, et tous les boutons A à F pour valider
    this.touchesHaut = creerTouches(this, [BORNE.j1.haut, BORNE.j2.haut]);
    this.touchesBas = creerTouches(this, [BORNE.j1.bas, BORNE.j2.bas]);
    this.touchesValider = creerTouches(this, BORNE.j1.boutons.concat(BORNE.j2.boutons));

    // Petit rappel pour le joueur (il n'y a pas de lettres sur la borne)
    this.add.text(640, 640, "Joystick ▲ ▼ pour choisir  -  bouton A pour valider", {
      fontSize: "20px",
      fontStyle: "bold",
      color: "#F6EBD0",
      stroke: "#10252B",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(1);

    this.majSelection();
  }

  // Le bouton pointé est grand et opaque, les autres sont plus petits et un peu transparents
  majSelection() {
    this.boutons.forEach((bouton, i) => {
      bouton.setScale(i === this.selection ? 1 : 0.8);
      bouton.setAlpha(i === this.selection ? 1 : 0.7);
    });
  }

  // update() est appelée environ 60 fois par seconde
  update() {

    // On lit TOUJOURS les touches, pour "consommer" les appuis
    const haut = uneTouchePressee(this.touchesHaut);
    const bas = uneTouchePressee(this.touchesBas);
    const valider = uneTouchePressee(this.touchesValider);

    if (this.sortie || !this.pret) return;

    const nombre = this.boutons.length;   // 3

    // Le "% nombre" fait le tour : après le dernier bouton on revient au premier
    if (haut) this.selection = (this.selection + nombre - 1) % nombre;
    if (bas) this.selection = (this.selection + 1) % nombre;

    if (haut || bas) this.majSelection();

    // Valider = faire comme si on avait cliqué sur le bouton pointé
    if (valider) {
      this.sortie = true;
      this.boutons[this.selection].emit("pointerup");
    }
  }

}