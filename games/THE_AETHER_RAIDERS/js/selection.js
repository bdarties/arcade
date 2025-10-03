import * as fct from "./fonctions.js";
import EnemyParabolic from "../src/enemy1.js";
import EnemyCone from "../src/enemy2.js";
import EnemySpider from "../src/enemy3.js";
import EnemyBowling from "../src/enemy4.js";
import Tesla from '../src/Tesla.js';

export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });
    this.playerHealth = 50;
    this.playerMaxHealth = 50;

    this.degatPlayerCorpsAcorps = 2;

    this.baseXP = 10;
    this.growth = 1.2;
    this.playerLevel = 0;
    this.playerXP = 0;

    this.gunFireRate = 500; // ms entre 2 tirs par défaut
this.gunRange = 370;    // portée par défaut
this.lastShotTime = 0;  // timestamp du dernier tir
this.playerSpeed = 120;         // vitesse horizontale de base
    this.playerJump = 160;          // saut de base
    this.hasDash = false;           // dash désactivé
    this.hasJetpack = false;        // jetpack désactivé
    this.dashManaCost = 5;          // coût du dash
    this.jetpackManaCost = 5; 


    // Branches de compétences
    this.skills = {
        Armes: 0,
        Survie: 0,
        Mobilité: 0
    };
    this.weaponModes = ['melee'];
    if (this.skills.Armes >= 1) this.weaponModes.push('gun');
    // Pour une troisième arme plus tard :
    // if (this.skills.Mobilité >= 4) this.weaponModes.push('jetpack');
    this.selectedWeaponIndex = 0;


    this.maxSkillLevel = 5;
    this.skillPoints = 0; // Points disponibles à dépenser
    this.selectedSkillIndex = 0; // Pour naviguer dans le menu
    this.skillKeys = ["Armes", "Survie", "Mobilité"];

  }

  

  preload() {
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);

    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');


    this.load.spritesheet("img_perso", "./assets/dude.png", {
      frameWidth: 32,
      frameHeight: 70
    });
    this.load.spritesheet("img_perso_arme", "./assets/dudegun.png", {
      frameWidth: 32,
      frameHeight: 70
    });

    this.load.image("img_enemy", "./assets/enemy.png");
    this.load.image("img_enemy1", "./assets/enemy1.png");
    this.load.image("img_enemy2", "./assets/enemy2.png");
    this.load.spritesheet("img_enemy3", "./assets/enemy3.png", {
      frameWidth: 32,
      frameHeight: 32
    });

    this.load.spritesheet("tesla", "./assets/tesla.png", {
      frameWidth: 160,
      frameHeight: 128
    });


    this.load.image("bullet_tesla", "./assets/bullet_tesla.png");
    this.load.image("tir_enemy", "./assets/tirenemy.png");
    this.load.image("tir_perso", "./assets/bullet_perso.png");


    this.load.image("img_potion", "./assets/fiole.png");
    this.load.image("img_gold", "./assets/engrenage.png");
    this.load.image("fleche", "./assets/fleche.png");
    this.load.image("title", "./assets/title.png");


    this.load.image("cadre_mana", "./assets/barre_mana.png");
    this.load.image("cadre_xp", "./assets/barre_xp.png");
    this.load.image("cadre_vie", "./assets/barre_vie.png");
    this.load.image("skills", "./assets/page_skills.jpg");

    this.load.tilemapTiledJSON("map1", "./src/map/map1.json");
    this.load.image("tiles1", "./src/map/background_1.png");
  this.load.image("tiles2", "./src/map/sol_prairie.png");
  this.load.image("tiles3", "./src/map/vegetation.png");
  this.load.image("tiles4", "./src/map/bat_1.png");
  this.load.image("tiles5", "./src/map/bat_2.png");
  this.load.image("tiles6", "./src/map/background_3.png");
  this.load.image("tiles7", "./src/map/dirigeable.png");
  this.load.image("tiles8", "./src/map/ruine.png");
  this.load.image("tiles9", "./src/map/background_2.png");
  this.load.image("tiles10", "./src/map/sol_meca.png");
  this.load.image("tiles11", "./src/map/sol_mine.png");



this.load.image("boutonControles", "./assets/boutoncontroles.png");
    this.load.image("boutonJouer", "./assets/boutonjouer.png");
    this.load.image("boutonSkills", "./assets/skills.png");


  // icônes
    this.load.image("vide", "./assets/vide.png");
    this.load.image("poing", "./assets/poing.png");
    this.load.image("gun", "./assets/gun.png");
    this.load.image("jetpack", "./assets/jetpack.png");

    // cadres
    this.load.image("cadre", "./assets/cadre.png");
    this.load.image("cadreselect", "./assets/cadreselect.png");

    //skills
    this.load.image("skill_1", "./assets/skill_1.png");
    this.load.image("skill_2", "./assets/skill_2.png");
    this.load.image("skill_3", "./assets/skill_3.png");


    this.load.spritesheet("img_pet", "./assets/pet.png", {
      frameWidth: 40,
      frameHeight: 60
    });






    //SONS
    this.load.audio("musiqueMap1", "./assets/musique_sfx/musiquemap1.mp3");
    this.load.audio("musiqueMap2", "./assets/musique_sfx/musiquemap2.mp3");

    this.load.audio("pickup", "./assets/musique_sfx/pickup.mp3");
    this.load.audio("reload", "./assets/musique_sfx/reload.mp3");
    this.load.audio("shot", "./assets/musique_sfx/shot.mp3");
    this.load.audio("grass", "./assets/musique_sfx/grass.mp3");
    this.load.audio("walk", "./assets/musique_sfx/walk.mp3");
    this.load.audio("whoosh", "./assets/musique_sfx/whoosh.mp3");
    this.load.audio("hit", "./assets/musique_sfx/hit.mp3");
    this.load.audio("skill", "./assets/musique_sfx/skill.mp3");
    this.load.audio("sfxOwl", "./assets/musique_sfx/owl.mp3");
    this.load.audio("ouch", "./assets/musique_sfx/ouch.mp3");
    this.load.audio("mdr", "./assets/musique_sfx/mdr.mp3");

    this.load.audio("select", "./assets/musique_sfx/select.mp3");
    this.load.audio("click", "./assets/musique_sfx/click.mp3");
    
  }

  create() {
WebFont.load({
        custom: {
            families: ['The Sign Shop'],  // nom de la font
            urls: ['./assets/TheCrowInlineShadowGrunge.css'] // optionnel si tu as un fichier css @font-face
        },
    });

    const centerX = this.cameras.main.width / 2;
  const centerY = this.cameras.main.height / 2;

  //SONS
  this.sfxGrass = this.sound.add("grass", { volume: 0.5, loop: true });
this.sfxWalk = this.sound.add("walk", { volume: 0.5, loop: true });
this.whoosh = this.sound.add('whoosh', { volume: 0.5, loop: false });
this.pickup = this.sound.add('pickup', { volume: 0.5, loop: false });
this.shot = this.sound.add('shot', { volume: 0.5, loop: false });
this.hit = this.sound.add('hit', { volume: 0.5, loop: false });
this.click = this.sound.add('click', { volume: 0.5, loop: false });
this.select = this.sound.add('select', { volume: 0.5, loop: false });
this.skill = this.sound.add('skill', { volume: 0.5, loop: false });
this.sfxOwl = this.sound.add("sfxOwl", { volume: 0.8, loop: false });
this.mdr = this.sound.add("mdr", { volume: 5, loop: false });

    
    // ÉTAT DE SCÈNE
    this.gameOver = false;
    // Réinitialiser la vie au (re)démarrage de la scène
    this.playerHealth = this.playerMaxHealth;

    // MONDE + PLATEFORMES
    const map = this.make.tilemap({ key: "map1" }); 
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    
    const tileset1 = map.addTilesetImage("Background map 1 extend", "tiles1");
  const tileset2 = map.addTilesetImage("ea489fd3-6071-4143-aed7-fd1d786891b5", "tiles2");
  const tileset3 = map.addTilesetImage("36b0c958-0079-4b22-8533-efb9bb43834a (1)", "tiles3");
  const tileset4 = map.addTilesetImage("9ad85738-bd94-4c71-ad80-97265cec83d5", "tiles4");
  const tileset5 = map.addTilesetImage("e517bb53-ba6b-4c48-ab4b-31422e1ece67", "tiles5");
  const tileset6 = map.addTilesetImage("Background map 3 extend", "tiles6");
  const tileset7 = map.addTilesetImage("dirigeable", "tiles7");
  const tileset8 = map.addTilesetImage("f7ab0909-1e05-4e07-b6b9-1385aefbf71a", "tiles8");
  const tileset9 = map.addTilesetImage("Background map 2 extend", "tiles9");
  const tileset10 = map.addTilesetImage("sol_meca", "tiles10");
  const tileset11 = map.addTilesetImage("82c71d7a-b3ba-4494-b2d4-4e3449d95bdd", "tiles11");
    
    // Créer les calques
    map.createLayer("background_layer", [tileset1, tileset2, tileset3, tileset4, tileset5, tileset6, tileset7, tileset8, tileset9, tileset10, tileset11], 0, 0);
    map.createLayer("background_2_layer", [tileset1, tileset2, tileset3, tileset4, tileset5, tileset6, tileset7, tileset8, tileset9, tileset10, tileset11], 0, 0);
    this.platformLayer = map.createLayer(
  "platform_layer",
  [tileset1, tileset2, tileset3, tileset4, tileset5, tileset6, tileset7, tileset8, tileset9, tileset10, tileset11],
  0,
  0
);
this.platformLayer.setCollisionByProperty({ dur: true });
map.createLayer("ladder_layer", [tileset1, tileset2, tileset3, tileset4, tileset5, tileset6, tileset7, tileset8, tileset9, tileset10, tileset11], 0, 0);
    map.createLayer("decoration_back_layer", [tileset1, tileset2, tileset3, tileset4, tileset5, tileset6, tileset7, tileset8, tileset9, tileset10, tileset11], 0, 0);
    
    // Activer collisions sur tuiles ayant la propriété { dur: true }
    this.platformLayer.setCollisionByProperty({ dur: true });


    // PLAYER
this.player = this.physics.add.sprite(100, 700, "img_perso");
this.player.setBounce(0.2);
this.player.setCollideWorldBounds(false);
this.player.hasWeapon = false;

// Créer un mur invisible à gauche et droite
const leftWall = this.add.rectangle(0, map.heightInPixels / 2, -2, map.heightInPixels);
this.physics.add.existing(leftWall, true); // true = statique
this.physics.add.collider(this.player, leftWall);

const rightWall = this.add.rectangle(3680, map.heightInPixels / 2, -2, map.heightInPixels);
this.physics.add.existing(rightWall, true); // true = statique
this.physics.add.collider(this.player, rightWall);


// CAMÉRA
this.cameras.main.startFollow(this.player);
this.cameras.main.setFollowOffset(0, 210);
this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

this.playerGold = 0;


  // --- Injecter CSS si pas déjà présent ---
  if (!document.getElementById('hud-level-style')) {
    const style = document.createElement('style');
    style.id = 'hud-level-style';
    style.textContent = `
      .hud-level {
        position: absolute;
        top: 100px;
        left: 51%;
        transform: translateX(-50%);
        pointer-events: none;
        z-index: 9999;
        isolation: isolate;
        font-family: 'The Sign Shop', sans-serif;
        font-size: 64px;
        font-weight: 700;
        text-align: center;
        line-height: 1;
      }
        
.hud-level .level-outline {
  color: transparent; /* pas de couleur, que du stroke */
  -webkit-text-stroke: 4px rgba(49, 22, 0, 0.8); /* contour net */
  
  filter: drop-shadow(3px 3px 5px rgba(0,0,0,0.6));
  position: absolute;
  left: 0;
  top: 0;
  z-index: 0;
}
      .hud-level .level-base {
  color: #ffffffff; /* Base blanche → garde la texture du font */
  filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.6));
  display: block;
  position: relative;
  filter: invert(1);
  z-index: 1;
}

.hud-level .level-grad {
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
  display: block;
  z-index: 2;
  background: linear-gradient(to bottom, rgba(255, 184, 104, 1), rgba(120,60,20,1));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent; /* important */
  mix-blend-mode: lighten; /* ou try multiply / screen / soft-light */
  opacity: 1;
  
  pointer-events: none;
}

    `;
    document.head.appendChild(style);
  }

  // --- Créer le container HUD ---
  let hud = document.getElementById('hud-level');
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'hud-level';
    hud.className = 'hud-level';
    hud.innerHTML = `
      <span class="level-outline">Level ${this.playerLevel}</span>
      <span class="level-base">Level ${this.playerLevel}</span>
      <span class="level-grad">Level ${this.playerLevel}</span>
    `;
    hud.style.display = 'none'; // caché par défaut
    document.body.appendChild(hud);
  }

  // Montrer en jeu
  hud.style.display = '';

  // Fonction pour mettre à jour le texte quand le joueur monte de level
  this.updateHUD = (level) => {
    hud.querySelector('.level-outline').textContent = `Level ${level}`;
    hud.querySelector('.level-base').textContent = `Level ${level}`;
    hud.querySelector('.level-grad').textContent = `Level ${level}`;
  };

  // Nettoyer quand la scène est quittée
  this.events.once('shutdown', () => {
    hud.style.display = 'none';
  });

  // --- Injecter CSS pour les points (séparé du Level) ---
if (!document.getElementById('hud-points-style')) {
  const style = document.createElement('style');
  style.id = 'hud-points-style';
  style.textContent = `
    .hud-points {
      position: absolute;
      bottom: 40px; /* Ajuster selon ton Level */
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
      z-index: 9999;
      isolation: isolate;
      font-size: 30px;
      font-family: 'The Sign Shop', sans-serif;
      font-weight: 700;
      text-align: center;
      line-height: 1.2;
    }

    .hud-points .points-outline {
      color: transparent;
      -webkit-text-stroke: 3px rgba(49,22,0,0.8);
      position: absolute;
      left: 0;
      top: 0;
      z-index: 0;
      filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.5));
    }
    .hud-points .points-base {
      color: #fff;
      position: relative;
      z-index: 1;
      filter: invert(1);
      display: block;
    }
    .hud-points .points-grad {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      z-index: 2;
      background: linear-gradient(to bottom, rgba(255,184,104,1), rgba(120,60,20,1));
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      mix-blend-mode: lighten;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

// --- Créer le container pour les points ---
let hudPoints = document.getElementById('hud-points');
if (!hudPoints) {
  hudPoints = document.createElement('div');
  hudPoints.id = 'hud-points';
  hudPoints.className = 'hud-points';
  hudPoints.innerHTML = `
    <span class="points-outline">Points: ${this.skillPoints}</span>
    <span class="points-base">Points: ${this.skillPoints}</span>
    <span class="points-grad">Points: ${this.skillPoints}</span>
  `;
  hudPoints.style.display = 'none';
  document.body.appendChild(hudPoints);
}

// --- Montrer en jeu ---
hudPoints.style.display = '';

// --- Fonction pour mettre à jour les points ---
this.updatePointsHUD = (points) => {
  hudPoints.querySelector('.points-outline').textContent = `Points: ${points}`;
  hudPoints.querySelector('.points-base').textContent = `Points: ${points}`;
  hudPoints.querySelector('.points-grad').textContent = `Points: ${points}`;
};



// --- Injecter CSS pour le HUD Skills ---
if (!document.getElementById('hud-skills-style')) {
  const style = document.createElement('style');
  style.id = 'hud-skills-style';
  style.textContent = `
    .hud-skills {
      position: absolute;
      bottom: 150px; /* positionne en haut de la page Skills */
      left: 250px;
      pointer-events: none;
      z-index: 9999;
      isolation: isolate;
      font-size: 70px;
      font-family: 'The Sign Shop', sans-serif;
      font-weight: 700;
      text-align: right;
      line-height: 1.2;
      display: none;
    }

    .hud-skills .skills-outline {
      color: transparent;
      -webkit-text-stroke: 3px rgba(49,22,0,0.8);
      position: absolute;
      left: 0;
      top: 0;
      z-index: 0;
      filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.6));
    }

    .hud-skills .skills-base {
      color: #fff;
      position: relative;
      z-index: 1;
      filter: invert(1);
      display: block;
    }

    .hud-skills .skills-grad {
      position: absolute;
      left: 0; right: 0; top: 0; bottom: 0;
      z-index: 2;
      background: linear-gradient(to bottom, rgba(255,184,104,1), rgba(120,60,20,1));
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      mix-blend-mode: lighten;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

// --- Créer le container HUD Skills ---
let hudSkills = document.getElementById('hud-skills');
if (!hudSkills) {
  hudSkills = document.createElement('div');
  hudSkills.id = 'hud-skills';
  hudSkills.className = 'hud-skills';
  hudSkills.innerHTML = `
    <span class="skills-outline">Points: ${this.skillPoints}</span>
    <span class="skills-base">Points: ${this.skillPoints}</span>
    <span class="skills-grad">Points: ${this.skillPoints}</span>
  `;
  hudSkills.style.display = 'none'; // caché par défaut
  document.body.appendChild(hudSkills);
}

// --- Afficher quand on ouvre la page des Skills ---
hudSkills.style.display = '';

// --- Fonction pour mettre à jour ---
this.updateSkillsHUD = (points) => {
  hudSkills.querySelector('.skills-outline').textContent = `Points: ${points}`;
  hudSkills.querySelector('.skills-base').textContent = `Points: ${points}`;
  hudSkills.querySelector('.skills-grad').textContent = `Points: ${points}`;
};


// --- Créer le container HUD Gold ---
let hudGold = document.getElementById('hud-gold');
if (!hudGold) {
  hudGold = document.createElement('div');
  hudGold.id = 'hud-gold';
  hudGold.className = 'hud-gold';
  hudGold.innerHTML = `
    <span class="gold-outline">${this.playerGold}</span>
    <span class="gold-base">${this.playerGold}</span>
    <span class="gold-grad">${this.playerGold}</span>
  `;
  hudGold.style.display = 'none';
  document.body.appendChild(hudGold);
}

// --- CSS pour le HUD Gold ---
if (!document.getElementById('hud-gold-style')) {
  const style = document.createElement('style');
  style.id = 'hud-gold-style';
  style.textContent = `
    .hud-gold {
      position: absolute;
      top: 50px;
      right: 20px;
      pointer-events: none;
      z-index: 9999;
      isolation: isolate;
      font-family: Arial, sans-serif;
      font-weight: 700;
      text-align: right;
      line-height: 1;
    }

    /* Contour */
    .hud-gold .gold-outline {
      color: transparent;
      -webkit-text-stroke: 3px rgba(49,22,0,0.8);
      position: absolute;
      right: 0;
      top: 0;
      z-index: 0;
      filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.5));
      font-size: 35px;
    }

    /* Base */
    .hud-gold .gold-base {
      color: #fff;
      position: relative;
      z-index: 1;
      filter: invert(1);
      display: block;
      font-size: 35px;
    }

    /* Gradient */
    .hud-gold .gold-grad {
      position: absolute;
      right: 0;
      top: 0;
      z-index: 2;
      background: linear-gradient(to bottom, #ffd700, #ffa41a);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      mix-blend-mode: lighten;
      pointer-events: none;
      font-size: 35px;
    }
  `;
  document.head.appendChild(style);
}

// --- Montrer HUD Gold ---
hudGold.style.display = '';

// --- Fonction pour mettre à jour l’or ---
this.updateGoldHUD = (gold) => {
  hudGold.querySelector('.gold-outline').textContent = `${gold}`;
  hudGold.querySelector('.gold-base').textContent = `${gold}`;
  hudGold.querySelector('.gold-grad').textContent = `${gold}`;
};




// EMPÊCHER la désactivation automatique
this.player.setDataEnabled();
this.player.setData('invulnerable', false);

// Note: ne pas override setActive; cela peut provoquer des états inattendus

    // ANIMATIONS (créer une seule fois)
    if (!this.anims.get("anim_face")) {
      this.anims.create({
        key: "anim_tourne_gauche",
        frames: this.anims.generateFrameNumbers("img_perso", { start: 0, end: 4 }),
        frameRate: 10,
        repeat: -1
      });
      this.anims.create({
        key: "anim_face_gauche",
        frames: [{ key: "img_perso", frame: 5 }],
        frameRate: 10
      });
      this.anims.create({
        key: "anim_face_droite",
        frames: [{ key: "img_perso", frame: 6 }],
        frameRate: 10
      });
      this.anims.create({
        key: "anim_tourne_droite",
        frames: this.anims.generateFrameNumbers("img_perso", { start: 7, end: 11 }),
        frameRate: 10,
        repeat: -1
      });
      this.anims.create({
        key: "anim_saut_droite",
        frames: [{ key: "img_perso", frame: 12 }],
        frameRate: 10
      });
      this.anims.create({
        key: "anim_saut_gauche",
        frames: [{ key: "img_perso", frame: 13 }],
        frameRate: 10
      });


      // Animations armées
      this.anims.create({
        key: "anim_tourne_gauche_arme",
        frames: this.anims.generateFrameNumbers("img_perso_arme", { start: 0, end: 4 }),
        frameRate: 10,
        repeat: -1
      });
      this.anims.create({
        key: "anim_face_gauche_arme",
        frames: [{ key: "img_perso_arme", frame: 5 }],
        frameRate: 10
      });
      this.anims.create({
        key: "anim_face_droite_arme",
        frames: [{ key: "img_perso_arme", frame: 6 }],
        frameRate: 10
      });
      this.anims.create({
        key: "anim_tourne_droite_arme",
        frames: this.anims.generateFrameNumbers("img_perso_arme", { start: 7, end: 11 }),
        frameRate: 10,
        repeat: -1
      });
      this.anims.create({
        key: "anim_saut_droite_arme",
        frames: [{ key: "img_perso_arme", frame: 12 }],
        frameRate: 10
      });
      this.anims.create({
        key: "anim_saut_gauche_arme",
        frames: [{ key: "img_perso_arme", frame: 13 }],
        frameRate: 10
      });



      this.anims.create({
        key: "anim_pet_gauche",
        frames: this.anims.generateFrameNumbers("img_pet", { start: 0, end: 3 }),
        frameRate: 20,
        repeat: -1
      });
      this.anims.create({
        key: "anim_pet_droite",
        frames: this.anims.generateFrameNumbers("img_pet", { start: 4, end: 7 }),
        frameRate: 20,
        repeat: -1
      });


      
    }

    //ANIMATIONS ENNEMIS

    //SPIDER
  // Côté droit
this.anims.create({
  key: "spider_idle_right",
  frames: [ { key: "img_enemy3", frame: 0 } ],
  frameRate: 1,
  repeat: -1
});
this.anims.create({
  key: "spider_crouch_right",
  frames: [ { key: "img_enemy3", frame: 1 } ],
  frameRate: 1,
  repeat: -1
});
this.anims.create({
  key: "spider_jump_right",
  frames: [ { key: "img_enemy3", frame: 2 } ],
  frameRate: 1,
  repeat: -1
});

// Côté gauche
this.anims.create({
  key: "spider_idle_left",
  frames: [ { key: "img_enemy3", frame: 5 } ],  // frame 6
  frameRate: 1,
  repeat: -1
});
this.anims.create({
  key: "spider_crouch_left",
  frames: [ { key: "img_enemy3", frame: 4 } ],  // frame 5
  frameRate: 1,
  repeat: -1
});
this.anims.create({
  key: "spider_jump_left",
  frames: [ { key: "img_enemy3", frame: 3 } ],  // frame 4
  frameRate: 1,
  repeat: -1
});



    // CLAVIER
    this.clavier = this.input.keyboard.createCursorKeys();
    this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
this.isDashing = false;




    
// Cooldown d’attaque
this.canAttack = true;

this.input.keyboard.on('keydown-O', () => {
    if (!this.player || !this.canAttack) return;

    if (this.attackMode === 'melee') {
  this.attackMelee();
} else if (this.attackMode === 'gun' && this.skills.Armes >= 1) {
  this.attackGun();
}
// Si tu ajoutes une troisième arme, ajoute un else if ici

});














    this.playerMana = 0;
    this.gainXP = (amount) => {
    this.playerXP += amount;
    console.log(`XP +${amount} → total: ${this.playerXP}`);

    // Boucle pour gérer plusieurs niveaux si on dépasse
while (this.playerXP >= this.xpForNextLevel(this.playerLevel)) {
    this.playerXP -= this.xpForNextLevel(this.playerLevel);
    this.playerLevel++;

    // 🔥 Utiliser la fonction qui met à jour le HUD HTML
    if (this.updateHUD) {
        this.updateHUD(this.playerLevel);
    }



    // Ajouter un point d'amélioration
    this.skillPoints++;
    this.playerHealth = this.playerMaxHealth;
    this.updatePlayerHealthBar();

    // **Mettre à jour toutes les UI**
    for (let i = 0; i < this.skillKeys.length; i++) {
        this.updateSkillUI(i);
        this.updatePointsHUD(this.skillPoints);
        this.updateSkillsHUD(this.skillPoints);
    }
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
    this.pickup.play();
    this.playerGold += amount;
    console.log(`Gold +${amount} → total: ${this.playerGold}`);
    this.updateGoldHUD(this.playerGold)
});



    


    // COLLISIONS PLAYER
    this.physics.add.collider(this.player, this.platformLayer);
    this.invulnerable = false;

    // ENNEMIS
    this.enemy0 = new EnemyParabolic(this, 1500, 500, this.player, 2, 1, 1, 200);
    this.enemy1 = new EnemyParabolic(this, 1700, 500, this.player, 2, 1, 1, 200);
    this.enemy2 = new EnemyParabolic(this, 1900, 500, this.player, 2, 1, 1, 200);
    this.enemy3 = new EnemySpider(this, 3050, 400, this.player, 10, 5, 5, 200);
    this.enemy4 = new EnemyParabolic(this, 2800, 500, this.player, 2, 1, 1, 200);
    this.enemy5 = new EnemySpider(this, 1800, 400, this.player, 10, 5, 5, 200);
    this.enemy6 = new EnemyParabolic(this, 2500, 400, this.player, 10, 5, 5, 200);
    this.enemy7 = new EnemyParabolic(this, 2200, 500, this.player, 2, 1, 1, 200);
    this.enemy8 = new EnemyParabolic(this, 3050, 400, this.player, 10, 5, 5, 200);
    this.enemy9 = new EnemyParabolic(this, 2700, 400, this.player, 10, 5, 5, 200);

    this.enemy10 = new EnemyCone(this, 1000, 1900, this.player, 50, 5, 10, 200);
    this.enemy11 = new EnemyCone(this, 2000, 1900, this.player, 50, 5, 10, 200);
    this.enemy12 = new EnemyBowling(this, 500, 1900, this.player, 20, 1000, 1000, 1200);



    this.tesla1 = new Tesla(this, 600, 1200, this.player);
    this.add.existing(this.tesla1);

    // Ajouter collision entre le joueur et la Tesla (facultatif si tu veux bloquer le joueur)
    this.physics.add.collider(this.player, this.tesla1);
    //this.physics.add.collider(this.tesla1, this.platformLayer);

this.physics.add.collider(this.enemy0, this.platformLayer);
this.physics.add.collider(this.enemy1, this.platformLayer);
this.physics.add.collider(this.enemy2, this.platformLayer);
this.physics.add.collider(this.enemy3, this.platformLayer);
this.physics.add.collider(this.enemy4, this.platformLayer);
this.physics.add.collider(this.enemy5, this.platformLayer);
this.physics.add.collider(this.enemy6, this.platformLayer);
this.physics.add.collider(this.enemy7, this.platformLayer);
this.physics.add.collider(this.enemy8, this.platformLayer);
this.physics.add.collider(this.enemy9, this.platformLayer);
this.physics.add.collider(this.enemy10, this.platformLayer);
this.physics.add.collider(this.enemy11, this.platformLayer);
this.physics.add.collider(this.enemy12, this.platformLayer);



    // Déplacements aléatoires entre deux bornes X
    // Ajuste les bornes selon ton niveau
    if (this.enemy0.startPatrol) this.enemy0.startPatrol(1300, 1800, 70);
    if (this.enemy1.startPatrol) this.enemy1.startPatrol(1500, 1800, 70);
    if (this.enemy2.startPatrol) this.enemy2.startPatrol(1900, 2300, 70);
    if (this.enemy4.startPatrol) this.enemy4.startPatrol(2300, 2900, 70);
    if (this.enemy6.startPatrol) this.enemy6.startPatrol(2400, 3200, 70);
    if (this.enemy7.startPatrol) this.enemy7.startPatrol(2000, 2400, 70);
    if (this.enemy8.startPatrol) this.enemy8.startPatrol(2750, 3300, 70);
    if (this.enemy9.startPatrol) this.enemy9.startPatrol(2500, 2900, 70);

    if (this.enemy10.startPatrol) this.enemy10.startPatrol(800, 1200, 70);
    if (this.enemy11.startPatrol) this.enemy11.startPatrol(1600, 2500, 70);
    if (this.enemy12.startPatrol) this.enemy12.startPatrol(200, 1000, 70);


  
  
    // Créer un groupe avec les ennemis existants
this.enemies = this.physics.add.group();
[this.enemy0, this.enemy1, this.enemy2, this.enemy3, this.enemy4, this.enemy5, this.enemy6, this.enemy7, this.enemy8, this.enemy9, this.enemy10, this.enemy11, this.enemy12].forEach(e => {
  if (e) this.enemies.add(e);
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


this.cursors = this.input.keyboard.createCursorKeys();
    this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);

    this.isPause = false;
    this.isDansMenu = false; // ✅ ajout pour savoir si on navigue dans le menu
    // --- BARRES UI ---

// --- BARRES intérieures (dessinées en premier) ---
this.playerHealthBar = this.add.graphics().setScrollFactor(0);
this.playerManaBar = this.add.graphics().setScrollFactor(0);
this.playerXPBar = this.add.graphics().setScrollFactor(0);



// --- CADRES (au-dessus) ---
this.cadreVie = this.add.image(20, 10, "cadre_vie").setOrigin(0, 0).setScrollFactor(0).setDepth(10).setScale(0.3);
this.cadreMana = this.add.image(20, 90, "cadre_mana").setOrigin(0, 0).setScrollFactor(0).setDepth(10).setScale(0.2);
this.cadreXP = this.add.image(this.cameras.main.width/2, 20, "cadre_xp").setOrigin(0.5, 0).setScrollFactor(0).setDepth(10).setScale(0.35);


// --- GOLD ---
this.goldIcon = this.add.image(this.cameras.main.width - 120, 20, "img_gold").setOrigin(0,0).setScrollFactor(0).setScale(0.2);

// Initialiser les barres
this.updatePlayerHealthBar();
this.updatePlayerManaBar();
this.updatePlayerXPBar();



// HUD permanent (en jeu)
this.skillUI_HUD = this.add.container(5, this.cameras.main.height - 190)
    .setScrollFactor(0)
    .setDepth(10)
    .setVisible(true);
// HUD en jeu (normal)
this.skillUIBars_HUD = [];
this.createSkillBars(this.skillUI_HUD, this.skillUIBars_HUD);

// HUD dans la page Skills (menu pause)
this.skillUI_Menu = this.add.container(
    this.cameras.main.width/2 - 200,
    this.cameras.main.height/2 - 100
)
.setScrollFactor(0)
.setDepth(2001)
.setVisible(false);

this.skillUIBars_Menu = [];
this.createSkillBars(this.skillUI_Menu, this.skillUIBars_Menu, true); // <-- version "grossie"




// --- Création des 2 zones de téléportation ---
// Téléporteur A
this.teleportA = this.add.rectangle(3440, 700, 50, 100);
this.physics.add.existing(this.teleportA, true);

// Téléporteur B
this.teleportB = this.add.rectangle(150, 1920, 100, 100);
this.physics.add.existing(this.teleportB, true);

// Pour debug → affiche en rouge (tu peux commenter après)
this.teleportA.setFillStyle?.(0xff0000, 0.3);
this.teleportB.setFillStyle?.(0x0000ff, 0.3);

// Flag pour savoir si le joueur est dedans
this.currentTeleportZone = null;

// Overlap avec A
this.physics.add.overlap(this.player, this.teleportA, () => {
    this.currentTeleportZone = "A";
}, null, this);

// Overlap avec B
this.physics.add.overlap(this.player, this.teleportB, () => {
    this.currentTeleportZone = "B";
}, null, this);

// Vérif sortie : si plus de contact, reset
this.events.on("update", () => {
    if (
        !this.physics.overlap(this.player, this.teleportA) &&
        !this.physics.overlap(this.player, this.teleportB)
    ) {
        this.currentTeleportZone = null;
    }
});

// MUSIQUE : préparation des musiques
this.musiqueMap1 = this.sound.add('musiqueMap1', { volume: 0.6, loop: true });
this.musiqueMap2 = this.sound.add('musiqueMap2', { volume: 0.7, loop: true });
this.zoneActuelle = "A";
this.musiqueMap1.play(); // joue la musique Map1 au lancement


// Reset si on sort des zones
this.physics.add.overlap(this.player, [this.teleportA, this.teleportB], null, null, this);


this.keyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);

// Gestion de la téléportation + changement de musique
this.keyI.on('down', () => {
  if (this.currentTeleportZone === "A") {
    this.fadeOutAndTeleport(500, this.teleportB.x, this.teleportB.y);
    if (this.musiqueMap1.isPlaying) { this.musiqueMap1.stop(); }
    this.musiqueMap2.play();
    this.zoneActuelle = "B";
  } else if (this.currentTeleportZone === "B") {
    this.fadeOutAndTeleport(500, this.teleportA.x, this.teleportA.y);
    if (this.musiqueMap2.isPlaying) { this.musiqueMap2.stop(); }
    this.musiqueMap1.play();
    this.zoneActuelle = "A";
  }
});

let degat_gun = 1;

this.projectiles = this.physics.add.group({
    classType: Phaser.Physics.Arcade.Image,
    runChildUpdate: true
});
this.physics.add.collider(this.projectiles, this.platformLayer, (proj) => {
    proj.destroy();
});

// Collision projectiles ↔ ennemis
this.physics.add.overlap(this.projectiles, this.enemies, (projectile, enemy) => {
    projectile.destroy();
    this.hit.play();

    // Applique les dégâts
    if (enemy.takeDamage) {
    enemy.takeDamage(degat_gun, projectile); // 1 dégât, projectile comme killer
}


}, null, this);


// modes d'attaque
    this.weaponModes = ["melee", "gun", "jetpack"];
    this.selectedWeaponIndex = 0;
    this.attackMode = this.weaponModes[this.selectedWeaponIndex];

    // groupe UI des armes
    this.weaponUI = [];

    const startX = 1045; // position X du premier slot
    const startY = 665;  // position Y
    const spacing = 90; // espacement horizontal entre icônes=

    for (let i = 0; i < this.weaponModes.length; i++) {
        let iconKey = "vide"; // par défaut

        if (i === 0) iconKey = "poing"; // poing toujours dispo
        else if (i === 1 && this.skills.Armes >= 1) iconKey = "gun";
        else if (i === 2 && this.skills.Mobilité >= 4) iconKey = "jetpack";

        // icône
        const icon = this.add.image(startX + i * spacing, startY, iconKey)
            .setScrollFactor(0)
            .setDepth(20)
            .setScale(0.30);

        // cadre
        const frame = this.add.image(startX + i * spacing, startY, "cadre")
            .setScrollFactor(0)
            .setDepth(21)
            .setScale(0.35);

        this.weaponUI.push({ icon, frame });
    }

    // touche P pour changer de mode
    this.input.keyboard.on("keydown-P", () => {
    let nextIndex = this.selectedWeaponIndex;

    do {
        nextIndex = (nextIndex + 1) % this.weaponModes.length;
    } while (!this.isWeaponUnlocked(nextIndex) && nextIndex !== this.selectedWeaponIndex);

    // si au moins un mode est dispo
    if (this.isWeaponUnlocked(nextIndex)) {
        this.selectedWeaponIndex = nextIndex;
        this.attackMode = this.weaponModes[this.selectedWeaponIndex];
        this.refreshWeaponUI();
        console.log("Mode :", this.attackMode);
    }
});


    this.refreshWeaponUI();




map.createLayer("decoration_front_layer", [tileset1, tileset2, tileset3, tileset4, tileset5, tileset6, tileset7, tileset8, tileset9, tileset10, tileset11], 0, 0);

    this.activeButtons = this.menuButtons || [];


    
  }

  update() {
    // --- Gestion de la touche L (Pause / Reprise) ---
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
        // Bloque L si une page interne est ouverte (Contrôles ou Skills)
        if (this.pageControles?.visible || this.pageSkills?.visible) {
            return; // on ne ferme pas avec L quand on est dans une sous-page
        }

        this.isPause = !this.isPause;

        if (this.isPause) {
            this.physics.world.pause();
            this.time.paused = true;
            this.showPauseMenu();
            this.isDansMenu = true;
        } else {
            this.physics.world.resume();
            this.time.paused = false;
            this.hidePauseMenu();
            this.isDansMenu = false;
        }
    }

    // --- Si on est dans le menu pause ET page Skills visible ---
    if (this.isDansMenu && this.pageSkills && this.pageSkills.visible) {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.selectedSkillIndex = Math.min(this.selectedSkillIndex + 1, this.skillSelectorButtons.length - 1);
            this.updateSkillSelector();
            this.select.play();
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.selectedSkillIndex = Math.max(this.selectedSkillIndex - 1, 0);
            this.updateSkillSelector();
            this.select.play();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
            const selected = this.skillSelectorButtons[this.selectedSkillIndex];

            if (typeof selected === "string") {
                // Skill normal
                let skill = selected;
                if (this.skillPoints > 0 && this.skills[skill] < this.maxSkillLevel) {
                    this.skills[skill]++;
                    this.skillPoints--;
                    this.updateSkillUI(this.selectedSkillIndex);
                    this.updatePointsHUD(this.skillPoints);
        this.updateSkillsHUD(this.skillPoints);
        this.skill.play();
                    
                    this.refreshWeaponUI();
                }

                if (skill === "Armes") {
    this.applyArmesStats();
}
if (skill === "Survie") {
  this.applySurvieStats();
}
if (skill === "Mobilité") {
  this.applyMobiliteStats();
}


            } else if (selected && typeof selected.callback === "function") {
                // Bouton retour2 → appelle le callback
                selected.callback();

                // Réactive le menu pause
                this.activeButtons = this.menuButtons;
                this.selectedIndex = 0;
                this.updateButtonSelection();
            }
        }

        return; // 🚪 stop ici → on ne retombe pas dans la nav du menu principal
    }

    // --- Si on est dans le menu pause mais pas dans Skills ---
    if (this.isDansMenu && (!this.pageSkills || !this.pageSkills.visible)) {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.selectedIndex = (this.selectedIndex + 1) % this.activeButtons.length;
            this.updateButtonSelection();
this.select.play();
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.selectedIndex = (this.selectedIndex - 1 + this.activeButtons.length) % this.activeButtons.length;
            this.updateButtonSelection();
            this.select.play();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyI)) {
            const btn = this.activeButtons[this.selectedIndex];
            if (btn.callback) btn.callback();
        }

        return; // 🚪 stop ici → bloque les contrôles joueur tant qu'on est dans le menu
    }


    // --- Sinon, logique du joueur habituelle ---
    if (!this.player || !this.player.body) return;
    if (this.gameOver) return;

  // --- PLAYER ---
  if (this.clavier.left.isDown) {
  this.player.setVelocityX(-this.playerSpeed);
  if (this.player.hasWeapon) {
    this.player.anims.play("anim_tourne_gauche_arme", true);
  } else {
    this.player.anims.play("anim_tourne_gauche", true);
  }
  this.left = true;
  this.right = false;
} else if (this.clavier.right.isDown) {
  this.player.setVelocityX(this.playerSpeed);
  if (this.player.hasWeapon) {
    this.player.anims.play("anim_tourne_droite_arme", true);
  } else {
    this.player.anims.play("anim_tourne_droite", true);
  }
  this.right = true;
  this.left = false;
} else {
  if (this.left) {
    if (this.player.hasWeapon) {
      this.player.anims.play("anim_face_gauche_arme");
    } else {
      this.player.anims.play("anim_face_gauche");
    }
  } else if (this.right) {
    if (this.player.hasWeapon) {
      this.player.anims.play("anim_face_droite_arme");
    } else {
      this.player.anims.play("anim_face_droite");
    }
  }
  this.player.setVelocityX(0);
}

if (!this.player.body.blocked.down) {
  if (this.right) {
    if (this.player.hasWeapon) {
      this.player.anims.play("anim_saut_droite_arme", true);
    } else {
      this.player.anims.play("anim_saut_droite", true);
    }
  } else if (this.left) {
    if (this.player.hasWeapon) {
      this.player.anims.play("anim_saut_gauche_arme", true);
    } else {
      this.player.anims.play("anim_saut_gauche", true);
    }
  }
}
if (this.clavier.up.isDown && this.player.body.blocked.down) {
  this.player.setVelocityY(-this.playerSpeed);
  if (this.right) {
    if (this.player.hasWeapon) {
      this.player.anims.play("anim_saut_droite_arme", true);
    } else {
      this.player.anims.play("anim_saut_droite", true);
    }
  } else if (this.left) {
    if (this.player.hasWeapon) {
      this.player.anims.play("anim_saut_gauche_arme", true);
    }
    else {
      this.player.anims.play("anim_saut_gauche", true);
    }
  }
}

const isMoving = (this.clavier.left.isDown || this.clavier.right.isDown);
const onGround = this.player.body.blocked.down;

if (isMoving && onGround) {
    if (this.zoneActuelle === "A") {
        if (!this.sfxGrass.isPlaying) {
            this.sfxWalk.stop();
            this.sfxGrass.play();
        }
    } else if (this.zoneActuelle === "B") {
        if (!this.sfxWalk.isPlaying) {
            this.sfxGrass.stop();
            this.sfxWalk.play();
        }
    }
} else {
    // stop quand le joueur arrête de bouger
    this.sfxGrass.stop();
    this.sfxWalk.stop();
}



// DASH
if (Phaser.Input.Keyboard.JustDown(this.keyK) 
    && !this.isDashing 
    && this.skills["Mobilité"] >= 1 
    && this.playerMana >= this.dashManaCost) {  // utiliser le coût dynamique
    this.playerMana -= this.dashManaCost;
    this.updatePlayerManaBar();
    this.whoosh.play();

    if (this.right) {
        this.startDash(1, 0);
    } else if (this.left) {
        this.startDash(-1, 0);
    }
}



if (this.attackMode === "gun" && this.skills.Armes >= 1) {
this.player.hasWeapon = true;
} else {
this.player.hasWeapon = false;
}

  // --- PET ---

  if (this.skills["Survie"] >= 1 && !this.pet) {
  this.spawnPet();
}

  if (this.skills["Survie"] >= 1 && this.pet) {
  const speed = 120;
  const detectionRadius = this.detectionRadius;

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
  const dist = Phaser.Math.Distance.Between(this.pet.x, this.pet.y, closestEnemy.x, closestEnemy.y);
  if (dist > 12) {
    this.physics.moveToObject(this.pet, closestEnemy, speed);
  } else {
    this.pet.body.setVelocity(0, 0);
  }

  // <<< ici on met à jour l’animation du pet
  if (this.pet.body.velocity.x < 0) {
    this.pet.anims.play("anim_pet_gauche", true);
  } else if (this.pet.body.velocity.x > 0) {
    this.pet.anims.play("anim_pet_droite", true);
  }
}
 else {
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


    if (this.pet.body.velocity.x < 0) {
  this.pet.anims.play("anim_pet_gauche", true);
} else if (this.pet.body.velocity.x > 0) {
  this.pet.anims.play("anim_pet_droite", true);
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


this.projectiles.children.each((proj) => {
    if (proj.active) {
        const dist = Phaser.Math.Distance.Between(proj.spawnX, proj.spawnY, proj.x, proj.y);
        if (dist > this.gunRange) {
          proj.destroy();
      }

    }
});








  }


  updatePlayerHealthBar() {
    const width = 237; // à ajuster selon ton cadre
    const height = 30;
    const x = 100; // décalage intérieur
    const y = 30;

    this.playerHealthBar.clear();
    this.playerHealthBar.fillStyle(0xff0000);
    this.playerHealthBar.fillRect(x, y, (this.playerHealth / this.playerMaxHealth) * width, height);
}

updatePlayerManaBar() {
     const width = 182; // à ajuster selon ton cadre
    const height = 40;
    const x = 97; // décalage intérieur
    const y = 105;

    this.playerManaBar.clear();
    this.playerManaBar.fillStyle(0x0000ff);
    this.playerManaBar.fillRect(x, y, (this.playerMana / 100) * width, height); // maxMana = 100
}

xpForNextLevel = (level) => {
    return Math.floor(this.baseXP * Math.pow(this.growth, level));
};




updatePlayerXPBar() {
    const width = 322;
    const height = 30;
    const x = this.cameras.main.width / 2 - width/2 + 35;
    const y = 55;

    const xpNeeded = this.xpForNextLevel(this.playerLevel);
    this.playerXPBar.clear();
    this.playerXPBar.fillStyle(0x00ff00);
    this.playerXPBar.fillRect(x, y, (this.playerXP / xpNeeded) * width, height);
}




  playerDeath() {
    this.sound.stopAll();
    this.mdr.play();
    // NE PAS détruire le player, juste pauser
        this.gameOver = true;
    this.physics.pause();
    
    
    // Redémarrer la scène après 3 secondes
    this.time.delayedCall(3000, () => {
        this.scene.restart();
    });
    
    
}


updateSkillUI(index) {
    const skill = this.skillKeys[index];
    const value = this.skills[skill];
    const ratio = value / this.maxSkillLevel;

    // Mets à jour les deux sets de barres (HUD + Menu)
    [this.skillUIBars_HUD, this.skillUIBars_Menu].forEach(barSet => {
        if (!barSet[index]) return;
        let { barFill, barX, barY, barWidth, barHeight } = barSet[index];
        barFill.clear();
        barFill.fillStyle(0xfcad03, 1);
        barFill.fillRoundedRect(barX, barY - barHeight / 2, ratio * barWidth, barHeight, 4);
    });

}







// Nouvelle méthode dans selection.js
// Dans selection.js, remplacez takeDamage() par :
perdreVie(damage = 1) {
    // Éviter les dégâts multiples
    if (this.invulnerable) return;
    this.playOuch();
    
    this.playerHealth -= damage;
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
        this.playerDeath();
        // Stopper toute action de jeu
        if (this.petShootEvent) this.petShootEvent.remove(false);
        this.physics.pause();
        // Désactiver entités et nettoyer projectiles
        if (this.enemy0) this.enemy0.setActive(false).setVisible(false);
        if (this.enemy1) this.enemy1.setActive(false).setVisible(false);
        if (this.enemy2) this.enemy2.setActive(false).setVisible(false);
        if (this.enemy4) this.enemy4.setActive(false).setVisible(false);
        if (this.enemy6) this.enemy6.setActive(false).setVisible(false);
        if (this.enemy7) this.enemy7.setActive(false).setVisible(false);
        if (this.enemy8) this.enemy8.setActive(false).setVisible(false);
        if (this.enemy9) this.enemy9.setActive(false).setVisible(false);
        if (this.enemy10) this.enemy10.setActive(false).setVisible(false);
        if (this.enemy11) this.enemy11.setActive(false).setVisible(false);
        if (this.enemy12) this.enemy12.setActive(false).setVisible(false);
        if (this.projectiles) this.projectiles.clear(true, true);
        if (this.enemy0?.projectiles) this.enemy0.projectiles.clear(true, true);
        if (this.enemy1?.projectiles) this.enemy1.projectiles.clear(true, true);
        if (this.enemy2?.projectiles) this.enemy2.projectiles.clear(true, true);
        if (this.enemy4?.projectiles) this.enemy4.projectiles.clear(true, true);
        if (this.enemy6?.projectiles) this.enemy6.projectiles.clear(true, true);
        if (this.enemy7?.projectiles) this.enemy7.projectiles.clear(true, true);
        if (this.enemy8?.projectiles) this.enemy8.projectiles.clear(true, true);
        if (this.enemy9?.projectiles) this.enemy9.projectiles.clear(true, true);
        if (this.enemy10?.projectiles) this.enemy10.projectiles.clear(true, true);
        if (this.enemy11?.projectiles) this.enemy11.projectiles.clear(true, true);
        if (this.enemy12?.projectiles) this.enemy12.projectiles.clear(true, true);
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

spawnPet() {
  // PET
    this.pet = this.physics.add.sprite(this.player.x + 50, this.player.y, "img_perso");
    this.pet.body.allowGravity = false;
    this.petMode = "follow"; // "follow" = oscillation autour du joueur, "attack" = attaque ennemi
    this.petDamage = 1;      // damage per hit
    this.petRadius = 32;     // attack distance (px)
    this.petInterval = 500; // ms between damage ticks


    // PROJECTILES DU PET
    this.projectiles = this.physics.add.group(); // <--- C'est important !


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
    [this.enemy0, this.enemy1, this.enemy2, this.enemy3, this.enemy4, this.enemy5, this.enemy6, this.enemy7, this.enemy8, this.enemy9, this.enemy10, this.enemy11, this.enemy12].forEach(enemy => {
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
}










startDash(dirX, dirY) {
    if (this.isDashing) return;
    this.isDashing = true;
    this.invulnerable = true;

    // désactiver gravité pour le dash (optionnel si tu veux flotter)
    this.player.body.allowGravity = true;

    // vitesse initiale énorme
    const initialSpeed = 1000; 
    this.player.setVelocity(dirX * initialSpeed, dirY * initialSpeed);

    // tween sur la vitesse pour ralentir progressivement
    this.tweens.add({
        targets: this.player.body.velocity,
        x: dirX * 100, // vitesse finale plus basse
        y: dirY * 100,
        duration: 500, // durée du dash
        ease: "Quad.easeOut", // rapide au début, lent à la fin
        onComplete: () => {
            this.isDashing = false;
            this.invulnerable = false;
            this.player.setVelocity(0, this.player.body.velocity.y); 
        }
    });
}



fadeOutAndTeleport(duration, targetX, targetY) {
    // Lancer un fondu noir
    this.cameras.main.fadeOut(duration, 0, 0, 0);

    this.cameras.main.once("camerafadeoutcomplete", () => {
        // Téléporter le joueur
        this.player.setPosition(targetX, targetY);

        // Téléporter le pet (ex : un peu à droite du joueur)
        if (this.pet) {
            this.pet.setPosition(targetX + 50, targetY);
        }

        // Refaire apparaître
        this.cameras.main.fadeIn(duration, 0, 0, 0);
    });
}


shootProjectile() {
    if (!this.player) return;

    let dirX = 0;
    let dirY = 0;

    if (this.right) dirX = 1;
    else if (this.left) dirX = -1;
    else dirY = -1; // défaut vers le haut si rien

    // Crée le projectile
    const projectile = this.projectiles.create(this.player.x, this.player.y + 50, null);
    projectile.setSize(8, 8); 
    projectile.body.allowGravity = false;

    // Vitesse
    const speed = 200;
    projectile.setVelocity(dirX * speed, dirY * speed);

    // Distance max
    this.time.delayedCall(200, () => {
        if (projectile.active) projectile.destroy();
    });

    // Collision avec ennemis
    this.physics.add.overlap(projectile, this.enemies, (proj, enemy) => {
        if (enemy && enemy.takeDamage) {
            enemy.takeDamage(1, this.player); // 1 dégât
            proj.destroy();
            
            this.hit.play();
        }
    });
}

attackMelee() {
    this.canAttack = false;

    const hitboxWidth = 64;
    const hitboxHeight = 40;
    let offsetX = this.right ? 50 : this.left ? -50 : 0;

    const hitbox = this.add.rectangle(
        this.player.x + offsetX,
        this.player.y,
        hitboxWidth,
        hitboxHeight,
        0xff0000,
        0
    );
    this.physics.add.existing(hitbox);
    hitbox.body.allowGravity = false;

    let hitRegistered = false;
    this.physics.add.overlap(hitbox, this.enemies, (hb, enemy) => {
        if (!hitRegistered && enemy && enemy.active && enemy.takeDamage) {
            hitRegistered = true;
            enemy.takeDamage(this.degatPlayerCorpsAcorps, this.player);
            
    this.hit.play();

            let slashText = this.add.text(enemy.x, enemy.y - 40, "Slash!", {
                fontSize: "14px",
                fill: "#ff0000",
                fontFamily: "Arial"
            }).setOrigin(0.5).setDepth(10);

            this.tweens.add({
                targets: slashText,
                alpha: 0,
                y: slashText.y - 20,
                duration: 500,
                onComplete: () => slashText.destroy()
            });
        }
    });

    this.time.delayedCall(200, () => hitbox.destroy());
    this.time.delayedCall(700, () => { this.canAttack = true; });
}

attackGun() {
    const now = this.time.now;
    if (now - this.lastShotTime < this.gunFireRate) return; // cooldown
    this.lastShotTime = now;
    this.shot.play();

    // Décalage vertical : +10 ou +20 selon la taille du sprite
    let offsetY = 10;

    // Décalage horizontal selon direction
    let offsetX = this.right ? 20 : this.left ? -20 : 0;

    // Création du projectile
    let projectile = this.projectiles.create(
        this.player.x + offsetX,
        this.player.y + offsetY,
        "tir_perso"
    );

    projectile.body.allowGravity = false;

    if (this.left) {
        projectile.setVelocityX(-400);
        projectile.setFlipX(true);
    } else {
        projectile.setVelocityX(400);
        projectile.setFlipX(false);
    }

    // On enregistre la position d'origine
    projectile.spawnX = this.player.x;
    projectile.spawnY = this.player.y;

    // Pour la destruction selon distance
    projectile.update = function() {
        const dist = Phaser.Math.Distance.Between(this.spawnX, this.spawnY, this.x, this.y);
        if (dist > this.scene.gunRange) {
            this.destroy();
        }
    }
}


refreshWeaponUI() {
    for (let i = 0; i < this.weaponModes.length; i++) {
        let iconKey = "vide";

        if (i === 0) iconKey = "poing"; // poing toujours dispo
        else if (i === 1 && this.skills.Armes >= 1) iconKey = "gun";
        else if (i === 2 && this.skills.Mobilité >= 4) iconKey = "jetpack";

        this.weaponUI[i].icon.setTexture(iconKey);

        // cadre normal ou sélectionné
        if (i === this.selectedWeaponIndex) {
            this.weaponUI[i].frame.setTexture("cadreselect");
        } else {
            this.weaponUI[i].frame.setTexture("cadre");
        }
    }
}

isWeaponUnlocked(index) {
    if (index === 0) return true; // poing toujours dispo
    if (index === 1) return this.skills.Armes >= 1;
    if (index === 2) return this.skills.Mobilité >= 4;
    return false;
}


// --- CREATION DU MENU PAUSE ---
showPauseMenu() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.pauseMenu = this.add.container(centerX, centerY);

    
    let hud = document.getElementById("hud-level");
    if (hud) hud.style.display = "none";
    let hud1 = document.getElementById("hud-points");
    if (hud1) hud1.style.display = "none";
    let hud2 = document.getElementById("hud-gold");
    if (hud2) hud2.style.display = "none";

    // Fond semi-transparent
this.bg = this.add.rectangle(
    0, 0,
    this.cameras.main.width,
    this.cameras.main.height,
    0x000000,
    0.7
).setOrigin(0.5).setScrollFactor(0);
this.pauseMenu.add(this.bg);

// ✅ Image "title" en fond du menu
this.menuTitleBG = this.add.image(0, 0, "title")
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000) // optionnel : pour le placer au-dessus du fond noir mais derrière les boutons
    .setDisplaySize(this.cameras.main.width, this.cameras.main.height); // pour couvrir l’écran

this.pauseMenu.add(this.menuTitleBG);


    // Boutons (comme dans le menu principal mais adaptés)
    this.menuButtons = [];
    const spacing = 120; // espacement vertical entre boutons
    const caca = 120;


    // 1. Bouton Contrôles
    this.boutonControles = this.createButton(0, -spacing + caca, "boutonControles", () => {
        this.showPage(this.pageControles, this.retour1);
    }, 0.3).setScrollFactor(0);
    this.menuButtons.push(this.boutonControles);

    // 2. Bouton Skills
this.boutonSkills = this.createButton(0, 0 + caca, "boutonSkills", () => {
    this.showPage(this.pageSkills, this.retour2);
}, 0.3).setScrollFactor(0);
this.menuButtons.push(this.boutonSkills);


    // 3. Bouton Retour au jeu
    this.boutonRetourJeu = this.createButton(0, spacing + caca, "boutonRetour", () => {
        // Simule appui sur L
        this.isPause = false;
        this.physics.world.resume();
        this.time.paused = false;
        this.hidePauseMenu();
        this.click.play();
        this.isDansMenu = false;
    }, 0.3).setScrollFactor(0);
    this.menuButtons.push(this.boutonRetourJeu);

    this.pauseMenu.add(this.menuButtons);

    // --- PAGES ---
// Page Contrôles
this.pageControles = this.add.container(0, 0).setVisible(false);

const controlesBG = this.add.image(-centerX, -centerY, "pageControles") 
   .setOrigin(0, 0) 
   .setDisplaySize(this.cameras.main.width, this.cameras.main.height)
   .setScrollFactor(0);

this.retour1 = this.createButton(centerX/2 - 350, centerY - 70, "boutonRetour", () => this.hidePages(), 0.3);
this.pageControles.add([controlesBG, this.retour1]);
this.pageControles.setDepth(2000).setScrollFactor(0);
this.pauseMenu.add(this.pageControles);
this.retour1.setDepth(2001).setScrollFactor(0);

// Page Skills
this.pageSkills = this.add.container(0, 0).setVisible(false);

const skillsBG = this.add.image(-centerX, -centerY, "skills") 
   .setOrigin(0, 0) 
   .setDisplaySize(this.cameras.main.width, this.cameras.main.height)
   .setScrollFactor(0);

this.retour2 = this.createButton(centerX/2 -10, centerY - 180, "boutonRetour", () => {
    this.hidePages(); // ferme la page Skills

    // On réactive le menu pause
    this.activeButtons = this.menuButtons;
    this.selectedIndex = 0; // sélectionne le 1er bouton
    this.updateButtonSelection();

    // ⚠️ petit délai pour éviter que la touche "I" se propage
    this.time.delayedCall(100, () => {}, [], this);
}, 0.3);


this.pageSkills.add([skillsBG, this.retour2]);
this.pageSkills.setDepth(2000).setScrollFactor(0);
this.pauseMenu.add(this.pageSkills);
this.retour2.setDepth(2001).setScrollFactor(0);
// Ajouter le bouton Retour à la sélection avec les skills
this.skillSelectorButtons = [...this.skillKeys.map(k => k), this.retour2];

// --- ICI --- Crée la flèche pour la sélection des skills
this.skillSelector = this.add.image(85, -50, "fleche").setOrigin(0.5, 0.5).setScale(1.8);
this.pageSkills.add(this.skillSelector);

    // Active la navigation clavier
    this.activeButtons = this.menuButtons;
    this.selectedIndex = 0;
    this.updateButtonSelection();

    this.pauseMenu.setDepth(1000);
}

// --- DETRUIRE LE MENU PAUSE ---
hidePauseMenu() {
    if (this.pauseMenu) {
        this.pauseMenu.destroy(true);
        this.pauseMenu = null;
    }
    this.pageControles = null;
    this.activeButtons = [];
    this.selectedIndex = 0;

    let hud = document.getElementById("hud-level");
    if (hud) hud.style.display = "";
    let hud1 = document.getElementById("hud-points");
    if (hud1) hud1.style.display = "";
    let hud2 = document.getElementById("hud-gold");
    if (hud2) hud2.style.display = "";
}

// --- UTILITAIRES BOUTONS ---
createButton(x, y, key, callback, scale = 1) {
    const btn = this.add.image(x, y, key).setInteractive({ useHandCursor: true }).setScale(scale);
    btn.callback = callback;

    btn.on("pointerover", () => this.setSelectedButton(btn));this.select.play();
    btn.on("pointerout", () => this.updateButtonSelection());
    btn.on("pointerdown", () => callback());

    return btn;
}

setSelectedButton(btn) {
    const idx = this.activeButtons.indexOf(btn);
    if (idx >= 0) {
        this.selectedIndex = idx;
        this.updateButtonSelection();
    }
}

updateButtonSelection() {
    this.activeButtons.forEach((btn, i) => {
        if (btn && typeof btn.setScale === "function") {
          this.select.play();
            if (btn === this.retour1 || btn === this.retour2) {
                btn.setScale(0.3); // boutons retour toujours à taille fixe
            } else {
                btn.setScale(i === this.selectedIndex ? 0.4 * 1.2 : 0.4);
            }
        }
    });
}



// --- GESTION DES PAGES ---
showPage(page, retourBtn) {
    this.menuButtons.forEach(btn => btn.setVisible(false));
    page.setVisible(true);
    this.click.play();

    if (page === this.pageSkills) {
        this.skillUI_Menu.setVisible(true).setScrollFactor(0);
        
    let hud0 = document.getElementById("hud-skills");
    if (hud0) hud0.style.display = "block";

        // Active toutes les options du selector : skills + retour
        this.activeButtons = this.skillSelectorButtons;
        this.selectedSkillIndex = 0;
        this.updateSkillSelector(); // fonction qui déplace la flèche "skillSelector" sur l'option sélectionnée
    } else {
        this.activeButtons = [retourBtn];
        this.selectedIndex = 0;
        this.updateButtonSelection();
    }
}


hidePages() {
    if (this.pageControles) this.pageControles.setVisible(false);
    if (this.pageSkills) {
        this.pageSkills.setVisible(false);
        this.skillUI_Menu.setVisible(false);
        
    let hud0 = document.getElementById("hud-skills");
    if (hud0) hud0.style.display = "none";
    }

    this.menuButtons.forEach(btn => btn.setVisible(true));
    this.activeButtons = this.menuButtons;
    this.selectedIndex = 0;
    this.updateButtonSelection();
    this.click.play();
}





createSkillBars(container, barArray, isMenu = false) {
    const skillFrames = ["skill_1", "skill_2", "skill_3"];
    let menuOffsetY = isMenu ? -60 : 0;
    for (let i = 0; i < this.skillKeys.length; i++) {
        let scaleFactor = isMenu ? 1.6 : 1;
        let spacing = isMenu ? 132 : 70;
        let barX = isMenu ? 98 : 85;
        let offsetY = menuOffsetY + i * spacing;
        let barY = offsetY;
        let barWidth = isMenu ? 250 : 121 * scaleFactor;
        let barHeight = 20 * scaleFactor;

        // Barre de remplissage en blocs (5 segments)
        let barFill = this.add.graphics();
        barFill.fillStyle(0xfcad03, 1);

        let nbLevels = 5;
        let blockWidth = barWidth / nbLevels;
        let skillVal = this.skills[this.skillKeys[i]] || 0;

        for (let k = 0; k < nbLevels; k++) {
            if (k < skillVal) {
                barFill.fillRoundedRect(
                    barX + k * blockWidth,
                    barY - barHeight / 2,
                    blockWidth - 2,  // petit espace entre segments
                    barHeight,
                    4 // arrondi identique à original
                );
            }
        }

        // Ticks comme avant
        let barTicks = this.add.graphics();
        let tickLineWidth = isMenu ? 3 : 1;
        let tickAlpha = isMenu ? 0.7 : 0.5;
        barTicks.lineStyle(tickLineWidth, 0xffffae, tickAlpha);

        for (let j = 1; j < 5; j++) {
            let tickX = barX + (j / 5) * barWidth;
            barTicks.lineBetween(
                tickX,
                barY - barHeight / 2,
                tickX,
                barY + barHeight / 2
            );
        }

        // Cadre inchangé
        let frameX = isMenu ? barX - 168 : 0;
        let frame = this.add.image(frameX, offsetY, skillFrames[i])
            .setOrigin(0, 0.5)
            .setScale(isMenu ? 1.3 : 0.65);

        container.add([barFill, barTicks, frame]);
        barArray.push({ barFill, barX, barY, barWidth, barHeight });
    }
}





// Met à jour la flèche sur la skill ou le bouton Retour
updateSkillSelector() {
    // Positions Y individuelles pour chaque skill
    const skillYPositions = [
        -170, // skill 0
        -30,  // skill 1
        100   // skill 2
    ];

    // Position X fixe pour les skills
    const skillX = 320;

    // Vérifie si on est sur un skill ou sur le bouton Retour
    if (this.selectedSkillIndex < skillYPositions.length) {
        // Sur un skill → affiche la flèche
        this.skillSelector.setVisible(true);
        this.skillSelector.y = skillYPositions[this.selectedSkillIndex];
        this.skillSelector.x = skillX;

        // Retour à l’échelle normale pour le bouton Retour
        this.retour2.setScale(0.3);
    } else {
        // Sur le bouton Retour → flèche invisible
        this.skillSelector.setVisible(false);

        // Agrandir le bouton Retour
        this.retour2.setScale(0.4);
    }
}

scheduleOwlSound() {
    // Temps aléatoire entre 20s et 60s
    const delay = Phaser.Math.Between(20000, 60000);

    this.time.delayedCall(delay, () => {
        if (this.pet && this.pet.active) {
            this.sfxOwl.play();
        }
        // Reprogramme le suivant tant que la scène existe
        this.scheduleOwlSound();
    });
}



  


























playOuch() {
    const sfx = this.sound.add("ouch", { volume: 0.5 });

    // Pick a random rate (speed/pitch). 1 is normal, >1 faster/higher pitch, <1 slower/lower pitch
    const randomPitch = Phaser.Math.FloatBetween(0.85, 1.15);

    // Pick a random volume too if you want variation
    const randomVolume = Phaser.Math.FloatBetween(0.2, 0.8);

    sfx.setRate(randomPitch);
    sfx.setVolume(randomVolume);

    sfx.play();

    // Clean up after it finishes
    sfx.once("complete", () => sfx.destroy());
}


















//STATS SKILLS
applyArmesStats() {
    // Reset to base values first
    this.weaponModes = ['melee'];
    this.degatPlayerCorpsAcorps = 2;
    this.degat_gun = 1;
    this.gunRange = 370;
    this.gunFireRate = 500;

    const lvl = this.skills.Armes;

    if (lvl >= 1) this.weaponModes.push('gun');             // lvl 1
    if (lvl >= 2) this.degatPlayerCorpsAcorps = 5;        // lvl 2
    if (lvl >= 3) this.degat_gun = 2;                     // lvl 3
    if (lvl >= 4) this.gunRange = 600;                    // lvl 4
    if (lvl >= 5) this.gunFireRate = 200;                 // lvl 5

    this.refreshWeaponUI();
}



// --- STATS SKILLS : Survie ---
applySurvieStats() {
    // --- RESET VALEURS DE BASE ---
    this.playerMaxHealth = 50;  // base
    this.playerHealth = 50;
    this.detectionRadius = 150;         // valeur de base pour le pet
    this.petDamage = 1;          // dégâts de base du pet

    const lvl = this.skills["Survie"];

    // --- NIVEAUX ---
    if (lvl >= 1 && !this.pet) {
        this.spawnPet(); // lvl 1 → spawn pet
        this.scheduleOwlSound();
    }

    if (lvl >= 2) {
        this.playerMaxHealth = 100; // lvl 2 → +HP
        this.playerHealth = this.playerMaxHealth;
        this.updatePlayerHealthBar();
    }

    if (lvl >= 3) {
        this.detectionRadius = 400; // lvl 3 → plus de range pour le pet
    }

    if (lvl >= 4) {
        this.playerMaxHealth = 200; // lvl 4 → HP max plus haut
        this.playerHealth = this.playerMaxHealth;
        this.updatePlayerHealthBar();
    }

    if (lvl >= 5) {
        this.petDamage = 5; // lvl 5 → dégâts du pet
    }

}

// --- STATS SKILLS : Mobilité ---
applyMobiliteStats() {
    // --- VALEURS DE BASE ---
    this.playerSpeed = 120;         // vitesse horizontale de base
    this.playerJump = 160;          // saut de base
    this.hasDash = false;           // dash désactivé
    this.hasJetpack = false;        // jetpack désactivé
    this.dashManaCost = 5;          // coût du dash
    this.jetpackManaCost = 5;       // coût du jetpack

    const lvl = this.skills["Mobilité"];

    // --- NIVEAUX ---
    if (lvl >= 1) {
        this.hasDash = true;       // lvl 1 → débloque le dash
    }

    if (lvl >= 2) {
        this.playerSpeed = 180;    // lvl 2 → + vitesse
    }

    if (lvl >= 3) {
        this.playerJump = 220;     // lvl 3 → + saut
    }

    if (lvl >= 4) {
        this.hasJetpack = true;    // lvl 4 → débloque le jetpack
    }

    if (lvl >= 5) {
        this.dashManaCost = 1;     // lvl 5 → dash & jetpack coûtent moins
        this.jetpackManaCost = 3;
    }
}

}
