// ============================================================================
//  js/niveau3.js — NIVEAU 3 : LA GRANDE SCÈNE (boss) — PAS ENCORE FAIT
//
//  Ce fichier est encore le MODÈLE du gabarit (une petite scène de test avec un personnage
//  qui marche). Il sera remplacé par le vrai niveau 3 et le boss (voir la fiche de conception).
//  ATTENTION : update() ouvre la scène « selection », qui a été supprimée : ce modèle ne doit
//  pas être lancé tel quel.
// ============================================================================

// La classe de la scène du niveau 3 : Phaser la crée à partir de ce modèle
export default class niveau3 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "niveau3" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }

  // preload : charge les images et la carte AVANT de créer la scène
  preload() {
    if (!this.textures.exists("ts_plateformes")) { // si l'image des tuiles n'est pas encore chargée
      this.load.image("ts_plateformes", "assets/plateformes-coulisses-grid-50.png"); // on la charge ici
    }
    this.load.spritesheet("cantatrice", "assets/cantatrice.png", { // la planche d'images de la Cantatrice
      frameWidth: 64, // une image fait 64 pixels de large
      frameHeight: 64 // et 64 pixels de haut
    });
    this.load.tilemapTiledJSON("carte", "assets/map3.json"); // la carte Tiled de ce niveau (fichier pas encore fait)
  };

  // create : construit la scène une fois (décor, personnage, animations)
  create() {
    this.groupe_plateformes = this.physics.add.staticGroup(); // un groupe de plateformes qui ne bougent pas
    this.groupe_plateformes.create(200, 584, "img_plateforme"); // une plateforme (le sol, à gauche)
    this.groupe_plateformes.create(600, 584, "img_plateforme"); // une deuxième plateforme (le sol, à droite)

    const carteDuNiveau = this.add.tilemap("carte"); // on lit la carte Tiled chargée dans preload

    const tileset = carteDuNiveau.addTilesetImage(
    "tuiles_de_jeu", // le nom du jeu de tuiles dans Tiled
    "Phaser_tuilesdejeu", // la clé de l'image chargée (ici, cette clé n'est pas chargée : à corriger)
    );

    // chargement du calque calque_background
    const calque_background = carteDuNiveau.createLayer( // un calque = une couche de tuiles de la carte
      "calque_background", // le nom du calque dans Tiled
      tileset, // avec quel jeu de tuiles le dessiner
    );

    // chargement du calque calque_background_2
    const calque_background_2 = carteDuNiveau.createLayer(
      "calque_background_2",
      tileset,
    );

    // chargement du calque calque_plateformes
    const calque_plateformes = carteDuNiveau.createLayer(
      "calque_plateformes",
      tileset,
    );

    this.player = this.physics.add.sprite(100, 450, "cantatrice"); // le personnage, posé au point (100, 450)
    this.player.setCollideWorldBounds(true); // il ne sort pas de l'écran
    this.clavier = this.input.keyboard.createCursorKeys(); // les flèches du clavier
    this.physics.add.collider(this.player, this.groupe_plateformes); // il marche sur les plateformes

    // La même petite porte dorée du tileset que dans le niveau 1 (72 × 76 px).
    const texturePorte = this.textures.get("ts_plateformes"); // l'image des tuiles
    if (!texturePorte.has("porte_fermee")) {
      texturePorte.add("porte_fermee", 0, 480, 312, 72, 76); // la porte fermée, découpée dans l'image
    }
    const plateformeSortie = this.groupe_plateformes.getChildren().find((sol) => 100 >= sol.body.left && 100 <= sol.body.right); // la plateforme sous la porte
    const solY = plateformeSortie ? plateformeSortie.body.top : 588; // la hauteur du sol sous la porte
    this.porte_retour = this.physics.add.staticSprite(100, solY - 38, "ts_plateformes", "porte_fermee"); // la porte de retour


    // animation « repos » : les images 0 à 3, en boucle
    this.anims.create({
      key: "cantatrice_repos",
      frames: this.anims.generateFrameNumbers("cantatrice", {
        start: 0,
        end: 3,
      }),
      frameRate: 6, // 6 images par seconde
      repeat: -1, // -1 = en boucle sans fin
    });

    // animation « marche à gauche » : les images 6 à 11
    this.anims.create({
      key: "cantatrice_gauche",
      frames: this.anims.generateFrameNumbers("cantatrice", {
        start: 6,
        end: 11,
      }),
      frameRate: 10, // 10 images par seconde
      repeat: -1,
    });

    // animation « marche à droite » : les images 12 à 17
    this.anims.create({
      key: "cantatrice_droite",
      frames: this.anims.generateFrameNumbers("cantatrice", {
        start: 12,
        end: 17,
      }),
      frameRate: 10,
      repeat: -1,
    });
  }

  // update : appelée à chaque image, lit le clavier et fait bouger le personnage
  update() {
    if (this.clavier.left.isDown) {
      this.player.setVelocityX(-160); // on va à gauche
      this.player.anims.play("anim_tourne_gauche", true); // (animation pas encore créée dans ce fichier)
    } else if (this.clavier.right.isDown) {
      this.player.setVelocityX(160); // on va à droite
      this.player.anims.play("anim_tourne_droite", true); // (animation pas encore créée dans ce fichier)
    } else {
      this.player.setVelocityX(0); // on ne bouge pas
      this.player.anims.play("cantatrice_repos"); // animation de repos
    }
    if (this.clavier.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330); // saut, seulement si le personnage touche le sol
    }

    if (Phaser.Input.Keyboard.JustDown(this.clavier.space) == true) { // espace, une seule fois par appui
      if (this.physics.overlap(this.player, this.porte_retour)) { // si le personnage est sur la porte
        console.log("niveau 3 : retour vers selection"); // message dans la console (test)
        this.scene.switch("selection"); // ouvre la scène « selection » (supprimée : à remplacer)
      }
    }
  }
}
