
import * as fct from "./fonctions.js";

export default class pause extends Phaser.Scene {
  constructor() {
    super({ key: "pause" });
  }
init(data) {
  this.scenePrecedente = data.scenePrecedente;
}
  preload() {
    // 🟩 image de fond (mets ton image dans ./assets/)
    this.load.image("fond_pause", "./assets/pause.png");
    // 🟩 image du bouton
    this.load.image("bouton_reprendre", "./assets/button_reprendre1.png");
    this.load.image("imageMenu", "./assets/button_quitter1.png");
    
  }

  create() {
    // 🟩 fond
    let fond = this.add.image(640, 360, "fond_pause").setScrollFactor(0);
    fond.setAlpha(0.4); // définit la transparence (0 = transparent, 1 = opaque)
    
    

  
 this.add.text(640, 180, "MENU PAUSE", {
   font: "64px Arial",
  fill: "#ffffff",
  fontStyle: "bold"
 }).setOrigin(0.5);

    /*// 🟩 bouton visuel
    this.boutonReprendre = this.add.image(640, 400, "bouton_reprendre")
      .setScale(1)
      .setInteractive({ useHandCursor: true });*/

    // 🟩 touche I pour activer le bouton
    // this.toucheReprendre = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    


    // création des boutons
    var bouton_reprendre = this.add.image(640, 350, "bouton_reprendre").setDepth(1);
    var bouton_menu = this.add.image(640, 450, "imageMenu").setDepth(1);

  // On stocke les boutons dans un tableau (ordre vertical)
    this.boutons = [bouton_reprendre, bouton_menu];

     // Index du bouton sélectionné (par défaut = 0 → le premier)
    this.boutonSelectionne = 0;
      // Met le bouton sélectionné en "focus"
      this.boutons[this.boutonSelectionne].setScale(1.2);
    

    // Raccourcis clavier (flèches et touche "I")
    this.cursors = this.input.keyboard.createCursorKeys(); // flèches
    this.toucheValidation = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

this.actions = [
  () => { // bouton 0 → reprendre
    this.scene.stop(); // ferme le menu pause
  this.scene.resume(this.scenePrecedente); // reprend le bon niveau !
  },
  () => { // bouton 1 → retour menu
    this.scene.stop(this.scenePrecedente);
    this.scene.start("menu");
  }
];



/*
    // 🟩 AJOUT — écoute sécurisée du keydown (évite les ratés si I est déjà pressé)
    this.input.keyboard.on('keydown-I', () => {
      // appelle la même fonction que le clique
      this.reprendreJeu();
    }); // 🟩 AJOUT*/
  
/*
  reprendreJeu() {
  this.tweens.add({
    targets: this.boutonReprendre,
    scale: { from: 0.8, to: 1 },
    duration: 150,
    yoyo: true,
    onComplete: () => {
      this.scene.stop();              // ferme le menu pause
      this.scene.resume("niveau1");   // reprend le niveau sans le redémarrer
    }
  });*/
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