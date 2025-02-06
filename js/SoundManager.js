class SoundManager {
    constructor() {
        this.sounds = {
            dealCard: new Audio('sounds/card-deal.mp3'),
            chip: new Audio('sounds/chip.mp3'),
            fold: new Audio('sounds/fold.mp3'),
            check: new Audio('sounds/check.mp3'),
            call: new Audio('sounds/call.mp3'),
            raise: new Audio('sounds/raise.mp3'),
            win: new Audio('sounds/win.mp3')
        };
        
        // Preload all sounds
        Object.values(this.sounds).forEach(sound => {
            sound.load();
            sound.volume = 0.5;
        });
    }

    play(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Sound playback prevented'));
        }
    }

    setVolume(volume) {
        Object.values(this.sounds).forEach(sound => {
            sound.volume = volume;
        });
    }

    mute() {
        Object.values(this.sounds).forEach(sound => {
            sound.muted = true;
        });
    }

    unmute() {
        Object.values(this.sounds).forEach(sound => {
            sound.muted = false;
        });
    }
}