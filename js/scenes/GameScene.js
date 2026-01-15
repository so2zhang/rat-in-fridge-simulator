class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        // Level System (Scalable Design)
        this.levels = [
            {
                id: 1,
                bpm: 100,
                damagePerMiss: 10,
                tiles: [
                    { id: 0, word: 'APPLE', expectedKey: 'A' },
                    { id: 1, word: 'BANANA', expectedKey: 'B' },
                    { id: 2, word: 'CHERRY', expectedKey: 'C' },
                    { id: 3, word: 'DATE', expectedKey: 'D' },
                    { id: 4, word: 'EGG', expectedKey: 'E' },
                    { id: 5, word: 'FIG', expectedKey: 'F' },
                    { id: 6, word: 'GRAPE', expectedKey: 'G' },
                    { id: 7, word: 'HONEY', expectedKey: 'H' }
                ]
            },
            {
                id: 2,
                bpm: 130,
                damagePerMiss: 15,
                tiles: [
                    { id: 0, word: 'ICE', expectedKey: 'I' },
                    { id: 1, word: 'JELLY', expectedKey: 'J' },
                    { id: 2, word: 'KIWI', expectedKey: 'K' },
                    { id: 3, word: 'LEMON', expectedKey: 'L' },
                    { id: 4, word: 'MELON', expectedKey: 'M' },
                    { id: 5, word: 'NUT', expectedKey: 'N' },
                    { id: 6, word: 'ORANGE', expectedKey: 'O' },
                    { id: 7, word: 'PEAR', expectedKey: 'P' }
                ]
            }
        ];
        this.currentLevelIndex = data.levelIndex || 0;
        this.currentLevel = this.levels[this.currentLevelIndex];
        
        // Health System
        this.hp = 100;
        this.maxHp = 100;
        
        // Rhythm State
        this.activeTileIndex = -1;
        this.lastBeatTime = 0;
        this.beatDuration = (60 / this.currentLevel.bpm) * 1000;
        this.hasTypedOnBeat = false;
        this.isGameOver = false;
        this.score = 0;
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.image(width / 2, height / 2, 'fridge_bg').setAlpha(0.3).setScale(Math.max(width / 800, height / 600));

        // UI - Health Bar
        this.createUI(width, height);

        // 8 square tiles arranged in a 4x2 grid
        this.tiles = [];
        const gridCols = 4;
        const gridRows = 2;
        const tileSize = 130;
        const spacing = 30;
        const startX = width / 2 - ((gridCols * tileSize + (gridCols - 1) * spacing) / 2) + tileSize / 2;
        const startY = height / 2 - ((gridRows * tileSize + (gridRows - 1) * spacing) / 2) + tileSize / 2;

        for (let i = 0; i < this.currentLevel.tiles.length; i++) {
            const col = i % gridCols;
            const row = Math.floor(i / gridCols);
            const x = startX + col * (tileSize + spacing);
            const y = startY + row * (tileSize + spacing);

            const tileData = this.currentLevel.tiles[i];
            const tile = this.createTile(x, y, tileSize, tileData);
            this.tiles.push(tile);
        }

        // Keyboard Input
        this.input.keyboard.on('keydown', this.handleInput, this);

        // Feedback Text
        this.feedbackText = this.add.text(width / 2, height - 80, '', {
            fontSize: '56px',
            fontFamily: 'Comic Sans MS',
            fontWeight: 'bold',
            color: '#00FF00',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Score Text
        this.scoreText = this.add.text(20, 60, `SCORE: ${this.score}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        });

        // Start rhythm logic
        this.lastBeatTime = this.time.now;
    }

    createUI(width, height) {
        // Level Indicator
        this.add.text(20, 20, `LEVEL ${this.currentLevel.id}`, {
            fontSize: '28px',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#FFFFFF'
        });

        // Health Bar Background
        const barWidth = 300;
        const barHeight = 35;
        const barX = width - barWidth - 20;
        const barY = 20;

        this.add.rectangle(barX, barY, barWidth, barHeight, 0x333333).setOrigin(0);
        this.hpBar = this.add.rectangle(barX, barY, barWidth, barHeight, 0x00FF00).setOrigin(0);
        
        this.hpText = this.add.text(barX + barWidth / 2, barY + barHeight / 2, 'HP: 100', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#FFFFFF'
        }).setOrigin(0.5);
    }

    createTile(x, y, size, data) {
        // Placeholder frame
        const bg = this.add.rectangle(x, y, size, size, 0x222222, 0.8);
        bg.setStrokeStyle(4, 0x666666);

        const label = this.add.text(x, y - 30, `Slot ${data.id + 1}`, {
            fontSize: '16px',
            color: '#888888',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        const wordText = this.add.text(x, y + 10, data.word, {
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        const keyText = this.add.text(x, y + 40, `[${data.expectedKey}]`, {
            fontSize: '18px',
            color: '#FFFF00',
            fontFamily: 'Courier New'
        }).setOrigin(0.5);

        return { bg, label, wordText, keyText, data };
    }

    update(time, delta) {
        if (this.isGameOver) return;

        // Rhythm evaluation
        if (time - this.lastBeatTime >= this.beatDuration) {
            // New Beat
            if (this.activeTileIndex !== -1 && !this.hasTypedOnBeat) {
                this.showFeedback('Miss', '#FF0000');
                this.reduceHealth(this.currentLevel.damagePerMiss);
            }

            this.lastBeatTime = time;
            this.activeTileIndex = (this.activeTileIndex + 1) % this.tiles.length;
            this.hasTypedOnBeat = false;

            // Highlight new tile
            this.tiles.forEach((tile, index) => {
                if (index === this.activeTileIndex) {
                    this.tweens.add({
                        targets: tile.bg,
                        scale: 1.15,
                        duration: 100,
                        yoyo: true,
                        ease: 'Back.easeOut'
                    });
                    tile.bg.setFillStyle(0x4444FF);
                    tile.bg.setStrokeStyle(6, 0xFFFFFF);
                } else {
                    tile.bg.setFillStyle(0x222222);
                    tile.bg.setStrokeStyle(4, 0x666666);
                    tile.bg.setScale(1.0);
                }
            });
        }
    }

    handleInput(event) {
        if (this.isGameOver || this.activeTileIndex === -1 || this.hasTypedOnBeat) return;

        const typedKey = event.key.toUpperCase();
        const expectedKey = this.currentLevel.tiles[this.activeTileIndex].expectedKey;
        
        const timeSinceBeat = this.time.now - this.lastBeatTime;
        const timingRatio = timeSinceBeat / this.beatDuration;

        this.hasTypedOnBeat = true;

        if (typedKey === expectedKey) {
            // Correct key
            if (timingRatio < 0.25 || timingRatio > 0.75) {
                this.showFeedback('PERFECT', '#00FF00');
                this.score += 100;
            } else {
                this.showFeedback('GREAT', '#FFFF00');
                this.score += 50;
            }
            this.scoreText.setText(`SCORE: ${this.score}`);
            
            // Visual success on tile - SHAKE AND PULSE
            const activeTile = this.tiles[this.activeTileIndex];
            this.tweens.add({
                targets: [activeTile.bg, activeTile.wordText, activeTile.keyText, activeTile.label],
                x: '+=5',
                duration: 50,
                yoyo: true,
                repeat: 3,
                ease: 'Sine.easeInOut'
            });

            this.tweens.add({
                targets: activeTile.bg,
                alpha: 0.5,
                duration: 100,
                yoyo: true
            });
        } else {
            // Wrong key
            this.showFeedback('WRONG KEY', '#FF0000');
            this.reduceHealth(this.currentLevel.damagePerMiss);
        }
    }

    showFeedback(text, color) {
        this.feedbackText.setText(text);
        this.feedbackText.setColor(color);
        this.feedbackText.setAlpha(1);
        this.feedbackText.setScale(1.5);
        
        this.tweens.add({
            targets: this.feedbackText,
            alpha: 0,
            scale: 1,
            y: this.feedbackText.y - 40,
            duration: 400,
            onComplete: () => {
                this.feedbackText.y += 40;
            }
        });
    }

    reduceHealth(amount) {
        this.hp = Math.max(0, this.hp - amount);
        const ratio = this.hp / this.maxHp;
        
        this.tweens.add({
            targets: this.hpBar,
            width: 300 * ratio,
            duration: 200,
            ease: 'Power2'
        });

        this.hpText.setText(`HP: ${this.hp}`);

        if (this.hp <= 30) {
            this.hpBar.setFillStyle(0xFF0000);
        } else if (this.hp <= 60) {
            this.hpBar.setFillStyle(0xFFFF00);
        }

        // Screen shake on damage
        this.cameras.main.shake(150, 0.01);

        if (this.hp <= 0) {
            this.triggerGameOver();
        }
    }

    triggerGameOver() {
        this.isGameOver = true;
        const { width, height } = this.scale;

        this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);

        this.add.text(width / 2, height / 2 - 80, 'GAME OVER', {
            fontSize: '84px',
            fontFamily: 'Comic Sans MS',
            fontWeight: 'bold',
            color: '#FF0000',
            stroke: '#FFFFFF',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2, `FINAL SCORE: ${this.score}`, {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        const restartButton = this.add.text(width / 2, height / 2 + 100, 'TRY AGAIN', {
            fontSize: '32px',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            color: '#FFFFFF',
            backgroundColor: '#FF0000',
            padding: { x: 30, y: 15 }
        }).setOrigin(0.5).setInteractive();

        restartButton.on('pointerover', () => restartButton.setScale(1.1));
        restartButton.on('pointerout', () => restartButton.setScale(1.0));

        restartButton.on('pointerdown', () => {
            this.scene.restart();
        });
    }
}
