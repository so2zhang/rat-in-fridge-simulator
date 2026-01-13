class StoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StoryScene' });
    }

    preload() {
        // Story card backgrounds (paths adjusted to match current project layout)
        this.load.image('card1_dorm', 'assets/images/card1_dorm.png');
        this.load.image('card2_pasta', 'assets/images/card2_pasta.png');
        this.load.image('card3_fridge_neutral', 'assets/images/card3_fridge_neutral.png');
        this.load.image('card4_fridge_cold', 'assets/images/card4_fridge_cold.png');
        this.load.image('card5_black', 'assets/images/card5_black.png');
    }

    create() {
        const { width, height } = this.scale;

        // Card data: background key + exact story text
        this.cards = [
            {
                key: 'card1_dorm',
                textX: 0.05,
                textY: 0.1,
                text:
                    'Tuesday night. Maya’s dorm.\n' +
                    'Another study session, \n' +
                    'stretching late.\n' +
                    'Dinner sits on the floor.\n' +
                    'Leftover pasta.'
            },
            {
                key: 'card2_pasta',
                textX: 0.05,
                textY: 0.8,
                text:
                    'Maya feeds her best friend while she studies.\n' +
                    'Noodle knows the routine.\n' +
                    'The pasta is warm. He burrows in.\n' +
                    'Just for a moment.'
            },
            {
                key: 'card3_fridge_neutral',
                textX: 0.05,
                textY: 0.1,
                text:
                    'The next day Maya’s roommate cleans up the room.\n' +
                    'They see leftovers.\n' +
                    'They don’t see Noodle.\n' +
                    'The plate goes into the fridge.\n' +
                    'The door closes.'
            },
            {
                key: 'card4_fridge_cold',
                textX: 0.05,
                textY: 0.7,
                text:
                    'The fridge is cold.\n' +
                    'Too cold for a small body.\n' +
                    'The pasta traps a little warmth.\n' +
                    'It buys some time.\n' +
                    'But Noodle is diabetic.\n' +
                    'He needs his insulin soon.'
            },
            {
                key: 'card5_black',
                textX: 0.05,
                textY: 0.1,
                text:
                    'Maya is looking for him now.\n' +
                    'She knows something is wrong.\n' +
                    'Noodle can hear her.\n' +
                    'She just can’t hear him yet.\n' +
                    'Help Noodle get her attention.'
            }
        ];

        this.currentIndex = 0;
        this.currentBg = null;
        this.nextBg = null;
        this.textLines = [];
        this.textLineBackgrounds = [];
        this.canAdvance = false;
        this.isTransitioning = false;

        // Common text style for all story lines
        this.textStyle = {
            fontSize: '22px',
            fontFamily: 'Comic Sans MS',
            fontStyle: 'italic',
            color: '#FFFFFF',
            align: 'left'
        };

        // Input: Space to advance, with debounce per card
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceKey.on('down', () => {
            if (!this.canAdvance || this.isTransitioning) {
                return;
            }
            this.advanceCard();
        });

        // Show first card
        this.showCard(this.currentIndex, true);
    }

    showCard(index, isFirst = false) {
        const { width, height } = this.scale;
        const card = this.cards[index];
        this.canAdvance = false;
        this.isTransitioning = false;

        // Create background if first time, otherwise reuse nextBg logic
        if (!this.currentBg) {
            this.currentBg = this.add.image(width / 2, height / 2, card.key);
            this.currentBg.setDepth(0);
            this._fitToScreen(this.currentBg, width, height);
        } else {
            this.currentBg.setTexture(card.key);
            this._fitToScreen(this.currentBg, width, height);
            this.currentBg.setAlpha(1);
        }

        // Build one text object + background per line, then fade them in
        this._buildTextLines(card.text, card.textX, card.textY);

        this.tweens.add({
            targets: [...this.textLineBackgrounds, ...this.textLines],
            alpha: 1,
            duration: 300,
            onComplete: () => {
                // Small delay before allowing advance to prevent accidental skipping
                this.time.delayedCall(500, () => {
                    this.canAdvance = true;
                });
            }
        });
    }

    advanceCard() {
        if (this.currentIndex >= this.cards.length - 1) {
            // End of story -> start main game
            this.scene.start('GameScene');
            return;
        }

        const { width, height } = this.scale;
        const nextIndex = this.currentIndex + 1;
        const nextCard = this.cards[nextIndex];

        this.canAdvance = false;
        this.isTransitioning = true;

        // Prepare next background for crossfade
        this.nextBg = this.add.image(width / 2, height / 2, nextCard.key);
        this.nextBg.setDepth(0);
        this._fitToScreen(this.nextBg, width, height);
        this.nextBg.setAlpha(0);

        // Fade out current text (all lines + their backgrounds)
        this.tweens.add({
            targets: [...this.textLineBackgrounds, ...this.textLines],
            alpha: 0,
            duration: 200,
            onComplete: () => {
                // Crossfade backgrounds
                this.tweens.add({
                    targets: this.currentBg,
                    alpha: 0,
                    duration: 300
                });

                this.tweens.add({
                    targets: this.nextBg,
                    alpha: 1,
                    duration: 300,
                    onComplete: () => {
                        // Swap references
                        this.currentBg.destroy();
                        this.currentBg = this.nextBg;
                        this.nextBg = null;

                        // Update index and show new text with fade-in
                        this.currentIndex = nextIndex;
                        this._buildTextLines(nextCard.text, nextCard.textX, nextCard.textY);
                        this.tweens.add({
                            targets: [...this.textLineBackgrounds, ...this.textLines],
                            alpha: 1,
                            duration: 300,
                            onComplete: () => {
                                this.time.delayedCall(500, () => {
                                    this.canAdvance = true;
                                    this.isTransitioning = false;
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    _fitToScreen(image, width, height) {
        const scale = Math.max(width / image.width, height / image.height);
        image.setScale(scale);
    }

    _buildTextLines(text, normX = 0.2, normY = 0.7) {
        const { width, height } = this.scale;

        // Destroy any existing line objects
        this.textLines.forEach(t => t.destroy());
        this.textLineBackgrounds.forEach(r => r.destroy());
        this.textLines = [];
        this.textLineBackgrounds = [];

        const lines = text.split('\n');
        const baseX = width * normX;
        const baseY = height * normY;

        const fontSize = parseInt(this.textStyle.fontSize, 10) || 22;
        const lineSpacing = 8;
        const lineHeight = fontSize + lineSpacing;

        const paddingX = 18;
        const paddingY = 6;

        lines.forEach((line, index) => {
            const y = baseY + index * lineHeight;

            const lineText = this.add.text(baseX, y, line, this.textStyle);
            lineText.setOrigin(0, 0.5);
            lineText.setDepth(2);
            lineText.setAlpha(0);

            const bounds = lineText.getBounds();
            const rect = this.add.rectangle(
                bounds.centerX,
                bounds.centerY,
                bounds.width + paddingX,
                bounds.height + paddingY,
                0x000000,
                0.55
            );
            rect.setDepth(1);
            rect.setAlpha(0);

            this.textLines.push(lineText);
            this.textLineBackgrounds.push(rect);
        });
    }
}

