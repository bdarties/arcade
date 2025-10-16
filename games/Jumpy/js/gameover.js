import { get_tab_score, ajoute_score } from "/static/js/score.js";

export default class GameOver extends Phaser.Scene {
  constructor() {
    super({ key: "gameover" });
    this.highscores = [];
  }

  init(data) {
    this.score = data.score || 0;
  }

  preload() {
    this.load.image("fond_gameover", "./assets/fond_grotte_1.jpg");
  }

  async create() {
    // --- Fond ---
    this.add.image(640, 360, "fond_gameover");

    // --- Titres ---
    this.add
      .text(640, 50, "GAME OVER", { font: "64px Arial", fill: "#ff0000" })
      .setOrigin(0.5);
    this.scoreText = this.add
      .text(250, 150, `SCORE: ${this.score}`, {
        font: "36px Arial",
        fill: "#ffff00",
      })
      .setOrigin(0.5);

    // --- Instructions / messages ---
    this.instructionText = this.add
      .text(250, 220, "", {
        font: "24px Arial",
        fill: "#fff",
        wordWrap: { width: 400 },
      })
      .setOrigin(0.5);

    // --- Lettres à saisir ---
    this.name = ["A", "A", "A"];
    this.currentLetter = 0;
    this.alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    this.letterTexts = [];
    const startX = 80;
    for (let i = 0; i < 3; i++) {
      const t = this.add
        .text(startX + i * 50, 280, this.name[i], {
          font: "48px Arial",
          fill: "#fff",
        })
        .setOrigin(0.5);
      t.setVisible(false);
      this.letterTexts.push(t);
    }

    // --- Clavier ---
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyValidation = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.I
    );
    this.keyContinue = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.L
    );

    // --- Groupe tableau scores ---
    this.scoreListGroup = this.add.group();
    this.tableBackground = this.add
      .rectangle(960, 360, 350, 500, 0x000000, 0.5)
      .setOrigin(0.5);

    // --- Flags ---
    this.isNewHighScore = false;
    this.saved = false;
    this.canExit = false;

    // --- Charger top10 et décider si nouveau score ---
    await this.loadHighScoresAndDecide();
  }

  async loadHighScoresAndDecide() {
    try {
      const tab = await get_tab_score(this.game.config.idGame);
      this.highscores = Array.isArray(tab) ? tab : [];

      // Score dans le top 10 ?
      if (this.highscores.length < 10) this.isNewHighScore = true;
      else {
        const last = this.highscores[this.highscores.length - 1];
        this.isNewHighScore = this.score > (last ? last.score : -Infinity);
      }

      if (this.isNewHighScore) {
        this.instructionText.setText(
          "Nouveau score ! Entre ton nom (3 lettres). Valide avec I."
        );
        this.showNameInput(true);
      } else {
        this.instructionText.setText(
          "Pas de nouveau record. Voici le tableau des scores :"
        );
        this.showNameInput(false);
        this.displayHighScores();
        this.canExit = true;
        this.add
          .text(960, 650, "Appuie sur E pour continuer", {
            font: "20px Arial",
            fill: "#fff",
          })
          .setOrigin(0.5);
      }
    } catch (err) {
      console.error("Erreur récupération scores :", err);
      this.isNewHighScore = false;
      this.showNameInput(false);
    }
  }

  showNameInput(show) {
    for (let i = 0; i < this.letterTexts.length; i++) {
      const t = this.letterTexts[i];
      t.setVisible(show);
      t.setColor(
        show ? (i === this.currentLetter ? "#ff0000" : "#ffffff") : "#666666"
      );
    }
  }

  update() {
    // --- Navigation lettres si nouveau score ---
    if (this.isNewHighScore && !this.saved) {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.changeLetter(1);
      if (Phaser.Input.Keyboard.JustDown(this.cursors.down))
        this.changeLetter(-1);
      if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
        this.currentLetter = Math.min(
          this.currentLetter + 1,
          this.name.length - 1
        );
        this.updateLettersDisplay();
      }
      if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
        this.currentLetter = Math.max(this.currentLetter - 1, 0);
        this.updateLettersDisplay();
      }
      if (Phaser.Input.Keyboard.JustDown(this.keyValidation)) this.saveScore();
    }

    // --- Continuer ---
    if (this.canExit && Phaser.Input.Keyboard.JustDown(this.keyContinue)) {
      this.scene.start("scenario");
    }
  }

  changeLetter(delta) {
    let index = this.alphabet.indexOf(this.name[this.currentLetter]);
    index = (index + delta + this.alphabet.length) % this.alphabet.length;
    this.name[this.currentLetter] = this.alphabet[index];
    this.updateLettersDisplay();
  }

  updateLettersDisplay() {
    for (let i = 0; i < this.name.length; i++) {
      const t = this.letterTexts[i];
      t.setText(this.name[i]);
      if (i === this.currentLetter) t.setColor("#ff0000").setFontStyle("bold");
      else t.setColor("#ffffff").setFontStyle("normal");
    }
  }

  async saveScore() {
    if (!this.isNewHighScore || this.saved) return;
    const playerName = this.name.join("");
    this.instructionText.setText("Envoi du score...");
    try {
      await ajoute_score(this.game.config.idGame, playerName, this.score);
      this.saved = true;
      this.highscores = await get_tab_score(this.game.config.idGame);
      this.displayHighScores();
      this.instructionText.setText(
        "Score enregistré ! Appuie sur E pour continuer."
      );
      this.canExit = true;
      this.showNameInput(false);
    } catch (err) {
      console.error("Erreur ajout score :", err);
      this.instructionText.setText("Erreur lors de l'ajout du score.");
    }
  }

  displayHighScores() {
    // Supprime anciens textes
    if (this.scoreListGroup) this.scoreListGroup.clear(true, true);

    const startY = 200;
    const startX = 960;
    this.add
      .text(startX, startY - 40, "🏆 High Scores 🏆", {
        font: "32px Arial",
        fill: "#ffff00",
      })
      .setOrigin(0.5);

    this.highscores.forEach((entry, index) => {
      const txt = this.add
        .text(
          startX,
          startY + index * 40,
          `${index + 1}. ${entry.player} — ${entry.score}`,
          { font: "22px Arial", fill: "#fff" }
        )
        .setOrigin(0.5);
      this.scoreListGroup.add(txt);
    });
  }
}
