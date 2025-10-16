
    
export default class boss extends Phaser.Scene {
    constructor() {
        super({ key: 'boss' });
        this.notes = [];
        this.playerHealth = 100;
        this.bossHealth = 1000;
        this.score = 0;
        this.noteSpeed = 300;
        this.noteInterval = 800;
        this.lastNoteTime = 0;
        this.isGameOver = false;
        
        // Compteurs de feedback
        this.feedbackCounts = {
            'Parfait': 0,
            'Bien': 0,
            'Raté': 0
        };
    }

    preload() {
    // Images de fond pour les phases du boss
    this.load.image('boss_full', './assets/boss_full.jpg');
    this.load.image('boss_mid', './assets/boss_mid.jpg');
    this.load.image('boss_dead', './assets/boss_dead.jpg');
    this.load.image('victoire', './assets/victoire.jpg');
    this.load.spritesheet('player', './assets/dudeattack.png', { frameWidth: 32, frameHeight: 64 });

    this.load.image('gameover', './assets/gameover.jpg');
    this.load.image('boutonrejouer', './assets/boutonrejouer.png');
    this.load.image('boutonmenu', './assets/boutonmenu.png');

    this.load.image('note_I', './assets/a.png');
    this.load.image('note_O', './assets/b.png');
    this.load.image('note_P', './assets/c.png');
    this.load.image('note_K', './assets/d.png');
    this.load.image('note_L', './assets/e.png');
    this.load.image('note_M', './assets/f.png');

    this.load.audio('hit', './assets/musique_sfx/hit.mp3');
    this.load.audio('miss', './assets/musique_sfx/ouch.mp3');
    this.load.audio('musicboss', './assets/musique_sfx/boss.mp3');
    this.load.audio('death', './assets/musique_sfx/death.mp3');
    }

    create() {
        // Reset des compteurs de feedback
        this.feedbackCounts = {
            'Parfait': 0,
            'Bien': 0,
            'Raté': 0
        };

        // Affichage du compteur en haut à gauche
        this.feedbackText = this.add.text(20, 20, this.getFeedbackString(), {
            fontSize: '22px', color: '#fff', align: 'left'
        }).setOrigin(0, 0).setDepth(20);
        // --- STOP ALL PREVIOUS AUDIOS ---
        if (this.sound && this.sound.sounds) {
            this.sound.sounds.forEach(snd => {
                if (snd && snd.isPlaying) snd.stop();
            });
        }
        // Réinitialisation des variables de jeu
        this.notes = [];
        this.playerHealth = 100;
        this.bossHealth = 1000;
        this.score = 0;
        this.isGameOver = false;

        // --- TEMPLATE MANUEL POUR LES NOTES ---
        // Remplis ce tableau avec { time: ms, key: 'I'|'O'|'P' }
        this.noteSchedule = [
            // Exemple : { time: 1000, key: 'I' },
            { time: 380, key: 'I' },
            { time: 1250, key: 'I' },
            { time: 5150, key: 'I' },
            { time: 6080, key: 'I' },

            { time: 10000, key: 'I' },
            { time: 10500, key: 'O' },
            { time: 11800, key: 'O' },

            { time: 12400, key: 'I' },
            { time: 13000, key: 'O' },
            { time: 14200, key: 'O' },

            { time: 14800, key: 'I' },
            { time: 15400, key: 'O' },
            { time: 16700, key: 'O' },

            { time: 17200, key: 'I' },
            { time: 17800, key: 'O' },
            { time: 18800, key: 'O' },
            
            { time: 19500, key: 'I' },
            { time: 20200, key: 'O' },
            { time: 20500, key: 'I' },
            { time: 21400, key: 'O' },
            
            { time: 22000, key: 'I' },
            { time: 22500, key: 'O' },
            { time: 22800, key: 'I' },
            { time: 23800, key: 'O' },
            
            { time: 24400, key: 'I' },
            { time: 25000, key: 'O' },
            { time: 25300, key: 'I' },
            { time: 26200, key: 'O' },
            
            { time: 26800, key: 'I' },
            { time: 27400, key: 'O' },
            { time: 27800, key: 'I' },
            { time: 28300, key: 'I' },
            { time: 28300, key: 'P' },

            
            { time: 29000, key: 'I' },
            { time: 29000, key: 'P' },

            { time: 29500, key: 'K' },
            { time: 29700, key: 'L' },

            { time: 30200, key: 'K' },
            { time: 30500, key: 'L' },

            { time: 31200, key: 'K' },
            { time: 31400, key: 'L' },

            { time: 31900, key: 'K' },
            { time: 32200, key: 'M' },
            
            { time: 32700, key: 'K' },
            { time: 33000, key: 'M' },
            
            { time: 33200, key: 'K' },
            { time: 33400, key: 'L' },
            
            { time: 33700, key: 'K' },
            { time: 34200, key: 'M' },


            { time: 35700, key: 'K' },
            { time: 35900, key: 'L' },

            { time: 36500, key: 'K' },
            { time: 36700, key: 'L' },
            
            { time: 37200, key: 'K' },
            { time: 37400, key: 'L' },

            { time: 37900, key: 'K' },
            { time: 38100, key: 'M' },

            { time: 38600, key: 'K' },
            { time: 38800, key: 'M' },


            
            { time: 39000, key: 'P' },
            { time: 39000, key: 'K' },



            
            { time: 39500, key: 'K' },
            { time: 39700, key: 'L' },

            { time: 40200, key: 'K' },
            { time: 40500, key: 'L' },

            { time: 41200, key: 'K' },
            { time: 41400, key: 'L' },

            { time: 41900, key: 'K' },
            { time: 42200, key: 'M' },

            { time: 42700, key: 'K' },
            { time: 43000, key: 'M' },

            { time: 43200, key: 'K' },
            { time: 43400, key: 'L' },

            { time: 43700, key: 'K' },
            { time: 44200, key: 'M' },


            { time: 45700, key: 'K' },
            { time: 45900, key: 'L' },

            { time: 46200, key: 'K' },
            { time: 46500, key: 'L' },
            { time: 46900, key: 'M' },
            { time: 47200, key: 'L' },
            { time: 47500, key: 'K' },

            { time: 47700, key: 'P' },
            { time: 47900, key: 'O' },
            { time: 48100, key: 'I' },




            { time: 53200, key: 'I' },
            { time: 54200, key: 'I' },
            { time: 54600, key: 'I' },
            { time: 55000, key: 'I' },
            { time: 55300, key: 'I' },
            { time: 55600, key: 'I' },
            { time: 56100, key: 'I' },
            { time: 56500, key: 'I' },
            
            { time: 56900, key: 'O' },
            { time: 57000, key: 'O' },
            { time: 57300, key: 'O' },
            
            { time: 57500, key: 'P' },
            { time: 57700, key: 'P' },



            
            { time: 58900, key: 'I' },
            { time: 59400, key: 'I' },
            { time: 59800, key: 'I' },
            { time: 60100, key: 'I' },
            { time: 60400, key: 'I' },
            { time: 60900, key: 'I' },
            { time: 61300, key: 'I' },
            
            { time: 61700, key: 'O' },
            { time: 61900, key: 'O' },
            { time: 62100, key: 'O' },
            
            { time: 62300, key: 'M' },
            { time: 62500, key: 'M' },




            
            { time: 62800, key: 'I' },
            { time: 63300, key: 'I' },
            { time: 63700, key: 'I' },
            { time: 64000, key: 'I' },
            { time: 64300, key: 'I' },
            { time: 64800, key: 'I' },
            { time: 65200, key: 'I' },

            
            { time: 65600, key: 'O' },
            { time: 65800, key: 'O' },
            { time: 66000, key: 'O' },
            
            { time: 66200, key: 'P' },
            { time: 66400, key: 'P' },
            { time: 66600, key: 'P' },




            
            { time: 67600, key: 'I' },
            { time: 67100, key: 'I' },
            { time: 67500, key: 'I' },
            { time: 67800, key: 'I' },
            { time: 68100, key: 'I' },
            { time: 68600, key: 'I' },
            { time: 69000, key: 'I' },

            
            { time: 69400, key: 'O' },
            { time: 69600, key: 'O' },
            { time: 69800, key: 'O' },
            
            { time: 70000, key: 'M' },
            { time: 70200, key: 'M' },
            { time: 70400, key: 'M' },



            { time: 72400, key: 'I' },
            { time: 72400, key: 'O' },
            { time: 72400, key: 'P' },
            { time: 72400, key: 'K' },
            { time: 72400, key: 'L' },
            { time: 72400, key: 'M' },

        ];
        this.nextNoteIndex = 0;


        // Boss background image (depth -1, always behind everything)
        this.bossBackground = this.add.image(640, 360, 'boss_full')
            .setOrigin(0.5)
            .setDepth(-1)
            .setDisplaySize(1280, 720)
            .setVisible(true);

        // Ligne de délimitation
        this.add.line(640, 600, 200, 0, 1080, 0, 0xffffff).setLineWidth(4);

        // Décalage dynamique pour que la dernière touche soit visible et les lanes soient plus espacées
        const totalLanes = 6;
        const firstLaneX = 360; // position de la première touche (décalée un peu à droite)
        const lastLaneX = 1160; // position max pour la dernière touche (décalée aussi)
        const laneSpacing = (lastLaneX - firstLaneX) / (totalLanes - 1);
        this.lanePositions = {
            I: firstLaneX,
            O: firstLaneX + laneSpacing,
            P: firstLaneX + laneSpacing * 2,
            K: firstLaneX + laneSpacing * 3,
            L: firstLaneX + laneSpacing * 4,
            M: firstLaneX + laneSpacing * 5
        };

        // Cercles pour chaque touche/lane
        this.add.circle(this.lanePositions.I, 600, 50, 0xE99102).setStrokeStyle(4, 0xffffff);
        this.add.circle(this.lanePositions.O, 600, 50, 0x6DAE2C).setStrokeStyle(4, 0xffffff);
        this.add.circle(this.lanePositions.P, 600, 50, 0x35A0A0).setStrokeStyle(4, 0xffffff);
        this.add.circle(this.lanePositions.K, 600, 50, 0xC42F24).setStrokeStyle(4, 0xffffff);
        this.add.circle(this.lanePositions.L, 600, 50, 0xA714D5).setStrokeStyle(4, 0xffffff);
        this.add.circle(this.lanePositions.M, 600, 50, 0xC6A723).setStrokeStyle(4, 0xffffff);
        // Player sprite
    // Create player sprite as an animated sprite
    this.player = this.add.sprite(140, 600, 'player', 0).setScale(2.2);
    // Animation for attack (frame 1)
    this.anims.create({
        key: 'player_attack',
        frames: [ { key: 'player', frame: 1 } ],
        frameRate: 1,
        repeat: 0
    });
    // Animation for idle (frame 0)
    this.anims.create({
        key: 'player_idle',
        frames: [ { key: 'player', frame: 0 } ],
        frameRate: 1,
        repeat: 0
    });
    // Health bars
    //this.bossBar = this.add.rectangle(1000, 100, this.bossHealth * 3, 28, 0xff4444);
    this.playerBar = this.add.rectangle(140, 500, this.playerHealth * 3, 28, 0x44ff44);
        // Score text (désactivé)
        // this.scoreText = this.add.text(640, 60, 'Score: 0', { fontSize: '40px', color: '#fff' }).setOrigin(0.5);

        // Overlay semi-transparent et image d'explication
        this.overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7).setDepth(10);
        this.infoImage = this.add.rectangle(640, 670, 600, 90, 0xffffff, 0.9).setDepth(11);
        this.infoText = this.add.text(640, 670, 'Appuie sur I pour commencer !\nAppuie sur la touche indiquée quand la note arrive dans le cercle.', {
            fontSize: '28px', color: '#222', align: 'center'
        }).setOrigin(0.5).setDepth(12);

        this.gameStarted = false;
        this.input.keyboard.on('keydown', (event) => {
            if (!this.gameStarted && event.code === 'KeyI') {
                this.overlay.destroy();
                this.infoImage.destroy();
                this.infoText.destroy();
                this.startGame();
            }
        });
    }

    startGame() {
    // Changement de phase du boss
    this.time.delayedCall(50000, () => {
        this.bossBackground.setTexture('boss_mid');
        this.bossBackground.setDisplaySize(1280, 720);
        this.bossBackground.setDepth(-1);
        this.bossBackground.setVisible(true);
    });
    this.time.delayedCall(73500, () => {
        this.bossBackground.setTexture('boss_dead');
        this.bossBackground.setDisplaySize(1280, 720);
        this.bossBackground.setDepth(-1);
        this.bossBackground.setVisible(true);
        // Après 5 secondes, affiche victoire
        this.time.delayedCall(5000, () => {
                this.showVictoryScreen();
            });
    });
    this.gameStarted = true;
    // Enregistre le timestamp de début
    this.startTimestamp = this.time.now;
    // --- TIMER MANUEL POUR LES NOTES ---
    this.time.addEvent({
        delay: 10, // check every 10ms
        loop: true,
        callback: () => {
            // Toujours utiliser le temps écoulé depuis le début du jeu
            const currentTime = this.time.now - this.startTimestamp;
            if (this.isGameOver) return;
            while (
                this.nextNoteIndex < this.noteSchedule.length &&
                currentTime >= this.noteSchedule[this.nextNoteIndex].time
            ) {
                const noteEvent = this.noteSchedule[this.nextNoteIndex];
                this.spawnManualNote(noteEvent.key);
                this.nextNoteIndex++;
            }
        }
    });
    // Attendre 1 seconde avant de démarrer la musique
    this.time.delayedCall(1000, () => {
        this.musicboss = this.sound.add('musicboss');
        this.musicboss.play();
    });
    // Input
    this.input.keyboard.on('keydown', this.handleInput, this);
    }

    spawnNote() {
        if (this.isGameOver) return;
        // Random lane (I, O, P)
        const laneKeys = ['I', 'O', 'P'];
        const key = Phaser.Math.RND.pick(laneKeys);
        const lane = this.lanePositions[key];
        // Choisir l'image selon la touche
        const noteImage = key === 'I' ? 'note_I' : key === 'O' ? 'note_O' : 'note_P';
        const note = this.add.sprite(lane, 0, noteImage).setScale(0.9);
        note.lane = lane;
        note.laneKey = key;
        this.notes.push(note);
    }

    // --- SPAWN NOTE MANUELLE ---
    spawnManualNote(key) {
    const lane = this.lanePositions[key];
    let noteImage = 'note';
    if (key === 'I') noteImage = 'note_I';
    else if (key === 'O') noteImage = 'note_O';
    else if (key === 'P') noteImage = 'note_P';
    else if (key === 'K') noteImage = 'note_K';
    else if (key === 'L') noteImage = 'note_L';
    else if (key === 'M') noteImage = 'note_M';
    const note = this.add.sprite(lane, 0, noteImage).setScale(0.9);
    note.lane = lane;
    note.laneKey = key;
    this.notes.push(note);
    }

    handleInput(event) {
        if (this.isGameOver) return;
    let lane = null; 
    if (event.code === 'KeyI') lane = this.lanePositions.I;
    if (event.code === 'KeyO') lane = this.lanePositions.O;
    if (event.code === 'KeyP') lane = this.lanePositions.P;
    if (event.code === 'KeyK') lane = this.lanePositions.K;
    if (event.code === 'KeyL') lane = this.lanePositions.L;
    if (event.code === 'KeyM' || event.code === 'Semicolon') lane = this.lanePositions.M; // AZERTY: ',' is where 'M' is
    if (!lane) return;
        // Find closest note in lane
    let hit = false;
    let feedback = '';
    let heal = 0;
        for (let i = 0; i < this.notes.length; i++) {
            const note = this.notes[i];
            if (note.lane === lane && note.y > 560 && note.y < 640) {
                // Calcul de la précision
                const dist = Math.abs(note.y - 600);
                if (dist < 12) {
                    feedback = 'Parfait';
                    heal = 5;
                } else if (dist < 52) {
                    feedback = 'Bien';
                    heal = 2;
                } 
                this.score += 100;
                this.bossHealth -= 5;
                this.playerHealth = Math.min(this.playerHealth + heal, 100);
                // Incrémente le compteur
                this.feedbackCounts[feedback]++;
                this.updateFeedbackText();
                // Animation attaque
                this.player.anims.play('player_attack');
                this.time.delayedCall(120, () => {
                    this.player.anims.play('player_idle');
                });
                // Affichage du feedback
                const fbText = this.add.text(lane, 540, feedback, { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
                this.tweens.add({
                    targets: fbText,
                    y: 480,
                    alpha: 0,
                    duration: 800,
                    onComplete: () => fbText.destroy()
                });
                note.destroy();
                this.notes.splice(i, 1);
                hit = true;
                break;
            }
        }
        if (!hit) {
            feedback = 'Raté';
            this.playerHealth -= 7;
            this.sound.play('ouch');
            // Incrémente le compteur
            this.feedbackCounts[feedback]++;
            this.updateFeedbackText();
            // Affichage du feedback raté
            const fbText = this.add.text(lane, 540, feedback, { fontSize: '32px', color: '#f00' }).setOrigin(0.5);
            this.tweens.add({
                targets: fbText,
                y: 480,
                alpha: 0,
                duration: 800,
                onComplete: () => fbText.destroy()
            });
            // Tint player red briefly
            this.player.setTint(0xff2222);
            this.time.delayedCall(180, () => {
                this.player.clearTint();
            });
        }
        this.updateUI();
        this.checkGameOver();
    }

    // Génère le texte du compteur
    getFeedbackString() {
        return `Parfait: ${this.feedbackCounts['Parfait']}\nBien: ${this.feedbackCounts['Bien']}\nRaté: ${this.feedbackCounts['Raté']}`;
    }

    // Met à jour l'affichage du compteur
    updateFeedbackText() {
        if (this.feedbackText) {
            this.feedbackText.setText(this.getFeedbackString());
        }
    }

    updateUI() {
    //this.bossBar.width = Math.max(this.bossHealth * 3, 0);
    this.playerBar.width = Math.max(this.playerHealth * 3, 0);
        // this.scoreText.setText('Score: ' + this.score);
    }

    checkGameOver() {
        if (this.bossHealth <= 0) {
            this.isGameOver = true;
            this.musicboss.stop();
                this.showVictoryScreen();
        } else if (this.playerHealth <= 0) {
            this.isGameOver = true;
            this.musicboss.stop();
            // Shake du joueur
            this.tweens.add({
                targets: this.player,
                x: this.player.x + 10,
                yoyo: true,
                repeat: 10,
                duration: 50,
                onComplete: () => {
                    this.player.x = 200;
                }
            });
            // Menu de mort
            this.showDeathMenu();
        }
    }

    showDeathMenu() {
        // UI defeat screen (like selection.js)
        const cam = this.cameras.main;
        const deathScreenX = cam.scrollX + cam.width / 2;
        const deathScreenY = cam.scrollY + cam.height / 2;
        this.deathScreen = this.add.container(deathScreenX, deathScreenY).setDepth(999999).setVisible(true);
        const bg = this.add.image(0, 0, "gameover").setOrigin(0.5).setScale(1).setDepth(1);
        this.deathScreen.add(bg);
        const btnY = 250;
        const btnSpacing = 220;
        const btnRejouer = this.add.image(-btnSpacing, btnY, "boutonrejouer").setOrigin(0.5).setScale(0.3).setDepth(2);
        const btnMenu = this.add.image(btnSpacing, btnY, "boutonmenu").setOrigin(0.5).setScale(0.3).setDepth(2);
        this.deathScreen.add([btnRejouer, btnMenu]);
        this.deathScreen.setVisible(true);
        let selectedIndex = 0;
        const buttons = [btnRejouer, btnMenu];
        const updateSelection = () => {
            buttons.forEach((btn, i) => {
                btn.setScale(i === selectedIndex ? 0.7 : 0.5);
            });
        };
        updateSelection();
        this.deathScreenKeyLeft = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.deathScreenKeyRight = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.deathScreenKeyUp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
        this.deathScreenKeyDown = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
        this.deathScreenKeyI = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
        const onKeyDown = (event) => {
            if (event.code === "ArrowLeft" || event.code === "ArrowUp") {
                selectedIndex = (selectedIndex - 1 + buttons.length) % buttons.length;
                updateSelection();
            } else if (event.code === "ArrowRight" || event.code === "ArrowDown") {
                selectedIndex = (selectedIndex + 1) % buttons.length;
                updateSelection();
            } else if (event.code === "KeyI") {
                cleanupListeners();
                this.deathScreen.destroy();
                this.sound.stopAll();
                if (selectedIndex === 0) {
                    this.scene.restart();
                } else {
                    this.scene.stop('selection');
                    const selectionScene = this.scene.get('selection');
                    if (selectionScene && typeof selectionScene.resetGlobalStats === 'function') {
                        selectionScene.resetGlobalStats();
                    }
                    this.scene.start("debut");
                }
            }
        };
        this.input.keyboard.on("keydown", onKeyDown);
        const cleanupListeners = () => {
            this.input.keyboard.removeListener("keydown", onKeyDown);
            this.deathScreenKeyLeft.destroy();
            this.deathScreenKeyRight.destroy();
            this.deathScreenKeyUp.destroy();
            this.deathScreenKeyDown.destroy();
            this.deathScreenKeyI.destroy();
        };
        this.deathMenuActive = true;
    }

    showVictoryScreen() {
        // Hide all main UI elements
        if (this.player) this.player.setVisible(false);
        if (this.playerBar) this.playerBar.setVisible(false);
        if (this.feedbackText) this.feedbackText.setVisible(false);
        if (this.overlay) this.overlay.setVisible(false);
        if (this.infoImage) this.infoImage.setVisible(false);
        if (this.infoText) this.infoText.setVisible(false);
        if (this.deathScreen) this.deathScreen.setVisible(false);
        // Hide all notes
        if (this.notes) this.notes.forEach(note => note.setVisible(false));
        // Show only victoire image and feedback counts
        const cam = this.cameras.main;
        const centerX = cam.scrollX + cam.width / 2;
        const centerY = cam.scrollY + cam.height / 2;
        this.victoireContainer = this.add.container(centerX, centerY).setDepth(999999);
        const victoireImg = this.add.image(0, 0, 'victoire').setOrigin(0.5).setDisplaySize(1280, 720);
        this.victoireContainer.add(victoireImg);
        // Feedback counts
        const feedbackString = `Parfait: ${this.feedbackCounts['Parfait']}\nBien: ${this.feedbackCounts['Bien']}\nRaté: ${this.feedbackCounts['Raté']}`;
        const feedbackText = this.add.text(0, 265, feedbackString, {
            fontSize: '48px', color: '#fff', align: 'center', fontStyle: 'bold', stroke: '#222', strokeThickness: 4
        }).setOrigin(0.5);
        this.victoireContainer.add(feedbackText);
    }

    cleanupDeathMenu() {
        if (!this.deathMenuActive) return;
        this.deathOverlay?.destroy();
        this.deathFrame?.destroy();
        this.deathText?.destroy();
        if (this.deathButtons) {
            this.deathButtons.forEach(btn => btn.destroy());
        }
        // Remove listeners
        if (this.deathKeyLeft) this.deathKeyLeft.removeAllListeners();
        if (this.deathKeyRight) this.deathKeyRight.removeAllListeners();
        if (this.deathKeyValidate) this.deathKeyValidate.removeAllListeners();
        // Stop music if playing
        if (this.musicboss && this.musicboss.isPlaying) {
            this.musicboss.stop();
        }
        // Reset feedback counts and update display (for restart)
        if (this.feedbackCounts) {
            this.feedbackCounts = {
                'Parfait': 0,
                'Bien': 0,
                'Raté': 0
            };
            this.updateFeedbackText();
        }
        this.deathMenuActive = false;
    }
    

    updateDeathButtonSelection() {
        for (let i = 0; i < this.deathButtons.length; i++) {
            if (i === this.deathSelected) {
                this.deathButtons[i].setStyle({ backgroundColor: '#444', color: '#fff', fontSize: '44px' });
            } else {
                this.deathButtons[i].setStyle({ backgroundColor: '#eee', color: '#222', fontSize: '40px' });
            }
        }
    }

    update(time, delta) {
        if (this.isGameOver) return;
        // Move notes
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const note = this.notes[i];
            note.y += (this.noteSpeed * delta) / 1000;
            if (note.y > 720) {
                // Affichage du feedback raté au-dessus du cercle
                const fbText = this.add.text(note.lane, 540, 'Raté', { fontSize: '32px', color: '#f00' }).setOrigin(0.5);
                this.tweens.add({
                    targets: fbText,
                    y: 480,
                    alpha: 0,
                    duration: 800,
                    onComplete: () => fbText.destroy()
                });
                note.destroy();
                this.notes.splice(i, 1);
                this.playerHealth -= 5;
                // Incrémente le compteur 'Raté'
                this.feedbackCounts['Raté']++;
                this.updateFeedbackText();
                // Tint player red and play ouch
                this.player.setTint(0xff2222);
                this.sound.play('ouch');
                this.time.delayedCall(180, () => {
                    this.player.clearTint();
                });
                this.updateUI();
                this.checkGameOver();
            }
        }

        // FADE OUT MUSIC WHEN NOTES ARE FINISHED
        if (
            this.gameStarted &&
            this.nextNoteIndex >= this.noteSchedule.length &&
            !this.musicFading &&
            this.musicboss &&
            this.musicboss.isPlaying
        ) {
            this.musicFading = true;
            this.tweens.add({
                targets: this.musicboss,
                volume: 0.1, // Fade to 10% volume
                duration: 3000,
                onComplete: () => {
                    // If player is still alive, show victory screen with lower music
                    if (!this.isGameOver && this.playerHealth > 0) {
                        this.isGameOver = true;
                        }
                }
            });
        }
    }
}
