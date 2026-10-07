// ---------------------------------------------------------------------------
// MenuScene, StoryScene, CreditsScene — habillage autour du jeu.
// ---------------------------------------------------------------------------
import { BG, PANEL_BG, PANEL_LINE, TEXT, MUTED, ACCENT } from './scenes.js';

const GAME_INFO = { title: 'TETRIS', description: 'Le vrai Tetris', genre: 'Arcade', authors: ['MAURIN Nicolas'] };

function buildMenuItem(scene, x, y, label, onSelect) {
  const txt = scene.add.text(x, y, label, {
    fontFamily: '"Courier New", monospace', fontSize: '24px', color: TEXT, fontStyle: 'bold',
    backgroundColor: '#00000000', padding: { x: 20, y: 8 }
  }).setOrigin(0.5).setInteractive({ useHandCursor: true });

  const select = () => txt.setStyle({ backgroundColor: ACCENT, color: '#14102e' });
  const deselect = () => txt.setStyle({ backgroundColor: '#00000000', color: TEXT });

  txt.on('pointerover', select);
  txt.on('pointerout', deselect);
  txt.on('pointerdown', onSelect);
  txt.select = select;
  txt.deselect = deselect;
  txt.onSelect = onSelect;
  return txt;
}

export class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    const { width, height } = this.cameras.main;
    this.add.rectangle(0, 0, width, height, BG, 1).setOrigin(0, 0);

    if (this.textures.exists('title')) {
      this.add.image(width / 2, height / 2 - 180, 'title').setOrigin(0.5).setScale(1.4);
    } else {
      this.add.text(width / 2, height / 2 - 180, 'TETRIS', {
        fontFamily: 'Georgia, "Courier New", monospace', fontSize: '54px', color: ACCENT, fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    const items = [
      buildMenuItem(this, width / 2, height / 2, 'JOUER', () => this.scene.start('PreloadScene')),
      buildMenuItem(this, width / 2, height / 2 + 60, 'COMMENT JOUER', () => this.scene.start('StoryScene')),
      buildMenuItem(this, width / 2, height / 2 + 120, 'CRÉDITS', () => this.scene.start('CreditsScene'))
    ];

    let index = 0;
    const highlight = (i) => { items.forEach((it, k) => k === i ? it.select() : it.deselect()); };
    highlight(index);

    this.input.keyboard.on('keydown-DOWN', () => { index = (index + 1) % items.length; highlight(index); });
    this.input.keyboard.on('keydown-UP', () => { index = (index - 1 + items.length) % items.length; highlight(index); });
    this.input.keyboard.on('keydown-X', () => items[index].onSelect());
    // I lance directement la partie, comme un bouton "start" d'arcade.
    // Affiché « A » : sur la borne, le bouton physique A est câblé sur la touche I
    // (voir gpio2keys.py). Les libellés nomment le bouton, le code écoute la touche.
    this.input.keyboard.on('keydown-I', () => this.scene.start('PreloadScene'));

    this.add.text(width / 2, height - 40, '↑ ↓ choisir · X valider · A jouer directement', {
      fontFamily: '"Courier New", monospace', fontSize: '13px', color: MUTED
    }).setOrigin(0.5);
  }
}

export class StoryScene extends Phaser.Scene {
  constructor() { super('StoryScene'); }

  create() {
    const { width, height } = this.cameras.main;
    this.add.rectangle(0, 0, width, height, BG, 1).setOrigin(0, 0);

    const panelW = 760, panelH = 420;
    const px = (width - panelW) / 2, py = (height - panelH) / 2;
    const g = this.add.graphics();
    g.fillStyle(PANEL_BG, 0.95);
    g.lineStyle(2, PANEL_LINE, 1);
    g.fillRoundedRect(px, py, panelW, panelH, 10);
    g.strokeRoundedRect(px, py, panelW, panelH, 10);

    this.add.text(width / 2, py + 36, 'COMMENT JOUER', {
      fontFamily: 'Georgia, "Courier New", monospace', fontSize: '26px', color: ACCENT, fontStyle: 'bold'
    }).setOrigin(0.5);

    const lines = [
      'Des pièces de 4 blocs tombent depuis le haut du plateau.',
      'Déplace-les et fais-les tourner pour compléter des lignes.',
      'Une ligne complète disparaît et rapporte des points.',
      'Le jeu accélère à chaque niveau — tiens le plus longtemps possible.',
      '',
      '← →   déplacer la pièce',
      '↓     chute lente (accélère la descente)',
      '↑     rotation',
      'A     chute immédiate',
      'B     mettre la pièce de côté (une fois par pièce)',
      'C     pause    Échap   quitter vers le menu'
    ];
    this.add.text(width / 2, py + 80, lines.join('\n'), {
      fontFamily: '"Courier New", monospace', fontSize: '15px', color: TEXT, align: 'center', lineSpacing: 6
    }).setOrigin(0.5, 0);

    this.add.text(width / 2, py + panelH - 30, 'X ou clic pour revenir au menu', {
      fontFamily: '"Courier New", monospace', fontSize: '13px', color: MUTED
    }).setOrigin(0.5);

    const back = () => this.scene.start('MenuScene');
    this.input.keyboard.once('keydown-X', back);
    this.input.keyboard.once('keydown-ESC', back);
    this.input.once('pointerdown', back);
  }
}

export class CreditsScene extends Phaser.Scene {
  constructor() { super('CreditsScene'); }

  create() {
    const { width, height } = this.cameras.main;
    this.add.rectangle(0, 0, width, height, BG, 1).setOrigin(0, 0);

    const panelW = 640, panelH = 320;
    const px = (width - panelW) / 2, py = (height - panelH) / 2;
    const g = this.add.graphics();
    g.fillStyle(PANEL_BG, 0.95);
    g.lineStyle(2, PANEL_LINE, 1);
    g.fillRoundedRect(px, py, panelW, panelH, 10);
    g.strokeRoundedRect(px, py, panelW, panelH, 10);

    this.add.text(width / 2, py + 40, GAME_INFO.title, {
      fontFamily: 'Georgia, "Courier New", monospace', fontSize: '30px', color: ACCENT, fontStyle: 'bold'
    }).setOrigin(0.5);

    const lines = [
      GAME_INFO.description,
      `Genre : ${GAME_INFO.genre}`,
      `Auteur : ${GAME_INFO.authors.join(', ')}`,
      '',
      'Construit avec Phaser 3'
    ];
    this.add.text(width / 2, py + 110, lines.join('\n'), {
      fontFamily: '"Courier New", monospace', fontSize: '17px', color: TEXT, align: 'center', lineSpacing: 10
    }).setOrigin(0.5, 0);

    this.add.text(width / 2, py + panelH - 30, 'X ou clic pour revenir au menu', {
      fontFamily: '"Courier New", monospace', fontSize: '13px', color: MUTED
    }).setOrigin(0.5);

    const back = () => this.scene.start('MenuScene');
    this.input.keyboard.once('keydown-X', back);
    this.input.keyboard.once('keydown-ESC', back);
    this.input.once('pointerdown', back);
  }
}
