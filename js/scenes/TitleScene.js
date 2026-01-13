class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    preload() {
        // Load assets
        this.load.image('fridge_bg', 'assets/images/fridge_background.png');
        this.load.image('pasta', 'assets/images/pasta.png');
        this.load.image('rat', 'assets/images/rat.png');
        this.load.image('title_text', 'assets/images/title.png');
    }

    create() {
        const { width, height } = this.scale;

        // 1) Show fridge background - centered and scaled to fill canvas while preserving aspect ratio
        const bg = this.add.image(width / 2, height / 2, 'fridge_bg');
        const bgScale = Math.max(width / bg.width, height / bg.height);
        bg.setScale(bgScale);

        // 2) Fake a soft shadow from the plate onto the fridge using a dark, squashed pasta sprite
        const pastaShadow = this.add.image(width / 2, height * 0.8 + 80, 'pasta');
        // Shadow uses similar base scale but is wider and squashed vertically
        const pastaShadowBaseScale = Math.min(width / bg.width, height / bg.height);
        pastaShadow.setScale(pastaShadowBaseScale * 1.8, pastaShadowBaseScale * 1.4);
        pastaShadow.setTint(0x000000);
        pastaShadow.setAlpha(0.35);
        // Ensure shadow sits above the fridge but behind the real plate/rat
        pastaShadow.setDepth(0.1);

        // 3) Show pasta near bottom center (a bit lower so rat stands clearly on it)
        const pasta = this.add.image(width / 2, height * 0.8, 'pasta');
        // Make the pasta plate very prominent (independent of rat/title)
        const pastaScale = Math.min(width / bg.width, height / bg.height) * 1.8;
        pasta.setScale(pastaScale);
        pasta.setDepth(0.2);
        this.pastaY = pasta.y;

        // A general UI scale so rat/title stay reasonable on different resolutions
        const uiScale = Math.min(width, height) / 600;
        this.uiScale = uiScale;

        // 3) Place rat initially off screen (above), independent of pasta size
        const rat = this.add.image(width / 2 + 15, -100, 'rat');
        // Slightly smaller rat
        const ratScale = uiScale * 0.6;
        rat.setScale(ratScale);
        // Ensure rat renders above the pasta plate
        rat.setDepth(0.3);
        this.rat = rat;

        // Store references for later
        this.width = width;
        this.height = height;

        // 4) Wait 2000ms, then animate rat dropping
        this.time.delayedCall(2000, () => {
            this.dropRat();
        });
    }

    dropRat() {
        // Animate rat dropping straight down onto pasta over ~350ms with easing
        this.tweens.add({
            targets: this.rat,
            y: this.pastaY - 130, // Drop rat 120px above pasta center
            duration: 350,
            ease: 'Power2',
            onComplete: () => {
                this.showTitle();
            }
        });
    }

    showTitle() {
        // Show title_text in upper third and "pop" it in with bounce (nudged further up)
        const title = this.add.image(this.width / 2, this.height * 0.13, 'title_text');
        // Title size tuned to feel like the earlier \"good\" size
        const titleScale = this.uiScale * 1.5;
        title.setScale(0); // Start at scale 0
        
        // Pop in animation with slight overshoot/bounce
        this.tweens.add({
            targets: title,
            scale: titleScale,
            duration: 400,
            ease: 'Back.easeOut',
            easeParams: [1.5], // Overshoot amount
            onComplete: () => {
                this.showPressSpace();
            }
        });
    }

    showPressSpace() {
        // Show "PRESS SPACE TO START" below title and blink it
        const pressSpaceText = this.add.text(
            this.width / 2,
            this.height * 0.37,
            'PRESS SPACE TO START',
            {
                fontSize: '25px',
                fontFamily: 'Comic Sans MS',
                color: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        pressSpaceText.setOrigin(0.5);

        // Blink every 500ms (alpha toggle)
        this.tweens.add({
            targets: pressSpaceText,
            alpha: 0,
            duration: 750,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Listen for Space key
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceKey.on('down', () => {
            this.scene.start('StoryScene');
        });
    }
}

