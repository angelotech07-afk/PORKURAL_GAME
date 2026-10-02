/**
 * Culture Game - State Management
 * Handles reading/writing game state to localStorage for the prototype frontend.
 */

const STATE_KEY = 'culture_game_save_v1';

// Default initial state
const initialState = {
    player_id: null,
    player_name: 'Traveler',
    level: 1,
    xp: 0,
    coins: 0,
    score: 0,
    knowledge_score: 0,
    health: 100,
    max_health: 100,
    current_chapter: 1,
    unlocked_chapters: [1], // Only Chapter 1 is unlocked initially
    completed_chapters: [],
    unlocked_codex: [], // Store IDs of unlocked codex entries
    game_completed: false,
    serverConnected: false,
    playerId: null
};

// Global state object
window.gameState = { ...initialState };

/**
 * Safely merges backend data into local gameState without replacing UI state.
 */
function mergeServerState(bootstrapData) {
    if (!bootstrapData) return;
    
    // Use backend logic as the source of truth for progression
    window.gameState.xp = bootstrapData.player.experience || window.gameState.xp;
    window.gameState.coins = bootstrapData.player.coins || window.gameState.coins;
    window.gameState.score = bootstrapData.player.total_score || window.gameState.score;
    window.gameState.level = bootstrapData.player.level || window.gameState.level;
    
    if (bootstrapData.statistics) {
        // Build completed chapters array up to the reported chapters_completed
        const completed = [];
        for (let i = 1; i <= bootstrapData.statistics.chapters_completed; i++) {
            completed.push(i);
        }
        window.gameState.completed_chapters = completed;
    }

    if (bootstrapData.player.current_chapter) {
        window.gameState.current_chapter = bootstrapData.player.current_chapter;
        
        const unlocked = [...window.gameState.completed_chapters];
        if (!unlocked.includes(bootstrapData.player.current_chapter)) {
            unlocked.push(bootstrapData.player.current_chapter);
        }
        window.gameState.unlocked_chapters = unlocked;
    }

    if (bootstrapData.unlocked_codex) {
        // Store the full objects returned by the backend for rendering
        window.gameState.server_codex_data = bootstrapData.unlocked_codex;
        
        // Merge backend codex IDs with existing local codex IDs to prevent wiping out local chapter unlocks
        const serverCodex = bootstrapData.unlocked_codex.map(c => c.codex_id);
        const localCodex = [...(window.gameState.unlocked_codex || [])];
        
        // Also ensure any completed chapters have their local codex unlocked
        if (window.gameState.completed_chapters) {
            window.gameState.completed_chapters.forEach(ch => {
                const data = CHAPTER_DATA[ch];
                if (data && data.codexId && !localCodex.includes(data.codexId)) {
                    localCodex.push(data.codexId);
                }
            });
        }
        
        window.gameState.unlocked_codex = [...new Set([...serverCodex, ...localCodex])];
    }
    
    if (bootstrapData.boss) {
        window.gameState.currentBossId = bootstrapData.boss.boss_id;
    }
    
    if (bootstrapData.challenges && bootstrapData.challenges.length > 0) {
        window.gameState.currentChallengeId = bootstrapData.challenges[0].challenge_id;
    }
    
    if (bootstrapData.statistics && bootstrapData.statistics.chapters_completed >= 5) {
        window.gameState.game_completed = true;
    }
    
    saveState();
}

/**
 * Loads state from localStorage. If no save exists, uses initialState.
 * @returns {boolean} True if a save existed, False otherwise.
 */
function loadState() {
    try {
        const saved = localStorage.getItem(STATE_KEY);
        if (saved) {
            window.gameState = { ...initialState, ...JSON.parse(saved) };
            console.log("Game state loaded.", window.gameState);
            return true;
        }
    } catch (e) {
        console.error("Failed to load state from localStorage:", e);
    }
    
    console.log("No save found. Starting fresh.", window.gameState);
    return false;
}

/**
 * Saves current window.gameState to localStorage.
 */
function saveState() {
    try {
        localStorage.setItem(STATE_KEY, JSON.stringify(window.gameState));
        console.log("Game state saved.");
    } catch (e) {
        console.error("Failed to save state to localStorage:", e);
    }
}

/**
 * Resets state to default and clears localStorage.
 */
function resetState() {
    window.gameState = { ...initialState };
    try {
        localStorage.removeItem(STATE_KEY);
        console.log("Game state reset.");
    } catch (e) {
        console.error("Failed to clear localStorage:", e);
    }
}
