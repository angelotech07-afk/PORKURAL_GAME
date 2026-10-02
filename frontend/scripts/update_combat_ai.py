import re

file_path = r'd:\CLONED\Culture_Game\Culture_Game FULL DEMO\Culture_Game FULL\frontend\js\combat-engine.js'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add spawnParticles and update takeDamage
take_damage_pattern = r'    takeDamage\(amount, pushback\).*?updateHealthBars\(\);\s*\}'

new_take_damage = """    takeDamage(amount, pushback) {
        if (['DEFEAT', 'DODGE'].includes(this.state)) return; // i-frames
        
        let actualDamage = amount;
        let isBlocked = false;
        
        // Real Defense: Defender must be facing the attacker to block
        const isFacingAttacker = (this.direction === -this.opponent.direction);
        
        if (this.state === 'DEFEND' && this.stamina > 0 && isFacingAttacker) {
            isBlocked = true;
            actualDamage = Math.floor(amount / 5); // 80% damage reduction
            this.stamina -= (amount * 1.5); 
            this.engine.container.classList.add('shake-small');
            setTimeout(() => this.engine.container.classList.remove('shake-small'), 200);
            this.vx = (this.opponent.x < this.x ? 1 : -1) * (pushback * 0.3); // much less pushback
            
            this.spawnParticles('#f2c94c', 4); // Sparks
            
            if (this.stamina <= 0) {
                this.stamina = 0;
                this.setState('HIT'); // Guard break
                this.showDamage("GUARD BREAK!", false);
                this.vx = (this.opponent.x < this.x ? 1 : -1) * pushback;
            }
        } else {
            if (pushback > 150) {
                this.setState('KNOCKBACK');
            } else {
                this.setState('HIT'); // stagger
            }
            this.engine.container.classList.add('shake');
            setTimeout(() => this.engine.container.classList.remove('shake'), 400);
            this.vx = (this.opponent.x < this.x ? 1 : -1) * pushback;
            
            this.spawnParticles('#ff3b3b', 10); // Blood
        }
        
        this.health -= actualDamage;
        if (this.health <= 0) {
            this.health = 0;
            this.setState('DEFEAT');
        }
        
        this.showDamage(actualDamage, isBlocked);
        if (typeof updateHealthBars === 'function') updateHealthBars();
    }

    spawnParticles(color, count) {
        for(let i=0; i<count; i++) {
            const p = document.createElement('div');
            p.style.position = 'absolute';
            p.style.width = '4px';
            p.style.height = '4px';
            p.style.backgroundColor = color;
            p.style.borderRadius = '50%';
            p.style.zIndex = '100';
            
            const renderX = this.x * this.engine.scale + ((Math.random() - 0.5) * 20);
            const renderY = (this.y + 40) * this.engine.scale + ((Math.random() - 0.5) * 20) + 40; // Add 40 to account for ground offset in CSS
            
            p.style.left = `${renderX}px`;
            p.style.bottom = `${renderY}px`;
            
            const vx = (Math.random() - 0.5) * 200;
            const vy = (Math.random()) * 200 + 50;
            
            this.engine.container.appendChild(p);
            
            let posX = renderX;
            let posY = renderY;
            let time = 0;
            
            const anim = setInterval(() => {
                time += 0.016;
                posX += vx * 0.016;
                posY += (vy - 800 * time) * 0.016; // gravity
                p.style.left = `${posX}px`;
                p.style.bottom = `${posY}px`;
                p.style.opacity = Math.max(0, 1 - (time * 1.5));
                if (time > 0.6) {
                    clearInterval(anim);
                    if (p.parentNode) p.parentNode.removeChild(p);
                }
            }, 16);
        }
    }"""

code = re.sub(take_damage_pattern, new_take_damage, code, flags=re.DOTALL)

# 2. Update AI Logic
# We replace the entire updateAI(dt) method.
update_ai_pattern = r'    updateAI\(dt\) \{.*?(?=    render\(\) \{)'
new_update_ai = """    updateAI(dt) {
        if (['HIT', 'KNOCKBACK', 'DEFEAT', 'DODGE', 'VICTORY'].includes(this.state)) {
            // Cannot decide new actions while physically locked
            this.aiReactionDelay = 0;
            this.aiTargetAction = null;
            return;
        }
        
        const opp = this.opponent;
        if (!opp) return;
        
        const dist = Math.abs(this.x - opp.x);
        
        // Check if currently attacking to handle combo chaining (Commitment phase)
        if (['ATTACK', 'HEAVY_ATTACK'].includes(this.state)) {
            const atk = this.currentAttack;
            // Only allow chaining during late active or recovery phase
            if (this.stateTime < atk.windup + atk.active + 0.1) return;
            
            if (this.aiComboStep > 0 && dist < 120) {
                this.setState(this.aiComboStep === 1 ? 'ATTACK' : 'HEAVY_ATTACK');
                this.currentAttack = this.aiComboStep === 1 ? this.attacks.light : this.attacks.heavy;
                this.aiComboStep = this.aiComboStep === 1 ? 2 : 0;
                this.aiCooldown = this.currentAttack.windup + this.currentAttack.active;
            } else {
                this.aiComboStep = 0;
            }
            return;
        }
        
        this.aiStateTime += dt;
        
        // Handle Queued Actions (Simulates human decision commitment)
        if (this.aiReactionDelay > 0) {
            this.aiReactionDelay -= dt;
            if (this.aiReactionDelay <= 0 && this.aiTargetAction) {
                if (this.aiTargetAction === 'DEFEND' && this.stamina > 10) {
                    this.setState('DEFEND');
                    this.aiCooldown = this.isBoss ? 0.3 : (0.5 + Math.random() * 0.4);
                } else if (this.aiTargetAction === 'DODGE' && this.dodgeCooldown <= 0) {
                    this.setState('DODGE');
                    this.dodgeCooldown = 2.0;
                    this.vx = -this.direction * this.dodgeSpeed;
                } else if (this.aiTargetAction === 'RETREAT') {
                    this.setState('RUN');
                    this.vx = -this.direction * this.runSpeed;
                    this.aiCooldown = 0.4;
                } else if (this.aiTargetAction === 'PUNISH_HEAVY') {
                    this.setState('HEAVY_ATTACK');
                    this.currentAttack = this.attacks.heavy;
                    this.aiCooldown = this.attacks.heavy.windup + this.attacks.heavy.active;
                } else if (this.aiTargetAction === 'PUNISH_LIGHT') {
                    this.setState('ATTACK');
                    this.currentAttack = this.attacks.light;
                    this.aiCooldown = this.attacks.light.windup + this.attacks.light.active;
                }
                this.aiTargetAction = null;
                return;
            }
        }
        
        // 1. Reactive System (Interrupts normal decision flow if in danger or sees an opening)
        if (this.aiCooldown <= 0 && !this.aiTargetAction) {
            const reactionSpeed = this.isBoss ? 0.1 : 0.25; // Boss reacts faster
            const mistakeChance = this.isBoss ? 0.05 : 0.2; // Boss makes fewer mistakes
            
            // A. Opponent is attacking (React defensively)
            if (['ATTACK', 'HEAVY_ATTACK'].includes(opp.state)) {
                const oppAtk = opp.currentAttack;
                
                // If in windup phase and within dangerous distance
                if (opp.stateTime < oppAtk.windup && dist <= oppAtk.reach + 60) {
                    if (Math.random() > mistakeChance) {
                        this.aiReactionDelay = reactionSpeed + Math.random() * 0.1;
                        
                        // Decide defense
                        if (opp.state === 'HEAVY_ATTACK' && this.dodgeCooldown <= 0) {
                            this.aiTargetAction = 'DODGE';
                        } else if (this.health < this.maxHealth * 0.2) {
                            this.aiTargetAction = 'RETREAT';
                        } else {
                            this.aiTargetAction = 'DEFEND';
                        }
                        this.aiCooldown = 0.1; 
                        return;
                    }
                }
            }
            
            // B. Opponent is recovering from an attack (Punish/Counter)
            if (['ATTACK', 'HEAVY_ATTACK'].includes(opp.state)) {
                const oppAtk = opp.currentAttack;
                if (opp.stateTime > oppAtk.windup + oppAtk.active) {
                    if (dist < 100 && Math.random() > mistakeChance) {
                        this.aiReactionDelay = reactionSpeed;
                        this.aiTargetAction = this.isBoss ? 'PUNISH_HEAVY' : 'PUNISH_LIGHT';
                        this.aiCooldown = 0.1;
                        return;
                    }
                }
            }
            
            // C. Opponent is Healing
            if (opp.state === 'HEAL') {
                if (dist > 150) {
                    this.setState('RUN');
                    this.vx = this.direction * this.runSpeed;
                    this.aiCooldown = 0.2;
                } else {
                    this.aiReactionDelay = reactionSpeed;
                    this.aiTargetAction = 'PUNISH_HEAVY';
                }
                return;
            }
        }
        
        // Manage holding block (Commitment)
        if (this.state === 'DEFEND') {
            this.vx = 0;
            // Exit block if stamina is low, cooldown is over, or opponent stopped attacking
            if (this.aiCooldown <= 0 || this.stamina <= 0 || (opp.state === 'IDLE' && Math.random() < 0.1)) {
                this.setState('IDLE');
            } else {
                this.aiCooldown -= dt;
                this.stamina -= 5 * dt;
                return;
            }
        }
        
        // Cooldown processing
        if (this.aiCooldown > 0) {
            this.aiCooldown -= dt;
            if (this.state === 'IDLE') this.vx = 0;
            return;
        }
        
        // 2. Decision Engine (Runs only when AI is "idle" and ready to make a move)
        if (this.aiStateTime > this.aiDecisionInterval && !this.aiTargetAction) {
            this.aiStateTime = 0;
            this.aiDecisionInterval = this.isBoss ? (0.2 + Math.random() * 0.3) : (0.4 + Math.random() * 0.4); 
            
            // A. Healing Logic
            if (this.health < this.maxHealth * 0.4 && this.healCooldown <= 0) {
                if (dist > 300) {
                    this.setState('HEAL');
                    this.aiCooldown = 1.0;
                    return;
                } else {
                    // Try to retreat to heal
                    this.setState('RUN');
                    this.vx = -this.direction * this.runSpeed; 
                    this.aiCooldown = 0.5;
                    return;
                }
            }
            
            // B. Distance Management
            const targetDist = 90; // Optimal melee range
            
            if (dist > targetDist + 150) {
                // Far away -> approach or jump
                if (Math.random() < 0.2 && this.isBoss) {
                    this.setState('JUMP');
                    this.vy = this.jumpForce;
                    this.vx = this.direction * this.runSpeed;
                } else {
                    this.setState('RUN');
                    this.vx = this.direction * this.runSpeed;
                }
                this.aiCooldown = 0.3;
            } else if (dist > targetDist + 20) {
                // Closing in carefully
                this.setState('WALK');
                this.vx = this.direction * this.walkSpeed;
                this.aiCooldown = 0.2;
            } else if (dist < targetDist - 30) {
                // Too close, adjust position
                if (Math.random() < 0.6) {
                    this.setState('WALK');
                    this.vx = -this.direction * this.walkSpeed;
                    this.aiCooldown = 0.3;
                } else {
                    this.vx = 0;
                    this.setState('IDLE');
                }
            } else {
                // C. COMBAT RANGE - Attack/Defend Decisions
                this.vx = 0;
                
                if (this.stamina < 30) {
                    // Exhausted, back off
                    this.setState('WALK');
                    this.vx = -this.direction * this.walkSpeed;
                    this.aiCooldown = 0.5;
                    return;
                }
                
                const rand = Math.random();
                const heavyChance = this.isBoss ? 0.35 : 0.15;
                const comboChance = this.isBoss ? 0.4 : 0.3;
                
                if (rand < heavyChance) { 
                    this.setState('HEAVY_ATTACK');
                    this.currentAttack = this.attacks.heavy;
                    this.aiCooldown = this.attacks.heavy.windup + this.attacks.heavy.active;
                } else if (rand < heavyChance + comboChance) { 
                    this.setState('ATTACK');
                    this.currentAttack = this.attacks.light;
                    this.aiCooldown = this.attacks.light.windup + this.attacks.light.active;
                    this.aiComboStep = 1; 
                } else if (rand < heavyChance + comboChance + 0.15) { 
                    this.setState('ATTACK');
                    this.currentAttack = this.attacks.light;
                    this.aiCooldown = this.attacks.light.windup + this.attacks.light.active;
                } else {
                    // Wait, Strafe, or pre-emptive block
                    if (Math.random() < 0.4) {
                        this.setState('DEFEND');
                        this.aiCooldown = 0.5;
                    } else {
                        this.setState('WALK');
                        this.vx = (Math.random() > 0.5 ? 1 : -1) * this.direction * this.walkSpeed;
                        this.aiCooldown = 0.3;
                    }
                }
            }
        }
    }
"""
code = re.sub(update_ai_pattern, new_update_ai, code, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated combat-engine.js")
