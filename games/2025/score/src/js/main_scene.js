import * as fct from "./fonctions.js";
import Player from "./Player.js";
import Enemy from "./Enemy.js";


export default class main_scene extends Phaser.Scene {
  // constructeur de la classe
  spawnPoint = [];
  constructor() {
    super({
      key: "main_scene"
    });
   this.global_mobility_model = 1;
   this.restart = false;
  }

  preload() {
    this.load.spritesheet('player_move_right', './src/assets/spritesheets/player_move_right_spritesheet.png', { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('player_stand_right', './src/assets/spritesheets/player_stand_right_spritesheet.png', { frameWidth: 32, frameHeight: 48 });

    this.load.spritesheet('enemy_move_right', './src/assets/spritesheets/enemy_move_right_spritesheet.png', { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('enemy_stand_right', './src/assets/spritesheets/enemy_stand_right_spritesheet.png', { frameWidth: 32, frameHeight: 48 });


    this.load.tilemapTiledJSON('main_map', './src/assets/maps/main_map.json');
    this.load.image('tileset_image', './src/assets/maps/tileset_image.png');
    this.load.image('bullet', './src/assets/images/bullet.png');
     
       // ajout d'un event au chargement de la scene
    ['start','create','pause','resume','sleep','wake','shutdown','destroy']
      .forEach(evt => this.events.on(evt, () =>
      {
        // console.log('Scene2 event:', evt)
        }
      )
      );

    // 1) Déclenche une action à CHAQUE reprise (pause->resume)
    this.events.on('resume', (_sys, data) => {
     // console.log('Scene2 RESUME', data);
    
    });

   console.log("global_mobility_model initialisé à : "+this.global_mobility_model);
 
  }

  create() {
   

    this.physics.world.setBounds(0, 0, 1280, 720);
    // chargement de  la carte et du tileset
    this.map = this.make.tilemap({ key: 'main_map' });
    this.tileset = this.map.addTilesetImage('tuilesJeu', 'tileset_image');

    // creation des layers
    this.calque_fond = this.map.createLayer("calque_fond", [this.tileset], 0, 0);
    this.calque_plateformes = this.map.createLayer("calque_plateformes", [this.tileset], 0, 0);
    this.calque_decor = this.map.createLayer("calque_decor", [this.tileset], 0, 0);
   
    this.calque_plateformes.setCollisionByExclusion(-1); // collision avec toutes les tuiles de platform

    // gestion des profondeurs
    this.calque_fond.setDepth(0);
    this.calque_plateformes.setDepth(30);

    //création du joueur 
    this.player = new Player(this, 0, 0, "player_move_right");

    // création des groupes
    this.groupe_ennemis = this.physics.add.group();
    this.groupe_projectiles = this.physics.add.group();
    this.groupe_projectiles_ennemis = this.physics.add.group();

    // Création des objets issus du calque objet
    this.tab_objects = this.map.getObjectLayer("calque_objets");
    this.tab_objects.objects.forEach(point => {
        // positionnement du joueur au point de départ
        if (point.name == "depart") {
            this.player.x = point.x;
            this.player.y = point.y-20;

          }
       if (point.name == "ennemi") {

            let un_ennemi = new Enemy(this, point.x, point.y-20, "enemy_move_right",   this.calque_plateformes, this.global_mobility_model);
            this.groupe_ennemis.add(un_ennemi);
            un_ennemi.init()
          }

        }, this);
      
     
    this.cursor = this.input.keyboard.createCursorKeys();


    //  création des animations
    this.createAnimations();


    // gestion des collisions entre le joueur, les plateformes, les ennemis
    this.physics.add.collider(this.player, this.calque_plateformes, null, (player, tile) => {
        
       // cas ou on est sur uen plate-forme, et qu'on se cogne a droite ou a gauche
       if (player.body.blocked.left || player.body.blocked.right) {
           console.log("on est sur une plateforme et on se cogne à gauche ou à droite");
       }
         if (player.wantsToGoThroughPlatform) {
          this.wantsToGoThroughPlatform = false;
           const coords = player.getBottomCenter();
          // si deux tuiles plus bas il n'y a rien on laisse tomber
          let tile_below = this.calque_plateformes.getTileAtWorldXY(coords.x, coords.y + tile.height*1.5);
          if (tile_below == null) {
          return false;
        }
        }
      

          // cas ou on est en dessous d'une plate-forme
          const coordPlayer = player.getTopCenter();
     
          if (coordPlayer.y >= tile.y * tile.height) {
            return false;
          }



        if (player.x < tile.pixelX + tile.width && player.x + player.width > tile.pixelX &&
            player.y < tile.pixelY + tile.height && player.y + player.height > tile.pixelY) {
          return true;
        }

         return true;
       // return false;
    }, this);

    this.physics.add.collider(this.groupe_ennemis, this.calque_plateformes);
    this.physics.add.collider(this.groupe_ennemis, this.groupe_ennemis, this.manageEnemyCollision, this.checkEnemyCollision, this);
 
    this.physics.add.collider(this.groupe_ennemis, this.groupe_projectiles, (enemy, projectile) => {
    // cache la balle
    projectile.disableBody(true, true);

    // Arrête le timer associé à la destruction de la balle (si applicable)

    // Fait clignoter l'ennemi en vert pendant 1 seconde
    enemy.setTint(0x00ff00); // Applique une teinte verte
    this.time.delayedCall(1000, () => {
        enemy.clearTint(); // Supprime la teinte après 1 seconde
    });
  });

// Ajout d'un conteneur pour les messages
this.messageText = this.add.text(this.scale.width / 2, this.scale.height / 2, "", {
    font: "32px Arial",
    fill: "#ffffff",
    backgroundColor: "#000000",
        padding: { x: 10, y: 10 },
    }).setOrigin(0.5).setDepth(100).setVisible(false);
    this.scene.pause();
    if (this.restart) {
        this.showResumeMessage("Restart de la scène avec le même modèle");
        this.scene.resume();
    } else {
        this.messageText.setText("Modele de mobilité actuel : "+this.global_mobility_model +"\n appuyez sur le bouton 5 pour démarrer la simulation").setAlign("center").setVisible(true);
    }
    this.restart = false;

    // Activer les événements worldbounds pour les ennemis et les projectiles
    this.physics.world.on('worldbounds', (body) => {
        const gameObject = body.gameObject;
        if (this.groupe_ennemis.contains(gameObject) ) {

            // Si l'objet touche le bord inférieur
              if (body.bottom >= this.physics.world.bounds.height) {
                gameObject.setVelocity(0); // Arrête le mouvement
                gameObject.setTint(0xff0000); // Change la couleur en rouge
                gameObject.play('enemy_stand_right_anim', true); // Passe à l'animation de mort
                gameObject.alive = false;
                gameObject.isMoving = false;
               // Désactive la physique de l'objet
               gameObject.body.enable = false; // Désactive le corps physique
               gameObject.body.destroy(); // Supprime complètement le corps physique
              gameObject.removeTimers();
              this.time.delayedCall(500, () => {
                  gameObject.destroy(); // Supprime l'objet après un délai
              });

            }
            //sinon on le stoppe juste
            if (this.global_mobility_model==1) {
            gameObject.stopMoving();
            }
            
        }
    });

    // Configuration des ennemis pour émettre l'événement worldbounds
    this.groupe_ennemis.children.iterate((un_ennemi) => {
        un_ennemi.body.onWorldBounds = true;
    });

    // Configuration des projectiles pour émettre l'événement worldbounds
    this.groupe_projectiles.children.iterate((un_projectile) => {
        un_projectile.body.onWorldBounds = true;
    });
  }

  update() {
   
    // rajouter la nage
    this.player.update();
    this.groupe_ennemis.children.iterate(function iterateur(un_ennemi) {
      un_ennemi.update();
    }, this);

  }

 
  createAnimations(){
    // Animation du joueur
    if (!this.anims.get('player_move_right_anim')) {
    this.anims.create({
        key: 'player_move_right_anim', 
        frames: this.anims.generateFrameNumbers('player_move_right', { start: 0, end:3 }),
        frameRate: 10,
        repeat: -1
    });
    }
    if (!this.anims.get('player_stand_right_anim')) {
    this.anims.create({
        key: 'player_stand_right_anim', 
        frames: this.anims.generateFrameNumbers('player_stand_right', { start: 0, end: 0 }),
        frameRate: 10,
        repeat: -1
    });
    }
    // Animation de l'ennemi
if (!this.anims.get('enemy_move_right_anim')) {
 this.anims.create({
        key: 'enemy_move_right_anim', 
        frames: this.anims.generateFrameNumbers('enemy_move_right', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
}
if (!this.anims.get('enemy_stand_right_anim')) {
    this.anims.create({
        key: 'enemy_stand_right_anim', 
        frames: this.anims.generateFrameNumbers('enemy_stand_right', { start: 0, end: 0 }),
        frameRate: 10,
        repeat: -1
    });
}
  }

  // Affiche un message de pause
  showPauseMessage() {
     this.messageText.setVisible(true).setAlpha(1);
     this.messageText.setText("Simulation en pause\n appuyez sur le bouton 5 pour reprendre").setAlign("center").setVisible(true);
  }

  // Affiche un message de reprise qui s'estompe progressivement
  showResumeMessage(txt= "Reprise de la simulation") {
    this.messageText.setText(txt).setVisible(true);

    this.tweens.add({
        targets: this.messageText,
        alpha: 0, // Fait disparaître le texte
        duration: 2000, // 2 secondes
        onComplete: () => {
            this.messageText.setVisible(false).setAlpha(1); // Réinitialise la visibilité et l'opacité
        },
    });
}

manageEnemyCollision(enemy1, enemy2) {
    // Logique de gestion de la collision entre deux ennemis
    if (this.global_mobility_model== 1) {
      // ils s'arretent
      enemy1.stopMoving();
      enemy2.stopMoving();
      return true
    }

    if ((enemy1.body.touching.left && enemy2.body.touching.right) || (enemy1.body.touching.right && enemy2.body.touching.left)) {
        enemy1.changeDirection();
        enemy2.changeDirection();
    }
}


checkEnemyCollision(enemy1, enemy2) {
  return true;
}
}
