// Scène de pause du jeu : écran qui se superpose au jeu
export default class pause extends Phaser.Scene {
  // Constructeur : définit la clé de la scène
  constructor() {
    super({ key: "pause" });
  }

  // Préchargement des images utilisées dans la scène
  preload() {
    this.load.image("button_reprendre", "assets/button_reprendre.png");
    this.load.image("button_parametres", "assets/button_parametres.png"); 
    this.load.image("button_controls", "assets/button_controls.png"); 
    this.load.image("button_quitter", "assets/button_quitter.png"); 
  }

  // Création des éléments visuels et interactivité
  create() {
    // Fond semi-transparent pour assombrir le jeu en arrière-plan
    this.add.rectangle(
      this.game.config.width / 2, 
      this.game.config.height / 2, 
      this.game.config.width, 
      this.game.config.height, 
      0x000000, 
      0.8
    );


    // Panneau central pour le menu pause
    const panelWidth = 400;
    const panelHeight = 500;
    /*
    this.add.rectangle(
      this.game.config.width / 2, 
      this.game.config.height / 2, 
      panelWidth, 
      panelHeight, 
      0x2a2a2a, 
      0.95
    )//.setStrokeStyle(4, 0xff8800);
    */

    // Titre "PAUSE"
    this.add.text(
      this.game.config.width / 2, 
      150, 
      'PAUSE', 
      {
        fontSize: '64px',
        fontfamily: 'Verdana',
        color: '#ffffffff',
        //stroke: '#000000',
        //strokeThickness: 6
      }
    ).setOrigin(0.5);

    // Positionnement des boutons
    const xBoutons = this.game.config.width / 2;
    const yDebut = 280;
    const ecart = 90;

    // Création des boutons (images)
    const bouton_reprendre = this.add.image(xBoutons, yDebut, "button_reprendre").setScale(0.7);
    const bouton_parametres = this.add.image(xBoutons, yDebut + ecart, "button_parametres").setScale(0.7);
    const bouton_menu = this.add.image(xBoutons, yDebut + ecart * 2, "button_controls").setScale(0.7);
    const bouton_quitter = this.add.image(xBoutons, yDebut + ecart * 3, "button_quitter").setScale(0.7);

    // Système de navigation par touches
    this.boutons = [bouton_reprendre, bouton_parametres, bouton_menu, bouton_quitter];
    this.actions = [
      () => this.reprendreJeu(),
      () => this.ouvrirParametres(),
      () => this.ouvrirControles(),
      () => this.quitterJeu()
    ];
    this.selectedIndex = 0; // Par défaut sur "Reprendre"

    // Mise en surbrillance du bouton sélectionné
    this.updateSelection();

    // Contrôles clavier
    this.cursors = this.input.keyboard.createCursorKeys();
    this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.pauseKeyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.pauseKeyY = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y);

    /*
    // Indication visuelle des contrôles
    this.add.text(
      this.game.config.width / 2,
      this.game.config.height - 50,
      'Flèches : Naviguer | I : Sélectionner | P/Y : Reprendre',
      {
        fontSize: '14px',
        color: '#aaaaaa'
      }
    ).setOrigin(0.5);
    */
  }

  // Méthode pour mettre à jour la sélection visuelle
  updateSelection() {
    this.boutons.forEach((bouton, index) => {
      if (index === this.selectedIndex) {
        bouton.setScale(0.85); // Agrandir le bouton sélectionné
        bouton.clearTint(); // Supprimer la teinte
      } else {
        bouton.setScale(0.7); // Taille normale
        bouton.setTint(0xEBCF88); // Teinte orange pour le bouton sélectionné
      }
    });
  }

  // Boucle de mise à jour pour la navigation
  update() {
    // Navigation vers le haut
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.selectedIndex--;
      if (this.selectedIndex < 0) {
        this.selectedIndex = this.boutons.length - 1; // Boucle vers le bas
      }
      this.updateSelection();
    }

    // Navigation vers le bas
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.selectedIndex++;
      if (this.selectedIndex >= this.boutons.length) {
        this.selectedIndex = 0; // Boucle vers le haut
      }
      this.updateSelection();
    }

    // Sélection avec I
    if (Phaser.Input.Keyboard.JustDown(this.actionKey)) {
      this.actions[this.selectedIndex]();
    }

    // Touches P ou Y pour reprendre directement
    if (Phaser.Input.Keyboard.JustDown(this.pauseKeyP) || Phaser.Input.Keyboard.JustDown(this.pauseKeyY)) {
      this.reprendreJeu();
    }
  }

  // Reprendre le jeu
  reprendreJeu() {
    // Trouve automatiquement quelle scène est en pause
    const scenesEnPause = this.scene.manager.scenes.filter(scene => 
      scene.scene.isPaused() && scene.scene.key !== 'pause'
    );
    
    if (scenesEnPause.length > 0) {
      const sceneAReprendre = scenesEnPause[0].scene.key;
      this.scene.stop(); // Ferme le menu pause
      this.scene.resume(sceneAReprendre); // Reprend la scène de jeu exactement où elle était
    }
  }

  // Ouvrir les paramètres
  ouvrirParametres() {
    this.scene.sleep(); // Met en pause la scène pause au lieu de la stopper
    this.scene.launch('parametres', { fromPause: true }); // Indique qu'on vient de pause
  }

  // Ouvrir les contrôles
  ouvrirControles() {
    this.scene.sleep(); // Met en pause la scène pause au lieu de la stopper
    this.scene.launch('controls', { fromPause: true }); // Indique qu'on vient de pause
  }

  // Quitter le jeu (retourne à l'accueil)
  quitterJeu() {
    // Trouve et arrête toutes les scènes actives sauf l'accueil
    const scenesActives = this.scene.manager.scenes.filter(scene => 
      scene.scene.isActive() || scene.scene.isPaused()
    );
    
    scenesActives.forEach(scene => {
      this.scene.stop(scene.scene.key);
    });

    // Démarre la scène d'accueil
    this.scene.start('accueil');
  }
}