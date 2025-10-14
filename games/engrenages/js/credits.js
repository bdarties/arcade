export default class credits extends Phaser.Scene {
  constructor() {
    super({ key: "credits" });
    this.creditPosition = 900; // Position initiale des crédits
  }

  preload() {
    this.load.image("screen_credits", "assets/screen_credits.jpg");
  }

  create() {
    // --- Fond ---
    this.add.image(
      this.game.config.width / 2,
      this.game.config.height / 2,
      "screen_credits"
    );

    // --- Styles typographiques ---
    const titleStyle = {
      fontFamily: "Arial Black",
      fontSize: "56px",
      color: "#ffffff",
      align: "center",
      fontStyle: "bold",
      stroke: "#000000",
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

    // --- Ajout du texte principal ---
    this.creditsText = this.add.text(
      this.game.config.width / 2,
      this.creditPosition,
      creditsText,
      nameStyle
    ).setOrigin(0.5);


    // --- Contrôles clavier ---
    this.cursors = this.input.keyboard.createCursorKeys();

    // Touche M → retour au menu
    this.input.keyboard.addKey('M').on('down', () => {
      this.scene.start("accueil");
    });

  }

  update() {
    // --- Défilement des crédits ---
    if (this.cursors.down.isDown) {
      this.creditPosition -= 2;
      this.creditsText.y = this.creditPosition;
    }
    if (this.cursors.up.isDown) {
      this.creditPosition += 2;
      this.creditsText.y = this.creditPosition;
    }
  }
}
