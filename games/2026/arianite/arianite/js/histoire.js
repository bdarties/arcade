// Scène réutilisable : enchaînement d'images + texte qui s'écrit dans une zone en bas.
// Se lance avec :
//   this.scene.start("histoire", { slides: INTRO, suite: "exterieur", suiteData: {} });
// slides    = la séquence (voir histoire_data.js)
// suite     = la scène qui se lance à la fin
// suiteData = les données envoyées à cette scène (ex : { depuis: "precedent" })
<<<<<<< HEAD
// Un slide peut avoir plusieurs personnages : persos: [{ id, img, cote, flip }]
=======
// Un slide peut avoir plusieurs personnages : persos: [{ id, img, cote, flip, hauteur }]
>>>>>>> Arianite
// et un effet : disparition: "id" (le perso avec cet id disparaît dans un nuage de fumée)

const VITESSE_TEXTE = 35; // ms entre deux lettres (plus petit = plus rapide)
const ASSOMBRIR = 0.25; // voile noir sur le fond, 0 = aucun, 1 = tout noir
const HAUTEUR_PERSO = 450; // hauteur du personnage à l'écran (px)
const DELAI_DISPARITION = 900; // ms avant que le perso disparaisse
const POLICE = 'Georgia, "Times New Roman", serif';

export default class histoire extends Phaser.Scene {
  constructor() {
    super({ key: "histoire" });
  }

  init(data) {
    this.slides = data.slides || [];
    this.suite = data.suite || "exterieur";
    this.suiteData = data.suiteData || {};
    this.index = 0;
    this.enTransition = false;
  }

  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    // on charge toutes les images de la séquence (le chemin sert de clé)
    this.slides.forEach((s) => {
      if (s.fond && !this.textures.exists(s.fond)) this.load.image(s.fond, s.fond);
      this.persosDe(s).forEach((pp) => {
<<<<<<< HEAD
        if (pp.img && !this.textures.exists(pp.img)) this.load.image(pp.img, pp.img);
=======
        if (pp.img && !this.textures.exists(pp.img)) {
          if (pp.sheet) {
            // planche animée : plusieurs images de la même taille côte à côte
            this.load.spritesheet(pp.img, pp.img, { frameWidth: pp.sheet.w, frameHeight: pp.sheet.h });
          } else {
            this.load.image(pp.img, pp.img);
          }
        }
>>>>>>> Arianite
      });
    });
  }

  // liste des personnages d'un slide (accepte aussi l'ancien format perso/cote)
  persosDe(s) {
    if (s.persos) return s.persos;
    if (s.perso) return [{ id: "perso", img: s.perso, cote: s.cote }];
    return [];
  }

  // silhouette noire utilisée si l'image d'un personnage est introuvable
  creerSilhouette() {
    if (this.textures.exists("silhouette")) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x0b0612, 1);
    g.fillPoints(
      [
        { x: 80, y: 20 }, { x: 115, y: 45 }, { x: 125, y: 95 }, { x: 150, y: 300 },
        { x: 10, y: 300 }, { x: 35, y: 95 }, { x: 45, y: 45 }
      ],
      true
    );
    g.lineStyle(3, 0x6a4a8a, 1);
    g.strokePoints(
      [
        { x: 80, y: 20 }, { x: 115, y: 45 }, { x: 125, y: 95 }, { x: 150, y: 300 },
        { x: 10, y: 300 }, { x: 35, y: 95 }, { x: 45, y: 45 }
      ],
      true
    );
    g.fillStyle(0xf2efe6, 1); // demi-masque de l'Opéra
    g.fillEllipse(80, 62, 52, 62);
    g.fillStyle(0x0b0612, 1);
    g.fillEllipse(72, 58, 10, 14);
    g.fillEllipse(90, 58, 10, 14);
    g.generateTexture("silhouette", 160, 300);
    g.destroy();
  }

  create() {
    this.elements = [];
    this.persosObj = {};
    this.creerSilhouette();

    // clic, espace ou entrée = avancer ; échap = passer toute l'histoire
    this.input.on("pointerdown", () => this.avancer());
    this.input.keyboard.on("keydown-SPACE", () => this.avancer());
    this.input.keyboard.on("keydown-ENTER", () => this.avancer());
    this.input.keyboard.once("keydown-ESC", () => this.terminer());

    this.add
      .text(this.game.config.width - 20, 20, "Échap : passer", {
        fontFamily: POLICE,
        fontSize: "20px",
        color: "#ffffff"
      })
      .setOrigin(1, 0)
      .setAlpha(0.7)
      .setDepth(30);

    if (this.slides.length === 0) {
      this.terminer();
      return;
    }
    this.afficher();
  }

  // affiche l'écran numéro this.index
  afficher() {
    const w = this.game.config.width;
    const h = this.game.config.height;
    const s = this.slides[this.index];

    // on efface l'écran précédent
    this.elements.forEach((e) => e.destroy());
    this.elements = [];
    if (this.timer) this.timer.remove();
    if (this.timerEffet) this.timerEffet.remove();
    this.tweens.killAll();
    this.persosObj = {};

    // fond + voile sombre
    if (s.fond) {
      this.elements.push(this.add.image(w / 2, h / 2, s.fond).setDisplaySize(w, h).setDepth(0));
    }
    this.elements.push(this.add.rectangle(w / 2, h / 2, w, h, 0x000000, ASSOMBRIR).setDepth(1));

    // personnages sur les côtés (un ou plusieurs)
    this.persosDe(s).forEach((pp) => {
      const x = pp.cote === "droite" ? w - 260 : 260;
      const cle = this.textures.exists(pp.img) ? pp.img : "silhouette";
      this.textures.get(cle).setFilter(Phaser.Textures.FilterMode.NEAREST); // pixels nets
<<<<<<< HEAD
      const p = this.add.image(x, 620, cle).setOrigin(0.5, 1).setDepth(2);
      p.setScale(HAUTEUR_PERSO / p.height);
=======
      const animee = pp.sheet && cle !== "silhouette";
      const p = animee ? this.add.sprite(x, 620, cle, 0) : this.add.image(x, 620, cle);
      p.setOrigin(0.5, 1).setDepth(2);
      p.setScale((pp.hauteur || HAUTEUR_PERSO) / p.height); // hauteur propre au perso, sinon la valeur par défaut
      if (animee) {
        const anim = "anim_" + cle;
        if (!this.anims.exists(anim)) {
          this.anims.create({
            key: anim,
            frames: this.anims.generateFrameNumbers(cle, { start: 0, end: this.textures.get(cle).frameTotal - 2 }),
            frameRate: pp.sheet.vitesse || 2,
            repeat: -1
          });
        }
        p.play(anim);
      }
>>>>>>> Arianite
      if (pp.flip) p.setFlipX(true);
      this.elements.push(p);
      this.persosObj[pp.id || pp.img] = p;
    });

    // effet : un personnage disparaît (après un petit instant)
    if (s.disparition && this.persosObj[s.disparition]) {
      const cible = this.persosObj[s.disparition];
      this.timerEffet = this.time.delayedCall(DELAI_DISPARITION, () => this.disparaitre(cible));
    }

    // zone de texte en bas
    const boite = this.add
      .rectangle(w / 2, 610, 1200, 180, 0x000000, 0.8)
      .setStrokeStyle(4, 0xe0a83a)
      .setDepth(3);
    this.elements.push(boite);

    this.texteObj = this.add
      .text(w / 2 - 570, 540, "", {
        fontFamily: POLICE,
        fontSize: "28px",
        color: "#ffffff",
        wordWrap: { width: 1140 },
        lineSpacing: 8
      })
      .setDepth(4);
    this.elements.push(this.texteObj);

    // le texte s'écrit lettre par lettre
    this.texteComplet = s.texte || "";
    this.ecrit = 0;
    this.fini = false;
    if (this.texteComplet.length === 0) {
      this.finirTexte();
    } else {
      this.timer = this.time.addEvent({
        delay: VITESSE_TEXTE,
        repeat: this.texteComplet.length - 1,
        callback: () => {
          this.ecrit++;
          this.texteObj.setText(this.texteComplet.slice(0, this.ecrit));
          if (this.ecrit >= this.texteComplet.length) this.finirTexte();
        }
      });
    }

    this.cameras.main.fadeIn(300);
  }

  // disparition : le perso clignote, s'étire et se dissout dans une fumée violette
  disparaitre(p) {
    if (!p || !p.active) return;
    const sx = p.scaleX;
    const sy = p.scaleY;
    const haut = p.displayHeight;

    // 1) clignotement
    this.tweens.add({
      targets: p,
      alpha: 0.15,
      duration: 70,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        if (!p.active) return;
        p.setTint(0x6a3a9a);
        // 2) il s'étire vers le haut et s'efface
        this.tweens.add({
          targets: p,
          alpha: 0,
          scaleX: sx * 0.6,
          scaleY: sy * 1.2,
          y: p.y - 30,
          duration: 800,
          ease: "Sine.easeIn"
        });
      }
    });

    // 3) volutes de fumée qui montent
    for (let k = 0; k < 22; k++) {
      const fx = p.x + Phaser.Math.Between(-60, 60);
      const fy = p.y - Phaser.Math.Between(10, haut * 0.85);
      const couleur = Phaser.Utils.Array.GetRandom([0x2a1838, 0x4a2a66, 0x7a5a9a, 0x1a1024]);
      const fumee = this.add
        .circle(fx, fy, Phaser.Math.Between(10, 26), couleur, 0)
        .setDepth(2.5);
      this.elements.push(fumee);
      this.tweens.add({
        targets: fumee,
        alpha: { from: 0.7, to: 0 },
        scale: { from: 0.6, to: 2.2 },
        y: fy - Phaser.Math.Between(60, 140),
        x: fx + Phaser.Math.Between(-40, 40),
        duration: Phaser.Math.Between(700, 1300),
        delay: Phaser.Math.Between(250, 850),
        ease: "Sine.easeOut"
      });
    }
  }

  // texte entièrement affiché : petite flèche qui clignote pour dire "clique"
  finirTexte() {
    this.fini = true;
    const fleche = this.add
      .text(this.game.config.width / 2 + 570, 680, "▼", {
        fontFamily: POLICE,
        fontSize: "24px",
        color: "#e0a83a"
      })
      .setOrigin(1, 1)
      .setDepth(4);
    this.tweens.add({ targets: fleche, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
    this.elements.push(fleche);
  }

  // clic : 1er clic = affiche tout le texte, 2e clic = écran suivant
  avancer() {
    if (this.enTransition) return;
    if (!this.fini) {
      if (this.timer) this.timer.remove();
      this.texteObj.setText(this.texteComplet);
      this.finirTexte();
      return;
    }
    this.index++;
    if (this.index >= this.slides.length) this.terminer();
    else this.afficher();
  }

  // fin de la séquence : on lance la scène suivante
  terminer() {
    if (this.enTransition) return;
    this.enTransition = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start(this.suite, this.suiteData);
    });
  }
}
