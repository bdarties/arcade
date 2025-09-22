// ===================== CONFIG =====================
var config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: { preload: preload, create: create, update: update }
};

var game = new Phaser.Game(config);

// ===================== VARIABLES =====================
var player1, player2;
var platforms;
var cursors;
var keysPlayer2;
var boutonFeu1, boutonFeu2;
var bullets1, bullets2;
var lastFired1 = 0;
var lastFired2 = 0;

// vies
var lifeBar1, lifeBar2;
var maxLife = 15;

// manches
var rounds1 = 0;
var rounds2 = 0;
var roundSquares1 = [];
var roundSquares2 = [];
var maxRounds = 3;      // 3 manches possibles (affichage)
var winCondition = 2;   // 2 victoires suffisent pour gagner


// timer
var timerText;
var initialTime = 5 * 60; // 5 minutes en secondes
var currentTime = initialTime;

// ===================== PRELOAD =====================
function preload() {
  this.load.image("sky", "src/assets/sky.png");
  this.load.image("ground", "src/assets/platform.png");
  this.load.image("bullet", "src/assets/balle.png");
  this.load.spritesheet("dude", "src/assets/dude.png", {
    frameWidth: 32,
    frameHeight: 48
  });
}

// ===================== CREATE =====================
function create() {
  // fond adapté à 1280x720
  this.add.image(640, 360, "sky").setDisplaySize(1280, 720);

  // plateformes adaptées
  platforms = this.physics.add.staticGroup();
  platforms.create(640, 700, "ground").setScale(4).refreshBody(); // sol
  platforms.create(1000, 500, "ground");
  platforms.create(250, 400, "ground");
  platforms.create(1100, 300, "ground");
  platforms.create(300, 250, "ground");

  // joueur 1
  player1 = this.physics.add.sprite(150, 600, "dude");
  player1.setBounce(0.3);
  player1.setCollideWorldBounds(true);
  player1.direction = "right";
  player1.hp = maxLife;
  this.physics.add.collider(player1, platforms);

  // joueur 2
  player2 = this.physics.add.sprite(1130, 600, "dude");
  player2.setBounce(0.3);
  player2.setCollideWorldBounds(true);
  player2.direction = "left";
  player2.hp = maxLife;
  this.physics.add.collider(player2, platforms);

  // animations
  this.anims.create({
    key: "left",
    frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key: "turn",
    frames: [{ key: "dude", frame: 4 }],
    frameRate: 20
  });
  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
  });

  // clavier joueur 1 (flèches)
  cursors = this.input.keyboard.createCursorKeys();
  boutonFeu1 = this.input.keyboard.addKey("P");

  // clavier joueur 2 (ZQSD)
  keysPlayer2 = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.Z,
    left: Phaser.Input.Keyboard.KeyCodes.Q,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    fire: Phaser.Input.Keyboard.KeyCodes.Y
  });

  // groupes de balles
  bullets1 = this.physics.add.group();
  bullets2 = this.physics.add.group();

  this.physics.world.on("worldbounds", function (body) {
    var objet = body.gameObject;
    if (bullets1.contains(objet) || bullets2.contains(objet)) {
      objet.destroy();
    }
  });

  // collision balles ↔ joueurs
  this.physics.add.overlap(bullets1, player2, hitPlayer, null, this);
  this.physics.add.overlap(bullets2, player1, hitPlayer, null, this);

  // barres de vie
  lifeBar1 = this.add.graphics();
  lifeBar2 = this.add.graphics();
  drawLifeBars();

// cases de manches joueur 1 (3 carrés sous la barre de vie gauche)
for (let i = 0; i < maxRounds; i++) {
  let square = this.add.rectangle(40 + i * 30, 60, 20, 20, 0x808080);
  roundSquares1.push(square);
}

// cases de manches joueur 2 (3 carrés sous la barre de vie droite)
for (let i = 0; i < maxRounds; i++) {
  let square = this.add.rectangle(940 + i * 30, 60, 20, 20, 0x808080);
  roundSquares2.push(square);
}
  // timer centré
  timerText = this.add.text(640, 30, "05:00", {
    fontSize: "32px",
    fill: "#ffffff"
  }).setOrigin(0.5, 0.5);

  this.time.addEvent({
    delay: 1000,
    callback: updateTimer,
    callbackScope: this,
    loop: true
  });
}

// ===================== UPDATE =====================
function update(time) {
  // --- joueur 1 ---
  if (cursors.left.isDown) {
    player1.setVelocityX(-160);
    player1.anims.play("left", true);
    player1.direction = "left";
  } else if (cursors.right.isDown) {
    player1.setVelocityX(160);
    player1.anims.play("right", true);
    player1.direction = "right";
  } else {
    player1.setVelocityX(0);
    player1.anims.play("turn");
  }
  if (cursors.up.isDown && player1.body.touching.down) {
    player1.setVelocityY(-330);
  }
  if (Phaser.Input.Keyboard.JustDown(boutonFeu1) && time > lastFired1) {
    tirer(player1, bullets1);
    lastFired1 = time + 300;
  }

  // --- joueur 2 ---
  if (keysPlayer2.left.isDown) {
    player2.setVelocityX(-160);
    player2.anims.play("left", true);
    player2.direction = "left";
  } else if (keysPlayer2.right.isDown) {
    player2.setVelocityX(160);
    player2.anims.play("right", true);
    player2.direction = "right";
  } else {
    player2.setVelocityX(0);
    player2.anims.play("turn");
  }
  if (keysPlayer2.up.isDown && player2.body.touching.down) {
    player2.setVelocityY(-330);
  }
  if (Phaser.Input.Keyboard.JustDown(keysPlayer2.fire) && time > lastFired2) {
    tirer(player2, bullets2);
    lastFired2 = time + 300;
  }

  drawLifeBars();
}

// ===================== TIRER =====================
function tirer(player, bulletsGroup) {
  var coefDir = player.direction === "left" ? -1 : 1;
  var bullet = bulletsGroup.create(
    player.x + 25 * coefDir,
    player.y - 4,
    "bullet"
  );
  bullet.setCollideWorldBounds(true);
  bullet.body.onWorldBounds = true;
  bullet.body.allowGravity = false;
  bullet.setVelocity(600 * coefDir, 0);
}

// ===================== HIT BALLE ↔ JOUEUR =====================
function hitPlayer(player, bullet) {
  bullet.destroy();
  player.hp--;
  if (player.hp <= 0) {
    endRound(player);
  }
}

// ===================== FIN DE MANCHE =====================
function endRound(loser) {
  // désactiver les joueurs
  player1.setVelocity(0, 0);
  player2.setVelocity(0, 0);
  player1.body.enable = false;
  player2.body.enable = false;

  let winner;
  if (loser === player1) {
    rounds2++;
    roundSquares2[rounds2 - 1].setFillStyle(0x00ff00); // vert gagnant
    roundSquares1[rounds1].setFillStyle(0xff0000);     // rouge perdant
    winner = "Joueur 2";
  } else {
    rounds1++;
    roundSquares1[rounds1 - 1].setFillStyle(0x00ff00);
    roundSquares2[rounds2].setFillStyle(0xff0000);
    winner = "Joueur 1";
  }

  // vérifier si un joueur a gagné 2 manches
  if (rounds1 >= winCondition || rounds2 >= winCondition) {
    timerText.setText(winner + " a gagné !");
    game.scene.scenes[0].scene.pause(); // pause correctement la scène
    return;
  }

  // réinitialiser la manche après 2 secondes
  setTimeout(resetRound, 2000);
}


// ===================== RESET MANCHE =====================
function resetRound() {
  player1.hp = maxLife;
  player2.hp = maxLife;
  player1.clearTint();
  player2.clearTint();
  player1.x = 150;
  player1.y = 600;
  player2.x = 1130;
  player2.y = 600;
  player1.body.enable = true;
  player2.body.enable = true;
  drawLifeBars();
}

// ===================== BARRES DE VIE =====================
function drawLifeBars() {
  lifeBar1.clear();
  lifeBar1.fillStyle(0xff0000);
  lifeBar1.fillRect(40, 20, (player1.hp / maxLife) * 300, 20);
  lifeBar1.lineStyle(2, 0x000000);
  lifeBar1.strokeRect(40, 20, 300, 20);

  lifeBar2.clear();
  lifeBar2.fillStyle(0x00ff00);
  lifeBar2.fillRect(940, 20, (player2.hp / maxLife) * 300, 20);
  lifeBar2.lineStyle(2, 0x000000);
  lifeBar2.strokeRect(940, 20, 300, 20);
}

// ===================== TIMER =====================
function updateTimer() {
  if (currentTime > 0) {
    currentTime--;
    var minutes = Math.floor(currentTime / 60);
    var seconds = currentTime % 60;
    timerText.setText(
      (minutes < 10 ? "0" + minutes : minutes) +
      ":" +
      (seconds < 10 ? "0" + seconds : seconds)
    );
  } else {
    timerText.setText("FIN !");
    this.scene.pause();
  }
}
// ===================== END =====================