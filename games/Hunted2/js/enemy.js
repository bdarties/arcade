export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "enemy_1_run");

    this.scene = scene;

    // Ajout à la scène et physique
    scene.add.existing(this);
    scene.physics.world.enable(this);


this.setCollideWorldBounds(true);
    this.setDepth(10);

    // Propriétés de déplacement
    this.speed = 80;
    this.direction = Phaser.Math.Between(0, 1) === 0 ? -1 : 1; // Direction aléatoire au départ
    this.changeDirectionTimer = 0;
    this.changeDirectionDelay = Phaser.Math.Between(2000, 5000); // Change de direction toutes les 2-5 secondes
  }

  update(time) {
    // Animer l'ennemi
    this.anims.play("anim_enemy_1_run", true);

    // Déplacement
    this.setVelocityX(this.speed * this.direction);
    this.setFlipX(this.direction === -1);

    // Inverser si bloqué par un mur
    if (this.body.blocked.right) {
      this.direction = -1;
      this.changeDirectionTimer = time;
      this.changeDirectionDelay = Phaser.Math.Between(2000, 5000);
    }
    if (this.body.blocked.left) {
      this.direction = 1;
      this.changeDirectionTimer = time;
      this.changeDirectionDelay = Phaser.Math.Between(2000, 5000);
    }

    // Changer de direction aléatoirement
    if (time - this.changeDirectionTimer > this.changeDirectionDelay) {
      this.direction *= -1; // Inverser la direction
      this.changeDirectionTimer = time;
      this.changeDirectionDelay = Phaser.Math.Between(2000, 5000);
    }
  }
}