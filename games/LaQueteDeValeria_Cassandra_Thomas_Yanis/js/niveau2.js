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
  this.load.audio('music', './assets/niveau2/musique.mp3');
  this.load.audio('jump', './assets/jump.mp3');
  this.load.audio('epee', './assets/sword.mp3');
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

        this.load.spritesheet("enemy_5", "./assets/niveau2/enemy_5.png", { frameWidth: 61, frameHeight: 38 });
        this.load.spritesheet("enemy_5_attack", "./assets/niveau2/enemy_5_attack.png", { frameWidth: 59, frameHeight: 90 });
        this.load.spritesheet("enemy_5_dead", "./assets/niveau2/enemy_5_dead.png", { frameWidth: 61, frameHeight: 94 });

        this.load.spritesheet("enemy_6", "./assets/niveau2/enemy_6.png", { frameWidth: 64, frameHeight: 32 });
        this.load.spritesheet("enemy_6_dead", "./assets/niveau2/enemy_6_dead.png", { frameWidth: 63, frameHeight: 96 });

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

  const calque_platform_layer = carteDuNiveau.createLayer(
    "platform_layer",
    tileset
  );
  calque_platform_layer.setCollisionByProperty({ collides: true });


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
const spawnPoint = carteDuNiveau.findObject("object_layer", obj => obj.name === "start");

  this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, "player");
  this.player.setCollideWorldBounds(true);
  this.player.isOnLadder = false;


//CREATION DES ENNEMIES 
this.anims.create({ key: "enemy_4", frames: this.anims.generateFrameNumbers("enemy_4", { start: 6, end: 11 }), frameRate: 8, repeat: -1 });
this.anims.create({ key: "enemy_4_dead", frames: this.anims.generateFrameNumbers("enemy_4_dead", { start: 9, end: 17 }), frameRate: 8, repeat: 0 });

this.anims.create({ key: "enemy_5", frames: this.anims.generateFrameNumbers("enemy_5", { start: 7, end: 13}), frameRate: 8, repeat: -1 });
this.anims.create({ key: "enemy_5_attack", frames: this.anims.generateFrameNumbers("enemy_5_attack", { start: 4, end: 7 }), frameRate: 10, repeat: 0 });
this.anims.create({ key: "enemy_5_dead", frames: this.anims.generateFrameNumbers("enemy_5_dead", { start: 4, end: 7 }), frameRate: 8, repeat: 0 });

this.anims.create({ key: "enemy_6", frames: this.anims.generateFrameNumbers("enemy_6", { start: 7, end: 13 }), frameRate: 8, repeat: -1 });
this.anims.create({ key: "enemy_6_dead", frames: this.anims.generateFrameNumbers("enemy_6_dead", { start: 5, end: 9 }), frameRate: 8, repeat: 0 });

this.enemies = this.physics.add.group();
if (objLayer && objLayer.objects && objLayer.objects.length) {
    objLayer.objects.forEach(obj =>{
                this.physics.add.collider(this.enemies, calque_platform_layer);
                let enemy = null;
                if (obj.name === "enemy_4") {
                    enemy = this.enemies.create(obj.x, obj.y, "enemy_4");
                    enemy.type = 4;
                } else if (obj.name === "enemy_5") {
                    enemy = this.enemies.create(obj.x, obj.y, "enemy_5");
                    enemy.type = 5;
                } else if (obj.name === "enemy_6") {
                    enemy = this.enemies.create(obj.x, obj.y, "enemy_6");
                    enemy.type = 6;
                }
              });
            }
this.physics.add.overlap(this.player, this.enemies, null, null, this);        

//CREATION POTIONS 
this.potions = this.physics.add.group();
if (objLayer && objLayer.objects && objLayer.objects.length) {
    objLayer.objects.forEach(obj =>{
                this.physics.add.collider(this.potions, calque_platform_layer);
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
  this.physics.add.collider(this.player, calque_platform_layer, null, () => {
    if (this.player.isOnLadder == true) return false;
    return true;
  });

  this.physics.add.collider(this.player, calque_kill_layer, () => {
    this.perdreVie(this.player);
  });

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
    frames: this.anims.generateFrameNumbers("player", { start: 0, end: 7 }), // on prend toutes les frames de img perso numerotées de 0 à 3
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
  }});

  this.cursors = this.input.keyboard.createCursorKeys();
  this.keyO = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O);
  this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
  this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);

//MUSIQUES ET SON
this.music = this.sound.add('music'); 
this.music.play();
this.music.setVolume(0.3);  

this.son_jump= this.sound.add('jump');
this.son_jump.setVolume(0.7);

this.son_epee= this.sound.add('epee');
}



//UPDATE
  update(){

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
    if (this.player.direction === "left") {
        this.player.anims.play("attack_gauche", true);
    } else {
        this.player.anims.play("attack_droite", true);
    } return; 
  }if (Phaser.Input.Keyboard.JustDown(this.keyK)) {
    this.scene.switch("selection");
    this.music.stop();  
  }
  }
  }

