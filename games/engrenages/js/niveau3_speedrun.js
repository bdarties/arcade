// Scène du niveau 1 : plateformes, joueur, gestion de la mort
import { musicManager } from './MusicManager.js';

export default class niveau3_speedrun extends Phaser.Scene {
  constructor() {
    super({ key: "niveau3_speedrun" });
  }

  preload() {
    // Précharger la musique spécifique au mode speedrun
    this.load.audio('music_speedrun', 'assets/son/music_speedrun.mp3');
    this.load.image("background_niveau1", "assets/background.jpg");
    this.load.image("background_niveau1.1", "assets/background_niveau1.1.jpg");
    this.load.image("background_niveau1.2", "assets/background_niveau1.2.jpg");
    this.load.audio("ramassage_engrenage", "assets/son/ramassage_engrenage.mp3");
  // image additionnelle d'arrière-plan (derrière les autres)
  this.load.image("background_niveau1.3", "assets/background_niveau1.3.jpg");
    this.load.image("tiles", "assets/tileset.png");
    this.load.image("selection", "assets/selection.png");
  // terminal and victory screen used by level exit
  this.load.image('terminal', 'assets/terminal_rempli.png');
  this.load.image('screen_victoire', 'assets/screen_victoire.png');
    this.load.image("retour_menu", "assets/retour_menu.png");
    this.load.tilemapTiledJSON("map_niveau1", "maps/map_niveau1.json");
    this.load.spritesheet("img_perso1", "assets/mouv_J1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("img_perso2", "assets/mouv_J2.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("J1_idle", "assets/idle_J1.png", { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("J2_idle", "assets/idle_J2.png", { frameWidth: 64, frameHeight: 64 });
  // Charger le feu en tant que spritesheet (4 frames, chaque frame 475x200)
  // Le fichier peut garder le nom 'assets/feu.png' mais doit être un spritesheet
  this.load.spritesheet('feu', 'assets/feu.png', { frameWidth: 475, frameHeight: 200 });
    // animation de saut pour J1 (utilisée dans niveau2)
  this.load.spritesheet("J1_jump", "assets/jump_J1.png", { frameWidth: 64, frameHeight: 64 });
  // animation de saut pour J2
  this.load.spritesheet("J2_jump", "assets/jump_J2.png", { frameWidth: 64, frameHeight: 64 });
  // Assets pour les boutons et plateformes contrôlables (utilisés dans la map)
  this.load.image('bouton', 'assets/boutons.png');
    this.load.image('porte2y', 'assets/porte2y.png');
    this.load.image('porte3y', 'assets/porte3y.png');
    this.load.image('2x1x', 'assets/2x1x.png');
    this.load.image('2x1y', 'assets/2x1y.png');
    this.load.image('2x2', 'assets/2x2.png');
  // Sons utilisés dans ce niveau
  this.load.audio('button_on', 'assets/son/button_on.mp3');
  this.load.audio('button_off', 'assets/son/button_off.mp3');
  // sons de gasp du joueur 1
  this.load.audio('j1_gasp1', 'assets/son/j1_gasp1.mp3');
  this.load.audio('j1_gasp2', 'assets/son/j1_gasp2.mp3');
  this.load.audio('j1_gasp3', 'assets/son/j1_gasp3.mp3');
  this.load.audio('j1_gasp4', 'assets/son/j1_gasp4.mp3');
  this.load.audio('j1_gasp5', 'assets/son/j1_gasp5.mp3');
  this.load.audio('j1_gasp6', 'assets/son/j1_gasp6.mp3');
  // sons de gasp du joueur 2 (symétrique à J1)
  this.load.audio('j2_gasp1', 'assets/son/j2_gasp1.mp3');
  this.load.audio('j2_gasp2', 'assets/son/j2_gasp2.mp3');
  this.load.audio('j2_gasp3', 'assets/son/j2_gasp3.mp3');
  this.load.audio('j2_gasp4', 'assets/son/j2_gasp4.mp3');
  this.load.audio('j2_gasp5', 'assets/son/j2_gasp5.mp3');
  this.load.audio('j2_gasp6', 'assets/son/j2_gasp6.mp3');
  // musique spécifique du niveau 1
  this.load.audio('level1_music', 'assets/son/endofyourworld.mp3');
  }

  create() {
    // Initialiser et jouer la musique
        musicManager.scene = this;
        musicManager.play('niveau3_speedrun');    // Configuration des touches pour le menu pause (P ou Y)
    this.input.keyboard.on('keydown-P', () => {
      this.scene.pause();
      this.scene.launch('pause');
    });
    this.input.keyboard.on('keydown-Y', () => {
      this.scene.pause();
      this.scene.launch('pause');
    });

    // Initialisation des sons pour ce niveau
    this.sounds = {
      buttonOn: this.sound.add('button_on'),
      buttonOff: this.sound.add('button_off')
    };

    // Helper: dessiner un rectangle en pointillés sur un Graphics
    // attaché à la scène pour être réutilisable depuis update()
    this.drawDashedRect = (g, x, y, w, h, color, thickness = 3, dashLen = 10, gap = 6, offset = 0) => {
      try {
        g.lineStyle(thickness, color, 1);
        const phase = offset % (dashLen + gap);
        // top (gauche -> droite) avec offset
        for (let sx = x + phase; sx < x + w + (dashLen + gap); sx += dashLen + gap) {
          const start = sx;
          const ex = Math.min(sx + dashLen, x + w);
          if (start < x + w) g.strokeLineShape(new Phaser.Geom.Line(Math.max(start, x), y, ex, y));
        }
        // right (haut -> bas)
        for (let sy = y + phase; sy < y + h + (dashLen + gap); sy += dashLen + gap) {
          const start = sy;
          const ey = Math.min(sy + dashLen, y + h);
          if (start < y + h) g.strokeLineShape(new Phaser.Geom.Line(x + w, Math.max(start, y), x + w, ey));
        }
        // bottom (droite -> gauche)
        for (let sx = x + w - phase; sx > x - (dashLen + gap); sx -= dashLen + gap) {
          const start = sx;
          const ex = Math.max(sx - dashLen, x);
          if (start > x) g.strokeLineShape(new Phaser.Geom.Line(start, y + h, Math.max(ex, x), y + h));
        }
        // left (bas -> haut)
        for (let sy = y + h - phase; sy > y - (dashLen + gap); sy -= dashLen + gap) {
          const start = sy;
          const ey = Math.max(sy - dashLen, y);
          if (start > y) g.strokeLineShape(new Phaser.Geom.Line(x, start, x, Math.max(ey, y)));
        }
      } catch (e) {
        try { g.strokeRect(x, y, w, h); } catch (e) {}
      }
    };
  // vitesse par défaut en pixels par seconde pour le défilement des pointillés
  this._dashSpeed = 32; // ajustable : plus petit => plus lent



  
    // map et tileset
    const map = this.make.tilemap({ key: "map_niveau1" });
    const tileset = map.addTilesetImage("tileset", "tiles");
    const backgroundLayer = map.createLayer("background", tileset, 0, 0);
    const backgroundLayer2 = map.createLayer("background_2", tileset, 0, 0);
    const backgroundLayer3 = map.createLayer("background_3", tileset, 0, 0);
  // mettre ce calque devant les joueurs (valeur > 0). Choisie 5 pour rester simple.
  if (backgroundLayer3) backgroundLayer3.setDepth(5);
    const platformsLayer = map.createLayer("platforms", tileset, 0, 0);
    if (platformsLayer) {
      platformsLayer.setCollisionBetween(1, 9999); // Collision sur tous les tiles non-vides
    }
    // Ensure the 'doors' layer from Tiled is created and visible
    const doorsLayer = map.createLayer("doors", tileset, 0, 0);
    if (doorsLayer) doorsLayer.setDepth(1);

  

  // Image de fond centrée demandée (le centre de l'image est à x=1568, y=3776)
  // Put it in front of the base background but still behind tile layers/players
  this.add.image(1568, 5275, "background_niveau1.1").setOrigin(0.5, 0.5).setDepth(-3);

  // Nouvel arrière-plan supplémentaire placé derrière les autres
  this.add.image(1536, 3520, "background_niveau1.3").setOrigin(0.5, 0.5).setDepth(-6);

    // Deuxième image de fond demandée : centre à (544, 5472)
    // Elle sera derrière la première image (depth -2) et se déplacera horizontalement.
    const bg2InitialX = 1568;
  // Put the moving background behind the other background images
  const bg2 = this.add.image(bg2InitialX, 608, "background_niveau1.2").setOrigin(0.5, 0.5).setDepth(-5);

    // Déplacement horizontal: de la position initiale vers la droite de `moveRange` en 2 minutes (120000 ms).
    // Remarque : j'ai choisi une amplitude de 300px par défaut. Si vous voulez une autre distance, indiquez-la.
    const moveRange = 300;
    this.tweens.add({
      targets: bg2,
      x: bg2InitialX + moveRange,
      duration: 120000,
      ease: 'Linear',
      yoyo: true,
      repeat: -1
    });

  // (debug lines removed) bg2 kept at a deep negative depth so it stays behind other backgrounds

    // Création du J1
    this.player1 = this.physics.add.sprite(1568, 608, "img_perso1");
    this.player1.setBounce(0.15);
    this.player1.setCollideWorldBounds(true);
    this.player1.setSize(26, 58);
  // s'assurer que le joueur est rendu au-dessus des overlays d'indication
  this.player1.setDepth(20);
  // propriétés pour lissage des déplacements (utilisées pour une décélération "bezier-like" simple)
  this.player1.smoothVel = 0;
  this.player1.targetVel = 0;
  this.clavier1 = this.input.keyboard.createCursorKeys();
  // Remap J1 jump to K
  this.clavier1.up = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
  this.clavier1.menu = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M); // Touche M pour menu J1
  this.clavier1.action = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I); // Touche I pour action J1

    // Création du J2
    this.player2 = this.physics.add.sprite(1568, 5664, "img_perso2");
    this.player2.setBounce(0.15);
    this.player2.setCollideWorldBounds(true);
    this.player2.setSize(26, 58);
  // s'assurer que le joueur est rendu au-dessus des overlays d'indication
  this.player2.setDepth(20);
  // propriétés pour lissage des déplacements du joueur 2
  this.player2.smoothVel = 0;
  this.player2.targetVel = 0;
    this.clavier2 = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.F, // J2 jump -> F
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      menu: Phaser.Input.Keyboard.KeyCodes.H, // Touche H pour menu J2
      action: Phaser.Input.Keyboard.KeyCodes.R // Touche R pour action J2
    });

    // Split screen : 2 caméras qui suivent chaque joueur
  this.cameras.main.setViewport(0, 0, 640, 720);
  this.camera2 = this.cameras.add(608, 0, 672, 720);
  this.cameras.main.centerOn(1600, 608);
  // activer un léger lissage (lerp) pour la caméra du joueur 2 afin d'adoucir ses mouvements
  // (les valeurs 0.08/0.12 sont simples et donnent une bonne sensation sans complexité)
  this.camera2.startFollow(this.player2, true, 0.12, 0.12);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.camera2.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Collisions
      this.physics.add.collider(this.player1, platformsLayer);
      this.physics.add.collider(this.player2, platformsLayer);

    // --- BOUTONS ET PLATEFORMES CONTRÔLABLES (depuis Tiled) ---
    // Récupération des boutons depuis la map (calque "buttons")
    const buttonsObjects = map.getObjectLayer('buttons')?.objects || [];
    this.boutons = this.physics.add.group({ allowGravity: false, immovable: true });

    buttonsObjects.forEach(obj => {
      // créer un sprite de bouton centré sur l'objet Tiled
      const bw = obj.width || 32;
      const bh = obj.height || 32;
      const cx = obj.x + bw / 2;
      const cy = obj.y + bh / 2;
  const bouton = this.physics.add.sprite(cx, cy, 'bouton');
      bouton.setOrigin(0.5, 0.5);
      bouton.setImmovable(true);
      bouton.body.setGravityY(0);
      bouton.setSize(32, 28);
      // récupère l'identifiant personnalisé depuis Tiled (propriété 'bouton_id')
      bouton.obstacleId = obj.properties?.find(p => p.name === 'bouton_id')?.value || obj.name;
      bouton.isActivated = false;

      // couleur du bouton selon son id
      const colorMap = {
        jaune: 0xFFFF00,
        rouge: 0xFF0000,
        bleu: 0x6699FF,
        vert: 0x66FF66,
        violet: 0xCC66FF
      };
      const tint = colorMap[bouton.obstacleId];
      if (tint) bouton.setTint(tint);

      this.boutons.add(bouton);
    });

  // Récupération des plateformes et portes contrôlables depuis la map
  const blocksObjects = map.getObjectLayer('platforms_boutons')?.objects || map.getObjectLayer('platforms_buttons')?.objects || [];
  const doorsObjects = map.getObjectLayer('doors_buttons')?.objects || map.getObjectLayer('doors_boutons')?.objects || [];

  this.platforms_boutons = this.physics.add.group({ allowGravity: false, immovable: true, moves: false });
  this.platforms_boutons_portes = this.physics.add.group({ allowGravity: false, immovable: true, moves: false });
  this.platforms_boutons_blocs = this.physics.add.group({ allowGravity: false, immovable: true, moves: false });

  const colorMap = { jaune: 0xFFFF00, rouge: 0xFF0000, bleu: 0x6699FF, vert: 0x66FF66, violet: 0xCC66FF };

  // --- blocs (toujours non-solides au départ)
  blocksObjects.forEach(obj => {
      const spriteKey = obj.properties?.find(p => p.name === 'type')?.value || '2x1x';
      const pw = obj.width || 32;
      const ph = obj.height || 32;
      const pcx = obj.x + pw / 2;
      const pcy = obj.y + ph / 2;
      const platform = this.physics.add.sprite(pcx, pcy, spriteKey);
      platform.setOrigin(0.5, 0.5);
      platform.setImmovable(true);
      platform.body.setGravityY(0);
      platform.setDisplaySize(pw, ph);
      
      // Configuration du corps physique
      if (platform.body && platform.body.setSize) {
        const bw = Math.round(platform.displayWidth);
        const bh = Math.round(platform.displayHeight);
        platform.body.setSize(bw, bh);
        const offsetX = Math.round((platform.displayWidth * platform.originX) - (platform.body.width / 2));
        const offsetY = Math.round((platform.displayHeight * platform.originY) - (platform.body.height / 2));
        if (platform.body.setOffset) platform.body.setOffset(offsetX, offsetY);
      }


      platform.obstacleId = obj.properties?.find(p => p.name === 'activated_by')?.value || obj.name;
      const roleProp = obj.properties?.find(p => p.name === 'role')?.value || 'bloc';
      platform.role = roleProp;
      // Par simplicité: toutes les plateformes venant du calque contrôlable
      // sont traversables au début (physique désactivée). Les boutons activeront
      // la solidité plus tard via activerBouton.
      platform.estSolide = false;

      // Appliquer la couleur
      const ptint = colorMap[platform.obstacleId];
      if (ptint) platform.setTint(ptint);

      // Désactiver la physique au départ et rendre légèrement transparent
      platform.setAlpha(0.6);
      if (platform.body) platform.body.enable = false;
      platform.refreshBody();

      // Créer un overlay graphique coloré pour rendre la plateforme plus visible
      try {
        const base = ptint || 0xffffff;
        const overlay = this.add.graphics();
    overlay.fillStyle(base, 0.14);
    overlay.fillRect(Math.round(pcx - pw / 2), Math.round(pcy - ph / 2), Math.round(pw), Math.round(ph));
    // contour en pointillés pour bien distinguer la plateforme
    this.drawDashedRect(overlay, Math.round(pcx - pw / 2), Math.round(pcy - ph / 2), Math.round(pw), Math.round(ph), base, 3, 10, 6, 0);
        overlay.setDepth(5); // au-dessus du tileset mais en-dessous des joueurs (players depth = 20)
        overlay.setVisible(!platform.estSolide);
        // stocker l'overlay sur la plateforme pour y accéder plus tard
        platform._overlay = overlay;
        // stocker paramètres pour redraw animé
        overlay._dashOffset = 0;
        overlay._dashParams = { x: Math.round(pcx - pw / 2), y: Math.round(pcy - ph / 2), w: Math.round(pw), h: Math.round(ph), color: base, thickness: 3, dashLen: 10, gap: 6 };
        // dessin initial (remplissage + contour pointillé)
        overlay.clear();
        overlay.fillStyle(base, 0.14);
        overlay.fillRect(overlay._dashParams.x, overlay._dashParams.y, overlay._dashParams.w, overlay._dashParams.h);
        this.drawDashedRect(overlay, overlay._dashParams.x, overlay._dashParams.y, overlay._dashParams.w, overlay._dashParams.h, base, 3, 10, 6, overlay._dashOffset);
        // effet de pulsation discret pour attirer l'œil
        this.tweens.add({ targets: overlay, alpha: { from: 0.6, to: 0.85 }, duration: 700, yoyo: true, repeat: -1 });
      } catch (e) {
        // si l'overlay échoue, ne pas casser le reste
      }

      // Ajouter aux groupes en dernier
  this.platforms_boutons.add(platform);
  this.platforms_boutons_blocs.add(platform);
    });

    // --- portes (généralement solides au départ)
    doorsObjects.forEach(obj => {
      const spriteKey = obj.properties?.find(p => p.name === 'type')?.value || 'porte2y';
      const pw = obj.width || 32;
      const ph = obj.height || 32;
      const pcx = obj.x + pw / 2;
      const pcy = obj.y + ph / 2;
  const platform = this.physics.add.sprite(pcx, pcy, spriteKey);
  platform.setOrigin(0.5, 0.5);
  platform.setImmovable(true);
  platform.body.setGravityY(0);
      // forcer la taille d'affichage à la taille de l'objet Tiled (pw x ph)
      platform.setDisplaySize(pw, ph);
      // s'assurer que le corps Arcade corresponde à la taille d'affichage
      if (platform.body && platform.body.setSize) {
        const bw = Math.round(platform.displayWidth);
        const bh = Math.round(platform.displayHeight);
        platform.body.setSize(bw, bh);
        const offsetX = Math.round((platform.displayWidth * platform.originX) - (platform.body.width / 2));
        const offsetY = Math.round((platform.displayHeight * platform.originY) - (platform.body.height / 2));
        if (platform.body.setOffset) platform.body.setOffset(offsetX, offsetY);
      }

      platform.obstacleId = obj.properties?.find(p => p.name === 'activated_by')?.value || obj.name;
      const estSolideProp = obj.properties?.find(p => p.name === 'estSolide')?.value;
      const roleProp = obj.properties?.find(p => p.name === 'role')?.value || 'porte';
      platform.role = roleProp;

      // Utiliser la propriété estSolide de Tiled
      platform.estSolide = (typeof estSolideProp === 'boolean') ? estSolideProp : true;

      const ptint = colorMap[platform.obstacleId];
      if (ptint) platform.setTint(ptint);

      if (platform.estSolide) {
        platform.setAlpha(1);
        if (platform.body) {
          platform.body.enable = true;
        }
        // créer colliders par-plateforme pour que les portes solides bloquent les joueurs
        if (!platform._collider1) platform._collider1 = this.physics.add.collider(this.player1, platform);
        if (!platform._collider2) platform._collider2 = this.physics.add.collider(this.player2, platform);
      } else {
        platform.setAlpha(0.6);
        if (platform.body) platform.body.enable = false;
      }
      platform.refreshBody();

        // Ne pas créer d'overlay pour les portes — on ne veut que pour les plateformes

      this.platforms_boutons.add(platform);
      this.platforms_boutons_portes.add(platform);
    });

      // Terminal (calque 'terminal' similaire au niveau3)
      const terminalObjects = map.getObjectLayer('terminal')?.objects || [];
      const terminalObj = terminalObjects.find(o => o.name === 'terminal') || terminalObjects[0];
      if (terminalObj) {
        // utiliser l'image 'terminal' et centrer le sprite sur l'objet Tiled
        const tx = terminalObj.x + (terminalObj.width || 0) / 2;
        const ty = terminalObj.y + (terminalObj.height || 0) / 2;
        this.porte_retour = this.physics.add.sprite(tx, ty, 'terminal');
        this.porte_retour.setOrigin(0.5, 0.5);
        this.porte_retour.body.setAllowGravity(false);
        this.porte_retour.setImmovable(true);
        if (terminalObj.width && terminalObj.height) this.porte_retour.setDisplaySize(terminalObj.width, terminalObj.height);
      }
   
    if (this.textures && this.textures.exists && this.textures.exists('feu')) {
    // Position fixe en pixels : départ (1536,5920) -> cible (1536,1280)
    const feuX = 1536;
    const feuStartY = 6620;
    const feuTargetY = 3340;
      // créer le sprite physique du feu et lancer l'animation (4 frames)
      this.feu = this.physics.add.sprite(feuX, feuStartY, 'feu');
      this.feu.setImmovable(true);
      this.feu.body.allowGravity = false;    
      if (!this.anims.exists('feu_anim')) {
        this.anims.create({
          key: 'feu_anim',
          frames: this.anims.generateFrameNumbers('feu', { start: 0, end: 3 }),
          frameRate: 12,
          repeat: -1
        });
      }
      this.feu.play('feu_anim');

      // Agrandir le feu (zoom) : modifier ce facteur pour augmenter/réduire
      const feuScale = 2.5; // valeur par défaut, change-la si besoin
      const frameW = 475;
      const frameH = 200;
      // Appliquer une taille d'affichage basée sur la taille d'une frame * scale
      this.feu.setDisplaySize(Math.round(frameW * feuScale), Math.round(frameH * feuScale));
      // Ajuster le corps Arcade pour correspondre à la nouvelle taille
      if (this.feu.body && this.feu.body.setSize) {
        const bw = Math.round(frameW * feuScale);
        const bh = Math.round(frameH * feuScale);
        this.feu.body.setSize(bw, bh);
        // centrer le hitbox par rapport à l'origine du sprite
        const offsetX = Math.round((this.feu.displayWidth * this.feu.originX) - (this.feu.body.width / 2));
        const offsetY = Math.round((this.feu.displayHeight * this.feu.originY) - (this.feu.body.height / 2));
        if (this.feu.body.setOffset) this.feu.body.setOffset(offsetX, offsetY);
      }

      // Durée en ms pour que le feu monte du bas jusqu'en haut (modifiez si besoin)
      const riseDuration = 90000; // 15 secondes par défaut

      // Tween pour faire monter le feu jusqu'à la tuile (endTileY)
      // onComplete ne détruit plus le sprite : le feu restera à la position cible
      this.tweens.add({
        targets: this.feu,
        y: feuTargetY,
        duration: riseDuration,
        ease: 'Linear'
      });

      // Si J2 touche le feu => mort et restart du niveau
      this.physics.add.overlap(this.player2, this.feu, () => {
        // arrêter la musique du niveau pour qu'elle reparte du début au restart
        try {
          if (window.level1Music && window.level1Music.isPlaying) {
            window.level1Music.stop();
          }
        } catch (e) {}
        // ici on peut lancer une animation/son de mort
        this.scene.restart();
      }, null, this);
    } else {
      console.warn("Texture 'feu' introuvable — ajoutez assets/feu.png si vous voulez activer le feu montant.");
    }

    // // Bouton retour menu au-dessus de selection
    // const retourMenuBtn = this.add.image(100, 60, "retour_menu").setScrollFactor(0).setDepth(100).setInteractive();
    // retourMenuBtn.on("pointerup", () => {
    //   this.scene.start("accueil");
    // });

    // // Image selection en haut de l'écran
    // this.add.image(100, 100, "selection").setScrollFactor(0).setDepth(100);

    this.add.text(400, 100, "Vous êtes dans le niveau 1", {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: "22pt"
    });

    // --- Chronomètre HUD via overlay DOM (unique au-dessus du canvas) ---
    // Utilise l'élément #controls-hud déjà présent dans index.html pour afficher
    // le chrono une seule fois, au-dessus des deux caméras (évite duplication).
    try {
      // formatTime utilitaire
      this.formatTime = function(ms) {
        const total = Math.max(0, Math.floor(ms));
        const minutes = Math.floor(total / 60000);
        const seconds = Math.floor((total % 60000) / 1000);
        const millis = total % 1000;
        return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') + '.' + String(millis).padStart(3, '0');
      };

      // Créer / récupérer le container DOM
      const hudContainer = document.getElementById('controls-hud');
      if (hudContainer) {
        // créer un span si nécessaire
        let span = document.getElementById('speedrun-timer');
        if (!span) {
          span = document.createElement('div');
          span.id = 'speedrun-timer';
          // style minimal : centré, monospace, padding pour lisibilité
          span.style.fontFamily = '"Courier New", monospace';
          span.style.fontSize = '28px';
          span.style.color = '#ffffff';
          span.style.background = 'rgba(0,0,0,0.35)';
          span.style.padding = '6px 14px';
          span.style.borderRadius = '8px';
          span.style.pointerEvents = 'none';
          span.style.textAlign = 'center';
          span.style.minWidth = '200px';
          span.style.boxSizing = 'border-box';
          span.style.position = 'absolute';
          span.style.top = '8px';
          span.style.left = '50%';
          span.style.transform = 'translateX(-50%)';
          span.style.zIndex = '9999';
          span.innerText = this.formatTime(0);
          hudContainer.appendChild(span);
          try { span.style.display = ''; } catch (e) {}
        }
  // stocker la référence pour update() / hide
  this.domTimer = span;
  try { this.domTimer.style.display = ''; this.domTimer.style.position = 'absolute'; this.domTimer.style.zIndex = '9999'; } catch (e) {}
      } else {
        this.domTimer = null;
      }

      // démarrage du timer
      this.timerStart = this.time.now;
      this.timerRunning = true;
    } catch (e) {
      this.domTimer = null;
      this.timerStart = this.time.now;
      this.timerRunning = true;
    }

    // Animations J1
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("img_perso1", { start: 9, end: 15 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "turn",
      frames: this.anims.generateFrameNumbers("J1_idle", { start: 5, end: 6 }),
      frameRate: 20
    });
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("img_perso1", { start: 25, end: 31 }),
      frameRate: 10,
      repeat: -1
    });

    // Jump animations (copied from niveau2)
    this.anims.create({ key: "jump_right", frames: this.anims.generateFrameNumbers("J1_jump", { start: 17, end: 19 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: "jump_left", frames: this.anims.generateFrameNumbers("J1_jump", { start: 7, end: 9 }), frameRate: 10, repeat: 0 });
    this.anims.create({ key: "jump_idle", frames: this.anims.generateFrameNumbers("J1_jump", { start: 12, end: 14 }), frameRate: 10, repeat: 0 });

    // état du saut et handler d'animation (comme niveau2)
    this.player1.jumpPlayed = false;
    this.player1.on('animationcomplete', (anim, frame) => {
      if (anim.key === 'jump_right' || anim.key === 'jump_left' || anim.key === 'jump_idle') {
        try {
          const frames = anim.frames;
          if (frames && frames.length) {
            const last = frames[frames.length - 1];
            const frameIndex = (last.frame && (last.frame.index ?? last.frame.name)) ?? last.index;
            if (typeof frameIndex === 'number') this.player1.setFrame(frameIndex);
          }
        } catch (e) {}
      }
    });

    this.player2.jumpPlayed = false;
    this.player2.on('animationcomplete', (anim, frame) => {
      if (anim.key === 'jump_right2' || anim.key === 'jump_left2' || anim.key === 'jump_idle2') {
        try {
          const frames = anim.frames;
          if (frames && frames.length) {
            const last = frames[frames.length - 1];
            const frameIndex = (last.frame && (last.frame.index ?? last.frame.name)) ?? last.index;
            if (typeof frameIndex === 'number') this.player2.setFrame(frameIndex);
          }
        } catch (e) {}
      }
    });

    // Animations J2
    this.anims.create({
      key: "left2",
      frames: this.anims.generateFrameNumbers("img_perso2", { start: 9, end: 15 }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "idle2",
      frames: this.anims.generateFrameNumbers("J2_idle", { start: 5, end: 6 }),
      frameRate: 20
    });
    this.anims.create({
      key: "right2",
      frames: this.anims.generateFrameNumbers("img_perso2", { start: 25, end: 31 }),
      frameRate: 10,
      repeat: -1
    });
    // Jump animations for J2
    this.anims.create({ key: "jump_right2", frames: this.anims.generateFrameNumbers("J2_jump", { start: 15, end: 19 }), frameRate: 20, repeat: 0 });
    this.anims.create({ key: "jump_left2", frames: this.anims.generateFrameNumbers("J2_jump", { start: 5, end: 9 }), frameRate: 20, repeat: 0 });
    this.anims.create({ key: "jump_idle2", frames: this.anims.generateFrameNumbers("J2_jump", { start: 10, end: 14 }), frameRate: 20, repeat: 0 });
  }

  update(time, delta) {
    // Mettre à jour le chronomètre si actif (DOM overlay)
    try {
      if (this.timerRunning && this.domTimer && this.timerStart) {
        const elapsed = Math.max(0, this.time.now - this.timerStart);
        this.domTimer.innerText = this.formatTime(elapsed);
      }
    } catch (e) {}
    // J1 (mouvements lissés)
    const isOnGround = this.player1.body.blocked.down || this.player1.body.touching.down;

    // Gestion du saut (inchangée)
    if (this.clavier1.up.isDown && isOnGround) {
  this.player1.setVelocityY(-300);
      if (this.clavier1.right.isDown) {
        this.player1.lastDirection = 'right';
      } else if (this.clavier1.left.isDown) {
        this.player1.lastDirection = 'left';
      } else {
        this.player1.lastDirection = this.player1.lastDirection || 'right';
      }
      if (this.player1.lastDirection === 'right') this.player1.anims.play('jump_right', true);
      else if (this.player1.lastDirection === 'left') this.player1.anims.play('jump_left', true);
      else this.player1.anims.play('jump_idle', true);
      // Une chance sur 2 de jouer un son de gasp aléatoire pour J1
      try {
        if (Phaser.Math.Between(1, 2) === 1) {
          const n = Phaser.Math.Between(1, 6);
          this.sound.play(`j1_gasp${n}`);
        }
      } catch (e) {}
      this.player1.jumpPlayed = true;
    }

    // calcul du velocity cible selon les touches (ne pas écrire directement sur le body)
    let desiredVel1 = 0;
    if (this.clavier1.left.isDown) {
      desiredVel1 = -200;
      this.player1.lastDirection = 'left';
      if (isOnGround) this.player1.anims.play('left', true);
      else if (!this.player1.jumpPlayed) { this.player1.jumpPlayed = true; this.player1.anims.play('jump_left', false); }
    } else if (this.clavier1.right.isDown) {
      desiredVel1 = 200;
      this.player1.lastDirection = 'right';
      if (isOnGround) this.player1.anims.play('right', true);
      else if (!this.player1.jumpPlayed) { this.player1.jumpPlayed = true; this.player1.anims.play('jump_right', false); }
    } else {
      desiredVel1 = 0;
      if (isOnGround) {
        this.player1.anims.play('turn');
      } else if (!this.player1.jumpPlayed) { this.player1.jumpPlayed = true; this.player1.anims.play('jump_idle', false); }
    }

    // Appliquer interpolation simple : lerp plus fort à l'appui (réactivité), plus doux au relâchement (décélération)
    this.player1.targetVel = desiredVel1;
    const pressLerp = 0.6; // quand on accélère
    const releaseLerp = 0.45; // quand on relâche, plus petit = décélération plus douce/longue
    const lerpFactor1 = Math.abs(this.player1.targetVel) > Math.abs(this.player1.smoothVel) ? pressLerp : releaseLerp;
    this.player1.smoothVel = Phaser.Math.Linear(this.player1.smoothVel, this.player1.targetVel, lerpFactor1);
    // petit seuil pour éviter des micro-mouvements
    if (Math.abs(this.player1.smoothVel) < 2) this.player1.smoothVel = 0;
    this.player1.setVelocityX(Math.round(this.player1.smoothVel));

    if (isOnGround) this.player1.jumpPlayed = false;

    // J2 (mouvements lissés + caméra déjà lissée)
    const isOnGround2 = this.player2.body.blocked.down || this.player2.body.touching.down;

    if (this.clavier2.up.isDown && isOnGround2) {
  this.player2.setVelocityY(-300);
      if (this.clavier2.right.isDown) this.player2.lastDirection = 'right';
      else if (this.clavier2.left.isDown) this.player2.lastDirection = 'left';
      else this.player2.lastDirection = this.player2.lastDirection || 'right';
      if (this.player2.lastDirection === 'right') this.player2.anims.play('jump_right2', true);
      else if (this.player2.lastDirection === 'left') this.player2.anims.play('jump_left2', true);
      else this.player2.anims.play('jump_idle2', true);
      // Une chance sur 2 de jouer un son de gasp aléatoire pour J2 (même logique que J1)
      try {
        if (Phaser.Math.Between(1, 2) === 1) {
          const n2 = Phaser.Math.Between(1, 6);
          this.sound.play(`j2_gasp${n2}`);
        }
      } catch (e) {}
      this.player2.jumpPlayed = true;
    }

    // velocity cible pour J2
    let desiredVel2 = 0;
    if (this.clavier2.left.isDown) {
      desiredVel2 = -200;
      this.player2.lastDirection = 'left';
      if (isOnGround2) this.player2.anims.play('left2', true);
      else if (!this.player2.jumpPlayed) { this.player2.jumpPlayed = true; this.player2.anims.play('jump_left2', false); }
    } else if (this.clavier2.right.isDown) {
      desiredVel2 = 200;
      this.player2.lastDirection = 'right';
      if (isOnGround2) this.player2.anims.play('right2', true);
      else if (!this.player2.jumpPlayed) { this.player2.jumpPlayed = true; this.player2.anims.play('jump_right2', false); }
    } else {
      desiredVel2 = 0;
      if (isOnGround2) this.player2.anims.play('idle2');
      else if (!this.player2.jumpPlayed) { this.player2.jumpPlayed = true; this.player2.anims.play('jump_idle2', false); }
    }

    // même logique d'interpolation que pour J1, mais on peut ajuster les facteurs indépendamment si besoin
    this.player2.targetVel = desiredVel2;
  const pressLerp2 = 0.6;
  const releaseLerp2 = 0.45; // harmonisé avec player1
    const lerpFactor2 = Math.abs(this.player2.targetVel) > Math.abs(this.player2.smoothVel) ? pressLerp2 : releaseLerp2;
    this.player2.smoothVel = Phaser.Math.Linear(this.player2.smoothVel, this.player2.targetVel, lerpFactor2);
  if (Math.abs(this.player2.smoothVel) < 2) this.player2.smoothVel = 0;
    this.player2.setVelocityX(Math.round(this.player2.smoothVel));

    if (isOnGround2) this.player2.jumpPlayed = false;

    // Touches pour retourner au menu
    if (Phaser.Input.Keyboard.JustDown(this.clavier1.menu)) {
      this.scene.start("accueil"); // J1 appuie sur M
    }
    if (Phaser.Input.Keyboard.JustDown(this.clavier2.menu)) {
      this.scene.start("accueil"); // J2 appuie sur H
    }

    // Vérification de l'activation des boutons
    if (this.boutons) {
      this.boutons.children.entries.forEach(bouton => {
        const player1NearButton = Phaser.Geom.Intersects.RectangleToRectangle(this.player1.getBounds(), bouton.getBounds());
        const player2NearButton = Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), bouton.getBounds());

        if (player1NearButton && Phaser.Input.Keyboard.JustDown(this.clavier1.action)) {
          this.activerBouton(bouton, this.player1);
        }
        if (player2NearButton && Phaser.Input.Keyboard.JustDown(this.clavier2.action)) {
          this.activerBouton(bouton, this.player2);
        }
      });
    }

    // Interaction avec le terminal : si overlap + action/space -> redirection vers 'selection'
    // initialisation de la touche R (si nécessaire)
    if (!this.keyR) this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    if (this.porte_retour && !this.victoryTriggered) {
      const p1Overlap = this.physics.overlap(this.player1, this.porte_retour);
      const p2Overlap = this.physics.overlap(this.player2, this.porte_retour);
      if ((p1Overlap || p2Overlap) && Phaser.Input.Keyboard.JustDown(this.keyR)) {
        this.victoryTriggered = true;
        // calculer le temps écoulé
        let elapsedMs = 0;
        try {
          if (this.timerRunning && this.timerStart) elapsedMs = Math.max(0, this.time.now - this.timerStart);
        } catch (e) { elapsedMs = 0; }

        // arrêter le timer et masquer proprement le HUD DOM overlay
        try {
          this.timerRunning = false;
          if (this.domTimer) {
            try { this.domTimer.innerText = this.formatTime(elapsedMs); } catch (e) {}
            try { this.domTimer.style.display = 'none'; } catch (e) {}
          }
        } catch (e) {}

        // afficher l'image de transition puis passer à la scène victoire en lui transmettant elapsedMs
        this.add.image(this.cameras.main.worldView.x + this.cameras.main.width/2, this.cameras.main.worldView.y + this.cameras.main.height/2, 'screen_victoire').setScrollFactor(0).setDepth(200);
        this.time.delayedCall(400, () => this.scene.start('victoire', {
          fromSpeedrun: true,
          elapsedMs: elapsedMs
        }), [], this);
      }
    }

    // plus de HUD contextuel (désactivé)
    // animer les overlays (décalage des pointillés) — seulement pour les blocs
    try {
      const overlays = [...this.platforms_boutons_blocs.children.entries].map(p => p._overlay).filter(o => o && o._dashParams);
      overlays.forEach(ov => {
        // incrément basé sur delta pour une animation fluide et indépendante du framerate
        ov._dashOffset = (ov._dashOffset || 0) + (this._dashSpeed * (delta / 1000));
        if (!ov.visible) return;
        ov.clear();
        ov.fillStyle(ov._dashParams.color, 0.14);
        ov.fillRect(ov._dashParams.x, ov._dashParams.y, ov._dashParams.w, ov._dashParams.h);
        // ne pas arrondir l'offset pour garder une animation fluide
        this.drawDashedRect(ov, ov._dashParams.x, ov._dashParams.y, ov._dashParams.w, ov._dashParams.h, ov._dashParams.color, ov._dashParams.thickness, ov._dashParams.dashLen, ov._dashParams.gap, ov._dashOffset);
      });
    } catch (e) {}

  }
  // Méthode pour activer un bouton : il devient gris, applique ses effets, puis se déactive au bout de 5s
  activerBouton(bouton, joueur) {
    // si déjà activé, on réinitialise le timer (prolonge l'effet)
    if (bouton.isActivated) {
      if (bouton._timer) this.time.removeEvent(bouton._timer);
      bouton._timer = this.time.delayedCall(5000, () => this.deactivateBouton(bouton), [], this);
      return;
    }

    // Activer
    bouton.isActivated = true;
    // garder la couleur de base pour restaurer plus tard
    bouton._baseColor = bouton._baseColor ?? (bouton.tintTopLeft || null);

    // afficher en gris (override visuel) sans utiliser la logique de tint précédente
    const gray = 0x888888;
    bouton.setTint(gray);

  // jouer le son d'activation
  try { if (this.sounds && this.sounds.buttonOn) this.sounds.buttonOn.play(); } catch (e) {}
    // appliquer immédiatement les effets sur les plateformes liées
    this.updatePlatformsForButton(bouton);
    // (ne pas changer davantage l'overlay ici : updatePlatformsForButton gère visibilité/tint)

    // démarrer le timer pour déactiver après 5s
    if (bouton._timer) this.time.removeEvent(bouton._timer);
    bouton._timer = this.time.delayedCall(3200, () => this.deactivateBouton(bouton), [], this);
  }

  // Déactive proprement un bouton: annule ses effets et restaure l'apparence
  deactivateBouton(bouton) {
    bouton.isActivated = false;
    // restaurer la couleur de base si connue
    if (bouton._baseColor) bouton.setTint(bouton._baseColor);
    else bouton.clearTint();
    // supprimer et nettoyer le timer
    if (bouton._timer) { this.time.removeEvent(bouton._timer); bouton._timer = null; }
    // annuler les effets sur les plateformes liées
    this.updatePlatformsForButton(bouton);

    // jouer le son de désactivation
    try { if (this.sounds && this.sounds.buttonOff) this.sounds.buttonOff.play(); } catch (e) {}
  }

  // Helper: met à jour les plateformes liées en fonction de bouton.isActivated
  updatePlatformsForButton(bouton) {
    const baseColorMap = { jaune: 0xFFFF00, rouge: 0xFF0000, bleu: 0x6699FF, vert: 0x66FF66, violet: 0xCC66FF };
    const baseColor = baseColorMap[bouton.obstacleId] || null;
    const brighten = (hex, factor = 1.1) => {
      if (!hex && hex !== 0) return null;
      const r = Math.min(255, Math.floor(((hex >> 16) & 0xff) * factor));
      const g = Math.min(255, Math.floor(((hex >> 8) & 0xff) * factor));
      const b = Math.min(255, Math.floor((hex & 0xff) * factor));
      return (r << 16) | (g << 8) | b;
    };

    const updateList = [...this.platforms_boutons_portes.children.entries, ...this.platforms_boutons_blocs.children.entries];
    updateList.forEach(p => {
      if (p.obstacleId !== bouton.obstacleId) return;
      p.estSolide = (p.role === 'porte') ? !bouton.isActivated : bouton.isActivated;

      if (p.estSolide) {
        p.setAlpha(1);
        if (p.body) p.body.enable = true;
        if (!p._collider1) p._collider1 = this.physics.add.collider(this.player1, p);
        if (!p._collider2) p._collider2 = this.physics.add.collider(this.player2, p);
        if (baseColor) p.setTint(baseColor);
        else p.clearTint();
        // cacher l'overlay si existant
        if (p._overlay) p._overlay.setVisible(false);
      } else {
        p.setAlpha(0.4);
        if (p.body) p.body.enable = false;
        if (p._collider1) { p._collider1.destroy(); p._collider1 = null; }
        if (p._collider2) { p._collider2.destroy(); p._collider2 = null; }
        if (baseColor) p.setTint(brighten(baseColor, 1.1));
        // montrer l'overlay si existant
        if (p._overlay) p._overlay.setVisible(true);
      }
      if (p.refreshBody) p.refreshBody();
    });
  }

  // ...existing code...
}