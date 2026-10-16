/************************************************************************/
/** HELPERS DU NIVEAU 1 **/
/************************************************************************/

/** Charge un son, avec un retour silencieux et un message explicite s'il manque. */
export function ajouter_son(scene, cle_son) {
  if (scene.cache.audio.exists(cle_son)) {
    return scene.sound.add(cle_son);
  }
  console.error("Son manquant (vérifie le nom du fichier dans assets/musique_et_sons/) : " + cle_son);
  return { play() {}, stop() {}, isPlaying: false };
}

export function gerer_cameras() { //gère l'écart entre les joueurs 1 et 2 et décide quand séparer / fusionner les caméras
  const distance = Phaser.Math.Distance.Between(this.gameState.player.x, this.gameState.player.y, this.gameState.player2.x, this.gameState.player2.y);

  // deux seuils différents pour prévenir le clignotement à la limite
  if (this.gameState.camerasFusionnees && distance > 300) {
    separer_cameras.call(this);
  } else if (!this.gameState.camerasFusionnees && distance < 250) {
    fusionner_cameras.call(this);
  }

  if (this.gameState.camerasFusionnees) {
    this.gameState.cibleCamera.setPosition((this.gameState.player.x + this.gameState.player2.x) / 2, (this.gameState.player.y + this.gameState.player2.y) / 2);
  }
}

export function fusionner_cameras() { //on masque la caméra J2 et on agrandit celle de J1, qui suit le point entre les deux joueurs
  this.gameState.camerasFusionnees = true;
  this.gameState.camJ1.setViewport(0, 0, 1280, 720);
  this.gameState.camJ1.startFollow(this.gameState.cibleCamera, true, 0.1, 0.1);
  this.gameState.camJ2.setVisible(false);
}

export function separer_cameras() { //on réactive la caméra de droite et on remet celle de gauche à sa taille normale
  this.gameState.camerasFusionnees = false;
  this.gameState.camJ1.setViewport(0, 0, 1280 / 2, 720);
  this.gameState.camJ1.startFollow(this.gameState.player, true, 0.1, 0.1);
  this.gameState.camJ2.setVisible(true);
}

export function deplacement_areignee() { //comportement des ennemis (araignée = poursuite, renard = rôdeur)
  const joueurs = this.gameState.mode_deux_joueurs ? [this.gameState.player, this.gameState.player2] : [this.gameState.player];
  this.gameState.groupe_araignee.children.iterate((ennemi) => {
    if (!ennemi || !ennemi.active || !ennemi.body) {
      return;
    }
    if (ennemi.comportement === "rodeur") {
      comportement_rodeur.call(this, ennemi, joueurs);
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

export function apparition_elements() { //fait apparaître clés, soins, recharges et ennemis, chacun sur un point de spawn pris au hasard
  if (this.gameState.cles_creees < this.gameState.nombre_cles && this.gameState.groupe_cle.countActive(true) < this.gameState.nombre_cles && this.gameState.tableau_spawn.length > 0) {
    const typeCle = Phaser.Utils.Array.GetRandom([
      { texture: "cle_bronze", animation: "animation_cle_bronze", score: 500 },
      { texture: "cle_argent", animation: "animation_cle_argent", score: 500 },
      { texture: "cle_or", animation: "animation_cle_or", score: 800 }
    ]);
    const position = Phaser.Utils.Array.RemoveRandomElement(this.gameState.tableau_spawn);
    this.gameState.cle = this.gameState.groupe_cle.create(position.x, position.y, typeCle.texture);
    this.gameState.cle.score = typeCle.score;
    this.gameState.cles_creees += 1;
    this.gameState.cle.anims.play(typeCle.animation, true);
    this.gameState.camJ1UI.ignore(this.gameState.cle);
    this.gameState.camGlobalUI.ignore(this.gameState.cle);
  }
  if (this.gameState.groupe_soin.countActive(true) < this.gameState.nombre_soins_apparaissant && this.gameState.tableau_spawn.length > 0) {
    const position = Phaser.Utils.Array.RemoveRandomElement(this.gameState.tableau_spawn);
    const medkit = this.gameState.groupe_soin.create(position.x, position.y, "soin");
    medkit.anims.play("animation_soin", true);
    this.gameState.camJ1UI.ignore(medkit);
    this.gameState.camGlobalUI.ignore(medkit);
    if (this.gameState.mode_deux_joueurs) {
      this.gameState.camJ2UI.ignore(medkit);
    }
  }
  if (this.gameState.groupe_recharges.countActive(true) < this.gameState.nombre_recharges_apparaissant && this.gameState.tableau_spawn.length > 0) {
    const position = Phaser.Utils.Array.RemoveRandomElement(this.gameState.tableau_spawn);
    const recharge = this.gameState.groupe_recharges.create(position.x, position.y, "recharge");
    recharge.anims.play("recharge", true);
    this.gameState.camJ1UI.ignore(recharge);
    this.gameState.camGlobalUI.ignore(recharge);
    if (this.gameState.mode_deux_joueurs) {
      this.gameState.camJ2UI.ignore(recharge);
    }
  }
  if (this.gameState.groupe_araignee.countActive(true) < this.gameState.nombre_ennemis_apparaissant && this.gameState.tableau_spawn.length > 0) {
    const definition = Phaser.Utils.Array.GetRandom(this.gameState.tableau_ennemis);
    const position = Phaser.Utils.Array.RemoveRandomElement(this.gameState.tableau_spawn);
    const ennemi = this.gameState.groupe_araignee.create(position.x, position.y, definition.texture);
    ennemi.points_vies = definition.points_vies;
    ennemi.degats = definition.degats;
    ennemi.score = definition.score;
    ennemi.comportement = definition.comportement || "poursuite"; //"poursuite" (araignée) ou "rodeur" (renard)
    ennemi.degats_au_contact = definition.degats_au_contact !== false; //false : ne blesse que par son attaque
    ennemi.animation_marche = definition.animation;
    ennemi.animation_attaque = definition.animation_attaque;
    ennemi.rayon = definition.rayon_detection;
    ennemi.vitesse = definition.vitesse || 45;
    ennemi.delai_impact = definition.delai_impact || 500;
    ennemi.duree_attaque = definition.duree_attaque || 900;
    ennemi.texture_marche = definition.texture;
    ennemi.etat = "balade";
    ennemi.prochaine_attaque = 0;
    ennemi.prochain_changement = 0;
    ennemi.anims.play(definition.animation, true);
    this.gameState.camJ1UI.ignore(ennemi);
    this.gameState.camGlobalUI.ignore(ennemi);
    if (this.gameState.mode_deux_joueurs) {
      this.gameState.camJ2UI.ignore(ennemi);
    }
  }
}

export function degat_contact_ennemi(player, ennemi, attaque = false) {
  if (ennemi.degats_au_contact === false && !attaque) { //le renard ne blesse pas en simple contact, seulement avec son attaque
    return;
  }
  if (player.points_vies <= 0 || this.time.now < player.prochaineDegat) {
    return;
  }
  player.points_vies = Math.max(0, player.points_vies - ennemi.degats);
  this.gameState.son_joueur_blesse.play();
  if (player.points_vies <= 0) { //plus de vie : le joueur meurt (en compétitif cela termine le match)
    tuer_joueur.call(this, player);
    return;
  }
  player.prochaineDegat = this.time.now + 1000;
  player.colliderEnnemis.active = false; //on désactive la collision avec l'ennemi pour rendre le joueur invincible un instant
  this.tweens.add({ //fait clignoter le joueur pour indiquer qu'il est invincible
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
      if (this.physics.overlap(player, ennemi)) { //le joueur continue de prendre des dégâts s'il reste sur l'ennemi
        player.prochaineDegat = this.time.now;
        degat_contact_ennemi.call(this, player, ennemi);
      }
    }
  });
}

export function recharger(player, recharge) {
  if (player.enRechargement || player.balle_restante == player.balle_max) {
    return;
  }
  recharge.destroy();
  player.enRechargement = true; //empêche de relancer la fonction pendant qu'elle est déjà en cours
  player.peutTirer = false;
  const texteBalles = player === this.gameState.player2 ? this.gameState.balle_restanteJ2_affiche : this.gameState.balle_restanteJ1_affiche;
  texteBalles.setText('!');
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
    texteBalles.setText(String(player.balle_restante));
  });
}

export function tirer(player) {
  if (player.peutTirer == true && player.balle_restante > 0 && player.points_vies > 0) {
    var coefDir;
    let bullet;
    // CORRECTIF : on utilise les animations du bon joueur (J1 ou J2) et plus toujours celles de J1
    const suffixe = player === this.gameState.player2 ? "J2" : "J1";
    player.tirEnCours = true;
    player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      player.tirEnCours = false;
    });
    if (player.direction == 'left' || player.direction == 'up') {
      coefDir = -1;
    }
    else {
      coefDir = 1;
    }
    if (player.direction == 'left') {
      player.anims.play("anim_attaque_gauche_" + suffixe, true);
      bullet = this.gameState.groupeBullets.create(player.x + (25 * coefDir), player.y, 'animation_balle_gauche');
    }
    else if (player.direction == 'right') {
      player.anims.play("anim_attaque_droite_" + suffixe, true);
      bullet = this.gameState.groupeBullets.create(player.x + (25 * coefDir), player.y, 'animation_balle_droite');
    }
    else if (player.direction == 'up') {
      player.anims.play("anim_attaque_haut_" + suffixe, true);
      bullet = this.gameState.groupeBullets.create(player.x, player.y + (25 * coefDir), 'animation_balle_haut');
    }
    else {
      player.anims.play("anim_attaque_bas_" + suffixe, true);
      bullet = this.gameState.groupeBullets.create(player.x, player.y + (25 * coefDir), 'animation_balle_bas');
    }
    this.physics.add.collider(bullet, this.gameState.calque_mur,detruire,null,this);
    bullet.anims.play(bullet.texture.key);
    bullet.tireur = player;
    this.gameState.camJ1UI.ignore(bullet); //les balles sont créées en cours de jeu : on doit les faire ignorer à ce moment-là
    this.gameState.camGlobalUI.ignore(bullet);
    if (this.gameState.mode_deux_joueurs) {
      this.gameState.camJ2UI.ignore(bullet);
    }
    if (player.direction == 'left' || player.direction == 'right') {
      bullet.setVelocity(500 * coefDir, 0);
    }
    else {
      bullet.setVelocity(0, 500 * coefDir);
    }
    this.gameState.son_feu.play();
    player.balle_restante -= 1;
    const balleRestanteText = player === this.gameState.player2 ? this.gameState.balle_restanteJ2_affiche : this.gameState.balle_restanteJ1_affiche;
    balleRestanteText.setText(String(player.balle_restante));
    player.peutTirer = false;

    this.time.delayedCall(800, () => {
      if (!player.enRechargement) { //ne pas réautoriser le tir pendant un rechargement
        player.peutTirer = true;
      }
    });
    //détruit la balle si elle est encore active après 1 seconde
    this.time.delayedCall(1000, () => {
      if (bullet.active) {
        bullet.destroy();
      }
    });
  }
  else if (player.balle_restante === 0) {
    const balleRestanteText = player === this.gameState.player2 ? this.gameState.balle_restanteJ2_affiche : this.gameState.balle_restanteJ1_affiche;
    balleRestanteText.setColor('rgb(192, 69, 69)');
  }
}

export function Elimination_ennemi(bullet, ennemi) { //contact balle / ennemi
  const tireur = bullet.tireur;
  bullet.destroy();
  ennemi.points_vies -= 1;
  this.gameState.son_areignne_blesse.play();
  ennemi.setTintFill(0xff0000);
  this.time.delayedCall(150, () => {
    if (ennemi.active) {
      ennemi.clearTint();
    }
  });
  if (ennemi.points_vies <= 0) {
    ennemi.destroy();
    if (tireur) {
      tireur.score += ennemi.score;
      const scoreText = tireur === this.gameState.player2 ? this.gameState.score_J2_affiche : this.gameState.score_J1_affiche;
      scoreText.setText(String(tireur.score));
    }
  }
}

export function recuperer_cle(player, cle) { //contact joueur / clé
  player.score += cle.score;
  const scoreText = player === this.gameState.player2 ? this.gameState.score_J2_affiche : this.gameState.score_J1_affiche;
  scoreText.setText(String(player.score));
  this.gameState.son_cle.play();
  cle.destroy();
  if (this.gameState.mode_deux_joueurs) { //compétitif : la clé ne fait que rapporter des points puis réapparaît ailleurs
    this.gameState.cles_creees -= 1; //libère une place pour que apparition_elements() en recrée une
    return;
  }
  this.gameState.cles_restantes -= 1;
  this.gameState.cles_restantes_affiche.setText(String(this.gameState.cles_restantes));
  if (this.gameState.cles_creees >= this.gameState.nombre_cles && this.gameState.groupe_cle.countActive(true) == 0) {
    this.gameState.porte.anims.play("animation_porte_ouverte");
    this.gameState.sortie_ouverte = true;
  }
}

export function soigner(cible, objet) {
  if (cible.points_vies >= 5) {
    return;
  }
  cible.points_vies = Math.min(cible.points_vies + 2, 5);
  this.gameState.son_soin.play();
  objet.destroy();
}

export function aller_niveau_suivant() { //arrête la musique puis lance le niveau suivant en lui transmettant les scores
  this.gameState.musique_niveau1.stop();
  this.scene.start(this.cfg.niveau_suivant, {
    scoreJ1: this.gameState.player.score,
    scoreJ2: this.gameState.mode_deux_joueurs ? this.gameState.player2.score : 0,
    temps_restant: this.gameState.temps_restant,
    mode: this.gameState.mode_deux_joueurs ? 2 : 1
  });
}

export function comportement_rodeur(ennemi, joueurs) { //se balade au hasard ; attaque sur place si un joueur entre dans son rayon
  if (ennemi.etat === "attaque") {
    ennemi.setVelocity(0, 0);
    return;
  }
  const maintenant = this.time.now;
  let cible = null;
  let distance_min = Infinity;
  joueurs.forEach((joueur) => {
    if (!joueur || !joueur.active || joueur.points_vies <= 0) {
      return;
    }
    const distance = Phaser.Math.Distance.Between(ennemi.x, ennemi.y, joueur.x, joueur.y);
    if (distance < distance_min) {
      distance_min = distance;
      cible = joueur;
    }
  });
  if (cible && distance_min <= ennemi.rayon && maintenant >= ennemi.prochaine_attaque) {
    attaque_rodeur.call(this, ennemi, cible, joueurs);
    return;
  }
  //balade : on change de direction toutes les 1,5 à 3,5 s, ou tout de suite si on est bloqué par un mur
  const bloque = !ennemi.body.blocked.none || !ennemi.body.touching.none;
  if (maintenant >= ennemi.prochain_changement || bloque) {
    ennemi.prochain_changement = maintenant + Phaser.Math.Between(1500, 3500);
    if (Phaser.Math.Between(0, 100) < 30) { //une fois sur trois environ, il s'arrête un moment
      ennemi.setVelocity(0, 0);
      ennemi.anims.play(ennemi.animation_marche, true);
    } else {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      ennemi.setVelocity(Math.cos(angle) * ennemi.vitesse, Math.sin(angle) * ennemi.vitesse);
      ennemi.setFlipX(ennemi.body.velocity.x < 0); //suppose que le sprite regarde vers la droite par défaut
      ennemi.anims.play(ennemi.animation_marche, true);
    }
  }
}

export function attaque_rodeur(ennemi, cible, joueurs) {
  ennemi.etat = "attaque";
  ennemi.setVelocity(0, 0);
  ennemi.setFlipX(cible.x < ennemi.x);
  ennemi.anims.play(ennemi.animation_attaque, true);
  if (!this.anims.exists(ennemi.animation_attaque)) {
    console.error("Animation d'attaque introuvable : " + ennemi.animation_attaque);
  }
  this.time.delayedCall(ennemi.duree_attaque, () => { //fin de l'attaque : retour à la balade après un temps de repos
    if (!ennemi.active) {
      return;
    }
    ennemi.etat = "balade";
    ennemi.prochaine_attaque = this.time.now + 1500;
    ennemi.prochain_changement = 0;
  });
  this.time.delayedCall(ennemi.delai_impact, () => { //le coup touche en plein milieu de l'animation
    if (!ennemi.active || ennemi.etat !== "attaque") {
      return;
    }
    joueurs.forEach((joueur) => {
      if (joueur && joueur.active && Phaser.Math.Distance.Between(ennemi.x, ennemi.y, joueur.x, joueur.y) <= ennemi.rayon) {
        degat_contact_ennemi.call(this, joueur, ennemi, true);
      }
    });
  });
}

/************************************************************************/
/** LA FAUCHEUSE                                                       **/
/** Quand le timer arrive à 0 : un message s'affiche, elle apparaît    **/
/** (invisible) près du joueur, puis elle fonce dessus et le tue.      **/
/************************************************************************/

export function joueurs_vivants() { //liste des joueurs encore en vie, utilisé seulement en mode_deux_joueur
  const joueurs = this.gameState.mode_deux_joueurs ? [this.gameState.player, this.gameState.player2] : [this.gameState.player];
  return joueurs.filter((joueur) => joueur.points_vies > 0);
}

// 1) Prépare les images et les animations de la faucheuse (appelée une fois dans create)
export function preparer_faucheuse() {
  const cfg = this.cfg.faucheuse;
  ["marche", "attaque"].forEach((type) => {
    const p = cfg[type];
    const cle = "faucheuse_" + type + "_" + this.scene.key; //ex : "faucheuse_marche_niveau2"
    if (!this.textures.exists(cle)) {
      // on recopie le PNG dans un canvas de la bonne taille puis on déclare chaque case (le PNG de marche du niveau 2 est rogné)
      const image = this.textures.get("img_" + cle).getSourceImage();
      const canvas = document.createElement("canvas");
      canvas.width = p.largeur * p.images;
      canvas.height = p.hauteur;
      canvas.getContext("2d").drawImage(image, 0, 0);
      const texture = this.textures.addCanvas(cle, canvas);
      for (let i = 0; i < p.images; i++) {
        texture.add(i, 0, i * p.largeur, 0, p.largeur, p.hauteur);
      }
    }
    if (!this.anims.exists(cle)) {
      this.anims.create({
        key: cle,
        frames: this.anims.generateFrameNumbers(cle, { start: 0, end: p.images - 1 }),
        frameRate: type === "marche" ? 8 : p.images / (cfg.duree_attaque / 1000), //l'attaque dure exactement duree_attaque
        repeat: type === "marche" ? -1 : 0
      });
    }
  });
}

// cherche un endroit sans mur à une distance comprise entre "min" et "max" du joueur
export function place_libre_autour(joueur, min, max) {
  for (let essai = 0; essai < 50; essai++) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.Between(min, max);
    const x = joueur.x + Math.cos(angle) * distance;
    const y = joueur.y + Math.sin(angle) * distance;
    const tuile = this.gameState.calque_mur.getTileAtWorldXY(x, y);
    if (this.physics.world.bounds.contains(x, y) && !(tuile && tuile.collides)) {
      return { x: x, y: y };
    }
  }
  return { x: joueur.x, y: joueur.y }; //rien trouvé : on la met sur le joueur
}

// 2) Appelée quand le timer arrive à 0 : message + apparition de la faucheuse
export function apparition_faucheuse() {
  const cfg = this.cfg.faucheuse;
  const vivants = joueurs_vivants.call(this);
  if (this.gameState.faucheuse || vivants.length === 0) {
    return;
  }

  // le message, au centre de l'écran (seule camGlobalUI l'affiche, les autres caméras l'ignorent)
  const message = this.add.text(640, 200, "LE TEMPS EST ÉCOULÉ...\nLA FAUCHEUSE ARRIVE !", {
    fontFamily: "Arial, sans-serif",
    fontSize: "40px",
    color: "#ff3b3b",
    align: "center",
    stroke: "#000000",
    strokeThickness: 6
  }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
  this.gameState.camJ1.ignore(message);
  this.gameState.camJ2.ignore(message);
  this.gameState.camJ1UI.ignore(message);
  if (this.gameState.mode_deux_joueurs) {
    this.gameState.camJ2UI.ignore(message);
  }
  this.tweens.add({ targets: message, alpha: 0, delay: cfg.delai_avant_charge, duration: 600, onComplete: () => message.destroy() });
  this.gameState.camJ1.shake(600, 0.01);
  this.gameState.camJ2.shake(600, 0.01);

  // la faucheuse apparaît près du premier joueur vivant, mais invisible : on ne la voit pas arriver
  const position = place_libre_autour.call(this, vivants[0], cfg.distance_min, cfg.distance_max);
  this.gameState.faucheuse = this.physics.add.sprite(position.x, position.y, "faucheuse_marche_" + this.scene.key, 0);
  this.gameState.faucheuse.setDepth(50);
  this.gameState.faucheuse.setAlpha(0);
  this.gameState.faucheuse.body.setSize(cfg.hitbox, cfg.hitbox);
  poser_faucheuse.call(this, "marche", false);
  this.physics.add.collider(this.gameState.faucheuse, this.gameState.calque_mur); //elle ne traverse pas les murs
  this.gameState.faucheuse.etat = "attente"; //"attente" -> "chasse" <-> "attaque"
  this.gameState.faucheuse.prochaine_attaque = 0;
  this.gameState.faucheuse.verif_coincee = 0;
  this.gameState.faucheuse.dernier_x = position.x;
  this.gameState.faucheuse.dernier_y = position.y;
  this.gameState.camJ1UI.ignore(this.gameState.faucheuse);
  this.gameState.camGlobalUI.ignore(this.gameState.faucheuse);
  if (this.gameState.mode_deux_joueurs) {
    this.gameState.camJ2UI.ignore(this.gameState.faucheuse);
  }

  const f = this.gameState.faucheuse;
  this.time.delayedCall(cfg.delai_avant_charge, () => { //la charge commence : elle devient visible et fonce
    if (f.active) {
      f.etat = "chasse";
      this.tweens.add({ targets: f, alpha: 1, duration: 200 });
    }
  });
}

// choisit la feuille (marche ou attaque) et le sens. On place l'origine du sprite sur les pieds de la cape
// et la hitbox dessus, sinon le dessin sauterait à chaque changement d'animation.
export function poser_faucheuse(type, retournee) {
  const p = this.cfg.faucheuse[type];
  const hitbox = this.cfg.faucheuse.hitbox;
  if (this.gameState.faucheuse.pose !== type || this.gameState.faucheuse.flipX !== retournee) {
    this.gameState.faucheuse.pose = type;
    this.gameState.faucheuse.setFlipX(retournee);
    const pieds_x = retournee ? p.largeur - p.pieds.x : p.pieds.x; //une image retournée est inversée dans sa case : les pieds aussi
    this.gameState.faucheuse.setOrigin(pieds_x / p.largeur, p.pieds.y / p.hauteur);
    this.gameState.faucheuse.body.setOffset(pieds_x - hitbox / 2, p.pieds.y - hitbox);
  }
  this.gameState.faucheuse.anims.play("faucheuse_" + type + "_" + this.scene.key, true);
}

// 3) Appelée à chaque image (dans update) : la faucheuse fonce sur le joueur vivant le plus proche
export function deplacement_faucheuse() {
  if (!this.gameState.faucheuse || !this.gameState.faucheuse.active || this.gameState.fin_de_partie) {
    return;
  }
  const cfg = this.cfg.faucheuse;
  const vivants = joueurs_vivants.call(this);
  if (this.gameState.faucheuse.etat !== "chasse" || vivants.length === 0) { //en attente ou en pleine attaque : elle ne bouge pas
    this.gameState.faucheuse.setVelocity(0, 0);
    return;
  }

  // le joueur le plus proche
  const moi = this.gameState.faucheuse.body.center;
  let cible = vivants[0];
  let distance = Infinity;
  vivants.forEach((joueur) => {
    const d = Phaser.Math.Distance.Between(moi.x, moi.y, joueur.body.center.x, joueur.body.center.y);
    if (d < distance) {
      distance = d;
      cible = joueur;
    }
  });
  poser_faucheuse.call(this, "marche", cible.body.center.x < moi.x); //elle regarde vers la droite par défaut : on la retourne si la cible est à gauche

  // assez proche : elle attaque
  if (distance <= cfg.portee_attaque && this.time.now >= this.gameState.faucheuse.prochaine_attaque) {
    attaque_faucheuse.call(this);
    return;
  }

  // elle fonce droit sur le joueur
  const angle = Phaser.Math.Angle.Between(moi.x, moi.y, cible.body.center.x, cible.body.center.y);
  this.gameState.faucheuse.setVelocity(Math.cos(angle) * cfg.vitesse, Math.sin(angle) * cfg.vitesse);
}

// 4) L'attaque : animation, puis le coup tue tout joueur à portée
export function attaque_faucheuse() {
  const cfg = this.cfg.faucheuse;
  const f = this.gameState.faucheuse;
  f.etat = "attaque";
  f.setVelocity(0, 0);
  poser_faucheuse.call(this, "attaque", f.flipX);
  this.time.delayedCall(cfg.delai_impact, () => { //le coup arrive
    if (!f.active) {
      return;
    }
    joueurs_vivants.call(this).forEach((joueur) => {
      if (Phaser.Math.Distance.Between(f.body.center.x, f.body.center.y, joueur.body.center.x, joueur.body.center.y) <= cfg.portee_coup) {
        tuer_joueur.call(this, joueur);
      }
    });
  });
  this.time.delayedCall(cfg.duree_attaque, () => { //fin de l'attaque : elle repart à la chasse
    if (f.active) {
      f.etat = "chasse";
      f.prochaine_attaque = this.time.now + cfg.pause_apres_attaque;
    }
  });
}

export function tuer_joueur(joueur) {
  joueur.points_vies = 0;
  joueur.body.enable = false;
  this.tweens.add({ targets: joueur, alpha: 0, duration: 400, onComplete: () => joueur.setVisible(false) });
  if (this.gameState.mode_deux_joueurs) {
    terminer_match.call(this, joueur === this.gameState.player ? "vie_J1" : "vie_J2");
    return;
  }
    if (joueurs_vivants.call(this).length === 0) {
    this.gameState.fin_de_partie = true;
    this.time.delayedCall(1500, () => {
      texteBalles.setColor("#ffd166");
      this.gameState.musique_niveau1.stop();
      this.scene.start("Game_over", {
        raison: this.gameState.temps_restant <= 0 ? "temps" : "vie_J1", // "temps" si c'est la faucheuse qui l'a eu
        niveau: this.scene.key, // permet de rejouer le bon niveau
        scoreJ1: this.gameState.player.score,
        deux_joueurs: false
      });
    });
  }
}


//* GESTION DU MODE COMPÉTITIF*//
export function terminer_match(raison) { //fin du match 2 joueurs : "temps" (le meilleur score gagne), "vie_J1" ou "vie_J2" (le joueur tombé perd)
  if (this.gameState.fin_de_partie) {
    return;
  }
  this.gameState.fin_de_partie = true;
  this.physics.pause();
  let gagnant; //1 = joueur 1, 2 = joueur 2, 0 = égalité
  if (raison === "vie_J1") {
    gagnant = 2;
  } else if (raison === "vie_J2") {
    gagnant = 1;
  } else {
    gagnant = this.gameState.player.score > this.gameState.player2.score ? 1 : (this.gameState.player2.score > this.gameState.player.score ? 2 : 0);
  }
    this.time.delayedCall(1000, () => {
    this.gameState.musique_niveau1.stop();
    if (raison === "vie_J1" || raison === "vie_J2") { // un joueur est mort : écran de Game Over
      this.scene.start("Game_over", {
        raison,
        niveau: this.scene.key,
        scoreJ1: this.gameState.player.score,
        scoreJ2: this.gameState.player2.score,
        deux_joueurs: true
      });
    } else { // temps écoulé : on garde l'écran qui annonce le vainqueur
      this.scene.start("Ecran_score", {
        mode: 2,
        raison,
        gagnant,
        scoreJ1: this.gameState.player.score,
        scoreJ2: this.gameState.player2.score
      });
    }
  });
}

export function points_spawn_libres() { //renvoie les points de spawn ni occupés par un objet/ennemi, ni trop près d'un joueur
  const occupants = [this.gameState.groupe_cle, this.gameState.groupe_recharges, this.gameState.groupe_soin, this.gameState.groupe_araignee]
    .flatMap((groupe) => groupe.getChildren())
    .filter((objet) => objet.active);
  const joueurs = [this.gameState.player, this.gameState.player2];
  return this.gameState.spawns_complets.filter((point) =>
    occupants.every((o) => Phaser.Math.Distance.Between(o.x, o.y, point.x, point.y) > 24) &&
    joueurs.every((j) => Phaser.Math.Distance.Between(j.x, j.y, point.x, point.y) > 120)
  ).map((p) => ({ x: p.x, y: p.y }));
}

export function detruire(objet,mur) {{
    // Détruit instantanément la bombe et la retire du jeu
    objet.destroy(); 
  }};