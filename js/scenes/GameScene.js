class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        // Level System (Scalable Design)
        this.levels = [
            {
                id: 1,
                bpm: 120,
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
    }

    create() {
        const { width, height } = this.scale;

        // UI - Health Bar
        this.createUI(width, height);

        // 8 square tiles arranged in a 4x2 grid
        this.tiles = [];
        const gridCols = 4;
        const gridRows = 2;
        const tileSize = 120;
        const spacing = 20;
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
        this.feedbackText = this.add.text(width / 2, height - 100, '', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#00FF00',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Start rhythm logic
        this.lastBeatTime = this.time.now;
    }

    createUI(width, height) {
        // Level Indicator
        this.add.text(20, 20, `LEVEL ${this.currentLevel.id}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        });

        // Health Bar Background
        const barWidth = 300;
        const barHeight = 30;
        const barX = width - barWidth - 20;
        const barY = 20;

        this.add.rectangle(barX, barY, barWidth, barHeight, 0x333333).setOrigin(0);
        this.hpBar = this.add.rectangle(barX, barY, barWidth, barHeight, 0x00FF00).setOrigin(0);
        
        this.hpText = this.add.text(barX + barWidth / 2, barY + barHeight / 2, 'HP: 100', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#FFFFFF'
        }).setOrigin(0.5);
    }

    createTile(x, y, size, data) {
        // Placeholder frame
        const bg = this.add.rectangle(x, y, size, size, 0x444444);
        bg.setStrokeStyle(4, 0x888888);

        const label = this.add.text(x, y - 20, `Slot ${data.id + 1}`, {
            fontSize: '16px',
            color: '#AAAAAA'
        }).setOrigin(0.5);

        const wordText = this.add.text(x, y + 20, data.word, {
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        return { bg, label, wordText, data };
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
                    tile.bg.setFillStyle(0x6666FF);
                    tile.bg.setStrokeStyle(6, 0xFFFFFF);
                    tile.bg.setScale(1.1);
                } else {
                    tile.bg.setFillStyle(0x444444);
                    tile.bg.setStrokeStyle(4, 0x888888);
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
            if (timingRatio < 0.3) {
                this.showFeedback('Perfect', '#00FF00');
            } else if (timingRatio < 0.7) {
                this.showFeedback('Early/Late', '#FFFF00');
            } else {
                this.showFeedback('Perfect', '#00FF00'); // Snapping to next beat window logic can be added
            }
        } else {
            // Wrong key
            this.showFeedback('Wrong!', '#FF0000');
            this.reduceHealth(this.currentLevel.damagePerMiss);
        }
    }

    showFeedback(text, color) {
        this.feedbackText.setText(text);
        this.feedbackText.setColor(color);
        this.feedbackText.setAlpha(1);
        
        this.tweens.add({
            targets: this.feedbackText,
            alpha: 0,
            y: this.feedbackText.y - 20,
            duration: 500,
            onComplete: () => {
                this.feedbackText.y += 20;
            }
        });
    }

    reduceHealth(amount) {
        this.hp = Math.max(0, this.hp - amount);
        const ratio = this.hp / this.maxHp;
        this.hpBar.width = 300 * ratio;
        this.hpText.setText(`HP: ${this.hp}`);

        if (this.hp <= 0) {
            this.triggerGameOver();
        }
    }

    triggerGameOver() {
        this.isGameOver = true;
        const { width, height } = this.scale;

        this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

        this.add.text(width / 2, height / 2 - 50, 'GAME OVER', {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#FF0000'
        }).setOrigin(0.5);

        const restartButton = this.add.text(width / 2, height / 2 + 50, 'RESTART', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        restartButton.on('pointerdown', () => {
            this.scene.restart();
        });
    }
}
