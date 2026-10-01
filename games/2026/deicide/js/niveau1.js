import * as fct from "./fonctions.js";
import { creerPersonnage, majPersonnage } from "./Personnage/personnage.js";
import { creerHud } from "./Personnage/hud.js";
import * as ennemis from "./ennemis.js";
import * as lumiere from "./lumiere.js";

export default class niveau1 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "niveau1" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }
  preload() {
  }

  create() {
    fct.doNothing();
    fct.doAlsoNothing();

    // la map Tiled : 40 x 200 tuiles de 32 px = 1280 x 6400 px, on part d'en bas
    const carte = this.make.tilemap({ key: "carte_niveau1" });
    // le 1er nom est celui du tileset dans Tiled, le 2e la clé de l'image chargée dans selection.js
    const tuilesDawn = carte.addTilesetImage("dawn_of_the_gods_ombre", "tuiles_dawn");
    const tuileBlanc = carte.addTilesetImage("white", "tuile_blanc");
    const tilesets = [tuilesDawn, tuileBlanc];
    carte.createLayer("Background and background", tilesets);
    carte.createLayer("Background", tilesets);
    const calqueGameplay = carte.createLayer("Gameplay", tilesets);
    // seules les tuiles du calque Gameplay qui ont la propriété "colision" dans Tiled sont solides
    calqueGameplay.setCollisionByProperty({ colision: true });
    // personnage.js arrête les balles sur groupe_plateformes : ici c'est le calque Gameplay
    this.groupe_plateformes = calqueGameplay;

    // le monde et la caméra prennent la taille de la map (sinon le joueur reste bloqué dans le 1er écran)
    this.physics.world.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);
    this.cameras.main.setBounds(0, 0, carte.widthInPixels, carte.heightInPixels);
    this.cameras.main.setBackgroundColor("#3a3a3a");

    // sol du bas de la map : ligne 199, soit y = 6368
    this.porte_retour = this.physics.add.staticSprite(100, 6348, "img_porte1");

    this.player = creerPersonnage(this, 200, 6300);
    this.player.refreshBody();
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.clavier = this.input.keyboard.createCursorKeys();
    this.physics.add.collider(this.player, this.groupe_plateformes);
    // la caméra suit le joueur pendant qu'il monte
    this.cameras.main.startFollow(this.player);
    this.pv = 5; // PV du joueur
    this.hud = creerHud(this, this.player, this.pv); // HUD : barre de vie, vies et jauge de dash

    // tirs du joueur (personnage.js les y range) et ennemis
    this.tirsJoueur = this.physics.add.group({ allowGravity: false });
    this.ennemis = this.physics.add.group();
    this.physics.add.collider(this.ennemis, this.groupe_plateformes);
    // un archer sur chaque point du calque d'objets "archer" de Tiled (le point = ses pieds, on le pose un peu au-dessus et il tombe sur le sol)
    carte.getObjectLayer("archer").objects.forEach(point => ennemis.creerArcher(this, point.x, point.y - 40));
    this.physics.add.overlap(this.tirsJoueur, this.ennemis, (tir, ennemi) => ennemis.toucherEnnemi(this, tir, ennemi));
    this.tirsEnnemis = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.player, this.tirsEnnemis, (joueur, fleche) => {
      fleche.destroy();
      this.blesserJoueur(1, "Abattu par un archer");
    });
    this.physics.add.collider(this.tirsEnnemis, this.groupe_plateformes, (fleche) => fleche.destroy());
    lumiere.creerVoile(this); // voile d'obscurité, créé en dernier
  }

  update() {
    majPersonnage(this.player, this.clavier);
    ennemis.majEnnemis(this);

    if (Phaser.Input.Keyboard.JustDown(this.clavier.space) == true) {
      if (this.physics.overlap(this.player, this.porte_retour)) {
        this.scene.switch("selection");
      }
    }
    lumiere.majVoile(this);
  }

  blesserJoueur(degats, cause) {
    this.pv -= degats;
    this.hud.majPV(this.pv); // met la barre de vie à jour
    console.log(cause);
  }
}
