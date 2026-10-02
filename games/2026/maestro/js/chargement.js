// ============================================================================
//  js/chargement.js — première scène du jeu
//
//  Elle fait 3 choses, UNE SEULE FOIS au lancement :
//    1. charge toutes les images (preload)
//    2. fabrique quelques textures dessinées en code (plateformes, cœurs, lumière)
//    3. crée toutes les animations, puis lance l'écran d'accueil
//  Les images et les animations sont partagées par toutes les scènes du jeu.
// ============================================================================

// Pour chaque personnage : le nom des animations (= une image par animation,
// toutes en frames de 64 x 64 pixels) et leurs réglages.
// frames = nombre d'images, fps = vitesse, repeat = -1 (boucle) ou 0 (une fois)
const ANIMATIONS = {
  cantatrice: {
    idle: { frames: 4, fps: 5, repeat: -1 },
    walk: { frames: 6, fps: 10, repeat: -1 },
    jump: { frames: 6, fps: 10, repeat: 0 },
    shoot: { frames: 7, fps: 14, repeat: 0 },
    hurt: { frames: 4, fps: 12, repeat: 0 },
    death: { frames: 9, fps: 9, repeat: 0 }
  },
  detective: {
    idle: { frames: 4, fps: 5, repeat: -1 },
    walk: { frames: 8, fps: 10, repeat: -1 },
    jump: { frames: 7, fps: 10, repeat: 0 },
    shoot: { frames: 7, fps: 14, repeat: 0 }, // sert pour allumer la lampe
    hurt: { frames: 4, fps: 12, repeat: 0 },
    death: { frames: 11, fps: 9, repeat: 0 }
  },
  tuba: {
    idle: { frames: 4, fps: 5, repeat: -1 },
    walk: { frames: 8, fps: 8, repeat: -1 },
    attack: { frames: 7, fps: 10, repeat: 0 },
    hurt: { frames: 4, fps: 12, repeat: 0 },
    death: { frames: 10, fps: 9, repeat: 0 }
  },
  cristal: {
    idle: { frames: 4, fps: 6, repeat: -1 },
    death: { frames: 6, fps: 10, repeat: 0 }
  }
};

export default class chargement extends Phaser.Scene {
  constructor() {
    super({ key: "chargement" });
  }

  // --------------------------------------------------------------------------
  // preload : chargement de tous les fichiers (avec une barre de progression)
  // --------------------------------------------------------------------------
  preload() {
    // comme dans le gabarit : on indique où se trouvent les fichiers du jeu
    this.load.setBaseURL(this.sys.game.config.baseURL);

    // barre de progression
    this.add.rectangle(640, 360, 604, 28, 0x0b1030).setStrokeStyle(3, 0xf5d97a);
    const barre = this.add.rectangle(342, 360, 0, 20, 0xf5d97a).setOrigin(0, 0.5);
    this.add
      .text(640, 310, "Chargement...", {
        fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
        fontSize: "28pt",
        color: "#f5d97a"
      })
      .setOrigin(0.5);
    this.load.on("progress", function (valeur) {
      barre.width = 600 * valeur;
    });
    // si un fichier est introuvable on le voit tout de suite dans la console
    this.load.on("loaderror", function (fichier) {
      console.warn("Fichier introuvable : " + fichier.src);
    });

    // ---- Écrans plein format ----
    this.load.image("img_accueil", "./assets/accueil.jpg");
    this.load.image("img_gameover", "./assets/gameover.jpg");
    this.load.image("img_victoire", "./assets/victoire.jpg");
    this.load.image("img_fond_niveau1", "./assets/fond_niveau1.jpg");

    // ---- Personnages et ennemis : un fichier par animation, frames de 64 x 64 ----
    for (const perso in ANIMATIONS) {
      for (const anim in ANIMATIONS[perso]) {
        const cle = perso + "_" + anim; // ex : "cantatrice_walk"
        this.load.spritesheet(cle, "./assets/" + cle + ".png", {
          frameWidth: 64,
          frameHeight: 64
        });
      }
    }

    // ---- Onde de la Cantatrice : 6 colonnes (animation) x 3 lignes (Do rouge, Mi bleu, Sol doré) ----
    this.load.spritesheet("onde", "./assets/onde_projectile_do_mi_sol.png", {
      frameWidth: 32,
      frameHeight: 24
    });

    // ---- Divers ----
    this.load.image("img_partition", "./assets/partition.png");
    this.load.spritesheet("porte_sortie", "./assets/porte_sortie.png", {
      frameWidth: 96,
      frameHeight: 120
    });
  }

  // --------------------------------------------------------------------------
  // create : textures dessinées en code + animations, puis on passe à l'accueil
  // --------------------------------------------------------------------------
  create() {
    this.creerTextures();
    this.creerAnimations();
    this.scene.start("accueil");
  }

  // Fabrique des textures avec du code (pas besoin d'image pour ça)
  creerTextures() {
    // "make.graphics" avec add:false = un pinceau qui ne s'affiche pas à l'écran
    const pinceau = this.make.graphics({ add: false });

    // Plateforme en bois de scène (64 x 32) : se répète avec un tileSprite
    pinceau.fillStyle(0x6b4630).fillRect(0, 0, 64, 32);
    pinceau.fillStyle(0xd4a94f).fillRect(0, 0, 64, 4); // liseré doré sur le dessus
    pinceau.fillStyle(0x8a5e40).fillRect(0, 4, 64, 3); // reflet
    pinceau.fillStyle(0x4a2f20).fillRect(31, 7, 2, 25); // joint entre deux planches
    pinceau.fillRect(0, 19, 64, 1);
    pinceau.generateTexture("tex_bois", 64, 32);

    // Plateforme fantôme (64 x 32) : violette et lumineuse
    pinceau.clear();
    pinceau.fillStyle(0x6a4bd8, 0.85).fillRect(0, 0, 64, 32);
    pinceau.fillStyle(0xe2d8ff).fillRect(0, 0, 64, 4);
    pinceau.lineStyle(2, 0xb59cff).strokeRect(1, 1, 62, 30);
    pinceau.generateTexture("tex_fantome", 64, 32);

    // Cœur plein (rouge) et cœur vide (gris) : 28 x 26
    pinceau.clear();
    pinceau.fillStyle(0xe8324a);
    pinceau.fillCircle(8, 8, 7).fillCircle(20, 8, 7).fillTriangle(1, 11, 27, 11, 14, 25);
    pinceau.generateTexture("tex_coeur", 28, 26);
    pinceau.clear();
    pinceau.fillStyle(0x3a3050);
    pinceau.fillCircle(8, 8, 7).fillCircle(20, 8, 7).fillTriangle(1, 11, 27, 11, 14, 25);
    pinceau.generateTexture("tex_coeur_vide", 28, 26);

    // Petite flèche dorée qui indique quel personnage on contrôle (mode solo)
    pinceau.clear();
    pinceau.fillStyle(0xf5d97a).fillTriangle(0, 0, 22, 0, 11, 14);
    pinceau.generateTexture("tex_fleche", 22, 14);
    pinceau.destroy();

    // Halo de lumière de la lampe : un dégradé circulaire dessiné sur un canvas HTML
    if (this.textures.exists("tex_lumiere") == false) {
      const toile = this.textures.createCanvas("tex_lumiere", 256, 256);
      const ctx = toile.getContext();
      const degrade = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
      degrade.addColorStop(0, "rgba(255, 236, 170, 0.70)");
      degrade.addColorStop(0.7, "rgba(255, 215, 120, 0.30)");
      degrade.addColorStop(1, "rgba(255, 200, 100, 0)");
      ctx.fillStyle = degrade;
      ctx.fillRect(0, 0, 256, 256);
      toile.refresh();
    }
  }

  // Crée toutes les animations à partir de la table ANIMATIONS en haut du fichier
  creerAnimations() {
    for (const perso in ANIMATIONS) {
      for (const anim in ANIMATIONS[perso]) {
        const reglage = ANIMATIONS[perso][anim];
        const cle = perso + "_" + anim;
        this.anims.create({
          key: cle, // ex : "cantatrice_walk"
          frames: this.anims.generateFrameNumbers(cle, { start: 0, end: reglage.frames - 1 }),
          frameRate: reglage.fps,
          repeat: reglage.repeat
        });
      }
    }

    // Les 3 notes de l'onde : chaque couleur est une ligne de 6 images dans la planche
    const notes = ["do", "mi", "sol"]; // Do = rouge, Mi = bleu, Sol = doré
    notes.forEach((note, ligne) => {
      this.anims.create({
        key: "onde_" + note,
        frames: this.anims.generateFrameNumbers("onde", { start: ligne * 6, end: ligne * 6 + 5 }),
        frameRate: 12,
        repeat: -1
      });
    });

    // La porte de sortie qui s'ouvre (6 images, une seule fois)
    this.anims.create({
      key: "porte_ouvre",
      frames: this.anims.generateFrameNumbers("porte_sortie", { start: 0, end: 5 }),
      frameRate: 8,
      repeat: 0
    });
  }
}
