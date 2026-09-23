import Enemy from "./Enemy.js";

export async function chargerImagesNames(directory) {
    return new Promise((resolve, reject) => {
        fetch(directory)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Erreur lors du chargement du répertoire : " + response.statusText);
                }
                return response.text();
            })
            .then(html => {
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, "text/html");
                console.log(doc);
                var files = Array.from(doc.querySelectorAll("a"))
                    .map(link => link.getAttribute("href"))
                    .map(name => name.split('/').pop())
                    .filter(name => name.startsWith( "portal") || name.startsWith("item"))
                  
                resolve(files);
            })
            .catch(error => {
                reject(error);
            });
    });
}


export async function chargerConfig(configFile) {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    var contenu = xhr.responseText;
                    // Séparer le contenu en lignes
                    var lignes = contenu.trim().split('\n');
                    // Initialiser un objet pour stocker les paires clé-valeur
                    var variables = {};
                    // Pour chaque ligne, séparer la chaîne de caractères pour obtenir le nom de la variable et sa valeur
                    for (var i = 0; i < lignes.length; i++) {
                        var ligne = lignes[i];
                        var [variable, cle, valeur] = ligne.trim().split(/[.=]/);
                        if (typeof (variable) != 'undefined' && typeof (cle) != 'undefined' && typeof (valeur) != 'undefined') {
                            console.log(variable + " et " + cle + " et " + valeur);
                            // Stocker la paire clé-valeur dans l'objet
                            valeur = isNaN(parseInt(valeur)) ? valeur.trim() : parseInt(valeur.trim());
                            // creation de l'entité objet si pas déjà présente
                            if (typeof (variables[variable.trim()]) == 'undefined') variables[variable.trim()] = {};
                            variables[variable.trim()][cle] = valeur;
                        }
                        else {
                            console.log("ligne ignorée " + variable + ", " + cle + " " + valeur);
                        }
                    }
                    // Renvoyer l'objet contenant les paires clé-valeur
                    console.log(variables);
                    resolve(variables);
                } else {
                    reject(new Error("Erreur lors du chargement du fichier : " + xhr.statusText));
                }
            }
        };
        xhr.open('GET', configFile);
        xhr.send();
    });
}

// Définition de la fonction de rappel pour la collision entre les balles et les ennemis
export function hitByABullet2(victime, balle) {
    // Recul de l'ennemi
    // Calcul de la direction de la projection
    var direction = (victime.x < balle.x) ? -1 : 1;

    // Projection de l'ennemi
    var projectionDistance = 20; // Distance de projection
    victime.x += direction * projectionDistance;
    balle.destroy();

    // Rend la victime invincible pendant 3 secondes
    victime.invincible = true;
    this.time.delayedCall(3000, function () {
        victime.invincible = false;
    }, [], this);
}

// Définition de la fonction de rappel pour la collision entre les balles et les ennemis
export function playerHitByABullet(victime, balle) {
    playerHit.call(this, victime, balle);
    balle.destroy();
}

export function enemyHitByABullet(victime, balle) {
    enemyHit.call(this, victime, balle);
    balle.destroy();
}

export function enemyHitByWeapon(weapon, enemy) {
    enemyHit.call(this, enemy, weapon);
}

export function enemyHit(victime, balle) {
    console.log(victime);
    //  alert(victime);
    if (victime.isInvincible() == false) {
        victime.decreaseHealthPoints();
        if (!victime.isDead()) {
            var direction = (victime.x < balle.x) ? -1 : 1;
            // Projection de la victime
            var projectionDistance = 20; // Distance de projection
            victime.x += direction * projectionDistance;
            victime.setInvincible();
        }
        else {
            victime.destroy();
            this.player.addOneKill();
            var interfaceScene = this.scene.get('interfaceJeu');
            interfaceScene.updateKills();

        }
    }
}

export function onDeathLayer(victime, death_layer) {
    do {
        victime.decreaseHealthPoints();
    } while (!victime.isDead() && victime.getLifes() > 0);

    var interfaceScene = this.scene.get('interfaceJeu');
    interfaceScene.afficherCoeurs();

    if (victime.getLifes() > 0) {
        victime.decreaseLife();
        victime.resetHealthPoints();
        interfaceScene.afficherVies();
        interfaceScene.afficherCoeurs();
        //   alert("Vous etes mort. Vous perdez une vie et revenez au dernier chekopint");
        victime.resetStatut();
        victime.x = victime.scene.spawnPoint.x;
        victime.y = victime.scene.spawnPoint.y;
    }
    else {
        // fin du game 
        interfaceScene.scene.stop();
        this.game.config.sceneTarget = "recto";
        this.scene.stop("map_recto");
        this.scene.stop("map_verso");
        this.scene.stop("interface_jeu");
        this.scene.start("lose");
    }
}

export function playerHit(victime, enemy) {
    if (victime.isInvincible() == false) {
        var interfaceScene = this.scene.get('interfaceJeu');
        victime.decreaseHealthPoints();
        interfaceScene.afficherCoeurs();

        if (victime.isDead()) {
            if (victime.getLifes() > 0) {
                victime.decreaseLife();
                victime.resetHealthPoints();
                interfaceScene.afficherVies();
                interfaceScene.afficherCoeurs();
                victime.resetStatut();
                // alert("Vous etes mort. Vous perdez une vie et revenez au dernier chekopint");
                victime.x = victime.scene.spawnPoint.x;
                victime.y = victime.scene.spawnPoint.y;
            }
            else {
                // fin du game 
                gameOver.call(this);


            }
        }
        else {
            var direction = (victime.x < enemy.x) ? -1 : 1;
            // Projection de la victime
            var projectionDistance = 20; // Distance de projection
            victime.x += direction * projectionDistance;
            victime.setInvincible();
        }
    }
}

export function playerHitByAnEnemy(victime, enemy) {
    playerHit.call(this, victime, enemy);
}

export function onKillLayer(victim, kill_layer) {
    playerHit.call(this, victim, kill_layer);
}


export function checkDelay(player, zone) {
    return typeof (zone.associated_timer) == 'undefined';
}

export function printMsg(player, zone) {
    zone.associated_text.setVisible(true);
    // Vérifier si un timer est associé à la zone
    if (typeof (zone.associated_timer) == 'undefined') {
        // Créer un nouveau timer s'il n'existe pas
        zone.associated_timer = this.time.delayedCall(3000, function () {
            // Rendre le texte associé invisible après 3 secondes
            zone.associated_text.setVisible(false);
            zone.associated_timer = undefined;
        }, [], this);
    } else {

        // Reset du timer à 3 secondes s'il existe déjà
        zone.associated_timer.reset({ delay: 3000, paused: false });
        console.log(zone.associated_timer);
    }

}


export function groupsCreation() {
    this.grp_bullet_player = this.physics.add.group({ allowGravity: false });
    this.grp_bullet_enemy = this.physics.add.group({ allowGravity: false });
    this.grp_portal = this.physics.add.group({ gravityY: 0 });
    this.grp_items = this.physics.add.group({ allowGravity: false });
    this.grp_powerUp = this.physics.add.group({ allowGravity: false });

}

//creation des calques usuels : affichage et collision


//creation du calque de mort : perte de tous ses points de vie en cas de contact
export function deathLayerCreation() {
    if (this.map.getLayer("death_layer") != null) {
        this.death_layer = this.map.createLayer('death_layer', [this.tileset, this.tileset_extra], 0, 0);
        this.death_layer.setDepth(45);
        this.death_layer.setCollisionByExclusion(-1);
        this.physics.add.overlap(this.player, this.death_layer, onDeathLayer, checkLayoutOverlapWithTiles, this);
    } else {
        this.death_layer = null;
    }
}

//creation du calque de kill : perte d'un point de vie en cas de contact
export function killLayerCreation() {
    if (this.map.getLayer("kill_layer") != null) {
        this.kill_layer = this.map.createLayer('kill_layer', [this.tileset, this.tileset_extra], 0, 0);
        this.kill_layer.setDepth(45);
        this.kill_layer.setCollisionByExclusion(-1);
        this.physics.add.overlap(this.player, this.kill_layer, onKillLayer, checkLayoutOverlapWithTiles, this);
    } else {
        this.kill_layer = null;
    }
}

// creation des textures a partir du calque object_layer, si existant
export function itemCreation() {
    if (this.map.getObjectLayerNames().includes("object_layer")) {
        const tab_objects = this.map.getObjectLayer("object_layer");
        var list_items = tab_objects.objects.filter(function (object) {
            return object.name === "item";
        });
         // référence vers la texture par défaut
        

        list_items.forEach(itemElement => {
            var texture = "item_to_collect";
            var item;
            var proprietes = {};
            if (typeof (itemElement.properties) != 'undefined') {
                itemElement.properties.forEach(property => {
                    proprietes[property.name] = property.value;
                }, this);
            
                // ajout du style particulier si existant
                var style = itemElement.properties.find(property => property.name === "style");
                if (style) {
                    texture = texture + "_" + style.value;
                }
            }
            // création de l'item avec la texture choisie
            item = new Item(this, itemElement.x, itemElement.y, texture, proprietes);
            this.grp_items.add(item);
            item.setDepth(49);
        }, this);
    }
    else {
        console.log("calque object_layer non trouvé");
    }
}

// creation des powerup a partir du calque object_layer, si existant
export function powerUpCreation() {
    if (this.map.getObjectLayerNames().includes("object_layer")) {
        const tab_objects = this.map.getObjectLayer("object_layer");
        var list_powerUps = tab_objects.objects.filter(function (object) {
            return object.name === "powerUp";
        });
        list_powerUps.forEach(powerUpElement => {
            var powerUp;
            var proprietes = {};
            if (typeof (powerUpElement.properties) != 'undefined') {
                powerUpElement.properties.forEach(property => {
                    proprietes[property.name] = property.value;
                }, this);
            }
            powerUp = new Item(this, powerUpElement.x, powerUpElement.y, "item_" + proprietes.item_type, proprietes);
            this.grp_powerUp.add(powerUp);
            powerUp.setDepth(49);
        }, this);

    }
    else {
        console.log("calque object_layer non trouvé");
    }
}


// creation des ennemis a partir du calque object_layer, si existant
export function enemiesCreation() {
    if (this.map.getObjectLayerNames().includes("object_layer")) {
        const tab_objects = this.map.getObjectLayer("object_layer");
        var list_enemies = tab_objects.objects.filter(function (object) {
            return object.name.startsWith("enemy_") === true;
        });
        list_enemies.forEach(enemyElement => {
            var enemy;
            var proprietes = {};
            // récupération du type d'ennemi depuis le nom
            var type = parseInt(enemyElement.name.split('_')[1], 10);
            proprietes.type = type;
            if (typeof (enemyElement.properties) != 'undefined') {
                enemyElement.properties.forEach(property => {
                    proprietes[property.name] = property.value;
                }, this);
            }
            enemy = new Enemy(this, enemyElement.x, enemyElement.y, proprietes);
            this.grp_enemy.add(enemy);
            if (type == 4) enemy.body.setAllowGravity(false);

            enemy.setDepth(49);
            enemy.initiateMobility();

        }, this);
    }
    else {
        console.log("calque object_layer non trouvé");
    }
}

// verifie si un joueur est superpose à une tuile existante d'un calque
export function checkLayoutOverlapWithTiles(player, tile) {
    const layer = tile.tilemapLayer;
    const playerTileUp = layer.getTileAtWorldXY(player.x, player.getTopCenter().y + 1);
    const playerTileDown = layer.getTileAtWorldXY(player.x, player.getBottomCenter().y - 1);
    if (playerTileUp || playerTileDown) {
        return true;
    }
    return false;
}

export function worldsBoundsAndCameraConfiguration() {
    // redimentionnement du monde avec les dimensions calculées via tiled
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    //  ajout du champs de la caméra de taille identique à celle du monde
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    // ancrage de la caméra sur le joueur
    this.cameras.main.startFollow(this.player);
}

export function powerUpCollect(player, item) {
    item.disableBody(true, true);

    switch (item.proprietes.item_type) {
        case "jump":
            player.increaseJumpHeight(item.proprietes.item_effect);
            break;
        case "double_jump":
            player.enableDoubleJump();
            break;
        case "triple_jump":
            player.enableTripleJump();
            break;
        case "wall_jump":
            player.enableWallJump();
            break;
        case "fly":
            player.enableFlying();
            break;
        case "change":
            player.setNewLook(item.proprietes);
            break;
        case "speed":
            player.increaseSpeed(item.proprietes.item_effect);
            break;
            case "reset" : 
            player.resetPowerUps();
            break;
        case "shoot":
            player.enableShooting();
            break;
        case "long_shot":
            player.increaseProjectileLength(item.proprietes.item_effect);
            break;

    }
    // Mise en pause la scène actuelle
    this.scene.pause();
    // Lancement la scène dialogBox
    this.scene.launch('dialogBox', { proprietes: item.proprietes, sceneToResume: this.scene.key });
}

export function itemCollect(player, item) {
    player.collectItem(item);
    if (item.getType() == "collect") {
        var interfaceScene = this.scene.get('interfaceJeu');
        interfaceScene.updateItems();
    }
    if (item.getType() == "hearth") {
        var interfaceScene = this.scene.get('interfaceJeu');
        interfaceScene.afficherCoeurs();
    }

    if (item.getType() == "key") {
        player.playerProperties.addToInventory(item.proprietes.id);
    }

    item.destroy();
}

export function collisionAndOverLapCreation() {
    // collisions
    this.physics.add.collider(this.player, this.platform_layer, null, this.checkLadderSpecifics, this);
    this.physics.add.collider(this.grp_enemy, this.platform_layer);
    this.physics.add.overlap(this.grp_enemy, this.grp_bullet_player, enemyHitByABullet, null, this);
    this.physics.add.overlap(this.player, this.grp_bullet_enemy, playerHitByABullet, null, this);
    this.physics.add.overlap(this.player, this.grp_enemy, playerHitByAnEnemy, null, this);
    this.physics.add.overlap(this.player, this.grp_powerUp, powerUpCollect, null, this);
    this.physics.add.overlap(this.player, this.grp_items, itemCollect, null, this);

    // collision si arme de poing
    if (this.player.closeCombat == true) {
        this.physics.add.overlap(this.player.weapon, this.grp_enemy, enemyHitByWeapon, null, this);
    }
}


export function setDestinationReachedVictoryCondition() {
    if (this.map.getObjectLayerNames().includes("object_layer")) {
        const tab_objects = this.map.getObjectLayer("object_layer");

        // Creation de la destination target  :
        tab_objects.objects.forEach(point => {
            if (point.name == "target") {
                var target = this.physics.add.sprite(point.x, point.y, "destination");
                target.body.allowGravity = false;
                target.setDepth(49);
                this.physics.add.overlap(this.player, target, function (player, target) {
                    player.setDestinationReached(true);
                    // Détecter quand ils ne se superposent plus
                    this.time.delayedCall(100, function () {
                        if (!this.physics.overlap(player, target)) {
                            // Les sprites ne se superposent plus
                            player.setDestinationReached(false);
                        }
                    }, [], this);
                }, null, this);
            }
        }
        );
    }
}

export function gameOver() {
    var interfaceScene = this.scene.get('interfaceJeu');
    interfaceScene.scene.stop();
    this.game.config.sceneTarget = "recto";
    this.scene.stop("map_recto");
    this.scene.stop("map_verso");
    this.scene.stop("interface_jeu");
    this.scene.start("lose");
}