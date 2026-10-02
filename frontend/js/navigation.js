/**
 * Culture Game - Navigation
 * Handles showing and hiding different screens in the SPA.
 */

/**
 * Hides all screens and shows only the one with the given ID.
 * @param {string} screenId - The HTML ID of the screen to show (e.g., 'home-screen').
 */
function showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    } else {
        console.error(`Screen with ID '${screenId}' not found!`);
    }
}

// Navigation helpers
function goToHome() {
    showScreen('home-screen');
}

function goToWorldMap() {
    showScreen('chapters-screen');
}

function goToChapters() {
    showScreen('chapters-screen');
}

function goToStory() {
    showScreen('story-screen');
}

function goToBattle() {
    showScreen('battle-screen');
}

function goToBoss() {
    showScreen('boss-screen');
    if (typeof startBossFight === 'function') {
        startBossFight();
    }
}

async function goToChallenge() {
    showScreen('challenge-screen'); // Show screen first so it doesn't feel lagging
    
    if (typeof initChallenge === 'function') {
        const chapter = window.gameState.current_chapter;
        
        // Show loading state
        document.getElementById('challenge-title').textContent = "LOADING CHALLENGE...";
        document.getElementById('challenge-question').textContent = "";
        document.getElementById('challenge-options').innerHTML = "";
        
        try {
            // Fetch from backend API as per requirements
            let url = `/challenges/chapter/${chapter}`;
            if (window.gameState && window.gameState.playerId) {
                url += `?player_id=${window.gameState.playerId}`;
            }
            let challengeData = await apiRequest(url);
            if (challengeData) {
                initChallenge(challengeData);
            } else {
                console.warn("No challenges found from API for chapter " + chapter);
                // Fallback gracefully without throwing error
                initChallenge({
                    title: "Historical Challenge Missing",
                    question: "Could not retrieve regional questions from the server.",
                    options: [{ text: "Continue", isCorrect: true }],
                    explanation: "Backend server may be unreachable."
                });
            }
        } catch (e) {
            console.error("Failed to load challenge", e);
        }
    }
}

function goToReward() {
    showScreen('reward-screen');
}

function goToCodex() {
    showScreen('codex-screen');
}

function goToSettings() {
    showScreen('settings-screen');
}
