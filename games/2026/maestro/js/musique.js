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

// ---- Petits sons fabriqués par le code (pas de fichier audio) ----
const VOLUME_NOTE = 0.05; // note jouée par la Cantatrice (plus doux encore)
const FREQUENCES_NOTES = [523.25, 659.25, 783.99]; // Do, Mi, Sol (mêmes notes que les ondes)

// Le contexte audio de Phaser (ou null si le navigateur n'a pas d'audio : on ne fait rien)
function contexteAudio(scene) {
  const ctx = scene.sound && scene.sound.context ? scene.sound.context : null;
  if (ctx && ctx.state == "suspended") {
    ctx.resume(); // certains navigateurs bloquent le son jusqu'au premier clic
  }
  return ctx;
}

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

// Une note courte (Do, Mi ou Sol) : quand la Cantatrice lance une onde
export function jouerSonNote(scene, indexNote) {
  const ctx = contexteAudio(scene);
  if (ctx == null) {
    return;
  }
  const t = ctx.currentTime;
  const son = ctx.createOscillator();
  const volume = ctx.createGain();
  son.type = "triangle"; // son doux, moins strident qu'une onde carrée
  son.frequency.value = FREQUENCES_NOTES[indexNote] || FREQUENCES_NOTES[0];

  volume.gain.setValueAtTime(0, t);
  volume.gain.linearRampToValueAtTime(VOLUME_NOTE, t + 0.005);
  volume.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  son.connect(volume).connect(ctx.destination);

  son.start(t);
  son.stop(t + 0.27);
}
