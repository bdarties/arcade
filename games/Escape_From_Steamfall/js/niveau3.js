import * as inventory from "./inventory.js";
export default class niveau3 extends Phaser.Scene {
  // constructeur de la classe
  constructor() {
    super({
      key: "niveau3" //  ici on précise le nom de la classe en tant qu'identifiant
    });
  }
  preload() {}

  create() {
    this.add.image(400, 300, "img_ciel");
    this.groupe_plateformes = this.physics.add.staticGroup();
    this.groupe_plateformes.create(200, 584, "img_plateforme");
    this.groupe_plateformes.create(600, 584, "img_plateforme");
    // ajout d'un texte distintcif  du niveau
    this.add.text(400, 100, "Vous êtes dans le shooter", {
      fontFamily: 'Georgia, "Goudy Bookletter 1911", Times, serif',
      fontSize: "22pt"
    });

    this.porte_retour = this.physics.add.staticSprite(100, 550, "img_porte3");

    this.player = this.physics.add.sprite(100, 450, "img_perso");
    this.player.refreshBody();
    this.player.setCollideWorldBounds(true);
  // Points de vie du joueur
  this.player.pv = 3;
  // Affichage des PV à l'écran
  this.playerPvText = this.add.text(16, 16, `PV: ${this.player.pv}`, { fontSize: '18px', fill: '#fff' });
    this.clavier = this.input.keyboard.createCursorKeys();
    this.physics.add.collider(this.player, this.groupe_plateformes);

    // Ajout du groupe de balles
    this.groupeBullets = this.physics.add.group();
  // On s'assure que les balles ont un marqueur d'origine (player ou cible)
  // Les balles du joueur ne doivent pas blesser le joueur
    
    this.player.direction = 'right';

    //******************
    // Determinants pour les cooldowns
    //******************
    this.player.canShoot = true; // cooldown flag
    this.player.canMelee = true; // cooldown flag for short range attack
    this.toucheF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    // onKeyDown pour la touche K
    this.toucheF.on('down', () => {
      if (this.player && this.player.canShoot) {
        this.tirer(this.player);
        this.player.canShoot = false;
        this.time.delayedCall(1000, () => { this.player.canShoot = true; });
      }
    });

    // Bind pour l'attaque courte: touche L
    this.toucheG = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
    this.toucheG.on('down', () => {
      if (this.player && this.player.canMelee) {
        this.shortRangeAttack(this.player);
        this.player.canMelee = false;
        this.time.delayedCall(300, () => { this.player.canMelee = true; });
      }
    });

    
    // =========================================
    // Ajout du groupe de cibles
    // =========================================
    this.groupeCibles = this.physics.add.group({
      key: 'cible',
      repeat: 7,
      setXY: { x: 100, y: 100, stepX: 90 }
    });
    // Ajout points de vie aléatoires et position Y aléatoire
    this.groupeCibles.children.iterate(function (cible) {
      cible.pointsVie = Phaser.Math.Between(1, 5); // points de vie aléatoires
      cible.y = Phaser.Math.Between(50, 300); // position Y aléatoire
    });
    // Overlap balles/cibles
    this.physics.add.overlap(this.groupeBullets, this.groupeCibles, this.hitCible, null, this);

  // Overlap balles/joueur
  this.physics.add.overlap(this.groupeBullets, this.player, this.hitPlayer, null, this);

    // timer pour faire tirer les cibles toutes les 1.5 secondes
    this.time.addEvent({
      delay: 1500, // delai entre les balles
      loop: true,
      callback: () => {
        this.groupeCibles.children.iterate((cible) => {
          if (cible.active) {
            this.tirerPourCible(cible, this.player);
          }
        });
      }
    });
  }


    // =========================================
    // Attaque short range
    // =========================================
    shortRangeAttack(player) {
      let offsetX = 0, offsetY = 0;
      if (player.direction === 'left') {
        offsetX = -25;
      } else if (player.direction === 'right') {
        offsetX = 25;
      } else if (player.direction === 'up') {
        offsetY = -25;
      } else if (player.direction === 'down') {
        offsetY = 25;
      }
      let attackZone = new Phaser.Geom.Rectangle(player.x + offsetX - 15, player.y + offsetY - 15, 30, 30);
      let graphics = this.add.graphics();
      graphics.lineStyle(2, 0xff0000, 1);
      graphics.strokeRectShape(attackZone);
      this.time.delayedCall(100, () => { graphics.clear(); });

      this.groupeCibles.children.iterate((cible) => {
        if (cible.active && Phaser.Geom.Rectangle.Overlaps(attackZone, cible.getBounds())) {
          cible.pointsVie--;
          if (cible.pointsVie <= 0) {
            cible.destroy();
          }
        }
      });
    }

    // =========================================
    // Tire joueur
    // =========================================
  tirer(player) {
    let vx = 0, vy = 0, offsetX = 0, offsetY = 0;
    if (player.direction === 'left') {
      vx = -500; offsetX = -25;
    } else if (player.direction === 'right') {
      vx = 500; offsetX = 25;
    } else if (player.direction === 'up') {
      vy = -500; offsetY = -25;
    } else if (player.direction === 'down') {
      vy = 500; offsetY = 25;
    }
    // Spawn un peu plus loin du joueur pour éviter l'overlap immédiat
    let spawnX = player.x + offsetX * 1.2;
    let spawnY = player.y + offsetY * 1.2;
  let bullet = this.groupeBullets.create(spawnX, spawnY, 'bullet');
    bullet.setCollideWorldBounds(true);
    bullet.body.allowGravity = false;
    bullet.setVelocity(vx, vy);
    bullet.body.onWorldBounds = true;
  bullet.canDamage = true; // peut faire des dégâts immédiatement
  bullet.origin = (player === this.player) ? 'player' : 'cible';
    // destruction automatique après 3s
    this.time.addEvent({
      delay: 3000,
      callback: () => {
        if (bullet.active) bullet.destroy();
      }
    });
  }

    // =========================================
    // Tire cible
    // =========================================
  tirerPourCible(cible, joueur) {
    // Calcul du vecteur direction
    let dx = joueur.x - cible.x;
    let dy = joueur.y - cible.y;
    let len = Math.sqrt(dx*dx + dy*dy);
    let speed = 250;
    let vx = (dx / len) * speed;
    let vy = (dy / len) * speed;

    let bullet = this.groupeBullets.create(cible.x, cible.y, 'bullet');
    bullet.setCollideWorldBounds(true);
    bullet.body.allowGravity = false;
    bullet.setVelocity(vx, vy);
    bullet.body.onWorldBounds = true;

    // Délai avant destruction automatique
    this.time.addEvent({
      delay: 3000,
      callback: () => {
        if (bullet.active) bullet.destroy();
      }
    });

    bullet.origin = 'cible';
  };

  // gestion des collisions balle/cible
  hitCible(bullet, cible) {
    // ne pas blesser les cibles avec leurs propres balles, mais accepter les balles du joueur
    if (bullet.origin === 'cible') return;
    
    // Appliquer dégât
    cible.pointsVie--;
    // Destruction de la balle
    if (bullet.active) bullet.destroy();
    // Si PV à 0 on détruit la cible
    if (cible.pointsVie <= 0) {
      cible.destroy();
    }
  }
  // gestion des collisions balle/joueur
  hitPlayer(player, bullet) {
    // ne pas se blesser avec ses propres balles, mais accepter les balles des cibles
    if (bullet.origin === 'player') return;

    // Appliquer dégât
  player.pv--;
  if (player.pv < 0) player.pv = 0;
  // Mettre à jour l'affichage
  if (this.playerPvText) this.playerPvText.setText(`PV: ${player.pv}`);
  // Destruction de la balle
  if (bullet.active) bullet.destroy();
  // Si PV à 0 on peut gérer la mort (ici on switch vers la sélection)
  if (player.pv <= 0) {
    console.log('Joueur mort - retour au menu de sélection');
    this.scene.switch('selection');
  }
}


  update() {
    // Mise à jour de la direction du joueur
    if (this.clavier.left.isDown) {
      this.player.direction = 'left';
      this.player.setVelocityX(-90);
      this.player.anims.play("anim_tourne_gauche", true);
    } else if (this.clavier.right.isDown) {
      this.player.direction = 'right';
      this.player.setVelocityX(90);
      this.player.anims.play("anim_tourne_droite", true);
    } else {
      this.player.setVelocityX(0);
    }
    if (this.clavier.up.isDown) {
      this.player.direction = 'up';
      this.player.setVelocityY(-90);
      this.player.anims.play("anim_face");
    } else if (this.clavier.down.isDown) {
      this.player.direction = 'down';
      this.player.setVelocityY(90);
      this.player.anims.play("anim_face");
    } else {
      this.player.setVelocityY(0);
      if (!this.clavier.left.isDown && !this.clavier.right.isDown) {
        this.player.anims.play("anim_face");
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.clavier.M) == true) {
      if (this.physics.overlap(this.player, this.porte_retour)) {
        console.log("niveau 3 : retour vers selection");
        this.scene.switch("selection");
      }
    }
  }
}
