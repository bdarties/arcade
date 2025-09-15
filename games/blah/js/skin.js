import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.esm.js';

var click;
var musique_de_fond;
export default class skin extends Phaser.Scene {
    constructor() {
      super({ key: "skin" });
    }
    
    //on charge les images
    preload() {
      this.load.image("skins","assets/skins.png"); 
      this.load.spritesheet("Jousset", "assets/Jousset.png", {
        frameWidth: 64,
        frameHeight: 96
      });
      this.load.spritesheet("mika", "assets/mika.png", {
        frameWidth: 64,
        frameHeight: 96
      });
      
      this.load.spritesheet("abdellah", "assets/Abdellah.png", {
        frameWidth: 64,
        frameHeight: 96
      });
      
      
      this.load.spritesheet("meyer", "assets/meyer.png", {
        frameWidth: 64,
        frameHeight: 96
      });
      
      this.load.spritesheet("darties", "assets/darties.png", {
        frameWidth: 64,
        frameHeight: 96
      });
      this.load.audio('mus', 'assets/avatar.mp3');
      this.load.audio('click', 'assets/click.mp3');  
      this.load.image("imageBoutonOk","assets/oki.png");
    }
   

    create() {
     // on place les éléments de fond
     this.add
     .image(0, 0, "skins")
     .setOrigin(0)
     .setDepth(0);
     musique_de_fond = this.sound.add('mus'); 
  
    musique_de_fond.play();
     click = this.sound.add('click'); 
     var bouton_J = this.add.image(225, 295, "Jousset",4).setDepth(3).setInteractive().setScale(1.2);
     var bouton_M2 = this.add.image(410, 142, "mika",4).setDepth(3).setInteractive().setScale(1.2);
     var bouton_A = this.add.image(200, 141, "abdellah",4).setDepth(3).setInteractive().setScale(1.3);
     var bouton_M = this.add.image(575, 285, "meyer",4).setDepth(3).setInteractive().setScale(1.4);
     var bouton_D = this.add.image(630, 143, "darties",4).setDepth(3).setInteractive().setScale(1.3);
     var bouton_ok = this.add.image(400, 500, "imageBoutonOk").setDepth(1).setInteractive();
      //on ajoute un bouton de clic, nommé bouton_play
      // Gestion des événements pour le bouton Jousset

      this.add.text(90, 350, "ARNAUD JOUSSET", {
        fontFamily: "Stencil",
        fontSize: "25pt",
        fontWeight: 'bold', // mettre en gras
    color: '#FFFFFF' // couleur noire
      });
      this.add.text(370, 200, "MIKA", {
        fontFamily: "Stencil",
        fontSize: "25pt",
        fontWeight: 'bold', // mettre en gras
    color: '#FFFFFF' // couleur noire
      });
      this.add.text(25, 200, "ABDELLAH MAKHCHAN", {
        fontFamily: "Stencil",
        fontSize: "20pt",
        fontWeight: 'bold', // mettre en gras
    color: '#FFFFFF' // couleur noire
      });
      this.add.text(435, 350, "MATHIEU MEYER", {
        fontFamily: "Stencil",
        fontSize: "25pt",
        fontWeight: 'bold', // mettre en gras
    color: '#FFFFFF' // couleur noire
      });
      this.add.text(495, 200, "BENOIT DARTIES", {
        fontFamily: "Stencil",
        fontSize: "25pt",
        fontWeight: 'bold', // mettre en gras
    color: '#FFFFFF' // couleur noire
      });
      bouton_J.setInteractive();
      bouton_J.on("pointerover", () => {
          bouton_J.setTint(0xFFFF00); // Teinte le bouton en rouge
      });
      bouton_J.on("pointerout", () => {
          bouton_J.clearTint(); // Rétablit la couleur normale du bouton
      });
      bouton_J.on("pointerup", () => {
        this.game.config.skin = 1; // Mise à jour de la variable globale dans le contexte du jeu
        click.play();
        musique_de_fond.stop();
        this.scene.start("menu"); // Passer à la scène de sélection
    });
    bouton_M2.setInteractive();
    bouton_M2.on("pointerover", () => {
      bouton_M2.setTint(0x000000); // Teinte le bouton en rouge
    });
    bouton_M2.on("pointerout", () => {
      bouton_M2.clearTint(); // Rétablit la couleur normale du bouton
    });
    bouton_M2.on("pointerup", () => {
      this.game.config.skin = 5; // Mise à jour de la variable globale dans le contexte du jeu
      click.play();
      musique_de_fond.stop();
      this.scene.start("menu"); // Passer à la scène de sélection
  });
    bouton_A.setInteractive();
bouton_A.on("pointerover", () => {
    bouton_A.setTint(0x0000ff); // Teinte le bouton en rouge
});
bouton_A.on("pointerout", () => {
    bouton_A.clearTint(); // Rétablit la couleur normale du bouton
});
    bouton_A.on("pointerup", () => {
        this.game.config.skin = 2; // Mise à jour de la variable globale dans le contexte du jeu
        click.play();
        musique_de_fond.stop();
        this.scene.start("menu"); // Passer à la scène de sélection
    });
    bouton_M.setInteractive();
bouton_M.on("pointerover", () => {
    bouton_M.setTint(0x00FF00); // Teinte le bouton en rouge
});
bouton_M.on("pointerout", () => {
    bouton_M.clearTint(); // Rétablit la couleur normale du bouton
});
    bouton_M.on("pointerup", () => {
      this.game.config.skin = 3; // Mise à jour de la variable globale dans le contexte du jeu
      click.play();
      musique_de_fond.stop();
      this.scene.start("menu"); // Passer à la scène de sélection
  });
  
  bouton_D.on("pointerup", () => {
      this.game.config.skin = 4; // Mise à jour de la variable globale dans le contexte du jeu
      click.play();
      musique_de_fond.stop();
      this.scene.start("menu"); // Passer à la scène de sélection
  });
  bouton_D.setInteractive();
bouton_D.on("pointerover", () => {
    bouton_D.setTint(0xff0000); // Teinte le bouton en rouge
});
bouton_D.on("pointerout", () => {
    bouton_D.clearTint(); // Rétablit la couleur normale du bouton
});
    // Gestion des événements pour le bouton OK
   
    bouton_ok.setInteractive();
    bouton_ok.on("pointerover", () => {
      bouton_ok.setTint(0x0000ff); // Teinte le bouton en rouge
    });
    bouton_ok.on("pointerout", () => {
      bouton_ok.clearTint(); // Rétablit la couleur normale du bouton
    });
    bouton_ok.on("pointerup", () => {
      click.play();
      musique_de_fond.stop();
      this.scene.start("menu"); // Assurez-vous que la scène menu est correctement définie dans votre configuration générale
    });
   
    }
  } 