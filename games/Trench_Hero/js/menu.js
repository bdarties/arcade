export default class menu extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });
  }

  preload() {
    this.load.image("menu1", "./assets/menu/menu1.jpg");
    this.load.image("menu2", "./assets/menu/menu2.jpg");
    this.load.image("menu3", "./assets/menu/menu3.jpg");
    this.load.image("bouton_credits", "./assets/menu/bouton_credits.png");
    this.load.image("bouton_jouer", "./assets/menu/bouton_jouer.png");
    this.load.image("bouton_campagne", "./assets/menu/bouton_campagne.png");
    this.load.image("bouton_1vs1", "./assets/menu/bouton_1vs1.png");
    this.load.image("bouton_quitter", "./assets/menu/bouton_quitter.png");
    this.load.image("bouton_rejouer", "./assets/menu/bouton_rejouer.png");



    //musiques et sons

    //ambiances 
    this.load.audio("ambiance_foret", "./assets/sons/ambiance/ambiance_foret.mp3"); //ok
    this.load.audio("ambiance_guerre", "./assets/sons/ambiance/ambiance_guerre.mp3"); //ok

    //boss
    this.load.audio("chaine_tank", "./assets/sons/boss/chaine_tank.mp3"); //ok
    this.load.audio("cloches", "./assets/sons/boss/cloches.mp3"); //ok
    this.load.audio("cri_boss", "./assets/sons/boss/tir_tank.mp3"); //ok
    this.load.audio("boss_meurt", "./assets/sons/victoire/boss_meurt.mp3"); //ok

    //defaite
    this.load.audio("defaite", "./assets/sons/defaite/defaite.mp3"); //ok

    //ennemis
    this.load.audio("avion_epoque", "./assets/sons/ennemi/avion_epoque.mp3");  //ok
    this.load.audio("couteau", "./assets/sons/ennemi/couteau.mp3");       //ok  
    this.load.audio("grenade", "./assets/sons/ennemi/grenade.mp3");   //ok

    //musiques
    this.load.audio("musique_menu", "./assets/sons/musiques/menu_loop.mp3"); //ok
    this.load.audio("musique_lvl3", "./assets/sons/musiques/lvl_3_loop.mp3"); //ok

    //tirs
    this.load.audio("gunshot", "./assets/sons/tirs/gunshot.mp3"); // ok

    //victoire
    this.load.audio("victoire", "./assets/sons/victoire/victoire.mp3"); //ok


  }

  create() {
    this.afficherMenu3();

  if (!this.sound.get('musique_menu')) {
    this.musiqueMenu = this.sound.add('musique_menu', { loop: true, volume: 0.5 });
    this.musiqueMenu.play();
  }

}

  afficherMenu3() {
    // Nettoyer la scène
    this.children.removeAll();
    this.input.keyboard.removeAllListeners();
    this.input.removeAllListeners();

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Fond menu3
    this.add.image(0, 0, "menu3").setOrigin(0);

    let indexSelection = 0;

    // Bouton Jouer
    var bouton_jouer = this.add.image(centerX, centerY - 20, "bouton_jouer").setOrigin(0.5);
    bouton_jouer.setScale(1.5);
    bouton_jouer.setInteractive();

    // Bouton Crédits
    var bouton_credits = this.add.image(centerX, centerY + 70, "bouton_credits").setOrigin(0.5);
    bouton_credits.setScale(1.5);
    bouton_credits.setInteractive();

    const boutons = [bouton_jouer, bouton_credits];

    const mettreAJourSelection = () => {
      boutons.forEach((bouton, index) => {
        if (index === indexSelection) {
          bouton.setScale(1.7);
        } else {
          bouton.setScale(1.5);
        }
      });
    };

    mettreAJourSelection();

    bouton_jouer.on("pointerover", () => {
      indexSelection = 0;
      mettreAJourSelection();
    });

    bouton_jouer.on("pointerdown", () => {
      this.afficherSelectionMode();
    });

    bouton_credits.on("pointerover", () => {
      indexSelection = 1;
      mettreAJourSelection();
    });

    bouton_credits.on("pointerdown", () => {
      this.afficherCredits();
    });

    // Clavier
    this.toucheHaut = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.toucheBas = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.toucheK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    this.toucheHaut.on('down', () => {
      indexSelection = (indexSelection - 1 + boutons.length) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheBas.on('down', () => {
      indexSelection = (indexSelection + 1) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheK.on('down', () => {
      if (indexSelection === 0) {
        this.afficherSelectionMode();
      } else if (indexSelection === 1) {
        this.afficherCredits();
      }
    });
  }

  afficherSelectionMode() {
    // Nettoyer la scène et les inputs
    this.children.removeAll();
    this.input.keyboard.removeAllListeners();
    this.input.removeAllListeners();

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Fond menu1
    this.add.image(0, 0, "menu1").setOrigin(0);

    // Texte
    this.add.text(centerX, centerY - 150, "CHOISISSEZ VOTRE MODE", {
      fontSize: "32px",
      color: "#f7e5b3",
      fontStyle: "bold"
    }).setOrigin(0.5);

    let indexSelection = 0;

    // Bouton Campagne (à gauche)
    var bouton_campagne = this.add.image(centerX - 150, centerY, "bouton_campagne").setOrigin(0.5);
    bouton_campagne.setScale(1.5);
    bouton_campagne.setInteractive();

    // Bouton 1vs1 (à droite)
    var bouton_1vs1 = this.add.image(centerX + 150, centerY, "bouton_1vs1").setOrigin(0.5);
    bouton_1vs1.setScale(1.5);
    bouton_1vs1.setInteractive();

    // Bouton Quitter
    var bouton_quitter = this.add.image(centerX, centerY + 100, "bouton_quitter").setOrigin(0.5);
    bouton_quitter.setScale(1.5);
    bouton_quitter.setInteractive();

    const boutons = [bouton_campagne, bouton_1vs1, bouton_quitter];

    const mettreAJourSelection = () => {
      boutons.forEach((bouton, index) => {
        if (index === indexSelection) {
          bouton.setScale(1.7);
        } else {
          bouton.setScale(1.5);
        }
      });
    };

    mettreAJourSelection();

    bouton_campagne.on("pointerover", () => {
      indexSelection = 0;
      mettreAJourSelection();
    });

    bouton_campagne.on("pointerdown", () => {
      this.sound.stopByKey('musique_menu');
      this.scene.start("transition1");
    });

    bouton_1vs1.on("pointerover", () => {
      indexSelection = 1;
      mettreAJourSelection();
    });

    bouton_1vs1.on("pointerdown", () => {
      this.sound.stopByKey('musique_menu');
      this.scene.start("mode1vs1");
    });

    bouton_quitter.on("pointerover", () => {
      indexSelection = 2;
      mettreAJourSelection();
    });

    bouton_quitter.on("pointerdown", () => {
      this.afficherMenu3();
    });

    // Clavier
    this.toucheHaut = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.toucheBas = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.toucheGauche = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.toucheDroite = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.toucheK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    
    this.toucheHaut.on('down', () => {
      indexSelection = (indexSelection - 1 + boutons.length) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheBas.on('down', () => {
      indexSelection = (indexSelection + 1) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheGauche.on('down', () => {
      if (indexSelection === 0 || indexSelection === 1) {
        indexSelection = indexSelection === 0 ? 1 : 0;
        mettreAJourSelection();
      }
    });

    this.toucheDroite.on('down', () => {
      if (indexSelection === 0 || indexSelection === 1) {
        indexSelection = indexSelection === 0 ? 1 : 0;
        mettreAJourSelection();
      }
    });

    this.toucheK.on('down', () => {
      if (indexSelection === 0) {
        this.sound.stopByKey('musique_menu');
        this.scene.start("transition1");
      } else if (indexSelection === 1) {
        this.sound.stopByKey('musique_menu');
        this.scene.start("mode1vs1");
      } else {
        this.afficherMenu3();
      }
    });
  }

  afficherCredits() {
    // Nettoyer la scène
    this.children.removeAll();
    this.input.keyboard.removeAllListeners();
    this.input.removeAllListeners();

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Fond noir
    this.add.rectangle(0, 0, 800, 600, 0x000000).setOrigin(0);

    // Texte "En travaux"
    this.add.text(centerX, centerY - 50, "En travaux", {
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    let indexSelection = 0;

    // Bouton Quitter
    var bouton_quitter = this.add.image(centerX, centerY + 100, "bouton_quitter").setOrigin(0.5);
    bouton_quitter.setScale(1.5);
    bouton_quitter.setInteractive();

    const boutons = [bouton_quitter];

    const mettreAJourSelection = () => {
      boutons.forEach((bouton, index) => {
        if (index === indexSelection) {
          bouton.setScale(1.7);
        } else {
          bouton.setScale(1.5);
        }
      });
    };

    mettreAJourSelection();

    bouton_quitter.on("pointerover", () => {
      indexSelection = 0;
      mettreAJourSelection();
    });

    bouton_quitter.on("pointerdown", () => {
      this.afficherMenu3();
    });

    // Clavier
    this.toucheHaut = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.toucheBas = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.toucheK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    this.toucheHaut.on('down', () => {
      indexSelection = (indexSelection - 1 + boutons.length) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheBas.on('down', () => {
      indexSelection = (indexSelection + 1) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheK.on('down', () => {
      this.afficherMenu3();
    });
  }

  afficherDidacticiel() {
    // Nettoyer la scène
    this.children.removeAll();
    this.input.keyboard.removeAllListeners();
    this.input.removeAllListeners();

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Fond noir
    this.add.rectangle(0, 0, 800, 600, 0x000000).setOrigin(0);

    // Texte "En travaux"
    this.add.text(centerX, centerY - 100, "En travaux", {
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // Instructions
    this.add.text(centerX, centerY, "Déplacez vous avec le joystick\net arrêtez vous pour tirer", {
      fontSize: "24px",
      color: "#ffffff",
      align: "center"
    }).setOrigin(0.5);

    let indexSelection = 0;

    // Bouton Quitter
    var bouton_quitter = this.add.image(centerX, centerY + 100, "bouton_quitter").setOrigin(0.5);
    bouton_quitter.setScale(1.5);
    bouton_quitter.setInteractive();

    const boutons = [bouton_quitter];

    const mettreAJourSelection = () => {
      boutons.forEach((bouton, index) => {
        if (index === indexSelection) {
          bouton.setScale(1.7);
        } else {
          bouton.setScale(1.5);
        }
      });
    };

    mettreAJourSelection();

    bouton_quitter.on("pointerover", () => {
      indexSelection = 0;
      mettreAJourSelection();
    });

    bouton_quitter.on("pointerdown", () => {
      this.afficherMenu3();
    });

    // Clavier
    this.toucheHaut = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.toucheBas = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.toucheK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

    this.toucheHaut.on('down', () => {
      indexSelection = (indexSelection - 1 + boutons.length) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheBas.on('down', () => {
      indexSelection = (indexSelection + 1) % boutons.length;
      mettreAJourSelection();
    });

    this.toucheK.on('down', () => {
      this.afficherMenu3();
    });
  }
}