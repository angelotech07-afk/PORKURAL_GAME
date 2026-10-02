/**
 * Culture Game - API Layer
 * Handles communication with the FastAPI backend.
 */

const API_BASE_URL = "http://127.0.0.1:8000/api";

/**
 * Generic API request wrapper with error handling and timeout.
 */
async function apiRequest(endpoint, method = "GET", body = null) {
    if (window.Capacitor) {
        // Offline demo mode for APK: bypass all network requests
        if (endpoint === '/health') return null; // Force offline state UI
        if (endpoint.startsWith('/game/bootstrap/')) return null; // Use local state defaults
        if (endpoint === '/players/guest') return { player_id: Math.floor(Math.random() * 10000) };
        return { success: true };
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
            cache: 'no-store'
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errText}`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(`Connection timed out after 5 seconds.`);
        }
        throw error;
    }
}

/**
 * Creates a guest player on the backend.
 */
async function createGuestPlayer(username, age) {
    const body = { username: username || `Guest_${Math.floor(Math.random() * 10000)}` };
    if (age) body.age = age;
    
    const result = await apiRequest('/players/guest', 'POST', body);
    
    if (result && result.player_id) {
        localStorage.setItem('culture_game_player_id', result.player_id);
        return result.player_id;
    }
    
    return null;
}

/**
 * Fetches the backend bootstrap state.
 */
async function getBootstrap(playerId) {
    if (!playerId) return null;
    return await apiRequest(`/game/bootstrap/${playerId}`, 'GET');
}

/**
 * Sends a game event (e.g. boss_defeated).
 */
async function sendGameEvent(playerId, chapterId, eventType, eventData = {}) {
    if (!playerId) return null;
    const body = {
        player_id: playerId,
        chapter_id: chapterId,
        event_type: eventType,
        event_data: eventData
    };
    return await apiRequest('/game/event', 'POST', body);
}

/**
 * Submits a challenge answer.
 */
async function submitChallenge(playerId, challengeId, answer) {
    if (!playerId || !challengeId) return null;
    const body = {
        player_id: playerId,
        challenge_id: challengeId,
        answer: answer
    };
    return await apiRequest('/challenges/submit', 'POST', body);
}

/**
 * Completes a chapter on the server.
 */
async function completeChapter(playerId, chapterId) {
    if (!playerId || !chapterId) return null;
    const body = {
        player_id: playerId,
        chapter_id: chapterId
    };
    return await apiRequest('/game/complete-chapter', 'POST', body);
}


/**
 * Checks backend health.
 */
async function checkHealth() {
    return await apiRequest('/health', 'GET');
}
