// =====================================================================================
// * TIMER SYSTEM : LE CHRONOMÈTRE GLOBAL DU JEU
// =====================================================================================
//
// * POURQUOI CE FICHIER EXISTE
// Le temps total de la partie est le score : plus il est court, mieux c'est.
// Il ne doit JAMAIS être remis à zéro par un changement de monde ou une mort du joueur.
//
// * POURQUOI IL N'EST PAS DANS UNE SCÈNE
// Une scène est détruite et recréée à chaque téléportation : elle perdrait le temps.
// Ici, le temps vit dans un module : il existe une seule fois pour tout le jeu.
//
// * COMMENT ÇA MARCHE
// On ne « compte » pas les secondes : on mémorise l'heure de départ, et on calcule
// le temps écoulé quand on le demande (heure actuelle - heure de départ).
// C'est donc exact, quelle que soit la fréquence d'images ou la scène en cours.
//
// * COMMENT L'UTILISER
//   import timer from '../systems/TimerSystem.js';
//
//   timer.start();            // démarre (ou reprend après un stop)
//   timer.elapsed();          // temps écoulé, en millisecondes
//   timer.stop();             // fige le temps (fin de partie, pause)
//   timer.reset();            // remet à zéro (nouvelle partie)
//
// * À LA FIN DE LA PARTIE : appeler timer.stop() puis lire timer.elapsed()
// TODO(équipe): sauvegarder le meilleur temps (SaveSystem)
// TODO(équipe): démarrer le chrono au début de la session (après la saisie du pseudo),
// et non plus depuis WorldScene
// =====================================================================================

class TimerSystem {
  constructor() {
    this.reset();
  }

  /** Remet le chronomètre à zéro, à l'arrêt. À appeler pour une nouvelle partie. */
  reset() {
    this.running = false;
    this.startTime = 0; // heure du dernier démarrage, en millisecondes
    this.accumulated = 0; // temps déjà écoulé avant le dernier démarrage, en millisecondes
  }

  /** Démarre le chronomètre. S'il était arrêté, il reprend là où il s'était arrêté. */
  start() {
    if (this.running) return;

    this.startTime = performance.now();
    this.running = true;
  }

  /** Fige le chronomètre : le temps écoulé ne bouge plus jusqu'au prochain start(). */
  stop() {
    if (!this.running) return;

    this.accumulated += performance.now() - this.startTime;
    this.running = false;
  }

  /**
   * Temps écoulé depuis le début de la partie.
   * @returns {number} millisecondes
   */
  elapsed() {
    if (!this.running) return this.accumulated;

    return this.accumulated + (performance.now() - this.startTime);
  }
}

// * On exporte une seule instance : tout le jeu partage le même chronomètre
export default new TimerSystem();
