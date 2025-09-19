// Déclaration d'une nouvelle scène "niveau3" qui hérite de Phaser.Scene
export default class niveau3 extends Phaser.Scene {
  // Constructeur de la classe
  constructor() {
    super({
      key: "niveau3" // identifiant unique de la scène
    });
  }

  // Fonction de préchargement (vide ici, mais on pourrait charger des assets spécifiques au niveau)
  preload() {}

  // Fonction appelée une seule fois au lancement du niveau
  create() {
    // Ajout de l'image de fond (ciel)
    this.add.image(400, 300, "img_ciel");

    // Groupe statique de plateformes (elles ne bougent pas)
    this.groupe_plateformes = this.physics.add.staticGroup();

    // Première plateforme en bas à gauche
    this.groupe_plateformes.create(200, 584, "img_plateforme");

    // Deuxième plateforme en bas à droite
    this.groupe_plateformes.create(600, 584, "img_plateforme");

    // Ajout d'un texte distinctif pour afficher le nom du niveau
    this.add.text(400, 100, "Vous êtes dans le niveau 3", {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: "22pt"
    });

    // Ajout d'une porte pour retourner à la scène "selection"
    this.porte_retour = this.physics.add.staticSprite(100, 550, "img_porte3");

    // Création du joueur (sprite avec physique activée)
    this.player = this.physics.add.sprite(100, 450, "img_perso");

    // Mise à jour du corps physique
    this.player.refreshBody();

    // Ajoute un rebond léger au joueur
    this.player.setBounce(0.2);

    // Empêche le joueur de sortir de la zone de jeu
    this.player.setCollideWorldBounds(true);

    // Activation des touches clavier (flèches directionnelles + espace)
    this.clavier = this.input.keyboard.createCursorKeys();

    // Collision entre le joueur et les plateformes
    this.physics.add.collider(this.player, this.groupe_plateformes);
  }

  // Fonction exécutée à chaque frame → logique du gameplay
  update() {
    // --- Déplacement horizontal ---
    if (this.clavier.left.isDown) {
      // Déplacement vers la gauche
      this.player.setVelocityX(-160);
      this.player.anims.play("anim_tourne_gauche", true);
    } else if (this.clavier.right.isDown) {
      // Déplacement vers la droite
      this.player.setVelocityX(160);
      this.player.anims.play("anim_tourne_droite", true);
    } else {
      // Pas de touche → le joueur s'arrête
      this.player.setVelocityX(0);
      this.player.anims.play("anim_face");
    }

    // --- Saut ---
    if (this.clavier.up.isDown && this.player.body.touching.down) {
      // Le joueur peut sauter uniquement s'il est au sol
      this.player.setVelocityY(-330);
    }

    // --- Interaction avec la porte ---
    if (Phaser.Input.Keyboard.JustDown(this.clavier.space) == true) {
      // Vérifie si le joueur est en contact avec la porte
      if (this.physics.overlap(this.player, this.porte_retour)) {
        // Message pour debug dans la console
        console.log("niveau 3 : retour vers selection");
        // Retour à la scène "selection"
        this.scene.switch("selection");
      }
    }
  }
}
