// Déclaration d'une nouvelle scène "niveau2" qui hérite de Phaser.Scene
export default class niveau2 extends Phaser.Scene {
  // Constructeur de la classe
  constructor() {
    super({
      key: "niveau2" // identifiant unique de la scène
    });
  }

  // Fonction de préchargement → pourrait servir à charger des assets spécifiques
  preload() {}

  // Fonction appelée une seule fois à la création du niveau
  create() {
    // Ajoute une image de fond (ciel) au centre de l'écran
    this.add.image(400, 300, "img_ciel");

    // Groupe statique de plateformes (elles ne bougent pas)
    this.groupe_plateformes = this.physics.add.staticGroup();

    // Création d'une première plateforme à gauche
    this.groupe_plateformes.create(200, 584, "img_plateforme");

    // Création d'une deuxième plateforme à droite
    this.groupe_plateformes.create(600, 584, "img_plateforme");

    // Ajout d'un texte distinctif du niveau (affiché en haut de l'écran)
    this.add.text(400, 100, "Vous êtes dans le niveau 2", {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: "22pt"
    });

    // Création d'une porte de sortie vers la scène "selection"
    this.porte_retour = this.physics.add.staticSprite(100, 550, "img_porte2");

    // Création du joueur (sprite dynamique soumis à la physique)
    this.player = this.physics.add.sprite(100, 450, "img_perso");

    // Mise à jour du corps physique du joueur
    this.player.refreshBody();

    // Le joueur rebondit légèrement quand il tombe
    this.player.setBounce(0.2);

    // Le joueur ne peut pas sortir des limites du monde
    this.player.setCollideWorldBounds(true);

    // Création des contrôles clavier (flèches directionnelles + espace)
    this.clavier = this.input.keyboard.createCursorKeys();

    // Collision entre le joueur et les plateformes (il peut marcher dessus)
    this.physics.add.collider(this.player, this.groupe_plateformes);
  }

  // Fonction de mise à jour (appelée à chaque frame du jeu)
  update() {
    // --- Gestion du déplacement horizontal ---
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

    // --- Gestion du saut ---
    if (this.clavier.up.isDown && this.player.body.touching.down) {
      // Saut uniquement si le joueur est au sol
      this.player.setVelocityY(-330);
    }

    // --- Interaction avec la porte ---
    // Vérifie si la touche espace vient d’être pressée
    if (Phaser.Input.Keyboard.JustDown(this.clavier.space) == true) {
      // Vérifie si le joueur touche la porte
      if (this.physics.overlap(this.player, this.porte_retour)) {
        // Affiche un message dans la console (utile pour debug)
        console.log("niveau 3 : retour vers selection");

        // Change de scène → retour à "selection"
        this.scene.switch("selection");
      }
    }
  }
}
