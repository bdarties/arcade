var J1Haut, J1Bas, J1Gauche, J1Droite, J1boutonFeu,J1Interaction; //variables des touches du joueur 1
var J2Haut, J2Bas, J2Gauche, J2Droite, J2boutonFeu,J2Interaction; //variables des touches du joueur 2
var clavier; // pour la gestion du clavier. Semble initulisé mais en fait, si, elle l'est.
export default class controles extends Phaser.Scene {
  constructor() {
    super({
      key: "controles"
    });
  }

    /***********************
     *  CREATION DU CLAVIER ET TOUCHES *
     ************************/
    clavier = this.input.keyboard.createCursorKeys(); //on importe les touches curseurs, le reste étant installé après cette ligne.

    //touches Joueur 1
      J1Haut = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP); //Phaser.Input.Keyboard.addKey.[...] représente la touche a associer (en l'occurence l'une des touche directionelle) par ce on ne peut pas associer une touche de direction a une variable comme les autres touches et qu'on doit donc utiliser cette méthode
      J1Bas = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      J1Gauche = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      J1Droite = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
      J1Interaction = this.input.keyboard.addKey('I');
      J1boutonFeu = this.input.keyboard.addKey('O');
    //touches Joueur 2
      J2Haut = this.input.keyboard.addKey('Z');
      J2Bas = this.input.keyboard.addKey('S');
      J2Gauche = this.input.keyboard.addKey('Q');
      J2Droite = this.input.keyboard.addKey('D');
      J2Interaction = this.input.keyboard.addKey('R');
      J2boutonFeu = this.input.keyboard.addKey('T');
}