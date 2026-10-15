import { MONDE, ISO, TEMPLE, TENEBRES, PROFONDEUR } from "../reglages/config.js";
import { jouerEffet, flashLumineux } from "./effets.js";
import { annoncer } from "./hud.js";
import { jouerSon } from "./sons.js";

export function creerTemple(scene) {
  const x = MONDE.largeur / 2;
  const y = MONDE.hauteur / 2;

  scene.add.image(x, y, "parvis_iso").setDepth(PROFONDEUR.parvis);
  const autel = scene.add.image(x, y, "autel").setDepth(y + 40);

  const flamme = scene.add.sprite(x, y + 8, "flamme", 0);
  flamme.setOrigin(0.5, 1).setScale(1.6).setDepth(PROFONDEUR.lumieres);
  flamme.play("anim_flamme");
  const lueur = scene.add.image(x, y - 24, "img_lumiere");
  lueur.setTint(0xffa347).setBlendMode(Phaser.BlendModes.ADD).setDepth(PROFONDEUR.lumieres);
  lueur.setDisplaySize(300, 200).setAlpha(0.5);

  const braises = scene.add.particles(x, y - 40, "img_braise", {
    speed: { min: 10, max: 45 },
    angle: { min: 250, max: 290 },
    lifespan: 1600,
    scale: { start: 1.2, end: 0 },
    alpha: { start: 1, end: 0 },
    frequency: 110,
    blendMode: "ADD"
  });
  braises.setDepth(PROFONDEUR.lumieres);
  const fumee = scene.add.particles(x, y - 20, "img_fumee", {
    speed: { min: 8, max: 25 },
    angle: { min: 255, max: 285 },
    lifespan: 2600,
    scale: { start: 1.5, end: 4 },
    alpha: { start: 0.7, end: 0 },
    frequency: 180,
    emitting: false
  });
  fumee.setDepth(y + 41);

  const statues = [
    scene.add.image(x - 190, y + 6, "statue").setOrigin(0.5, 0.95),
    scene.add.image(x + 190, y + 6, "statue").setOrigin(0.5, 0.95).setFlipX(true)
  ];
  statues.forEach((statue) => statue.setDepth(statue.y));
  const torches = [];
  for (const [dx, dy] of [[-112, -56], [112, -56], [-112, 56], [112, 56]]) {
    const torche = scene.add.sprite(x + dx, y + dy, "torche", 0).setOrigin(0.5, 0.9).play("anim_torche");
    torche.anims.setProgress(Math.random());
    torche.setDepth(torche.y);
    torches.push(torche);
    const halo = scene.add.image(x + dx, y + dy - 20, "img_lumiere").setTint(0xff9a3d).setBlendMode(Phaser.BlendModes.ADD);
    halo.setDisplaySize(90, 60).setAlpha(0.5).setDepth(PROFONDEUR.lumieres);
    torches.push(halo);
  }
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + 0.3;
    const bougie = scene.add.sprite(x + Math.cos(angle) * 128, y + Math.sin(angle) * 128 * ISO.ratioY, "bougie", 0);
    bougie.setOrigin(0.5, 0.9).play("anim_bougie").setDepth(bougie.y);
    bougie.anims.setProgress(Math.random());
    torches.push(bougie);
  }

  const corps = scene.add.zone(x, y + 4, 150, 70);
  scene.physics.add.existing(corps, true);
  const corpsStatues = statues.map((statue) => {
    const zone = scene.add.zone(statue.x, statue.y - 8, 40, 18);
    scene.physics.add.existing(zone, true);
    return zone;
  });

  scene.temple = {
    x: x,
    y: y,
    corps: corps,
    corpsStatues: corpsStatues,
    autel: autel,
    flamme: flamme,
    lueur: lueur,
    braises: braises,
    fumee: fumee,
    statues: statues,
    torches: torches,
    pv: TEMPLE.pvMax,
    pvMax: TEMPLE.pvMax,
    detruit: false,
    vagueReconstruction: 0,
    derniereAttaque: -99999
  };
}

export function blesserTemple(scene, degats) {
  const temple = scene.temple;
  if (temple.detruit || scene.partieTerminee) {
    return;
  }
  temple.pv = Math.max(0, temple.pv - degats);
  temple.derniereAttaque = scene.tempsJeu;
  temple.flamme.setTint(0x9a7cff);
  scene.time.delayedCall(90, () => temple.flamme.clearTint());
  jouerSon("temple");
  if (temple.pv <= 0) {
    detruireTemple(scene);
  }
}

function detruireTemple(scene) {
  const temple = scene.temple;
  temple.detruit = true;
  temple.pv = 0;
  temple.vagueReconstruction = scene.vague.numero + TEMPLE.vaguesReconstruction + 1;

  scene.tweens.add({ targets: temple.flamme, scaleX: 0, scaleY: 0, duration: 900 });
  scene.tweens.add({ targets: temple.lueur, alpha: 0, duration: 900 });
  temple.braises.stop();
  temple.fumee.start();
  temple.autel.setTint(0x4a4458);
  temple.statues.forEach((statue) => statue.setTint(0x4a4458));
  temple.torches.forEach((torche) => torche.setVisible(false));

  scene.cameras.main.shake(500, 0.012);
  scene.cameras.main.flash(400, 90, 40, 160);
  jouerSon("temple_detruit");
  annoncer(scene, "LE TEMPLE EST TOMBÉ", "Tenez 2 vagues pour qu'il renaisse");
}

export function reconstruireTemple(scene) {
  const temple = scene.temple;
  temple.detruit = false;
  temple.pv = temple.pvMax;

  temple.flamme.setScale(0);
  scene.tweens.add({ targets: temple.flamme, scaleX: 1.6, scaleY: 1.6, duration: 900, ease: "Back.easeOut" });
  scene.tweens.add({ targets: temple.lueur, alpha: 0.5, duration: 900 });
  temple.braises.start();
  temple.fumee.stop();
  temple.autel.clearTint();
  temple.statues.forEach((statue) => statue.clearTint());
  temple.torches.forEach((torche) => torche.setVisible(true));

  jouerEffet(scene, "anim_colonne_sacree", temple.x, temple.y + 10, { origineY: 0.95, echelle: 2.2 });
  flashLumineux(scene, temple.x, temple.y - 20, 0xffd27a, 900);
  scene.cameras.main.flash(500, 255, 220, 150);
  jouerSon("reanimation");
  annoncer(scene, "L'AUBE RENAÎT", "Le temple est reconstruit");
}

export function rayonLumiereTemple(scene) {
  const temple = scene.temple;
  if (temple.detruit) {
    return 0;
  }
  const ratioPv = temple.pv / temple.pvMax;
  return TEMPLE.rayonLumiere * (TEMPLE.lumiereMin + (1 - TEMPLE.lumiereMin) * ratioPv);
}

export function creerTenebres(scene) {
  if (!TENEBRES.actives) {
    scene.tenebres = null;
    return;
  }
  const calque = scene.add.renderTexture(0, 0, scene.scale.width / 4, scene.scale.height / 4);
  calque.setOrigin(0).setScale(4).setScrollFactor(0).setDepth(PROFONDEUR.tenebres);
  const pinceau = scene.make.image({ key: "img_lumiere", add: false });
  scene.tenebres = { calque: calque, pinceau: pinceau };
}

export function mettreAJourTenebres(scene) {
  const tenebres = scene.tenebres;
  if (!tenebres) {
    return;
  }
  const camera = scene.cameras.main;
  const temple = scene.temple;
  tenebres.calque.clear();
  tenebres.calque.fill(TENEBRES.couleur, temple.detruit ? TENEBRES.opaciteSansTemple : TENEBRES.opacite);
  tenebres.calque.beginDraw();

  if (!temple.detruit) {
    eclairer(tenebres, temple.x - camera.scrollX, temple.y - 20 - camera.scrollY, rayonLumiereTemple(scene));
  }
  for (const joueur of scene.joueurs) {
    if (!joueur.estMort) {
      eclairer(tenebres, joueur.x - camera.scrollX, joueur.y - 12 - camera.scrollY, joueur.stats.rayonLumiere);
    }
  }
  tenebres.calque.endDraw(true);
}

function eclairer(tenebres, x, y, rayon) {
  tenebres.pinceau.setPosition(x / 4, y / 4);
  tenebres.pinceau.setDisplaySize(rayon / 2, (rayon / 2) * ISO.ratioY);
  tenebres.calque.batchDraw(tenebres.pinceau);
}
