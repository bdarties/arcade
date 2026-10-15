// Tous les sons sont des fichiers MP3 chargés dans chargement.js.

export function jouerPiano(scene, note, options = {}) {
  scene.sound.play("piano_" + note, { pan: options.pan || 0, volume: options.volume || 1 });
}

export function jouerMotif(scene, perso) {
  scene.sound.play("motif_" + perso.cle);
}

export function jouerSaxo(scene, note, options = {}) {
  var voie = options.pan < 0 ? 1 : options.pan > 0 ? 2 : 0;
  var son = scene.sonsSaxo[note][voie];
  if (scene.arretsSaxo[note][voie]) scene.arretsSaxo[note][voie].remove();
  scene.tweens.killTweensOf(son);
  son.stop();
  son.play({ pan: options.pan || 0, volume: 1 });
  var duree = (options.duree || 0.5) * 1000;
  scene.tweens.add({ targets: son, volume: 0, delay: Math.max(0, duree - 60), duration: 60 });
  scene.arretsSaxo[note][voie] = scene.time.delayedCall(duree, () => son.stop());
}

export function jouerSon(scene, nom, pan) {
  if (nom == "menu") return;
  if (nom == "valider" || nom == "retour") nom = "selection";
  if (nom == "fanfare") nom = "final";
  if (nom == "selection") scene.sound.stopByKey(nom);
  scene.sound.play(nom, { pan: pan || 0, volume: 0.6 });
}

export function arreterMusique(scene) {
  var musique = scene.sound.get("musique");
  if (musique) {
    scene.tweens.killTweensOf(musique);
    musique.stop();
  }
}

export function jouerTampon(scene, cm) {
  var hauteur = cm <= 0 ? 84 : Math.max(60, 81 - cm);
  scene.sound.play("tampon_" + hauteur);
}

export function sifflet(scene, duree) {
  var son = scene.sound.add("sifflet", { rate: 2.5 / duree });
  son.once("complete", () => son.destroy());
  son.once("stop", () => son.destroy());
  son.play();
  return son;
}

export function lancerMusique(scene) {
  var musique = scene.sound.get("musique");
  if (!musique) musique = scene.sound.add("musique", { loop: true, volume: 0.3 });
  if (!musique.isPlaying) musique.play();
  volumeMusique(scene, 0.3);
}

export function volumeMusique(scene, volume) {
  var musique = scene.sound.get("musique");
  if (musique) {
    scene.tweens.killTweensOf(musique);
    scene.tweens.add({ targets: musique, volume: volume, duration: 400 });
  }
}
