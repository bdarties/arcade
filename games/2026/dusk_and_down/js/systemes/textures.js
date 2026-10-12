export function rendreNet(scene) {
  for (const cle of scene.textures.getTextureKeys()) {
    if (!cle.startsWith("img_")) {
      scene.textures.get(cle).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }
}

function anim(scene, cle, texture, debut, fin, vitesse, boucle, allerRetour) {
  if (scene.anims.exists(cle)) {
    return;
  }
  scene.anims.create({
    key: cle,
    frames: scene.anims.generateFrameNumbers(texture, { start: debut, end: fin }),
    frameRate: vitesse,
    repeat: boucle ? -1 : 0,
    yoyo: allerRetour === true
  });
}

export function creerAnimations(scene) {
  for (const cle of ["chevalier_j1", "chevalier_j2"]) {
    anim(scene, cle + "_repos", cle, 0, 5, 8, true);
    anim(scene, cle + "_marche", cle, 10, 17, 12, true);
    anim(scene, cle + "_attaque", cle, 20, 27, 26, false);
    anim(scene, cle + "_blesse", cle, 30, 33, 14, false);
    anim(scene, cle + "_mort", cle, 40, 49, 12, false);
  }
  anim(scene, "rampant_repos", "rampant", 0, 5, 8, true);
  anim(scene, "rampant_marche", "rampant", 10, 17, 10, true);
  anim(scene, "rampant_attaque", "rampant", 20, 27, 16, false);
  anim(scene, "rampant_mort", "rampant", 40, 43, 10, false);

  anim(scene, "anim_colonne_sacree", "colonne_sacree", 0, 15, 20, false);

  anim(scene, "anim_flamme", "flamme", 0, 7, 12, true);
  anim(scene, "anim_bougie", "bougie", 0, 3, 8, true);
  anim(scene, "anim_torche", "torche", 0, 3, 8, true);
  anim(scene, "anim_arbre", "arbre_anime", 0, 5, 6, true, true);
  anim(scene, "anim_trone", "trone_liche", 0, 5, 6, true);
}
