import niveau1 from "./niveau1.js";


// niveau2 réutilise tout le code de niveau1 (joueurs, caméras, HUD, clés, tirs...)
// et ne redéfinit que ce qui change : la carte, les ennemis et les points d'apparition.
export default class niveau2 extends niveau1 {
  constructor() {
    super("niveau2");
  }

  parametres_niveau() {
    const cfg = super.parametres_niveau(); // on part des réglages du niveau 1...
    return {
      ...cfg, // ...et on remplace seulement ce qui est différent
      carte_cle: "carte2",
      carte_fichier: "./assets/map/niveau_2.json",
      tileset_nom: "tileset_reverse",       // nom du tileset DANS Tiled (à vérifier dans niveau_2.json, champ "name" de "tilesets")
      tileset_image: "Phaser_tuileReverse", // clé de l'image chargée dans preload() ci-dessous

      // les spawns sont lus dans le calque d'objets "calque_spawn" de la carte Tiled (voir la console pour vérifier)
      spawn_depuis_tiled: true,
      player_spawn: cfg.player_spawn,
      player2_spawn: cfg.player2_spawn,
      tableau_spawn: cfg.tableau_spawn,
      porte_spawn: cfg.porte_spawn, //remplacé par le point "porte" du calque_spawn s'il existe

      ennemis: [{
        nom: "renard",
        texture: "renard",
        animation: "animation_renard_marche",
        animation_attaque: "animation_renard_attaque",
        comportement: "rodeur",   // se balade, n'attaque que si un joueur est dans son rayon
        rayon_detection: 70,      // en pixels : distance à partir de laquelle il attaque (et portée de son coup)
        vitesse: 45,              // vitesse de balade
        delai_impact: 500,        // ms entre le début de l'attaque et le moment où le coup touche
        duree_attaque: 850,       // ms : durée totale de l'attaque (10 images à 12 img/s = ~830 ms)
        degats_au_contact: false, // le simple contact ne blesse pas, seule l'attaque blesse
        points_vies: 3,
        degats: 1,
        score: 150
      }],
      niveau_suivant: "Ecran_score"
    };
  }

  preload() {
    super.preload(); // charge tout ce que charge le niveau 1 (la carte 2 grâce à parametres_niveau)
    this.load.image("Phaser_tuileReverse", "./assets/map/tileset_reverse.png");
    this.load.spritesheet("renard_statique", "./assets/enemies/renard.png", {
      frameWidth: 48,
      frameHeight: 70
    });
    this.load.spritesheet("renard", "./assets/enemies/renard.png", {
      frameWidth: 48,
      frameHeight: 70
    });
    this.load.spritesheet("renard_attaque", "./assets/enemies/renard_attaque.png", {
      frameWidth: 100,
      frameHeight: 70
    });
  }

  create() {
    if (!this.anims.exists("animation_renard_standing")) {
      this.anims.create({
        key: "animation_renard_standing",
        frames: this.anims.generateFrameNumbers("renard_statique", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1

      });
    }
    if (!this.anims.exists("animation_renard_marche")) {
      this.anims.create({
        key: "animation_renard_marche",
        frames: this.anims.generateFrameNumbers("renard", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });
    }
    if (!this.anims.exists("animation_renard_attaque")) {
      this.anims.create({
        key: "animation_renard_attaque",
        frames: this.anims.generateFrameNumbers("renard_attaque", { start: 0, end: 9 }),
        frameRate: 12,
        repeat: 0
      });
    }
    super.create();
  }
}