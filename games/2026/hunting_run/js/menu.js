import { JOUEUR } from "./maps.js";

// Écran de choix du mode : 1 joueur / 2 joueurs (+ bouton Exit pour revenir à l'accueil)
export default class menu extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });
  }

  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.image("select_fond", "./assets/ui/select-mode.png");
    this.load.image("exit_btn", "./assets/ui/exit.png");
  }

  create() {
    this.cameras.main.fadeIn(300);
    this.parti = false;

    const L = this.scale.width;
    const H = this.scale.height;
    this.add.image(L / 2, H / 2, "select_fond");

    // 0 = 1 joueur, 1 = 2 joueurs, 2 = bouton Exit
    this.choix = 0;
    this.derniereCarte = 0;

    // zones des deux cartes dessinées dans le fond (en pixels, jeu en 1280 x 720)
    const CARTES = [
      { x: 458, y: 433, w: 276, h: 276 },
      { x: 823, y: 433, w: 276, h: 276 }
    ];
    // bouton Exit (à la place de l'ancien bouton "Retour")
    const EXIT = { x: 165, y: 636 };

    this.exit = this.add.image(EXIT.x, EXIT.y, "exit_btn").setScale(1.3);

    // une carte non sélectionnée est assombrie, la carte sélectionnée a un contour rouge
    this.ombres = CARTES.map((c) => this.add.rectangle(c.x, c.y, c.w, c.h, 0x000000, 0.5));
    this.contours = CARTES.map((c) =>
      this.add.rectangle(c.x, c.y, c.w, c.h).setStrokeStyle(5, 0xff3b3b).setFillStyle()
    );
    this.contourExit = this.add
      .rectangle(EXIT.x, EXIT.y, this.exit.displayWidth + 14, this.exit.displayHeight + 14)
      .setStrokeStyle(4, 0xff3b3b)
      .setFillStyle();

    // petit clignotement des contours
    this.tweens.add({
      targets: [...this.contours, this.contourExit],
      alpha: { from: 1, to: 0.45 },
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    this.add
      .text(L / 2, H - 25, "Joystick : choisir      Bouton A : valider", { fontSize: "20px", color: "#cccccc" })
      .setOrigin(0.5)
      .setShadow(2, 2, "#000000", 4);

    // souris / écran tactile ( JUSTE POUR TESTER, POUR LA BORNE ON L ENLEVERA )
    CARTES.forEach((c, i) => {
      const z = this.add.zone(c.x, c.y, c.w, c.h).setInteractive({ useHandCursor: true });
      z.on("pointerover", () => this.selectionner(i));
      z.on("pointerdown", () => this.lancer(i + 1));
    });
    this.exit.setInteractive({ useHandCursor: true });
    this.exit.on("pointerover", () => this.selectionner(2));
    this.exit.on("pointerdown", () => this.retour());

    // clavier / borne
    const K = Phaser.Input.Keyboard.KeyCodes;
    const gauche = [K.LEFT, K.Q];
    const droite = [K.RIGHT, K.D];
    const haut = [K.UP, K.Z];
    const bas = [K.DOWN, K.S];
    const valider = [K.ENTER, K.SPACE, K.I, K.R];
    this.input.keyboard.on("keydown", (e) => {
      const k = e.keyCode;
      if (gauche.includes(k)) {
        if (this.choix === 1) this.selectionner(0);
      } else if (droite.includes(k)) {
        if (this.choix === 0) this.selectionner(1);
      } else if (bas.includes(k)) {
        if (this.choix !== 2) this.selectionner(2);
      } else if (haut.includes(k)) {
        if (this.choix === 2) this.selectionner(this.derniereCarte);
      } else if (valider.includes(k)) {
        if (this.choix === 2) this.retour();
        else this.lancer(this.choix + 1);
      } else if (k === K.ESC) {
        this.retour();
      }
    });

    this.selectionner(0);
  }

  selectionner(i) {
    this.choix = i;
    if (i < 2) this.derniereCarte = i;
    this.ombres.forEach((o, k) => o.setVisible(i !== k));
    this.contours.forEach((c, k) => c.setVisible(i === k));
    this.contourExit.setVisible(i === 2);
  }

  // Exit : retour à l'écran d'accueil
  retour() {
    if (this.parti) return;
    this.parti = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("accueil"));
  }

  lancer(nbJoueurs) {
    if (this.parti) return;
    this.parti = true;
    this.registry.set("nbJoueurs", nbJoueurs);
    this.registry.remove("finPartie"); // le timer repart à zéro
    this.registry.remove("cle"); // on repart sans la clé
    this.registry.set("pv_1", JOUEUR.pvMax); // vie pleine pour les deux joueurs
    this.registry.set("pv_2", JOUEUR.pvMax);
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("histoire"));
  }
}
