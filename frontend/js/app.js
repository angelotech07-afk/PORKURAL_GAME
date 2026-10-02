/**
 * Culture Game - Main Application
 * Initializes the game and binds logic to the UI.
 */

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
    initGame();
});

/**
 * Initializes the frontend prototype.
 */
async function initGame() {
    console.log("Initializing Culture Game Frontend...");
    
    // Ensure we start cleanly on the Main Menu
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('home-screen').classList.add('active');
    
    // Load state. If no save exists, state.js uses defaults.
    loadState();
    
    const statusEl = document.getElementById('backend-status');
    const storedPid = localStorage.getItem('culture_game_player_id');
    
    // We only visually update the offline/online indicator if possible, but we don't force a network request yet
    // Check backend health
    const health = await checkHealth();
    if (health) {
        window.gameState.serverConnected = true;
        if (statusEl) {
            statusEl.textContent = "🟢 SERVER ONLINE";
            statusEl.style.color = "#4caf50";
        }
    } else {
        window.gameState.serverConnected = false;
        if (statusEl) {
            statusEl.textContent = "🔴 SERVER OFFLINE";
            statusEl.style.color = "#ff3b3b";
        }
    }

    if (!storedPid) {
        window.gameState.serverConnected = false;
        if (statusEl) {
            statusEl.textContent = "🟡 OFFLINE MODE";
            statusEl.style.color = "#d4af37";
        }
    }
}

/**
 * Handles the "START" button on the Main Menu.
 */
function startNewGameFlow() {
    if (window.audioManager) {
        window.audioManager.unlockAudio();
    }
    window.audioManager.playSFX('button_click.mp3');
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('login-screen').classList.add('active');
}

/**
 * Validates and processes the Login form.
 */
async function handleLogin() {
    if (window.audioManager) {
        window.audioManager.unlockAudio();
    }
    window.audioManager.playSFX('button_click.mp3');
    
    const nameInput = document.getElementById('login-name').value.trim();
    const ageInput = document.getElementById('login-age').value.trim();
    const errorDiv = document.getElementById('login-error');
    
    if (!nameInput) {
        errorDiv.textContent = "Player Name is required.";
        errorDiv.classList.remove('hidden');
        return;
    }
    
    if (nameInput.length > 30) {
        errorDiv.textContent = "Player Name is too long (max 30).";
        errorDiv.classList.remove('hidden');
        return;
    }
    
    if (!ageInput || isNaN(ageInput)) {
        errorDiv.textContent = "Please enter a valid numeric age.";
        errorDiv.classList.remove('hidden');
        return;
    }
    
    const age = parseInt(ageInput, 10);
    if (age < 5 || age > 120) {
        errorDiv.textContent = "Please enter an age between 5 and 120.";
        errorDiv.classList.remove('hidden');
        return;
    }
    
    errorDiv.classList.add('hidden');
    
    // Disable inputs while communicating with server
    const btn = document.getElementById('login-start-btn');
    const oldBtnText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Checking server...';
    
    try {
        const pid = await createGuestPlayer(nameInput, age);
        
        if (pid) {
            window.gameState.serverConnected = true;
            window.gameState.playerId = pid;
            window.gameState.playerName = nameInput; // Store locally for session
            
            const statusEl = document.getElementById('backend-status');
            if (statusEl) {
                statusEl.textContent = "🟢 SERVER CONNECTED";
                statusEl.style.color = "#4caf50";
            }
            
            const bootstrap = await getBootstrap(pid);
            if (bootstrap) {
                mergeServerState(bootstrap);
            }
            
            updateChapterUI();
            if (typeof updateCodexUI === 'function') updateCodexUI();
            saveState();
            
            // Go to chapters
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById('chapters-screen').classList.add('active');
            window.audioManager.playMusic('menu.mp3');
        } else {
            errorDiv.textContent = "Unable to connect to the game server. Please try again.";
            errorDiv.classList.remove('hidden');
        }
    } catch (e) {
        console.error("Login Error:", e);
        errorDiv.textContent = `Error: ${e.message}`;
        errorDiv.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.textContent = oldBtnText;
    }
}

/**
 * Handles the "CONTINUE" button on the home screen.
 */
async function handleContinue() {
    if (window.audioManager) {
        window.audioManager.unlockAudio();
    }
    window.audioManager.playSFX('button_click.mp3');
    
    const storedPid = localStorage.getItem('culture_game_player_id');
    const msg = document.getElementById('continue-msg');
    
    if (!storedPid) {
        if (msg) {
            msg.textContent = "No saved game found. Please use START to create a new game.";
            msg.classList.remove('hidden');
            setTimeout(() => msg.classList.add('hidden'), 3000);
        }
        return;
    }

    const pid = parseInt(storedPid, 10);
    
    // UI Feedback
    const btn = document.getElementById('btn-continue');
    const oldText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "CONNECTING...";

    const statusEl = document.getElementById('backend-status');
    const bootstrap = await getBootstrap(pid);
    
    btn.disabled = false;
    btn.textContent = oldText;

    if (bootstrap) {
        window.gameState.serverConnected = true;
        window.gameState.playerId = pid;
        if (statusEl) {
            statusEl.textContent = "🟢 SERVER CONNECTED";
            statusEl.style.color = "#4caf50";
        }
        
        loadState();
        mergeServerState(bootstrap);
        updateChapterUI();
        if (typeof updateCodexUI === 'function') updateCodexUI();
        
        // Go to chapters
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('chapters-screen').classList.add('active');
        window.audioManager.playMusic('menu.mp3');
    } else {
        window.gameState.serverConnected = false;
        if (statusEl) {
            statusEl.textContent = "🔴 SERVER OFFLINE";
            statusEl.style.color = "#ff3b3b";
        }
        
        if (msg) {
            msg.textContent = "Unable to connect to the game server. Try again later.";
            msg.classList.remove('hidden');
            setTimeout(() => msg.classList.add('hidden'), 3000);
        }
    }
}

/**
 * Applies chapter-specific theme logic.
 */
function applyTheme(chapterNum) {
    const body = document.body;
    body.classList.remove('theme-kerala');
    body.classList.remove('theme-rajasthan');
    body.classList.remove('theme-maharashtra');
    body.classList.remove('theme-tamilnadu');
    body.classList.remove('theme-karnataka');
    
    if (chapterNum === 1) {
        body.classList.add('theme-kerala');
    } else if (chapterNum === 2) {
        body.classList.add('theme-rajasthan');
    } else if (chapterNum === 3) {
        body.classList.add('theme-maharashtra');
    } else if (chapterNum === 4) {
        body.classList.add('theme-tamilnadu');
    } else if (chapterNum === 5) {
        body.classList.add('theme-karnataka');
    }
}

/**
 * Updates the Chapter Selection UI to reflect locked/unlocked states based on gameState.
 */
function updateChapterUI() {
    // Top summary
    let completedList = window.gameState.completed_chapters || [];
    if (!Array.isArray(completedList)) completedList = [completedList];
    let unlockedList = window.gameState.unlocked_chapters || [1];
    if (!Array.isArray(unlockedList)) unlockedList = [unlockedList];
    let codexList = window.gameState.unlocked_codex || [];
    if (!Array.isArray(codexList)) codexList = [codexList];
    
    const compCount = document.getElementById('journey-completed-count');
    const discCount = document.getElementById('journey-discovery-count');
    const knowScore = document.getElementById('journey-knowledge-score');
    
    // Safely get the number of chapters from CHAPTER_DATA
    const totalChapters = typeof CHAPTER_DATA !== 'undefined' ? Object.keys(CHAPTER_DATA).length : 5;
    
    if (compCount) compCount.textContent = completedList.length;
    if (discCount) discCount.textContent = codexList.length;
    if (knowScore) knowScore.textContent = window.gameState.knowledge_score || 0;
    
    // Progress dots
    const progressContainer = document.getElementById('journey-progress-dots');
    if (progressContainer) {
        progressContainer.innerHTML = '';
        for (let i = 1; i <= totalChapters; i++) {
            const span = document.createElement('span');
            if (completedList.includes(i)) {
                span.innerHTML = '●';
                span.style.color = 'var(--color-primary)';
            } else if (unlockedList.includes(i)) {
                span.innerHTML = '●';
                span.style.color = '#fff';
            } else {
                span.innerHTML = '○';
                span.style.color = '#555';
            }
            progressContainer.appendChild(span);
            if (i < totalChapters) {
                const line = document.createElement('span');
                line.innerHTML = '────';
                line.style.color = completedList.includes(i) ? 'var(--color-primary)' : '#555';
                progressContainer.appendChild(line);
            }
        }
    }
    
    const container = document.getElementById('journey-path-container');
    if (!container) return; 
    container.innerHTML = '';
    
    // Determine the "current" chapter to emphasize safely
    let currentActiveChapter = 1;
    if (unlockedList.length > 0) {
        currentActiveChapter = Math.max(...unlockedList.filter(n => typeof n === 'number' && !isNaN(n)));
        if (!isFinite(currentActiveChapter) || currentActiveChapter < 1) currentActiveChapter = 1;
    }
    
    if (completedList.includes(currentActiveChapter) && currentActiveChapter < totalChapters) {
        currentActiveChapter = currentActiveChapter + 1; 
    }
    
    if (typeof CHAPTER_DATA === 'undefined') return;
    
    for (let i = 1; i <= totalChapters; i++) {
        const chapterData = CHAPTER_DATA[i];
        if (!chapterData) continue;
        
        const isCompleted = completedList.includes(i);
        const isUnlocked = unlockedList.includes(i);
        const isCurrent = (i === currentActiveChapter);
        
        // Draw the vertical line connecting to the previous node (except for the first one)
        if (i > 1) {
            const line = document.createElement('div');
            line.style.width = '4px';
            line.style.height = '40px';
            line.style.background = completedList.includes(i-1) ? 'var(--color-primary)' : '#444';
            line.style.margin = '0 auto';
            container.appendChild(line);
        }
        
        const card = document.createElement('div');
        card.className = 'chapter-card';
        card.style.width = '100%';
        card.style.maxWidth = '400px';
        card.style.position = 'relative';
        card.style.border = '2px solid #555';
        card.style.background = 'rgba(0,0,0,0.8)';
        card.style.padding = '20px';
        card.style.borderRadius = '8px';
        card.style.textAlign = 'center';
        
        if (isCompleted) {
            card.style.borderColor = 'var(--color-primary)';
            let knowledgeMsg = '';
            if (chapterData.codexId && codexList.includes(chapterData.codexId)) {
                knowledgeMsg = `<div style="color: #9c27b0; font-size: 0.9rem; font-weight: bold; margin-top: 10px;">🧠 KNOWLEDGE COLLECTED</div>`;
            }
            
            card.innerHTML = `
                <h3 style="color: var(--color-secondary); font-size: 1rem; margin-bottom: 5px;">${(chapterData.region || "").toUpperCase()}</h3>
                <h2 style="color: var(--color-primary); margin-bottom: 15px; font-size: 1.4rem;">${(chapterData.name || "").toUpperCase()}</h2>
                <div class="status" style="color: #d4af37; font-weight: bold; margin-top: 15px;">✓ COMPLETED</div>
                ${knowledgeMsg}
            `;
            card.onclick = () => { startChapter(i); };
            card.style.cursor = 'pointer';
        } else if (isUnlocked) {
            if (isCurrent) {
                card.style.boxShadow = '0 0 15px rgba(76, 175, 80, 0.4)';
                card.style.borderColor = '#4caf50';
            }
            card.innerHTML = `
                <h3 style="color: var(--color-secondary); font-size: 1rem; margin-bottom: 5px;">${(chapterData.region || "").toUpperCase()}</h3>
                <h2 style="color: #fff; margin-bottom: 15px; font-size: 1.4rem;">${(chapterData.name || "").toUpperCase()}</h2>
                ${isCurrent ? `<div style="background: #4caf50; color: #000; padding: 5px 10px; font-weight: bold; font-size: 0.8rem; border-radius: 4px; display: inline-block; margin-bottom: 10px;">CURRENT JOURNEY</div><br>` : ''}
                <div class="status" style="color: #4caf50; font-weight: bold; margin-top: 10px;">▶ CONTINUE JOURNEY</div>
            `;
            card.onclick = () => { startChapter(i); };
            card.style.cursor = 'pointer';
        } else {
            card.classList.add('locked');
            card.style.opacity = '0.7';
            card.innerHTML = `
                <h3 style="color: #888; font-size: 1rem; margin-bottom: 5px;">${(chapterData.region || "").toUpperCase()}</h3>
                <h2 style="color: #888; margin-bottom: 15px; font-size: 1.4rem;">${(chapterData.name || "").toUpperCase()}</h2>
                <div class="status" style="color: var(--color-accent); font-weight: bold; margin-top: 15px;">🔒 LOCKED</div>
                <p style="color: #666; font-style: italic; margin-top: 10px; font-size: 0.9rem;">Continue your journey<br>to unlock this region.</p>
            `;
            card.onclick = null;
        }
        
        container.appendChild(card);
    }
}

/**
 * Handles clicking a state on the geographic SVG map.
 */
function selectState(chapterNum, stateName) {
    if (window.gameState.unlocked_chapters.includes(chapterNum)) {
        // Proceed to chapter
        startChapter(chapterNum);
    } else {
        // State is locked
        console.log(`${stateName} is locked.`);
        // Could show a toast notification here
    }
}
