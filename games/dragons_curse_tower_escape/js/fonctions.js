export function doNothing() {
    // cette fonction ne fait rien.
    // c'est juste un exemple pour voir comment mettre une fonction
    // dans un fichier et l'utiliser dans les autres
}


export function doAlsoNothing() {
    // cette fonction ne fait rien non plus.
 }


//==========================
// Gestion des pv
//==========================

export class PvManager {
  constructor(scene, maxHealth = 5) {
    this.scene = scene;
    this.maxHealth = maxHealth;

    if (!this.scene.registry.has('playerMaxHealth')) {
      this.scene.registry.set('playerMaxHealth', this.maxHealth);
    }
    if (!this.scene.registry.has('playerHealth')) {
      this.scene.registry.set('playerHealth', this.maxHealth);
    }
  }

  getHealth() {
    return this.scene.registry.get('playerHealth');
  }

  getMaxHealth() {
    return this.scene.registry.get('playerMaxHealth');
  }

  updateHealth(newHealth) {
    const clampedHealth = Phaser.Math.Clamp(newHealth, 0, this.getMaxHealth());
    this.scene.registry.set('playerHealth', clampedHealth);

  if (clampedHealth <= 0) {
    this.scene.scene.start("gameover");
  }
}


  damage(amount) {
    const newHealth = this.getHealth() - amount;
    this.updateHealth(newHealth);
  }

  heal(amount) {
    const newHealth = this.getHealth() + amount;
    this.updateHealth(newHealth);
  }
}

//================================
// Gestion des portes
//=================================
export function estPorte(scene, player, calquePorte) {
    // Récupère la tile sous le joueur
    const tile = calquePorte.getTileAtWorldXY(player.x, player.y, true);

    if (tile && tile.properties.estPorte) {
        // Le joueur est sur une tile porte
        let niveaux = ["niveau1"];
        const currentKey = scene.scene.key;

        // Retire la scène active du tableau
        niveaux = niveaux.filter(niveau => niveau !== currentKey);

        // Si aucun autre niveau, ne rien faire
        if (niveaux.length === 0) return false;

        const niveauSuivant = niveaux[Math.floor(Math.random() * niveaux.length)];
        scene.scene.start(niveauSuivant);
        return true;
    }

    return false;
}


/***********************************************************************/
/** FONCTIONS DE TIR
/***********************************************************************/

export function tirer(scene, player, direction) {
    // Cooldown
    if (scene.time.now < (scene.lastShootTime || 0)) return;
    scene.lastShootTime = scene.time.now + 200; //en ms

    if (!scene.groupeBullets) {
        scene.groupeBullets = scene.physics.add.group();
    }

    let bullet = scene.groupeBullets.create(player.x, player.y, 'fireball');
    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;
    bullet.body.allowGravity = false;
    
    // Taille de la fireball (peut être ajustée)
    bullet.setScale(1.5);
    
    // Vitesse de la fireball
    const speed = 350;
    
    // Direction du tir et rotation de la fireball
    switch(direction) {
        case 'left':
            bullet.setVelocity(-speed, 0);
            bullet.setRotation(0); // Orientation vers la gauche
            break;
        case 'right':
            bullet.setVelocity(speed, 0);
            bullet.setRotation(Math.PI); // Orientation vers la droite (180°)
            break;
        case 'up':
            bullet.setVelocity(0, -speed);
            bullet.setRotation(Math.PI / 2); // Orientation vers le haut (90°)
            break;
        case 'down':
            bullet.setVelocity(0, speed);
            bullet.setRotation(-Math.PI / 2); // Orientation vers le bas (-90°)
            break;
    }

    // Jouer l'animation de la fireball
    bullet.anims.play('fireball_anim', true);

    // Ajout d'un écouteur pour détecter les collisions avec le joueur ou les ennemis
    bullet.body.world.on('worldbounds', (body) => {
        if (body.gameObject === bullet) {
            bullet.destroy();
        }
    });

    // Destruction de la fireball après 1 seconde
    scene.time.delayedCall(1000, () => {
        if (bullet.active) bullet.destroy();
    });
}

export function lancerAttaque(scene) {
    if (scene.isAttacking) return;

    scene.isAttacking = true;
    scene.player.setVelocity(0, 0);
    scene.player.anims.play('mage_attack', true);
    
    scene.time.delayedCall(300, () => {
        tirer(scene, scene.player, scene.lastDirection);
    });
    
    scene.player.once('animationcomplete', () => {
        scene.isAttacking = false;
    });
}

export function creerEnnemis(scene, ClasseEnnemi) {
    const groupeEnnemis = scene.physics.add.group();
    
    if (!scene.map || !scene.map.getObjectLayer('ennemi')) {
        console.warn("Calque 'ennemi' non trouvé dans la map");
        return groupeEnnemis;
    }
    
    const calqueObjets = scene.map.getObjectLayer('ennemi');
    
    calqueObjets.objects.forEach(objet => {
        if (objet.name === 'ennemi1') {
            const ennemi = new ClasseEnnemi(scene, objet.x, objet.y);
            groupeEnnemis.add(ennemi);
        }
    });
    
    return groupeEnnemis;
}

//==========================
//
// Coffre
//
//==========================

export function estCoffre(scene, player, calqueObjets) {
  let coffreTrouve = null;

  calqueObjets.objects.forEach(obj => {
    if (obj.properties && obj.properties.some(p => p.name === "estCoffre" && p.value)) {
      const rect = new Phaser.Geom.Rectangle(obj.x, obj.y - obj.height, obj.width, obj.height);
      if (Phaser.Geom.Rectangle.Overlaps(rect, player.getBounds())) {
        coffreTrouve = obj;
      }
    }
  });

  return coffreTrouve;
}


//=========================
//
//Objet : Potion
//
//=========================
export class Potion {
  constructor(healAmount = 1) {
    this.type = "potion";
    this.healAmount = healAmount;
  }

  use(pvManager, inventory, index) {
    pvManager.heal(this.healAmount);
    inventory.removeItem(index); // on retire la potion de l’inventaire
  }

  toString() {
    return `Potion (+${this.healAmount} PV)`;
  }
}

//=========================
//
//Minimap
//
//=========================


export function creerMinimap(scene, player, map, options = {}) {
    const width = options.width || 200;   // largeur minimap
    const height = options.height || 120; // hauteur minimap
    const x = options.x || 10;            // position X
    const y = options.y || 10;            // position Y
    const zoom = options.zoom || 0.1;     // zoom de la minimap
    const calques = options.calques || ["calque_background", "calque_plateformes"]; // calques à afficher

    // Création de la caméra minimap
    const minimap = scene.cameras.add(x, y, width, height)
        .setZoom(zoom)
        .setName('minimap')
        .setRoundPixels(true)
        .setBackgroundColor(0x00000033);

    // Faire suivre le joueur
    minimap.startFollow(player);

    // Ajouter uniquement les calques spécifiés
    map.layers.forEach(layer => {
        if (!calques.includes(layer.name)) {
            minimap.ignore(layer.tilemapLayer);
        }
    });

    // Ignorer les groupes d'ennemis ou projectiles par défaut
    if (scene.groupeEnnemis) minimap.ignore(scene.groupeEnnemis);
    if (scene.groupeBullets) minimap.ignore(scene.groupeBullets);
    if (scene.groupeFlechesEnnemis) minimap.ignore(scene.groupeFlechesEnnemis);

    return minimap;
}





