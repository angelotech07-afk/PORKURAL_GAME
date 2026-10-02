/**
 * Culture Game - Rig Animator
 * JS-driven skeletal animation system.
 */

class RigAnimator {
    constructor(domElements, isBoss = false, fighterName = "") {
        this.elements = domElements;
        this.isBoss = isBoss;
        this.fighterName = fighterName;
        
        // Current actual angles/positions
        this.currentPose = this.getDefaultPose();
        
        // Target angles/positions based on state
        this.targetPose = this.getDefaultPose();
        
        // The speed at which we lerp (interpolate) to the target pose
        this.lerpSpeed = 15; 
        
        // We will store the current animation phase to avoid overriding explicitly timed keyframes
        this.currentAnimState = 'IDLE';
    }
    
    getDefaultPose() {
        return {
            torsoRot: 0, torsoY: 0, torsoX: 0,
            headRot: 0,
            armUpperLRot: 0, armLowerLRot: 0, armUpperLX: 0, armUpperLY: 0,
            armUpperRRot: 0, armLowerRRot: 0,
            legUpperLRot: 0, legLowerLRot: 0,
            legUpperRRot: 0, legLowerRRot: 0,
            weaponRot: 0,
            shieldRot: 0, shieldX: 0, shieldY: 0
        };
    }
    
    // Smoothly interpolate current pose towards target pose
    update(dt) {
        const t = Math.min(1.0, dt * this.lerpSpeed);
        
        const defaultPose = this.getDefaultPose();
        for (let key in this.currentPose) {
            let targetVal = this.targetPose[key];
            if (targetVal === undefined) targetVal = defaultPose[key];
            this.currentPose[key] += (targetVal - this.currentPose[key]) * t;
        }
        
        this.applyToDOM();
    }
    
    applyToDOM() {
        if (!this.elements.torso) return; // Rig not initialized
        
        const p = this.currentPose;
        
        this.elements.torso.style.transform = `translate(${p.torsoX}px, ${p.torsoY}px) rotate(${p.torsoRot}deg)`;
        this.elements.head.style.transform = `rotate(${p.headRot}deg)`;
        
        this.elements.armUpperL.style.transform = `translate(${p.armUpperLX}px, ${p.armUpperLY}px) rotate(${p.armUpperLRot}deg)`;
        this.elements.armLowerL.style.transform = `rotate(${p.armLowerLRot}deg)`;
        
        this.elements.armUpperR.style.transform = `rotate(${p.armUpperRRot}deg)`;
        this.elements.armLowerR.style.transform = `rotate(${p.armLowerRRot}deg)`;
        
        this.elements.legUpperL.style.transform = `rotate(${p.legUpperLRot}deg)`;
        this.elements.legLowerL.style.transform = `rotate(${p.legLowerLRot}deg)`;
        
        this.elements.legUpperR.style.transform = `rotate(${p.legUpperRRot}deg)`;
        this.elements.legLowerR.style.transform = `rotate(${p.legLowerRRot}deg)`;
        
        if (this.elements.shield) {
            this.elements.shield.style.transform = `translate(${p.shieldX}px, ${p.shieldY}px) rotate(${p.shieldRot}deg)`;
        }
        if (this.elements.weapon) {
            this.elements.weapon.style.transform = `rotate(${p.weaponRot}deg)`;
        }
    }
    
    // Called by CombatEngine state machine to set absolute pose targets
    setPose(poseName, progress = 0) {
        this.currentAnimState = poseName;
        
        if (this.isBoss && this.fighterName === "Gurukkal Raman" && this.elements.weapon) {
            // Ensure the base weapon is the urumi when not explicitly in an attack phase
            if (!poseName.startsWith('ATTACK')) {
                this.elements.weapon.style.backgroundImage = "url('/assets/characters/boss/urumi.svg')";
            }
        }
        

        if (poseName === 'IDLE') {
            // Breathing animation logic (sine wave based on time)
            const time = performance.now() / 1000;
            const breath = Math.sin(time * 3) * 2;
            
            this.targetPose = {
                torsoRot: 5, torsoY: breath, torsoX: 0,
                headRot: -5 + breath,
                armUpperLRot: 20 + breath, armLowerLRot: -30,
                armUpperRRot: -10 - breath, armLowerRRot: -45,
                legUpperLRot: -10, legLowerLRot: 10,
                legUpperRRot: 15, legLowerRRot: 0,
                weaponRot: -20,
                shieldRot: 10
            };
            this.lerpSpeed = 10;
        } 
        else if (poseName === 'WALK' || poseName === 'RUN') {
            const time = performance.now() / 1000;
            const speedMultiplier = poseName === 'RUN' ? 12 : 8;
            const stride = Math.sin(time * speedMultiplier);
            const strideAmount = poseName === 'RUN' ? 40 : 25;
            
            this.targetPose = {
                torsoRot: 10, torsoY: Math.abs(stride) * -5, torsoX: 0,
                headRot: -5,
                armUpperLRot: stride * 30, armLowerLRot: -20,
                armUpperRRot: -stride * 30, armLowerRRot: -40,
                legUpperLRot: -stride * strideAmount, legLowerLRot: Math.max(0, stride * 30),
                legUpperRRot: stride * strideAmount, legLowerRRot: Math.max(0, -stride * 30),
                weaponRot: -10,
                shieldRot: 15
            };
            this.lerpSpeed = 15;
        }
        else if (poseName === 'JUMP') {
            this.targetPose = {
                torsoRot: 15, torsoY: -10, torsoX: 0,
                headRot: -10,
                armUpperLRot: -40, armLowerLRot: -20,
                armUpperRRot: -60, armLowerRRot: -40,
                legUpperLRot: -30, legLowerLRot: 40,
                legUpperRRot: 10, legLowerRRot: 60,
                weaponRot: -30,
                shieldRot: 20
            };
            this.lerpSpeed = 20;
        }
        else if (poseName === 'DEFEND') {
            this.targetPose = {
                torsoRot: -10, torsoY: 5, torsoX: -5,
                headRot: 10,
                armUpperLRot: -80, armLowerLRot: -110, // Bring arm across chest
                armUpperRRot: -20, armLowerRRot: -90, // Weapon back
                legUpperLRot: -15, legLowerLRot: 20,
                legUpperRRot: 30, legLowerRRot: 10,
                weaponRot: 0,
                shieldRot: 0
            };
            this.lerpSpeed = 25;
        }
        else if (poseName === 'DODGE') {
            this.targetPose = {
                torsoRot: 30, torsoY: 15, torsoX: -20,
                headRot: -20,
                armUpperLRot: -40, armLowerLRot: -10,
                armUpperRRot: -50, armLowerRRot: -20,
                legUpperLRot: -40, legLowerLRot: 60,
                legUpperRRot: 40, legLowerRRot: 50,
                weaponRot: -40,
                shieldRot: 30
            };
            this.lerpSpeed = 30;
        }
        else if (poseName === 'HIT') {
            this.targetPose = {
                torsoRot: -30, torsoY: -10, torsoX: -15,
                headRot: 40,
                armUpperLRot: 40, armLowerLRot: 20,
                armUpperRRot: 60, armLowerRRot: 10,
                legUpperLRot: 10, legLowerLRot: 5,
                legUpperRRot: 40, legLowerRRot: 15,
                weaponRot: 50,
                shieldRot: 40
            };
            this.lerpSpeed = 30;
        }
        else if (poseName === 'KNOCKBACK') {
            this.targetPose = {
                torsoRot: -60, torsoY: -20, torsoX: -30,
                headRot: 50,
                armUpperLRot: 80, armLowerLRot: 10,
                armUpperRRot: 100, armLowerRRot: 0,
                legUpperLRot: 30, legLowerLRot: 0,
                legUpperRRot: 60, legLowerRRot: 10,
                weaponRot: 80,
                shieldRot: 60
            };
            this.lerpSpeed = 25;
        }
        else if (poseName === 'DEFEAT') {
            this.targetPose = {
                torsoRot: -90, torsoY: 50, torsoX: -40,
                headRot: 40,
                armUpperLRot: 120, armLowerLRot: 10,
                armUpperRRot: 140, armLowerRRot: 10,
                legUpperLRot: 10, legLowerLRot: 0,
                legUpperRRot: 30, legLowerRRot: 0,
                weaponRot: 120,
                shieldRot: 90
            };
            this.lerpSpeed = 10;
        }
        else if (poseName === 'ATTACK_LIGHT') {
            // progress is 0 to 1 based on attack phases
            this.lerpSpeed = 40; // Fast snaps for combat
            if (this.isBoss && this.fighterName === "Gurukkal Raman") {
                // Urumi light attack (whipping motion)
                if (progress < 0.3) { // WIND-UP
                    if (this.elements.weapon) this.elements.weapon.style.backgroundImage = "url('/assets/characters/boss/urumi.svg')";
                    this.targetPose = {
                        torsoRot: -30, torsoY: 0, torsoX: -10, headRot: 10,
                        armUpperRRot: 80, armLowerRRot: -120, weaponRot: 90, // Whip coiled back
                        armUpperLRot: -30, armLowerLRot: -20, // Shield counterbalance
                        legUpperLRot: -10, legLowerLRot: 10, legUpperRRot: 20, legLowerRRot: 5,
                        shieldRot: 15
                    };
                } else if (progress < 0.6) { // ACTIVE
                    if (this.elements.weapon) this.elements.weapon.style.backgroundImage = "url('/assets/characters/boss/urumi_active.svg')";
                    this.targetPose = {
                        torsoRot: 40, torsoY: 5, torsoX: 10, headRot: -10,
                        armUpperRRot: -80, armLowerRRot: -20, weaponRot: -120, // Whip cracks forward
                        armUpperLRot: -80, armLowerLRot: -60, // Throw shield arm back for power
                        legUpperLRot: -30, legLowerLRot: 20, legUpperRRot: 30, legLowerRRot: 10,
                        shieldRot: -20
                    };
                } else { // RECOVERY
                    if (this.elements.weapon) this.elements.weapon.style.backgroundImage = "url('/assets/characters/boss/urumi_recoil.svg')";
                    this.targetPose = {
                        torsoRot: 15, torsoY: 0, torsoX: 5, headRot: 0,
                        armUpperRRot: -50, armLowerRRot: -30, weaponRot: -50, // Whip recoil
                        armUpperLRot: -40, armLowerLRot: -30,
                        legUpperLRot: -10, legLowerLRot: 10, legUpperRRot: 15, legLowerRRot: 0,
                        shieldRot: 10
                    };
                }
            } else {
                if (progress < 0.3) { // WIND-UP
                    this.targetPose = {
                        torsoRot: -20, torsoY: 0, torsoX: -10, headRot: 10,
                        armUpperRRot: 60, armLowerRRot: -90, weaponRot: 40, // Sword pulled back
                        armUpperLRot: -30, armLowerLRot: -20, // Shield counterbalance
                        legUpperLRot: -10, legLowerLRot: 10, legUpperRRot: 20, legLowerRRot: 5,
                        shieldRot: 15
                    };
                } else if (progress < 0.6) { // ACTIVE
                    this.targetPose = {
                        torsoRot: 30, torsoY: 5, torsoX: 10, headRot: -10,
                        armUpperRRot: -90, armLowerRRot: 0, weaponRot: -80, // Sword thrust forward
                        armUpperLRot: -80, armLowerLRot: -60, // Throw shield arm back for power
                        legUpperLRot: -30, legLowerLRot: 20, legUpperRRot: 30, legLowerRRot: 10,
                        shieldRot: -20
                    };
                } else { // RECOVERY
                    this.targetPose = {
                        torsoRot: 10, torsoY: 0, torsoX: 5, headRot: 0,
                        armUpperRRot: -60, armLowerRRot: -20, weaponRot: -40,
                        armUpperLRot: -40, armLowerLRot: -30,
                        legUpperLRot: -10, legLowerLRot: 10, legUpperRRot: 15, legLowerRRot: 0,
                        shieldRot: 10
                    };
                }
            }
        }
        else if (poseName === 'ATTACK_HEAVY') {
            this.lerpSpeed = 35;
            if (this.isBoss && this.fighterName === "Gurukkal Raman") {
                if (progress < 0.4) {
                    if (this.elements.weapon) this.elements.weapon.style.backgroundImage = "url('/assets/characters/boss/urumi.svg')";
                    this.targetPose = {
                        torsoRot: -40, torsoY: 10, torsoX: -15, headRot: 20,
                        armUpperRRot: 160, armLowerRRot: -20, weaponRot: 150, // Urumi way back
                        armUpperLRot: -40, armLowerLRot: -20,
                        legUpperLRot: -20, legLowerLRot: 15, legUpperRRot: 25, legLowerRRot: 10,
                        shieldRot: 20
                    };
                } else if (progress < 0.7) {
                    if (this.elements.weapon) this.elements.weapon.style.backgroundImage = "url('/assets/characters/boss/urumi_active.svg')";
                    this.targetPose = {
                        torsoRot: 60, torsoY: 15, torsoX: 20, headRot: -20,
                        armUpperRRot: -140, armLowerRRot: 0, weaponRot: -160, // Urumi massive sweep
                        armUpperLRot: -40, armLowerLRot: -30,
                        legUpperLRot: -20, legLowerLRot: 20, legUpperRRot: 10, legLowerRRot: 15,
                        shieldRot: 0
                    };
                } else { // RECOVERY
                    if (this.elements.weapon) this.elements.weapon.style.backgroundImage = "url('/assets/characters/boss/urumi_recoil.svg')";
                    this.targetPose = {
                        torsoRot: 25, torsoY: 5, torsoX: 10, headRot: -10,
                        armUpperRRot: -60, armLowerRRot: -20, weaponRot: -60, // Urumi wavy recoil
                        armUpperLRot: -30, armLowerLRot: -20,
                        legUpperLRot: -10, legLowerLRot: 10, legUpperRRot: 15, legLowerRRot: 10,
                        shieldRot: 10
                    };
                }
            } else {
                if (progress < 0.4) { // WIND-UP (Longer)
                    this.targetPose = {
                        torsoRot: -40, torsoY: -10, torsoX: -15, headRot: 20,
                        armUpperRRot: 120, armLowerRRot: -90, weaponRot: 90, // Sword high above head
                        armUpperLRot: 40, armLowerLRot: -40,
                        legUpperLRot: 0, legLowerLRot: 10, legUpperRRot: 40, legLowerRRot: 30,
                        shieldRot: 20
                    };
                } else if (progress < 0.7) { // ACTIVE
                    this.targetPose = {
                        torsoRot: 50, torsoY: 15, torsoX: 20, headRot: -20,
                        armUpperRRot: -110, armLowerRRot: -20, weaponRot: -110, // Smashed down
                        armUpperLRot: -90, armLowerLRot: -80,
                        legUpperLRot: -40, legLowerLRot: 30, legUpperRRot: 20, legLowerRRot: 40,
                        shieldRot: -30
                    };
                } else { // RECOVERY
                    this.targetPose = {
                        torsoRot: 20, torsoY: 5, torsoX: 10, headRot: -10,
                        armUpperRRot: -80, armLowerRRot: -30, weaponRot: -80,
                        armUpperLRot: -50, armLowerLRot: -40,
                        legUpperLRot: -20, legLowerLRot: 20, legUpperRRot: 10, legLowerRRot: 20,
                        shieldRot: 0
                    };
                }
            }
        }
    }
}
