import * as fct from "./fonctions.js";
import EnemyParabolic from "../src/enemy1.js";
import EnemyCone from "../src/enemy2.js";
import EnemySpider from "../src/enemy3.js";

export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });
    this.playerHealth = 50;
    this.playerMaxHealth = 50;

    this.baseXP = 15;
    this.growth = 1.5;
    this.playerLevel = 0;
    this.playerXP = 0;

    // Branches de compétences
    this.skills = {
        Armes: 0,
        Survie: 0,
        Mobilité: 0
    };

    this.maxSkillLevel = 5;
    this.skillPoints = 0; // Points disponibles à dépenser
    this.selectedSkillIndex = 0; // Pour naviguer dans le menu
    this.skillKeys = ["Armes", "Survie", "Mobilité"];

  }

  

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    this.load.spritesheet("img_perso", "./assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.image("img_enemy", "./assets/enemy.png");
    this.load.image("img_enemy1", "./assets/enemy1.png");
    this.load.image("img_enemy2", "./assets/enemy2.png");
    this.load.image("img_enemy3", "./assets/enemy3.png");

    this.load.image("tir_enemy", "./assets/tirenemy.png");


    this.load.image("img_potion", "./assets/fiole.png");
    this.load.image("img_gold", "./assets/engrenage.png");

    this.load.image("cadre_mana", "./assets/barre mana.png");
    this.load.image("cadre_xp", "./assets/barre xp.png");
    this.load.image("cadre_vie", "./assets/barre vie.png");

    this.load.tilemapTiledJSON("map1", "./src/map1.json");
    this.load.image("tiles1", "./src/map/Background map 1 extend.png");
    this.load.image("tiles2", "./src/map/ea489fd3-6071-4143-aed7-fd1d786891b5.png");
    this.load.image("tiles3", "./src/map/e754ffcd-1873-4ceb-b0ef-635405adc338.png");
    this.load.image("tiles4", "./src/map/36b0c958-0079-4b22-8533-efb9bb43834a (1).png");
    this.load.image("tiles5", "./src/map/6ee6e611-06b2-4d2d-96c9-a9bbcb3d1f22-removebg-preview (3).png");
    this.load.image("tiles6", "./src/map/6e454237-ef60-4a2f-bab4-3c64506ee463-removebg-preview (1).png");


  }

  create() {

    
    // ÉTAT DE SCÈNE
    this.gameOver = false;
    // Réinitialiser la vie au (re)démarrage de la scène
    this.playerHealth = this.playerMaxHealth;

    // MONDE + PLATEFORMES
    const map = this.make.tilemap({ key: "map1" }); 
    
    const tileset1 = map.addTilesetImage("Background map 1 extend", "tiles1");
    const tileset2 = map.addTilesetImage("ea489fd3-6071-4143-aed7-fd1d786891b5", "tiles2");
    const tileset3 = map.addTilesetImage("e754ffcd-1873-4ceb-b0ef-635405adc338", "tiles3");
    const tileset4 = map.addTilesetImage("36b0c958-0079-4b22-8533-efb9bb43834a (1)", "tiles4");
    const tileset5 = map.addTilesetImage("6ee6e611-06b2-4d2d-96c9-a9bbcb3d1f22-removebg-preview (3)", "tiles5");
    const tileset6 = map.addTilesetImage("6e454237-ef60-4a2f-bab4-3c64506ee463-removebg-preview (1)", "tiles6");
    
    // Créer les calques
    map.createLayer("background_layer", [tileset1, tileset2, tileset3, tileset4, tileset5, tileset6], 0, 0);
    map.createLayer("background_2_layer", [tileset1, tileset2, tileset3, tileset4, tileset5, tileset6], 0, 0);
    this.platformLayer = map.createLayer(
  "platform_layer",
  [tileset1, tileset2, tileset3, tileset4, tileset5, tileset6],
  0,
  0
);
this.platformLayer.setCollisionByProperty({ dur: true });
map.createLayer("ladder_layer", [tileset1, tileset2, tileset3, tileset4, tileset5, tileset6], 0, 0);
    map.createLayer("decoration_back_layer", [tileset1, tileset2, tileset3, tileset4, tileset5, tileset6], 0, 0);
    
    // Activer collisions sur tuiles ayant la propriété { dur: true }
    this.platformLayer.setCollisionByProperty({ dur: true });


    // PLAYER
this.player = this.physics.add.sprite(100, 450, "img_perso");
this.player.setBounce(0.2);
this.player.setCollideWorldBounds(false);

// CAMÉRA
this.cameras.main.startFollow(this.player);
this.cameras.main.setFollowOffset(0, 210);
this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);


map.createLayer("decoration_front_layer", [tileset1, tileset2, tileset3, tileset4, tileset5, tileset6], 0, 0);


// EMPÊCHER la désactivation automatique
this.player.setDataEnabled();
this.player.setData('invulnerable', false);

// Note: ne pas override setActive; cela peut provoquer des états inattendus

    // ANIMATIONS (créer une seule fois)
    if (!this.anims.get("anim_face")) {
      this.anims.create({
        key: "anim_tourne_gauche",
        frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
      });
      this.anims.create({
        key: "anim_face",
        frames: [{ key: "img_perso", frame: 4 }],
        frameRate: 20
      });
      this.anims.create({
        key: "anim_tourne_droite",
        frames: this.anims.generateFrameNumbers("img_perso", { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
      });
    }

    // CLAVIER
    this.clavier = this.input.keyboard.createCursorKeys();
    
this.input.keyboard.on('keydown', (event) => {
  if (event.key === 'o') {
    const reach = 50;
    [this.enemy1, this.enemy2, this.enemy3, this.enemy4, this.enemy5, this.enemy6].forEach(enemy => {
      if (enemy && enemy.active) {
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist <= reach) {
          enemy.takeDamage(2, this.player);
 
                    // Texte flottant "Slash!"
                    let slashText = this.add.text(this.player.x, this.player.y - 50, "Slash!", {
                        fontSize: "12px",
                        fill: "#ff0000",
                        fontFamily: "Arial"
                    }).setOrigin(0.5).setDepth(10);

                    this.tweens.add({
                        targets: slashText,
                        alpha: 0,
                        y: slashText.y - 30,
                        duration: 500,
                        onComplete: () => slashText.destroy()
                    });
                }
            }
        });
    }
});



this.input.keyboard.on('keydown', (event) => {
    if (!this.isPause) return;

    if (event.key === "ArrowUp") {
        this.selectedSkillIndex = Phaser.Math.Wrap(this.selectedSkillIndex - 1, 0, this.skillKeys.length);
        this.skillSelector.y = -50 + this.selectedSkillIndex * 40;
    } else if (event.key === "ArrowDown") {
        this.selectedSkillIndex = Phaser.Math.Wrap(this.selectedSkillIndex + 1, 0, this.skillKeys.length);
        this.skillSelector.y = -50 + this.selectedSkillIndex * 40;
    } else if (event.key.toLowerCase() === "i") {
    let skill = this.skillKeys[this.selectedSkillIndex];
    if (this.skillPoints > 0 && this.skills[skill] < this.maxSkillLevel) {
        this.skills[skill]++;
        this.skillPoints--; 
        this.updateSkillUI(this.selectedSkillIndex);
    }
}


});





    this.playerGold = 0;
    this.playerMana = 0;

    this.gainXP = (amount) => {
    this.playerXP += amount;
    console.log(`XP +${amount} → total: ${this.playerXP}`);

    // Boucle pour gérer plusieurs niveaux si on dépasse
    while (this.playerXP >= this.xpForNextLevel(this.playerLevel)) {
    this.playerXP -= this.xpForNextLevel(this.playerLevel);
    this.playerLevel++;
    this.levelText.setText(`Level ${this.playerLevel}`);

    // Ajouter un point d'amélioration
    this.skillPoints++;
}




    this.updatePlayerXPBar(); // mettre à jour la barre
};



    this.gainMana = (amount) => {
    this.playerMana += amount;
    if (this.playerMana > 100) this.playerMana = 100; // max mana
    console.log(`Mana +${amount} → total: ${this.playerMana}`);
    this.updatePlayerManaBar(); // <-- important !
};


    this.events.on("goldPickup", amount => {
    this.playerGold += amount;
    console.log(`Gold +${amount} → total: ${this.playerGold}`);
    this.goldText.setText(`${this.playerGold}`);
});



    


    // COLLISIONS PLAYER
    this.physics.add.collider(this.player, this.platformLayer);
    this.invulnerable = false;

    // ENNEMIS
    this.enemy1 = new EnemyParabolic(this, 900, 500, this.player, 2, 1, 1, 200);
    this.enemy2 = new EnemyCone(this, 1000, 500, this.player, 50, 5, 10, 200);
    this.enemy3 = new EnemySpider(this, 1200, 400, this.player, 10, 5, 5, 200);
    this.enemy4 = new EnemyParabolic(this, 800, 500, this.player, 2, 1, 1, 200);
    this.enemy5 = new EnemyCone(this, 1100, 500, this.player, 50, 5, 10, 200);
    this.enemy6 = new EnemySpider(this, 1250, 400, this.player, 10, 5, 5, 200);

this.physics.add.collider(this.enemy1, this.platformLayer);
this.physics.add.collider(this.enemy2, this.platformLayer);
this.physics.add.collider(this.enemy3, this.platformLayer);
this.physics.add.collider(this.enemy4, this.platformLayer);
this.physics.add.collider(this.enemy5, this.platformLayer);
this.physics.add.collider(this.enemy6, this.platformLayer);



    // Déplacements aléatoires entre deux bornes X
    // Ajuste les bornes selon ton niveau
    if (this.enemy1.startPatrol) this.enemy1.startPatrol(700, 1000, 70);
    if (this.enemy2.startPatrol) this.enemy2.startPatrol(620, 1020, 70);
    if (this.enemy4.startPatrol) this.enemy4.startPatrol(720, 920, 70);
    if (this.enemy5.startPatrol) this.enemy5.startPatrol(820, 1120, 70);

    // PET
    this.pet = this.physics.add.sprite(this.player.x + 50, this.player.y, "img_perso");
    this.pet.setTint(0x00ff00);
    this.pet.body.allowGravity = false;
    this.petMode = "follow"; // "follow" = oscillation autour du joueur, "attack" = attaque ennemi
    this.petDamage = 1;      // damage per hit
    this.petRadius = 32;     // attack distance (px)
    this.petInterval = 500; // ms between damage ticks


    // PROJECTILES DU PET
    this.projectiles = this.physics.add.group(); // <--- C'est important !

    // Créer un groupe avec les ennemis existants
this.enemies = this.physics.add.group();
[this.enemy1, this.enemy2, this.enemy3, this.enemy4, this.enemy5, this.enemy6].forEach(e => {
  if (e) this.enemies.add(e);
});

// Overlap sécurisée
this.physics.add.overlap(this.projectiles, this.enemies, (proj, en) => {
  if (en && en.takeDamage) {
    en.takeDamage(1, this.pet);
  }
  if (proj && proj.destroy) proj.destroy();
});



    // Tir automatique du pet avec délai aléatoire 2s → 7s
this.petShootEvent = this.time.addEvent({
  delay: Phaser.Math.Between(2000, 7000),
  loop: true,
  callback: () => {
    // Chercher le plus proche ennemi actif
    let target = null;
    let minDist = 1000;
    [this.enemy1, this.enemy2, this.enemy3, this.enemy4, this.enemy5, this.enemy6].forEach(enemy => {
      if (enemy && enemy.active) {
        const dx = enemy.x - this.pet.x;
        const dy = enemy.y - this.pet.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < minDist) {
          minDist = dist;
          target = enemy;
        }
      }
    });

    if (target) {
      // Bloquer le pet temporairement
      const originalVelocityX = this.pet.body.velocity.x;
      const originalVelocityY = this.pet.body.velocity.y;
      this.pet.body.setVelocity(0);

      // Calculer angle et position de spawn du projectile
      const angle = Phaser.Math.Angle.Between(this.pet.x, this.pet.y, target.x, target.y);
      const offset = 20; // devant le pet
      const spawnX = this.pet.x + Math.cos(angle) * offset;
      const spawnY = this.pet.y + Math.sin(angle) * offset;

      // Créer le projectile
      const bullet = this.projectiles.create(spawnX, spawnY, "img_perso");
      bullet.setTint(0xffff00);
      bullet.setScale(0.5);
      this.physics.moveTo(bullet, target.x, target.y, 200);

      // Reprendre le mouvement du pet après 0.15s
      this.time.delayedCall(150, () => {
        this.pet.body.setVelocity(originalVelocityX, originalVelocityY);
      });
    }

    // Réajuster le délai
    this.petShootEvent.delay = Phaser.Math.Between(2000, 7000);
  }
});

// initialize per-enemy overlap state
this.enemies.getChildren().forEach(enemy => {
  enemy.isPetOverlapping = false;
  enemy.petDamageEvent = null;
});

// When the pet first overlaps an enemy, start a repeating damage event (if none yet)
this.physics.add.overlap(this.pet, this.enemies, (pet, enemy) => {
  // if no damage event is running for this enemy, create one
  if (!enemy.petDamageEvent) {
    const DAMAGE = this.petDamage;      // damage per tick
    const INTERVAL = this.petInterval; // ms between ticks (change to your X seconds)

    enemy.petDamageEvent = this.time.addEvent({
      delay: INTERVAL,
      loop: true,
      callback: () => {
        // safety checks: if enemy died, remove the event
        if (!enemy || !enemy.active) {
          if (enemy && enemy.petDamageEvent) {
            enemy.petDamageEvent.remove(false);
            enemy.petDamageEvent = null;
          }
          return;
        }
        const dist = Phaser.Math.Distance.Between(this.pet.x, this.pet.y, enemy.x, enemy.y);
if (dist <= this.petRadius) {
        if (enemy.takeDamage) enemy.takeDamage(DAMAGE, this.pet);
        // show floating damage text
const dmgText = this.add.text(enemy.x, enemy.y - 20, `-${this.petDamage}`, {
    fontSize: "14px",
    fill: "#ff4444",
    fontFamily: "Arial"
}).setOrigin(0.5).setDepth(10);

this.tweens.add({
    targets: dmgText,
    y: dmgText.y - 30,
    alpha: 0,
    duration: 600,
    onComplete: () => dmgText.destroy()
});
      }}
    });
  }

  // mark that we are currently overlapping this enemy
  enemy.isPetOverlapping = true;
});


this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
this.isPause = false;
this.pauseMenu = null; // interface de pause


this.input.keyboard.on('keydown-M', () => {
  if (this.petMode === "follow") {
    this.petMode = "attack";
    console.log("Pet déployé !");
  } else {
    this.petMode = "follow";
    console.log("Pet rappelé !");
  }
});





    // --- BARRES UI ---

// --- BARRES intérieures (dessinées en premier) ---
this.playerHealthBar = this.add.graphics().setScrollFactor(0);
this.playerManaBar = this.add.graphics().setScrollFactor(0);
this.playerXPBar = this.add.graphics().setScrollFactor(0);

// Texte Level
this.levelText = this.add.text(
    this.cameras.main.width / 2 + 10, // position à droite de la barre XP
    10, // alignement vertical avec la barre XP
    `Level ${this.playerLevel}`,
    {
        fontSize: "24px",
        fill: "#ffffff",
        fontFamily: "Arial",
        fontStyle: "bold"
    }
).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);


// --- CADRES (au-dessus) ---
this.cadreVie = this.add.image(20, 10, "cadre_vie").setOrigin(0, 0).setScrollFactor(0).setDepth(10).setScale(0.1);
this.cadreMana = this.add.image(20, 80, "cadre_mana").setOrigin(0, 0).setScrollFactor(0).setDepth(10).setScale(0.1);
this.cadreXP = this.add.image(this.cameras.main.width/2, 20, "cadre_xp").setOrigin(0.5, 0).setScrollFactor(0).setDepth(10).setScale(0.17);


// --- GOLD ---
this.goldIcon = this.add.image(this.cameras.main.width - 120, 20, "img_gold").setOrigin(0,0).setScrollFactor(0).setScale(1.5);
this.goldText = this.add.text(this.cameras.main.width - 15, 30, `${this.playerGold}`, {
    fontSize: "35px",
    fill: "#ffa41aff",
    fontFamily: "Arial"
}).setOrigin(1, 0).setScrollFactor(0);

// Initialiser les barres
this.updatePlayerHealthBar();
this.updatePlayerManaBar();
this.updatePlayerXPBar();


// Container pour les skills
this.skillUI = this.add.container(20, this.cameras.main.height - 100).setScrollFactor(0).setDepth(10);

// Texte des compétences
this.skillUIText = [];
for (let i = 0; i < this.skillKeys.length; i++) {
    let skill = this.skillKeys[i];
    let txt = this.add.text(0, i * 25, `${skill}: ${this.skills[skill]} / ${this.maxSkillLevel}`, {
        fontSize: "18px",
        fill: "#fff",
        fontFamily: "Arial"
    }).setOrigin(0, 0);
    this.skillUI.add(txt);
    this.skillUIText.push(txt);
}

// Points disponibles
this.skillPointsUI = this.add.text(0, this.skillKeys.length * 25 + 5, `Points à dépenser: ${this.skillPoints}`, {
    fontSize: "16px",
    fill: "#0f0",
    fontFamily: "Arial"
}).setOrigin(0, 0);
this.skillUI.add(this.skillPointsUI);



    
  }

  update() {
// Toggle pause avec L
if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
    this.isPause = !this.isPause;

    if (this.isPause) {
        this.physics.world.pause(); // stoppe toute la physique
        this.time.paused = true;    // stoppe les timers
        this.showPauseMenu();
    } else {
        this.physics.world.resume(); // reprend la physique
        this.time.paused = false;    // reprend les timers
        this.hidePauseMenu();
    }
}

// Si en pause, bloquer le reste du update
if (this.isPause) return;

  if (!this.player || !this.player.body) return;
  if (this.gameOver) return;

  // --- PLAYER ---
  if (this.clavier.left.isDown) {
    this.player.setVelocityX(-120);
    this.player.anims.play("anim_tourne_gauche", true);
  } else if (this.clavier.right.isDown) {
    this.player.setVelocityX(120);
    this.player.anims.play("anim_tourne_droite", true);
  } else {
    this.player.setVelocityX(0);
    this.player.anims.play("anim_face");
  }
  if (this.clavier.up.isDown && this.player.body.blocked.down) {
    this.player.setVelocityY(-160);
  }

  // --- PET ---
  if (!this.pet || !this.pet.body) return;

  const speed = 120;
  const detectionRadius = 150;

  // trouve ennemi le plus proche
  let closestEnemy = null;
  let minDist = detectionRadius;
  this.enemies.getChildren().forEach(enemy => {
    if (enemy && enemy.active) {
      const dist = Phaser.Math.Distance.Between(this.pet.x, this.pet.y, enemy.x, enemy.y);
      if (dist < minDist) {
        minDist = dist;
        closestEnemy = enemy;
      }
    }
  });

  if (this.petMode === "attack" && closestEnemy) {
    // garde ton moveToObject + seuil pour éviter jitter
    const dist = Phaser.Math.Distance.Between(this.pet.x, this.pet.y, closestEnemy.x, closestEnemy.y);
    if (dist > 12) {
      this.physics.moveToObject(this.pet, closestEnemy, speed);
    } else {
      this.pet.body.setVelocity(0, 0);
    }
  } else {
    // mode follow → réutilise ton oscillation
    let targetX, targetY;
    if (this.clavier.right.isDown) {
      targetX = this.player.x + 40;
      targetY = this.player.y - 40;
    } else if (this.clavier.left.isDown) {
      targetX = this.player.x - 40;
      targetY = this.player.y - 40;
    } else {
      if (!this.oscAngle) this.oscAngle = 0;
      this.oscAngle += 0.025;
      targetX = this.player.x + Math.sin(this.oscAngle) * 20;
      targetY = this.player.y - 40;
    }

    const dist = Phaser.Math.Distance.Between(this.pet.x, this.pet.y, targetX, targetY);
    if (dist > 6) {
      this.physics.moveTo(this.pet, targetX, targetY, speed);
    } else {
      this.pet.body.setVelocity(0, 0);
      this.pet.x = targetX;
      this.pet.y = targetY;
    }
  }

  // --- CLEANUP DAMAGE EVENTS ---
  this.enemies.getChildren().forEach(enemy => {
    if (enemy.petDamageEvent && !this.physics.overlap(this.pet, enemy)) {
      enemy.petDamageEvent.remove(false);
      enemy.petDamageEvent = null;
      enemy.isPetOverlapping = false;
    }
  });
}


  updatePlayerHealthBar() {
    const width = 235; // à ajuster selon ton cadre
    const height = 20;
    const x = 20 + 50; // décalage intérieur
    const y = 30;

    this.playerHealthBar.clear();
    this.playerHealthBar.fillStyle(0xff0000);
    this.playerHealthBar.fillRect(x, y, (this.playerHealth / this.playerMaxHealth) * width, height);
}

updatePlayerManaBar() {
     const width = 235; // à ajuster selon ton cadre
    const height = 20;
    const x = 20 + 50; // décalage intérieur
    const y = 100;

    this.playerManaBar.clear();
    this.playerManaBar.fillStyle(0x0000ff);
    this.playerManaBar.fillRect(x, y, (this.playerMana / 100) * width, height); // maxMana = 100
}

xpForNextLevel = (level) => {
    return Math.floor(this.baseXP * Math.pow(this.growth, level - 1));
};



updatePlayerXPBar() {
    const width = 450;
    const height = 30;
    const x = this.cameras.main.width / 2 - width/2 + 60;
    const y = 55;

    const xpNeeded = this.xpForNextLevel(this.playerLevel);
    this.playerXPBar.clear();
    this.playerXPBar.fillStyle(0x00ff00);
    this.playerXPBar.fillRect(x, y, (this.playerXP / xpNeeded) * width, height);
}




  playerDeath() {
    
    // NE PAS détruire le player, juste pauser
    this.physics.pause();
    
    
    // Afficher un message de game over
    this.add.text(400, 300, 'GAME OVER', { 
        fontSize: '32px', 
        fill: '#ff0000',
        fontFamily: 'Arial'
    }).setOrigin(0.5);
    
    
    // Redémarrer la scène après 2 secondes
    this.time.delayedCall(2000, () => {
        this.scene.restart();
    });
    
    
}


updateSkillUI(index) {
    const skill = this.skillKeys[index];
    if (this.skillUIText && this.skillUIText[index])
        this.skillUIText[index].setText(`${skill}: ${this.skills[skill]} / ${this.maxSkillLevel}`);
    if (this.skillMenuTexts && this.skillMenuTexts[index])
        this.skillMenuTexts[index].setText(`${skill}: ${this.skills[skill]} / ${this.maxSkillLevel}`);
    if (this.skillPointsUI) this.skillPointsUI.setText(`Points à dépenser: ${this.skillPoints}`);
    if (this.skillPointsText) this.skillPointsText.setText(`Points à dépenser: ${this.skillPoints}`);
}


playerRespawn() {
    // Réinitialiser la vie
    this.playerHealth = this.playerMaxHealth;
    this.updatePlayerHealthBar();
    
    // Repositionner le joueur à sa position initiale
    this.player.setPosition(100, 450);
    this.player.setVelocity(0, 0);
    this.player.setAlpha(1);
    
    // Redémarrer la physique si elle était en pause
    this.physics.resume();
    
    // Réinitialiser le flag gameOver
    this.gameOver = false;
    
    // Optionnel : donner une invincibilité temporaire
    this.player.setTint(0x888888); // Gris pour montrer l'invincibilité
    this.time.delayedCall(2000, () => {
        this.player.clearTint(); // Remettre la couleur normale
    });
}

// Nouvelle méthode dans selection.js
// Dans selection.js, remplacez takeDamage() par :
perdreVie() {
    // Éviter les dégâts multiples
    if (this.invulnerable) return;
    
    this.playerHealth--;
    this.updatePlayerHealthBar();
    
    
    if (this.playerHealth > 0) {
        // Repositionner le joueur (optionnel)
        // this.player.setPosition(100, 450);
        
        // Invulnérabilité temporaire
        this.invulnerable = true;
        // S'assurer que le joueur reste visible et actif
        if (this.player) {
            if (!this.player.body) {
                // Réactiver le corps physique si absent
                this.physics.world.enable(this.player);
            }
            this.player.setVisible(true);
            this.player.setActive(true);
            this.player.setAlpha(1);
            if (this.player.body) this.player.body.enable = true;
            // Forcer une frame/anim valide au cas où
            if (this.player.anims && this.anims.exists('anim_face')) {
                this.player.anims.play('anim_face');
            } else if (this.player.setFrame) {
                this.player.setFrame(4);
            }
        }
        this.player.setTint(0xff9999); // Teinte rouge pour montrer l'invulnérabilité
        
        this.time.delayedCall(1000, () => {
            this.invulnerable = false;
            this.player.clearTint();
        });
        
        
    } else {
        // Game over (une seule fois)
        if (this.gameOver) return;
        this.gameOver = true;
        // Stopper toute action de jeu
        if (this.petShootEvent) this.petShootEvent.remove(false);
        this.physics.pause();
        // Désactiver entités et nettoyer projectiles
        if (this.enemy1) this.enemy1.setActive(false).setVisible(false);
        if (this.enemy2) this.enemy2.setActive(false).setVisible(false);
        if (this.enemy4) this.enemy2.setActive(false).setVisible(false);
        if (this.enemy5) this.enemy2.setActive(false).setVisible(false);
        if (this.projectiles) this.projectiles.clear(true, true);
        if (this.enemy1?.projectiles) this.enemy1.projectiles.clear(true, true);
        if (this.enemy2?.projectiles) this.enemy2.projectiles.clear(true, true);
        if (this.enemy4?.projectiles) this.enemy4.projectiles.clear(true, true);
        if (this.enemy5?.projectiles) this.enemy5.projectiles.clear(true, true);
        if (this.player) this.player.setTint(0xff0000);
        this.add.text(400, 300, 'GAME OVER', { 
            fontSize: '32px', 
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        // Redémarrer après 1.5s
        this.time.delayedCall(1500, () => {
            this.scene.restart();
        });
        
        
    }
    

    
}



showPauseMenu() {
    // Exemple simple : un rectangle + texte
    this.pauseMenu = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY);

    const bg = this.add.rectangle(0, 0, 300, 200, 0x000000, 0.7);
    const txt = this.add.text(0, -50, "Pause Menu", { fontSize: "24px", fill: "#fff" }).setOrigin(0.5);

    

    this.pauseMenu.setDepth(1000); // pour passer au-dessus de tout


    this.skillPointsText = this.add.text(0, 80, `Points à dépenser: ${this.skillPoints}`, {
    fontSize: "20px",
    fill: "#0f0",
    fontFamily: "Arial"
}).setOrigin(0.5);
this.pauseMenu.add(this.skillPointsText);

    // Menu Skills
this.skillMenuTexts = [];

for (let i = 0; i < this.skillKeys.length; i++) {
    let skill = this.skillKeys[i];
    let yPos = -50 + i * 40; // espacement vertical

    let txt = this.add.text(0, yPos, `${skill}: ${this.skills[skill]} / ${this.maxSkillLevel}`, {
        fontSize: "20px",
        fill: "#fff",
        fontFamily: "Arial"
    }).setOrigin(0.5);
    
    this.skillMenuTexts.push(txt);
    this.pauseMenu.add(txt);
}

// Indicateur de sélection
this.skillSelector = this.add.text(-120, -50 + this.selectedSkillIndex * 40, "→", {
    fontSize: "20px",
    fill: "#ff0"
}).setOrigin(0.5);
this.pauseMenu.add(this.skillSelector);

}

hidePauseMenu() {
    if (this.pauseMenu) {
        this.pauseMenu.destroy(true);
        this.pauseMenu = null;
    }
}




}
