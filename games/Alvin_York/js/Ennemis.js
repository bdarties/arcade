// Ennemi1.js
export class Ennemi1 extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'ennemi_run');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Caractéristiques de l'ennemi basique
    this.vie = 1;
    this.vitesse = 50;
    this.degats = 10;
    this.type = 'basic';
    
    this.setCollideWorldBounds(true);
    this.setBounce(1);
    this.setVelocityX(Phaser.Math.Between(-this.vitesse, this.vitesse));
  }
  
  update() {
    // Comportement basique
    if (Math.abs(this.body.velocity.x) < 10) {
      this.setVelocityX(Phaser.Math.Between(-this.vitesse, this.vitesse));
    }
  }
}

// Ennemi2.js - Tank (lent mais résistant)
export class Ennemi2 extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'ennemi2_run');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Caractéristiques du tank
    this.vie = 5;
    this.vitesse = 20;
    this.degats = 30;
    this.type = 'tank';
    
    this.setScale(1.5);
    this.setTint(0xff0000);
    this.setCollideWorldBounds(true);
    this.setBounce(0.8);
    this.setVelocityX(Phaser.Math.Between(-this.vitesse, this.vitesse));
  }
  
  update() {
    // Comportement plus agressif
    // Peut suivre le joueur si proche
  }
}

// Ennemi3.js - Scout (rapide mais fragile)
export class Ennemi3 extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'ennemi3_run');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Caractéristiques du scout
    this.vie = 1;
    this.vitesse = 100;
    this.degats = 5;
    this.type = 'scout';
    
    this.setScale(0.7);
    this.setTint(0x00ff00);
    this.setCollideWorldBounds(true);
    this.setBounce(1.2);
    this.setVelocityX(Phaser.Math.Between(-this.vitesse, this.vitesse));
    this.setVelocityY(Phaser.Math.Between(-this.vitesse/2, this.vitesse/2));
  }
  
  update() {
    // Mouvement erratique
    if (Phaser.Math.Between(0, 100) < 2) {
      this.setVelocity(
        Phaser.Math.Between(-this.vitesse, this.vitesse),
        Phaser.Math.Between(-this.vitesse/2, this.vitesse/2)
      );
    }
  }
}