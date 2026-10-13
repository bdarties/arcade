const DIRECTIONS_ANIMATIONS = [
  { key: "bas", file: "down" },
  { key: "droite", file: "right" },
  { key: "gauche", file: "left" },
  { key: "haut", file: "up" }
];
const TYPES_ANIMATIONS = [
  { key: "attente", file: "idle", frameCount: 4, frameRate: 5, repeat: -1 },
  { key: "course", file: "run", frameCount: 6, frameRate: 5, repeat: -1 },
  { key: "attaque", file: "attack", frameCount: 7, frameRate: 15, repeat: 0 }
];

let player;
let player2;
let J1Haut, J1Bas, J1Gauche, J1Droite, J1boutonFeu, J1Interaction;
let J2Haut, J2Bas, J2Gauche, J2Droite, J2boutonFeu, J2Interaction;
let tableau_spawn;
let nombre_cles = 1;
let cles_creees = 0;
let cles_restantes;
let mode_deux_joueurs = false;
let groupe_cle;
let groupeBullets;
let groupe_araignee;
let tableau_ennemis;
let groupe_recharges;
let son_feu;
let son_areignne_blesse;
let son_cle;
let nombre_ennemis_apparissant;
let camJ1;
let camJ1UI;
let camJ2;
let camJ2UI;
let camGlobalUI;
let score_J1_affiche;
let score_J2_affiche;
let balle_restanteJ1_affiche;
let balle_restanteJ2_affiche;
let points_viesJ1_affiche;
let points_viesJ2_affiche;
let cles_restantes_affiche;
let temps_restant_affiche;
let temps_restant;
let camerasFusionnees = true;
let cibleCamera;
let sortie_ouverte = false;
export default class Niveau_demo extends Phaser.Scene {
  constructor() {
    super({ key: "Niveau_demo" }); // mettre le meme nom que le nom de la classe
  }


  preload() {
    this.load.setBaseURL(this.sys.game.config.baseURL);
    this.load.image("Phaser_tuileGood", "./assets/map/tileset_good.png");
    this.load.tilemapTiledJSON("carte1", "./assets/map/niveau_1.json");
    this.load.image("player1", "./assets/player_1/joueur1_image.png");
    this.load.image("player2", "./assets/player_2/joueur2_image.png");

    const joueurs = [
      { dossier: "player_1", id: "J1", suffixe: "" },
      { dossier: "player_2", id: "J2", suffixe: "_2" }
    ];
    joueurs.forEach(({ dossier, id, suffixe }) => {
      TYPES_ANIMATIONS.forEach(({ key, file }) => {
        DIRECTIONS_ANIMATIONS.forEach(({ key: direction, file: directionFichier }) => {
          this.load.spritesheet(
            `anim_${key}_${direction}_${id}`,
            `./assets/${dossier}/${file}_${directionFichier}${suffixe}.png`,
            { frameWidth: 32, frameHeight: 32 }
          );
        });
      });
    });

    this.load.spritesheet("cle_bronze", "./assets/keys/Key_bronze.png", {
      frameWidth: 32,
      frameHeight: 64
    });
    this.load.spritesheet("areignee_ennemie", "./assets/enemies/araignee.png", {
      frameWidth: 48,
      frameHeight:48
    });
    this.load.image("bullet", "./assets/star.png");
    this.load.image("recharge", "./assets/star_of_dawn.png");
    this.load.image("sortie1_fermee", "./assets/door.png");
    this.load.image("sortie1_ouverte", "./assets/door1_ouverte.png");
    this.load.audio("coupDeFeu", "./assets/musique_et_sons/shoot.mp3");
    this.load.audio("MusiqueNiveau1", "./assets/musique_et_sons/musique_niveau1.mp3");
    this.load.audio("areignee_blesse", "./assets/musique_et_sons/areigne_blesse.mp3");
    this.load.audio("cle_collecte", "./assets/musique_et_sons/cle_collecte.mp3");
  }

  /***********************************************************************/
  /** FONCTION CREATE 
/***********************************************************************/

  /* La fonction create est appelée lors du lancement de la scene
   * si on relance la scene, elle sera appelée a nouveau
   * on y trouve toutes les instructions permettant de créer la scene
   * placement des peronnages, des sprites, des platesformes, création des animations
   * ainsi que toutes les instructions permettant de planifier des evenements
   */
  create() {
    temps_restant = 80;
    cles_creees = 0;
    nombre_ennemis_apparissant = 4;
    sortie_ouverte = false;

    const carteDuNiveau = this.make.tilemap({ key: "carte1" });
    const tileset = carteDuNiveau.addTilesetImage(
      "tileset_good",
      "Phaser_tuileGood"
    );
    carteDuNiveau.createLayer("calque_sol", tileset);
    carteDuNiveau.createLayer("calque_details", tileset);
    const calque_mur = carteDuNiveau.createLayer("calque_mur", tileset);
    const player_spawn = { x: 93.3333, y: 672.0 };
    const player2_spawn = { x: 243.333, y: 673.333 };
    tableau_spawn = [
      { x: 72.0, y: 1008.0 },
      { x: 272.0, y: 1196.0 },
      { x: 548.0, y: 304.0 },
      { x: 1512.0, y: 40.0 },
      { x: 1688.0, y: 1140.0 },
      { x: 1900.0, y: 192.0 },
      { x: 2604.0, y: 700.0 }
    ];

    groupeBullets = this.physics.add.group();
    this.porte1 = this.physics.add.staticSprite(600, 414, "sortie1_fermee");
    groupe_cle = this.physics.add.group();
    groupe_araignee = this.physics.add.group();
    groupe_recharges = this.physics.add.group();
    this.time.addEvent({
      delay: 1000,
      repeat: temps_restant - 1,
      callback: () => {
        temps_restant -= 1;
        temps_restant_affiche.setText('Temps : ' + temps_restant);
      }
    });

    player = this.physics.add.sprite(player_spawn.x, player_spawn.y, "player1");
    player.peutTirer = true;
    player.balle_max = 10;
    player.balle_restante = player.balle_max;
    player.score = 0;
    player.points_vies = 5;
    player.prochaineDegat = 0;
    player.direction = "down";
    calque_mur.setCollisionByProperty({ estSolide: true });
    this.physics.add.collider(player, calque_mur);
    this.physics.add.collider(groupe_araignee, calque_mur);
    this.physics.add.collider(groupeBullets, calque_mur, bullet => bullet.destroy());

    if (mode_deux_joueurs) {
      player2 = this.physics.add.sprite(player2_spawn.x, player2_spawn.y, "player2");
      player2.peutTirer = true;
      player2.balle_max = 10;
      player2.balle_restante = player2.balle_max;
      player2.score = 0;
      player2.points_vies = 5;
      player2.prochaineDegat = 0;
      player2.direction = "down";
      player2.setCollideWorldBounds(true);
      this.physics.add.overlap(player2, calque_mur);
      this.physics.add.overlap(player2, groupe_cle, recuperer_cle, null, this);
    }
    ["J1", "J2"].forEach(joueur => {
      TYPES_ANIMATIONS.forEach(({ key, frameCount, frameRate, repeat }) => {
        DIRECTIONS_ANIMATIONS.forEach(({ key: direction }) => {
          const animationKey = `anim_${key}_${direction}_${joueur}`;
          this.anims.create({
            key: animationKey,
            frames: this.anims.generateFrameNumbers(animationKey, {
              start: 0,
              end: frameCount - 1
            }),
            frameRate,
            repeat
          });
        });
      });
    });

    this.anims.create({
      key: "animation_cle_bronze",
      frames: this.anims.generateFrameNumbers("cle_bronze", {
        start: 0,
        end: 10
      }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: "animation_areignee",
      frames: this.anims.generateFrameNumbers("areignee_ennemie", {
        start: 0,
        end: 7
      }),
      frameRate: 3,
      repeat: -1
    });

    /*****************************************************
     *  GESTION DE LA CAMERA *
     ******************************************************/
    //camera 1 
    camJ1 = this.cameras.main; //on initisalise les caméras maintenant pour qu'elle puissent ignorer les éléménts d'UI des deux joueurs plus tard.
    camJ1.setViewport(0, 0, 1280/2, 720);
    camJ1.startFollow(player, true, 0.1, 0.1);
    camJ1.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.widthInPixels);
    camJ1.setZoom(2);
    //Les caméras UI ont comme objectif de n'afficher que les UI des deux joueurs afin qu'ils ne soient pas afféctés par le zoom des caméras normales.
    camJ1UI = this.cameras.add(0, 0, 1280 / 2, 720);
    camJ1UI.setScroll(0, 0);
    camJ1UI.ignore(this.children.list);
    //cameraJoueur2
    //note : la camera J2 aparait quand même même lorsque les
    camJ2 = this.cameras.add(1280/2, 0, 1280/2, 720);
    if (mode_deux_joueurs){
      camJ2.startFollow(player2, true, 0.1, 0.1);
    }
    camJ2.setBounds(0, 0, carteDuNiveau.widthInPixels, carteDuNiveau.widthInPixels);
    camJ2.setZoom(2);
     if (mode_deux_joueurs){
    camJ2UI = this.cameras.add(1280 / 2, 0, 1280 / 2, 720);
    camJ2UI.setScroll(0, 0);
    camJ2UI.ignore(this.children.list);
    }
    camGlobalUI = this.cameras.add(0, 0, 1280, 720);
    camGlobalUI.setScroll(0, 0);
    camGlobalUI.ignore(this.children.list);
    cibleCamera = this.add.zone(player.x, player.y, 1, 1);
    if (mode_deux_joueurs) {
      fusionner_cameras();
    } else {
      camJ1.setViewport(0, 0, 1280, 720); // plein écran, suit uniquement player
      camJ2.setVisible(false);
    }
    /************************************ 
     * ELEMENTS DE L'UI
    ************************************/
    //élements de l'UI du joueur 1
    score_J1_affiche = this.add.text(100, 16, 'Score : ' + player.score, { fontSize: '32px', fill: '#3bd5f0'});
    score_J1_affiche.setOrigin(0.5, 0);
    score_J1_affiche.setScrollFactor(0); //permet de faire en sorte que le texte (ou autre élément chosi) reste fixe sur l'écran.
    balle_restanteJ1_affiche = this.add.text(180,64,'Balle restante : ' + player.balle_restante,{ fontSize: '32px', fill: '#c9a326'})
    balle_restanteJ1_affiche.setOrigin(0.5, 0);
    balle_restanteJ1_affiche.setScrollFactor(0); //permet de faire en sorte que le texte (ou autre élément chosi) reste fixe sur l'écran.
    points_viesJ1_affiche = this.add.text(160, 144, 'Points de vie : ' + player.points_vies, { fontSize: '32px', fill: '#e75550' });
    points_viesJ1_affiche.setOrigin(0.5, 0);
    points_viesJ1_affiche.setScrollFactor(0);;
    temps_restant_affiche = this.add.text(100, 100, 'Temps : ' + temps_restant, {fontSize: '32px', fill: '#000000'});
    temps_restant_affiche.setScrollFactor(0);
    temps_restant_affiche.setOrigin(0.5, 0);

    //élements de l'UI du joueur 2
    if (mode_deux_joueurs){
      score_J2_affiche = this.add.text(100, 16, 'Score : ' + player2.score, { fontSize: '32px', fill: '#f03b3b' });
      score_J2_affiche.setOrigin(0.5, 0);
      score_J2_affiche.setScrollFactor(0)
      balle_restanteJ2_affiche = this.add.text(180,64,'Balles restante : ' + player2.balle_restante,{ fontSize: '32px', fill: '#571881'})
      balle_restanteJ2_affiche.setOrigin(0.5, 0)
      balle_restanteJ2_affiche.setScrollFactor(0)
      points_viesJ2_affiche = this.add.text(160, 144, 'Points de vie : ' + player2.points_vies, { fontSize: '32px', fill: '#e75550' });
      points_viesJ2_affiche.setScrollFactor(0);
      points_viesJ2_affiche.setOrigin(0.5,0)
    }
    //elements UI global
    cles_restantes_affiche = this.add.text(640, 20, 'Clés à récupérer : ' + nombre_cles, { fontSize: '32px', fill: '#cd50ff' });
    cles_restantes_affiche.setOrigin(0.5, 0);
    cles_restantes_affiche.setScrollFactor(0);


    /*************************************
     *  CREATION DES SONS *
     *************************************/
    son_feu = this.sound.add('coupDeFeu');
    this.sound.add("MusiqueNiveau1").play({ loop: true });
    son_areignne_blesse = this.sound.add('areignee_blesse')
    son_cle = this.sound.add('cle_collecte')

    /***********************
     *  CREATION DU CLAVIER ET TOUCHES *
     ************************/
    //touches Joueur 1
      J1Haut = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP); //Phaser.Input.Keyboard.KeyCodes.[...] représente la touche a associer (en l'occurence l'une des touche directionelle) par ce on ne peut pas associer une touche de direction a une variable comme les autres touches et qu'on doit donc utiliser cette méthode
      J1Bas = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      J1Gauche = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      J1Droite = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
      J1Interaction = this.input.keyboard.addKey('I');
      J1boutonFeu = this.input.keyboard.addKey('O');
    //touches Joueur 2
      J2Haut = this.input.keyboard.addKey('Z');
      J2Bas = this.input.keyboard.addKey('S');
      J2Gauche = this.input.keyboard.addKey('Q');
      J2Droite = this.input.keyboard.addKey('D');
      J2Interaction = this.input.keyboard.addKey('R');
      J2boutonFeu = this.input.keyboard.addKey('T');
    /*************************************************
     * AJOUT DES ENNEMIS ET ELEMENTS DU JEU (sauf la porte)                      *
     ************************************************/
    //on rajoute les ennemis dans ce tableau pour qu'ils soient réorganisés plus tard.
    tableau_ennemis = [{
      nom: "groupe_araignee",
      texture: "areignee_ennemie",
      animation: "animation_areignee",
      points_vie: 3,
      degats: 1,
      score : 100
    }];
    //on appelera ensuite apparition_elements pour
    for (let i = 0; i < nombre_ennemis_apparissant + cles_creees ; i++){
      apparition_elements();
    }
    /*****************************************************
     *  GESTION DES INTERATIONS ENTRE  GROUPES ET ELEMENTS(+ ignorance de la caméra) *
     ******************************************************/
    this.physics.add.collider(player,player2);
    this.physics.add.collider(player, groupe_cle, recuperer_cle, null, this);
    this.physics.add.collider(player,groupe_recharges,recharger,null,this)
    if (mode_deux_joueurs) {
      this.physics.add.collider(player2, groupe_recharges, recharger, null, this);
    }
    player.colliderEnnemis = this.physics.add.collider(player, groupe_araignee, degat_contact_ennemi, null, this);
    if (mode_deux_joueurs) {
      player2.colliderEnnemis = this.physics.add.collider(player2, groupe_araignee, degat_contact_ennemi, null, this);
    }
    this.physics.add.overlap(groupeBullets, groupe_araignee, Elimination_ennemi, null, this);
    //gestion des éléments ignorés par la caméra
    const hudJ1 = [score_J1_affiche, balle_restanteJ1_affiche, points_viesJ1_affiche];
  const hudJ2 = mode_deux_joueurs ? [score_J2_affiche, balle_restanteJ2_affiche, points_viesJ2_affiche] : [];
  const hudCommun = [temps_restant_affiche, cles_restantes_affiche];
  camJ1.ignore([...hudJ1, ...hudJ2, ...hudCommun]);
  camJ1UI.ignore(hudJ2);
  if (mode_deux_joueurs) {
    camJ2.ignore([...hudJ1, ...hudJ2, ...hudCommun]);
    camJ2UI.ignore([...hudJ1, temps_restant_affiche]);
  }
    camGlobalUI.ignore([...hudJ1, ...hudJ2]);
  }
  

  update() {
    if (mode_deux_joueurs) {
      gerer_cameras();
    }
    deplacement_areignee.call(this);
    deplacerJoueur(player, {
      gauche: J1Gauche,
      droite: J1Droite,
      haut: J1Haut,
      bas: J1Bas
    }, "J1", true, player);
    if (Phaser.Input.Keyboard.JustDown(J1boutonFeu)) {
      tirer.call(this, player);
    }
    if (Phaser.Input.Keyboard.JustDown(J1Interaction) &&
        sortie_ouverte && this.physics.overlap(player, this.porte1)) {
      this.scene.start("Ecran_score", {
        scoreJ1: player.score,
        temps_restant
      });
    }

    if (!mode_deux_joueurs) {
      return;
    }
    deplacerJoueur(player2, {
      gauche: J2Gauche,
      droite: J2Droite,
      haut: J2Haut,
      bas: J2Bas
    }, "J2", false, player);
    if (Phaser.Input.Keyboard.JustDown(J2boutonFeu)) {
      tirer.call(this, player2);
    }
    if (Phaser.Input.Keyboard.JustDown(J2Interaction) &&
        sortie_ouverte && this.physics.overlap(player2, this.porte1)) {
      this.scene.start("Ecran_score", {
        scoreJ1: player2.score,
        temps_restant
      });
    }
  }
}

function deplacerJoueur(joueur, touches, suffixe, reinitialiserVitesse, joueurAction) {
  if (reinitialiserVitesse) {
    joueur.setVelocity(0);
  }

  let direction;
  let animationDirection;
  let animationInverse = false;
  if (touches.gauche.isDown) {
    direction = "left";
    animationDirection = "gauche";
    animationInverse = true;
    joueur.setVelocityX(-160);
  } else if (touches.droite.isDown) {
    direction = "right";
    animationDirection = "droite";
    joueur.setVelocityX(160);
  } else if (touches.haut.isDown) {
    direction = "up";
    animationDirection = "haut";
    joueur.setVelocityY(-160);
  } else if (touches.bas.isDown) {
    direction = "down";
    animationDirection = "bas";
    joueur.setVelocityY(160);
  }

  if (direction) {
    joueur.direction = direction;
  } else {
    joueur.setVelocity(0);
    animationDirection = {
      down: "bas",
      up: "haut",
      left: "gauche",
      right: "droite"
    }[joueur.direction];
  }

  if (!joueurAction.tirEnCours) {
    const animation = `anim_${direction ? "course" : "attente"}_${animationDirection}_${suffixe}`;
    if (animationInverse) {
      joueur.anims.playReverse(animation, true);
    } else {
      joueur.anims.play(animation, true);
    }
  }
}

function gerer_cameras() {
  const distance = Phaser.Math.Distance.Between(player.x, player.y, player2.x, player2.y);

  // deux seuils différents pour prévenir le clignotement a la limite
  if (camerasFusionnees && distance > 300) {
    separer_cameras();
  } else if (!camerasFusionnees && distance < 250) {
    fusionner_cameras();
  }

  if (camerasFusionnees) {
    cibleCamera.setPosition((player.x + player2.x) / 2, (player.y + player2.y) / 2);
  }
}

function fusionner_cameras() {
  camerasFusionnees = true;
  camJ1.setViewport(0, 0, 1280, 720);
  camJ1.startFollow(cibleCamera, true, 0.1, 0.1);
  camJ2.setVisible(false);
}

function separer_cameras() {
  camerasFusionnees = false;
  camJ1.setViewport(0, 0, 1280 / 2, 720);
  camJ1.startFollow(player, true, 0.1, 0.1);
  camJ2.setVisible(true);
}

function deplacement_areignee() {
  const joueurs = mode_deux_joueurs ? [player, player2] : [player];
  groupe_araignee.children.iterate((ennemi) => {
    if (!ennemi || !ennemi.active || !ennemi.body) {
      return;
    }
    let joueur_cible = null;
    let distance_min_areignee = Infinity;
    joueurs.forEach((joueur) => {
      if (!joueur || !joueur.active) {
        return;
      }
      const distance_areignee = Phaser.Math.Distance.Between(ennemi.x, ennemi.y, joueur.x, joueur.y);
      if (distance_areignee < distance_min_areignee) {
        distance_min_areignee = distance_areignee;
        joueur_cible = joueur;
      }
    });

    if (joueur_cible && distance_min_areignee <= 250) {
      this.physics.moveToObject(ennemi, joueur_cible, 70);
    } else {
      ennemi.setVelocity(0, 0);
    }
  });
}



function apparition_elements() {
  if (groupe_araignee.countActive(true) < nombre_ennemis_apparissant && tableau_spawn.length > 0) { //partie des ennemis
    const definition = Phaser.Utils.Array.GetRandom(tableau_ennemis);
    const position = Phaser.Utils.Array.RemoveRandomElement(tableau_spawn);
    const ennemi = groupe_araignee.create(position.x, position.y, definition.texture);
    ennemi.points_vie = definition.points_vie;
    ennemi.degats = definition.degats;
    ennemi.score = definition.score;
    ennemi.anims.play(definition.animation, true);
    camJ1UI.ignore(ennemi);
    camGlobalUI.ignore(ennemi);
    if (mode_deux_joueurs) {
      camJ2UI.ignore(ennemi);
    }
  }
  if (cles_creees < nombre_cles && groupe_cle.countActive(true) < nombre_cles && tableau_spawn.length > 0) { //partie des clés
    const position = Phaser.Utils.Array.RemoveRandomElement(tableau_spawn);
    const cle = groupe_cle.create(position.x, position.y, "cle_bronze");
    cles_creees += 1;
    cle.anims.play("animation_cle_bronze", true);
    camJ1UI.ignore(cle);
    camGlobalUI.ignore(cle);
    if (mode_deux_joueurs) {
      camJ2.ignore(cle);
      camJ2UI.ignore(cle);
    }
  }
  if (groupe_recharges.countActive(true) < 1 && tableau_spawn.length > 0) { //partie des recharges
    const position = Phaser.Utils.Array.RemoveRandomElement(tableau_spawn);
    const recharge = groupe_recharges.create(position.x, position.y, "recharge");
    camJ1UI.ignore(recharge);
    camGlobalUI.ignore(recharge);
    if (mode_deux_joueurs) {
      camJ2UI.ignore(recharge);
    }
  }
}

function degat_contact_ennemi(player, ennemi) {
  if (player.points_vies <= 0 || this.time.now < player.prochaineDegat) {
    return;
  }
  player.points_vies = Math.max(0, player.points_vies - ennemi.degats);
  player.prochaineDegat = this.time.now + 1000;
  player.colliderEnnemis.active = false;
  this.tweens.add({ //fait clignoter le joueur
    targets: player,
    alpha: 0.2,
    duration: 100,
    yoyo: true,
    repeat: 4,
    onComplete: () => {
      player.setAlpha(1);
      if (!player.active) { 
        return;
      }
      player.colliderEnnemis.active = true;
      if (this.physics.overlap(player, ennemi)) { //permet de faire en sorte que le joueur continue de prendre des dégats même si il est sur l'ennemi et pas en contact.
        player.prochaineDegat = this.time.now;
        degat_contact_ennemi.call(this, player, ennemi);
      }
    }
  });
  const texteVies = player === player2 ? points_viesJ2_affiche : points_viesJ1_affiche;
  texteVies.setText('Points de vie : ' + player.points_vies);
}
      function recharger(player,recharge) {
        if (player.enRechargement || player.balle_restante == player.balle_max) {
          return;
        }
        recharge.destroy();
        player.enRechargement = true;
        player.peutTirer = false;
        const texteBalles = player === player2 ? balle_restanteJ2_affiche : balle_restanteJ1_affiche;
        texteBalles.setText('Rechargement...');
        texteBalles.setColor('#f1c489');
        this.tweens.add({
          targets: texteBalles,
          alpha: 0.2,
          duration: 150,
          yoyo: true,
          repeat: 4
        });
        this.time.delayedCall(1500, () => {
          player.balle_restante = player.balle_max;
          player.enRechargement = false;
          player.peutTirer = true;
          texteBalles.setAlpha(1);
          texteBalles.setText('Balle restante : ' + player.balle_restante);
        });
      }

      function tirer(player){
        if (player.peutTirer == true && player.balle_restante >0 ) {
        var coefDir; 
        let bullet;
        player.tirEnCours = true;
              player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
              player.tirEnCours = false;
            });
        if (player.direction == 'left' || player.direction == 'up'){
            {coefDir = -1} }
          else{
            {coefDir = 1}
        }
        if (player.direction == 'left' || player.direction == 'right'){
            bullet = groupeBullets.create(player.x + (25 * coefDir), player.y, 'bullet');
            if (player.direction == 'left'){
              player.anims.play("anim_attaque_gauche_J1",true);
            }
            else{
              player.anims.play("anim_attaque_droite_J1",true); 
            }
          }
          if (player.direction == 'up' || player.direction == 'down'){
            bullet = groupeBullets.create(player.x , player.y + (25 * coefDir), 'bullet');  //balle crée dans la direction haut bas donc on inverse les coordonnées x et y.
            if (player.direction == 'up'){
              player.anims.play("anim_attaque_haut_J1",true);
            }
            else{
              player.anims.play("anim_attaque_bas_J1",true); 
            }
          }
          bullet.tireur = player;
          camJ1UI.ignore(bullet); //on est obligé d'ignorer les balles a ce moment la car elle sont crées qu'a ce moment la.
          camGlobalUI.ignore(bullet);
          if (mode_deux_joueurs) {
            camJ2UI.ignore(bullet);
          }
          if (player.direction == 'left' || player.direction == 'right'){
          bullet.setVelocity(500 * coefDir, 0);
        }
        if (player.direction == 'up' || player.direction == 'down'){
          bullet.setVelocity(0, 500 * coefDir); //on met les coordonées inverse pour que la balle aille en haut ou en bas au lieu de la gauche ou la droite
        }
          bullet.setAngularVelocity(180); //permet de faire en sorte que l'objet tournee en continue
          son_feu.play();
          player.balle_restante -= 1;
          const balleRestanteText = player === player2 ? balle_restanteJ2_affiche : balle_restanteJ1_affiche;
          balleRestanteText.setText('Balle restante: ' + player.balle_restante);
          player.peutTirer = false;

       var timerTirOk = this.time.delayedCall(800,
           function () {
            player.peutTirer = true;
           },
           null,this);
           //partie reservée a détruire le bullet si il est actif plus de 3 secondes.
      this.time.delayedCall((3000), () => { 
          if (bullet.active) { 
            bullet.destroy();
          }
          
        })
      }
      else if (player.balle_restante === 0) {
        const balleRestanteText = player === player2 ? balle_restanteJ2_affiche : balle_restanteJ1_affiche;
        balleRestanteText.setColor('rgb(192, 69, 69)');
      }
          
      }
      function Elimination_ennemi(bullet, ennemi){
        const tireur = bullet.tireur;
        bullet.destroy();
        ennemi.points_vie -= 1;
        ennemi.setTint(0xff0000);
        this.time.delayedCall(200, () => {
          if (ennemi.active) {
            ennemi.clearTint();
          }
        });
        if (ennemi.points_vie <= 0){
          ennemi.destroy();
          son_areignne_blesse.play();
          if (tireur){ //défini simplement qui est le tireur
            tireur.score += ennemi.score;
            const scoreText = tireur === player2 ? score_J2_affiche : score_J1_affiche;
            scoreText.setText('Score: ' + tireur.score);
          }
        }
      }


    function recuperer_cle(player, cle){
      player.score += 500
      son_cle.play();
      cles_restantes -= 1;
      cle.destroy();
      if (cles_restantes>0){
        cles_restantes_affiche.setText('Clés à récupérer : ' + cles_restantes);
      }
      else{
        cles_restantes_affiche.setText('Dirigez vous vers la sortie !');
      }
      if (cles_creees >= nombre_cles && groupe_cle.countActive(true) === 0){
        this.porte1.setTexture("sortie1_ouverte");
        sortie_ouverte = true;
  } //la suite de cette fonction sera utile pour plus tard pour spawn des ennemis si besoin
}; 