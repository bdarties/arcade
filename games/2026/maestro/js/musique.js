// Musique (une seule piste à la fois) et sons des ennemis et des notes.

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
const DELAI_SON_ENNEMI_MS = 1500; // au moins 1,5 s entre deux fois le même son d'ennemi : pas de spam
const dernierSon = {}; // l'heure du dernier son, pour chaque fichier (le tuba n'est pas bloqué par le cristal)

// Joue le son d'un ennemi (tuba, cristal). cle = le fichier à jouer.
export function jouerSonEnnemi(scene, cle) {
  if (scene.cache.audio.exists(cle) == false) {
    return; // fichier absent : on joue sans ce son
  }
  const maintenant = performance.now(); // l'heure actuelle, en millisecondes
  if (maintenant - (dernierSon[cle] || 0) < DELAI_SON_ENNEMI_MS) {
    return; // ce son vient de jouer : on attend
  }
  dernierSon[cle] = maintenant;
  scene.sound.play(cle, { volume: cle == "son_tuba" ? 0.8 : 0.6 }); // le tuba est un peu plus fort
}

// Une note courte (Do, Mi ou Sol) : quand la Cantatrice lance une onde
export function jouerSonNote(scene, indexNote) {
  const cle = SONS_NOTES[indexNote] || SONS_NOTES[0];
  if (!scene.cache.audio.exists(cle)) {
    return;
  }
  scene.sound.play(cle, { volume: 0.5 });
}
