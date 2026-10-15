// Les 4 mini-jeux de Music Party. Les scènes communes (sélection, menu,
// choix des persos, résultats) lisent ces infos pour s'adapter au jeu choisi.
//   scene       : la scène du jeu         fond : image de fond du menu
//   choixPersos : false = pas d'écran de choix des persos (Music Fall : les Foxy)
//   image       : image de la carte sur l'écran de sélection
//   decor       : persos affichés sur les cotés du menu
//   croissant   : true = le plus PETIT score est le meilleur (Music Fall, en cm)


export const JEUX = [
  {
    cle: "music_fall",
    apercu: "apercu_music_fall",
    titre: "MUSIC FALL",
    slogan: "Tamponne ta note au plus près de note de musique !",
    regles:
      "Au top départ, ton perso tombe de sa feuille avec sa note.\n" +
      "Appuie sur A pour tamponner ta note sur la partition, au plus près\n" +
      "de la note de musique : 0 cm = parfait ! Si tu la dépasses : raté (60 cm).\n" +
      "3 essais : le plus petit total gagne.",
    scene: "music_fall",
    fond: "img_fond_scene",
    unite: "cm",
    croissant: true
  },
  {
    cle: "piano_time",
    apercu: "apercu_piano_time",
    titre: "PIANO TIME",
    slogan: "Joue la mélodie sur le PIANO TIME géant !",
    regles:
      "Les notes descendent vers la zone dorée de ton PIANO TIME.\n" +
      "Appuie sur A, B ou C quand une note est dans la zone :\n" +
      "chaque réussite accélère le tempo, le combo multiplie tes points.\n" +
      "3 notes ratées ou fausses notes : c'est fini !",
    scene: "piano_time",
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
