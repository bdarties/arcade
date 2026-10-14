// ============================================================================
//  js/musique.js — LA MUSIQUE DU JEU (une seule piste à la fois) et les petits SONS fabriqués par le code
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

// Sons d'attaque de la Cantatrice, dans le même ordre que les notes des ondes.
const SONS_NOTES = ["attack_do", "attack_mi", "attack_sol"];

// Le son d'un ennemi (tuba, cristal) : cle = le fichier à jouer. Un délai évite que ça tourne en boucle.
const DELAI_SON_ENNEMI_MS = 1500; // au moins 1,5 s entre deux sons d'ennemi : pas de spam
let dernierSonEnnemi = 0; // l'heure du dernier son (horloge du navigateur, valable d'un écran à l'autre)

export function jouerSonEnnemi(scene, cle) {
  if (scene.cache.audio.exists(cle) == false) {
    return; // fichier absent : on joue sans ce son
  }
  const maintenant = performance.now(); // l'heure actuelle, en millisecondes
  if (maintenant - dernierSonEnnemi < DELAI_SON_ENNEMI_MS) {
    return; // trop tôt depuis le dernier son : on se tait
  }
  dernierSonEnnemi = maintenant;
  scene.sound.play(cle, { volume: 0.6 });
}

// Le son correspondant à la note de chaque onde lancée par la Cantatrice.
export function jouerSonNote(scene, indexNote) {
  const cle = SONS_NOTES[indexNote] || SONS_NOTES[0];
  if (!scene.cache.audio.exists(cle)) {
    return;
  }
  scene.sound.play(cle, { volume: 0.5 });
}
