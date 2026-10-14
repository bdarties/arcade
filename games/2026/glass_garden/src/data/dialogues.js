// =====================================================================================
// * DIALOGUES DES PERSONNAGES
// =====================================================================================
//
// La clé est le NOM du personnage dans Tiled (voir NPCS dans constants.js).
// - name   : le nom affiché sur le bandeau au-dessus de la boîte. Vide : pas de bandeau.
// - lines  : les phrases, une par appui sur la touche d'interaction.
// - riddle : (facultatif) une énigme à choix multiples, posée après les phrases :
//     question   le texte de la question
//     choices    les réponses proposées (4 au plus, affichées en 2 colonnes)
//     answer     la position de la bonne réponse dans choices (0 = la première)
//     wrong      ce que dit le personnage après une mauvaise réponse (le joueur peut réessayer)
//     right      ce que dit le personnage après la bonne réponse (le joueur reçoit alors l'étoile du monde)
//     solved     ce qu'il dit si le joueur revient après avoir résolu l'énigme
//
// ! Textes provisoires : à remplacer.
// =====================================================================================

export const DIALOGUES = {
  enigme: {
    name: '',
    lines: [
      'Tiens... un visiteur dans ce monde de feuilles mortes.',
      "Je garde une énigme depuis bien longtemps, et personne n'a su y répondre.",
      'Écoute bien.',
    ],
    riddle: {
      question: "Lorsque tu m'as, tu veux me partager. Lorsque tu me partages, tu ne m'as plus. Qui suis-je ?",
      choices: ['Secret', 'Argent', 'Bonheur', 'Surprise'],
      answer: 0,
      wrong: ["Ce n'est pas ça... Réfléchis encore."],
      right: ['Un secret ! Bravo, tu as trouvé.', "Prends cette étoile, tu l'as bien méritée."],
      solved: ["Tu as déjà résolu mon énigme. L'étoile est à toi."],
    },
  },
};
