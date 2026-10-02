/**
 * Culture Game - Audio Manager
 * Handles background music, sound effects, volume control, and transitions.
 */

class AudioManager {
    constructor() {
        this.basePath = 'assets/audio/';
        
        // Settings
        this.musicVolume = parseFloat(localStorage.getItem('culture_game_music_volume'));
        if (isNaN(this.musicVolume)) this.musicVolume = 0.35;
        
        this.sfxVolume = parseFloat(localStorage.getItem('culture_game_sfx_volume'));
        if (isNaN(this.sfxVolume)) this.sfxVolume = 0.70;
        
        this.muted = localStorage.getItem('culture_game_muted') === 'true';

        // State
        this.currentMusicName = null;
        this.musicAudio = null;
        this.initialized = false;
        
        // Note: Audio context is now unlocked explicitly via user interaction (e.g. click "START GAME")
    }

    unlockAudio() {
        if (!this.initialized) {
            console.log("[AUDIO DEBUG] AudioContext unlocked by user interaction.");
            this.initialized = true;
            // Create a silent audio to unlock context on iOS/browsers if needed
            const dummy = new Audio();
            dummy.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
            dummy.play().catch(e => console.warn("Dummy audio failed:", e));
        }
    }

    /**
     * Plays background music. Crossfades/transitions if possible.
     */
    playMusic(trackName) {
        if (!trackName) return;
        
        // Prevent restarting the exact same track unnecessarily
        if (this.currentMusicName === trackName && this.musicAudio && !this.musicAudio.paused) {
            return;
        }

        const oldAudio = this.musicAudio;
        this.currentMusicName = trackName;

        const newAudio = new Audio(`${this.basePath}${trackName}`);
        newAudio.loop = true;
        newAudio.volume = this.muted ? 0 : this.musicVolume;
        
        this.musicAudio = newAudio;

        // Play the new audio
        newAudio.play().catch(err => {
            console.warn(`[AudioManager] Missing or blocked music: ${trackName}`, err);
        });

        // Fade out the old audio if it exists
        if (oldAudio) {
            this._fadeOutAndStop(oldAudio);
        }
    }

    stopMusic() {
        if (this.musicAudio) {
            this._fadeOutAndStop(this.musicAudio);
            this.musicAudio = null;
            this.currentMusicName = null;
        }
    }
    
    pauseMusic() {
        if (this.musicAudio) {
            this.musicAudio.pause();
        }
    }
    
    resumeMusic() {
        if (this.musicAudio && this.musicAudio.paused) {
            this.musicAudio.play().catch(err => {
                console.warn(`[AudioManager] Resume blocked:`, err);
            });
        }
    }

    /**
     * Plays a sound effect once.
     */
    playSFX(sfxName) {
        if (this.muted || !sfxName) return;

        const sfx = new Audio(`${this.basePath}${sfxName}`);
        sfx.volume = this.sfxVolume;
        sfx.play().catch(err => {
            console.warn(`[AudioManager] Missing or blocked SFX: ${sfxName}`, err);
        });
    }

    // --- Settings & Volume Controls ---

    setMusicVolume(vol) {
        this.musicVolume = Math.max(0, Math.min(1, vol));
        localStorage.setItem('culture_game_music_volume', this.musicVolume);
        
        if (this.musicAudio && !this.muted) {
            this.musicAudio.volume = this.musicVolume;
        }
    }

    setSFXVolume(vol) {
        this.sfxVolume = Math.max(0, Math.min(1, vol));
        localStorage.setItem('culture_game_sfx_volume', this.sfxVolume);
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('culture_game_muted', this.muted);
        
        if (this.musicAudio) {
            this.musicAudio.volume = this.muted ? 0 : this.musicVolume;
        }
        return this.muted;
    }

    isMuted() {
        return this.muted;
    }

    // --- Helpers ---

    _fadeOutAndStop(audioElement) {
        if (!audioElement) return;
        
        const fadeDuration = 500; // ms
        const fadeSteps = 10;
        const stepTime = fadeDuration / fadeSteps;
        const startVolume = audioElement.volume;
        let currentStep = 0;

        const fadeInterval = setInterval(() => {
            currentStep++;
            const newVol = startVolume * (1 - (currentStep / fadeSteps));
            
            if (newVol > 0 && !this.muted) {
                audioElement.volume = newVol;
            } else {
                audioElement.volume = 0;
            }

            if (currentStep >= fadeSteps) {
                clearInterval(fadeInterval);
                audioElement.pause();
                audioElement.currentTime = 0;
                audioElement.removeAttribute('src'); // Clean up memory
                audioElement.load();
            }
        }, stepTime);
    }
}

// Global Singleton
window.audioManager = new AudioManager();
