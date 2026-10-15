// ============================================================================
// VERSUS : gestionnaire des armes et des objets (apparition, ramassage, tirs, explosions)
//
// Il vit à l'intérieur de VersusScene (this.armes) et ne touche pas au mode narratif.
//   - toutes les ARMES_REGLES.INTERVALLE_ARME secondes de combat : une arme aléatoire tombe du ciel
//   - toutes les ARMES_REGLES.INTERVALLE_COEUR secondes de combat : un cœur tombe du ciel (minuteur séparé)
//   - un objet descend lentement et se pose sur la première plateforme / le premier sol rencontré
//   - on le ramasse en le touchant ; la touche d'action tire (au lieu de frapper) ; la touche "lacher" la lâche
// ============================================================================
import { ETATS, REGLES, ARMES_REGLES } from "./versusConfig.js";
import { ARMES, COEUR, jouerSon } from "./armes.js";

const TAILLE_TUILE = 32;

// vitesse (px/s) et taille des projectiles
const PROJECTILES = {
  roquette: { vitesse: 520, echelle: 0.5 },
  note: { vitesse: 420, echelle: 0.5 },
  fleche: { vitesse: 760, echelle: 0.9 }
};

export default class GestionnaireArmes {
  constructor(scene) {
    this.scene = scene;
    this.objets = scene.physics.add.group({ allowGravity: false }); // armes et cœurs posés / en descente
    this.projectiles = scene.physics.add.group({ allowGravity: false }); // roquettes, notes, fléchettes en vol
    this.collisions = []; // colliders avec le décor : refaits à chaque arène
    this.chevauchements = scene.joueurs.map((j) => [
      scene.physics.add.overlap(this.objets, j.sprite, this.ramasser, null, this),
      scene.physics.add.overlap(this.projectiles, j.sprite, this.projectileTouche, null, this)
    ]);
    this.chronoArme = 0; // secondes de combat écoulées depuis la dernière arme
    this.chronoCoeur = 0;
  }

  // ==========================================================================
  //  COLLISIONS AVEC LE DÉCOR (appelées par VersusScene à chaque changement d'arène)
  // ==========================================================================
  brancherCollisions() {
    this.retirerCollisions();
    const solides = this.scene.arene.solides;
    // un objet déjà posé n'a plus de collision avec le décor (processCallback renvoie false)
    const pasEncorePose = (a, b) => !(a.getData ? a : b).getData("atterri");
    this.collisions.push(this.scene.physics.add.collider(this.objets, solides, this.objetAuSol, pasEncorePose, this));
    this.collisions.push(this.scene.physics.add.collider(this.projectiles, solides, this.projectileMur, null, this));
  }

  retirerCollisions() {
    this.collisions.forEach((c) => c.destroy());
    this.collisions = [];
  }

  // ==========================================================================
  //  BOUCLE (appelée à chaque image par VersusScene)
  //  Les minuteurs n'avancent que pendant le COMBAT : décompte et pauses entre manches ne comptent pas.
  // ==========================================================================
  mettreAJour(delta, actif) {
    if (actif) {
      const dt = Math.min(delta, 100) / 1000; // un gros ralentissement ne doit pas faire apparaître 3 armes d'un coup
      this.chronoArme += dt;
      this.chronoCoeur += dt;
      if (this.chronoArme >= ARMES_REGLES.INTERVALLE_ARME) {
        this.chronoArme -= ARMES_REGLES.INTERVALLE_ARME;
        if (this.compter("arme") < ARMES_REGLES.MAX_ARMES_AU_SOL) this.apparaitre("arme");
      }
      if (this.chronoCoeur >= ARMES_REGLES.INTERVALLE_COEUR) {
        this.chronoCoeur -= ARMES_REGLES.INTERVALLE_COEUR;
        if (this.compter("coeur") < ARMES_REGLES.MAX_COEURS_AU_SOL) this.apparaitre("coeur");
      }
    }

    const hauteur = this.scene.cameras.main.height;
    const largeur = this.scene.cameras.main.width;
    const maintenant = this.scene.time.now;

    // objets tombés dans un trou : on les supprime
    this.objets.getChildren().slice().forEach((o) => {
      if (o.y > hauteur + 100) this.detruireObjet(o);
    });

    this.projectiles.getChildren().slice().forEach((p) => {
      // sorti de l'écran : il disparaît (une roquette perdue libère le lance-trompette)
      if (p.x < -60 || p.x > largeur + 60 || p.y < -100 || p.y > hauteur + 100) {
        if (p.getData("type") === "roquette") this.finRoquette(p);
        this.detruireProjectile(p);
        return;
      }
      // traînée de fumée de la roquette
      if (p.getData("type") === "roquette" && maintenant - p.getData("fumee") > 60) {
        p.setData("fumee", maintenant);
        const dir = p.body.velocity.x >= 0 ? 1 : -1;
        const f = this.scene.add.circle(p.x - dir * 16, p.y, 5, 0xd8d8d8, 0.7).setDepth(3);
        this.scene.tweens.add({ targets: f, scale: 2.4, alpha: 0, duration: 380, onComplete: () => f.destroy() });
      }
    });
  }

  // début de manche : tout est remis à zéro
  nouvelleManche() {
    this.objets.getChildren().slice().forEach((o) => this.detruireObjet(o));
    this.projectiles.getChildren().slice().forEach((p) => this.detruireProjectile(p));
    this.chronoArme = 0;
    this.chronoCoeur = 0;
  }

  // appelée à la sortie de la scène : à ce moment Phaser a souvent déjà détruit les groupes physiques
  // (leurs enfants avec), donc on ne touche qu'à ce qui existe encore
  detruire() {
    this.retirerCollisions();
    this.chevauchements.flat().forEach((c) => c.destroy());
    this.chevauchements = [];
    [this.objets, this.projectiles].forEach((groupe) => {
      if (groupe.children) groupe.clear(true, true); // détruit les enfants restants
    });
  }

  // nombre d'objets d'un type ("arme" ou "coeur") actuellement dans l'arène
  compter(type) {
    return this.objets.getChildren().filter((o) => o.getData("type") === type).length;
  }

  // ==========================================================================
  //  APPARITION : l'objet naît au-dessus de l'écran et descend vers une colonne qui a un sol
  // ==========================================================================
  colonnesAtterrissables() {
    const calque = this.scene.arene.solides;
    const colonnes = [];
    for (let c = 1; c < calque.layer.width - 1; c++) {
      for (let r = 0; r < calque.layer.height; r++) {
        const tuile = calque.getTileAt(c, r);
        if (tuile && tuile.collideUp) {
          colonnes.push(c); // il y a au moins une surface où se poser dans cette colonne
          break;
        }
      }
    }
    return colonnes;
  }

  apparaitre(type) {
    const colonnes = this.colonnesAtterrissables();
    if (!colonnes.length) return null;
    const colonne = Phaser.Utils.Array.GetRandom(colonnes);
    const id = type === "arme" ? Phaser.Utils.Array.GetRandom(Object.keys(ARMES)) : null;
    const objet = this.creerObjet(type, id, colonne * TAILLE_TUILE + TAILLE_TUILE / 2, -30, { usages: id ? ARMES[id].usages : 0 });
    jouerSon(this.scene, "apparition", { volume: ARMES_REGLES.VOLUME * 0.8 });
    return objet;
  }

  // crée un objet (type "arme" avec son id, ou "coeur").  options.gravite : il tombe normalement (arme lâchée)
  creerObjet(type, id, x, y, options = {}) {
    const cle = type === "coeur" ? COEUR.cle : ARMES[id].cle;
    const objet = this.objets.create(x, y, cle).setDepth(2);
    objet.setScale(type === "coeur" ? COEUR.echelle : ARMES[id].echelleItem);
    objet.setData({ type, id, usages: options.usages ?? 0, atterri: false });
    // pendant la chute le corps est étroit (28 px max) : l'objet ne s'accroche pas au coin d'une plateforme voisine
    objet.body.updateBounds();
    this.dimensionnerCorps(objet, Math.min(objet.displayWidth * 0.8, 28));
    if (options.gravite) objet.body.setAllowGravity(true);
    else objet.body.setVelocity(0, ARMES_REGLES.VITESSE_CHUTE); // descente lente
    // léger clignotement pour qu'on remarque l'objet
    this.scene.tweens.add({ targets: objet, alpha: 0.72, duration: 500, yoyo: true, repeat: -1 });
    return objet;
  }

  // règle la largeur du corps physique (en pixels affichés), centré sur le sprite
  dimensionnerCorps(objet, largeur) {
    objet.body.setSize(largeur / objet.scaleX, objet.displayHeight / objet.scaleY, true);
  }

  detruireObjet(objet) {
    this.scene.tweens.killTweensOf(objet);
    objet.destroy();
  }

  // l'objet touche le sol / une plateforme : il s'arrête
  objetAuSol(a, b) {
    const objet = a.getData ? a : b;
    if (!objet.body || !(objet.body.blocked.down || objet.body.touching.down)) return;
    objet.body.setVelocity(0, 0);
    objet.body.setAllowGravity(false);
    objet.setData("atterri", true);
    this.dimensionnerCorps(objet, objet.displayWidth); // posé : toute la taille du sprite sert au ramassage
  }

  // ==========================================================================
  //  RAMASSAGE
  // ==========================================================================
  ramasser(a, b) {
    const objet = a.getData("type") ? a : b;
    const sprite = objet === a ? b : a;
    const index = this.scene.joueurs.findIndex((j) => j.sprite === sprite);
    if (index < 0 || !objet.active) return;
    const joueur = this.scene.joueurs[index];
    if (this.scene.etat !== ETATS.COMBAT || !joueur.vivant || joueur.endormi) return;

    if (objet.getData("type") === "coeur") {
      if (joueur.vies >= REGLES.VIES) return; // déjà au maximum : le cœur reste pour l'adversaire
      joueur.vies = Math.min(REGLES.VIES, joueur.vies + ARMES_REGLES.SOIN);
      this.scene.rafraichirCoeurs();
      jouerSon(this.scene, "coeur");
      this.etincelles(joueur.sprite.x, joueur.sprite.y - 20, 0xff6b81);
    } else {
      if (joueur.arme) return; // une seule arme à la fois (la lâcher avec la touche "lacher")
      if (this.scene.time.now < (objet.getData("interdit" + index) || 0)) return; // arme qu'on vient de lâcher
      joueur.equiper(objet.getData("id"), objet.getData("usages"));
      jouerSon(this.scene, "arme_ramassee");
      this.etincelles(joueur.sprite.x, joueur.sprite.y - 20, 0xffe27a);
    }
    this.detruireObjet(objet);
  }

  // le joueur lâche son arme (touche "lacher") : retour aux poings, l'arme tombe devant lui
  lacher(joueur) {
    const arme = joueur.arme;
    if (!arme) return;
    if (!arme.vide) {
      const dir = joueur.sprite.flipX ? -1 : 1;
      const objet = this.creerObjet("arme", arme.id, joueur.sprite.x + dir * 18, joueur.sprite.y - 10, { usages: arme.usages, gravite: true });
      objet.body.setVelocity(dir * 140, -160); // petit lancer
      objet.setData("interdit" + joueur.index, this.scene.time.now + ARMES_REGLES.DELAI_REPRISE);
    } // un lance-trompette déjà tiré (roquette en vol) est simplement jeté : il n'a plus rien à offrir
    joueur.retirerArme();
    jouerSon(this.scene, "lacher");
  }

  // ==========================================================================
  //  TIR (appelée par Joueur quand on appuie sur "action" en tenant une arme)
  // ==========================================================================
  tirer(joueur) {
    const arme = joueur.arme;
    if (!arme) return;
    const def = ARMES[arme.id];
    const maintenant = this.scene.time.now;

    if (arme.vide) { // lance-trompette déjà tiré, roquette encore en vol
      if (maintenant > (arme.clic || 0)) {
        arme.clic = maintenant + 300;
        jouerSon(this.scene, "clic_vide");
      }
      return;
    }
    if (maintenant < arme.prochainTir) return;

    const s = joueur.sprite;
    const dir = s.flipX ? -1 : 1;
    const x = s.x + dir * def.bouche[0];
    const y = s.y + def.bouche[1];

    if (def.projectile === "roquette") {
      arme.fusee = this.creerProjectile("roquette", joueur, x, y, dir);
      arme.vide = true;
      arme.usages = 0;
      joueur.armeSprite.setTexture(def.cleVide); // le lance-trompette est vide tant que la roquette vole
      jouerSon(this.scene, "lance_tir");
    } else if (def.projectile === "note") {
      const numero = def.usages - arme.usages + 1; // 1..5 : la note monte à chaque tir
      this.creerProjectile("note", joueur, x, y, dir);
      arme.usages--;
      arme.prochainTir = maintenant + def.cadence;
      jouerSon(this.scene, "lyre_" + numero);
      if (arme.usages <= 0) joueur.retirerArme(); // dernière note : la lyre disparaît
    } else if (def.projectile === "fleche") {
      this.creerProjectile("fleche", joueur, x, y, dir);
      jouerSon(this.scene, "fleche_tir");
      joueur.retirerArme(); // usage unique
    }
    this.scene.rafraichirArmesHUD();
  }

  creerProjectile(sorte, joueur, x, y, dir) {
    const cles = {
      roquette: "versus_roquette",
      note: joueur.index === 0 ? "versus_note_rouge" : "versus_note_bleu", // rouge = joueur 1, bleu = joueur 2
      fleche: joueur.index === 0 ? "versus_dart_rouge" : "versus_dart_bleu"
    };
    const reglage = PROJECTILES[sorte];
    const p = this.projectiles.create(x, y, cles[sorte]).setScale(reglage.echelle).setFlipX(dir < 0).setDepth(4);
    p.setData({ type: sorte, tireur: joueur.index, arme: joueur.arme, fumee: 0 });
    p.body.setVelocity(dir * reglage.vitesse, 0);
    if (sorte === "note") this.scene.tweens.add({ targets: p, angle: { from: -9, to: 9 }, duration: 180, yoyo: true, repeat: -1 });
    return p;
  }

  detruireProjectile(p) {
    this.scene.tweens.killTweensOf(p);
    p.destroy();
  }

  // ==========================================================================
  //  IMPACTS
  // ==========================================================================

  // un projectile touche le décor (mur plein, caisse...) ; les plateformes à sens unique sont traversées
  projectileMur(a, b) {
    const p = a.getData ? a : b;
    if (!p.active) return;
    const sorte = p.getData("type");
    if (sorte === "roquette") this.exploser(p);
    else {
      this.etincelles(p.x, p.y, sorte === "note" ? 0xffffff : 0x88ddff, 5);
      this.detruireProjectile(p);
    }
  }

  // un projectile touche un joueur
  projectileTouche(a, b) {
    const p = a.getData("type") ? a : b;
    const sprite = p === a ? b : a;
    if (!p.active) return;
    const index = this.scene.joueurs.findIndex((j) => j.sprite === sprite);
    if (index < 0 || index === p.getData("tireur")) return; // on ne se tire pas dessus
    const cible = this.scene.joueurs[index];
    if (this.scene.etat !== ETATS.COMBAT || !cible.vivant) return;
    const sorte = p.getData("type");
    const dir = p.body.velocity.x >= 0 ? 1 : -1;

    if (sorte === "roquette") {
      this.exploser(p);
    } else if (sorte === "note") {
      if (cible.invulnerable && !cible.endormi) return; // pendant l'invulnérabilité la note traverse
      if (!this.scene.infligerDegats(index, dir, 1)) return;
      jouerSon(this.scene, "note_impact", { detune: Phaser.Math.Between(-150, 150) });
      this.etincelles(p.x, p.y, 0xffffff, 8);
      this.detruireProjectile(p);
    } else if (sorte === "fleche") {
      if (!cible.endormi) this.endormir(cible);
      this.etincelles(p.x, p.y, 0x88ddff, 6);
      this.detruireProjectile(p);
    }
  }

  // la roquette explose : dégâts dans un rayon autour d'elle, l'arme du tireur disparaît
  exploser(p) {
    if (p.getData("explose")) return;
    p.setData("explose", true);
    const { x, y } = p;
    const tireur = p.getData("tireur");
    this.finRoquette(p);
    this.detruireProjectile(p);
    this.effetExplosion(x, y);
    jouerSon(this.scene, "explosion", { volume: Math.min(1, ARMES_REGLES.VOLUME * 1.3) });

    const index = 1 - tireur; // l'explosion ne touche que l'adversaire
    const cible = this.scene.joueurs[index];
    if (!cible || !cible.vivant) return;
    const b = cible.sprite.body;
    const cercle = new Phaser.Geom.Circle(x, y, ARMES_REGLES.RAYON_EXPLOSION);
    if (Phaser.Geom.Intersects.CircleToRectangle(cercle, new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height))) {
      this.scene.infligerDegats(index, cible.sprite.x >= x ? 1 : -1, ARMES_REGLES.DEGATS_EXPLOSION, ARMES_REGLES.RECUL_EXPLOSION);
    }
  }

  // la roquette n'existe plus : le lance-trompette (usage unique) disparaît de la main du tireur
  finRoquette(p) {
    const joueur = this.scene.joueurs[p.getData("tireur")];
    if (joueur && joueur.arme && joueur.arme === p.getData("arme")) joueur.retirerArme();
  }

  // Dormimus : l'adversaire s'endort, perd son arme, et reste vulnérable pendant tout son sommeil
  endormir(cible) {
    cible.endormir(ARMES_REGLES.DUREE_SOMMEIL);
    jouerSon(this.scene, "endort");
    this.scene.rafraichirArmesHUD();
  }

  // ==========================================================================
  //  EFFETS VISUELS
  // ==========================================================================
  effetExplosion(x, y) {
    const s = this.scene;
    const eclair = s.add.circle(x, y, 18, 0xfff2a8, 1).setDepth(20);
    const boule = s.add.circle(x, y, 14, 0xff8a1f, 0.95).setDepth(19);
    s.tweens.add({ targets: eclair, scale: 4, alpha: 0, duration: 220, onComplete: () => eclair.destroy() });
    s.tweens.add({ targets: boule, scale: 7, alpha: 0, duration: 420, ease: "Cubic.easeOut", onComplete: () => boule.destroy() });
    this.etincelles(x, y, 0xffb347, 12, 140);
    s.cameras.main.shake(180, 0.007);
  }

  // petites particules qui partent dans tous les sens (cercles qui s'éteignent)
  etincelles(x, y, couleur, nombre = 8, portee = 60) {
    for (let k = 0; k < nombre; k++) {
      const angle = Math.random() * Math.PI * 2;
      const d = portee * (0.4 + Math.random() * 0.6);
      const e = this.scene.add.circle(x, y, 3 + Math.random() * 3, couleur, 1).setDepth(21);
      this.scene.tweens.add({
        targets: e,
        x: x + Math.cos(angle) * d,
        y: y + Math.sin(angle) * d,
        alpha: 0,
        duration: 300 + Math.random() * 300,
        onComplete: () => e.destroy()
      });
    }
  }
}
