import * as fct from "./fonctions.js";

// définition de la classe "selection"
export default class scenario2 extends Phaser.Scene {
  constructor() {
    super({ key: "scenario2" }); // mettre le meme nom que le nom de la classe
    this.dernierNiveau = null;
  }

  /***********************************************************************/
  /** FONCTION PRELOAD 
/***********************************************************************/

  /** La fonction preload est appelée une et une seule fois,
   * lors du chargement de la scene dans le jeu.
   * On y trouve surtout le chargement des assets (images, son ..)
   */
  preload() {
this.load.image("scenario2", "./assets/scenario2.jpg");
    this.load.image("imageBoutonJouer2j", "./assets/button_play1.png");

  }

  /***********************************************************************/
  /** FONCTION CREATE 
/***********************************************************************/

  /* La fonction create est appelée lors du lancement de la scene
   * si on relance la scene, elle sera appelée a nouveau
   * on y trouve toutes les instructions permettant de créer la scene
   * placement des peronnages, des sprites, des platesformes, création des animations
   * ainsi que toutes les instructions permettant de planifier des evenements
   */
  create() {
    // on place les éléments de fond
    this.add.image(640, 360, "scenario2");
    // création du bouton retour
    var bouton_retour = this.add.image(640, 650, "imageBoutonJouer2j").setDepth(1);
    
  
    this.toucheValidation = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
    this.toucheJouer2j = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    bouton_retour.setInteractive();


  }

  /***********************************************************************/
  /** FONCTION UPDATE 
/***********************************************************************/


update() {
  if (this.toucheValidation.isDown) {
// Exécute l’action du bouton sélectionné
          this.scene.start("menu");
  }
  if (this.toucheJouer2j.isDown) {
// Exécute l’action du bouton sélectionné
          this.lancerNiveauAleatoire();
  }

}
lancerNiveauAleatoire() {
const niveaux = ["niveau3", "niveau3ciel", "niveau3ville"];

// Tirage au sort d’un index aléatoire différent du précédent
let indexAleatoire;
do {
  indexAleatoire = Phaser.Math.Between(0, niveaux.length - 1);
} while (niveaux[indexAleatoire] === this.dernierNiveau);

// Stocke le dernier niveau joué
this.dernierNiveau = niveaux[indexAleatoire];

// Démarre le niveau tiré au hasard
this.scene.start(this.dernierNiveau, { scenePrecedente: "scenario2" });
}


}

/***********************************************************************/
/** CONFIGURATION GLOBALE DU JEU ET LANCEMENT 
/***********************************************************************/
