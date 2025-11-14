import { musicManager } from './MusicManager.js';

export default class credits extends Phaser.Scene {
  constructor() {
    super({ key: "credits" });
    this.creditPosition = 900; // Position initiale des crédits
  }

  preload() {
    // Précharger les musiques
    musicManager.preloadMusic(this);
    this.load.image("screen_credits", "assets/screen_credits.jpg");
  }

  create() {
    this.cameras.main.fadeIn(200, 0, 0, 0);

    // Initialiser la musique
    musicManager.scene = this;
    musicManager.play('credits');

    // --- Fond ---
    this.add.image(
      this.game.config.width / 2,
      this.game.config.height / 2,
      "screen_credits"
    );


// Ornements décoratifs autour du titre
    const decorLeft = this.add.text(this.game.config.width / 2 - 180, 100, "⚙", { 
      fontSize: "40px", 
      fill: "#b87333"
    }).setOrigin(0.5);
    const decorRight = this.add.text(this.game.config.width / 2 + 180, 100, "⚙", { 
      fontSize: "40px", 
      fill: "#b87333"
    }).setOrigin(0.5);



    // --- Zone de masquage pour les crédits ---
    // Définit la zone visible pour les crédits (en dessous du titre)
    const maskY = 180; // Position où commence le masquage
    const maskHeight = this.game.config.height - maskY;
    
    // Crée un masque géométrique
    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, maskY, this.game.config.width, maskHeight);
    
    const mask = maskShape.createGeometryMask();

    // --- Styles typographiques ---
    const titleStyle = {
      fontFamily: "Georgia",
      fontSize: "56px",
      color: "#d4af37",
      align: "center",
      fontStyle: "bold",
      stroke: "#3d2817",
      strokeThickness: 6
    };

    const sectionTitleStyle = {
      fontFamily: "Verdana",
      fontSize: "42px",
      color: "#FFD700", // doré
      fontStyle: "bold",
      align: "center",
      stroke: "#000",
      strokeThickness: 4
    };

    const nameStyle = {
      fontFamily: "Verdana",
      fontSize: "28px",
      color: "#ffffff",
      align: "center",
      lineSpacing: 6
    };

    const thanksStyle = {
      fontFamily: "Georgia",
      fontSize: "32px",
      color: "#00FFFF",
      align: "center",
      fontStyle: "italic",
      lineSpacing: 10
    };

    // --- Contenu des crédits (plus clair, avec espaces) ---
    const creditsText = `
CRÉDITS

DÉVELOPPEURS
R. Marty
L. Olsztynski
L.M. Dutherage

CHEF DE PROJET
R. Marty

GRAPHISMES

Contributeurs d'opengameart.org :

bluecarrot16
JaidynReiman
Benjamin K. Smith (BenCreating)
Evert
Eliza Wyatt (ElizaWy)
TheraHedwig
MuffinElZangano
Durrani
Johannes Sjölund (wulax)
Stephen Challener (Redshrike)
Carlo Enrico Victoria (Nemisys)
Napsio (Vitruvian Studio)
Michael Whitlock (bigbeargames)
Matthew Krohn (makrohn)
Marcel van de Steeg (MadMarcel)
Thane Brimhall (pennomi)
laetissima
Nila122
Daniel Eddeland (daneeklu)
gr3yh47
Pierre Vigier (pvigier)

MUSIQUE
Compositeurs à citer...

REMERCIEMENTS
Merci d'avoir joué à notre jeu !
    `;

    // --- Ajout du texte principal avec masque ---
    this.creditsText = this.add.text(
      this.game.config.width / 2,
      this.creditPosition,
      creditsText,
      nameStyle
    ).setOrigin(0.5);

    // Applique le masque aux crédits
    this.creditsText.setMask(mask);

    // Instructions de navigation
    const instructionStyle = {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: "#cd853f",
      align: "center"
    };



    // --- Contrôles clavier ---
    this.cursors = this.input.keyboard.createCursorKeys();

    // Touche M → retour au menu
    this.input.keyboard.addKey('M').on('down', () => {
      this.scene.start("accueil");
    });

    // Limites de défilement
    this.maxScrollUp = 900; // Position de départ
    this.maxScrollDown = -this.creditsText.height - 200; // Limite basse
  }

  update() {
    // --- Défilement des crédits avec limites ---
    if (this.cursors.down.isDown) {
      this.creditPosition -= 2;
      // Limite pour ne pas descendre trop bas
      if (this.creditPosition < this.maxScrollDown) {
        this.creditPosition = this.maxScrollDown;
      }
      this.creditsText.y = this.creditPosition;
    }
    if (this.cursors.up.isDown) {
      this.creditPosition += 2;
      // Limite pour ne pas remonter trop haut
      if (this.creditPosition > this.maxScrollUp) {
        this.creditPosition = this.maxScrollUp;
      }
      this.creditsText.y = this.creditPosition;
    }
  }
}