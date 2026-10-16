// Les 3 mini-jeux de Music Party. Les scènes communes (sélection, menu,
// choix des persos, résultats) lisent ces infos pour s'adapter au jeu choisi.
//   scene       : la scène du jeu         fond : image de fond du menu
//   niveaux     : true = le menu propose les niveaux 1, 2 et 3 (Piano Time)
//   apercu      : vignette du jeu sur l'écran de sélection
//   slogan      : une phrase courte (sous la vignette, et en haut du menu)
//   regles      : 3 lignes, affichées dans le menu et dans le panneau avant le jeu
//   croissant   : true = le plus PETIT score est le meilleur (Music Fall, en cm)

export const JEUX = [
  {
    cle: "music_fall",
    apercu: "apercu_music_fall",
    titre: "MUSIC FALL",
    slogan: "Tamponne ta note sur la cible.",
    regles:
      "Appuie sur A pour tamponner ta note sur sa cible.\n" +
      "0 cm = parfait. Pas de tampon avant le sol : raté (10 cm).\n" +
      "Trois essais. Le plus petit total gagne.",
    scene: "music_fall",
    fond: "img_fond_scene",
    unite: "cm",
    croissant: true
  },
  {
    cle: "piano_time",
    apercu: "apercu_piano_time",
    titre: "PIANO TIME",
    slogan: "Appuie quand la note arrive.",
    regles:
      "Appuie sur la touche de la note dans la zone dorée.\n" +
      "Les réussites d'affilée multiplient tes points.\n" +
      "5 erreurs d'affilée ou 1 min 30 : terminé.",
    scene: "piano_time",
    niveaux: true,
    fond: "img_fond_scene",
    unite: "pts",
    croissant: false
  },
  {
    cle: "memory_song",
    apercu: "apercu_memory_song",
    titre: "MEMORY SONG",
    slogan: "Rejoue la même mélodie.",
    regles:
      "Regarde et écoute la suite de notes.\n" +
      "Rejoue-la avec A, B, C, D, E et F.\n" +
      "Trois chances. Une erreur ou trop de temps en enlève une.",
    scene: "memoire",
    fond: "img_fond_opera",
    unite: "pts",
    croissant: false
  }
];

// les infos d'un mini-jeu à partir de sa clé ("piano_time"...)
export function infosJeu(cle) {
  return JEUX.find((jeu) => jeu.cle == cle);
}
