import { PERSOS } from "./persos.js";
import { JEUX } from "./jeux.js";

// Scène de chargement : on charge TOUTES les images et la musique une seule
// fois, puis on crée les animations. Ensuite on passe à l'écran titre.
export default class chargement extends Phaser.Scene {
  constructor() {
    super({ key: "chargement" });
  }

  preload() {
    // les chemins sont relatifs à la page du jeu
    this.load.setBaseURL(this.sys.game.config.baseURL);

    // fonds
    this.load.image("img_fond_accueil", "./assets/images/fond_accueil.jpg");
    this.load.image("img_fond_scene", "./assets/images/fond_scene.jpg");

    // écran de sélection des jeux : titre, cadre doré et vignettes
    this.load.image("img_choisis_jeu", "./assets/images/choisis_jeu.png");
    this.load.image("img_cadre_jeu", "./assets/images/cadre_jeu.png");
    JEUX.forEach((jeu) => {
      this.load.image(jeu.apercu, "./assets/images/" + jeu.apercu + ".png");
    });

    // les persos : planche d'animation (fin), tête, marche, grande planche, portrait, nom
    PERSOS.forEach((perso) => {
      var fin = perso.fin;
      this.load.spritesheet(perso.texture, "./assets/images/" + fin.fichier, { frameWidth: fin.taille[0], frameHeight: fin.taille[1] });
      this.load.image(perso.tete, "./assets/images/tete_" + perso.cle + ".png");
      this.load.spritesheet(perso.marche, "./assets/images/marche_" + perso.cle + ".png", { frameWidth: perso.tailleMarche[0], frameHeight: perso.tailleMarche[1] });
      this.load.spritesheet("img_grand_" + perso.cle, "./assets/images/grand_" + perso.cle + ".png", { frameWidth: 288, frameHeight: 360 });
      this.load.image("img_portrait_" + perso.cle, "./assets/images/portrait_" + perso.cle + ".jpg");
      this.load.image("img_portrait_nb_" + perso.cle, "./assets/images/portrait_" + perso.cle + "_nb.jpg");
      this.load.image("img_nom_" + perso.cle, "./assets/images/nom_" + perso.cle + ".png");
    });

    // page de choix des persos
    this.load.image("img_fond_choix", "./assets/images/fond_choix.jpg");
    this.load.image("img_choisis", "./assets/images/choisis.png");
    this.load.image("img_zone_texte", "./assets/images/zone_texte.png");
    this.load.image("img_fleche_gauche", "./assets/images/fleche_gauche.png");
    this.load.image("img_fleche_droite", "./assets/images/fleche_droite.png");
    this.load.image("img_cadre", "./assets/images/cadre.png");
    this.load.image("img_cadre_choisi", "./assets/images/cadre_choisi.png");

    // petites images des jeux
    this.load.image("img_vie", "./assets/images/vie.png");
    this.load.image("img_etoile", "./assets/images/etoile.png");
    this.load.image("img_note", "./assets/images/note.png");
    this.load.image("img_page", "./assets/images/page.png");
    this.load.image("img_rideau", "./assets/images/rideau.png");

    // Piano Time : la tuile qui descend dans chaque couloir
    this.load.image("img_touche_note", "./assets/images/touche_note.png");

    // Memory Song : le décor, le saxophone, ses six touches, le bandeau du titre et ses 6 notes
    this.load.image("img_fond_opera", "./assets/images/fond_opera.jpg");
    this.load.image("img_saxo", "./assets/images/saxo.png");
    this.load.image("ui_bandeau", "./assets/images/ui_bandeau.png");
    for (var i = 1; i <= 6; i++) {
      this.load.image("img_touche" + i, "./assets/images/touche" + i + ".png");
    }
    [60, 62, 64, 67, 69, 72].forEach((note) => {
      this.load.audio("saxo_" + note, "./assets/sons/saxo_" + note + ".wav");
    });

    // musique de fond
    this.load.audio("musique", "./assets/sons/musique.ogg");
  }

  create() {
    PERSOS.forEach((perso) => {
      // marche (Piano Time) et grande planche (page de choix)
      this.anims.create({ key: perso.animMarche, frames: this.anims.generateFrameNumbers(perso.marche, { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
      this.anims.create({ key: "anim_grand_" + perso.cle, frames: this.anims.generateFrameNumbers("img_grand_" + perso.cle, { start: 0, end: 3 }), frameRate: 5, repeat: -1 });

      // planche de l'écran des résultats (le perso qui s'anime)
      this.anims.create({
        key: perso.fin.anim,
        frames: this.anims.generateFrameNumbers(perso.texture, { start: 0, end: perso.fin.images - 1 }),
        frameRate: perso.fin.vitesse,
        repeat: -1
      });
    });

    // valeurs par défaut
    this.registry.set("jeu", "music_fall");
    this.registry.set("mode", "solo");
    this.registry.set("perso1", "carmen");
    this.registry.set("perso2", "figaro");
    this.scene.start("accueil");
  }
}
