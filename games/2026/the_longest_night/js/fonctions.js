function doNothing() {
    // cette fonction ne fait rien.
    // c'est juste un exemple pour voir comment mettre une fonction
    // dans un fichier et l'utiliser dans les autres
}


function doAlsoNothing() {
    // cette fonction ne fait rien non plus.
 }

 /************************************************************************/
/**FONCTIONS DU JEU **/
/************************************************************************/

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
  if (cles_creees < nombre_cles && groupe_cle.countActive(true) < nombre_cles && tableau_spawn.length > 0) { //partie des clés
    const position = Phaser.Utils.Array.RemoveRandomElement(tableau_spawn);
    cle = groupe_cle.create(position.x, position.y, "cle_bronze");
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
  if (groupe_soin.countActive(true) < 1 && tableau_spawn.length > 0) {
    const position = Phaser.Utils.Array.RemoveRandomElement(tableau_spawn);
    const medkit = groupe_soin.create(position.x, position.y, "soin");
    camJ1UI.ignore(medkit);
    camGlobalUI.ignore(medkit);
    if (mode_deux_joueurs) {
      camJ2UI.ignore(medkit);
    }
  }
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
}

function degat_contact_ennemi(player, ennemi) {
  if (player.points_vies <= 0 || this.time.now < player.prochaineDegat) {
    return;
  }
  player.barreVie.setFrame(player.points_vies);
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
      function Elimination_ennemi(bullet, ennemi){ //gère le contact entre ennemi et balle et leur elimination
        const tireur = bullet.tireur;
        bullet.destroy();
        ennemi.points_vie -= 1;
        son_areignne_blesse.play();
        this.time.delayedCall(200), () => {
          ennemi.setColor('0xFF0000')
        }
        if (ennemi.points_vie <= 0){
          ennemi.destroy();
          if (tireur){ //défini simplement qui est le tireur
            tireur.score += ennemi.score;
            const scoreText = tireur === player2 ? score_J2_affiche : score_J1_affiche;
            scoreText.setText('Score: ' + tireur.score);
          }
        }
      };
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
      }
    }
    function soigner(cible, medkit) {
        cible.points_vies = Math.min(cible.points_vies + 1, 5);
      medkit.destroy();
    }; 