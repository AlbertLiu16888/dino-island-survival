// ===== Web Audio API Sound Manager =====
// Procedural SFX + simple BGM via oscillators

const AudioMgr = {
    ctx: null,
    masterGain: null,
    bgmGain: null,
    sfxGain: null,
    bgmPlaying: false,
    bgmOscillators: [],
    enabled: true,

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);

            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.value = 0.15;
            this.bgmGain.connect(this.masterGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.4;
            this.sfxGain.connect(this.masterGain);
        } catch (e) {
            console.warn('Web Audio not supported:', e);
            this.enabled = false;
        }
    },

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    // ===== SFX Generation =====

    playNote(freq, duration, type = 'square', gainNode = null) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(gainNode || this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    // Gather resource sound
    playGather() {
        if (!this.enabled) return;
        this.resume();
        const t = this.ctx.currentTime;
        // Chopping sound - noise burst + tonal hit
        this.playNote(800, 0.08, 'square');
        setTimeout(() => this.playNote(600, 0.06, 'square'), 50);
        setTimeout(() => this.playNote(400, 0.1, 'triangle'), 100);
    },

    // Attack/slash sound
    playAttack() {
        if (!this.enabled) return;
        this.resume();
        // Quick sweep down
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    },

    // Hit/damage taken
    playHit() {
        if (!this.enabled) return;
        this.resume();
        // Low thud + noise
        this.playNote(150, 0.12, 'sine');
        this.playNote(80, 0.15, 'square');
        // Noise burst via oscillator detuning
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 100;
        osc.detune.value = 1200;
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    },

    // Dino death
    playDinoDeath() {
        if (!this.enabled) return;
        this.resume();
        // Descending tone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.55);
    },

    // Craft complete
    playCraft() {
        if (!this.enabled) return;
        this.resume();
        // Happy ascending notes
        const notes = [523, 659, 784]; // C5, E5, G5
        notes.forEach((f, i) => {
            setTimeout(() => this.playNote(f, 0.15, 'triangle'), i * 100);
        });
    },

    // Eat/use item
    playEat() {
        if (!this.enabled) return;
        this.resume();
        this.playNote(440, 0.08, 'sine');
        setTimeout(() => this.playNote(550, 0.08, 'sine'), 80);
    },

    // Equip item
    playEquip() {
        if (!this.enabled) return;
        this.resume();
        this.playNote(330, 0.06, 'square');
        setTimeout(() => this.playNote(660, 0.1, 'square'), 60);
    },

    // Player death
    playPlayerDeath() {
        if (!this.enabled) return;
        this.resume();
        const notes = [392, 349, 311, 261]; // G4, F4, Eb4, C4
        notes.forEach((f, i) => {
            setTimeout(() => this.playNote(f, 0.3, 'triangle'), i * 200);
        });
    },

    // Place item (campfire/trap)
    playPlace() {
        if (!this.enabled) return;
        this.resume();
        this.playNote(200, 0.1, 'sine');
        setTimeout(() => this.playNote(300, 0.15, 'sine'), 80);
    },

    // UI click
    playClick() {
        if (!this.enabled) return;
        this.resume();
        this.playNote(800, 0.04, 'square');
    },

    // Poison effect
    playPoison() {
        if (!this.enabled) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(350, this.ctx.currentTime + 0.2);
        osc.frequency.linearRampToValueAtTime(280, this.ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.45);
    },

    // ===== BGM =====

    startBGM(phase) {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        this.stopBGM();

        // Simple ambient loop with phase-appropriate mood
        const isNight = phase === 2;
        const isDusk = phase === 1;

        // Base drone
        const drone = this.ctx.createOscillator();
        const droneGain = this.ctx.createGain();
        drone.type = 'sine';
        drone.frequency.value = isNight ? 65 : (isDusk ? 82 : 98);
        droneGain.gain.value = 0.08;
        drone.connect(droneGain);
        droneGain.connect(this.bgmGain);
        drone.start();

        // Harmonic
        const harm = this.ctx.createOscillator();
        const harmGain = this.ctx.createGain();
        harm.type = 'sine';
        harm.frequency.value = isNight ? 130 : (isDusk ? 165 : 196);
        harmGain.gain.value = 0.04;
        harm.connect(harmGain);
        harmGain.connect(this.bgmGain);
        harm.start();

        // Slow LFO for movement
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = isNight ? 0.1 : 0.15;
        lfoGain.gain.value = isNight ? 5 : 8;
        lfo.connect(lfoGain);
        lfoGain.connect(drone.frequency);
        lfo.start();

        this.bgmOscillators = [drone, harm, lfo];
        this.bgmPlaying = true;
        this._bgmPhase = phase;
    },

    stopBGM() {
        this.bgmOscillators.forEach(osc => {
            try { osc.stop(); } catch(e) {}
        });
        this.bgmOscillators = [];
        this.bgmPlaying = false;
    },

    updateBGM(phase) {
        if (!this.enabled) return;
        if (this._bgmPhase !== phase) {
            this.startBGM(phase);
        }
    },

    setMasterVolume(v) {
        if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, v));
    },

    toggleMute() {
        if (!this.masterGain) return;
        if (this.masterGain.gain.value > 0) {
            this._prevVol = this.masterGain.gain.value;
            this.masterGain.gain.value = 0;
        } else {
            this.masterGain.gain.value = this._prevVol || 0.5;
        }
    }
};
