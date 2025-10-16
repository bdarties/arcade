export default class niveau2 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "niveau2" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }


//PRELOAD
  preload() {
  this.load.image("background", "./assets/niveau2/game_background.png");
  this.load.tilemapTiledJSON("maps_foret", "./assets/niveau2/maps_foret.json");
  this.load.image("tiles_foret", "./assets/niveau2/foret.png");
  this.load.image("vie", "./assets/heart.png");
  this.load.image("game_over","./assets/game_over.jpg");
  this.load.image("victory","./assets/victory.jpg");
  this.load.audio('music1', './assets/niveau2/musique.mp3');
  this.load.audio('jump', './assets/jump.mp3');
  this.load.audio('epee', './assets/sword.mp3');
   this.load.audio("loose_song", "./assets/loose_song.mp3");
   this.load.audio("win_song", "./assets/win_song.mp3")
  this.load.spritesheet("player", "./assets/niveau2/chevalier.png", {
    frameWidth: 43,
    frameHeight: 53
  }); 
  this.load.spritesheet("player_attack", "./assets/niveau2/attack_chevalier.png", {
    frameWidth: 96,
    frameHeight: 49
  });  
  this.load.spritesheet("player_jump", "./assets/niveau2/jump_chevalier.png", {
    frameWidth: 40,
    frameHeight: 62
  });
   // Ennemis
        this.load.spritesheet("enemy_4", "./assets/niveau2/enemy_4.png", { frameWidth: 36, frameHeight: 33 });
        this.load.spritesheet("enemy_4_dead", "./assets/niveau2/enemy_4_dead.png", { frameWidth: 42, frameHeight: 46 });

        this.load.spritesheet("enemy_5", "./assets/niveau2/enemy_5.png", { frameWidth: 38, frameHeight: 61 });
        this.load.spritesheet("enemy_5_attack", "./assets/niveau2/enemy_5_attack.png", { frameWidth: 90, frameHeight: 59 });
        this.load.spritesheet("enemy_5_dead", "./assets/niveau2/enemy_5_dead.png", { frameWidth: 94, frameHeight: 61 });

        this.load.spritesheet("enemy_6", "./assets/niveau2/enemy_6.png", { frameWidth: 32, frameHeight: 64 });
        this.load.spritesheet("enemy_6_dead", "./assets/niveau2/enemy_6_dead.png", { frameWidth: 96, frameHeight: 63 });

        // Flèche
        this.load.image("magic", "./assets/niveau2/magic.png");

        // Potions
        this.load.image("potion_red", "./assets/potion_red.png");
        this.load.image("potion_green", "./assets/potion_green.png");
        this.load.image("potion_purple", "./assets/potion_purple.png");
  }




//CREATE
create(){

this.background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, "background")
  .setOrigin(0, 0)
  .setScrollFactor(0); // 0 = suit la caméra, 1 = fixe


// chargement de la carte
const carteDuNiveau = this.add.tilemap("maps_foret");

// chargement du jeu de tuiles
const tileset = carteDuNiveau.addTilesetImage("foret","tiles_foret");  

//GESTION DES CALQUES TILED
  const calque_decoration_back_layer = carteDuNiveau.createLayer(
    "decoration_back_layer",
    tileset
  );

  const calque_decoration2_back_layer = carteDuNiveau.createLayer(
    "decoration2_back_layer",
    tileset
  );

  const calque_decoration3_back_layer = carteDuNiveau.createLayer(
    "decoration3_back_layer",
    tileset
  );

  this.calque_platform_layer = carteDuNiveau.createLayer(
    "platform_layer",
    tileset
  );
  this.calque_platform_layer.setCollisionByProperty({ collides: true });


  const calque_kill_layer = carteDuNiveau.createLayer(
    "kill_layer",
    tileset
  );
  calque_kill_layer.setCollisionByProperty({ deadly: true });

  const calque_ladder = carteDuNiveau.createLayer(
  "ladder_layer",
  tileset
  );

  const calque_decoration_front_layer = carteDuNiveau.createLayer(
    "decoration_front_layer",
    tileset
  );

  const calque_decoration2_front_layer = carteDuNiveau.createLayer(
    "decoration2_front_layer",
    tileset
  );

  const objLayer = carteDuNiveau.getObjectLayer("object_layer");


//POINT DE DEPART
this.spawnPoint = carteDuNiveau.findObject("object_layer", obj => obj.name === "start");

  this.player = this.physics.add.sprite(this.spawnPoint.x, this.spawnPoint.y, "player");
  this.player.setCollideWorldBounds(true);
  this.player.isOnLadder = false;
  this.player.hasProtection = false;
  this.player.isInvulnerable = false;
  this.playerLives= 5; 


//CREATION DES ENNEMIES 
this.anims.create({ key: "enemy_4_walk", frames: this.anims.generateFrameNumbers("enemy_4", { start: 6, end: 11 }), frameRate: 8, repeat: -1 });
this.anims.create({ key: "enemy_4_dead", frames: this.anims.generateFrameNumbers("enemy_4_dead", { start: 9, end: 17 }), frameRate: 8, repeat: 0 });

this.anims.create({ key: "enemy_5_walk", frames: this.anims.generateFrameNumbers("enemy_5", { start: 7, end: 13}), frameRate: 8, repeat: -1 });
this.anims.create({ key: "enemy_5_attack", frames: this.anims.generateFrameNumbers("enemy_5_attack", { start: 4, end: 7 }), frameRate: 10, repeat: 0 });
this.anims.create({ key: "enemy_5_dead", frames: this.anims.generateFrameNumbers("enemy_5_dead", { start: 4, end: 7 }), frameRate: 8, repeat: 0 });

this.anims.create({ key: "enemy_6_walk", frames: this.anims.generateFrameNumbers("enemy_6", { start: 7, end: 13 }), frameRate: 8, repeat: -1 });
this.anims.create({ key: "enemy_6_dead", frames: this.anims.generateFrameNumbers("enemy_6_dead", { start: 5, end: 9 }), frameRate: 8, repeat: 0 });

this.enemies = this.physics.add.group();
if (objLayer && objLayer.objects && objLayer.objects.length) {
    objLayer.objects.forEach(obj =>{
                this.physics.add.collider(this.enemies, this.calque_platform_layer);
                let enemy = null;
                if (obj.name === "enemy_4") {
                    enemy = this.enemies.create(obj.x, obj.y, "enemy_4");
                    enemy.type = 4;
                    enemy.play("enemy_4_walk");
                    enemy.speed = 100;
                    enemy.direction = 1;
                    enemy.isAlive = true;
                    enemy.health = 2;
                    enemy.setVelocityX(enemy.speed);
                } else if (obj.name === "enemy_5") {
                    enemy = this.enemies.create(obj.x, obj.y, "enemy_5");
                    enemy.type = 5;
                    enemy.play("enemy_5_walk");
                    enemy.speed = 40;
                    enemy.direction = 1;
                    enemy.isAlive = true;
                    enemy.isAttacking = false;
                    enemy.health = 1;
                    enemy.detectionRange = 100; // Distance de détection du joueur
                    enemy.setVelocityX(enemy.speed);
                } else if (obj.name === "enemy_6") {
                    enemy = this.enemies.create(obj.x, obj.y, "enemy_6");
                    enemy.type = 6;
                    enemy.play("enemy_6_walk");
                    enemy.speed = 70;
                    enemy.direction = 1;
                    enemy.isAlive = true;
                    enemy.health = 2;
                    enemy.setVelocityX(enemy.speed);
                    // Timer pour tirer des projectiles aléatoirement
                    enemy.nextShootTime = this.time.now + Phaser.Math.Between(2000, 5000);
                }
              });
            }
    //DEGAT DE L'ENEMY SUR PLAYER
    this.physics.add.overlap(this.player, this.enemies, hitPlayer, null, this);

    // Création de la hitbox d'attaque (invisible)
  this.playerAttackHitbox = this.add.rectangle(0, 0, 48, 40, null, 0);
  this.physics.add.existing(this.playerAttackHitbox);
  this.playerAttackHitbox.body.setAllowGravity(false);
  this.playerAttackHitbox.active = false; // Désactivée par défaut 
// ATTAQUE DU JOUEUR SUR LES ENNEMIS
this.physics.add.overlap(this.playerAttackHitbox, this.enemies, attackEnemy, null, this); 
    
//BOULE MAGIC ENEMY 6
this.groupeMagics = this.physics.add.group({
  allowGravity: false // Désactive la gravité pour tous les projectiles
});
this.physics.add.collider(this.groupeMagics, this.calque_platform_layer, (magic) => {
  if (magic && magic.destroy) magic.destroy();
});
this.physics.add.overlap( this.player, this.groupeMagics, (player, magic) =>{
  if (magic && magic.destroy) magic.destroy();
  hitPlayer.call(this);
});   

//CREATION POTIONS 
this.potions = this.physics.add.group();
if (objLayer && objLayer.objects && objLayer.objects.length) {
    objLayer.objects.forEach(obj =>{
                this.physics.add.collider(this.potions, this.calque_platform_layer);
                let potion = null;
                if (obj.name === "item") {
                    potion = this.potions.create(obj.x, obj.y, "potion_red");
                    potion.type = "hearth";
                } else if (obj.name === "powerUp") {
                    potion = this.potions.create(obj.x, obj.y, "potion_green");
                    potion.type = "protection";
                } else if (obj.name === "dead") {
                    potion = this.potions.create(obj.x, obj.y, "potion_purple");
                    potion.type = "dead";
                }
              });
            }
this.physics.add.overlap(this.player, this.potions, null, null, this);


//GESTION COLLISIONS 
  this.physics.add.collider(this.player, this.calque_platform_layer, null, () => {
    if (this.player.isOnLadder == true) return false;
    return true;
  });

  this.physics.add.collider(this.player, calque_kill_layer, killPlayer, null,this) 


  // Collision joueur avec potions
        this.physics.add.overlap(this.player, this.potions, collectPotion, null, this);


  // verifier si échelle 
  this.physics.add.overlap(this.player, calque_ladder, () => {
    this.player.isOnLadder = true;
  }, () => {
    var tuile = calque_ladder.getTileAtWorldXY(this.player.x, this.player.y);
    if (tuile !=null){
       this.player.isOnLadder = true;
      return true;
    }
    this.player.isOnLadder = false;
    return false;
  }
  , this);




// Ordre d'affichage
  calque_decoration_front_layer.setDepth(10);
  calque_decoration2_front_layer.setDepth(11);

// redimentionnement du monde avec les dimensions calculées via tiled
this.physics.world.setBounds(0, 0, 3200, 1088);
//  ajout du champs de la caméra de taille identique à celle du monde
this.cameras.main.setBounds(0, 0, 3200, 1088);
// ancrage de la caméra sur le joueur
this.cameras.main.startFollow(this.player); 



//GESTION ANIMATIONS PLAYER (CHEVALIER)
this.anims.create({
    key: "anim_tourne_gauche", // key est le nom de l'animation 
    frames: this.anims.generateFrameNumbers("player", { start: 0, end: 7 }), // on prend toutes les frames de img perso numérotées de 0 à 3
    frameRate: 10, // vitesse de défilement des frames
    repeat: -1 // nombre de répétitions de l'animation. -1 = infini
  }); 
  this.anims.create({
    key: "anim_tourne_droite", 
    frames: this.anims.generateFrameNumbers("player", { start: 10, end: 17}),
    frameRate: 10, 
    repeat: -1
  }); 
  this.anims.create({
    key: "anim_face_droite",
    frames: [{ key: "player", frame: 8 }],
    frameRate: 20
  });
  this.anims.create({
    key: "anim_face_gauche",
    frames: [{ key: "player", frame: 9 }],
    frameRate: 20
  });
  this.anims.create({
    key: "anim_saut_droite", 
    frames: this.anims.generateFrameNumbers("player_jump", { start: 6, end: 9}),
    frameRate: 10, 
    repeat: -1
  }); 
  this.anims.create({
    key: "anim_saut_gauche", 
    frames: this.anims.generateFrameNumbers("player_jump", { start: 15, end: 19}),
    frameRate: 10, 
    repeat: -1
  }); 
  this.anims.create({
  key: "attack_droite",
  frames: this.anims.generateFrameNumbers("player_attack", { start: 0, end: 3}),
  frameRate: 12,
  repeat: 0 
  });
  this.anims.create({
  key: "attack_gauche",
  frames: this.anims.generateFrameNumbers("player_attack", { start: 4, end: 7}),
  frameRate: 12,
  repeat: 0 
  });
this.player.direction = 'right';


//attacking
this.attacking= false;
this.player.on('animationcomplete', (anim) => {
  if (anim.key === 'attack_gauche' || anim.key === 'attack_droite') {
    this.attacking = false;
    // Désactive la hitbox d'attaque
    this.playerAttackHitbox.active = false;
    this.playerAttackHitbox.setPosition(-1000, -1000); // La cache hors écran
    // Réinitialise tous les marqueurs justHit des ennemis
    this.enemies.children.iterate(e => {
      if (e) e.justHit = false;
    });
  }});


//TOUCHES ET CURSORS (JOYSTICK)
  this.cursors = this.input.keyboard.createCursorKeys();
  this.keyO = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
  this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
  this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

//MUSIQUES ET SON
this.music = this.sound.add('music1'); 
this.music.play();
this.music.setVolume(0.3);  

this.son_jump= this.sound.add('jump');
this.son_jump.setVolume(0.7);

this.son_epee= this.sound.add('epee');

// Si la scène est reprise via scene.switch, relancer la musique
        this.events.on('wake', () => {
                if (this.music) {
                    this.music.play();
                }
        });

//Compteur vie 
        this.livesIcons = this.add.group();
        this.updateLivesDisplay();
}



//UPDATE
  update(){

//JOYSTICK
if (this.cursors.left.isDown ) {
    this.player.direction = 'left';
     this.player.setVelocityX(-160);
    if (!this.attacking) this.player.anims.play('anim_tourne_gauche', true);
  } else  if (this.cursors.right.isDown && !this.attacking) {
    this.player.direction = 'right';
    this.player.setVelocityX(160);
    if (!this.attacking) this.player.anims.play('anim_tourne_droite', true);
  } else {
    this.player.setVelocityX(0);
    if (this.player.direction === 'left') {
       if (!this.attacking) this.player.anims.play('anim_face_gauche', true);
    } else {
        if (!this.attacking) this.player.anims.play('anim_face_droite', true);
    }
  }

if (this.player.isOnLadder) {
  this.player.body.allowGravity = false; //désactive gravité 
  if (this.cursors.up.isDown) {
    this.player.setVelocityY(-100); // vitesse montée
      if (this.player.direction === 'left') {
        this.player.anims.play('anim_face_gauche', true);
    } else {
        this.player.anims.play('anim_face_droite', true);
    }
  } else if (this.cursors.down.isDown) {
    this.player.setVelocityY(100); // vitesse descente
      if (this.player.direction === 'left') {
        this.player.anims.play('anim_face_gauche', true);
    } else {
        this.player.anims.play('anim_face_droite', true);
    }
  } else {
    this.player.setVelocityY(0); // reste immobile sur l'échelle
  }
} else {
  this.player.body.allowGravity = true; //réactive gravité  
}



//BOUTONS
if (Phaser.Input.Keyboard.JustDown(this.keyO)&& this.player.body.blocked.down) {
    this.son_jump.play();
    this.player.setVelocityY(-230);
    if (this.player.direction === 'left') {
        this.player.anims.play('anim_saut_gauche', true);
    } else {
        this.player.anims.play('anim_saut_droite', true);
    }
  }if (Phaser.Input.Keyboard.JustDown(this.keyP)) {
    this.son_epee.play();
    this.attacking= true; 
    // Active la hitbox d'attaque
    this.playerAttackHitbox.active = true;
    // Positionne la hitbox devant le joueur selon sa direction
    const hx = this.player.x + (this.player.direction === "right" ? 30 : -30);
    const hy = this.player.y;
    this.playerAttackHitbox.setPosition(hx, hy);

    if (this.player.direction === "left") {
        this.player.anims.play("attack_gauche", true);
    } else {
        this.player.anims.play("attack_droite", true);
    } return; 
  }if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
    this.scene.switch("selection");
    this.music.stop();  
  }


  //ENEMYS
  this.enemies.children.iterate(e => {
    if (!e || !e.isAlive) return;

  // Vérifier la tuile devant l’ennemi
const checkX = e.getBottomRight().x+10;
const checkY = e.getBottomRight().y+10;
const checkXl = e.getBottomLeft().x-10;
const checkYl = e.getBottomLeft().y+10;

// Récupérer la tuile sous les pieds à la prochaine position
const tileBelowRight = this.calque_platform_layer.getTileAtWorldXY(checkX, checkY);
const tileBelowLeft = this.calque_platform_layer.getTileAtWorldXY(checkXl, checkYl);

// Si vide à droite → demi-tour
if (!tileBelowRight) {
    e.setVelocityX(-e.speed);
    e.direction = -1;
      return;
}
// Si vide à gauche → demi-tour
if (!tileBelowLeft) {
    e.setVelocityX(e.speed);
    e.direction = 1;
      return;
}
  

  // Collision avec murs → demi-tour
  if (e.body.blocked.left) {
    e.setVelocityX(e.speed);
    e.direction = 1;
  } else if (e.body.blocked.right) {
    e.setVelocityX(-e.speed);
    e.direction = -1;
  }

  // Orientation du sprite
  e.setFlipX(e.body.velocity.x < 0);

  // COMPORTEMENT SPÉCIFIQUE ENEMY_5 : Attaque quand le joueur s'approche
  if (e.type === 5) {
    const distanceToPlayer = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y);
    
    if (distanceToPlayer < e.detectionRange && !e.isAttacking) {
      // Lance l'attaque
      e.isAttacking = true;
      e.setVelocityX(0); // Arrête le mouvement
      e.anims.play("enemy_5_attack", true);
      
      // Reprend la marche après l'animation
      e.once('animationcomplete', () => {
        e.isAttacking = false;
        e.setVelocityX(e.speed * e.direction);
        e.anims.play("enemy_5_walk", true);
      });
    } else if (!e.isAttacking) {
      // Continue de marcher
      if (!e.anims.isPlaying || e.anims.currentAnim.key !== "enemy_5_walk") {
        e.anims.play("enemy_5_walk", true);
      }
    }
  }
  
  // COMPORTEMENT SPÉCIFIQUE ENEMY_6 : Tire des projectiles aléatoirement
  else if (e.type === 6) {
    if (this.time.now >= e.nextShootTime) {
      // Détermine la direction en fonction du flipX (si flipX = true, l'ennemi regarde à gauche)
      const shootDirection = e.flipX ? -1 : 1;
      
      // Crée un projectile magique
      const magic = this.groupeMagics.create(e.x, e.y, "magic");
      magic.active=true; 
      magic.setVelocityX(shootDirection * 150); // Vitesse du projectile dans la bonne direction
      magic.setFlipX(e.flipX); // Oriente le sprite du projectile dans la même direction
      magic.setScale(1); // Ajuste la taille si nécessaire
    
      
      // Détruit le projectile après 3 secondes
      this.time.delayedCall(3000, () => {
        if (magic && magic.active) magic.destroy();
      });
      
      // Programme le prochain tir aléatoirement (entre 1 et 5 secondes)
      e.nextShootTime = this.time.now + Phaser.Math.Between(1000, 5000);
    }
    
    // Animation normale
    if (!e.anims.isPlaying || e.anims.currentAnim.key !== "enemy_6_walk") {
      e.anims.play("enemy_6_walk", true);
    }
  }
  
  // COMPORTEMENT ENEMY_4 : Patrouille simple
  else if (e.type === 4) {
    if (!e.anims.isPlaying || e.anims.currentAnim.key !== "enemy_4_walk") {
      e.anims.play("enemy_4_walk", true);
    }
  }
});
}


updateLivesDisplay(livesIcons, playerLives) {
    if (!this.livesIcons) return;

    if (this.livesIcons) {
      this.livesIcons.clear(true, true); // Supprime les enfants du groupe
    }
    this.livesIcons = this.add.group();

    // Crée une icône par vie
    for (let i = 0; i < this.playerLives; i++) {
      const heart = this.add.image(90 + i * 40, 30, "vie");
      heart.setScrollFactor(0);
      heart.setDepth(13);
      heart.setOrigin(0, 0.5);
      this.livesIcons.add(heart); // Ajoute l'image au groupe
    }
  }
}


function collectPotion(player, potion){
if (!potion) return;
        // Détruire la potion dès le ramassage
        potion.destroy();

         if (potion.type === "hearth"){
            // Ajoute une vie
            this.playerLives++;
            this.updateLivesDisplay();

        } else if (potion.type === "protection") {
            // Active la protection pendant 5 secondes
            this.player.hasProtection = true;
            this.player.setTint(0x00ff00); // Teinte verte
            this.time.delayedCall(5000, () => {
                this.player.hasProtection = false;
                this.player.clearTint();
            });

        } else if (potion.type === "dead") {
            // Fait perdre une vie
            this.playerLives--;
            this.updateLivesDisplay();
            if (this.playerLives <= 0) {
                this.playerLives = 0;
                this.updateLivesDisplay();
                this.physics.pause();
                gameOver.call(this); 
            }
        } 
}

function hitPlayer(scene){
  if (!this.player.isInvulnerable || !this.player.hasProtection){
        this.playerLives--;
        this.updateLivesDisplay();

        this.player.isInvulnerable = true;
        this.player.setTint(0xff0000);// Teinte rouge

        this.time.delayedCall(1000, () => {
            this.player.isInvulnerable = false;
            this.player.clearTint();
        });
  } else {
    return;
  }


  if (this.playerLives <= 0) {
    this.playerLives = 0;
    this.updateLivesDisplay();
    this.physics.pause();
    gameOver.call(this); 
  }
}

function killPlayer(player, kill){
  this.playerLives--;
  this.updateLivesDisplay();
  
  if (this.playerLives <= 0) {
    this.playerLives = 0;
    this.updateLivesDisplay();
    this.physics.pause();
    gameOver.call(this);
  } else {
    // Seulement si le joueur a encore des vies, on le replace au spawn
    this.player.setPosition(this.spawnPoint.x, this.spawnPoint.y);
    this.player.setVelocity(0, 0);
    this.player.hasProtection = false;
  }
}


function attackEnemy(hitbox, enemy) {
  /// Vérifie si le joueur est en train d'attaquer
  if (!this.attacking || !this.playerAttackHitbox.active) return;
  // Vérifie si l'ennemi est vivant et n'a pas déjà été touché pendant cette attaque
  if (!enemy.isAlive || enemy.justHit) return;

  // Marque l'ennemi comme touché pendant cette attaque
  enemy.justHit = true;
  
  // L'ennemi perd 1 point de vie
  enemy.health--;
  
  // Effet visuel : teinte rouge
  enemy.setTint(0xff0000);
  this.time.delayedCall(100, () => {
    if (enemy.active) enemy.clearTint();
  });
  
  // Si l'ennemi n'a plus de vie
  if (enemy.health <= 0) {
    enemy.isAlive = false;
    enemy.setVelocityX(0);
    
    // Joue l'animation de mort selon le type d'ennemi
    if (enemy.type === 4) {
      enemy.anims.play("enemy_4_dead", true);
    } else if (enemy.type === 5) {
      enemy.anims.play("enemy_5_dead", true);
    } else if (enemy.type === 6) {
      enemy.anims.play("enemy_6_dead", true);
    }
    
    // Détruit l'ennemi après l'animation de mort
    enemy.once('animationcomplete', () => {
      enemy.destroy();
      
      // Vérifie s'il reste des ennemis vivants
      checkEnemies.call(this);
    });
  }
  
  // Réinitialise le marqueur après un court délai
  this.time.delayedCall(100, () => {
    if (enemy && enemy.active) enemy.justHit = false;
  });
}

function checkEnemies() {
  // Compte les ennemis encore vivants
  let enemiesAlive = 0;
  this.enemies.children.iterate(e => {
    if (e && e.isAlive) {
      enemiesAlive++;
    }
  });
  
  // Si tous les ennemis sont morts
  if (enemiesAlive === 0) {
    Victory.call(this);
  }
}

function gameOver() {
      this.music.stop();
      this.sound.play("loose_song", { volume: 0.5 });
    this.player.setVelocityX(0);
    const imageLose = this.add.image(this.cameras.main.width/2, this.cameras.main.height/2, 'game_over');
    imageLose.setScrollFactor(0);
    imageLose.setDepth(14);
    this.time.delayedCall(4000, () => {
    imageLose.destroy();
    this.scene.start("selection");});
  } 


function Victory () {
      this.music.stop();
      this.sound.play("win_song", { volume: 0.5 });
    this.player.setVelocityX(0);
    const imageVictoire = this.add.image(this.cameras.main.width/2, this.cameras.main.height/2,"victory");
    imageVictoire.setScrollFactor(0);
    imageVictoire.setDepth(14);
    this.time.delayedCall(3000, () => {
      imageVictoire.destroy();
      this.scene.start("selection"); });
  }