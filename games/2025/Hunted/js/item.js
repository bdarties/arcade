export default class Item extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, itemId = null) {
    super(scene, x, y, texture);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setOrigin(0.5, 0.5); // Changé pour centrer l'objet
    
    // IMPORTANT : Désactiver la gravité et rendre l'objet immobile
    this.body.allowGravity = false;
    this.setImmovable(true);
    
    // Ajuster la taille du body pour la collision
    this.body.setSize(this.width * 0.8, this.height * 0.8);
    
    // Stocker la position de départ pour l'animation
    this.positionInitialeY = y;
    this.flotteOffset = 0;
    
    this.itemId = itemId; // ID de l'objet pour le HUD
    
    // Animation de flottement avec mise à jour du body
    this.flotteAnimation = scene.tweens.add({
      targets: this,
      flotteOffset: 5, // Amplitude du flottement
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }
  
  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    
    // Mettre à jour la position Y en fonction de l'animation
    this.y = this.positionInitialeY - this.flotteOffset;
    
    // Forcer le body à rester immobile (bloquer toute vélocité)
    this.body.setVelocity(0, 0);
  }
  
  ramasser(callback) {
    // Arrêter l'animation de flottement
    if (this.flotteAnimation) {
      this.flotteAnimation.stop();
    }
    
    // Animation de disparition
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 1.5,
      y: this.y - 30, // Monte en disparaissant
      duration: 300,
      ease: 'Back.easeIn',
      onComplete: () => {
        if (callback) callback(this.itemId);
        this.destroy();
      }
    });
  }
}