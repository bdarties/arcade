// menu.js : l'écran d'accueil du jeu, avec le bouton Jouer
// C'est la première scène : elle charge tous les assets du jeu (avec une barre de chargement), puis attend qu'on appuie
// sur un bouton. Le fond est l'image du menu (assets/images/menu/fond_menu.png, 1280 x 720). Le bouton Jouer est dans
// assets/images/menu/bouton_jouer.png (15 images de 104 x 44 empilées : 0 = normal, 1 à 12 = survol animé, 13 et 14 = clic).
// L'image est fixe, alors le menu l'anime avec quelques petits effets posés par-dessus (voir animer) : le robot tire,
// il cligne de l'œil, le titre "glitche" de temps en temps et de la poussière flotte dans l'air.
import { chargerJeu } from "./niveau1.js"; // charge tous les assets du jeu pendant que le menu s'affiche
import { creerAnimationsPersonnage } from "./Personnage/personnage.js"; // crée la texture de la balle du robot
import { jouerSon } from "./sons.js"; // bruitages

// les touches qui lancent le jeu : Entrée, Espace, et les boutons de la borne (X = start, puis les boutons 1 à 6 : I O P K L ;)
const TOUCHES_JOUER = ["ENTER", "SPACE", "X", "I", "O", "P", "K", "L", "SEMICOLON"];

// Le robot de l'image est un Bot Wheel dessiné avec des pixels de 10,4 px (mesuré sur l'image). Pour que la flamme du tir
// tombe pile au bout de son canon, on pose les images de "shoot FX.png" avec la même taille de pixel.
const PIXEL = 10.4; // taille d'un pixel du robot dans l'image du menu
const CANON = { x: 330, y: 584 }; // le bout du canon du robot dans l'image
const CENTRE_FLAMME = { x: CANON.x + 11.5 * PIXEL, y: CANON.y }; // le centre de la flamme : 11,5 pixels devant le bout du canon (comme dans l'image du tir)
const OEIL = { x: 217, y: 501, largeur: 46, hauteur: 26 }; // l'œil du robot, pour le faire clignoter
const TITRE = { x: 229, y: 79, largeur: 822, hauteur: 152 }; // la zone du titre DEICIDE, pour l'effet glitch

export default class menu extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });
  }

  preload() {
    this.cameras.main.setBackgroundColor("#0e0e11");
    this.load.setBaseURL(this.sys.game.config.baseURL); // chemin du jeu, pour que les assets se chargent aussi depuis la borne
    // barre de chargement : elle se remplit pendant que les images et les sons du jeu se chargent
    const texte = this.add.text(640, 380, "CHARGEMENT", { fontFamily: "monospace", fontSize: "24px", color: "#8a779b" }).setOrigin(0.5);
    const cadre = this.add.rectangle(640, 430, 404, 18, 0x251d2a).setStrokeStyle(2, 0x5f4f6e);
    const barre = this.add.rectangle(440, 430, 0, 10, 0xe7e0e9).setOrigin(0, 0.5);
    this.load.on("progress", (avancement) => { barre.width = 400 * avancement; });
    this.load.on("complete", () => { texte.destroy(); cadre.destroy(); barre.destroy(); });
    this.load.image("fond_menu", "./assets/images/menu/fond_menu.png"); // l'image du menu
    this.load.spritesheet("bouton_jouer", "./assets/images/menu/bouton_jouer.png", { frameWidth: 104, frameHeight: 44 }); // le bouton Jouer
    this.load.spritesheet("menu_flamme_tir", "./assets/Spritesheet/Player/Bot Wheel/shoot FX.png", { frameWidth: 117, frameHeight: 26 }); // la flamme du canon, seule (4 images)
    chargerJeu(this); // tout le reste du jeu
  }

  create() {
    creerAnimationsPersonnage(this); // crée entre autres la texture "botwheel_balle" (la balle du robot)
    this.add.image(0, 0, "fond_menu").setOrigin(0, 0); // l'image du menu, sur tout l'écran
    this.animer(); // les petits effets qui font vivre l'image

    // le bouton Jouer, au centre : toujours en survol (flammes), il s'enfonce quand on le lance
    this.textures.get("bouton_jouer").setFilter(Phaser.Textures.FilterMode.NEAREST); // pixel art : pas de flou
    if (!this.anims.exists("bouton_jouer_survol")) {
      this.anims.create({ key: "bouton_jouer_survol", frames: this.anims.generateFrameNumbers("bouton_jouer", { start: 1, end: 12 }), frameRate: 12, repeat: -1 });
      this.anims.create({ key: "bouton_jouer_clic", frames: this.anims.generateFrameNumbers("bouton_jouer", { start: 13, end: 14 }), frameRate: 12, repeat: 0 });
    }
    this.bouton = this.add.sprite(640, 420, "bouton_jouer", 1).setScale(4); // agrandi x4 : la dalle fait 384 x 128 px (assez haut pour ne pas toucher la flamme du tir)
    this.bouton.play("bouton_jouer_survol");
    this.bouton.setInteractive({ hitArea: new Phaser.Geom.Rectangle(4, 10, 96, 32), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true }); // seule la dalle réagit, pas les flammes
    this.bouton.on("pointerdown", () => this.lancer());

    const aide = this.add.text(640, 650, "APPUIE SUR UN BOUTON", { fontFamily: "monospace", fontSize: "22px", color: "#8a779b", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5);
    this.tweens.add({ targets: aide, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 }); // il clignote doucement

    TOUCHES_JOUER.forEach((nom) => this.input.keyboard.addKey(nom).on("down", () => this.lancer()));
    this.lance = false;
  }

  animer() { // les effets qui font vivre l'image fixe du menu
    // 1. le robot tire : la flamme apparaît au bout de son canon et une balle traverse l'écran
    this.textures.get("menu_flamme_tir").setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.anims.create({ key: "menu_flamme_tir", frames: this.anims.generateFrameNumbers("menu_flamme_tir", { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
    const flamme = this.add.sprite(CENTRE_FLAMME.x - 42.5 * PIXEL, CENTRE_FLAMME.y - 10 * PIXEL, "menu_flamme_tir").setOrigin(0, 0).setScale(PIXEL).setVisible(false);
    flamme.on("animationcomplete", () => flamme.setVisible(false));
    const tirer = () => {
      flamme.setVisible(true).play("menu_flamme_tir"); // le centre de la flamme est à 42,5 colonnes et 10 lignes du coin de l'image
      const balle = this.add.image(CENTRE_FLAMME.x, CENTRE_FLAMME.y, "botwheel_balle").setScale(PIXEL); // la balle part du centre de la flamme
      this.tweens.add({ targets: balle, x: 1340, duration: 1000, ease: "Quad.easeIn", onComplete: () => balle.destroy() }); // elle accélère vers la droite
    };
    this.time.addEvent({ delay: 2600, loop: true, startAt: 1800, callback: tirer }); // un tir toutes les 2,6 s, le premier peu après l'arrivée

    // 2. le robot cligne de l'œil : un rectangle de la couleur de la visière cache l'œil un instant
    const paupiere = this.add.rectangle(OEIL.x, OEIL.y, OEIL.largeur, OEIL.hauteur, 0x211924).setVisible(false);
    this.time.addEvent({ delay: 3300, loop: true, callback: () => { paupiere.setVisible(true); this.time.delayedCall(130, () => paupiere.setVisible(false)); } });

    // 3. le titre "glitche" : quelques tranches de l'image du titre sont décalées sur le côté pendant un instant
    const glitcher = () => {
      const tranches = [];
      for (let i = Phaser.Math.Between(2, 3); i > 0; i--) {
        const hauteur = Phaser.Math.Between(6, 24);
        const y = Phaser.Math.Between(TITRE.y, TITRE.y + TITRE.hauteur - hauteur);
        const decalage = Phaser.Math.Between(6, 16) * (Math.random() < 0.5 ? -1 : 1);
        tranches.push(this.add.image(decalage, 0, "fond_menu").setOrigin(0, 0).setCrop(TITRE.x, y, TITRE.largeur, hauteur)); // la même image, découpée en tranche et décalée
      }
      this.time.delayedCall(110, () => tranches.forEach((tranche) => tranche.destroy()));
      this.time.delayedCall(Phaser.Math.Between(2200, 5200), glitcher); // le prochain glitch arrive plus tard, à un moment au hasard
    };
    this.time.delayedCall(1500, glitcher);

    // 4. de la poussière flotte lentement vers le haut
    if (!this.textures.exists("menu_poussiere")) {
      const carre = this.make.graphics({ add: false });
      carre.fillStyle(0xffffff);
      carre.fillRect(0, 0, 4, 4);
      carre.generateTexture("menu_poussiere", 4, 4);
      carre.destroy();
    }
    this.add.particles(0, 0, "menu_poussiere", {
      x: { min: 0, max: 1280 }, y: { min: 380, max: 700 }, // elle naît dans la moitié basse de l'écran
      speedY: { min: -26, max: -10 }, speedX: { min: -6, max: 6 },
      lifespan: 7000, frequency: 500, quantity: 1, // environ 14 grains en même temps
      alpha: { start: 0.3, end: 0 }, tint: 0xe7e0e9 // elle s'efface en montant
    });
  }

  lancer() { // un bouton a été pressé : le bouton s'enfonce, l'écran s'éteint, puis le niveau 1 commence
    if (this.lance) return; // déjà lancé : on ne le fait pas deux fois
    this.lance = true;
    this.bouton.play("bouton_jouer_clic");
    jouerSon(this, "porte"); // bruit de porte, comme quand on entre dans un niveau
    this.time.delayedCall(180, () => this.cameras.main.fadeOut(350, 0, 0, 0));
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start("niveau1"));
  }
}
