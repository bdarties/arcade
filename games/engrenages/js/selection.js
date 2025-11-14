import * as fct from "./fonctions.js";
import { musicManager } from './MusicManager.js';

var player;
var clavier;

export default class selection extends Phaser.Scene {
  constructor() {
    super({ key: "selection" });
  }

  preload() {
    // Précharger les musiques
        musicManager.preloadMusic(this);
    const baseURL = this.sys.game.config.baseURL;
    this.load.setBaseURL(baseURL);
    this.load.image("background", "./assets/screen_selection.png");
    this.load.image("retour_menu", "./assets/retour_menu.png");
    this.load.spritesheet("img_perso", "./assets/mouv_J1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("img_perso_idle", "./assets/idle_J1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.image("img_porte1", "./assets/terminal_rempli.png");
    this.load.image("img_porte2", "./assets/terminal_rempli.png");
    this.load.image("img_porte3", "./assets/terminal_rempli.png");
  }

  create() {
    this.cameras.main.fadeIn(200, 0, 0, 0);

    // Initialiser la musique du niveau
        musicManager.scene = this;
        musicManager.play('selection');

    // Configuration des touches pour le menu pause (P ou Y)
    this.input.keyboard.on('keydown-P', () => {
      this.scene.pause();
      this.scene.launch('pause');
    });
    this.input.keyboard.on('keydown-Y', () => {
      this.scene.pause();
      this.scene.launch('pause');
    });



    // Ajout du fond d'écran centré et adapté à la taille de l'écran
    const background = this.add.image(this.game.config.width / 2, this.game.config.height / 2, "background");
    background.setDisplaySize(this.game.config.width, this.game.config.height);
    
    this.add.text(650, 450, "Seul le J1 peut choisir le niveau. J2 n'a aucun contrôle ici.", { fontSize: "25px", fill: "#fff" }).setOrigin(0.5);

    // Positions des portes
    const portesY = 650;

    // Ajout des portes
    this.porte1 = this.physics.add.staticSprite(450, portesY, "img_porte1");
    this.porte2 = this.physics.add.staticSprite(650, portesY, "img_porte2");
    this.porte3 = this.physics.add.staticSprite(850, portesY, "img_porte3");

    // Textes au-dessus des portes
    this.add.text(450, portesY - 90, "Niveau 1", { fontSize: "24px", fill: "#fff" }).setOrigin(0.5);
    this.add.text(650, portesY - 90, "Niveau 2", { fontSize: "24px", fill: "#fff" }).setOrigin(0.5);
    this.add.text(850, portesY - 90, "Niveau 3", { fontSize: "24px", fill: "#fff" }).setOrigin(0.5);

    // --- Leaderboards (Top 5 times) affichés au-dessus des portes ---
    try {
      const makeKey = (n) => `speedrun_scores_level${n}`;
      const formatTime = (ms) => {
        const total = Math.max(0, Math.floor(ms));
        const minutes = Math.floor(total / 60000);
        const seconds = Math.floor((total % 60000) / 1000);
        const millis = total % 1000;
        return String(minutes).padStart(2,'0') + ':' + String(seconds).padStart(2,'0') + '.' + String(millis).padStart(3,'0');
      };

      const loadScores = (n) => {
        try {
          const raw = localStorage.getItem(makeKey(n));
          if (!raw) return [];
          const arr = JSON.parse(raw);
          if (!Array.isArray(arr)) return [];
          // each entry: {name, ms}
          return arr.slice().sort((a,b)=> a.ms - b.ms).slice(0,5);
        } catch (e) { return []; }
      };

      // create container if not exists
      let boards = document.getElementById('leaderboards-container');
      if (!boards) {
        boards = document.createElement('div');
        boards.id = 'leaderboards-container';
        boards.style.position = 'absolute';
        boards.style.left = '50%';
        boards.style.transform = 'translateX(-50%)';
        // position au-dessus des portes (ajustable)
        boards.style.top = '25%';
        boards.style.width = '80%';
        boards.style.maxWidth = '1000px';
        boards.style.pointerEvents = 'none';
        boards.style.display = 'flex';
        boards.style.justifyContent = 'center';
        boards.style.alignItems = 'center';
        boards.style.gap = '20px';
        boards.style.zIndex = '999';
        document.body.appendChild(boards);
      }

      // helper to create single board
      const makeBoard = (n) => {
        const boardId = `leaderboard-n${n}`;
        let b = document.getElementById(boardId);
        if (!b) {
          b = document.createElement('div');
          b.id = boardId;
          b.style.minWidth = '250px';
          b.style.maxWidth = '300px';
          b.style.pointerEvents = 'auto';
          b.style.background = 'rgba(0,0,0,0.75)';
          b.style.color = '#fff';
          b.style.borderRadius = '12px';
          b.style.padding = '15px 20px';
          b.style.margin = '0 10px';
          b.style.boxSizing = 'border-box';
          b.style.textAlign = 'center';
          b.style.fontFamily = 'Georgia, "Times New Roman", serif';
          b.style.fontSize = '20px';
          boards.appendChild(b);
        }
        const scores = loadScores(n);
        let html = `<div style="font-weight:700;margin-bottom:6px;">Top 5 - Niveau ${n}</div>`;
        if (scores.length === 0) {
          html += `<div style="opacity:0.5">Aucun score enregistré</div>`;
        } else {
          html += '<ol style="padding-left:20px;margin:0;text-align:left;">';
          scores.forEach(s => {
            const name = s.name || 'Anonyme';
            html += `<li style="margin-bottom:4px;">${name} — ${formatTime(s.ms)}</li>`;
          });
          html += '</ol>';
        }
        b.innerHTML = html;
      };

      // create/update three boards
      makeBoard(1); makeBoard(2); makeBoard(3);

      // store reference for cleanup
      this._leaderboardsContainer = boards;
      this._leaderboardIds = ['leaderboard-n1','leaderboard-n2','leaderboard-n3'];

      // remove boards on scene shutdown/destroy
      this.sys.events.on('shutdown', () => {
        try { if (this._leaderboardsContainer) { this._leaderboardsContainer.remove(); this._leaderboardsContainer = null; } } catch (e) {}
      });
      this.sys.events.on('destroy', () => {
        try { if (this._leaderboardsContainer) { this._leaderboardsContainer.remove(); this._leaderboardsContainer = null; } } catch (e) {}
      });
    } catch (e) {
      // ignore DOM errors
    }

    // Création du J1
    player = this.physics.add.sprite(450, 600, "img_perso");
    player.refreshBody();
    player.setBounce(0.15);
    player.setCollideWorldBounds(true);
    player.setSize(26, 58); // Hitbox identique à niveau1.js
  // propriétés pour lissage des déplacements (comme niveau1)
  player.smoothVel = 0;
  player.targetVel = 0;

    // A l'avenir, il faudra retirer les portes des niveaux 2 et 3 pour que le joueur n'accède qu'au premier niveau puis progresse normalement.

    // Animations J1
    this.anims.create({
      key: "anim_tourne_gauche",
      frames: this.anims.generateFrameNumbers("img_perso", { start: 9, end: 15 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "anim_face",
      frames: this.anims.generateFrameNumbers("img_perso_idle", { start: 5, end: 6 }),
      frameRate: 20
    });
    this.anims.create({
      key: "anim_tourne_droite",
      frames: this.anims.generateFrameNumbers("img_perso", { start: 25, end: 31 }),
      frameRate: 10,
      repeat: -1
    });

    // Contrôles clavier J1
    clavier = this.input.keyboard.createCursorKeys();
  // Remap J1 jump to K
  clavier.up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    //clavier.menu = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    clavier.action = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I); // Touche I pour actions

    // // Image retour au menu (visuel seulement)
    // this.add.image(100, 60, "retour_menu").setOrigin(0.5);
  }

  update() {
    // Contrôles J1
    // Mouvements lissés pour la sélection
    let desiredVel = 0;
    if (clavier.left.isDown) {
      desiredVel = -160;
      player.anims.play("anim_tourne_gauche", true);
    } else if (clavier.right.isDown) {
      desiredVel = 160;
      player.anims.play("anim_tourne_droite", true);
    } else {
      desiredVel = 0;
      player.anims.play("anim_face");
    }

    // interpolation simple
    player.targetVel = desiredVel;
  const pressLerpSel = 0.6;
  const releaseLerpSel = 0.45;
    const lerpFactorSel = Math.abs(player.targetVel) > Math.abs(player.smoothVel) ? pressLerpSel : releaseLerpSel;
    player.smoothVel = Phaser.Math.Linear(player.smoothVel, player.targetVel, lerpFactorSel);
  if (Math.abs(player.smoothVel) < 2) player.smoothVel = 0;
    player.setVelocityX(Math.round(player.smoothVel));
    // Saut
    if (clavier.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }

    // Choix du niveau
    if (Phaser.Input.Keyboard.JustDown(clavier.space) || Phaser.Input.Keyboard.JustDown(clavier.action)) {
      // Récupérer le mode de jeu depuis les données de scène
      const gameMode = this.scene.settings.data?.mode || 'histoire';
      
      // En mode speedrun, on lance les versions speedrun des niveaux
      if (gameMode === 'speedrun') {
        if (this.physics.overlap(player, this.porte1)) this.scene.start("niveau1_speedrun");
        if (this.physics.overlap(player, this.porte2)) this.scene.start("niveau2_speedrun");
        if (this.physics.overlap(player, this.porte3)) this.scene.start("niveau3_speedrun");
      } else {
        // En mode histoire, on garde la logique originale avec les vidéos
        if (this.physics.overlap(player, this.porte1)) this.scene.start("introvideo3");
        if (this.physics.overlap(player, this.porte2)) this.scene.switch("niveau2");
        if (this.physics.overlap(player, this.porte3)) this.scene.switch("niveau3");
      }
    }

      
  }
}