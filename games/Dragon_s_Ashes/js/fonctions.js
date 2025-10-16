import { Boss } from "../js/ennemi.js";
//fonction tirer( ), prenant comme paramètre l'auteur du tir

export function tirer(player, groupeBullets) {
    // --- Gestion du cooldown ---
    if (player.cooldownTirActif) {
        return; // 🚫 Encore en cooldown, pas de tir possible
    }

    // Active le cooldown
    player.cooldownTirActif = true;
    player.scene.time.delayedCall(1500, () => {
        player.cooldownTirActif = false;
    });

    // --- Détermination de la direction ---
    let coefDir = (player.direction === 'left') ? -1 : 1;

    // Choix de la texture de la balle en fonction de la direction
    let bulletKey = (coefDir === -1) ? 'bullet_gauche' : 'bullet_droite';

    // Création de la balle
    let bullet = groupeBullets.create(player.x + (25 * coefDir), player.y - 4, bulletKey);

    // Paramètres physiques
    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;  
    bullet.body.allowGravity = false;
    bullet.setVelocity(500 * coefDir, 0);

    // Animation de la balle
    if (coefDir === -1) {
        bullet.anims.play("balle_tir_gauche", true);
    } else {
        bullet.anims.play("balle_tir_droite", true);
    }

// Dans la fonction tirer()
player.enTrainDeTirer = true;

if (coefDir === -1) {
    player.anims.play("anim_tir_gauche", true);
    player.sonTir.play();
} else {
    player.anims.play("anim_tir_droite", true);
    player.sonTir.play();
}

// Remettre à false quand l'animation est terminée
player.once('animationcomplete', () => {
    player.enTrainDeTirer = false;
});
}


export function attaquer(player, groupeAttaques) {
    const largeurHitbox = 60;
    const hauteurHitbox = player.body.height; // même hauteur que le joueur

    // Crée la zone invisible
    const hitbox = player.scene.add.zone(player.x, player.y, largeurHitbox, hauteurHitbox);
    player.scene.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);

    // Jouer l'animation d'attaque sur la hitbox
    hitbox.anims = player.scene.add.sprite(hitbox.x, hitbox.y, 'perso_attaque');
    hitbox.anims.play('anim_attaque', true);


    // Ajouter au groupe
    groupeAttaques.add(hitbox);

    // Mettre à jour la position de la hitbox et du sprite animé
    hitbox.update = function() {
        const decalageX = player.direction === 'right'
            ? player.body.width / 2 + largeurHitbox / 2
            : -player.body.width / 2 - largeurHitbox / 2;

        hitbox.setPosition(player.x + decalageX, player.y);
        hitbox.anims.setPosition(hitbox.x, hitbox.y); // synchroniser le sprite animé
        player.sonAttaque.play();
    }

    // Détruire la hitbox et le sprite animé après 200 ms
    player.scene.time.delayedCall(200, () => {
        hitbox.anims.destroy();
        hitbox.destroy();
    });
}



export function mettreAJourAnimation(player) {
    // Priorité : Tir > Saut > Déplacement > Repos

    if (player.enTrainDeTirer) return; // ne pas interrompre le tir

    // Saut / en l'air
    if (!player.body.blocked.down) {
        const anim = player.direction === 'right' ? 'anim_saut_droite' : 'anim_saut_gauche';
        if (player.anims.currentAnim?.key !== anim) player.anims.play(anim, true);

        // arrêter le son de course en l'air
        if (player.sonCourse?.isPlaying) player.sonCourse.stop();

        // jouer le son de vol si disponible
        if (player.sonVol && !player.sonVol.isPlaying) {
            player.sonVol.play({ loop: true });
        }

        return;
    } else {
        // arrêter le son de vol si joueur au sol
        if (player.sonVol?.isPlaying) player.sonVol.stop();
    }

    // Déplacement horizontal
    if (player.body.velocity.x !== 0) {
        const anim = player.direction === 'right' ? 'anim_tourne_droite' : 'anim_tourne_gauche';
        if (player.anims.currentAnim?.key !== anim) player.anims.play(anim, true);

        // jouer le son de course si pas déjà en train de jouer
        if (player.sonCourse && !player.sonCourse.isPlaying) player.sonCourse.play();

        return;
    }

    // Repos
    const animRepos = player.direction === 'right' ? 'anim_repos_droite' : 'anim_repos_gauche';
    if (player.anims.currentAnim?.key !== animRepos) player.anims.play(animRepos, true);

    // arrêter le son de course si joueur immobile
    if (player.sonCourse?.isPlaying) player.sonCourse.stop();
}

export function updatePV() {
    this.groupPV.children.iterate((coeur, index) => {
        if (index < this.player.hp) {
            coeur.setTexture("img_coeurplein");
        } else {
            coeur.setTexture("img_coeurvide");
        }
    });
}

export function updateVies() {
    this.groupVies.children.iterate((vie, index) => {
        if (index < this.player.vies) {
            vie.setTexture("img_viecomplete");
        } else {
            vie.setTexture("img_vievide");
        }
    });
}

export function activerZoneBoss(scene) {
    // Éviter de répéter plusieurs fois
    if (scene.zoneBossActive) return;
    scene.zoneBossActive = true;

    console.log("🔥 Entrée dans la zone du boss !");

    // --- 1. Désactiver tous les ennemis sauf le boss ---
    scene.groupeEnnemis.children.iterate((ennemi) => {
        if (!(ennemi instanceof Boss)) {
            ennemi.setActive(false).setVisible(false);
            ennemi.body.enable = false;
            if (ennemi.timer) ennemi.timer.paused = true;
        }
    });

    // --- 2. Faire un fondu sur la musique ---
    if (scene.musiqueJeu && scene.musiqueJeu.isPlaying) {
        scene.tweens.add({
            targets: scene.musiqueJeu,
            volume: 0,
            duration: 2000,
            onComplete: () => {
                scene.musiqueJeu.stop();
            }
        });
    }

    // --- 3. Lancer la musique du boss ---
    if (scene.sonMusiqueBoss && !scene.sonMusiqueBoss.isPlaying) {
        scene.sonMusiqueBoss.play();
    }
}


