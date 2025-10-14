export default class parametres extends Phaser.Scene {
  constructor() {
    super({ key: "parametres" });
  }

  preload() {
    this.load.image("screen_background", "assets/screen_background.jpg");
    this.load.image("retour_menu", "assets/retour_menu.png");
  }

  create(data) {
    // Stocke l'information si on vient de la scène pause
    this.fromPause = data && data.fromPause;
    
    // Ajoute le fond
    this.add.image(this.game.config.width / 2, this.game.config.height / 2, "screen_background");

    // Titre
    this.add.text(this.game.config.width / 2, 120, "Paramètres", { fontSize: "48px", fill: "#fff" }).setOrigin(0.5);



    // Lecteur de touches
    this.cursors = this.input.keyboard.createCursorKeys();
    this.selectKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.backKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

    // Menu simple : Volume + Retour
    this.menuItems = ["Volume", "Retour"];
    this.selectedIndex = 0;

    // Valeur du volume : lire depuis localStorage ou valeur par de9faut
    let saved = localStorage.getItem('gameVolume');
    this.volume = 0.2; // valeur par d9faut
    if (saved !== null) {
      const v = parseFloat(saved);
      if (!isNaN(v)) this.volume = Phaser.Math.Clamp(v, 0, 1);
    }

    // Appliquer le volume au gestionnaire de sons de Phaser pour cette sce8ne
    if (this.sound && typeof this.sound.volume !== 'undefined') {
      this.sound.volume = this.volume;
    }
    // Et a0 la musique globale si pre9sente
    if (window.globalMusic && typeof window.globalMusic.setVolume === 'function') {
      window.globalMusic.setVolume(this.volume);
    }

    // Affichage label et jauge
    const centerX = this.game.config.width / 2;
    const labelY = 260;
    this.add.text(centerX - 200, labelY, 'Volume', { fontSize: '32px', fill: '#fff' }).setOrigin(0, 0.5);

    // Zone graphique pour la jauge
    this.gaugeX = centerX - 80;
    this.gaugeY = labelY;
    this.gaugeWidth = 400;
    this.gaugeHeight = 28;

    this.gaugeBg = this.add.graphics();
    this.gaugeFill = this.add.graphics();
    this.gaugeBorder = this.add.graphics();

    this.volumeText = this.add.text(centerX + 240, labelY, Math.round(this.volume * 100) + '%', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

    this.drawGauge();

    // Texte pour Retour
    this.retourText = this.add.text(centerX, labelY + 120, 'Retour au menu', { fontSize: '28px', fill: '#fff' }).setOrigin(0.5);

    // Highlight initial
    this.updateSelection();

    // M pour retour
    this.input.keyboard.once('keydown-M', () => {
      if (this.fromPause) {
        this.scene.stop(); // Arrête la scène des paramètres
        this.scene.wake('pause'); // Réactive la scène pause
      } else {
        this.scene.start('accueil');
      }
    });
  }

  // Dessine la jauge en fonction de this.volume (style Steampunk)
  drawGauge() {
    const x = this.gaugeX;
    const y = this.gaugeY - this.gaugeHeight / 2;
    const w = this.gaugeWidth;
    const h = this.gaugeHeight;

    // Background - texture métallique cuivrée
    this.gaugeBg.clear();
    this.gaugeBg.fillStyle(0x3d2817, 1);
    this.gaugeBg.fillRect(x, y, w, h);
    
    // Effet de profondeur - ombre intérieure
    this.gaugeBg.fillStyle(0x000000, 0.4);
    this.gaugeBg.fillRect(x, y, w, 3);
    this.gaugeBg.fillRect(x, y, 3, h);

    // Fill - effet de vapeur/énergie cuivrée
    this.gaugeFill.clear();
    const fillWidth = w * this.volume;
    
    // Dégradé cuivré avec effet lumineux
    this.gaugeFill.fillStyle(0xb87333, 1); // Cuivre foncé
    this.gaugeFill.fillRect(x + 2, y + 2, fillWidth - 4, h - 4);
    
    // Surbrillance dorée
    this.gaugeFill.fillStyle(0xd4af37, 0.6); // Or
    this.gaugeFill.fillRect(x + 2, y + 2, fillWidth - 4, (h - 4) / 2);
    
    // Reflet lumineux en haut
    this.gaugeFill.fillStyle(0xffd700, 0.3);
    this.gaugeFill.fillRect(x + 2, y + 2, fillWidth - 4, 4);

    // Border - cadre métallique avec boulons
    this.gaugeBorder.clear();
    
    // Cadre principal bronze
    this.gaugeBorder.lineStyle(3, 0x8b4513, 1);
    this.gaugeBorder.strokeRect(x, y, w, h);
    
    // Cadre extérieur plus clair
    this.gaugeBorder.lineStyle(1, 0xcd853f, 1);
    this.gaugeBorder.strokeRect(x - 1, y - 1, w + 2, h + 2);

    // Boulons/rivets steampunk aux coins
    const rivetColor = 0x654321;
    const rivetSize = 6;
    const rivetPositions = [
      { x: x - 2, y: y - 2 },
      { x: x + w - 4, y: y - 2 },
      { x: x - 2, y: y + h - 4 },
      { x: x + w - 4, y: y + h - 4 }
    ];
    
    rivetPositions.forEach(pos => {
      this.gaugeBorder.fillStyle(rivetColor, 1);
      this.gaugeBorder.fillCircle(pos.x, pos.y, rivetSize);
      this.gaugeBorder.fillStyle(0x8b6914, 1);
      this.gaugeBorder.fillCircle(pos.x - 1, pos.y - 1, rivetSize * 0.6);
      // Croix sur le boulon
      this.gaugeBorder.lineStyle(1, 0x000000, 0.5);
      this.gaugeBorder.lineBetween(pos.x - 3, pos.y, pos.x + 3, pos.y);
      this.gaugeBorder.lineBetween(pos.x, pos.y - 3, pos.x, pos.y + 3);
    });

    // Divisions/graduations sur la jauge
    this.gaugeBorder.lineStyle(1, 0x000000, 0.3);
    for (let i = 1; i < 10; i++) {
      const tickX = x + (w / 10) * i;
      this.gaugeBorder.lineBetween(tickX, y, tickX, y + h);
    }

    // Mise à jour du texte pourcentage avec style steampunk
    if (this.volumeText) {
      this.volumeText.setText(Math.round(this.volume * 100) + '%');
      this.volumeText.setStyle({ fontSize: '24px', fill: '#d4af37', fontFamily: 'Georgia, serif' });
    }
  }

  // Met en surbrillance l'
  updateSelection() {
    // Volume label
    if (this.menuTexts) {
      this.menuTexts.forEach(t => t.destroy());
    }
    this.menuTexts = [];

    // Highlight Volume (on le8ve la couleur si se9lectionne9)
    const centerX = this.game.config.width / 2;
    const labelY = 260;
    const colorSelected = '#ffd66b';
    const colorNormal = '#ffffff';

    const volColor = (this.selectedIndex === 0) ? colorSelected : colorNormal;
    // Re-cre9e le label pour pouvoir changer la couleur facilement
    const volLabel = this.add.text(centerX - 200, labelY, 'Volume', { fontSize: '32px', fill: volColor }).setOrigin(0, 0.5);
    this.menuTexts.push(volLabel);

    const retourColor = (this.selectedIndex === 1) ? colorSelected : colorNormal;
    if (this.retourText) this.retourText.setStyle({ fill: retourColor });
  }

  update() {
    // Navigation haut/bas
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.selectedIndex--;
      if (this.selectedIndex < 0) this.selectedIndex = this.menuItems.length - 1;
      this.updateSelection();
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.selectedIndex++;
      if (this.selectedIndex >= this.menuItems.length) this.selectedIndex = 0;
      this.updateSelection();
    }

    // Si l'item s la jauge, traiter gauche/droite
    if (this.selectedIndex === 0) {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
        this.changeVolume(-0.05);
      }
      if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
        this.changeVolume(0.05);
      }
    }

    // Touche I pour valider/retour si sur Retour
    if (Phaser.Input.Keyboard.JustDown(this.selectKey)) {
      if (this.selectedIndex === 1) {
        if (this.fromPause) {
          this.scene.stop(); // Arrête la scène des paramètres
          this.scene.wake('pause'); // Réactive la scène pause
        } else {
          this.scene.start('accueil');
        }
      }
    }
  }

  changeVolume(delta) {
    this.volume = Phaser.Math.Clamp(Math.round((this.volume + delta) * 100) / 100, 0, 1);
    // applique au sound manager
    if (this.sound && typeof this.sound.volume !== 'undefined') {
      this.sound.volume = this.volume;
    }
    if (window.globalMusic && typeof window.globalMusic.setVolume === 'function') {
      window.globalMusic.setVolume(this.volume);
    }
    // Sauvegarde
    try {
      localStorage.setItem('gameVolume', String(this.volume));
    } catch (e) {
      // localStorage peut eatre indisponible en mode fichier, ignorer
    }
    this.drawGauge();
  }
}
