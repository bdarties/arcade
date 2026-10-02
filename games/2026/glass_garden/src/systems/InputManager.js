// =====================================================================================
// * INPUT MANAGER : TOUTES LES TOUCHES DU JEU À UN SEUL ENDROIT
// =====================================================================================
//
// * POURQUOI CE FICHIER EXISTE
// Le reste du jeu ne doit jamais dire « est-ce que la touche Z est appuyée ? ».
// Il doit dire « est-ce que le joueur veut aller vers le haut ? ».
// Seul ce fichier fait le lien entre une ACTION (haut, bas...) et une TOUCHE (Z, S...).
//
// * POURQUOI C'EST IMPORTANT : LA BORNE D'ARCADE
// Le jeu doit tourner sur une borne d'arcade : joystick + boutons, pas de clavier.
// Si les touches sont écrites dans chaque scène, il faudra modifier tout le code.
// Avec ce fichier, brancher la borne = modifier UNIQUEMENT la table BINDINGS ci-dessous (mode « arcade »).
//
// * AUTRES AVANTAGES
// - Le joueur 2 : un deuxième InputManager avec d'autres touches, sans dupliquer de code.
// - La diagonale (diviser par racine de 2) est écrite une seule fois, ici.
//
// * UTILISÉ PAR : les scènes où le joueur agit (voir src/scenes/)
//
// * COMMENT L'UTILISER
//   import InputManager from '../systems/InputManager.js';
//
//   create() { this.input1 = new InputManager(this, 1); }
//   update() {
//     const move = this.input1.getMove();              // { x: -1..1, y: -1..1 }
//     if (this.input1.justPressed('interact')) { ... } // une seule fois par appui
//     if (this.input1.justPressed('shoot')) { ... }    // tirer
//   }
//
// TODO(équipe): ajouter les actions courir, lampe, pause
// TODO(équipe): brancher les cinq autres boutons de la borne quand les actions existeront
// =====================================================================================

import { getControlMode } from './ControlMode.js';
import { CONTROL_MODES } from '../utils/constants.js';

// * Association action -> touche (noms de touches Phaser), pour chaque mode de contrôle puis chaque joueur.
// Le mode actuel est dans ControlMode.js. Les deux jeux de touches sont toujours branchés : seule la table lue change.
// ? Arcade : le joystick est supposé envoyer les FLÈCHES (le template du prof utilise les flèches).
// À vérifier sur la borne : si c'est autre chose, ne changer que les lignes « arcade ».
// ? La touche I (interagir) est la première des six boutons. Les cinq autres (O P pour la rangée du haut,
// K L M pour celle du bas) ne servent pas encore, sauf O : le tir.
// ? Les touches du joueur 2 sont provisoires, et identiques dans les deux modes : à définir avec la borne.
// ? La touche E (interagir, mode pc) n'est PAS définitive. La touche A (tirer, mode pc) non plus.
const BINDINGS = {
  [CONTROL_MODES.ARCADE]: {
    1: { up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', interact: 'I', shoot: 'O' },
    2: { up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', interact: 'ENTER', shoot: 'SPACE' },
  },
  [CONTROL_MODES.PC]: {
    1: { up: 'Z', down: 'S', left: 'Q', right: 'D', interact: 'E', shoot: 'A' },
    2: { up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', interact: 'ENTER', shoot: 'SPACE' },
  },
};

export default class InputManager {
  /**
   * @param {Phaser.Scene} scene  La scène qui utilise cet InputManager
   * @param {number} playerId     1 ou 2 : choisit les touches dans BINDINGS
   */
  constructor(scene, playerId = 1) {
    this.playerId = playerId;

    // * addKeys crée un objet { action: touche } à partir de { action: 'NOM_DE_TOUCHE' }.
    // On le fait pour les deux modes : changer de mode en cours de partie ne demande alors rien de plus.
    this.keysByMode = {};
    Object.values(CONTROL_MODES).forEach((mode) => {
      this.keysByMode[mode] = scene.input.keyboard.addKeys(BINDINGS[mode][playerId]);
    });
  }

  // Les touches du mode actuel (relues à chaque appel, donc le changement de mode est immédiat)
  get keys() {
    return this.keysByMode[getControlMode()];
  }

  /**
   * Le nom de la touche d'une action DANS LE MODE ACTUEL (ex. 'I' en arcade, 'E' en pc).
   * Sert à écrire une aide à l'écran qui ne ment pas : le texte suit le mode au lieu de citer une touche en dur.
   * @param {string} action  Nom de l'action (ex. 'interact')
   * @returns {string}
   */
  getKeyLabel(action) {
    return BINDINGS[getControlMode()][this.playerId][action];
  }

  /**
   * Vrai uniquement à l'image où l'action vient d'être appuyée (un seul déclenchement).
   * Différent d'isDown, qui reste vrai tant que la touche est maintenue.
   * @param {string} action  Nom de l'action (ex. 'interact')
   */
  justPressed(action) {
    return Phaser.Input.Keyboard.JustDown(this.keys[action]);
  }

  /**
   * Direction souhaitée, entre -1 et 1 sur chaque axe.
   * @returns {{x: number, y: number}}
   */
  getMove() {
    let x = Number(this.keys.right.isDown) - Number(this.keys.left.isDown);
    let y = Number(this.keys.down.isDown) - Number(this.keys.up.isDown);

    // * En diagonale, on divise par racine de 2, sinon on irait plus vite qu'en ligne droite
    if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }

    return { x, y };
  }
}
