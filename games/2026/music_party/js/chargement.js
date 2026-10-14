import { PERSOS } from "./persos.js";
import { JEUX } from "./jeux.js";

// Scène de chargement : on charge TOUTES les images et la musique une seule
// fois, puis on crée les animations.
// Ensuite on passe à l'écran titre.
export default class chargement extends Phaser.Scene {
  constructor() {
    super({ key: "chargement" });
  }

  preload() {
    // comme dans le template : les chemins sont relatifs à la page du jeu
    this.load.setBaseURL(this.sys.game.config.baseURL);


    // fonds et logo (dossier "Logo et son background" + document Idées)
    this.load.image("img_fond_accueil", "./assets/images/fond_accueil.jpg");
    this.load.image("img_fond_scene", "./assets/images/fond_scene.jpg");

    // Écran de sélection des jeux : titre, cadre doré et vignettes
    this.load.image("img_choisis_jeu", "./assets/images/choisis_jeu.png");
    this.load.image("img_cadre_jeu", "./assets/images/cadre_jeu.png");
    JEUX.forEach((jeu) => {
      if (jeu.apercu) this.load.image(jeu.apercu, "./assets/images/apercu_" + jeu.cle + ".png");
    });

    // Les persos
    PERSOS.forEach((perso) => {
      var planche = { carmen: [184, 252], figaro: [176, 252] }[perso.cle];
      if (perso.fin) this.load.spritesheet(perso.fin.texture, "./assets/images/" + perso.fin.fichier, { frameWidth: perso.fin.taille[0], frameHeight: perso.fin.taille[1] });      else this.load.image(perso.texture, "./assets/images/" + perso.cle + ".png");
      this.load.image(perso.tete, "./assets/images/tete_" + perso.cle + ".png");
      this.load.spritesheet(perso.marche, "./assets/images/marche_" + perso.cle + ".png", { frameWidth: perso.tailleMarche[0], frameHeight: perso.tailleMarche[1] });
      this.load.spritesheet("img_grand_" + perso.cle, "./assets/images/grand_" + perso.cle + ".png", { frameWidth: 288, frameHeight: 360 });
      this.load.image("img_portrait_" + perso.cle, "./assets/images/portrait_" + perso.cle + ".jpg");
      this.load.image("img_portrait_nb_" + perso.cle, "./assets/images/portrait_" + perso.cle + "_nb.jpg");
      this.load.image("img_nom_" + perso.cle, "./assets/images/nom_" + perso.cle + ".png");
    });

    // Page de choix des persos
    this.load.image("img_fond_choix", "./assets/images/fond_choix.jpg");
    this.load.image("img_choisis", "./assets/images/choisis.png");
    this.load.image("img_zone_texte", "./assets/images/zone_texte.png");
    this.load.image("img_fleche_gauche", "./assets/images/fleche_gauche.png");
    this.load.image("img_fleche_droite", "./assets/images/fleche_droite.png");
    this.load.image("img_cadre", "./assets/images/cadre.png");
    this.load.image("img_cadre_choisi", "./assets/images/cadre_choisi.png");

    // Petites images des jeux (à la place de l'ancien textures.js)
    this.load.image("img_vie", "./assets/images/vie.png");
    this.load.image("img_etoile", "./assets/images/etoile.png");
    this.load.image("img_note", "./assets/images/note.png");
    this.load.image("img_page", "./assets/images/page.png");
    this.load.image("img_rideau", "./assets/images/rideau.png");

    // Music Fall : persos du pack Sunny Land
    // renard : repos 0-3, course 4-9, saut 10, music_fall 11, blessé 12-13
    this.load.spritesheet("img_renard", "./assets/images/renard.png", { frameWidth: 33, frameHeight: 32 });
    this.load.spritesheet("img_renard2", "./assets/images/renard_j2.png", { frameWidth: 33, frameHeight: 32 });
    this.load.spritesheet("img_grenouille", "./assets/images/grenouille.png", { frameWidth: 35, frameHeight: 32 });
    this.load.image("img_tete_renard", "./assets/images/tete_renard.png");
    this.load.image("img_tete_renard2", "./assets/images/tete_renard2.png");
    this.load.image("img_touche_note", "./assets/images/touche_note.png");

    // Memory Song : le décor, le saxophone et ses six touches.
    this.load.image("img_fond_opera", "./assets/images/fond_opera.jpg");
    this.load.image("img_saxo", "./assets/images/saxo.png");
    for (var i = 1; i <= 6; i++) {
      this.load.image("img_touche" + i, "./assets/images/touche" + i + ".png");
    }

    // musique de fond (pack SunnyLand Music)
    this.load.audio("musique", "./assets/sons/musique.ogg");
  }

  create() {
    // animations des persos : marche (Piano Time) et grande planche (page de choix)
    PERSOS.forEach((perso) => {
      this.anims.create({ key: perso.animMarche, frames: this.anims.generateFrameNumbers(perso.marche, { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
      this.anims.create({ key: "anim_grand_" + perso.cle, frames: this.anims.generateFrameNumbers("img_grand_" + perso.cle, { start: 0, end: 3 }), frameRate: 5, repeat: -1 });
    });

    // les persos Sunny Land sont en pixel art tout petit : quand on les
    // agrandit, on garde des pixels nets au lieu de les flouter
    ["img_renard", "img_renard2", "img_grenouille"].forEach((cle) =>
      this.textures.get(cle).setFilter(Phaser.Textures.FilterMode.NEAREST)
    );
    [
      ["anim_renard_repos", "img_renard", 8],
      ["anim_renard2_repos", "img_renard2", 8],
      ["anim_grenouille_repos", "img_grenouille", 6]
    ].forEach(([cle, texture, vitesse]) => {
      this.anims.create({
        key: cle,
        frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 3 }),
        frameRate: vitesse,
        repeat: -1
      });
    });

    // valeurs par défaut (Carmen est le 1er perso du document Idées)
    this.registry.set("jeu", "music_fall");
    this.registry.set("mode", "solo");
    this.registry.set("perso1", "carmen");
    this.registry.set("perso2", "figaro");
    this.scene.start("accueil");
  }
}