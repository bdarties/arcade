import * as fct from "./fonctions.js";

export default class toit extends Phaser.Scene {
  constructor() {
    super({ key: "toit" });
  }

  // reçoit { depuis: "precedent" | "suivant" } pour savoir où placer le joueur
  init(data) {
    this.depuis = data.depuis;
  }

  preload() {
    fct.chargerPerso(this);
  }

  create() {
    this.add.image(0, 0, "img_ciel").setOrigin(0, 0).setDisplaySize(1280, 720);

    // sol
    this.groupe_plateformes = this.physics.add.staticGroup();
    this.groupe_plateformes.create(200, 584, "img_plateforme");
    this.groupe_plateformes.create(600, 584, "img_plateforme");
    this.groupe_plateformes.create(1000, 584, "img_plateforme");
    this.groupe_plateformes.create(1200, 584, "img_plateforme");

    this.add.text(400, 100, "Niveau 2 : Toit", {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: "22pt"
    });

    // porte vers le niveau précédent
    this.porte_precedent = this.physics.add.staticSprite(60, 548, "img_porte2");

    // porte vers le niveau suivant
    this.porte_suivant = this.physics.add.staticSprite(1220, 548, "img_porte1");

    // joueur : à droite s'il revient du niveau suivant, sinon à gauche
    const departX = this.depuis === "suivant" ? 1120 : 100;
    fct.creerAnimsPerso(this);
    this.player = this.physics.add.sprite(departX, 450, "img_perso");
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.clavier = this.input.keyboard.createCursorKeys();
    this.physics.add.collider(this.player, this.groupe_plateformes);
  }

  update() {
    fct.deplacerPerso(this.player, this.clavier, this.player.body.touching.down);
    if (this.clavier.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330);
    }

    if (Phaser.Input.Keyboard.JustDown(this.clavier.space)) {
      if (this.physics.overlap(this.player, this.porte_precedent)) {
        this.scene.start("exterieur", { depuis: "suivant" });
      }
      if (this.physics.overlap(this.player, this.porte_suivant)) {
        this.scene.start("backstage", { depuis: "precedent" });
      }
    }
  }
}
