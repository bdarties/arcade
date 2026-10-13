export function doNothing() {
    // cette fonction ne fait rien.
    // c'est juste un exemple pour voir comment mettre une fonction
    // dans un fichier et l'utiliser dans les autres
}


export function doAlsoNothing() {
    // cette fonction ne fait rien non plus.
 }

 /************************************************************************/
/**FONCTIONS DU JEU **/
/************************************************************************/

export function gerer_cameras() {
  const distance = Phaser.Math.Distance.Between(etatNiveau.player.x, etatNiveau.player.y, etatNiveau.player2.x, etatNiveau.player2.y);

  // deux seuils différents pour prévenir le clignotement a la limite
  if (etatNiveau.camerasFusionnees && distance > 300) {
    separer_cameras();
  } else if (!etatNiveau.camerasFusionnees && distance < 250) {
    fusionner_cameras();
  }

  if (etatNiveau.camerasFusionnees) {
    etatNiveau.cibleCamera.setPosition((etatNiveau.player.x + etatNiveau.player2.x) / 2, (etatNiveau.player.y + etatNiveau.player2.y) / 2);
  }
}

export function fusionner_cameras() {
  etatNiveau.camerasFusionnees = true;
  etatNiveau.camJ1.setViewport(0, 0, 1280, 720);
  etatNiveau.camJ1.startFollow(etatNiveau.cibleCamera, true, 0.1, 0.1);
  etatNiveau.camJ2.setVisible(false);
}

export function separer_cameras() {
  etatNiveau.camerasFusionnees = false;
  etatNiveau.camJ1.setViewport(0, 0, 1280 / 2, 720);
  etatNiveau.camJ1.startFollow(etatNiveau.player, true, 0.1, 0.1);
  etatNiveau.camJ2.setVisible(true);
}

export function deplacement_areignee() {
  const joueurs = etatNiveau.mode_deux_joueurs ? [etatNiveau.player, etatNiveau.player2] : [etatNiveau.player];
  etatNiveau.groupe_araignee.children.iterate((ennemi) => {
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



export function apparition_elements() {
  if (etatNiveau.cles_creees < etatNiveau.nombre_cles && etatNiveau.groupe_cle.countActive(true) < etatNiveau.nombre_cles && etatNiveau.tableau_spawn.length > 0) { //partie des clés
    const position = Phaser.Utils.Array.RemoveRandomElement(etatNiveau.tableau_spawn);
    etatNiveau.cle = etatNiveau.groupe_cle.create(position.x, position.y, "cle_bronze");
    etatNiveau.cles_creees += 1;
    etatNiveau.cle.anims.play("animation_cle_bronze", true);
    etatNiveau.camJ1UI.ignore(etatNiveau.cle);
    etatNiveau.camGlobalUI.ignore(etatNiveau.cle);
    if (etatNiveau.mode_deux_joueurs) {
      etatNiveau.camJ2.ignore(etatNiveau.cle);
      etatNiveau.camJ2UI.ignore(etatNiveau.cle);
    }
  }
  if (etatNiveau.groupe_recharges.countActive(true) < 1 && etatNiveau.tableau_spawn.length > 0) { //partie des recharges
    const position = Phaser.Utils.Array.RemoveRandomElement(etatNiveau.tableau_spawn);
    const recharge = etatNiveau.groupe_recharges.create(position.x, position.y, "recharge");
    etatNiveau.camJ1UI.ignore(recharge);
    etatNiveau.camGlobalUI.ignore(recharge);
    if (etatNiveau.mode_deux_joueurs) {
      etatNiveau.camJ2UI.ignore(recharge);
    }
  }
  if (etatNiveau.groupe_soin.countActive(true) < 1 && etatNiveau.tableau_spawn.length > 0) {
    const position = Phaser.Utils.Array.RemoveRandomElement(etatNiveau.tableau_spawn);
    const medkit = etatNiveau.groupe_soin.create(position.x, position.y, "soin");
    etatNiveau.camJ1UI.ignore(medkit);
    etatNiveau.camGlobalUI.ignore(medkit);
    if (etatNiveau.mode_deux_joueurs) {
      etatNiveau.camJ2UI.ignore(medkit);
    }
  }
  if (etatNiveau.groupe_araignee.countActive(true) < etatNiveau.nombre_ennemis_apparissant && etatNiveau.tableau_spawn.length > 0) { //partie des ennemis
    const definition = Phaser.Utils.Array.GetRandom(etatNiveau.tableau_ennemis);
    const position = Phaser.Utils.Array.RemoveRandomElement(etatNiveau.tableau_spawn);
    const ennemi = etatNiveau.groupe_araignee.create(position.x, position.y, definition.texture);
    ennemi.points_vie = definition.points_vie;
    ennemi.degats = definition.degats;
    ennemi.score = definition.score;
    ennemi.anims.play(definition.animation, true);
    etatNiveau.camJ1UI.ignore(ennemi);
    etatNiveau.camGlobalUI.ignore(ennemi);
    if (etatNiveau.mode_deux_joueurs) {
      etatNiveau.camJ2UI.ignore(ennemi);
    }
  }
}

export function degat_contact_ennemi(player, ennemi) {
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
      export function recharger(player,recharge) {
        if (player.enRechargement || player.balle_restante == player.balle_max) {
          return;
        }
        recharge.destroy();
        player.enRechargement = true;
        player.peutTirer = false;
        const texteBalles = player === etatNiveau.player2 ? etatNiveau.balle_restanteJ2_affiche : etatNiveau.balle_restanteJ1_affiche;
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

      export function tirer(player){
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
            bullet = etatNiveau.groupeBullets.create(player.x + (25 * coefDir), player.y, 'bullet');
            if (player.direction == 'left'){
              player.anims.play("anim_attaque_gauche_J1",true);
            }
            else{
              player.anims.play("anim_attaque_droite_J1",true); 
            }
          }
          if (player.direction == 'up' || player.direction == 'down'){
            bullet = etatNiveau.groupeBullets.create(player.x , player.y + (25 * coefDir), 'bullet');  //balle crée dans la direction haut bas donc on inverse les coordonnées x et y.
            if (player.direction == 'up'){
              player.anims.play("anim_attaque_haut_J1",true);
            }
            else{
              player.anims.play("anim_attaque_bas_J1",true); 
            }
          }
          bullet.tireur = player;
          etatNiveau.camJ1UI.ignore(bullet); //on est obligé d'ignorer les balles a ce moment la car elle sont crées qu'a ce moment la.
          etatNiveau.camGlobalUI.ignore(bullet);
          if (etatNiveau.mode_deux_joueurs) {
            etatNiveau.camJ2UI.ignore(bullet);
          }
          if (player.direction == 'left' || player.direction == 'right'){
          bullet.setVelocity(500 * coefDir, 0);
        }
        if (player.direction == 'up' || player.direction == 'down'){
          bullet.setVelocity(0, 500 * coefDir); //on met les coordonées inverse pour que la balle aille en haut ou en bas au lieu de la gauche ou la droite
        }
          bullet.setAngularVelocity(180); //permet de faire en sorte que l'objet tournee en continue
          etatNiveau.son_feu.play();
          player.balle_restante -= 1;
          const balleRestanteText = player === etatNiveau.player2 ? etatNiveau.balle_restanteJ2_affiche : etatNiveau.balle_restanteJ1_affiche;
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
        const balleRestanteText = player === etatNiveau.player2 ? etatNiveau.balle_restanteJ2_affiche : etatNiveau.balle_restanteJ1_affiche;
        balleRestanteText.setColor('rgb(192, 69, 69)');
      }
          
      }
      export function Elimination_ennemi(bullet, ennemi){ //gère le contact entre ennemi et balle et leur elimination
        const tireur = bullet.tireur;
        bullet.destroy();
        ennemi.points_vie -= 1;
        etatNiveau.son_areignne_blesse.play();
        this.time.delayedCall(200), () => {
          ennemi.setColor('0xFF0000')
        }
        if (ennemi.points_vie <= 0){
          ennemi.destroy();
          if (tireur){ //défini simplement qui est le tireur
            tireur.score += ennemi.score;
            const scoreText = tireur === etatNiveau.player2 ? etatNiveau.score_J2_affiche : etatNiveau.score_J1_affiche;
            scoreText.setText('Score: ' + tireur.score);
          }
        }
      };
    export function recuperer_cle(player, cle){
      player.score += 500
      etatNiveau.son_cle.play();
      etatNiveau.cles_restantes -= 1;
      cle.destroy();
      if (etatNiveau.cles_restantes>0){
        etatNiveau.cles_restantes_affiche.setText('Clés à récupérer : ' + etatNiveau.cles_restantes);
      }
      else{
        etatNiveau.cles_restantes_affiche.setText('Dirigez vous vers la sortie !');
      }
      if (etatNiveau.cles_creees >= etatNiveau.nombre_cles && etatNiveau.groupe_cle.countActive(true) === 0){
        this.porte1.setTexture("sortie1_ouverte");
        etatNiveau.sortie_ouverte = true;
      }
    }
    export function soigner(cible, medkit) {
        cible.points_vies = Math.min(cible.points_vies + 1, 5);
      medkit.destroy();
    }; 