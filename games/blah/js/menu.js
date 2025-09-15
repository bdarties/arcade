import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.esm.js';

var click;
var score=0;
export default class Menu extends Phaser.Scene {
  
  constructor() {
      super({ key: "menu" });
      console.log("Scene Menu initialisée");  // Pour debug
    }
    //on charge les images
    preload() {
      this.load.spritesheet("img_perso", "assets/Jousset.png", {
        frameWidth: 64,
        frameHeight: 96
      });
      
      this.load.audio('click', 'assets/click.mp3');  
      this.load.image("menu_fond","assets/menuback.png");
      this.load.image("imageBoutonPlay","assets/play.png");
      this.load.image("imageBoutonSkin","assets/Skin.png");
      this.load.image("imageBoutonRule","assets/rules.png");
    }
  
    create() {
     // on place les éléments de fond
score=0;
    
      this.add
        .image(0, 0, "menu_fond")
        .setOrigin(0)
        .setDepth(0);
        click = this.sound.add('click');
      //on ajoute un bouton de clic, nommé bouton_play
      var bouton_play = this.add.image(400, 400, "imageBoutonPlay").setDepth(1);
      var bouton_skin = this.add.image(400, 280, "imageBoutonSkin").setDepth(1);
      var bouton_rules = this.add.image(400, 340, "imageBoutonRule").setDepth(1);
     
      //=========================================================
      //on rend le bouton interratif
      bouton_play.setInteractive();
  
      //Cas ou la souris passe sur le bouton play
      bouton_play.on("pointerover", () => {
        bouton_play.setTint(0x0000ff);
      });
      
      //Cas ou la souris ne passe plus sur le bouton play
      bouton_play.on("pointerout", () => {
        bouton_play.clearTint();
      });
  
  
      //Cas ou la sourris clique sur le bouton play :
      // on lance le niveau 1
      bouton_play.on("pointerup", () => {
        click.play();
        this.scene.start("selection");
      });



      bouton_rules.setInteractive();
  
      //Cas ou la souris passe sur le bouton play
      bouton_rules.on("pointerover", () => {
        bouton_rules.setTint(0x0000ff); 
      });
      
      //Cas ou la souris ne passe plus sur le bouton play
      bouton_rules.on("pointerout", () => {
        bouton_rules.clearTint();
      });
  
  
      //Cas ou la sourris clique sur le bouton play :
      // on lance le niveau 1
      bouton_rules.on("pointerup", () => {
        click.play();
        this.scene.start("rules");
      });

      bouton_skin.setInteractive();
  
      //Cas ou la souris passe sur le bouton play
      bouton_skin.on("pointerover", () => {
        bouton_skin.setTint(0x0000ff);
      });
      
      //Cas ou la souris ne passe plus sur le bouton play
      bouton_skin.on("pointerout", () => {
        bouton_skin.clearTint();
      });
  
  
      //Cas ou la sourris clique sur le bouton play :
      // on lance le niveau 1
      bouton_skin.on("pointerup", () => {
        
        click.play();
        this.scene.start("skin");
      });
    }
  }