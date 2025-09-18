export function doNothing() {
    // cette fonction ne fait rien.
    // c'est juste un exemple pour voir comment mettre une fonction
    // dans un fichier et l'utiliser dans les autres
}


export function doAlsoNothing() {
    // cette fonction ne fait rien non plus.
 }

//fonction tirer( ), prenant comme paramètre l'auteur du tir

export function tirer(player, groupeBullets) {
    let coefDir = (player.direction === 'left') ? -1 : 1;

    // on crée la balle à côté du joueur
    let bullet = groupeBullets.create(player.x + (25 * coefDir), player.y - 4, 'bullet');

    // paramètres physiques de la balle
    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;  
    bullet.body.allowGravity = false;
    bullet.setVelocity(500 * coefDir, 0);
}

export function attaquer(player, groupeAttaques) {
    const largeurHitbox = 40;
    const hauteurHitbox = player.body.height; // même hauteur que le joueur

    // Crée la zone invisible
    const hitbox = player.scene.add.zone(player.x, player.y, largeurHitbox, hauteurHitbox);
    player.scene.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);
    hitbox.body.setImmovable(true);

    // Ajoute au groupe
    groupeAttaques.add(hitbox);

    // Fonction pour mettre à jour la position à chaque frame
    hitbox.update = function() {
        // Décalage horizontal : bord droit ou gauche du joueur
        const decalageX = player.direction === 'right'
            ? player.body.width / 2 + largeurHitbox / 2
            : -player.body.width / 2 - largeurHitbox / 2;

        hitbox.setPosition(player.x + decalageX, player.y);
    }

    // Détruire la hitbox après 200 ms
    player.scene.time.delayedCall(200, () => {
        hitbox.destroy();
    });
}
