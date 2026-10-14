// nom du son -> fichier + volume. Si un fichier manque, ce son reste muet.

const D = "./assets/sons/";
const FICHIERS = {
  // déjà présents
  saut:         { fichier: D + "jump.wav",        vol: 0.6 },
  degats:       { fichier: D + "hurt.mp3",        vol: 0.9 },
  potion:       { fichier: D + "success.mp3",     vol: 0.7 }
};

const cle = (nom) => "snd_" + nom;

// à appeler dans le preload() d'une scène : charge les fichiers audio une seule fois
export function chargerSons(scene) {
  Object.entries(FICHIERS).forEach(([nom, f]) => {
    if (!scene.cache.audio.exists(cle(nom))) scene.load.audio(cle(nom), [f.fichier]);
  });
}

// joue un son sans jamais faire planter le jeu
export function jouer(scene, nom) {
  try {
    const f = FICHIERS[nom];
    if (f && scene.cache.audio.exists(cle(nom))) scene.sound.play(cle(nom), { volume: f.vol });
  } catch (e) {
    /* pas de son, tant pis */
  }
}

// laser : son en boucle, renvoie un objet avec .stop()
export function laserOn(scene) {
  try {
    if (scene.cache.audio.exists(cle("laser"))) {
      const s = scene.sound.add(cle("laser"), { loop: true, volume: FICHIERS.laser.vol });
      s.play();
      return { stop() { s.stop(); s.destroy(); } };
    }
  } catch (e) {}
  return { stop() {} };
}