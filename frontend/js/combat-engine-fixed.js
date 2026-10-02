/**
 * Culture Game - Real-Time 2D Combat Engine
 */

class InputManager {
    constructor() {
        this.keys = {};
        
        this._keydownHandler = (e) => {
            if (['w', 'a', 's', 'd', 'j', 'k', 'l', 'h', ' ', 'shift'].includes(e.key.toLowerCase())) {
                this.keys[e.key.toLowerCase()] = true;
                if (e.key === ' ' || e.key.toLowerCase() === 'w') e.preventDefault();
            }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.keys[e.key] = true;
                e.preventDefault();
            }
        };
        
        this._keyupHandler = (e) => {
            if (['w', 'a', 's', 'd', 'j', 'k', 'l', 'h', ' ', 'shift'].includes(e.key.toLowerCase())) {
                this.keys[e.key.toLowerCase()] = false;
            }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.keys[e.key] = false;
            }
        };
        
        window.addEventListener('keydown', this._keydownHandler);
        window.addEventListener('keyup', this._keyupHandler);
    }
    
    destroy() {
        window.removeEventListener('keydown', this._keydownHandler);
        window.removeEventListener('keyup', this._keyupHandler);
    }

    isDown(key, altKey = null) {
        return !!this.keys[key] || (altKey ? !!this.keys[altKey] : false);
    }
    
    consume(key, altKey = null) {
        if (this.keys[key]) {
            this.keys[key] = false;
            return true;
        }
        if (altKey && this.keys[altKey]) {
            this.keys[altKey] = false;
            return true;
        }
        return false;
    }
}

class CollisionManager {
    static checkAABB(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }
}

class CombatEngine {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
        // Logical coordinates: width maps to 1000 logical units
        this.logicalWidth = 1000;
        this.scale = this.width / this.logicalWidth;
        
        this.input = new InputManager();
        
        this.hero = null;
        this.enemy = null;
        
        this.lastTime = 0;
        this.running = false;
        
        this.onWin = options.onWin || null;
        this.onLose = options.onLose || null;
        
        // Handle resize
        window.addEventListener('resize', () => {
            if (!this.container) return;
            this.width = this.container.clientWidth;
            this.height = this.container.clientHeight;
            this.scale = this.width / this.logicalWidth;
        });
    }

    start(heroConfig, enemyConfig) {
        this.container.innerHTML = ''; // Clear previous combat
        
        // Apply environment styling
        // Arena Visuals
        const arenaClass = heroConfig.arenaClass || 'arena-kerala';
        if (arenaClass) {
            this.container.classList.add(arenaClass);
            // Remove ground border if arena handles it natively
        } else {
            // Default visual ground
            const ground = document.createElement('div');
            ground.style.position = 'absolute';
            ground.style.bottom = '0';
            ground.style.left = '0';
            ground.style.width = '100%';
            ground.style.height = '40px';
            ground.style.background = '#222';
            ground.style.borderTop = '2px solid #555';
            this.container.appendChild(ground);
        }

        this.hero = new Fighter(this, Object.assign({}, heroConfig, { isPlayer: true, x: 280, direction: 1 }));
        this.enemy = new Fighter(this, Object.assign({}, enemyConfig, { isPlayer: false, x: 720, direction: -1 }));
        
        this.hero.opponent = this.enemy;
        this.enemy.opponent = this.hero;
        
        this.lastTime = performance.now();
        this.running = true;
        requestAnimationFrame((t) => this.loop(t));
    }

    stop() {
        this.running = false;
        if (this.input) {
            this.input.destroy();
        }
    }

    loop(timestamp) {
        if (!this.running) return;
        
        let targetFPS = 60;
        if (window.gameState && window.gameState.fps) {
            targetFPS = window.gameState.fps;
        } else {
            const stored = parseInt(localStorage.getItem('culture_game_fps'), 10);
            if (!isNaN(stored)) targetFPS = stored;
        }
        
        const frameTime = 1000 / targetFPS;
        
        // Enforce frame cap
        if (timestamp - this.lastTime < frameTime) {
            requestAnimationFrame((t) => this.loop(t));
            return;
        }
        
        const deltaTime = (timestamp - this.lastTime) / 1000; // in seconds
        this.lastTime = timestamp;
        
        // Limit delta time to prevent huge jumps if tab is inactive
        const dt = Math.min(deltaTime, 0.1);
        
        this.update(dt);
        this.render();
        
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.hero.update(dt);
        this.enemy.update(dt);
        
        // Check win/lose
        if (this.enemy.state === 'DEFEAT' && this.hero.state !== 'VICTORY') {
            this.hero.setState('VICTORY');
            if (this.onWin) setTimeout(this.onWin, 3000);
        } else if (this.hero.state === 'DEFEAT' && this.enemy.state !== 'VICTORY') {
            this.enemy.setState('VICTORY');
            if (this.onLose) setTimeout(this.onLose, 3000);
        }
    }

    render() {
        this.hero.render();
        this.enemy.render();
    }
}

class Fighter {
    constructor(engine, config) {
        this.engine = engine;
        this.isPlayer = config.isPlayer;
        this.isBoss = config.isBoss || false;
        
        this.x = config.x || 0;
        this.y = 0; // 0 is floor level
        
        // Logical dimensions of the physical body (hurtbox)
        this.width = 80; 
        this.height = 200; 
        
        // Logical dimensions of the rendered sprite canvas (viewBox equivalent)
        this.logicalSpriteWidth = 250;
        this.logicalSpriteHeight = 250;
        
        this.vx = 0;
        this.vy = 0;
        this.direction = config.direction || 1; // 1 = right, -1 = left
        
        this.health = config.maxHealth || 100;
        this.maxHealth = config.maxHealth || 100;
        this.stamina = 100;
        this.maxStamina = 100;
        this.name = config.name || "Fighter";
        this.folder = config.folder || "kerala";
        
        this.state = 'IDLE';
        this.stateTime = 0;
        
        this.healCooldown = 0;
        this.dodgeCooldown = 0;
        this.healAmount = 20;
        
        this.opponent = null;
        
        // Physics constants
        this.gravity = 1500;
        this.jumpForce = 700;
        this.walkSpeed = 250;
        this.runSpeed = 450;
        this.dodgeSpeed = 500;
        
        // Attack definitions
        this.attacks = {
            light: { windup: 0.2, active: 0.1, recovery: 0.3, damage: 15, reach: 90, pushback: 100 },
            heavy: { windup: 0.4, active: 0.15, recovery: 0.5, damage: 25, reach: 110, pushback: 300 }
        };
        this.currentAttack = null;
        this.hasHitInActiveFrame = false;
        
        this.aiStateTime = 0;
        this.aiDecisionInterval = 0.5 + Math.random() * 0.5;
        this.aiCooldown = 0;
        this.aiComboStep = 0;
        this.aiReactionDelay = 0;
        this.aiTargetAction = null;
        this.aiRecentAction = null;
        
        // Player State
        this.comboBuffer = null;
        this.dodgeCooldown = 0;
        
        this.combatStyle = config.combatStyle || 'sprite'; // Default to original sprite

        // Visual DOM element
        if (this.combatStyle === 'rig') {
            this.element = this.createRig();
        } else {
            this.element = this.createSprite();
        }
        this.engine.container.appendChild(this.element);
    }
    
    createSprite() {
        const container = document.createElement('div');
        container.className = 'fighter-sprite';
        container.style.position = 'absolute';
        
        this.spriteElement = document.createElement('img');
        this.spriteElement.style.width = '100%';
        this.spriteElement.style.height = '100%';
        this.spriteElement.draggable = false;
        
        container.appendChild(this.spriteElement);
        return container;
    }
    
    updateSprite() {
        if (!this.spriteElement) return;

        let frame = 'idle';
        let stateName = this.state.toLowerCase();
        
        if (stateName === 'heal') stateName = 'defend';

        if (stateName === 'attack' || stateName === 'heavy_attack') {
            const isHeavy = (stateName === 'heavy_attack');
            const prefix = isHeavy ? 'heavy_attack' : 'attack';
            const atk = this.currentAttack;
            if (atk) {
                const totalTime = atk.windup + atk.active + atk.recovery;
                const progress = this.stateTime / totalTime;
                if (progress < 0.33) frame = `${prefix}_1`;
                else if (progress < 0.66) frame = `${prefix}_2`;
                else frame = `${prefix}_3`;
            } else {
                frame = `${prefix}_1`;
            }
        } else if (stateName === 'run' || stateName === 'walk') {
            const speed = stateName === 'run' ? 8 : 4;
            const cycle = Math.floor(this.stateTime * speed) % 2;
            frame = `${stateName}_${cycle + 1}`;
        } else {
            frame = stateName;
        }

        const src = `assets/characters/${this.folder}/${frame}.svg`;
        if (this.spriteElement.getAttribute('src') !== src) {
            this.spriteElement.src = src;
        }
    }
    
    createRig() {
        const container = document.createElement('div');
        container.className = 'fighter-rig';
        
        if (this.isPlayer) container.classList.add('hero-rig');
        else if (this.isBoss) container.classList.add('boss-rig');
        else container.classList.add('enemy-rig');

        const elements = {};
        
        elements.torso = document.createElement('div');
        elements.torso.className = 'rig-part rig-torso';
        
        elements.head = document.createElement('div');
        elements.head.className = 'rig-part rig-head';
        
        elements.armUpperL = document.createElement('div');
        elements.armUpperL.className = 'rig-part rig-arm-upper-l';
        elements.armLowerL = document.createElement('div');
        elements.armLowerL.className = 'rig-part rig-arm-lower-l';
        elements.handL = document.createElement('div');
        elements.handL.className = 'rig-part rig-hand-l';
        // We will append shield to handL later
        
        elements.armUpperR = document.createElement('div');
        elements.armUpperR.className = 'rig-part rig-arm-upper-r';
        elements.armLowerR = document.createElement('div');
        elements.armLowerR.className = 'rig-part rig-arm-lower-r';
        elements.handR = document.createElement('div');
        elements.handR.className = 'rig-part rig-hand-r';
        
        elements.legUpperL = document.createElement('div');
        elements.legUpperL.className = 'rig-part rig-leg-upper-l';
        elements.legLowerL = document.createElement('div');
        elements.legLowerL.className = 'rig-part rig-leg-lower-l';
        elements.footL = document.createElement('div');
        elements.footL.className = 'rig-part rig-foot-l';
        
        elements.legUpperR = document.createElement('div');
        elements.legUpperR.className = 'rig-part rig-leg-upper-r';
        elements.legLowerR = document.createElement('div');
        elements.legLowerR.className = 'rig-part rig-leg-lower-r';
        elements.footR = document.createElement('div');
        elements.footR.className = 'rig-part rig-foot-r';

        elements.weapon = document.createElement('div');
        elements.weapon.className = 'rig-part rig-weapon';

        elements.shield = document.createElement('div');
        elements.shield.className = 'rig-part rig-shield';

        // Build hierarchy
        elements.armLowerL.appendChild(elements.handL);
        elements.armUpperL.appendChild(elements.armLowerL);
        
        elements.armLowerR.appendChild(elements.handR);
        elements.armUpperR.appendChild(elements.armLowerR);
        
        elements.legLowerL.appendChild(elements.footL);
        elements.legUpperL.appendChild(elements.legLowerL);
        
        elements.legLowerR.appendChild(elements.footR);
        elements.legUpperR.appendChild(elements.legLowerR);
        
        // Weapon in hand
        elements.handR.appendChild(elements.weapon);
        elements.handL.appendChild(elements.shield);
        
        elements.torso.appendChild(elements.head);
        elements.torso.appendChild(elements.armUpperL);
        elements.torso.appendChild(elements.armUpperR);
        elements.torso.appendChild(elements.legUpperL);
        elements.torso.appendChild(elements.legUpperR);

        container.appendChild(elements.torso);

        this.parts = elements;
        this.parts.container = container;
        
        if (typeof RigAnimator !== 'undefined') {
            this.animator = new RigAnimator(this.parts, this.isBoss);
        } else {
            console.error('RigAnimator is missing!');
        }

        return container;
    }

    setState(newState) {
        if (this.state === 'DEFEAT') return; // Cannot change state if defeated
        this.state = newState;
        this.stateTime = 0;
        this.hasHitInActiveFrame = false;
    }

    takeDamage(amount, pushback) {
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
            
            this.spawnParticles('#f2c94c', 4, true); // Sparks
            
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
            
            this.spawnParticles('#ff3b3b', 10, false); // Blood
        }
        
        this.health -= actualDamage;
        if (this.health <= 0) {
            this.health = 0;
            this.setState('DEFEAT');
        }
        
        this.showDamage(actualDamage, isBlocked);
        if (typeof updateHealthBars === 'function') updateHealthBars();
    }

    spawnParticles(color, count, isShieldBlock = false) {
        for(let i=0; i<count; i++) {
            const p = document.createElement('div');
            p.style.position = 'absolute';
            p.style.width = '4px';
            p.style.height = '4px';
            p.style.backgroundColor = color;
            p.style.borderRadius = '50%';
            p.style.zIndex = '100';
            
            const renderX = (this.x + (isShieldBlock ? this.direction * 30 : 0)) * this.engine.scale + ((Math.random() - 0.5) * 20);
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
    }
    
    showDamage(amount, blocked) {
        const dmgText = document.createElement('div');
        dmgText.className = 'engine-damage-text';
        dmgText.textContent = blocked ? `Blocked! (-${amount})` : `-${amount}`;
        dmgText.style.color = blocked ? '#f2c94c' : '#ff3b3b';
        
        const renderX = this.x * this.engine.scale;
        const renderY = (this.y + this.height + 20) * this.engine.scale + 40;
        
        dmgText.style.left = `${renderX - 30}px`;
        dmgText.style.bottom = `${renderY}px`;
        
        this.engine.container.appendChild(dmgText);
        
        // Trigger CSS transition
        setTimeout(() => {
            dmgText.style.transform = 'translateY(-50px)';
            dmgText.style.opacity = '0';
        }, 10);
        
        setTimeout(() => {
            if (dmgText.parentNode) dmgText.parentNode.removeChild(dmgText);
        }, 1000);
    }

    getHurtbox() {
        return {
            x: this.x - this.width/2,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    getHitbox(attackConf) {
        const width = attackConf.reach;
        const height = 40;
        return {
            x: this.direction === 1 ? this.x + this.width/2 : this.x - this.width/2 - width,
            y: this.y + 70, // Chest height
            width: width,
            height: height
        };
    }

    update(dt) {
        this.stateTime += dt;
        
        if (this.healCooldown > 0) {
            this.healCooldown -= dt;
        }
        
        if (this.state !== 'DEFEND' && this.state !== 'ATTACK' && this.state !== 'HEAVY_ATTACK' && this.state !== 'HEAL') {
            this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt); // Regen stamina
        }
        
        // Face opponent unless in specific states
        if (!['ATTACK', 'HEAVY_ATTACK', 'HIT', 'KNOCKBACK', 'DEFEAT', 'HEAL'].includes(this.state) && this.opponent) {
            this.direction = this.opponent.x > this.x ? 1 : -1;
        }

        // Apply Gravity
        if (this.y > 0) {
            this.vy -= this.gravity * dt;
        }
        
        // Movement processing based on state
        if (this.isPlayer) {
            this.updatePlayerInput(dt);
        } else {
            this.updateAI(dt);
        }

        // Process Combat States
        if (this.state === 'ATTACK' || this.state === 'HEAVY_ATTACK') {
            this.vx = 0; // stop moving
            const atk = this.currentAttack;
            const totalAtkTime = atk.windup + atk.active + atk.recovery;
            const progress = this.stateTime / totalAtkTime;
            
            if (this.animator) {
                this.animator.setPose(this.state === 'ATTACK' ? 'ATTACK_LIGHT' : 'ATTACK_HEAVY', progress);
            }
            
            // Active frame collision check
            if (this.stateTime > atk.windup && this.stateTime < atk.windup + atk.active) {
                if (!this.hasHitInActiveFrame) {
                    const hitbox = this.getHitbox(atk);
                    const opponentHurtbox = this.opponent.getHurtbox();
                    
                    if (CollisionManager.checkAABB(hitbox, opponentHurtbox)) {
                        this.opponent.takeDamage(atk.damage, atk.pushback);
                        this.hasHitInActiveFrame = true;
                    }
                }
            }
            
            // Recovery
            if (this.stateTime > totalAtkTime) {
                this.setState('IDLE');
            }
        }
        else if (this.state === 'HIT') {
            if (this.animator) this.animator.setPose('HIT');
            // Stagger (short recovery)
            if (this.stateTime > 0.3) {
                this.setState('IDLE');
            }
        }
        else if (this.state === 'KNOCKBACK') {
            if (this.animator) this.animator.setPose('KNOCKBACK');
            // Heavy hit (long recovery)
            if (this.stateTime > 0.6) {
                this.setState('IDLE');
            }
        }
        else if (this.state === 'DODGE') {
            if (this.animator) this.animator.setPose('DODGE');
            // Dash velocity
            this.vx = -this.direction * this.dodgeSpeed;
            if (this.stateTime > 0.4) {
                this.setState('IDLE');
                this.vx = 0;
            }
        }
        else if (this.state === 'HEAL') {
            if (this.animator) this.animator.setPose('DEFEND');
            this.vx = 0;
            // Healing animation takes 1 second
            if (this.stateTime > 1.0) {
                this.health = Math.min(this.maxHealth, this.health + this.healAmount);
                this.healCooldown = 5.0; // 5 seconds cooldown
                
                const healText = document.createElement('div');
                healText.className = 'engine-damage-text';
                healText.textContent = `+${this.healAmount}`;
                healText.style.color = '#4caf50';
                
                const renderX = this.x * this.engine.scale;
                const renderY = (this.y + this.height + 20) * this.engine.scale + 40;
                healText.style.left = `${renderX - 10}px`;
                healText.style.bottom = `${renderY}px`;
                this.engine.container.appendChild(healText);
                setTimeout(() => { healText.style.transform = 'translateY(-50px)'; healText.style.opacity = '0'; }, 10);
                setTimeout(() => { if (healText.parentNode) healText.parentNode.removeChild(healText); }, 1000);
                
                if (typeof updateHealthBars === 'function') updateHealthBars();
                this.setState('IDLE');
            }
        }
        
        // Physics: Apply Friction for smooth deceleration if not actively dashing
        if (this.state !== 'DODGE') {
            const friction = 2000;
            if (this.vx > 0) {
                this.vx = Math.max(0, this.vx - friction * dt);
            } else if (this.vx < 0) {
                this.vx = Math.min(0, this.vx + friction * dt);
            }
        }
        
        // Update Positions
        let nextX = this.x + this.vx * dt;
        let nextY = this.y + this.vy * dt;
        
        // Floor collision
        if (nextY <= 0) {
            nextY = 0;
            if (this.vy < 0) {
                this.vy = 0;
                if (this.state === 'JUMP') {
                    this.setState('IDLE');
                }
            }
        }
        
        // Character Collision (Prevent walking through each other)
        if (this.opponent) {
            const boundPadding = this.width / 2;
            const oppX = this.opponent.x;
            const myDist = nextX - oppX;
            // If we are crossing the opponent's center line, block it
            if (this.x <= oppX && nextX + boundPadding > oppX - boundPadding) {
                // I was on the left, trying to move right past opponent's left edge
                nextX = oppX - boundPadding * 2;
                this.vx = 0;
            } else if (this.x >= oppX && nextX - boundPadding < oppX + boundPadding) {
                // I was on the right, trying to move left past opponent's right edge
                nextX = oppX + boundPadding * 2;
                this.vx = 0;
            }
        }
        
        // Arena Boundaries (Strict constraint based on complete visual sprite to prevent clipping)
        const arenaPadding = this.logicalSpriteWidth / 2;
        
        if (nextX < arenaPadding) {
            nextX = arenaPadding;
            this.vx = 0;
        }
        if (nextX > this.engine.logicalWidth - arenaPadding) {
            nextX = this.engine.logicalWidth - arenaPadding;
            this.vx = 0;
        }
        
        this.x = nextX;
        this.y = nextY;
    }

    updatePlayerInput(dt) {
        if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;
        
        // Lock controls during heavy hit reactions, defeat, healing, or victory
        if (['HIT', 'KNOCKBACK', 'DEFEAT', 'VICTORY', 'HEAL', 'DODGE'].includes(this.state)) return;
        
        const input = this.engine.input;
        
        // Heal
        if (input.consume('h')) {
            if (this.healCooldown <= 0 && this.health < this.maxHealth) {
                this.setState('HEAL');
                return;
            }
        }
        
        // Handle Attack and Combos
        let attackQueued = null;
        if (input.consume('j')) attackQueued = this.attacks.light;
        if (input.consume('k')) attackQueued = this.attacks.heavy;
        
        if (['ATTACK', 'HEAVY_ATTACK'].includes(this.state)) {
            const atk = this.currentAttack;
            
            // Buffer inputs pressed during the active/recovery phase
            if (attackQueued && this.stateTime >= atk.windup) {
                this.comboBuffer = attackQueued;
            }
            
            // If in recovery phase and we have a buffered combo (and the last attack actually hit!)
            if (this.comboBuffer && this.hasHitInActiveFrame && this.stateTime > atk.windup + atk.active) {
                this.setState(this.comboBuffer === this.attacks.light ? 'ATTACK' : 'HEAVY_ATTACK');
                this.currentAttack = this.comboBuffer;
                this.comboBuffer = null;
            }
            return; // Can't do anything else while attacking
        }
        
        // If an attack was pressed from idle
        if (attackQueued) {
            this.setState(attackQueued === this.attacks.light ? 'ATTACK' : 'HEAVY_ATTACK');
            this.currentAttack = attackQueued;
            this.comboBuffer = null;
            return;
        }
        
        // Dodge
        if (input.consume(' ')) {
            if (this.dodgeCooldown <= 0) {
                this.setState('DODGE');
                this.dodgeCooldown = 1.5;
                // Add initial burst velocity
                this.vx = -this.direction * this.dodgeSpeed;
                return;
            }
        }
        
        // Defense
        if (input.isDown('l')) {
            if (this.stamina > 0) {
                this.setState('DEFEND');
                this.stamina -= 5 * dt; // Drain slowly while holding block
                return;
            } else {
                if (this.state === 'DEFEND') this.setState('IDLE');
            }
        } else if (this.state === 'DEFEND') {
            this.setState('IDLE');
        }
        
        // Movement (Acceleration-based)
        if (this.state !== 'JUMP') {
            let isMoving = false;
            
            const isRunning = input.isDown('shift');
            const targetSpeed = isRunning ? this.runSpeed : this.walkSpeed;
            const acceleration = 3000;
            
            if (input.isDown('a', 'ArrowLeft')) {
                this.vx -= acceleration * dt;
                if (this.vx < -targetSpeed) this.vx = -targetSpeed;
                isMoving = true;
                this.direction = -1; // Face left while moving left
            } else if (input.isDown('d', 'ArrowRight')) {
                this.vx += acceleration * dt;
                if (this.vx > targetSpeed) this.vx = targetSpeed;
                isMoving = true;
                this.direction = 1; // Face right while moving right
            }
            
            // W or Up Arrow for jump (only if on ground)
            if (input.consume('w', 'ArrowUp') && this.y === 0) {
                this.vy = this.jumpForce;
                this.setState('JUMP');
            } else if (isMoving) {
                this.setState(isRunning ? 'RUN' : 'WALK');
            } else if (Math.abs(this.vx) < 10) {
                this.setState('IDLE');
            }
            
            // Set animator states for movement
            if (this.combatStyle === 'rig' && this.animator) {
                if (this.state === 'JUMP') this.animator.setPose('JUMP');
                else if (this.state === 'RUN') this.animator.setPose('RUN');
                else if (this.state === 'WALK') this.animator.setPose('WALK');
                else if (this.state === 'IDLE') this.animator.setPose('IDLE');
                else if (this.state === 'DEFEND') this.animator.setPose('DEFEND');
            }
        } else {
            // Air control (Acceleration)
            const airAccel = 1000;
            if (input.isDown('a', 'ArrowLeft')) {
                this.vx -= airAccel * dt;
                if (this.vx < -this.walkSpeed) this.vx = -this.walkSpeed;
            } else if (input.isDown('d', 'ArrowRight')) {
                this.vx += airAccel * dt;
                if (this.vx > this.walkSpeed) this.vx = this.walkSpeed;
            }
        }
    }

    updateAI(dt) {
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
    render() {
        if (this.combatStyle === 'rig' && (!this.parts || !this.parts.container)) return;
        if (this.combatStyle === 'sprite' && !this.element) return;
        
        // Consistent scaling of character based on arena scale
        const renderWidth = this.logicalSpriteWidth * this.engine.scale;
        const renderHeight = this.logicalSpriteHeight * this.engine.scale;
        const renderX = this.x * this.engine.scale;
        
        // Offset Y slightly so feet align with ground (scaled)
        const renderY = (this.y * this.engine.scale) - (15 * this.engine.scale);  
        
        const container = this.combatStyle === 'rig' ? this.parts.container : this.element;
        
        container.style.width = `${renderWidth}px`;
        container.style.height = `${renderHeight}px`;
        container.style.left = `${renderX}px`;
        container.style.bottom = `${renderY}px`;
        
        // For Boss scale
        let scaleStr = '';
        if (this.isBoss) {
            scaleStr = ' scale(1.3)'; // Gurukkal Raman is physically larger
        }
        
        let baseTransform = `translateX(-50%) scaleX(${this.direction})${scaleStr}`;
        container.style.transform = baseTransform;

        if (this.combatStyle === 'rig') {
            if (['IDLE', 'WALK', 'RUN', 'JUMP', 'DEFEND', 'DEFEAT', 'VICTORY'].includes(this.state)) {
                if (this.animator) this.animator.setPose(this.state);
            }
            if (this.animator) {
                this.animator.update(0.016);
            }
        } else {
            this.updateSprite();
        }
    }
}

