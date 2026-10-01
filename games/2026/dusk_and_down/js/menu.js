import { ECRAN, ISO, POLICE_TITRE, POLICE_TEXTE } from "./reglages/config.js";
import { creerControles, boutonPresse } from "./reglages/controles.js";
import { initialiserSons, jouerMusique, jouerSon } from "./systemes/sons.js";

export default class menu extends Phaser.Scene {
  constructor() {
    super({ key: "menu" });
  }

  create() {
    const cx = ECRAN.largeur / 2;
    const solY = 480;

    this.add.tileSprite(0, 0, ECRAN.largeur, ECRAN.hauteur, "sol_iso").setOrigin(0);
    this.add.image(cx, solY, "parvis_iso");
    this.add.image(cx, solY, "autel");
    this.add.sprite(cx, solY + 8, "flamme", 0).setOrigin(0.5, 1).setScale(1.8).play("anim_flamme");
    this.add.image(cx, solY - 30, "img_lumiere").setTint(0xffa347).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(520, 340).setAlpha(0.45);
    this.add.particles(cx, solY - 50, "img_braise", {
      speed: { min: 10, max: 45 },
      angle: { min: 250, max: 290 },
      lifespan: 1800,
      scale: { start: 1.3, end: 0 },
      alpha: { start: 1, end: 0 },
      frequency: 90,
      blendMode: "ADD"
    });
    this.add.image(cx - 190, solY + 6, "statue").setOrigin(0.5, 0.95);
    this.add.image(cx + 190, solY + 6, "statue").setOrigin(0.5, 0.95).setFlipX(true);
    for (const [dx, dy] of [[-112, -56], [112, -56], [-112, 56], [112, 56]]) {
      this.add.sprite(cx + dx, solY + dy, "torche", 0).setOrigin(0.5, 0.9).play("anim_torche");
      this.add.image(cx + dx, solY + dy - 20, "img_lumiere").setTint(0xff9a3d).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(90, 60).setAlpha(0.5);
    }
    this.add.sprite(cx - 70, solY + 130, "chevalier_j1", 0).setOrigin(0.5, 0.94).setFlipX(true).play("chevalier_j1_repos");
    this.add.sprite(cx + 70, solY + 130, "chevalier_j2", 0).setOrigin(0.5, 0.94).play("chevalier_j2_repos");
    this.add.sprite(110, 430, "arbre_anime", 0).setOrigin(0.5, 0.92).play("anim_arbre");
    this.add.sprite(1170, 460, "arbre_anime", 0).setOrigin(0.5, 0.92).setFlipX(true).play("anim_arbre");
    this.add.image(cx, 440, "img_vignette").setDisplaySize(1900, 1250);

    this.add
      .text(cx, 78, "DUSK AND DAWN", {
        fontFamily: POLICE_TITRE, fontSize: "74px", color: "#ffe2a8", stroke: "#1a0f05", strokeThickness: 10
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 134, "Le dernier temple de l'aube", { fontFamily: POLICE_TEXTE, fontSize: "24px", fontStyle: "italic", color: "#f0c987" })
      .setOrigin(0.5);
    this.add
      .text(
        cx,
        180,
        "L'Ombre a englouti le monde. Seul brûle encore le Temple de l'Aube.\nLes dieux accordent leurs bienfaits à ses gardiens : tant que la flamme vit, vous renaîtrez.",
        { fontFamily: POLICE_TEXTE, fontSize: "17px", color: "#d8cfbd", align: "center", lineSpacing: 4 }
      )
      .setOrigin(0.5);

    this.options = [
      { texte: "1 JOUEUR", nbJoueurs: 1 },
      { texte: "2 JOUEURS", nbJoueurs: 2 }
    ];
    this.textesOptions = this.options.map((option, i) =>
      this.add
        .text(cx, 262 + i * 50, option.texte, { fontFamily: POLICE_TITRE, fontSize: "34px", color: "#8c8577", stroke: "#000000", strokeThickness: 5 })
        .setOrigin(0.5)
    );
    this.selection = 0;
    this.afficherSelection();

    this.add
      .text(cx, ECRAN.hauteur - 34, "Joystick : choisir    ·    Bouton A : commencer", {
        fontFamily: POLICE_TEXTE, fontSize: "20px", color: "#e8dcc0", stroke: "#000000", strokeThickness: 4
      })
      .setOrigin(0.5);
    this.add
      .text(cx, ECRAN.hauteur - 12, "Assets : Undead Tileset (CraftPix) · Chevalier (Szadi art) · Tiny RPG · Pixel Art Top Down (Cainos) · Catacombs · VFX packs", {
        fontFamily: POLICE_TEXTE, fontSize: "12px", color: "#8a8272"
      })
      .setOrigin(0.5);

    this.input.keyboard.resetKeys();
    this.controlesJ1 = creerControles(this, 1);
    this.controlesJ2 = creerControles(this, 2);
    initialiserSons(this);
    jouerMusique(this, "musique_menu");
    this.cameras.main.fadeIn(800);
  }

  update() {
    if (boutonPresse(this.controlesJ1, this.controlesJ2, "haut")) {
      this.selection = (this.selection + this.options.length - 1) % this.options.length;
      this.afficherSelection();
    }
    if (boutonPresse(this.controlesJ1, this.controlesJ2, "bas")) {
      this.selection = (this.selection + 1) % this.options.length;
      this.afficherSelection();
    }
    if (boutonPresse(this.controlesJ1, this.controlesJ2, "A")) {
      initialiserSons(this);
      jouerSon("choix");
      this.scene.start("jeu", { nbJoueurs: this.options[this.selection].nbJoueurs });
    }
  }

  afficherSelection() {
    jouerSon("curseur");
    this.textesOptions.forEach((texte, i) => {
      const choisi = i === this.selection;
      texte.setColor(choisi ? "#ffe2a8" : "#8c8577");
      texte.setText((choisi ? "✦  " : "") + this.options[i].texte + (choisi ? "  ✦" : ""));
      texte.setScale(choisi ? 1.08 : 1);
    });
  }
}
