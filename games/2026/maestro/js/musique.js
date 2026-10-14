// ============================================================================
//  js/musique.js — LA MUSIQUE DU JEU : une seule piste à la fois, qui continue d'un écran à l'autre
//
//  Problème résolu : chaque écran lançait sa propre musique et la coupait en partant. Résultat : un silence
//  entre l'accueil, le choix du mode et le synopsis, jusqu'au lobby.
//  Ici, la piste en cours est mémorisée dans le registry (la mémoire partagée entre scènes) :
//    - si on demande la même piste, elle CONTINUE sans coupure ;
//    - si on demande une autre piste, l'ancienne s'arrête et la nouvelle démarre ;
//    - un niveau arrête la musique du menu quand il commence (arreterMusique).
// ============================================================================

// Joue la piste « cle » en boucle, sauf si elle joue déjà
export function jouerMusique(scene, cle, volume) {
  if (scene.cache.audio.exists(cle) == false) {
    return; // piste absente : le jeu reste jouable sans musique
  }
  const enCours = scene.registry.get("musique");
  if (enCours && enCours.key == cle && enCours.isPlaying) {
    return; // déjà en train de jouer : on ne la relance pas
  }
  if (enCours) {
    enCours.stop();
  }
  const piste = scene.sound.add(cle, { loop: true, volume: volume });
  piste.play();
  scene.registry.set("musique", piste);
}

// Coupe la musique en cours (quand un niveau commence)
export function arreterMusique(scene) {
  const enCours = scene.registry.get("musique");
  if (enCours) {
    enCours.stop();
    scene.registry.set("musique", null);
  }
}
