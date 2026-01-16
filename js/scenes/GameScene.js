class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    /**
     * Level System Initialization: Defines the progression, BPM, and difficulty.
     * To change the rhythm/difficulty:
     * - Adjust 'bpm': Higher is faster. 
     * - Adjust 'sets': Number of grid rounds per level.
     * - Adjust 'damagePerMiss': Health penalty for errors.
     */
    init(data) {
        // Level System (Scalable Design) - 5 Levels total
        // Balanced BPM: 90 to 140 instead of 100 to 180
        this.levels = [
            {
                id: 1,
                bpm: 90,
                sets: 2,
                damagePerMiss: 10,
                tiles: this.getPool(['COLD', 'NUMB', 'WEAK', 'TIRED', 'SLOW', 'FAINT', 'DARK', 'LOST'])
            },
            {
                id: 2,
                bpm: 100,
                sets: 2,
                damagePerMiss: 12,
                tiles: this.getPool(['SHAKE', 'MOVE', 'PUSH', 'TRY', 'FIGHT', 'STAY', 'LIVE', 'HOLD'])
            },
            {
                id: 3,
                bpm: 110,
                sets: 2,
                damagePerMiss: 14,
                tiles: this.getPool(['NOISE', 'SOUND', 'KNOCK', 'BANG', 'CRASH', 'THUMP', 'LOUD', 'HEAR'])
            },
            {
                id: 4,
                bpm: 120,
                sets: 2,
                damagePerMiss: 16,
                tiles: this.getPool(['VOICE', 'STEPS', 'NEAR', 'CLOSE', 'MAYA', 'HERE', 'WAIT', 'LOOK'])
            },
            {
                id: 5,
                bpm: 130,
                sets: 2,
                damagePerMiss: 18,
                tiles: this.getPool(['LIGHT', 'OPEN', 'FREE', 'WARM', 'SAFE', 'FOUND', 'YES', 'HOME'])
            }
        ];

        this.currentLevelIndex = data.levelIndex || 0;
        this.currentLevel = this.levels[this.currentLevelIndex];
        
        // Shuffle tiles for the first set
        this.activeTileSet = this.shuffleArray([...this.currentLevel.tiles]);
        
        // Health System (Resets per level, carries over per set)
        this.hp = 100;
        this.maxHp = 100;
        
        // Rhythm State
        this.currentSet = 1;
        this.activeTileIndex = -1;
        this.lastBeatTime = 0;
        this.beatDuration = (60 / this.currentLevel.bpm) * 1000;
        this.hasTypedOnBeat = false;
        this.isGameOver = false;
        this.isBetweenLevels = false;
        this.score = data.score || 0;
    }

    getPool(words) {
        return words.map((word, i) => ({
            id: i,
            word: word,
            expectedKey: word[0].toUpperCase()
        }));
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    create() {
        // Ensure level state is active after any restart
        this.isBetweenLevels = false;
        this.activeTileIndex = -1;
        this.hasTypedOnBeat = false;

        const { width, height } = this.scale;

        // Background
        this.add.image(width / 2, height / 2, 'fridge_bg').setAlpha(0.2).setScale(Math.max(width / 800, height / 600));

        // UI
        this.createUI(width, height);

        // Tiles Grid
        this.createGrid(width, height);

        // Inputs
        this.input.keyboard.on('keydown', this.handleInput, this);

        // Feedback Text - Lowered position to avoid being off-screen
        this.feedbackText = this.add.text(width / 2, height - 150, '', {
            fontSize: '56px',
            fontFamily: 'Comic Sans MS',
            fontWeight: 'bold',
            color: '#00FF00',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Metronome Visualizer - Bouncing Mouse
        this.metroBall = this.add.image(0, 0, 'rat').setDepth(10);
        this.metroBall.setScale(0.3);
        this.metroBall.setAlpha(0); // Hidden until game starts

        // Kick off the first beat immediately after restart
        this.activeTileIndex = -1;
        this.startBeat();
    }

    startBeat() {
        // Reset beat timing so the next update immediately starts on tile 0
        this.isBetweenLevels = false;
        this.activeTileIndex = -1;
        this.hasTypedOnBeat = false;
        this.lastBeatTime = this.time.now - this.beatDuration;
        this.metroBall.setAlpha(0);
    }

    /**
     * UI Setup: Defines health bar (Insulin Level) and status indicators.
     * To change colors or fonts, modify the styles here.
     */
    createUI(width, height) {
        // Level & Set Info
        this.levelText = this.add.text(20, 20, `LEVEL ${this.currentLevel.id}`, { fontSize: '28px', fontFamily: 'Comic Sans MS', fontWeight: 'bold', color: '#FFFFFF' });
        this.setText = this.add.text(20, 55, `SET ${this.currentSet}/${this.currentLevel.sets}`, { fontSize: '20px', fontFamily: 'Comic Sans MS', color: '#AAAAAA' });
        this.scoreText = this.add.text(20, 85, `SCORE: ${this.score}`, { fontSize: '20px', fontFamily: 'Comic Sans MS', color: '#FFFFFF' });

        // Health Bar (Insulin Level) - White bar on dark background
        const barWidth = 250;
        const barX = width - barWidth - 20;
        this.add.rectangle(barX, 20, barWidth, 30, 0x333333).setOrigin(0);
        this.hpBar = this.add.rectangle(barX, 20, barWidth, 30, 0xFFFFFF).setOrigin(0);
        this.add.text(barX, 55, 'INSULIN LEVEL', { fontSize: '14px', fontFamily: 'Comic Sans MS', fontWeight: 'bold', color: '#FFFFFF' });
        this.hpText = this.add.text(barX + barWidth / 2, 35, '100 HP', { fontSize: '16px', fontFamily: 'Comic Sans MS', fontWeight: 'bold', color: '#000000' }).setOrigin(0.5);
    }

    /**
     * Grid Creation: Generates the 4x2 grid.
     * To add images to cards:
     * 1. Preload images in init() or TitleScene.js.
     * 2. Add an 'imageKey' property to the level data objects in init().
     * 3. Inside the loop below, use this.add.image(x, y, tileData.imageKey).
     */
    createGrid(width, height) {
        this.tiles = [];
        const gridCols = 4;
        const tileSize = 130;
        const spacing = 30;
        const startX = width / 2 - ((gridCols * tileSize + (gridCols - 1) * spacing) / 2) + tileSize / 2;
        const startY = height / 2 - (tileSize + spacing) / 2;

        for (let i = 0; i < 8; i++) {
            const col = i % gridCols;
            const row = Math.floor(i / gridCols);
            const x = startX + col * (tileSize + spacing);
            const y = startY + row * (tileSize + spacing);

            const tileData = this.activeTileSet[i];
            
            const bg = this.add.rectangle(x, y, tileSize, tileSize, 0x222222, 0.8).setStrokeStyle(4, 0x666666);
            const word = this.add.text(x, y + 10, tileData.word, { fontSize: '22px', fontFamily: 'Comic Sans MS', fontWeight: 'bold', color: '#FFFFFF' }).setOrigin(0.5);
            const key = this.add.text(x, y + 40, `[${tileData.expectedKey}]`, { fontSize: '16px', fontFamily: 'Comic Sans MS', color: '#FFFF00' }).setOrigin(0.5);
            const label = this.add.text(x, y - 35, `Slot ${i + 1}`, { fontSize: '14px', fontFamily: 'Comic Sans MS', color: '#888888' }).setOrigin(0.5);

            this.tiles.push({ bg, word, key, label, data: tileData });
        }
    }

    updateTiles() {
        this.tiles.forEach((tile, i) => {
            const newData = this.activeTileSet[i];
            tile.data = newData;
            tile.word.setText(newData.word);
            tile.key.setText(`[${newData.expectedKey}]`);
        });
    }

    update(time) {
        // DEBUG: Show what's happening
        if (this.debugText) {
            this.debugText.setText(`IDX:${this.activeTileIndex} BTW:${this.isBetweenLevels} GO:${this.isGameOver} BD:${Math.round(this.beatDuration)}`);
        }

        if (this.isGameOver || this.isBetweenLevels) return;

        // Update Bouncing Ball Metronome
        if (this.activeTileIndex >= 0 && this.activeTileIndex < this.tiles.length) {
            this.metroBall.setAlpha(1);
            const currentTile = this.tiles[this.activeTileIndex];
            
            // If there's a next tile, interpolate bet
            // ween them
            if (this.activeTileIndex + 1 < this.tiles.length) {
                const nextTile = this.tiles[this.activeTileIndex + 1];
                const progress = (time - this.lastBeatTime) / this.beatDuration;
                
                // Ease progress to make it look like a "bounce"
                // Parabolic arc for Y
                const bounceHeight = 80;
                const arcY = -Math.sin(progress * Math.PI) * bounceHeight;
                
                this.metroBall.x = Phaser.Math.Linear(currentTile.bg.x, nextTile.bg.x, progress);
                this.metroBall.y = Phaser.Math.Linear(currentTile.bg.y, nextTile.bg.y, progress) + arcY;
            } else {
                // Stay on last tile until reset
                this.metroBall.x = currentTile.bg.x;
                this.metroBall.y = currentTile.bg.y;
            }
        }

        if (time - this.lastBeatTime >= this.beatDuration) {
            if (this.activeTileIndex !== -1 && !this.hasTypedOnBeat) {
                this.handleMiss();
            }

            this.lastBeatTime = time;
            this.activeTileIndex++;
            this.hasTypedOnBeat = false;

            if (this.activeTileIndex >= this.tiles.length) {
                this.metroBall.setAlpha(0);
                this.completeSet();
                return;
            }

            this.highlightTile(this.activeTileIndex);
            
            // Subtle flash on beat
            this.cameras.main.flash(40, 255, 255, 255, true);
        }
    }

    highlightTile(index) {
        this.tiles.forEach((tile, i) => {
            if (i === index) {
                tile.bg.setFillStyle(0x4444FF).setStrokeStyle(6, 0xFFFFFF).setScale(1.1);
            } else {
                tile.bg.setFillStyle(0x222222).setStrokeStyle(4, 0x666666).setScale(1.0);
            }
        });
    }

    handleInput(event) {
        if (this.isGameOver || this.isBetweenLevels || this.activeTileIndex < 0 || this.hasTypedOnBeat) return;

        const typed = event.key.toUpperCase();
        const expected = this.activeTileSet[this.activeTileIndex].expectedKey;
        const timing = (this.time.now - this.lastBeatTime) / this.beatDuration;
        
        this.hasTypedOnBeat = true;

        if (typed === expected) {
            this.handleSuccess(timing);
        } else {
            this.handleError('WRONG KEY');
        }
    }

    handleSuccess(timing) {
        const isPerfect = timing < 0.25 || timing > 0.8;
        this.showFeedback(isPerfect ? 'PERFECT' : 'GREAT', isPerfect ? '#00FF00' : '#FFFF00');
        this.score += isPerfect ? 100 : 50;
        this.scoreText.setText(`SCORE: ${this.score}`);
        this.shakeTile(this.activeTileIndex);
        // Audio would go here: this.sound.play('chirp');
    }

    handleError(msg) {
        this.showFeedback(msg, '#FF0000');
        this.reduceHealth(this.currentLevel.damagePerMiss);
        // Audio would go here: this.sound.play('error');
    }

    handleMiss() {
        this.handleError('MISS');
    }

    shakeTile(index) {
        const tile = this.tiles[index];
        const targets = [tile.bg, tile.word, tile.key, tile.label];
        this.tweens.add({ targets, x: '+=6', y: '-=6', duration: 40, yoyo: true, repeat: 2 });
    }

    reduceHealth(amount) {
        if (this.isBetweenLevels) return;
        this.hp = Math.max(0, this.hp - amount);
        this.hpBar.width = 250 * (this.hp / 100);
        this.hpText.setText(`${this.hp} HP`);
        this.cameras.main.shake(100, 0.01);
        if (this.hp <= 0) this.triggerGameOver();
    }

    completeSet() {
        this.currentSet++;
        if (this.currentSet > this.currentLevel.sets) {
            this.completeLevel();
        } else {
            this.activeTileIndex = -1;
            this.activeTileSet = this.shuffleArray([...this.currentLevel.tiles]);
            this.updateTiles();
            this.setText.setText(`SET ${this.currentSet}/${this.currentLevel.sets}`);
            this.startBeat();
        }
    }

    completeLevel() {
        this.isBetweenLevels = true;
        this.showLevelDialogue();
        this.currentLevelIndex++;

        this.time.delayedCall(4000, () => {
            if (this.currentLevelIndex >= this.levels.length) {
                this.showEnding();
            } else {
                this.scene.restart({ levelIndex: this.currentLevelIndex, score: this.score });
            }
        });
    }

    showLevelDialogue() {
        const { width, height } = this.scale;

        // Dialogue that shows after each level completes
        const dialogues = [
            null, // No dialogue before level 1 (game just started)
            'Noodle forces himself to move... barely.\nFaint scratching. Too quiet for Maya to hear.',
            'He won\'t give up. He pushes harder.\nThe sounds get louder. Is anyone listening?\n\nFrom outside: "Hmm... did I hear something?"',
            'Someone\'s out there. He can feel it.\nHe knocks harder. Bang. Crash. HEAR ME.\n\nMaya\'s voice: "That\'s coming from the fridge..."',
            'That\'s her voice! She\'s close!\nKeep going! Don\'t stop! She\'s RIGHT THERE!\n\nMaya: "Something is definitely in there. Is someone in my fridge?!"',
            'The door handle moves. Light creeps in.\nShe\'s opening it. She found him.\n\nMaya: "NOODLE?! OH MY GOD!"'
        ];

        const dialogueText = dialogues[this.currentLevel.id];
        if (!dialogueText) return;

        // Create semi-transparent overlay
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85)
            .setOrigin(0)
            .setDepth(100);

        // Split text to highlight Maya's dialogue in different color
        const lines = dialogueText.split('\n');
        let yOffset = height / 2 - (lines.length * 15);

        const textObjects = [];
        lines.forEach((line) => {
            const isMayaLine = line.includes('Maya') || line.includes('From outside:');
            const color = isMayaLine ? '#FFD700' : '#FFFFFF';
            const fontSize = isMayaLine ? '22px' : '24px';

            const text = this.add.text(width / 2, yOffset, line, {
                fontSize: fontSize,
                fontFamily: 'Comic Sans MS',
                fontStyle: isMayaLine ? 'normal' : 'italic',
                fontWeight: isMayaLine ? 'bold' : 'normal',
                color: color,
                align: 'center',
                lineSpacing: 8
            }).setOrigin(0.5).setDepth(101);

            textObjects.push(text);
            yOffset += 35;
        });

        // Hold for 3.5 seconds, then fade out
        this.time.delayedCall(3500, () => {
            this.tweens.add({
                targets: [overlay, ...textObjects],
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    overlay.destroy();
                    textObjects.forEach(t => t.destroy());
                }
            });
        });
    }

    showFeedback(text, color) {
        this.feedbackText.setText(text).setColor(color).setAlpha(1).setScale(1.2);
        this.feedbackText.y = this.scale.height - 150; // Reset Y position to fixed baseline
        this.tweens.add({ targets: this.feedbackText, alpha: 0, y: '-=30', duration: 400 });
    }

    triggerGameOver() {
        if (this.isBetweenLevels) return;
        this.isGameOver = true;
        this.add.rectangle(0, 0, 800, 600, 0x000000, 0.8).setOrigin(0);
        this.add.text(400, 250, 'GAME OVER', { fontSize: '64px', fontFamily: 'Comic Sans MS', fontWeight: 'bold', color: '#FF0000' }).setOrigin(0.5);
        const btn = this.add.text(400, 350, 'RESTART', { fontSize: '32px', fontFamily: 'Comic Sans MS', color: '#FFFFFF', backgroundColor: '#444444', padding: 15 }).setOrigin(0.5).setInteractive();
        btn.on('pointerdown', () => this.scene.restart({ levelIndex: 0, score: 0 }));
    }

    showEnding() {
        this.isGameOver = true;
        this.add.rectangle(0, 0, 800, 600, 0x000000, 0.9).setOrigin(0);
        this.add.text(400, 200, 'CHALLENGE COMPLETE', { fontSize: '48px', fontFamily: 'Comic Sans MS', fontWeight: 'bold', color: '#FFFF00' }).setOrigin(0.5);
        this.add.text(400, 280, `FINAL SCORE: ${this.score}`, { fontSize: '32px', fontFamily: 'Comic Sans MS', color: '#FFFFFF' }).setOrigin(0.5);
        this.add.text(400, 350, 'You got Maya\'s attention!', { fontSize: '24px', fontFamily: 'Comic Sans MS', color: '#00FF00' }).setOrigin(0.5);
        
        const btn = this.add.text(400, 450, 'CONTINUE', { fontSize: '28px', fontFamily: 'Comic Sans MS', color: '#FFFFFF', backgroundColor: '#222222', padding: 15 }).setOrigin(0.5).setInteractive();
        btn.on('pointerdown', () => this.scene.start('EndingStoryScene'));
    }
}

class EndingStoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndingStoryScene' });
    }

    preload() {
        // Ensure the ending background is available
        this.load.image('win', 'assets/images/win.png');
    }

    create() {
        const { width, height } = this.scale;

        this.cards = [
            {
                key: 'card3_fridge_neutral',
                textX: 0.05,
                textY: 0.1,
                text:
                    'Maya hears a frantic scratching.\n' +
                    'She opens the fridge.\n' +
                    'Noodle is shivering but safe.\n' +
                    'He made it.'
            },
            {
                key: 'win',
                textX: 0.05,
                textY: 0.75,
                text:
                    'Back in the dorm.\n' +
                    'Warm blankets. Insulin.\n' +
                    'Noodle cuddles up with Maya.\n' +
                    'Life is good again.'
            }
        ];

        this.currentIndex = 0;
        this.currentBg = null;
        this.textLines = [];
        this.textLineBackgrounds = [];
        this.canAdvance = false;

        this.textStyle = {
            fontSize: '22px',
            fontFamily: 'Comic Sans MS',
            fontStyle: 'italic',
            color: '#FFFFFF',
            align: 'left'
        };

        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceKey.on('down', () => {
            if (this.canAdvance) this.advanceCard();
        });

        this.showCard(0);
    }

    showCard(index) {
        const { width, height } = this.scale;
        const card = this.cards[index];
        this.canAdvance = false;

        if (this.currentBg) this.currentBg.destroy();
        this.currentBg = this.add.image(width / 2, height / 2, card.key);
        const scale = Math.max(width / this.currentBg.width, height / this.currentBg.height);
        this.currentBg.setScale(scale);

        this._buildTextLines(card.text, card.textX, card.textY);

        this.tweens.add({
            targets: [...this.textLineBackgrounds, ...this.textLines],
            alpha: 1,
            duration: 500,
            onComplete: () => {
                this.time.delayedCall(500, () => { this.canAdvance = true; });
            }
        });
    }

    advanceCard() {
        if (this.currentIndex >= this.cards.length - 1) {
            this.scene.start('TitleScene');
            return;
        }

        this.currentIndex++;
        this.showCard(this.currentIndex);
    }

    _buildTextLines(text, normX, normY) {
        const { width, height } = this.scale;
        this.textLines.forEach(t => t.destroy());
        this.textLineBackgrounds.forEach(r => r.destroy());
        this.textLines = [];
        this.textLineBackgrounds = [];

        const lines = text.split('\n');
        const baseX = width * normX;
        const baseY = height * normY;
        const lineHeight = 30;

        lines.forEach((line, index) => {
            const y = baseY + index * lineHeight;
            const lineText = this.add.text(baseX, y, line, this.textStyle).setDepth(2).setAlpha(0);
            const bounds = lineText.getBounds();
            const rect = this.add.rectangle(bounds.centerX, bounds.centerY, bounds.width + 10, bounds.height + 5, 0x000000, 0.6).setDepth(1).setAlpha(0);
            this.textLines.push(lineText);
            this.textLineBackgrounds.push(rect);
        });
    }
}
