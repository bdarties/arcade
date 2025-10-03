export default class Ennemi1 extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'ennemi1');
        
        scene.physics.add.existing(this);
        scene.add.existing(this);
        
        this.pointsVie = 3;
        this.vitesse = 50;
        this.distanceTir = 200; // portée de tir réduite (avant: 400)
        this.cooldownTir = 1500; // 1.5 secondes
        this.dernierTir = 0;
        this.estEnTrainDeTirer = false;
        
        this.setCollideWorldBounds(true);
        
        // Hitbox ajustée pour sprite 64x64
        // Largeur: 32px au milieu, Hauteur: 32px en bas
        this.body.setSize(32, 32); // Largeur: 32px, Hauteur: 32px
        this.body.setOffset(16, 32); // Décalage X: 16px (milieu), Y: 32px (bas)
        
        // Créer les animations si elles n'existent pas
        this.creerAnimations();
        
        // Jouer l'animation idle au début
        this.anims.play('ennemi_idle', true);
        
        // S'assurer que le groupe de flèches existe
        if (!scene.groupeFlechesEnnemis) {
            scene.groupeFlechesEnnemis = scene.physics.add.group();
        }
    }

    creerAnimations() {
        // Animation idle (sprites 0-1)
        if (!this.scene.anims.exists('ennemi_idle')) {
            this.scene.anims.create({
                key: 'ennemi_idle',
                frames: this.scene.anims.generateFrameNumbers('ennemi1', { start: 0, end: 1 }),
                frameRate: 3,
                repeat: -1
            });
        }
        
        // Animation marche (sprites 11-17)
        if (!this.scene.anims.exists('ennemi_marche')) {
            this.scene.anims.create({
                key: 'ennemi_marche',
                frames: this.scene.anims.generateFrameNumbers('ennemi1', { start: 11, end: 16 }),
                frameRate: 10,
                repeat: -1
            });
        }
        
        // Animation tir (sprites 34-44)
        if (!this.scene.anims.exists('ennemi_tir')) {
            this.scene.anims.create({
                key: 'ennemi_tir',
                frames: this.scene.anims.generateFrameNumbers('ennemi1', { start: 34, end: 44 }),
                frameRate: 15,
                repeat: 0 // Ne pas répéter
            });
        }
    }

    update() {
        if (!this.scene.player) return;

        // Si l'ennemi est en train de tirer, ne pas bouger
        if (this.estEnTrainDeTirer) return;

        const distanceJoueur = Phaser.Math.Distance.Between(
            this.x, this.y,
            this.scene.player.x, this.scene.player.y
        );

        // Suivre le joueur seulement si loin
        if (distanceJoueur > 120) { // portée de poursuite réduite (avant: 200)
            this.scene.physics.moveToObject(this, this.scene.player, this.vitesse);
            
            // Animation marche si l'ennemi bouge
            if (this.body.velocity.x !== 0 || this.body.velocity.y !== 0) {
                if (this.anims.currentAnim?.key !== 'ennemi_marche') {
                    this.anims.play('ennemi_marche', true);
                }
                
                // Orientation selon la direction
                if (this.body.velocity.x < 0) {
                    this.setFlipX(true);
                } else if (this.body.velocity.x > 0) {
                    this.setFlipX(false);
                }
            }
        } else {
            this.setVelocity(0, 0);
            // Animation idle si immobile
            if (this.anims.currentAnim?.key !== 'ennemi_idle' && !this.estEnTrainDeTirer) {
                this.anims.play('ennemi_idle', true);
            }
        }
        
        // Tirer si le joueur est à portée
        if (distanceJoueur <= this.distanceTir) {
            this.gererTir();
        }
    }
    
    gererTir() {
        const tempsActuel = this.scene.time.now;
        
        // Vérifier le cooldown et si pas déjà en train de tirer
        if (tempsActuel - this.dernierTir < this.cooldownTir || this.estEnTrainDeTirer) return;
        
        // Vérifier la ligne de vue (pas de mur entre l'ennemi et le joueur)
        if (this.ligneDeVueLibre()) {
            this.commencerTir();
        }
    }
    
    commencerTir() {
        this.estEnTrainDeTirer = true;
        
        // Arrêter le mouvement
        this.setVelocity(0, 0);
        
        // Jouer l'animation de tir
        this.anims.play('ennemi_tir', true);
        
        // Tirer la flèche au milieu de l'animation (frame ~39)
        this.scene.time.delayedCall(300, () => {
            if (this.active) {
                this.tirerFleche();
            }
        });
        
        // Fin du tir quand l'animation est terminée
        this.once('animationcomplete', (animation) => {
            if (animation.key === 'ennemi_tir') {
                this.estEnTrainDeTirer = false;
                this.dernierTir = this.scene.time.now;
                
                // Revenir à l'animation idle
                this.anims.play('ennemi_idle', true);
            }
        });
    }
    
    ligneDeVueLibre() {
        if (!this.scene.calque_plateformes) return true;
        
        // Vérifier plusieurs points le long de la ligne entre l'ennemi et le joueur
        const steps = 8;
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const checkX = this.x + (this.scene.player.x - this.x) * t;
            const checkY = this.y + (this.scene.player.y - this.y) * t;
            
            if (this.scene.calque_plateformes.getTileAtWorldXY(checkX, checkY)) {
                return false;
            }
        }
        
        return true;
    }
    
    tirerFleche() {
        if (!this.scene.groupeFlechesEnnemis) return;
        
        // Calculer le centre de la hitbox
        const centreHitboxX = this.x; // Le centre X de la hitbox est le même que this.x grâce à l'offset
        const centreHitboxY = this.y + 16; // Centre Y de la hitbox (offset 32 + moitié de la hauteur 16 = 48px depuis le haut du sprite)
        
        // Direction exacte vers le joueur
        const dx = this.scene.player.x - centreHitboxX;
        const dy = this.scene.player.y - centreHitboxY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Décalage pour éviter l'auto-collision
        const offset = 15;
        const spawnX = centreHitboxX + (dx / distance) * offset;
        const spawnY = centreHitboxY + (dy / distance) * offset;
        
        const fleche = this.scene.groupeFlechesEnnemis.create(spawnX, spawnY, 'arrow');
        fleche.setScale(1.5);
        
        const vitesseFleche = 250;
        
        fleche.setVelocity(
            (dx / distance) * vitesseFleche,
            (dy / distance) * vitesseFleche
        );
        
        const angle = Math.atan2(dy, dx);
        fleche.setRotation(angle);
        
        if (this.scene.anims.exists('arrow_anim')) {
            fleche.anims.play('arrow_anim', true);
        }
        
        fleche.origine = 'ennemi';
        fleche.degats = 1;
        fleche.ennemiSource = this;
        
        fleche.body.allowGravity = false;
        fleche.setCollideWorldBounds(true);
        fleche.body.onWorldBounds = true;
        
        this.scene.time.delayedCall(3000, () => {
            if (fleche.active) fleche.destroy();
        });
    }
    
    prendreDegats() {
        this.pointsVie--;
        
        // Effet visuel
        this.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            this.clearTint();
        });
        
        if (this.pointsVie <= 0) {
            this.destroy();
        }
    }
}