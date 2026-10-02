/**
 * Culture Game - Real-Time 2D Combat Engine
 */

class InputManager {
    constructor() {
        this.keys = {};
        
        this._keydownHandler = (e) => {
            if (['w', 'a', 's', 'd', 'j', 'k', 'l', ' ', 'shift'].includes(e.key.toLowerCase())) {
                this.keys[e.key.toLowerCase()] = true;
                if (e.key === ' ' || e.key.toLowerCase() === 'w') e.preventDefault();
            }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.keys[e.key] = true;
                e.preventDefault();
            }
        };
        
        this._keyupHandler = (e) => {
            if (['w', 'a', 's', 'd', 'j', 'k', 'l', ' ', 'shift'].includes(e.key.toLowerCase())) {
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
        if (window.gameState && window.gameState.current_chapter === 1) {