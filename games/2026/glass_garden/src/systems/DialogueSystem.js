// =====================================================================================
// * DIALOGUE SYSTEM : LA BOÎTE DE DIALOGUE DES PERSONNAGES
// =====================================================================================
//
// Un cadre en parchemin en bas de l'écran, avec le texte en grand à l'intérieur et, si le personnage a un nom,
// un bandeau au-dessus. Le texte s'écrit lettre par lettre (effet machine à écrire).
// Un personnage peut aussi poser une ÉNIGME À CHOIX MULTIPLES : le cadre s'agrandit, les réponses s'affichent en
// 2 colonnes, le joueur déplace le curseur et valide (voir « riddle » dans src/data/dialogues.js).
//
// * COMMENT L'UTILISER
//   this.dialogue = new DialogueBox(this);                                 // dans create()
//   this.dialogue.open('enigme', DIALOGUES.enigme, () => { ...récompense }) // quand le joueur parle au personnage
//   this.dialogue.update(this.input1);                                      // à chaque image, tant que isOpen est vrai
//   this.dialogue.isOpen                                                    // vrai tant que la boîte est affichée
// =====================================================================================

import { GAME_WIDTH, GAME_HEIGHT, DEPTH, FONT_FAMILY, DIALOGUE } from '../utils/constants.js';

// Les énigmes résolues, retenues pour toute la partie (une scène est recréée à chaque visite d'un monde)
const solvedRiddles = new Set();

/** L'énigme de ce personnage est-elle résolue ? */
export const isRiddleSolved = (id) => solvedRiddles.has(id);

export default class DialogueBox {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this.mode = 'say'; // 'say' : le personnage parle. 'ask' : il pose une énigme, le joueur choisit.
    this.lines = [];
    this.index = 0;
    this.then = null; // ce qui se passe après la dernière phrase
    this.typing = null; // l'événement qui écrit les lettres, tant qu'il tourne
    this.cursor = 0; // la réponse choisie

    // * Tout est rangé dans un conteneur, qu'on montre ou cache d'un coup
    this.container = scene.add.container(0, 0).setDepth(DEPTH.DIALOGUE).setVisible(false);
    this.frame = scene.add.graphics();
    this.tag = scene.add.graphics();
    this.tagText = scene.add
      .text(0, 0, '', { fontFamily: FONT_FAMILY, fontSize: '30px', fontStyle: 'bold', color: DIALOGUE.COLORS.TAG_TEXT })
      .setOrigin(0.5);
    this.text = scene.add.text(0, 0, '', {
      fontFamily: FONT_FAMILY,
      fontSize: DIALOGUE.FONT_SIZE,
      fontStyle: 'bold',
      color: DIALOGUE.COLORS.TEXT,
      wordWrap: { width: DIALOGUE.BOX.WIDTH - DIALOGUE.BOX.PADDING * 2 },
      lineSpacing: 10,
    });
    this.choiceTexts = Array.from({ length: DIALOGUE.MAX_CHOICES }, () =>
      scene.add.text(0, 0, '', { fontFamily: FONT_FAMILY, fontSize: DIALOGUE.FONT_SIZE, fontStyle: 'bold', color: DIALOGUE.COLORS.TEXT }),
    );
    // * La petite flèche qui clignote quand la phrase est finie : « appuie pour continuer »
    this.arrow = scene.add
      .text(0, 0, '▼', { fontFamily: FONT_FAMILY, fontSize: '28px', color: DIALOGUE.COLORS.TEXT })
      .setOrigin(1, 1)
      .setVisible(false);
    scene.tweens.add({ targets: this.arrow, alpha: 0.2, duration: 450, yoyo: true, repeat: -1 });

    this.container.add([this.frame, this.tag, this.tagText, this.text, ...this.choiceTexts, this.arrow]);
  }

  /**
   * Ouvre la boîte pour un personnage.
   * @param {string} id  Le nom du personnage (sert à retenir que son énigme est résolue)
   * @param {object} dialogue  { name, lines, riddle? } (voir src/data/dialogues.js)
   * @param {Function} [onSolved]  Appelée quand le joueur trouve la bonne réponse (la récompense)
   * @param {Function} [onClosed]  Appelée quand la boîte se ferme (après la dernière phrase)
   */
  open(id, dialogue, onSolved, onClosed) {
    this.id = id;
    this.dialogue = dialogue;
    this.onSolved = onSolved;
    this.onClosed = onClosed;
    this.isOpen = true;
    this.fitToScreen();
    this.container.setVisible(true);

    const { riddle } = dialogue;
    if (riddle && solvedRiddles.has(id)) {
      this.say(riddle.solved, () => this.close());
    } else {
      this.say(dialogue.lines, () => (riddle ? this.ask() : this.close()));
    }
  }

  /** À appeler à chaque image tant que la boîte est ouverte : lit les touches. */
  update(input) {
    if (this.mode === 'ask' && !this.typing) {
      // * Le curseur se déplace dans la grille des réponses (2 colonnes) avec les 4 directions
      if (input.justPressed('left')) this.moveCursor(-1);
      if (input.justPressed('right')) this.moveCursor(1);
      if (input.justPressed('up')) this.moveCursor(-2);
      if (input.justPressed('down')) this.moveCursor(2);
    }
    if (input.justPressed('interact')) this.advance();
  }

  /** Touche d'interaction : finit la phrase en cours, sinon passe à la suivante (ou valide la réponse choisie). */
  advance() {
    if (this.typing) {
      this.finishLine();
    } else if (this.mode === 'ask') {
      this.answer();
    } else if (this.index < this.lines.length - 1) {
      this.index += 1;
      this.showLine(this.lines[this.index]);
    } else {
      this.then();
    }
  }

  /** Le personnage dit ces phrases, puis on appelle then. */
  say(lines, then) {
    this.mode = 'say';
    this.lines = lines;
    this.index = 0;
    this.then = then;
    this.layout(DIALOGUE.BOX.HEIGHT);
    this.showChoices(false);
    this.showLine(lines[0]);
  }

  /** Le personnage pose l'énigme : le cadre s'agrandit, la question s'écrit, puis les réponses apparaissent. */
  ask() {
    this.mode = 'ask';
    this.cursor = 0;
    this.layout(DIALOGUE.BOX.RIDDLE_HEIGHT);
    this.showChoices(false);
    this.showLine(this.dialogue.riddle.question);
  }

  /** Le joueur valide la réponse choisie. */
  answer() {
    const { riddle } = this.dialogue;
    if (this.cursor === riddle.answer) {
      solvedRiddles.add(this.id);
      this.say(riddle.right, () => {
        this.close();
        this.onSolved?.();
      });
    } else {
      this.say(riddle.wrong, () => this.ask()); // il peut réessayer
    }
  }

  close() {
    this.isOpen = false;
    this.container.setVisible(false);
    const onClosed = this.onClosed;
    this.onClosed = null;
    onClosed?.();
  }

  /**
   * Garde la boîte à sa place sur l'ÉCRAN, même si la caméra est zoomée ou décalée (comme pendant l'intro) :
   * à l'échelle 1/zoom et au coin haut gauche de ce que voit la caméra, le zoom la remet à sa taille normale.
   * Avec une caméra normale (zoom 1, au centre), la boîte est à (0, 0) en taille normale : rien ne change.
   */
  fitToScreen() {
    const camera = this.scene.cameras.main;
    const zoom = camera.zoom;
    this.container.setScale(1 / zoom).setPosition(camera.midPoint.x - GAME_WIDTH / 2 / zoom, camera.midPoint.y - GAME_HEIGHT / 2 / zoom);
  }

  moveCursor(step) {
    const count = this.dialogue.riddle.choices.length;
    const next = this.cursor + step;
    if (next >= 0 && next < count) {
      this.cursor = next;
      this.drawChoices();
    }
  }

  // --- affichage ---

  /** Dessine le cadre à la hauteur voulue, et place tout ce qu'il contient. */
  layout(height) {
    const { WIDTH, BOTTOM_MARGIN, RADIUS, PADDING, BORDER } = DIALOGUE.BOX;
    const x = (GAME_WIDTH - WIDTH) / 2;
    const y = GAME_HEIGHT - BOTTOM_MARGIN - height;

    this.frame.clear();
    this.frame.fillStyle(DIALOGUE.COLORS.PAPER, 1).fillRoundedRect(x, y, WIDTH, height, RADIUS);
    this.frame.lineStyle(BORDER, DIALOGUE.COLORS.BORDER, 1).strokeRoundedRect(x, y, WIDTH, height, RADIUS);

    this.text.setPosition(x + PADDING, y + PADDING - 4);
    this.arrow.setPosition(x + WIDTH - PADDING, y + height - PADDING + 6);
    this.tagX = x + 90;
    this.tagY = y - 4;
    this.tagText.setPosition(this.tagX, this.tagY);

    // * Les réponses : 2 colonnes sous la question (qui tient sur 2 lignes)
    this.choicesX = x + PADDING;
    this.choicesY = y + PADDING + 105;
    this.showTag(this.dialogue.name);
  }

  showTag(name) {
    this.tag.clear();
    this.tagText.setText(name || '');
    if (!name) return;
    const width = this.tagText.width + 70;
    this.tag.fillStyle(DIALOGUE.COLORS.TAG, 1).fillRoundedRect(this.tagX - width / 2, this.tagY - 24, width, 48, 12);
    this.tag.lineStyle(3, DIALOGUE.COLORS.BORDER, 1).strokeRoundedRect(this.tagX - width / 2, this.tagY - 24, width, 48, 12);
  }

  /** Écrit une phrase lettre par lettre. */
  showLine(line) {
    this.text.setText('');
    this.arrow.setVisible(false);
    this.currentLine = line;
    let written = 0;
    this.typing = this.scene.time.addEvent({
      delay: DIALOGUE.TYPE_DELAY_MS,
      repeat: line.length - 1,
      callback: () => {
        written += 1;
        this.text.setText(line.slice(0, written));
        if (written === line.length) this.finishLine();
      },
    });
  }

  /** Affiche toute la phrase d'un coup. Pour une question, les réponses apparaissent alors. */
  finishLine() {
    this.typing?.remove();
    this.typing = null;
    this.text.setText(this.currentLine);
    if (this.mode === 'ask') this.showChoices(true);
    else this.arrow.setVisible(true);
  }

  showChoices(visible) {
    this.choiceTexts.forEach((choice) => choice.setVisible(false));
    if (visible) this.drawChoices();
  }

  drawChoices() {
    const { choices } = this.dialogue.riddle;
    const columnWidth = (DIALOGUE.BOX.WIDTH - DIALOGUE.BOX.PADDING * 2) / 2;
    this.choiceTexts.forEach((choice, i) => {
      choice.setVisible(i < choices.length);
      if (i >= choices.length) return;
      // Le curseur « ▶ » marque la réponse choisie ; les autres sont décalées d'autant
      choice.setText(`${i === this.cursor ? '▶' : '   '} ${choices[i]}`);
      choice.setPosition(this.choicesX + (i % 2) * columnWidth, this.choicesY + Math.floor(i / 2) * 52);
    });
  }
}
