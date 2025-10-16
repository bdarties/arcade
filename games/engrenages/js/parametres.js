import { musicManager } from './MusicManager.js';

export default class parametres extends Phaser.Scene {
  constructor() {
    super({ key: "parametres" });
    
    // Récupérer ou initialiser le volume global sauvegardé
    let savedVolume = localStorage.getItem('gameVolume');
    this.globalVolume = savedVolume !== null ? parseFloat(savedVolume) : 0.5; // Volume par défaut à 0.5
    
    // Configurer le volume global du jeu
    if (this.game && this.game.sound) {
      this.game.sound.volume = this.globalVolume;
    }
  }

  preload() {
    this.load.image("screen_parametres", "assets/screen_parametres.jpg");
    this.load.image("retour_menu", "assets/retour_menu.png");
  }

  create(data) {
    this.cameras.main.fadeIn(200, 0, 0, 0);

    // Stocke l'information si on vient de la scène pause
    this.fromPause = data && data.fromPause;
    
    // Gérer la musique
    musicManager.scene = this;
    musicManager.play('parametres', this.fromPause);
    
    // Ajoute le fond
    this.add.image(this.game.config.width / 2, this.game.config.height / 2, "screen_parametres");


    
 
    
    // Ornements décoratifs autour du titre
    const decorLeft = this.add.text(this.game.config.width / 2 - 250, 100, "⚙", { 
      fontSize: "40px", 
      fill: "#b87333"
    }).setOrigin(0.5);
    const decorRight = this.add.text(this.game.config.width / 2 + 250, 100, "⚙", { 
      fontSize: "40px", 
      fill: "#b87333"
    }).setOrigin(0.5);

    // Lecteur de touches
    this.cursors = this.input.keyboard.createCursorKeys();
    this.selectKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.backKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

    // Menu simple : Volume uniquement
    this.menuItems = ["Volume"];
    this.selectedIndex = 0;

    // Utiliser le volume global initialisé dans le constructeur
    this.volume = this.globalVolume;

    // Appliquer le volume à toutes les scènes actives
    const scenes = this.game.scene.scenes;
    scenes.forEach(scene => {
      if (scene.sound) {
        scene.sound.volume = this.volume;
      }
    });

    // Appliquer le volume au gestionnaire de sons global
    if (this.game && this.game.sound) {
      this.game.sound.volume = this.volume;
    }

    // Et à la musique globale si présente
    if (window.globalMusic && typeof window.globalMusic.setVolume === 'function') {
      window.globalMusic.setVolume(this.volume);
    }

    // Affichage label et jauge avec cadre décoratif
    const centerX = this.game.config.width / 2;
    const labelY = 300;
    
    // Zone graphique pour la jauge (ajustée pour la nouvelle disposition)
    this.gaugeX = centerX - 120;
    this.gaugeY = labelY;
    this.gaugeWidth = 340;
    this.gaugeHeight = 32;

    this.gaugeBg = this.add.graphics();
    this.gaugeFill = this.add.graphics();
    this.gaugeBorder = this.add.graphics();

    this.volumeText = this.add.text(centerX + 300, labelY, Math.round(this.volume * 100) + '%', { 
      fontSize: '40px', 
      fill: '#ffd700',
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.drawGauge();

    // Pas de bouton retour

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

    // Border - cadre métallique
    this.gaugeBorder.clear();
    
    // Cadre principal bronze
    this.gaugeBorder.lineStyle(3, 0x8b4513, 1);
    this.gaugeBorder.strokeRect(x, y, w, h);
    
    // Cadre extérieur plus clair
    this.gaugeBorder.lineStyle(1, 0xcd853f, 1);
    this.gaugeBorder.strokeRect(x - 1, y - 1, w + 2, h + 2);

    // Divisions/graduations sur la jauge
    this.gaugeBorder.lineStyle(1, 0x000000, 0.3);
    for (let i = 1; i < 10; i++) {
      const tickX = x + (w / 10) * i;
      this.gaugeBorder.lineBetween(tickX, y, tickX, y + h);
    }

    // Mise à jour du texte pourcentage avec style steampunk
    if (this.volumeText) {
      this.volumeText.setText(Math.round(this.volume * 100) + '%');
      this.volumeText.setStyle({ 
        fontSize: '40px', 
        fill: '#ffd700', 
        fontFamily: 'Georgia, serif',
        fontStyle: 'bold'
      });
    }
  }

  // Met en surbrillance la sélection
  updateSelection() {
    // Volume label
    if (this.menuTexts) {
      this.menuTexts.forEach(t => t.destroy());
    }
    this.menuTexts = [];

    // Highlight Volume
    const centerX = this.game.config.width / 2;
    const labelY = 300;
    const colorSelected = '#ffd700'; // Or brillant
    const colorNormal = '#cd853f'; // Bronze

    const volColor = (this.selectedIndex === 0) ? colorSelected : colorNormal;
    const volLabel = this.add.text(centerX - 335, labelY, 'VOLUME', { 
      fontSize: '36px', 
      fill: '#cd853f',
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    this.menuTexts.push(volLabel);
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

    // Si l'item est la jauge, traiter gauche/droite
    if (this.selectedIndex === 0) {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
        this.changeVolume(-0.05);
      }
      if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
        this.changeVolume(0.05);
      }
    }

    // Plus de bouton retour à gérer
  }

  changeVolume(delta) {
    this.volume = Phaser.Math.Clamp(Math.round((this.volume + delta) * 100) / 100, 0, 1);
    
    // Mettre à jour le volume global du jeu
    if (this.game && this.game.sound) {
      this.game.sound.volume = this.volume;
    }
    
    // Mettre à jour le volume dans le gestionnaire de musique
    musicManager.setVolume(this.volume);
    
    // Sauvegarder dans le localStorage
    try {
      localStorage.setItem('gameVolume', String(this.volume));
      this.globalVolume = this.volume;
    } catch (e) {
      console.warn('Impossible de sauvegarder le volume dans localStorage:', e);
    }
    
    this.drawGauge();
  }
}