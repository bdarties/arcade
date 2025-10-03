import * as fct from "./fonctions.js";

// définition de la classe "commandes"
export default class commandes extends Phaser.Scene {
  constructor() {
    super({ key: "commandes" }); // mettre le meme nom que le nom de la classe
  }

  /***********************************************************************/
  /** FONCTION PRELOAD 
/***********************************************************************/

  /** La fonction preload est appelée une et une seule fois,
   * lors du chargement de la scene dans le jeu.
   * On y trouve surtout le chargement des assets (images, son ..)
   */
  preload() {
this.load.image("commandes_fond", "./assets/fond_commandes.jpg");
    this.load.image("imageBoutonretour", "./assets/button_retour1.png");


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
    this.add.image(640, 360, "commandes_fond");
    // création du bouton retour
    var bouton_retour = this.add.image(640, 650, "imageBoutonretour").setDepth(1);
    
  
    this.toucheValidation = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);

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


  
}

}

/***********************************************************************/
/** CONFIGURATION GLOBALE DU JEU ET LANCEMENT 
/***********************************************************************/
