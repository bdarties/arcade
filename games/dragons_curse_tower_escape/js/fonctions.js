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
      console.log("Joueur mort - Nettoyage des scènes...");
      
      // Arrêter le coffre s'il est actif
      if (this.scene.scene.isActive('Coffre')) {
        console.log("Arrêt du coffre");
        this.scene.scene.stop('Coffre');
      }
      
      // Arrêter la pause si elle est active
      if (this.scene.scene.isActive('PauseScene')) {
        console.log("Arrêt de la pause");
        this.scene.scene.stop('PauseScene');
      }
      
      // Arrêter le HUD
      if (this.scene.scene.isActive('hud')) {
        console.log("Arrêt du HUD");
        this.scene.scene.stop('hud');
      }

      console.log("Lancement de Game Over");
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

    // Si des ennemis existent, viser l'ennemi actif le plus proche
    let targeted = false;
    try {
      if (scene.groupeEnnemis && scene.groupeEnnemis.getChildren) {
        const ennemis = scene.groupeEnnemis.getChildren().filter(e => e && e.active);
        if (ennemis.length > 0) {
          // Trouver l'ennemi le plus proche
          let nearest = null;
          let nearestDist = Infinity;
          ennemis.forEach(e => {
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < nearestDist) {
              nearestDist = d;
              nearest = e;
            }
          });

          if (nearest) {
            // Calculer direction vers la cible
            const dx = nearest.x - player.x;
            const dy = nearest.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            // Petit offset pour spawn la boule devant le joueur
            const offset = 16;
            const spawnX = player.x + (dx / dist) * offset;
            const spawnY = player.y + (dy / dist) * offset;
            bullet.setPosition(spawnX, spawnY);
            // Assurer que le sprite du joueur regarde vers la cible
            if (player.flipX !== undefined) {
              player.flipX = dx < 0;
            }

            bullet.setVelocity((dx / dist) * speed, (dy / dist) * speed);
            const angle = Math.atan2(dy, dx);
            bullet.setRotation(angle);
            targeted = true;
          }
        }
      }
    } catch (e) {
      // ignore si groupeEnnemis absent
    }

    // Si pas de cible, fallback sur le tir directionnel classique
    if (!targeted) {
      switch(direction) {
        case 'left':
            bullet.setVelocity(-speed, 0);
            bullet.setRotation(Math.PI); // Orientation vers la gauche
            break;
        case 'right':
            bullet.setVelocity(speed, 0);
            bullet.setRotation(0); // Orientation vers la droite
            break;
        case 'up':
            bullet.setVelocity(0, -speed);
            bullet.setRotation(-Math.PI / 2); // Orientation vers le haut
            break;
        case 'down':
            bullet.setVelocity(0, speed);
            bullet.setRotation(Math.PI / 2); // Orientation vers le bas
            break;
        default:
            // si direction inconnu, tirer vers la droite
            bullet.setVelocity(speed, 0);
            bullet.setRotation(0);
      }
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

  use(pvManager) {
    // Heal the player directly. Inventory system removed: caller should manage removal if needed.
    pvManager.heal(this.healAmount);
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

// ===========================
// Système de Level et XP
// ===========================

export class LevelManager {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.enemiesPerLevel = options.enemiesPerLevel || 3; // Nombre d'ennemis à tuer pour level up
    
    if (!this.scene.registry.has('playerLevel')) {
      this.scene.registry.set('playerLevel', 1);
    }
    if (!this.scene.registry.has('playerXP')) {
      this.scene.registry.set('playerXP', 0);
    }
    if (!this.scene.registry.has('enemiesKilled')) {
      this.scene.registry.set('enemiesKilled', 0);
    }
  }

  getLevel() {
    return this.scene.registry.get('playerLevel') || 1;
  }

  getXP() {
    return this.scene.registry.get('playerXP') || 0;
  }

  getEnemiesKilled() {
    return this.scene.registry.get('enemiesKilled') || 0;
  }

  getXPForNextLevel() {
    return this.enemiesPerLevel;
  }

  addXP(amount = 1) {
    const currentXP = this.getXP();
    const currentKills = this.getEnemiesKilled();
    const newXP = currentXP + amount;
    const newKills = currentKills + 1;
    
    this.scene.registry.set('playerXP', newXP);
    this.scene.registry.set('enemiesKilled', newKills);
    
    console.log(`XP +${amount}! Total: ${newXP}/${this.getXPForNextLevel()}`);
    
    // Afficher un texte flottant d'XP
    this.showXPText(amount);
    
    // Vérifier si on peut level up
    if (newXP >= this.getXPForNextLevel()) {
      this.levelUp();
    }
  }

  levelUp() {
    const currentLevel = this.getLevel();
    const newLevel = currentLevel + 1;
    const currentXP = this.getXP();
    const xpForNext = this.getXPForNextLevel();
    
    // Soustraire l'XP utilisée
    const remainingXP = currentXP - xpForNext;
    
    this.scene.registry.set('playerLevel', newLevel);
    this.scene.registry.set('playerXP', remainingXP);
    
    console.log(`🎉 LEVEL UP! Niveau ${newLevel}`);
    
    // Augmenter les stats du joueur
    this.applyLevelBonuses(newLevel);
    
    // Afficher l'animation de level up
    this.showLevelUpEffect();
  }

  applyLevelBonuses(newLevel) {
    // Augmenter les PV max de 2 par niveau
    const currentMaxHealth = this.scene.registry.get('playerMaxHealth') || 9;
    const newMaxHealth = currentMaxHealth + 2;
    this.scene.registry.set('playerMaxHealth', newMaxHealth);
    
    // Soigner complètement le joueur
    this.scene.registry.set('playerHealth', newMaxHealth);
    
    console.log(`Stats améliorées! PV max: ${newMaxHealth}`);
  }

  showXPText(amount) {
    if (!this.scene.player) return;
    
    const xpText = this.scene.add.text(
      this.scene.player.x,
      this.scene.player.y - 40,
      `+${amount} XP`,
      {
        fontSize: '20px',
        color: '#00ff00',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5);
    
    // Animation du texte qui monte et disparaît
    this.scene.tweens.add({
      targets: xpText,
      y: xpText.y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        xpText.destroy();
      }
    });
  }

  showLevelUpEffect() {
    if (!this.scene.player) return;
    
    const level = this.getLevel();
    
    // Texte LEVEL UP!
    const levelUpText = this.scene.add.text(
      this.scene.player.x,
      this.scene.player.y - 60,
      `LEVEL ${level}!`,
      {
        fontSize: '32px',
        color: '#ffff00',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 6,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    // Animation du texte
    this.scene.tweens.add({
      targets: levelUpText,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      y: levelUpText.y - 80,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        levelUpText.destroy();
      }
    });
    
    // Effet de particules dorées
    const particles = this.scene.add.particles(this.scene.player.x, this.scene.player.y, 'mage1', {
      frame: 0,
      lifespan: 1000,
      speed: { min: 100, max: 200 },
      scale: { start: 0.3, end: 0 },
      blendMode: 'ADD',
      emitting: false
    });
    
    particles.explode(20);
    
    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });
    
    // Flash blanc sur le joueur
    this.scene.player.setTint(0xffffff);
    this.scene.time.delayedCall(500, () => {
      this.scene.player.clearTint();
    });
  }
}




