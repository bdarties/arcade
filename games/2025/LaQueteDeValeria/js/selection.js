
/***********************************************************************/
/** VARIABLES GLOBALES 
/***********************************************************************/

// définition de la classe "selection"
export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" }); // mettre le meme nom que le nom de la classe
  }

  /***********************************************************************/
  /** FONCTION PRELOAD 
/***********************************************************************/

  /** La fonction preload est appelée une et une seule fois,
   * lors du chargement de la scene dans le jeu.
   * On y trouve surtout le chargement des assets (images, son ..)
   */
  preload() {
    const baseURL = this.sys.game.config.baseURL;
    
    this.load.setBaseURL(baseURL);

    this.load.image("img_porte1", "./assets/door1.jpg");
    this.load.image("img_porte2", "./assets/door2.jpg");
    this.load.image("img_porte3", "./assets/door3.jpg");
    this.load.image("room", "./assets/room.jpg");
  }

  /***********************************************************************/
  /** FONCTION CREATE 
/***********************************************************************/
  create() {
 this.add
      .image(0, 0, "room")
      .setOrigin(0)
      .setDepth(0);

      this.portes = [
    this.add.image(213, 360, "img_porte1"),
    this.add.image(639, 360, "img_porte2"),
    this.add.image(1065, 360, "img_porte3")
  ];

    // index de sélection
    this.indexSelection = 0;

    // Clavier : flèches via createCursorKeys + touche I séparée
    this.cursors = this.input.keyboard.createCursorKeys(); // left/right sont accessibles
    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
  }

  /***********************************************************************/
  /** FONCTION UPDATE 
/***********************************************************************/

  update() {
    // Utiliser JustDown pour n'agir qu'une fois par pression
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.indexSelection = (this.indexSelection - 1 + this.portes.length) % this.portes.length;
      this.updateSelection();
    } if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.indexSelection = (this.indexSelection + 1) % this.portes.length;
      this.updateSelection();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
      const sceneName = "story" + (this.indexSelection + 1);
      this.scene.switch(sceneName);
    } if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
      this.scene.switch("menu");  
    }
  }


 updateSelection(skipTween = false) {
    this.portes.forEach((p, i) => {
      if (i === this.indexSelection) {
        p.setScale(1.50);
        p.setDepth(10);
      } else {
        p.setScale(1);
        p.setDepth(0);
      }
     });
  }
}
