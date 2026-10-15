export default class controls extends Phaser.Scene {
  constructor() {
    super({ key: "controls" });
  }

  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.image("button_back", "./assets/boutton/button_back.png");

    // Chargement des trois pages (adapte le chemin si besoin)
    this.load.image("controls_1j", "./assets/ecrans/controls_screen.png");
    this.load.image("controls_2j", "./assets/ecrans/controls_screen2.png");
    this.load.image("controls_items", "./assets/ecrans/item_screen.png");
  }

  create() {
    const w = this.game.config.width;
    const h = this.game.config.height;

    const baseScale = 0.36;
    const zoomScale = baseScale * 1.12;

    // Configuration des 3 pages
    this.pages = [
      { cle: "controls_1j", nom: "1 Joueur" },
      { cle: "controls_2j", nom: "2 Joueurs" },
      { cle: "controls_items", nom: "Items 2 Joueurs" }
    ];
    this.pageActuelle = 0;

    // Affichage de l'écran en fond (page 1 joueur par défaut)
    this.fondControls = this.add
      .image(w / 2, h / 2, this.pages[this.pageActuelle].cle)
      .setDisplaySize(w, h)
      .setDepth(-1);

    // Bouton retour (au même endroit, au premier plan)
    this.add
      .image(w / 2, 650, "button_back")
      .setOrigin(0.5)
      .setScale(zoomScale)
      .setTint(0xff9999)
      .setDepth(10);

    // Création du schéma explicatif en bas à droite
    this.creerIndicateurPages(w, h);

    // Flèches GAUCHE et DROITE pour changer de page
    this.input.keyboard.on("keydown-RIGHT", () => {
      this.pageActuelle = (this.pageActuelle + 1) % this.pages.length;
      this.majPage(w, h);
    });

    this.input.keyboard.on("keydown-LEFT", () => {
      this.pageActuelle = (this.pageActuelle - 1 + this.pages.length) % this.pages.length;
      this.majPage(w, h);
    });

    // Espace ou Échap = retour à l'accueil
    this.input.keyboard.once("keydown-I", () => this.scene.start("accueil"));
  }

  // Crée le petit panneau indicateur en bas à droite
  creerIndicateurPages(w, h) {
    const boxW = 240;
    const boxH = 120;
    const boxX = w - boxW / 2 - 20; // À 20px du bord droit
    const boxY = h - boxH / 2 - 20; // À 20px du bord bas

    // Fond noir semi-transparent avec bordure pour rester lisible sur tous les écrans
    this.add
      .rectangle(boxX, boxY, boxW, boxH, 0x000000, 0.75)
      .setStrokeStyle(2, 0xc84b43)
      .setDepth(10);

    // Titre d'instruction avec les flèches
    this.add
      .text(boxX, boxY - 40, "◄  PAGES (←/→)  ►", {
        fontFamily: "Arial, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#ffffff"
      })
      .setOrigin(0.5)
      .setDepth(11);

    // Liste des 3 écrans
    this.textesIndicateur = this.pages.map((page, index) => {
      return this.add
        .text(boxX - boxW / 2 + 20, boxY - 12 + index * 24, `${index + 1}. ${page.nom}`, {
          fontFamily: "Arial, sans-serif",
          fontSize: "16px",
          color: "#888888"
        })
        .setOrigin(0, 0.5)
        .setDepth(11);
    });

    this.majIndicateur();
  }

  // Met à jour l'image de fond et le schéma
  majPage(w, h) {
    this.fondControls.setTexture(this.pages[this.pageActuelle].cle);
    this.fondControls.setDisplaySize(w, h);
    this.majIndicateur();
  }

  // Met en évidence la page active dans le schéma en bas à droite
  majIndicateur() {
    this.textesIndicateur.forEach((texte, index) => {
      if (index === this.pageActuelle) {
        texte.setText(`▶ ${index + 1}. ${this.pages[index].nom}`);
        texte.setColor("#e6b84d"); // Jaune doré (rappel des boutons)
        texte.setFontStyle("bold");
      } else {
        texte.setText(`   ${index + 1}. ${this.pages[index].nom}`);
        texte.setColor("#888888"); // Grisé quand inactif
        texte.setFontStyle("normal");
      }
    });
  }
}