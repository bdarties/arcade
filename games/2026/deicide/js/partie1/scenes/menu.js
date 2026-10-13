// menu.js : l'écran d'accueil du jeu, avec les boutons JOUER (solo) et 1 V 1 (1 contre 1, voir versus.js)
// C'est la première scène : elle charge tous les assets du jeu (avec une barre de chargement), puis attend qu'on appuie
// sur un bouton. Le fond est l'image du menu (assets/images/menu/fond_menu.png, 1280 x 720). Le bouton Jouer est dans
// assets/images/menu/bouton_jouer.png (15 images de 104 x 44 empilées : 0 = normal, 1 à 12 = survol animé, 13 et 14 = clic).
// L'image est fixe, alors le menu l'anime avec quelques petits effets posés par-dessus (voir animer) : le robot tire,
// il cligne de l'œil, le titre "glitche" de temps en temps et de la poussière flotte dans l'air.
import { chargerJeu } from "../systemes/chargement.js"; // charge tous les assets du jeu pendant que le menu s'affiche
import { creerAnimationsPersonnage } from "../personnage/personnage.js"; // crée la texture de la balle du robot
import { jouerSon } from "../systemes/sons.js"; // bruitages
import { creerPolice, ecrire } from "./classement.js"; // la police pixel du jeu (pour écrire « 1 V 1 » sur la dalle)

// les touches qui lancent le jeu : Entrée, Espace, et les boutons de la borne (X = start, puis les boutons 1 à 6 : I O P K L ;)
const TOUCHES_JOUER = ["ENTER", "SPACE", "X", "I", "O", "P", "K", "L", "SEMICOLON"];
// les boutons du joueur 2 (R T Y F G H, et son start N) lancent directement le 1 contre 1
const TOUCHES_JOUEUR2 = ["R", "T", "Y", "F", "G", "H", "N"];

// Le robot de l'image est un Bot Wheel dessiné avec des pixels de 10,4 px (mesuré sur l'image). Pour que la flamme du tir
// tombe pile au bout de son canon, on pose les images de "shoot FX.png" avec la même taille de pixel.
const PIXEL = 10.4; // taille d'un pixel du robot dans l'image du menu
const CANON = { x: 330, y: 584 }; // le bout du canon du robot dans l'image
// le centre de la flamme : 11,5 pixels devant le bout du canon (comme dans l'image du tir)
const CENTRE_FLAMME = { x: CANON.x + 11.5 * PIXEL, y: CANON.y };
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
    // la flamme du canon, seule (4 images)
    this.load.spritesheet("menu_flamme_tir", "./assets/Spritesheet/Player/Bot Wheel/shoot FX.png", { frameWidth: 117, frameHeight: 26 });
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
    // agrandi x4 : la dalle fait 384 x 128 px (assez haut pour ne pas toucher la flamme du tir)
    this.bouton = this.add.sprite(640, 405, "bouton_jouer", 1).setScale(4);
    this.bouton.play("bouton_jouer_survol");
    // seule la dalle réagit, pas les flammes
    this.bouton.setInteractive({ hitArea: new Phaser.Geom.Rectangle(4, 10, 96, 32), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
    this.bouton.on("pointerdown", () => this.lancer());

    // le bouton « 1 V 1 » : la même dalle que « JOUER ». Haut / bas change de mode, un bouton valide celui qui
    // est choisi.
    this.mode = 1; // 1 = solo, 2 = 1 contre 1
    this.boutonDeux = this.creerBoutonDeux(640, 545);
    this.indication = this.add.text(640, 640, "HAUT / BAS : CHOISIR", { fontFamily: "monospace", fontSize: "16px", color: "#8a779b", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5);
    this.majMode();
    ["UP", "W", "Z"].forEach((nom) => this.input.keyboard.on("keydown-" + nom, () => this.changerMode(1)));
    ["DOWN", "S"].forEach((nom) => this.input.keyboard.on("keydown-" + nom, () => this.changerMode(2)));
    this.boutonDeux.dalle.on("pointerdown", () => { this.mode = 2; this.lancer(); });

    const aide = this.add.text(640, 674, "APPUIE SUR UN BOUTON", { fontFamily: "monospace", fontSize: "22px", color: "#8a779b", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5);
    // le but du jeu, sous le titre
    this.add.text(640, 275, "BATS LE DIEU DE LA LUMIÈRE LE PLUS VITE POSSIBLE", { fontFamily: "monospace", fontSize: "22px", color: "#f4b6c2", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5);
    this.tweens.add({ targets: aide, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 }); // il clignote doucement

    TOUCHES_JOUER.forEach((nom) => this.input.keyboard.addKey(nom).on("down", () => this.lancer()));
    // un bouton du joueur 2 : directement le 1 contre 1
    TOUCHES_JOUEUR2.forEach((nom) => this.input.keyboard.addKey(nom).on("down", () => { this.mode = 2; this.lancer(); }));
    this.lance = false;
  }

  creerBoutonDeux(x, y) { // la même dalle animée que « JOUER » : on cache son texte et on écrit « 1 V 1 » à la place (police pixel du jeu)
    creerPolice(this);
    const dalle = this.add.sprite(x, y, "bouton_jouer", 1).setScale(4);
    dalle.play("bouton_jouer_survol");
    const cache = this.add.rectangle(x + 38, y + 6, 224, 52, 0x050505); // le fond sombre qui recouvre le mot « JOUER » (centre de la dalle : 52 / 22 sur l'image)
    const texte = ecrire(this, x + 23, y + 7, "1V1", 7, { profondeur: 0 });
    const voile = this.add.rectangle(x, y, 416, 176, 0x0e0e11, 0.6); // atténue la dalle quand elle n'est pas choisie (on n'utilise pas l'alpha : le mot « JOUER » transparaîtrait sous le cache)
    const groupe = this.add.container(0, 0, [dalle, cache, texte, voile]);
    dalle.setInteractive({ hitArea: new Phaser.Geom.Rectangle(4, 10, 96, 32), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
    return { voile, dalle };
  }

  changerMode(mode) { // haut : solo, bas : 1 contre 1
    if (this.lance || this.mode === mode) return;
    this.mode = mode;
    this.majMode();
  }

  majMode() { // le mode choisi est en pleine couleur, l'autre est atténué
    this.bouton.setAlpha(this.mode === 2 ? 0.4 : 1);
    this.boutonDeux.voile.setVisible(this.mode !== 2);
  }

  animer() { // les effets qui font vivre l'image fixe du menu
    // 1. le robot tire : la flamme apparaît au bout de son canon et une balle traverse l'écran
    this.textures.get("menu_flamme_tir").setFilter(Phaser.Textures.FilterMode.NEAREST);
    // une seule fois : le menu se rouvre après chaque partie
    if (!this.anims.exists("menu_flamme_tir")) this.anims.create({ key: "menu_flamme_tir", frames: this.anims.generateFrameNumbers("menu_flamme_tir", { start: 0, end: 3 }), frameRate: 10, repeat: 0 });
    const flamme = this.add.sprite(CENTRE_FLAMME.x - 42.5 * PIXEL, CENTRE_FLAMME.y - 10 * PIXEL, "menu_flamme_tir").setOrigin(0, 0).setScale(PIXEL).setVisible(false);
    flamme.on("animationcomplete", () => flamme.setVisible(false));
    const tirer = () => {
      flamme.setVisible(true).play("menu_flamme_tir"); // le centre de la flamme est à 42,5 colonnes et 10 lignes du coin de l'image
      const balle = this.add.image(CENTRE_FLAMME.x, CENTRE_FLAMME.y, "botwheel_balle").setScale(PIXEL); // la balle part du centre de la flamme
      // elle accélère vers la droite
      this.tweens.add({ targets: balle, x: 1340, duration: 1000, ease: "Quad.easeIn", onComplete: () => balle.destroy() });
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
        // la même image, découpée en tranche et décalée
        tranches.push(this.add.image(decalage, 0, "fond_menu").setOrigin(0, 0).setCrop(TITRE.x, y, TITRE.largeur, hauteur));
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
    if (this.mode === 2) { // 1 contre 1 : pas de chrono, on file dans l'arène
      jouerSon(this, "porte");
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start("versus"));
      return;
    }
    this.registry.set("chrono", 0); // nouvelle partie : le chrono repart de zéro
    this.registry.set("score", 0); // le score aussi
    this.registry.set("morts", 0); // et le nombre de morts
    this.registry.set("numeroPartie", (this.registry.get("numeroPartie") ?? 0) + 1); // une partie de plus (sert aux conseils qui ne s'affichent qu'une fois par partie)
    this.registry.set("phaseBoss", null); // le boss repart de sa phase 1
    this.registry.set("guideVu", false); // le guide (but et commandes) s'affichera au début de cette partie
    this.registry.set("chronoActif", true); // le chrono peut tourner (il a pu être arrêté par la partie précédente)
    this.bouton.play("bouton_jouer_clic");
    jouerSon(this, "porte"); // bruit de porte, comme quand on entre dans un niveau
    this.time.delayedCall(180, () => this.cameras.main.fadeOut(350, 0, 0, 0));
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start("niveau1"));
  }
}
