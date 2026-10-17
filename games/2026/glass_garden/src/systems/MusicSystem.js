// =====================================================================================
// * MUSIC SYSTEM : LA MUSIQUE DES MONDES
// =====================================================================================
//
// Chaque monde a sa musique (voir MUSIC dans constants.js), qui tourne en boucle. Au passage d'un miroir, la musique du monde quitté
// s'estompe pendant que le cercle noir se referme, et celle du nouveau monde monte pendant qu'il s'ouvre.
// Le gestionnaire de sons de Phaser est commun à tout le jeu : une musique continue quand on change de scène. Quand on recommence un niveau
// (même monde), la même musique continue sans repartir de zéro. Un monde sans musique (voir TRACKS) laisse seulement s'éteindre la précédente.
//
// ! Les navigateurs refusent le son avant un premier appui de touche : Phaser attend ce premier appui (celui du menu) pour la lancer.
//
// * COMMENT L'UTILISER
//   preloadMusic(this, 'world_1');          // dans preload() : charge la musique de ce monde
//   playMusic(this, 'world_1');             // dans create() : la musique du monde monte en fondu
//   fadeOutMusic(this, 600);                // quand on quitte le monde : elle s'estompe
// =====================================================================================

import { MUSIC } from '../utils/constants.js';

let current = null; // { key, sound } : la musique qui joue

/** Charge la musique de ce monde (sans effet s'il n'en a pas). À appeler dans preload(). */
export function preloadMusic(scene, world) {
  const file = MUSIC.TRACKS[world];
  if (file) scene.load.audio(MUSIC.KEY_PREFIX + world, MUSIC.PATH + file);
}

/**
 * Lance la musique de ce monde en boucle, en fondu. Si c'est déjà elle qui joue, elle continue (son volume revient simplement à la normale).
 * Un monde sans musique éteint celle qui jouait.
 * @param {number} [fadeMs]  La durée du fondu d'entrée
 */
export function playMusic(scene, world, fadeMs = MUSIC.FADE_MS) {
  if (!MUSIC.TRACKS[world]) {
    fadeOutMusic(scene, fadeMs);
    return;
  }
  const key = MUSIC.KEY_PREFIX + world;
  if (current?.key === key) {
    scene.tweens.add({ targets: current.sound, volume: MUSIC.VOLUME, duration: fadeMs });
    return;
  }

  // * L'ancienne musique (déjà presque éteinte par le fondu de sortie) s'arrête pour de bon
  stopMusic();
  const sound = scene.sound.add(key, { loop: true, volume: 0 });
  sound.play();
  scene.tweens.add({ targets: sound, volume: MUSIC.VOLUME, duration: fadeMs });
  current = { key, sound };
}

/** Éteint la musique en fondu, puis l'arrête. */
export function fadeOutMusic(scene, fadeMs = MUSIC.FADE_MS) {
  if (!current) return;
  const { sound } = current;
  scene.tweens.add({
    targets: sound,
    volume: 0,
    duration: fadeMs,
    onComplete: () => {
      if (current?.sound === sound) stopMusic();
    },
  });
}

/** Arrête la musique tout de suite. */
export function stopMusic() {
  if (!current) return;
  current.sound.stop();
  current.sound.destroy();
  current = null;
}
