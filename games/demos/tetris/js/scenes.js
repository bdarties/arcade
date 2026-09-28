// ---------------------------------------------------------------------------
// Tetris — moteur de jeu (GameScene) + HUD (UIScene) + Preload + Game Over
// Palette et look inspirés du Commodore 64 (VIC-II).
// ---------------------------------------------------------------------------

export const COLS = 10, ROWS = 20, CELL = 30;
export const BOARD_X = 305, BOARD_Y = 60;
export const BOARD_W = COLS * CELL, BOARD_H = ROWS * CELL;
export const PANEL_X = BOARD_X + BOARD_W + 50;
export const PANEL_W = 320;

export const COLORS = {
  I: 0x7fd0d6, O: 0xd8cb5e, T: 0x9a5cc4, S: 0x6fc95a,
  Z: 0xc84f42, J: 0xffffff, L: 0xe08a35
};
export const BG = 0x14102e;
export const BOX_BG = 0x2c2270;
export const GRID_LINE = 0x4a3f9e;
export const PANEL_BG = 0x35298a;
export const PANEL_LINE = 0x8677d1;
export const TEXT = '#eef0ff';
export const MUTED = '#b6ace8';
export const ACCENT = '#cdd97e';
export const ACCENT_HEX = 0xcdd97e;

export const SHAPES = {
  I: [[[0,1],[1,1],[2,1],[3,1]], [[2,0],[2,1],[2,2],[2,3]], [[0,2],[1,2],[2,2],[3,2]], [[1,0],[1,1],[1,2],[1,3]]],
  O: [[[1,0],[2,0],[1,1],[2,1]], [[1,0],[2,0],[1,1],[2,1]], [[1,0],[2,0],[1,1],[2,1]], [[1,0],[2,0],[1,1],[2,1]]],
  T: [[[1,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[2,1],[1,2]], [[1,0],[0,1],[1,1],[1,2]]],
  S: [[[1,0],[2,0],[0,1],[1,1]], [[1,0],[1,1],[2,1],[2,2]], [[1,1],[2,1],[0,2],[1,2]], [[0,0],[0,1],[1,1],[1,2]]],
  Z: [[[0,0],[1,0],[1,1],[2,1]], [[2,0],[1,1],[2,1],[1,2]], [[0,1],[1,1],[1,2],[2,2]], [[1,0],[0,1],[1,1],[0,2]]],
  J: [[[0,0],[0,1],[1,1],[2,1]], [[1,0],[2,0],[1,1],[1,2]], [[0,1],[1,1],[2,1],[2,2]], [[1,0],[1,1],[0,2],[1,2]]],
  L: [[[2,0],[0,1],[1,1],[2,1]], [[1,0],[1,1],[1,2],[2,2]], [[0,1],[1,1],[2,1],[0,2]], [[0,0],[1,0],[1,1],[1,2]]]
};
export const TYPES = Object.keys(SHAPES);
export const LINE_SCORES = [0, 100, 300, 500, 800];

export function makeBag() {
  const bag = TYPES.slice();
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export function emptyBoard() {
  const b = [];
  for (let r = 0; r < ROWS; r++) b.push(new Array(COLS).fill(null));
  return b;
}

// ---------------------------------------------------------------------------
// PreloadScene — rien de spécifique à charger pour ce jeu (tout est dessiné en
// vectoriel), donc on enchaîne directement sur la partie.
// ---------------------------------------------------------------------------
export class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene'); }
  create() { this.scene.start('GameScene'); }
}

// ---------------------------------------------------------------------------
// GameScene — le moteur Tetris (plateau, pièces, score, gravité, contrôles).
// ---------------------------------------------------------------------------
export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  create() {
    this.board = emptyBoard();
    this.score = 0; this.level = 1; this.lines = 0;
    this.bag = makeBag();
    this.nextType = this.bag.shift();
    this.holdType = null;
    this.canHold = true;
    this.state = 'playing'; // playing | paused | clearing | gameover
    this.dropAcc = 0;
    this.softDropHeld = false;
    this.repeat = { left: { held: false, acc: 0 }, right: { held: false, acc: 0 } };

    // fond
    const bg = this.add.graphics();
    bg.fillStyle(BG, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);
    bg.fillStyle(BOX_BG, 1);
    bg.fillRoundedRect(BOARD_X - 4, BOARD_Y - 4, BOARD_W + 8, BOARD_H + 8, 8);
    bg.lineStyle(1, GRID_LINE, 1);
    for (let c = 0; c <= COLS; c++) bg.lineBetween(BOARD_X + c * CELL, BOARD_Y, BOARD_X + c * CELL, BOARD_Y + BOARD_H);
    for (let r = 0; r <= ROWS; r++) bg.lineBetween(BOARD_X, BOARD_Y + r * CELL, BOARD_X + BOARD_W, BOARD_Y + r * CELL);

    // titre + rappel des contrôles
    this.add.text(BOARD_X + BOARD_W / 2, 28, 'TETRIS', {
      fontFamily: 'Georgia, "Courier New", monospace', fontSize: '26px', color: TEXT, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H + 22,
      '← → déplacer   ↓ chute lente   ↑ rotation   I chute rapide   O réserve   P pause', {
        fontFamily: '"Courier New", monospace', fontSize: '12px', color: MUTED
      }).setOrigin(0.5);

    // graphismes du plateau (redessinés à chaque changement d'état)
    this.boardGfx = this.add.graphics();
    this.ghostGfx = this.add.graphics();
    this.pieceGfx = this.add.graphics();
    this.flashGfx = this.add.graphics();

    // calque de pause / game over
    this.overlayBg = this.add.rectangle(BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H / 2, BOARD_W, BOARD_H, 0x14102e, 0.85).setVisible(false);
    this.overlayTitle = this.add.text(BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H / 2 - 20, '', {
      fontFamily: 'Georgia, "Courier New", monospace', fontSize: '28px', color: ACCENT, fontStyle: 'bold', align: 'center'
    }).setOrigin(0.5).setVisible(false);
    this.overlaySub = this.add.text(BOARD_X + BOARD_W / 2, BOARD_Y + BOARD_H / 2 + 24, '', {
      fontFamily: '"Courier New", monospace', fontSize: '14px', color: TEXT, align: 'center'
    }).setOrigin(0.5).setVisible(false);

    // entrées clavier
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-UP', () => this.doRotate(1));
    this.input.keyboard.on('keydown-Z', () => this.doRotate(-1));
    this.input.keyboard.on('keydown-I', () => this.hardDrop());
    this.input.keyboard.on('keydown-O', () => this.holdPiece());
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-LEFT', () => this.tryMove(-1, 0));
    this.input.keyboard.on('keydown-RIGHT', () => this.tryMove(1, 0));
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.state === 'playing' || this.state === 'paused') {
        this.scene.stop('UIScene');
        this.scene.start('MenuScene');
      }
    });

    // HUD en parallèle. On communique via le bus d'évènements global du jeu
    // (this.game.events) plutôt qu'une référence directe à la scène UIScene :
    // au redémarrage (REJOUER), UIScene est relancée et reconstruit ses textes
    // un tick plus tard, donc une référence directe pointerait un instant vers
    // des objets déjà détruits.
    this.scene.launch('UIScene');

    this.spawnPiece();
    this.redraw();
  }

  // Etat exposé pour que UIScene puisse se synchroniser, même si elle démarre
  // avant ou après ce create().
  getHUD() {
    return { score: this.score, level: this.level, lines: this.lines, nextType: this.nextType, holdType: this.holdType };
  }
  pushHUD() { this.game.events.emit('tetris-hud', this.getHUD()); }

  dropInterval() {
    // Courbe officielle du Tetris Guideline : secondes/ligne = (0.8 - (niveau-1)*0.007)^(niveau-1)
    const level = this.level;
    if (level <= 1) return 1000;
    const base = 0.8 - (level - 1) * 0.007;
    const seconds = Math.pow(base, level - 1);
    return Math.max(seconds * 1000, 17);
  }

  cells(type, rot, ox, oy) {
    return SHAPES[type][rot].map(([x, y]) => [x + ox, y + oy]);
  }

  valid(type, rot, ox, oy) {
    const pts = this.cells(type, rot, ox, oy);
    for (const [x, y] of pts) {
      if (x < 0 || x >= COLS || y >= ROWS) return false;
      if (y >= 0 && this.board[y][x]) return false;
    }
    return true;
  }

  spawnPiece() {
    const type = this.nextType;
    if (this.bag.length === 0) this.bag = makeBag();
    this.nextType = this.bag.shift();
    this.cur = { type, rot: 0, x: 3, y: -1 };
    if (!this.valid(type, 0, this.cur.x, this.cur.y)) {
      this.gameOver();
      return;
    }
    this.canHold = true;
    this.pushHUD();
  }

  tryMove(dx, dy) {
    if (this.state !== 'playing' || !this.cur) return false;
    const { type, rot, x, y } = this.cur;
    if (this.valid(type, rot, x + dx, y + dy)) {
      this.cur.x += dx; this.cur.y += dy;
      this.redraw();
      return true;
    }
    return false;
  }

  doRotate(dir) {
    if (this.state !== 'playing' || !this.cur) return;
    const { type, rot, x, y } = this.cur;
    const newRot = (rot + dir + 4) % 4;
    const kicks = [0, -1, 1, -2, 2];
    for (const k of kicks) {
      if (this.valid(type, newRot, x + k, y)) {
        this.cur.rot = newRot; this.cur.x = x + k;
        this.redraw();
        return;
      }
    }
  }

  holdPiece() {
    if (this.state !== 'playing' || !this.cur || !this.canHold) return;
    const curType = this.cur.type;
    if (this.holdType === null) {
      this.holdType = curType;
      this.spawnPiece();
    } else {
      const swap = this.holdType;
      this.holdType = curType;
      this.cur = { type: swap, rot: 0, x: 3, y: -1 };
    }
    this.canHold = false;
    this.pushHUD();
    this.redraw();
  }

  hardDrop() {
    if (this.state !== 'playing' || !this.cur) return;
    let dist = 0;
    while (this.valid(this.cur.type, this.cur.rot, this.cur.x, this.cur.y + 1)) { this.cur.y++; dist++; }
    this.score += dist * 2;
    this.lockPiece();
  }

  stepDown(scored) {
    if (!this.cur) return;
    if (this.valid(this.cur.type, this.cur.rot, this.cur.x, this.cur.y + 1)) {
      this.cur.y++;
      if (scored) this.score++;
      this.redraw();
    } else {
      this.lockPiece();
    }
  }

  lockPiece() {
    const { type, rot, x, y } = this.cur;
    const pts = this.cells(type, rot, x, y);
    for (const [px, py] of pts) {
      if (py < 0) { this.gameOver(); return; }
      this.board[py][px] = type;
    }
    this.cur = null;
    const fullRows = [];
    for (let r = 0; r < ROWS; r++) if (this.board[r].every(c => c)) fullRows.push(r);

    if (fullRows.length > 0) {
      this.state = 'clearing';
      this.redraw();
      this.flashRows(fullRows);
      this.time.delayedCall(180, () => {
        for (const r of fullRows) { this.board.splice(r, 1); this.board.unshift(new Array(COLS).fill(null)); }
        this.lines += fullRows.length;
        this.score += (LINE_SCORES[fullRows.length] || 0) * this.level;
        this.level = Math.floor(this.lines / 10) + 1;
        this.flashGfx.clear();
        this.state = 'playing';
        this.spawnPiece();
        this.pushHUD();
        this.redraw();
      });
    } else {
      this.pushHUD();
      this.spawnPiece();
      this.redraw();
    }
  }

  flashRows(rows) {
    this.flashGfx.clear();
    this.flashGfx.fillStyle(ACCENT_HEX, 0.9);
    for (const r of rows) this.flashGfx.fillRect(BOARD_X, BOARD_Y + r * CELL, BOARD_W, CELL);
  }

  togglePause() {
    if (this.state === 'playing') { this.state = 'paused'; this.showOverlay('PAUSE', 'Appuie sur P pour reprendre'); }
    else if (this.state === 'paused') { this.state = 'playing'; this.hideOverlay(); }
  }

  gameOver() {
    this.state = 'gameover';
    this.scene.stop('UIScene');
    this.scene.start('GameOverScene', { score: this.score, level: this.level, lines: this.lines });
  }

  showOverlay(title, sub) {
    this.overlayBg.setVisible(true);
    this.overlayTitle.setText(title).setVisible(true);
    this.overlaySub.setText(sub).setVisible(true);
  }
  hideOverlay() {
    this.overlayBg.setVisible(false);
    this.overlayTitle.setVisible(false);
    this.overlaySub.setVisible(false);
  }

  drawCell(gfx, px, py, color, alpha) {
    gfx.fillStyle(color, alpha === undefined ? 1 : alpha);
    gfx.fillRoundedRect(px + 1.5, py + 1.5, CELL - 3, CELL - 3, 4);
  }

  redraw() {
    this.boardGfx.clear();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = this.board[r][c];
        if (t) this.drawCell(this.boardGfx, BOARD_X + c * CELL, BOARD_Y + r * CELL, COLORS[t]);
      }
    }
    this.ghostGfx.clear();
    this.pieceGfx.clear();
    if (this.cur && (this.state === 'playing' || this.state === 'paused')) {
      const { type, rot, x, y } = this.cur;
      let gy = y;
      while (this.valid(type, rot, x, gy + 1)) gy++;
      for (const [px, py] of this.cells(type, rot, x, gy)) {
        if (py >= 0) this.drawCell(this.ghostGfx, BOARD_X + px * CELL, BOARD_Y + py * CELL, COLORS[type], 0.25);
      }
      for (const [px, py] of this.cells(type, rot, x, y)) {
        if (py >= 0) this.drawCell(this.pieceGfx, BOARD_X + px * CELL, BOARD_Y + py * CELL, COLORS[type]);
      }
    }
  }

  update(time, delta) {
    if (this.state !== 'playing') return;

    const stepRepeat = (key, dir) => {
      const st = this.repeat[dir > 0 ? 'right' : 'left'];
      if (key.isDown) {
        if (!st.held) { st.held = true; st.acc = 0; }
        else {
          st.acc += delta;
          const delay = 170, rate = 45;
          if (st.acc > delay) {
            const over = st.acc - delay;
            if (over > rate) { this.tryMove(dir, 0); st.acc = delay; }
          }
        }
      } else { st.held = false; st.acc = 0; }
    };
    stepRepeat(this.cursors.left, -1);
    stepRepeat(this.cursors.right, 1);

    const softHeld = this.cursors.down.isDown || this.softDropHeld;
    const interval = softHeld ? Math.min(35, this.dropInterval()) : this.dropInterval();
    this.dropAcc += delta;
    if (this.dropAcc >= interval) { this.dropAcc = 0; this.stepDown(softHeld); }
  }
}

// ---------------------------------------------------------------------------
// UIScene — HUD (score, niveau, lignes, next/hold). Tourne en parallèle de
// GameScene et se synchronise avec elle via sync()/getHUD().
// ---------------------------------------------------------------------------
export class UIScene extends Phaser.Scene {
  constructor() { super('UIScene'); }

  create() {
    const bg = this.add.graphics();
    bg.fillStyle(PANEL_BG, 0.9);
    bg.lineStyle(1, PANEL_LINE, 1);
    bg.fillRoundedRect(PANEL_X - 8, BOARD_Y - 4, PANEL_W + 8, BOARD_H + 8, 10);
    bg.strokeRoundedRect(PANEL_X - 8, BOARD_Y - 4, PANEL_W + 8, BOARD_H + 8, 10);

    const labelStyle = { fontFamily: '"Courier New", monospace', fontSize: '13px', color: MUTED, fontStyle: 'bold' };
    const valueStyle = { fontFamily: '"Courier New", monospace', fontSize: '26px', color: TEXT, fontStyle: 'bold' };

    let py = BOARD_Y + 14;
    this.add.text(PANEL_X, py, 'SUIVANT', labelStyle); py += 24;
    this.nextBoxY = py;
    this.nextGfx = this.add.graphics();
    py += 100;

    this.add.text(PANEL_X, py, 'RÉSERVE (O)', labelStyle); py += 24;
    this.holdBoxY = py;
    this.holdGfx = this.add.graphics();
    py += 100;

    this.add.text(PANEL_X, py, 'SCORE', labelStyle); py += 20;
    this.scoreText = this.add.text(PANEL_X, py, '0', valueStyle); py += 44;

    this.add.text(PANEL_X, py, 'NIVEAU', labelStyle); py += 20;
    this.levelText = this.add.text(PANEL_X, py, '1', valueStyle); py += 44;

    this.add.text(PANEL_X, py, 'LIGNES', labelStyle); py += 20;
    this.linesText = this.add.text(PANEL_X, py, '0', valueStyle);

    this.drawMiniPiece(this.nextGfx, this.nextBoxY, null);
    this.drawMiniPiece(this.holdGfx, this.holdBoxY, null);

    // Ecoute le bus d'évènements global du jeu plutôt qu'une référence directe
    // à GameScene : ça reste valide même après un redémarrage (REJOUER), où
    // cette scène est détruite puis reconstruite un tick après GameScene.
    const onHud = (hud) => this.sync(hud);
    this.game.events.on('tetris-hud', onHud);
    this.events.once('shutdown', () => this.game.events.off('tetris-hud', onHud));

    // rattrape l'état si GameScene a déjà démarré avant nous
    const gs = this.scene.get('GameScene');
    if (gs && gs.getHUD) this.sync(gs.getHUD());
  }

  drawMiniPiece(gfx, boxY, type) {
    gfx.clear();
    const bx = PANEL_X, bw = PANEL_W;
    gfx.fillStyle(BOX_BG, 1);
    gfx.lineStyle(1, PANEL_LINE, 1);
    gfx.fillRoundedRect(bx, boxY, bw, 92, 8);
    gfx.strokeRoundedRect(bx, boxY, bw, 92, 8);
    if (!type) return;
    const shape = SHAPES[type][0];
    const minX = Math.min(...shape.map(p => p[0])), maxX = Math.max(...shape.map(p => p[0]));
    const minY = Math.min(...shape.map(p => p[1])), maxY = Math.max(...shape.map(p => p[1]));
    const w = maxX - minX + 1, h = maxY - minY + 1;
    const size = 20;
    const offX = bx + (bw - w * size) / 2 - minX * size;
    const offY = boxY + (92 - h * size) / 2 - minY * size;
    for (const [x, y] of shape) {
      gfx.fillStyle(COLORS[type], 1);
      gfx.fillRoundedRect(offX + x * size + 1, offY + y * size + 1, size - 2, size - 2, 3);
    }
  }

  sync(hud) {
    this.scoreText.setText(String(hud.score));
    this.levelText.setText(String(hud.level));
    this.linesText.setText(String(hud.lines));
    this.drawMiniPiece(this.nextGfx, this.nextBoxY, hud.nextType);
    this.drawMiniPiece(this.holdGfx, this.holdBoxY, hud.holdType);
  }
}

// ---------------------------------------------------------------------------
// GameOverScene
// ---------------------------------------------------------------------------
export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.finalScore = (data && data.score) || 0;
    this.finalLevel = (data && data.level) || 1;
    this.finalLines = (data && data.lines) || 0;
  }

  create() {
    const { width, height } = this.cameras.main;
    this.add.rectangle(0, 0, width, height, BG, 1).setOrigin(0, 0);

    this.add.text(width / 2, height / 2 - 130, 'GAME OVER', {
      fontFamily: 'Georgia, "Courier New", monospace', fontSize: '48px', color: ACCENT, fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 50,
      `SCORE  ${this.finalScore}\nNIVEAU  ${this.finalLevel}\nLIGNES  ${this.finalLines}`, {
        fontFamily: '"Courier New", monospace', fontSize: '20px', color: TEXT, align: 'center', lineSpacing: 10
      }).setOrigin(0.5);

    this.buildButton(width / 2, height / 2 + 70, 'REJOUER', () => this.scene.start('GameScene'));
    this.buildButton(width / 2, height / 2 + 130, 'MENU', () => this.scene.start('MenuScene'));

    this.input.keyboard.once('keydown-X', () => this.scene.start('GameScene'));
    this.input.keyboard.once('keydown-I', () => this.scene.start('GameScene'));
    this.input.keyboard.once('keydown-ESC', () => this.scene.start('MenuScene'));
  }

  buildButton(x, y, label, onClick) {
    const txt = this.add.text(x, y, label, {
      fontFamily: '"Courier New", monospace', fontSize: '22px', color: TEXT, fontStyle: 'bold',
      backgroundColor: '#35298a', padding: { x: 24, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    txt.on('pointerover', () => txt.setStyle({ backgroundColor: '#cdd97e', color: '#14102e' }));
    txt.on('pointerout', () => txt.setStyle({ backgroundColor: '#35298a', color: TEXT }));
    txt.on('pointerdown', onClick);
    return txt;
  }
}
