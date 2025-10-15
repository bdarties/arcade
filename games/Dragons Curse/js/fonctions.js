//==========================
// Effet de lueur (Light2D)
//==========================

// Active une lumière qui suit le joueur
// Options: { color, intensity, radius }
export function enablePlayerGlow(scene, player, options = {}) {
  if (!scene || !player) {
    return null;
  }

  // Valeurs par défaut
  const couleur = options.color || 0xffffaa;
  const intensite = options.intensity || 1.3;
  const rayon = options.radius || 400;

  // Activer le système de lumières
  if (scene.lights && scene.lights.enable) {
    scene.lights.enable();
  }
  if (scene.lights && scene.lights.start) {
    scene.lights.start();
  }

  // Appliquer le pipeline de lumière au joueur
  if (player.setPipeline) {
    player.setPipeline('Light2D');
  }

  // Créer la lumière
  let lumiere = null;
  if (scene.lights && scene.lights.addLight) {
    lumiere = scene.lights.addLight(player.x, player.y, rayon, couleur, intensite);

    // Fonction pour mettre à jour la position
    const mettreAJourPosition = () => {
      if (!lumiere || !player) {
        return;
      }
      lumiere.x = player.x;
      
      if (player.height) {
        lumiere.y = player.y - (player.height * 0.2);
      } else {
        lumiere.y = player.y;
      }
    };

    // Attacher la mise à jour
    if (scene.events && scene.events.on) {
      if (!scene._playerLights) {
        scene._playerLights = [];
      }
      scene._playerLights.push({ light: lumiere, updater: mettreAJourPosition });

      if (!scene._playerLightsAttached) {
        scene.events.on('update', () => {
          if (scene._playerLights) {
            scene._playerLights.forEach(item => item.updater());
          }
        });
        scene._playerLightsAttached = true;
      }
    } else {
      // Fallback avec timer
      scene.time.addEvent({
        loop: true,
        delay: 30,
        callback: mettreAJourPosition
      });
    }
  }

  return lumiere;
}

//==========================
// Configuration complète de la lumière
//==========================

// Version avancée avec gestion des calques et groupes
export function setupPlayerLight(scene, player, options = {}) {
  if (!scene || !scene.lights) {
    return null;
  }

  // Valeurs par défaut
  const rayon = options.radius || 80;
  const couleur = options.color || 0xF1FAFF;
  const intensite = options.intensity || 1;
  const couleurAmbiante = options.ambientColor || 0xF1FAFF;
  const coucheTuiles = options.tileLayers || null;
  const groupes = options.groups || [];
  const decalageY = options.offsetY || 0;

  // Activer les lumières
  scene.lights.enable();
  
  if (scene.lights.setAmbientColor) {
    scene.lights.setAmbientColor(couleurAmbiante);
  }

  // Créer la lumière
  let lumiere = scene.lights.addLight(player.x, player.y + decalageY, rayon);
  lumiere.setColor(couleur);
  lumiere.setIntensity(intensite);

  // Appliquer le pipeline au joueur
  if (player.setPipeline) {
    player.setPipeline('Light2D');
  }

  // Appliquer le pipeline aux calques de tuiles
  if (coucheTuiles && Array.isArray(coucheTuiles)) {
    // Calques spécifiques fournis
    coucheTuiles.forEach(calque => {
      if (calque && calque.setPipeline) {
        calque.setPipeline('Light2D');
      }
    });
  } else if (scene.map && scene.map.layers) {
    // Tous les calques de la map
    scene.map.layers.forEach(calque => {
      if (calque.tilemapLayer && calque.tilemapLayer.setPipeline) {
        calque.tilemapLayer.setPipeline('Light2D');
      }
    });
    
    // Calques spécifiques du jeu
    if (scene.calque_background && scene.calque_background.setPipeline) {
      scene.calque_background.setPipeline('Light2D');
    }
    if (scene.calque_plateformes && scene.calque_plateformes.setPipeline) {
      scene.calque_plateformes.setPipeline('Light2D');
    }
    if (scene.poteaux && scene.poteaux.setPipeline) {
      scene.poteaux.setPipeline('Light2D');
    }
    if (scene.porte && scene.porte.setPipeline) {
      scene.porte.setPipeline('Light2D');
    }
  }

  // Appliquer le pipeline aux groupes
  if (Array.isArray(groupes)) {
    groupes.forEach(nomGroupe => {
      const groupe = scene[nomGroupe];
      if (!groupe) {
        return;
      }
      
      // Enfants existants
      if (groupe.getChildren) {
        groupe.getChildren().forEach(enfant => {
          if (enfant && enfant.setPipeline) {
            enfant.setPipeline('Light2D');
          }
        });
      }
      
      // Futurs ajouts
      if (groupe.on) {
        groupe.on('add', (g, enfant) => {
          if (enfant && enfant.setPipeline) {
            enfant.setPipeline('Light2D');
          }
        });
      }
    });
  }

  // Mettre à jour la position de la lumière
  if (scene.events && scene.events.on && lumiere) {
    if (!scene._playerLights) {
      scene._playerLights = [];
    }
    
    const mettreAJourPosition = () => {
      if (!lumiere || !player) {
        return;
      }
      lumiere.x = player.x;
      lumiere.y = player.y + decalageY;
    };
    
    scene._playerLights.push({ light: lumiere, updater: mettreAJourPosition });
    
    if (!scene._playerLightsAttached) {
      scene.events.on('update', () => {
        if (scene._playerLights) {
          scene._playerLights.forEach(item => item.updater());
        }
      });
      scene._playerLightsAttached = true;
    }
  }

  return lumiere;
}

//==========================
// Gestion des potions
//==========================

// Variable globale pour stocker le nombre de potions
export let nbPotions = 0;

// Fonction utilitaire pour afficher un texte flottant
function afficherTexteFlottant(scene, x, y, texte, options = {}) {
  const floatingText = scene.add.text(x, y, texte, {
    fontSize: options.fontSize || '20px',
    color: options.color || '#ffffff',
    fontFamily: options.fontFamily || 'Arial',
    stroke: options.stroke || '#000000',
    strokeThickness: options.strokeThickness || 4
  }).setOrigin(0.5);
  
  scene.tweens.add({
    targets: floatingText,
    y: floatingText.y + (options.offsetY || -30),
    alpha: 0,
    duration: options.duration || 1000,
    ease: 'Power2',
    onComplete: () => {
      floatingText.destroy();
    }
  });
}

export function ajouterPotion(amount = 1) {
  nbPotions += amount;
  console.log(`Potion récupérée! Total: ${nbPotions}`);
}

export function utiliserPotion(scene, pvManager) {
  if (nbPotions <= 0) {
    console.log("Pas de potion disponible!");
    return false;
  }
  
  const healthBefore = pvManager.getHealth();
  const maxHealth = pvManager.getMaxHealth();
  
  // Ne pas utiliser si déjà à pleine vie
  if (healthBefore >= maxHealth) {
    console.log("Vie déjà au maximum!");
    return false;
  }
  
  nbPotions--;
  pvManager.heal(1);
  console.log(`Potion utilisée! Restantes: ${nbPotions}`);
  
  // Afficher un texte flottant sur le joueur
  if (scene && scene.player) {
    afficherTexteFlottant(scene, scene.player.x, scene.player.y - 40, '+1 PV', {
      color: '#00ff00'
    });
    
    // Effet visuel sur le joueur
    scene.player.setTint(0x00ff00);
    scene.time.delayedCall(300, () => {
      scene.player.clearTint();
    });
  }
  
  return true;
}

export function getNbPotions() {
  return nbPotions;
}

//==========================
// Gestion des coffres
//==========================

export function gererCoffre(scene) {
  if (!scene.poteaux) {
    console.log("Pas de calque poteaux");
    return;
  }

  const tile = scene.poteaux.getTileAtWorldXY(scene.player.x, scene.player.y, true);

  if (tile && tile.properties.estCoffre) {
    const coffreId = `${tile.x},${tile.y}`;
    let coffresOuverts = scene.registry.get("coffresOuverts") || {};
    
    if (coffresOuverts[coffreId]) {
      console.log("Ce coffre a déjà été ouvert !");
      return;
    }

    coffresOuverts[coffreId] = true;
    scene.registry.set("coffresOuverts", coffresOuverts);

    console.log("Coffre trouvé et ouvert !");
    
    // Drop des potions (0 à 2 aléatoirement)
    const nbPotionsDrop = Phaser.Math.Between(0, 2);
    console.log(`Le coffre contient ${nbPotionsDrop} potion(s) !`);
    
    // Créer les potions au sol autour du coffre
    for (let i = 0; i < nbPotionsDrop; i++) {
      const offsetX = (i - 0.5) * 32; // Espacer les potions
      const potion = scene.groupePotions.create(
        scene.player.x + offsetX, 
        scene.player.y + 32, 
        'potion'
      );
      potion.setScale(0.8);
      potion.body.allowGravity = false;
      potion.setCollideWorldBounds(true);
      
      // Animation de bounce
      scene.tweens.add({
        targets: potion,
        y: potion.y - 10,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  } else {
    console.log("Pas de coffre sous le joueur.");
    
    if (scene.porte && estPorte(scene, scene.player, scene.porte)) {
      console.log("Ouverture de la porte vers un niveau aléatoire !");
    } else if (scene.portes && estPorte(scene, scene.player, scene.portes)) {
      console.log("Ouverture de la porte vers un niveau aléatoire !");
    }
  }
}

export function ramasserPotion(scene, player, potion) {
  // Ajouter la potion à l'inventaire
  ajouterPotion(1);
  
  // Afficher un texte flottant
  afficherTexteFlottant(scene, potion.x, potion.y - 20, '+1 Potion', {
    fontSize: '16px',
    color: '#ff00ff',
    strokeThickness: 3,
    duration: 800
  });
  
  // Détruire la potion
  potion.destroy();
}


//==========================
// Gestion des points de vie
//==========================

export class PvManager {
  constructor(scene, vieMaximale = 5) {
    this.scene = scene;
    this.vieMaximale = vieMaximale;

    // Initialiser les valeurs dans le registre
    if (!this.scene.registry.has('playerMaxHealth')) {
      this.scene.registry.set('playerMaxHealth', this.vieMaximale);
    }
    if (!this.scene.registry.has('playerHealth')) {
      this.scene.registry.set('playerHealth', this.vieMaximale);
    }
  }

  obtenirVie() {
    return this.scene.registry.get('playerHealth');
  }

  obtenirVieMaximale() {
    return this.scene.registry.get('playerMaxHealth');
  }

  mettreAJourVie(nouvelleVie) {
    // Limiter entre 0 et vie maximale
    const vieMax = this.obtenirVieMaximale();
    let vieLimitee = nouvelleVie;
    
    if (vieLimitee < 0) {
      vieLimitee = 0;
    }
    if (vieLimitee > vieMax) {
      vieLimitee = vieMax;
    }
    
    this.scene.registry.set('playerHealth', vieLimitee);

    // Vérifier si le joueur est mort
    if (vieLimitee <= 0) {
      console.log("Joueur mort - Nettoyage des scènes...");
      
      // Arrêter le coffre
      if (this.scene.scene.isActive('Coffre')) {
        console.log("Arrêt du coffre");
        this.scene.scene.stop('Coffre');
      }
      
      // Arrêter la pause
      if (this.scene.scene.isActive('PauseScene')) {
        console.log("Arrêt de la pause");
        this.scene.scene.stop('PauseScene');
      }
      
      // Arrêter le HUD
      if (this.scene.scene.isActive('hud')) {
        console.log("Arrêt du HUD");
        this.scene.scene.stop('hud');
      }

      // Lancer Game Over
      console.log("Lancement de Game Over");
      this.scene.scene.start("gameover");
    }
  }

  prendreDegats(montant) {
    const nouvelleVie = this.obtenirVie() - montant;
    this.mettreAJourVie(nouvelleVie);
  }

  soigner(montant) {
    const nouvelleVie = this.obtenirVie() + montant;
    this.mettreAJourVie(nouvelleVie);
  }

  // Alias pour compatibilité
  getHealth() {
    return this.obtenirVie();
  }

  getMaxHealth() {
    return this.obtenirVieMaximale();
  }

  updateHealth(newHealth) {
    this.mettreAJourVie(newHealth);
  }

  damage(amount) {
    this.prendreDegats(amount);
  }

  heal(amount) {
    this.soigner(amount);
  }
}

//==========================
// Gestion des portes
//==========================

export function estPorte(scene, joueur, calquePorte) {
  // Récupérer la tuile sous le joueur
  const tuile = calquePorte.getTileAtWorldXY(joueur.x, joueur.y, true);

  // Vérifier si c'est une porte
  if (tuile && tuile.properties.estPorte) {
    let niveaux = ["niveau1"];
    const sceneActuelle = scene.scene.key;

    // Retirer le niveau actuel de la liste
    niveaux = niveaux.filter(niveau => niveau !== sceneActuelle);

    // Si aucun autre niveau disponible
    if (niveaux.length === 0) {
      return false;
    }

    // Choisir un niveau aléatoire
    const indexAleatoire = Math.floor(Math.random() * niveaux.length);
    const niveauSuivant = niveaux[indexAleatoire];
    
    scene.scene.start(niveauSuivant);
    return true;
  }

  return false;
}


//==========================
// Système de tir
//==========================

export function tirer(scene, joueur, direction) {
  // Vérifier le cooldown
  const maintenant = scene.time.now;
  const dernierTir = scene.lastShootTime || 0;
  
  if (maintenant < dernierTir) {
    return;
  }
  
  // Appliquer le cooldown (200 ms)
  scene.lastShootTime = maintenant + 200;

  // Créer le groupe si nécessaire
  if (!scene.groupeBullets) {
    scene.groupeBullets = scene.physics.add.group();
  }

  // Créer le projectile
  let projectile = scene.groupeBullets.create(joueur.x, joueur.y, 'fireball');
  projectile.setCollideWorldBounds(true);
  projectile.body.onWorldBounds = true;
  projectile.body.allowGravity = false;
  projectile.setScale(1.5);

  // Ajouter une lumière au projectile
  let lumiereProjectile = null;
  if (scene.lights && scene.lights.addLight) {
    lumiereProjectile = scene.lights.addLight(projectile.x, projectile.y, 50, 0xffcc66, 1.3);
    
    if (projectile.setPipeline) {
      projectile.setPipeline('Light2D');
    }

    // Fonction pour mettre à jour la position de la lumière
    const mettreAJourLumiereProjectile = () => {
      if (!lumiereProjectile || !projectile) {
        return;
      }
      lumiereProjectile.x = projectile.x;
      lumiereProjectile.y = projectile.y;
    };

    // Attacher la mise à jour
    if (scene.events && scene.events.on) {
      if (!scene._bulletLights) {
        scene._bulletLights = [];
      }
      scene._bulletLights.push({ 
        light: lumiereProjectile, 
        updater: mettreAJourLumiereProjectile, 
        bullet: projectile 
      });
      
      if (!scene._bulletLightsAttached) {
        scene.events.on('update', () => {
          if (scene._bulletLights) {
            scene._bulletLights.forEach(item => item.updater());
          }
        });
        scene._bulletLightsAttached = true;
      }
    } else {
      // Fallback avec timer
      scene.time.addEvent({ 
        loop: true, 
        delay: 30, 
        callback: mettreAJourLumiereProjectile 
      });
    }
    
    // Attacher la référence de la lumière au projectile
    projectile.lumiereProjectile = lumiereProjectile;

    // Nettoyer la lumière quand le projectile est détruit
    projectile.on('destroy', () => {
      if (projectile.lumiereProjectile && scene.lights && scene.lights.removeLight) {
        scene.lights.removeLight(projectile.lumiereProjectile);
      }
      if (scene._bulletLights) {
        scene._bulletLights = scene._bulletLights.filter(item => {
          return item.bullet && item.bullet.active;
        });
      }
    });
  }
  
  // Vitesse du projectile
  const vitesse = 350;

  // Viser l'ennemi le plus proche si disponible
  let ennemiCible = false;
  if (scene.groupeEnnemis && scene.groupeEnnemis.getChildren) {
    const ennemisActifs = scene.groupeEnnemis.getChildren().filter(e => e && e.active);
    
    if (ennemisActifs.length > 0) {
      // Trouver l'ennemi le plus proche
      let ennemiPlusProche = null;
      let distanceMin = 220;
      
      ennemisActifs.forEach(ennemi => {
        const deltaX = ennemi.x - joueur.x;
        const deltaY = ennemi.y - joueur.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance < distanceMin) {
          distanceMin = distance;
          ennemiPlusProche = ennemi;
        }
      });

      if (ennemiPlusProche) {
        // Calculer la direction vers la cible
        const deltaX = ennemiPlusProche.x - joueur.x;
        const deltaY = ennemiPlusProche.y - joueur.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 0) {
          // Décalage pour spawn devant le joueur
          const decalage = 16;
          const positionX = joueur.x + (deltaX / distance) * decalage;
          const positionY = joueur.y + (deltaY / distance) * decalage;
          projectile.setPosition(positionX, positionY);
          
          // Orienter le joueur vers la cible
          if (joueur.flipX !== undefined) {
            joueur.flipX = deltaX < 0;
          }

          // Définir la vélocité
          projectile.setVelocity(
            (deltaX / distance) * vitesse, 
            (deltaY / distance) * vitesse
          );
          
          // Rotation du projectile
          const angle = Math.atan2(deltaY, deltaX);
          projectile.setRotation(angle);
          ennemiCible = true;
        }
      }
    }
  }

  // Tir directionnel si pas de cible
  if (!ennemiCible) {
    if (direction === 'left') {
      projectile.setVelocity(-vitesse, 0);
      projectile.setRotation(Math.PI);
    } else if (direction === 'right') {
      projectile.setVelocity(vitesse, 0);
      projectile.setRotation(0);
    } else if (direction === 'up') {
      projectile.setVelocity(0, -vitesse);
      projectile.setRotation(-Math.PI / 2);
    } else if (direction === 'down') {
      projectile.setVelocity(0, vitesse);
      projectile.setRotation(Math.PI / 2);
    } else {
      // Direction inconnue : tirer vers la droite
      projectile.setVelocity(vitesse, 0);
      projectile.setRotation(0);
    }
  }

  // Jouer l'animation
  projectile.anims.play('fireball_anim', true);

  // Détruire au contact des bords du monde
  projectile.body.world.on('worldbounds', (body) => {
    if (body.gameObject === projectile) {
      if (lumiereProjectile && scene.lights && scene.lights.removeLight) {
        scene.lights.removeLight(lumiereProjectile);
      }
      projectile.destroy();
    }
  });

  // Destruction automatique après 1 seconde
  scene.time.delayedCall(1000, () => {
    if (lumiereProjectile && scene.lights && scene.lights.removeLight) {
      scene.lights.removeLight(lumiereProjectile);
    }
    if (projectile && projectile.active) {
      projectile.destroy();
    }
  });
}

export function lancerAttaque(scene) {
  // Vérifier si déjà en train d'attaquer
  if (scene.isAttacking) {
    return;
  }

  // Bloquer les attaques multiples
  scene.isAttacking = true;
  scene.player.setVelocity(0, 0);
  scene.player.anims.play('mage_attack', true);
  
  // Tirer après 300ms
  scene.time.delayedCall(300, () => {
    tirer(scene, scene.player, scene.lastDirection);
  });
  
  // Débloquer après l'animation
  scene.player.once('animationcomplete', () => {
    scene.isAttacking = false;
  });
}

//==========================
// Création des ennemis
//==========================

export function creerEnnemis(scene, ClasseEnnemi) {
  const groupeEnnemis = scene.physics.add.group();
  
  // Vérifier que la map et le calque existent
  if (!scene.map) {
    console.warn("Pas de map dans la scène");
    return groupeEnnemis;
  }
  
  const calqueEnnemis = scene.map.getObjectLayer('ennemi');
  if (!calqueEnnemis) {
    console.warn("Calque 'ennemi' non trouvé dans la map");
    return groupeEnnemis;
  }
  
  // Créer les ennemis depuis le calque
  calqueEnnemis.objects.forEach(objet => {
    if (objet.name === 'ennemi1') {
      const ennemi = new ClasseEnnemi(scene, objet.x, objet.y);
      groupeEnnemis.add(ennemi);
    }
  });
  
  return groupeEnnemis;
}

//==========================
// Détection de coffre
//==========================

export function estCoffre(scene, joueur, calqueObjets) {
  let coffreTrouve = null;

  calqueObjets.objects.forEach(objet => {
    // Vérifier si l'objet a la propriété estCoffre
    if (objet.properties) {
      const estUnCoffre = objet.properties.some(propriete => {
        return propriete.name === "estCoffre" && propriete.value === true;
      });
      
      if (estUnCoffre) {
        // Créer un rectangle pour la zone du coffre
        const rectangle = new Phaser.Geom.Rectangle(
          objet.x, 
          objet.y - objet.height, 
          objet.width, 
          objet.height
        );
        
        // Vérifier si le joueur chevauche le coffre
        if (Phaser.Geom.Rectangle.Overlaps(rectangle, joueur.getBounds())) {
          coffreTrouve = objet;
        }
      }
    }
  });

  return coffreTrouve;
}

//==========================
// Classe Potion
//==========================

export class Potion {
  constructor(montantSoin = 1) {
    this.type = "potion";
    this.montantSoin = montantSoin;
  }

  utiliser(gestionnairePv) {
    gestionnairePv.heal(this.montantSoin);
  }

  toString() {
    return `Potion (+${this.montantSoin} PV)`;
  }
  
  // Alias pour compatibilité
  use(pvManager) {
    this.utiliser(pvManager);
  }
}

//==========================
// Minimap
//==========================

export function creerMinimap(scene, joueur, carte, options = {}) {
  // Valeurs par défaut
  const largeur = options.width || 200;
  const hauteur = options.height || 120;
  const positionX = options.x || 10;
  const positionY = options.y || 10;
  const zoom = options.zoom || 0.1;
  const calquesAfficher = options.calques || ["calque_background", "calque_plateformes"];

  // Créer la caméra minimap
  const minimap = scene.cameras.add(positionX, positionY, largeur, hauteur);
  minimap.setZoom(zoom);
  minimap.setName('minimap');
  minimap.setRoundPixels(true);
  minimap.setBackgroundColor(0x00000033);

  // Suivre le joueur
  minimap.startFollow(joueur);

  // Afficher uniquement les calques spécifiés
  carte.layers.forEach(calque => {
    if (!calquesAfficher.includes(calque.name)) {
      if (calque.tilemapLayer) {
        minimap.ignore(calque.tilemapLayer);
      }
    }
  });

  // Ignorer les groupes d'objets dynamiques
  if (scene.groupeEnnemis) {
    minimap.ignore(scene.groupeEnnemis);
  }
  if (scene.groupeBullets) {
    minimap.ignore(scene.groupeBullets);
  }
  if (scene.groupeFlechesEnnemis) {
    minimap.ignore(scene.groupeFlechesEnnemis);
  }

  return minimap;
}

// ===========================
// Système de Skills
// ===========================

export class SkillManager {
  constructor(scene) {
    this.scene = scene;
    
    // Initialiser les skills si nécessaire
    if (!this.scene.registry.has('skillForce')) {
      this.scene.registry.set('skillForce', 0);
    }
    if (!this.scene.registry.has('skillVitesse')) {
      this.scene.registry.set('skillVitesse', 0);
    }
    if (!this.scene.registry.has('skillVie')) {
      this.scene.registry.set('skillVie', 0);
    }
    if (!this.scene.registry.has('skillPointsAvailable')) {
      this.scene.registry.set('skillPointsAvailable', 0);
    }
  }

  getSkillForce() {
    return this.scene.registry.get('skillForce') || 0;
  }

  getSkillVitesse() {
    return this.scene.registry.get('skillVitesse') || 0;
  }

  getSkillVie() {
    return this.scene.registry.get('skillVie') || 0;
  }

  getSkillPointsAvailable() {
    return this.scene.registry.get('skillPointsAvailable') || 0;
  }

  addSkillPoint() {
    const current = this.getSkillPointsAvailable();
    this.scene.registry.set('skillPointsAvailable', current + 1);
  }

  upgradeForce() {
    if (this.getSkillPointsAvailable() <= 0) return false;
    
    const current = this.getSkillForce();
    this.scene.registry.set('skillForce', current + 1);
    this.scene.registry.set('skillPointsAvailable', this.getSkillPointsAvailable() - 1);
    
    console.log(`💪 Force améliorée! Niveau ${current + 1}`);
    return true;
  }

  upgradeVitesse() {
    if (this.getSkillPointsAvailable() <= 0) return false;
    
    const current = this.getSkillVitesse();
    this.scene.registry.set('skillVitesse', current + 1);
    this.scene.registry.set('skillPointsAvailable', this.getSkillPointsAvailable() - 1);
    
    console.log(`⚡ Vitesse améliorée! Niveau ${current + 1}`);
    return true;
  }

  upgradeVie() {
    if (this.getSkillPointsAvailable() <= 0) return false;
    
    const current = this.getSkillVie();
    this.scene.registry.set('skillVie', current + 1);
    this.scene.registry.set('skillPointsAvailable', this.getSkillPointsAvailable() - 1);
    
    // Augmenter les PV max de 2 par niveau de skill
    const currentMaxHealth = this.scene.registry.get('playerMaxHealth') || 9;
    const newMaxHealth = currentMaxHealth + 1;
    this.scene.registry.set('playerMaxHealth', newMaxHealth);
    
    // Soigner le joueur du montant ajouté
    const currentHealth = this.scene.registry.get('playerHealth') || 0;
    this.scene.registry.set('playerHealth', Math.min(currentHealth + 2, newMaxHealth));
    
    console.log(`❤️ Vie améliorée! Niveau ${current + 1} (PV max: ${newMaxHealth})`);
    return true;
  }

  // Calculer les bonus de dégâts basés sur le skill Force
  getDamageBonus() {
    return this.getSkillForce() * 0.5;
  }

  // Calculer le bonus de vitesse basé sur le skill Vitesse
  getSpeedMultiplier() {
    return 1 + (this.getSkillVitesse() * 0.1);
  }

  // Afficher l'UI de sélection de skill
  showSkillSelector(onComplete) {
    if (this.getSkillPointsAvailable() <= 0) {
      if (onComplete) onComplete();
      return;
    }

    // Bloquer le mouvement du joueur
    const wasMovementEnabled = !this.scene.inputsBlocked;
    this.scene.inputsBlocked = true;
    if (this.scene.player) {
      this.scene.player.setVelocity(0, 0);
    }

    // Créer un overlay sombre
    const overlay = this.scene.add.rectangle(
      this.scene.cameras.main.scrollX + this.scene.cameras.main.width / 2,
      this.scene.cameras.main.scrollY + this.scene.cameras.main.height / 2,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      0x000000,
      0.7
    ).setScrollFactor(0).setDepth(1000);

    // Titre
    const title = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      80,
      'SKILL POINT DISPONIBLE!',
      {
        fontSize: '32px',
        color: '#ffff00',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 6,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    // Points disponibles
    const pointsText = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      130,
      `Points disponibles: ${this.getSkillPointsAvailable()}`,
      {
        fontSize: '20px',
        color: '#ffffff',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 4
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    // Options de skills
    const skills = [
      { 
        name: 'FORCE', 
        icon: '💪', 
        level: this.getSkillForce(),
        description: 'Augmente les dégâts\n+0.5 dégâts par niveau',
        upgrade: () => this.upgradeForce()
      },
      { 
        name: 'VITESSE', 
        icon: '⚡', 
        level: this.getSkillVitesse(),
        description: 'Augmente la vitesse\n+10% vitesse par niveau',
        upgrade: () => this.upgradeVitesse()
      },
      { 
        name: 'VIE', 
        icon: '❤️', 
        level: this.getSkillVie(),
        description: 'Augmente les PV max\n+1 PV par niveau',
        upgrade: () => this.upgradeVie()
      }
    ];

    let selectedIndex = 0;
    const skillTexts = [];
    const skillBoxes = [];

    // Créer les boîtes de skills
    const startY = 200;
    const spacing = 140;

    skills.forEach((skill, index) => {
      const x = this.scene.cameras.main.width / 2;
      const y = startY + (index * spacing);

      // Boîte de fond
      const box = this.scene.add.rectangle(x, y, 400, 120, 0x333333, 1)
        .setStrokeStyle(4, 0x666666)
        .setScrollFactor(0)
        .setDepth(1001);
      skillBoxes.push(box);

      // Icône et nom
      const skillText = this.scene.add.text(
        x - 180,
        y - 30,
        `${skill.icon} ${skill.name} (Niv. ${skill.level})`,
        {
          fontSize: '24px',
          color: '#ffffff',
          fontFamily: 'Arial',
          fontStyle: 'bold'
        }
      ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1002);

      // Description
      const descText = this.scene.add.text(
        x - 180,
        y + 15,
        skill.description,
        {
          fontSize: '14px',
          color: '#aaaaaa',
          fontFamily: 'Arial'
        }
      ).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1002);

      skillTexts.push({ skillText, descText, box });
    });

    // Instructions
    const instructions = this.scene.add.text(
      this.scene.cameras.main.width / 2,
      startY + (skills.length * spacing) + 30,
      'Flèches HAUT/BAS: Sélectionner | ESPACE: Confirmer',
      {
        fontSize: '16px',
        color: '#888888',
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

    // Fonction pour mettre à jour la sélection
    const updateSelection = () => {
      skillBoxes.forEach((box, index) => {
        if (index === selectedIndex) {
          box.setFillStyle(0x555555);
          box.setStrokeStyle(4, 0xffff00);
          skillTexts[index].skillText.setColor('#ffff00');
        } else {
          box.setFillStyle(0x333333);
          box.setStrokeStyle(4, 0x666666);
          skillTexts[index].skillText.setColor('#ffffff');
        }
      });
    };

    updateSelection();

    // Gérer les inputs
    const keyboard = this.scene.input.keyboard;
    const upKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const downKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const leftKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    const rightKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    const spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    const cleanup = () => {
      overlay.destroy();
      title.destroy();
      pointsText.destroy();
      instructions.destroy();
      skillTexts.forEach(st => {
        st.skillText.destroy();
        st.descText.destroy();
        st.box.destroy();
      });
      upKey.destroy();
      downKey.destroy();
      leftKey.destroy();
      rightKey.destroy();
      spaceKey.destroy();
      
      if (wasMovementEnabled) {
        this.scene.inputsBlocked = false;
      }
    };

    upKey.on('down', () => {
      selectedIndex = (selectedIndex - 1 + skills.length) % skills.length;
      updateSelection();
    });

    downKey.on('down', () => {
      selectedIndex = (selectedIndex + 1) % skills.length;
      updateSelection();
    });

    // Support pour gauche/droite aussi
    leftKey.on('down', () => {
      selectedIndex = (selectedIndex - 1 + skills.length) % skills.length;
      updateSelection();
    });

    rightKey.on('down', () => {
      selectedIndex = (selectedIndex + 1) % skills.length;
      updateSelection();
    });

    spaceKey.on('down', () => {
      const skill = skills[selectedIndex];
      if (skill.upgrade()) {
        cleanup();
        
        // Effet visuel de confirmation
        this.showSkillUpgradeEffect(skill);
        
        // Si encore des points, réafficher le sélecteur
        this.scene.time.delayedCall(500, () => {
          if (this.getSkillPointsAvailable() > 0) {
            this.showSkillSelector(onComplete);
          } else {
            if (onComplete) onComplete();
          }
        });
      }
    });
  }

  showSkillUpgradeEffect(skill) {
    if (!this.scene.player) return;
    
    const upgradeText = this.scene.add.text(
      this.scene.player.x,
      this.scene.player.y - 60,
      `${skill.icon} ${skill.name} +1!`,
      {
        fontSize: '28px',
        color: '#00ff00',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 6,
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: upgradeText,
      y: upgradeText.y - 60,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        upgradeText.destroy();
      }
    });
    
    // Flash vert sur le joueur
    this.scene.player.setTint(0x00ff00);
    this.scene.time.delayedCall(400, () => {
      this.scene.player.clearTint();
    });
  }
}

// ===========================
// Système de Level et XP
// ===========================

export class LevelManager {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.enemiesPerLevel = options.enemiesPerLevel || 3; // Nombre d'ennemis à tuer pour level up
    this.skillManager = new SkillManager(scene);
    
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
    
    // Ajouter un skill point
    this.skillManager.addSkillPoint();
    
    // Afficher l'animation de level up
    this.showLevelUpEffect();
    
    // Afficher le sélecteur de skill après l'animation
    this.scene.time.delayedCall(1000, () => {
      this.skillManager.showSkillSelector();
    });
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

