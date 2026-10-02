const fs = require('fs');
const jsPath = '../js/rig-animator.js';
let js = fs.readFileSync(jsPath, 'utf8');

if (!js.includes('shieldRot:')) {
    // 1. Add to getDefaultPose
    js = js.replace(/weaponRot: 0/g, 'weaponRot: 0,\n            shieldRot: 0');
    
    // 2. Add to applyToDOM
    js = js.replace(/if \(this.elements.weapon\) \{/g, 
        `if (this.elements.shield) {
            this.elements.shield.style.transform = \`rotate(\${p.shieldRot}deg)\`;
        }
        if (this.elements.weapon) {`);
        
    // 3. Update poses with shieldRot
    // IDLE
    js = js.replace(/weaponRot: -20/g, 'weaponRot: -20,\n                shieldRot: 10');
    // WALK / RUN
    js = js.replace(/weaponRot: -10\n            \};\n            this.lerpSpeed = 15/g, 'weaponRot: -10,\n                shieldRot: 15\n            };\n            this.lerpSpeed = 15');
    // JUMP
    js = js.replace(/weaponRot: -30\n            \};\n            this.lerpSpeed = 20/g, 'weaponRot: -30,\n                shieldRot: 20\n            };\n            this.lerpSpeed = 20');
    
    // DEFEND (Crucial)
    js = js.replace(/armUpperLRot: -60, armLowerLRot: -80, \/\/ Shield up\n                armUpperRRot: -20, armLowerRRot: -90, \/\/ Weapon back\n                legUpperLRot: -15, legLowerLRot: 20,\n                legUpperRRot: 30, legLowerRRot: 10,\n                weaponRot: 0/g,
        `armUpperLRot: -80, armLowerLRot: -110, // Bring arm across chest
                armUpperRRot: -20, armLowerRRot: -90, // Weapon back
                legUpperLRot: -15, legLowerLRot: 20,
                legUpperRRot: 30, legLowerRRot: 10,
                weaponRot: 0,
                shieldRot: -30 // Tilt shield to block`);
                
    // DODGE
    js = js.replace(/weaponRot: -40\n            \};\n            this.lerpSpeed = 30/g, 'weaponRot: -40,\n                shieldRot: 30\n            };\n            this.lerpSpeed = 30');
    // HIT
    js = js.replace(/weaponRot: 50\n            \};\n            this.lerpSpeed = 30/g, 'weaponRot: 50,\n                shieldRot: 40\n            };\n            this.lerpSpeed = 30');
    // KNOCKBACK
    js = js.replace(/weaponRot: 80\n            \};\n            this.lerpSpeed = 25/g, 'weaponRot: 80,\n                shieldRot: 60\n            };\n            this.lerpSpeed = 25');
    // DEFEAT
    js = js.replace(/weaponRot: 120\n            \};\n            this.lerpSpeed = 10/g, 'weaponRot: 120,\n                shieldRot: 90\n            };\n            this.lerpSpeed = 10');
    
    // ATTACK_LIGHT - Windup
    js = js.replace(/armUpperLRot: -10, armLowerLRot: -20,\n                    legUpperLRot: -10, legLowerLRot: 10, legUpperRRot: 20, legLowerRRot: 5\n                \};/g, 
        `armUpperLRot: -30, armLowerLRot: -20, // Shield counterbalance
                    legUpperLRot: -10, legLowerLRot: 10, legUpperRRot: 20, legLowerRRot: 5,
                    shieldRot: 15
                };`);
    // ATTACK_LIGHT - Active
    js = js.replace(/armUpperLRot: -40, armLowerLRot: -60,\n                    legUpperLRot: -30, legLowerLRot: 20, legUpperRRot: 30, legLowerRRot: 10\n                \};/g, 
        `armUpperLRot: -80, armLowerLRot: -60, // Throw shield arm back for power
                    legUpperLRot: -30, legLowerLRot: 20, legUpperRRot: 30, legLowerRRot: 10,
                    shieldRot: -20
                };`);
    // ATTACK_LIGHT - Recovery
    js = js.replace(/armUpperLRot: -20, armLowerLRot: -30,\n                    legUpperLRot: -10, legLowerLRot: 10, legUpperRRot: 15, legLowerRRot: 0\n                \};/g, 
        `armUpperLRot: -40, armLowerLRot: -30,
                    legUpperLRot: -10, legLowerLRot: 10, legUpperRRot: 15, legLowerRRot: 0,
                    shieldRot: 10
                };`);
                
    // ATTACK_HEAVY BOSS - Windup
    js = js.replace(/armUpperLRot: 40, armLowerLRot: 0,\n                        legUpperLRot: -10, legLowerLRot: 10, legUpperRRot: 20, legLowerRRot: 10\n                    \};/g, 
        `armUpperLRot: 60, armLowerLRot: 0,
                        legUpperLRot: -10, legLowerLRot: 10, legUpperRRot: 20, legLowerRRot: 10,
                        shieldRot: 30
                    };`);
    // ATTACK_HEAVY BOSS - Active
    js = js.replace(/armUpperLRot: -60, armLowerLRot: -40,\n                        legUpperLRot: -50, legLowerLRot: 40, legUpperRRot: 10, legLowerRRot: 30\n                    \};/g, 
        `armUpperLRot: -100, armLowerLRot: -40,
                        legUpperLRot: -50, legLowerLRot: 40, legUpperRRot: 10, legLowerRRot: 30,
                        shieldRot: -40
                    };`);
    // ATTACK_HEAVY BOSS - Recovery
    js = js.replace(/armUpperLRot: -30, armLowerLRot: -30,\n                        legUpperLRot: -20, legLowerLRot: 20, legUpperRRot: 10, legLowerRRot: 15\n                    \};/g, 
        `armUpperLRot: -40, armLowerLRot: -30,
                        legUpperLRot: -20, legLowerLRot: 20, legUpperRRot: 10, legLowerRRot: 15,
                        shieldRot: 0
                    };`);

    // ATTACK_HEAVY NORMAL - Windup
    js = js.replace(/armUpperLRot: 20, armLowerLRot: -40,\n                        legUpperLRot: 0, legLowerLRot: 10, legUpperRRot: 40, legLowerRRot: 30\n                    \};/g, 
        `armUpperLRot: 40, armLowerLRot: -40,
                        legUpperLRot: 0, legLowerLRot: 10, legUpperRRot: 40, legLowerRRot: 30,
                        shieldRot: 20
                    };`);
    // ATTACK_HEAVY NORMAL - Active
    js = js.replace(/armUpperLRot: -50, armLowerLRot: -80,\n                        legUpperLRot: -40, legLowerLRot: 30, legUpperRRot: 20, legLowerRRot: 40\n                    \};/g, 
        `armUpperLRot: -90, armLowerLRot: -80,
                        legUpperLRot: -40, legLowerLRot: 30, legUpperRRot: 20, legLowerRRot: 40,
                        shieldRot: -30
                    };`);
    // ATTACK_HEAVY NORMAL - Recovery
    js = js.replace(/armUpperLRot: -30, armLowerLRot: -40,\n                        legUpperLRot: -20, legLowerLRot: 20, legUpperRRot: 10, legLowerRRot: 20\n                    \};/g, 
        `armUpperLRot: -50, armLowerLRot: -40,
                        legUpperLRot: -20, legLowerLRot: 20, legUpperRRot: 10, legLowerRRot: 20,
                        shieldRot: 0
                    };`);
                    
    fs.writeFileSync(jsPath, js);
    console.log('rig-animator.js updated.');
} else {
    console.log('rig-animator.js already has shieldRot.');
}
