class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        const { width, height } = this.scale;

        // Placeholder for main gameplay
        this.add.text(
            width / 2,
            height / 2,
            'GameScene\n(Main gameplay goes here)',
            {
                fontSize: '48px',
                fontFamily: 'Arial',
                color: '#FFFFFF',
                align: 'center'
            }
        ).setOrigin(0.5);
    }
}

