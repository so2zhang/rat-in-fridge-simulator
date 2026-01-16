class InstructionsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InstructionsScene' });
    }

    preload() {
        // Ensure background is available even if this scene is entered directly
        this.load.image('fridge_bg', 'assets/images/fridge_background.png');
    }

    create() {
        const { width, height } = this.scale;

        // Background image at 15% opacity, scaled to cover
        const bg = this.add.image(width / 2, height / 2, 'fridge_bg');
        const bgScale = Math.max(width / bg.width, height / bg.height);
        bg.setScale(bgScale);
        bg.setAlpha(0.15);

        // Dark overlay
        this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

        // Title
        this.add.text(width / 2, 80, '⚠️ HOW TO STAY ALIVE ⚠️', {
            fontSize: '42px',
            fontFamily: 'Comic Sans MS',
            fontStyle: 'bold',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Main explanation text
        const bodyText =
            'Noodle is freezing and losing consciousness.\n' +
            'The cold slows his heart. His thoughts scatter.\n\n' +
            'Type the words racing through his mind to keep him focused.\n' +
            'Each word you type keeps him alert enough to move and signal.\n\n' +
            'If he stays conscious, he can scratch and thump—\n' +
            'loud enough for Maya to hear.\n' +
            'Miss the beat = he fades. Lose focus = he gets quieter.\n' +
            'Keep typing. Keep him fighting. Keep him alive.';

        this.add.text(width / 2, 130, bodyText, {
            fontSize: '22px',
            fontFamily: 'Comic Sans MS',
            color: '#FFFFFF',
            align: 'center',
            lineSpacing: 8,
            wordWrap: { width: 700 }
        }).setOrigin(0.5, 0);

        // Rhythm indicator
        this.add.text(width / 2, 515, "Watch the bouncing rat - that's the rhythm of his heartbeat", {
            fontSize: '22px',
            fontFamily: 'Comic Sans MS',
            color:'#FFD700'
        }).setOrigin(0.5);

        // Health warning
        this.add.text(width / 2, 545, "The insulin meter is his consciousness. Don't let it reach zero.", {
            fontSize: '22px',
            fontFamily: 'Comic Sans MS',
            fontStyle: 'bold',
            color: '#FFD700'
        }).setOrigin(0.5);
       

        // Spacebar starts the game with a smooth fade
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceKey.on('down', () => {
            if (this.isTransitioning) return;
            this.isTransitioning = true;
            this.cameras.main.fadeOut(250, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene', { levelIndex: 0, score: 0 });
            });
        });
    }
}


