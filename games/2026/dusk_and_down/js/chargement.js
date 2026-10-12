import { rendreNet, creerAnimations } from "./systemes/textures.js";
import { ECRAN, POLICE_TITRE, POLICE_TEXTE } from "./reglages/config.js";

const DECORS = [
  "arbre_mort_1", "arbre_mort_2", "arbre_sombre_1", "arbre_sombre_2", "tronc", "souche",
  "ruine_1", "ruine_2", "ruine_3", "ruine_4", "rocher_1", "rocher_2", "rocher_3",
  "os_1", "os_2", "os_3", "os_4", "ronces_1", "ronces_2", "bras_1", "bras_2", "bras_3",
  "buisson", "cristal", "cranes", "porte_crane", "roi_dechu",
  "tombe_1", "tombe_2", "tombe_3", "tombe_4", "tombe_5"
];

const LUMIERES = ["lumiere", "braise", "fumee", "vignette"];

const SONS = ["epee", "musique_menu", "musique_jeu", "musique_fin"];

export default class chargement extends Phaser.Scene {
  constructor() {
    super({ key: "chargement" });
  }

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    const barre = this.add.rectangle(ECRAN.largeur / 2 - 200, ECRAN.hauteur / 2, 0, 6, 0xffc94a).setOrigin(0, 0.5);
    this.add.text(ECRAN.largeur / 2, ECRAN.hauteur / 2 - 30, "L'aube se prépare…", { fontFamily: POLICE_TEXTE, fontSize: "22px", color: "#f3e9d2" }).setOrigin(0.5);
    this.load.on("progress", (valeur) => barre.setSize(400 * valeur, 6));

    const dossierPolices = (baseURL ? baseURL + "/" : "") + "assets/polices/";
    const cormorant = new FontFace(POLICE_TITRE, "url(" + dossierPolices + "cormorant-sc-bold.ttf)", { weight: "bold" });
    const lora = new FontFace(POLICE_TEXTE, "url(" + dossierPolices + "lora-regular.ttf)");
    document.fonts.add(cormorant);
    document.fonts.add(lora);
    this.polices = [cormorant.load(), lora.load()];

    this.load.spritesheet("chevalier_j1", "./assets/personnages/chevalier_j1.png", { frameWidth: 112, frameHeight: 48 });
    this.load.spritesheet("chevalier_j2", "./assets/personnages/chevalier_j2.png", { frameWidth: 112, frameHeight: 48 });

    this.load.spritesheet("rampant", "./assets/ennemis/rampant.png", { frameWidth: 112, frameHeight: 56 });

    this.load.spritesheet("colonne_sacree", "./assets/effets/colonne_sacree.png", { frameWidth: 96, frameHeight: 96 });

    for (const lumiere of LUMIERES) {
      this.load.image("img_" + lumiere, "./assets/lumieres/" + lumiere + ".png");
    }

    this.load.spritesheet("flamme", "./assets/temple/flamme.png", { frameWidth: 44, frameHeight: 76 });
    this.load.spritesheet("bougie", "./assets/temple/bougie.png", { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet("torche", "./assets/temple/torche.png", { frameWidth: 32, frameHeight: 32 });
    this.load.image("autel", "./assets/temple/autel.png");
    this.load.image("statue", "./assets/temple/statue.png");

    this.load.tilemapTiledJSON("carte", "./assets/carte/carte.json");
    this.load.image("sol_tuiles", "./assets/sol/sol_tuiles.png");
    this.load.image("parvis_iso", "./assets/sol/parvis_iso.png");
    for (let i = 1; i <= 3; i++) {
      this.load.image("paves_" + i, "./assets/sol/paves_" + i + ".png");
    }
    for (const decor of DECORS) {
      this.load.image(decor, "./assets/decor/" + decor + ".png");
    }
    this.load.spritesheet("arbre_anime", "./assets/decor/arbre_anime.png", { frameWidth: 160, frameHeight: 192 });
    this.load.spritesheet("trone_liche", "./assets/decor/trone_liche.png", { frameWidth: 192, frameHeight: 224 });

    this.load.image("menu_fond", "./assets/interface/menu_fond.jpg");
    for (const barre of ["temple", "joueur_1", "joueur_2"]) {
      this.load.image(barre + "_cadre", "./assets/interface/" + barre + "_cadre.png");
      this.load.image(barre + "_remplissage", "./assets/interface/" + barre + "_remplissage.png");
    }

    for (const son of SONS) {
      this.load.audio(son, "./assets/sons/" + son + ".mp3");
    }
  }

  create() {
    rendreNet(this);
    creerAnimations(this);
    Promise.all(this.polices)
      .catch(() => null)
      .then(() => this.scene.start("menu"));
  }
}
