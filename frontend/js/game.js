/**
 * Culture Game - Game Logic (Story, Combat, Challenge, Progression)
 */

const CHAPTER_DATA = {
    1: {
        name: "The Way of Kalari",
        region: "Kerala",
        story: [
            "The journey begins in Kerala, where the ancient martial tradition of Kalaripayattu shapes warriors through discipline, courage and skill.",
            "The path leads deep into the traditions of Kerala.",
            "At the Kalari, the player learns that strength comes from discipline.",
            "An opponent appears and challenges the warrior.",
            "Your training begins now."
        ],
        enemy: { name: "Kalari Warrior", maxHealth: 100 },
        boss: { name: "Gurukkal Raman", maxHealth: 200 },
        challenge: {
            title: "KERALA CULTURE CHALLENGE",
            question: "Which traditional martial art originated in Kerala?",
            options: [
                { text: "A. Kalaripayattu", isCorrect: true },
                { text: "B. Gatka", isCorrect: false },
                { text: "C. Thang-Ta", isCorrect: false },
                { text: "D. Silambam", isCorrect: false }
            ],
            successMsg: "Correct! You have learned about Kalaripayattu.",
            failMsg: "Not quite. Learn and try again.",
            correctMatch: "Kalaripayattu"
        },
        rewards: { xp: 500, coins: 100, score: 500 },
        codexId: 'codex_kalari'
    },
    2: {
        name: "Shadows of Rajasthan",
        region: "Rajasthan",
        story: [
            "The journey continues into the lands of Rajasthan, where courage, honour and warrior traditions shaped the history of Rajputana.",
            "The warrior enters the rugged lands of Rajasthan.",
            "Fortresses rise above the desert, guarding stories of courage and honour.",
            "A Rajput warrior challenges you to prove your strength.",
            "Prepare yourself for battle."
        ],
        enemy: { name: "Rajput Warrior", maxHealth: 120 },
        boss: { name: "GENERAL VIKRAM SINGH", maxHealth: 220 },
        challenge: {
            title: "RAJASTHAN CULTURE CHALLENGE",
            question: "Which type of traditional fortification is strongly associated with the historic architecture of Rajasthan?",
            options: [
                { text: "A. Hill forts", isCorrect: true },
                { text: "B. Floating forts", isCorrect: false },
                { text: "C. Ice forts", isCorrect: false },
                { text: "D. Underground sea forts", isCorrect: false }
            ],
            successMsg: "Correct! Rajasthan is famous for its historic hill forts.",
            failMsg: "Not quite. Explore the heritage of Rajasthan and learn more.",
            correctMatch: "Hill forts"
        },
        rewards: { xp: 600, coins: 120, score: 600 },
        codexId: 'codex_rajputana'
    },
    3: {
        name: "The Maratha Stand",
        region: "Maharashtra",
        story: [
            "The journey moves west into Maharashtra, where courage, strategy and determination shaped the rise of the Maratha Empire.",
            "The warrior enters the rugged landscapes of Maharashtra.",
            "Fortresses stand across the mountains, guarding a powerful legacy.",
            "A determined Maratha warrior blocks the path.",
            "Stand your ground. The next battle begins."
        ],
        enemy: { name: "Maratha Warrior", maxHealth: 130 },
        boss: { name: "Commander Tariq", maxHealth: 240 },
        challenge: {
            title: "MAHARASHTRA CULTURE CHALLENGE",
            question: "Which type of fort is strongly associated with the historic military heritage of the Maratha Empire?",
            options: [
                { text: "A. Hill forts", isCorrect: true },
                { text: "B. Ice forts", isCorrect: false },
                { text: "C. Floating forts", isCorrect: false },
                { text: "D. Desert-only forts", isCorrect: false }
            ],
            successMsg: "Correct! Hill forts played an important role in the military heritage of the Maratha period.",
            failMsg: "Not quite. Explore the heritage of Maharashtra and learn more.",
            correctMatch: "Hill forts"
        },
        rewards: { xp: 700, coins: 140, score: 700 },
        codexId: 'codex_maratha'
    },
    4: {
        name: "The Naval Supremacy",
        region: "Tamil Nadu",
        story: [
            "The journey reaches the eastern coast of Tamil Nadu.",
            "Ships prepare to sail across the seas, carrying the ambition of a powerful maritime kingdom.",
            "Far inland, monumental temples rise as symbols of art, architecture and devotion.",
            "Before the journey can continue, a powerful naval commander stands in your path."
        ],
        enemy: { name: "Chola Warrior", maxHealth: 140 },
        boss: { name: "Admiral Rajendra", maxHealth: 260 },
        challenge: {
            title: "TAMIL NADU CULTURE CHALLENGE",
            question: "Which famous Chola-era temple is located in Thanjavur?",
            options: [
                { text: "A. Brihadisvara Temple", isCorrect: true },
                { text: "B. Konark Sun Temple", isCorrect: false },
                { text: "C. Meenakshi Amman Temple", isCorrect: false },
                { text: "D. Dilwara Temples", isCorrect: false }
            ],
            successMsg: "Correct! The Brihadisvara Temple at Thanjavur is one of the great monuments associated with Chola architecture.",
            failMsg: "Not quite. Explore the architectural heritage of Tamil Nadu and learn more.",
            correctMatch: "Brihadisvara Temple"
        },
        rewards: { xp: 800, coins: 160, score: 800 },
        codexId: 'codex_chola'
    },
    5: {
        name: "The City of Victory",
        region: "Karnataka",
        story: [
            "The journey reaches the historic landscapes of Karnataka.",
            "Among the ruins of a once-great capital, magnificent stone monuments reveal the creativity of a remarkable civilization.",
            "Markets, temples, music and art once filled the streets of Vijayanagara.",
            "The final guardian stands before you. Prove that you have learned from the journey."
        ],
        enemy: { name: "Vijayanagara Warrior", maxHealth: 150 },
        boss: { name: "Commander Krishnadeva", maxHealth: 280 },
        challenge: {
            title: "KARNATAKA CULTURE CHALLENGE",
            question: "Hampi is best known as the historic capital associated with which South Indian empire?",
            options: [
                { text: "A. Vijayanagara Empire", isCorrect: true },
                { text: "B. Maurya Empire", isCorrect: false },
                { text: "C. Gupta Empire", isCorrect: false },
                { text: "D. Kushan Empire", isCorrect: false }
            ],
            successMsg: "Correct! Hampi is renowned for its monumental heritage and its association with the Vijayanagara Empire.",
            failMsg: "Not quite. Explore the heritage of Karnataka and learn more about Vijayanagara.",
            correctMatch: "Vijayanagara Empire"
        },
        rewards: { xp: 1000, coins: 200, score: 1000 },
        codexId: 'codex_vijayanagara'
    }
};

const codexDatabase = {
    'codex_kalari': {
        title: "Kalaripayattu",
        region: "Kerala",
        desc: "Kalaripayattu is a traditional martial art associated with Kerala. It is known for physical training, discipline, flexibility and traditional weapons practice."
    },
    'codex_rajputana': {
        title: "Rajputana Forts",
        region: "Rajasthan",
        desc: "Rajasthan is renowned for its historic forts, including impressive hill forts that reflect the region's military architecture, royal history and cultural heritage."
    },
    'codex_maratha': {
        title: "Maratha Forts",
        region: "Maharashtra",
        desc: "The Maratha period is closely associated with a network of forts, many built or strengthened across the hills of Maharashtra. These forts played important roles in defence, administration and regional history."
    },
    'codex_chola': {
        title: "Chola Architecture",
        region: "Tamil Nadu",
        desc: "The Chola period is renowned for monumental temple architecture. The Brihadisvara Temple at Thanjavur is one of the most celebrated examples of Chola architectural achievement."
    },
    'codex_vijayanagara': {
        title: "Vijayanagara Heritage",
        region: "Karnataka",
        desc: "Vijayanagara is remembered for its monumental architecture, temples, sculpture, markets and rich artistic heritage. The ruins of Hampi preserve important evidence of this extraordinary historical landscape."
    }
};

const CHAPTER_LEARNING_SUMMARY = {
    1: {
        title: "THE WAY OF KALARI",
        region: "KERALA",
        lessons: [
            "Kalaripayattu is a traditional martial art of Kerala.",
            "The training emphasizes discipline, movement and combat techniques.",
            "The Kalari is the traditional training space associated with this martial tradition."
        ],
        knowledge: [
            "Kalaripayattu",
            "Kerala martial tradition",
            "Kalari training"
        ],
        codex: "Kalaripayattu"
    },
    2: {
        title: "SHADOWS OF RAJASTHAN",
        region: "RAJASTHAN",
        lessons: [
            "Rajasthan is renowned for its impressive hill forts and defensive architecture.",
            "Rajput warrior traditions placed high value on courage and honour.",
            "The region's history is deeply connected to its rugged landscapes and fortresses."
        ],
        knowledge: [
            "Rajasthan",
            "Rajput warrior traditions",
            "Forts and defensive heritage",
            "Courage and honour"
        ],
        codex: "Rajputana Forts"
    },
    3: {
        title: "THE MARATHA STAND",
        region: "MAHARASHTRA",
        lessons: [
            "The Maratha period is strongly associated with a network of strategic hill forts.",
            "These fortifications played a key role in regional defense and administration.",
            "The Maratha military tradition emphasized strategy, resilience and resistance."
        ],
        knowledge: [
            "Maharashtra",
            "Maratha history",
            "Hill forts",
            "Strategy and resistance"
        ],
        codex: "Maratha Forts"
    },
    4: {
        title: "THE NAVAL SUPREMACY",
        region: "TAMIL NADU",
        lessons: [
            "The Chola empire was a dominant maritime power with significant naval influence.",
            "They are celebrated for their monumental temple architecture.",
            "The Brihadisvara Temple in Thanjavur is a prime example of their cultural legacy."
        ],
        knowledge: [
            "Tamil Nadu",
            "Chola maritime power",
            "Naval tradition",
            "Temple architecture",
            "Brihadisvara Temple"
        ],
        codex: "Chola Architecture"
    },
    5: {
        title: "THE CITY OF VICTORY",
        region: "KARNATAKA",
        lessons: [
            "The Vijayanagara Empire was one of South India's greatest historical kingdoms.",
            "Its capital, Hampi, is renowned for its remarkable architecture, temples and art.",
            "The ruins reflect a rich cultural heritage and an era of immense prosperity."
        ],
        knowledge: [
            "Karnataka",
            "Vijayanagara Empire",
            "Hampi",
            "Architecture, art and cultural heritage"
        ],
        codex: "Vijayanagara Heritage"
    }
};

// ==========================================
// STORY SYSTEM
// ==========================================
let currentStoryPanels = [];
let currentPanelIndex = 0;

function getStoryImage(chapterNum, title) {
    const t = (title || "").toLowerCase();
    
    if (chapterNum === 1) {
        if (t.includes('kalaripayattu')) return 'assets/story/kerala/kalaripayattu.jpg';
        if (t.includes('kalari') && !t.includes('kalaripayattu')) return 'assets/story/kerala/kalari-arena.jpg';
        if (t.includes('vaal') || t.includes('paricha') || t.includes('weapon')) return 'assets/story/kerala/vaal-paricha.jpg';
        if (t.includes('gurukkal')) return 'assets/story/kerala/gurukkal.jpg';
        return 'assets/story/kerala/kalari-arena.jpg'; 
    }
    else if (chapterNum === 2) {
        if (t.includes('journey continues') || t.includes('desert') || t.includes('rajputana')) return 'assets/story/rajasthan/rajasthan_desert.jpg';
        if (t.includes('warrior enters') || t.includes('rugged lands')) return 'assets/story/rajasthan/rajput_warrior.jpg';
        if (t.includes('fortresses') || t.includes('fort')) return 'assets/story/rajasthan/rajasthan_fort.jpg';
        if (t.includes('challenges you') || t.includes('prove your strength')) return 'assets/story/rajasthan/rajput_weapons.jpg';
        return 'assets/story/rajasthan/rajasthan_desert.jpg';
    }
    else if (chapterNum === 3) {
        if (t.includes('journey moves west') || t.includes('maharashtra') || t.includes('empire')) return 'assets/story/maharashtra/maharashtra_ghats.jpg';
        if (t.includes('warrior enters') || t.includes('rugged landscapes')) return 'assets/story/maharashtra/maratha_warrior.jpg';
        if (t.includes('fortresses') || t.includes('fort')) return 'assets/story/maharashtra/maratha_fort.jpg';
        if (t.includes('blocks the path') || t.includes('determined maratha')) return 'assets/story/maharashtra/maratha_weapons.jpg';
        return 'assets/story/maharashtra/maharashtra_ghats.jpg';
    }
    else if (chapterNum === 4) {
        if (t.includes('eastern coast') || t.includes('tamil nadu') || t.includes('sea')) return 'assets/story/tamil_nadu/tamil_nadu_coast.jpg';
        return 'assets/story/tamil_nadu/tamil_nadu_coast.jpg'; // Using coast as fallback since quota exceeded
    }
    else if (chapterNum === 5) {
        // Fallback for chapter 5
        return 'assets/story/kerala/kalari-arena.jpg';
    }
    
    return 'assets/story/kerala/kalari-arena.jpg';
}

function getEraForChapter(chapterNum) {
    switch (chapterNum) {
        case 1: return "11th Century AD";
        case 2: return "Medieval Era";
        case 3: return "17th Century";
        case 4: return "9th - 13th Century";
        case 5: return "14th - 17th Century";
        default: return "Historical Era";
    }
}

async function startChapter(chapterNum) {
    window.gameState.current_chapter = chapterNum;
    
    // Capture pre-chapter totals for accurate reward deltas
    window.gameState.chapterStartXP = window.gameState.xp;
    window.gameState.chapterStartCoins = window.gameState.coins;
    window.gameState.chapterStartScore = window.gameState.score;
    window.gameState.earned_knowledge_this_chapter = 0;
    
    if (typeof window.gameState.knowledge_score !== 'number') {
        window.gameState.knowledge_score = 0;
    }
    
    saveState();
    
    // Apply styling if needed (Theme logic in app.js)
    if (typeof applyTheme === 'function') {
        applyTheme(chapterNum);
    }
    
    const data = CHAPTER_DATA[chapterNum];
    if (data) {
        // Fetch story from backend
        let storyData = [];
        try {
            storyData = await apiRequest(`/story/chapter/${chapterNum}`);
        } catch (error) {
            console.error("Failed to fetch story from backend:", error);
            // We allow the game to continue even if story fetch fails.
            // storyData remains empty, so no historical panels will be added.
        }
        
        let fetchedPanels = [];
        if (storyData && Array.isArray(storyData) && storyData.length > 0) {
            console.log(`[STORY DEBUG] Received ${storyData.length} stories from backend.`);
            
            const uniqueStories = [];
            const duplicateIds = [];
            
            storyData.forEach(story => {
                const normTitle = (story.title || "").trim().replace(/\s+/g, ' ').toLowerCase();
                const normContent = (story.content || "").trim().replace(/\s+/g, ' ').toLowerCase();
                
                const isDuplicate = uniqueStories.some(u => {
                    const uTitle = (u.title || "").trim().replace(/\s+/g, ' ').toLowerCase();
                    const uContent = (u.content || "").trim().replace(/\s+/g, ' ').toLowerCase();
                    return uTitle === normTitle && uContent === normContent;
                });
                
                if (!isDuplicate) {
                    uniqueStories.push(story);
                } else {
                    duplicateIds.push(story.id);
                }
            });
            
            console.log(`[STORY DEBUG] Story duplicates removed: ${duplicateIds.length}`);
            if (duplicateIds.length > 0) {
                console.log(`[STORY DEBUG] Duplicate story IDs: ${duplicateIds.join(', ')}`);
            }
            
            const era = getEraForChapter(chapterNum);
            fetchedPanels = uniqueStories.map(entry => {
                return {
                    title: entry.title,
                    content: entry.content,
                    region: CHAPTER_DATA[chapterNum].region || CHAPTER_DATA[chapterNum].name,
                    era: era,
                    image: getStoryImage(chapterNum, entry.title)
                };
            });
        }
        
        // Add intro panel before historical text
        let introText = "";
        if (chapterNum === 1) {
            introText = `Welcome, Warrior. You have travelled to Kerala to learn the ancient art of Kalaripayattu. Before you enter the Kalari to face the Gurukkal and his students, you must understand the culture and history of this land. Read the following historical accounts carefully, as you will be tested on them after your battles.`;
        } else if (chapterNum === 2) {
            introText = `Warrior, you have entered Rajasthan. The rugged forts and desert sands hold the legacy of Rajput honor. Study their history, for it will guide your path.`;
        } else if (chapterNum === 3) {
            introText = `Welcome to Maharashtra. The mountains echo with the legacy of a great empire. Learn of their fortifications and strategy before you face their champions.`;
        } else if (chapterNum === 4) {
            introText = `You have reached Tamil Nadu, home to monumental temples and the naval might of the Chola empire. Absorb their cultural wealth before your trials begin.`;
        } else if (chapterNum === 5) {
            introText = `Your journey culminates in Karnataka, amidst the ruins of Vijayanagara. Witness the art and glory of this empire, and prepare for your final challenge.`;
        }
        
        if (introText) {
            fetchedPanels.unshift({
                title: "THE JOURNEY BEGINS",
                content: introText,
                region: CHAPTER_DATA[chapterNum].region || CHAPTER_DATA[chapterNum].name,
                era: "Present",
                image: getStoryImage(chapterNum, "Kalari")
            });
        }
        
        currentStoryPanels = fetchedPanels;
        currentPanelIndex = 0;
        
        console.log("[STORY DEBUG] loaded unique entries:", currentStoryPanels.length);
        
        const titleEl = document.getElementById('story-chapter-title');
        if (titleEl) {
            titleEl.textContent = `CHAPTER ${chapterNum}: ${data.name.toUpperCase()}`;
        }
        
        // Ensure story screen is prepped before showing
        const nextBtn = document.getElementById('story-next-btn');
        if (nextBtn) {
            nextBtn.onclick = currentStoryPanels.length > 1 ? nextStoryPanel : handleStoryEnd;
        }
        
        updateStoryUI();
        goToStory();
    }
}

function updateStoryUI() {
    const storyText = document.getElementById('story-text');
    const storyTitle = document.getElementById('story-title');
    const storyImage = document.getElementById('story-image');
    const storyMetadata = document.getElementById('story-metadata');
    const nextBtn = document.getElementById('story-next-btn');
    
    console.log("[STORY DEBUG] current index:", currentPanelIndex);
    
    if (currentStoryPanels[currentPanelIndex]) {
        const panel = currentStoryPanels[currentPanelIndex];
        
        if (storyTitle) storyTitle.textContent = panel.title;
        if (storyText) storyText.innerHTML = panel.content;
        if (storyMetadata) storyMetadata.textContent = `${panel.region} • ${panel.era}`;
        
        if (storyImage) {
            if (panel.image) {
                storyImage.src = panel.image;
                storyImage.style.display = 'block';
            } else {
                storyImage.style.display = 'none';
            }
        }
        
        if (storyText) {
            storyText.style.animation = 'none';
            storyText.offsetHeight; 
            storyText.style.animation = null;
        }
    }

    if (currentPanelIndex >= currentStoryPanels.length - 1) {
        nextBtn.textContent = window.gameState.current_chapter === 1 ? 'CONTINUE' : 'START BATTLE';
        nextBtn.onclick = handleStoryEnd;
    } else {
        nextBtn.textContent = 'NEXT';
        nextBtn.onclick = nextStoryPanel;
    }
}

function nextStoryPanel() {
    if (currentPanelIndex < currentStoryPanels.length - 1) {
        currentPanelIndex++;
        updateStoryUI();
    }
}

function skipStory() {
    handleStoryEnd();
}

function handleStoryEnd() {
    if (window.gameState.current_chapter === 1) {
        showCulturalDiscovery(1);
    } else {
        startChapterBattle();
    }
}

function showCulturalDiscovery(chapterNum) {
    if (chapterNum === 1) {
        document.getElementById('discovery-topic').textContent = "KALARIPAYATTU";
        document.getElementById('discovery-img').src = "assets/story/kerala/kalaripayattu.jpg";
        document.getElementById('discovery-desc').textContent = "Kalaripayattu is a traditional martial art of Kerala known for disciplined physical training, movement and combat techniques.";
    }
    
    const addBtn = document.getElementById('discovery-add-btn');
    const continueBtn = document.getElementById('discovery-continue-btn');
    const statusMsg = document.getElementById('discovery-status');
    
    statusMsg.classList.add('hidden');
    addBtn.classList.remove('hidden');
    continueBtn.classList.add('hidden');
    
    showScreen('discovery-screen');
}

function addToCodexFromDiscovery() {
    const addBtn = document.getElementById('discovery-add-btn');
    const continueBtn = document.getElementById('discovery-continue-btn');
    const statusMsg = document.getElementById('discovery-status');
    
    statusMsg.classList.remove('hidden');
    addBtn.classList.add('hidden');
    continueBtn.classList.remove('hidden');
    
    const chapterNum = window.gameState.current_chapter;
    const data = CHAPTER_DATA[chapterNum];
    
    if (typeof window.gameState.knowledge_score !== 'number') {
        window.gameState.knowledge_score = 0;
    }
    window.gameState.earned_knowledge_this_chapter = window.gameState.earned_knowledge_this_chapter || 0;
    
    if (data) {
        if (!window.gameState.unlocked_codex.includes(data.codexId)) {
            window.gameState.unlocked_codex.push(data.codexId);
            window.gameState.knowledge_score += 50;
            window.gameState.earned_knowledge_this_chapter += 50;
            saveState();
        }
    }
}

function startChapterBattle() {
    const chapter = window.gameState.current_chapter;
    const data = CHAPTER_DATA[chapter];
    if (data) {
        goToBattle();
        startCombat({
            name: data.enemy.name,
            maxHealth: data.enemy.maxHealth,
            onWin: () => {
                document.getElementById('battle-actions').classList.add('hidden');
                document.getElementById('battle-end-nav').classList.remove('hidden');
            }
        });
    }
}

// ==========================================
// COMBAT SYSTEM (REAL-TIME ENGINE)
// ==========================================
let currentCombatEngine = null;
let combatState = { isBoss: false };
let lastEnemyConfig = null;

function startCombat(enemyConfig, isBoss = false) {
    combatState.isBoss = isBoss;
    lastEnemyConfig = enemyConfig;
    
    // Always start battles with full health (per user request)
    window.gameState.health = window.gameState.max_health;
    
    // Stop any existing engine
    if (currentCombatEngine) {
        currentCombatEngine.stop();
    }
    
    const containerId = isBoss ? 'boss-engine-container' : 'battle-engine-container';
    
    currentCombatEngine = new CombatEngine(containerId, {
        onWin: () => {
            currentCombatEngine.stop();
            const endNavId = isBoss ? 'boss-end-nav' : 'battle-end-nav';
            document.getElementById(endNavId).classList.remove('hidden');
            if (enemyConfig.onWin) enemyConfig.onWin();
        },
        onLose: () => {
            currentCombatEngine.stop();
            setTimeout(() => {
                showScreen('defeat-screen');
            }, 2000);
        }
    });
    
    // Update UI
    const actionsId = isBoss ? 'boss-battle-actions' : 'battle-actions';
    const endNavId = isBoss ? 'boss-end-nav' : 'battle-end-nav';
    
    document.getElementById(actionsId).classList.remove('hidden');
    document.getElementById(endNavId).classList.add('hidden');
    
    if (isBoss) {
        document.getElementById('boss-name').textContent = enemyConfig.name;
    } else {
        document.getElementById('enemy-name').textContent = enemyConfig.name;
    }
    
    clearCombatLog();
    logMessage("Real-Time Battle started against " + enemyConfig.name + "!");
    logMessage("Use A/D to move, W to jump, Space to dodge. J/K to attack, L to defend.");
    
    const chapter = window.gameState.current_chapter || 1;
    let heroConf = { name: "Warrior", maxHealth: window.gameState.max_health };
    let finalEnemyConf = { name: enemyConfig.name, maxHealth: enemyConfig.maxHealth, isBoss: isBoss };
    
    // Chapter 1: Kerala
    if (chapter === 1) {
        heroConf.folder = 'kerala';
        heroConf.combatStyle = 'sprite';
        heroConf.arenaClass = 'arena-kerala';
        finalEnemyConf.folder = isBoss ? 'raman' : 'kerala';
        finalEnemyConf.combatStyle = 'sprite';
    } 
    // Chapter 2: Rajasthan
    else if (chapter === 2) {
        heroConf.folder = 'rajasthan';
        heroConf.combatStyle = 'sprite';
        heroConf.arenaClass = 'arena-rajasthan';
        finalEnemyConf.folder = isBoss ? 'vikram' : 'rajasthan';
        finalEnemyConf.combatStyle = 'sprite';
    }
    // Chapter 3: Maharashtra
    else if (chapter === 3) {
        heroConf.folder = 'maharashtra';
        heroConf.combatStyle = 'rig';
        heroConf.arenaClass = 'arena-maharashtra';
        finalEnemyConf.folder = isBoss ? 'tariq' : 'maharashtra';
        finalEnemyConf.combatStyle = 'rig';
    }
    // Chapter 4: Tamil Nadu
    else if (chapter === 4) {
        heroConf.folder = 'tamilnadu';
        heroConf.combatStyle = 'rig';
        heroConf.arenaClass = 'arena-tamilnadu';
        finalEnemyConf.folder = isBoss ? 'rajendra' : 'tamilnadu';
        finalEnemyConf.combatStyle = 'rig';
    }
    // Chapter 5: Karnataka
    else if (chapter === 5) {
        heroConf.folder = 'karnataka';
        heroConf.combatStyle = 'rig';
        heroConf.arenaClass = 'arena-karnataka';
        finalEnemyConf.folder = isBoss ? 'krishnadeva' : 'karnataka';
        finalEnemyConf.combatStyle = 'rig';
    }
    // Fallback
    else {
        heroConf.folder = 'kerala';
        heroConf.combatStyle = 'sprite';
        heroConf.arenaClass = 'arena-kerala';
        finalEnemyConf.folder = 'kerala';
        finalEnemyConf.combatStyle = 'sprite';
    }

    currentCombatEngine.start(heroConf, finalEnemyConf);
    
    // Sync current health
    currentCombatEngine.hero.health = window.gameState.health;
    
    // Update Health Bars AFTER engine is started so enemy object exists
    updateHealthBars();
}

function updateHealthBars() {
    const isBoss = combatState.isBoss;
    const pBar = document.getElementById(isBoss ? 'boss-player-health-bar' : 'player-health-bar');
    const pText = document.getElementById(isBoss ? 'boss-player-health-text' : 'player-health-text');
    const eBar = document.getElementById(isBoss ? 'boss-health-bar' : 'enemy-health-bar');
    const eText = document.getElementById(isBoss ? 'boss-health-text' : 'enemy-health-text');
    
    let pHealth = window.gameState.health;
    let pMax = window.gameState.max_health;
    
    let eHealth = 0;
    let eMax = 100;
    
    if (currentCombatEngine) {
        if (currentCombatEngine.hero) {
            pHealth = currentCombatEngine.hero.health;
            pMax = currentCombatEngine.hero.maxHealth;
            let pStamina = currentCombatEngine.hero.stamina;
            let pMaxStamina = currentCombatEngine.hero.maxStamina;
            const pStamBar = document.getElementById(isBoss ? 'boss-player-stamina-bar' : 'player-stamina-bar');
            if (pStamBar) pStamBar.style.width = `${Math.max(0, (pStamina / pMaxStamina) * 100)}%`;
            
            const pHealCd = document.getElementById(isBoss ? 'boss-player-heal-cd' : 'player-heal-cd');
            if (pHealCd) {
                if (currentCombatEngine.hero.healCooldown <= 0) {
                    pHealCd.textContent = 'H — HEAL | Cooldown: READY';
                    pHealCd.style.color = '#4caf50';
                } else {
                    pHealCd.textContent = `H — HEAL | Cooldown: ${Math.ceil(currentCombatEngine.hero.healCooldown)}s`;
                    pHealCd.style.color = '#888';
                }
            }
        }
        if (currentCombatEngine.enemy) {
            eHealth = currentCombatEngine.enemy.health;
            eMax = currentCombatEngine.enemy.maxHealth;
            let eStamina = currentCombatEngine.enemy.stamina;
            let eMaxStamina = currentCombatEngine.enemy.maxStamina;
            const eStamBar = document.getElementById('enemy-stamina-bar');
            if (eStamBar) eStamBar.style.width = `${Math.max(0, (eStamina / eMaxStamina) * 100)}%`;
        }
    }
    
    if (pBar) pBar.style.width = `${Math.max(0, (pHealth / pMax) * 100)}%`;
    if (pText) pText.textContent = `${Math.max(0, pHealth)} / ${pMax}`;
    
    // Low health pulse for player
    const pContainer = pBar ? pBar.closest('.health-bar-container') : null;
    if (pContainer) {
        if (pHealth > 0 && pHealth / pMax <= 0.25) {
            pContainer.classList.add('low-health-warning');
        } else {
            pContainer.classList.remove('low-health-warning');
        }
    }
    
    if (eBar) eBar.style.width = `${Math.max(0, (eHealth / eMax) * 100)}%`;
    if (eText) eText.textContent = `${Math.max(0, eHealth)} / ${eMax}`;
    
    // Update player stats
    const lvlSpan = document.getElementById(isBoss ? 'boss-player-level' : 'player-level');
    const coinSpan = document.getElementById(isBoss ? 'boss-player-coins' : 'player-coins');
    const xpSpan = document.getElementById(isBoss ? 'boss-player-xp' : 'player-xp');
    
    if (lvlSpan) lvlSpan.textContent = window.gameState.level;
    if (coinSpan) coinSpan.textContent = window.gameState.coins;
    if (xpSpan) xpSpan.textContent = window.gameState.xp;
}

function retryBattle() {
    if (combatState.isBoss) {
        showScreen('boss-screen');
    } else {
        showScreen('battle-screen');
    }
    
    if (lastEnemyConfig) {
        startCombat(lastEnemyConfig, combatState.isBoss);
    }
}

function clearCombatLog() {
    const logId = combatState.isBoss ? 'boss-combat-log' : 'combat-log';
    const ul = document.getElementById(logId);
    if (ul) ul.innerHTML = '';
}

function logMessage(msg, isHighlight = false) {
    const logId = combatState.isBoss ? 'boss-combat-log' : 'combat-log';
    const ul = document.getElementById(logId);
    if (!ul) return;
    
    const li = document.createElement('li');
    li.textContent = msg;
    if (isHighlight) li.classList.add('highlight');
    
    ul.appendChild(li);
    ul.parentElement.scrollTop = ul.parentElement.scrollHeight;
}

function startBossFight() {
    const chapter = window.gameState.current_chapter;
    const data = CHAPTER_DATA[chapter];
    if (data) {
        startCombat({
            name: data.boss.name,
            maxHealth: data.boss.maxHealth,
            onWin: async () => {
                document.getElementById('boss-battle-actions').classList.add('hidden');
                
                if (window.gameState.serverConnected && window.gameState.playerId) {
                    const bId = window.gameState.currentBossId || chapter;
                    const btn = document.querySelector('#boss-end-nav .btn');
                    const oldText = btn ? btn.textContent : '';
                    if (btn) btn.textContent = 'SAVING...';
                    
                    await sendGameEvent(window.gameState.playerId, chapter, 'boss_defeated', { boss_id: bId });
                    
                    if (btn) btn.textContent = oldText;
                }
                
                document.getElementById('boss-end-nav').classList.remove('hidden');
            }
        }, true);
    }
}

function screenShake() {
    const container = document.getElementById('game-container');
    container.classList.add('shake');
    setTimeout(() => {
        container.classList.remove('shake');
    }, 500);
}

// ==========================================
// CULTURAL CHALLENGE SYSTEM
// ==========================================
let currentChallenges = [];
let currentChallengeIdx = 0;
let challengeCorrectCount = 0;

function initChallenge(challengeData) {
    currentChallenges = Array.isArray(challengeData) ? challengeData : [challengeData];
    currentChallengeIdx = 0;
    challengeCorrectCount = 0;
    renderChallenge();
}

function renderChallenge() {
    let data = currentChallenges[currentChallengeIdx];
    
    document.getElementById('challenge-title').textContent = `${data.title || "CULTURAL CHALLENGE"} (Q${currentChallengeIdx + 1} of ${currentChallenges.length})`;
    document.getElementById('challenge-question').textContent = data.question_text || data.question;
    const optionsGrid = document.getElementById('challenge-options');
    optionsGrid.innerHTML = '';
    
    document.getElementById('challenge-feedback').classList.add('hidden');
    
    const navBtn = document.querySelector('#challenge-nav .btn');
    if (navBtn) {
        navBtn.disabled = false;
        if (currentChallengeIdx < currentChallenges.length - 1) {
            navBtn.textContent = "NEXT QUESTION";
            navBtn.onclick = () => {
                currentChallengeIdx++;
                renderChallenge();
            };
        } else {
            navBtn.textContent = "CONTINUE";
            navBtn.onclick = completeChallenge;
        }
    }
    document.getElementById('challenge-nav').classList.add('hidden');
    
    let options = data.options || [];
    if (typeof options === 'string') {
        try { options = JSON.parse(options); } catch (e) { options = []; }
    }
    
    options.forEach((opt) => {
        const text = typeof opt === 'string' ? opt : opt.text;
        const btn = document.createElement('button');
        btn.className = 'btn option-btn';
        btn.textContent = text;
        
        btn.onclick = () => selectChallengeAnswer(btn, opt.isCorrect || false, optionsGrid, data);
        optionsGrid.appendChild(btn);
    });
}

async function selectChallengeAnswer(selectedBtn, isCorrect, optionsGrid, challengeData) {
    const btns = optionsGrid.querySelectorAll('.option-btn');
    btns.forEach(btn => btn.disabled = true);
    
    const feedback = document.getElementById('challenge-feedback');
    feedback.classList.remove('hidden');
    
    let finalCorrect = isCorrect;
    let explanation = challengeData.explanation || "";
    let backendCorrectAnswer = challengeData.correct_answer || null;
    
    if (window.gameState.serverConnected && window.gameState.playerId) {
        const cId = challengeData.challenge_id || window.gameState.currentChallengeId || window.gameState.current_chapter;
        feedback.textContent = 'CHECKING ANSWER...';
        feedback.style.color = 'var(--color-primary)';
        
        // Ensure "A. ", "B. " is not present
        let answerText = selectedBtn.textContent;
        if (answerText.match(/^[A-Z]\.\s/)) answerText = answerText.substring(3);
        
        const res = await submitChallenge(window.gameState.playerId, cId, answerText);
        if (res) {
            finalCorrect = res.correct;
            if (res.explanation) explanation = res.explanation;
            if (res.correct_answer) backendCorrectAnswer = res.correct_answer;
        }
    }
    
    if (finalCorrect) {
        selectedBtn.classList.add('selected-correct');
        feedback.innerHTML = `<strong>✅ CORRECT!</strong><br><br>${explanation}`;
        feedback.style.color = "#4caf50";
        challengeCorrectCount++;
    } else {
        selectedBtn.classList.add('selected-wrong');
        
        const correctText = backendCorrectAnswer || "Check the historical text.";
        feedback.innerHTML = `<strong>❌ WRONG ANSWER</strong><br><br><span style="color:#fff;">Correct Answer:</span><br>${correctText}<br><br><span style="color:#fff;">Explanation:</span><br>${explanation}`;
        feedback.style.color = "#f44336";
        
        btns.forEach(btn => {
            let btnText = btn.textContent;
            if (btnText.match(/^[A-Z]\.\s/)) btnText = btnText.substring(3);
            if (btnText === backendCorrectAnswer || (challengeData.correctMatch && btnText.includes(challengeData.correctMatch))) {
                btn.classList.add('selected-correct');
            }
        });
    }
    
    if (currentChallengeIdx === currentChallenges.length - 1) {
        feedback.innerHTML += `<br><br><strong style="font-size:1.2em; color:#fff;">Final Score: ${challengeCorrectCount} / ${currentChallenges.length}</strong>`;
    }
    
    document.getElementById('challenge-nav').classList.remove('hidden');
}

// ==========================================
// REWARDS & PROGRESSION
// ==========================================
function applyLocalRewards(chapter, data) {
    let earnedXp = data.rewards.xp;
    let earnedCoins = data.rewards.coins;
    let earnedScore = data.rewards.score;
    
    window.gameState.xp += earnedXp;
    window.gameState.coins += earnedCoins;
    window.gameState.score += earnedScore;
    
    if (!window.gameState.completed_chapters.includes(chapter)) {
        window.gameState.completed_chapters.push(chapter);
    }
    
    const nextChapter = chapter + 1;
    if (nextChapter <= 5) {
        if (!window.gameState.unlocked_chapters.includes(nextChapter)) {
            window.gameState.unlocked_chapters.push(nextChapter);
        }
    }
    
    if (chapter === 5) {
        window.gameState.game_completed = true;
    }
    
    if (!window.gameState.unlocked_codex.includes(data.codexId)) {
        window.gameState.unlocked_codex.push(data.codexId);
    }
    
    saveState();
    
    return { earnedXp, earnedCoins, earnedScore };
}

async function completeChallenge() {
    const chapter = window.gameState.current_chapter;
    const data = CHAPTER_DATA[chapter];
    
    const continueBtn = document.querySelector('#challenge-nav .btn');
    if (continueBtn) {
        continueBtn.disabled = true;
        continueBtn.textContent = 'COMPLETING...';
    }
    
    if (typeof window.gameState.knowledge_score !== 'number') {
        window.gameState.knowledge_score = 0;
    }
    window.gameState.earned_knowledge_this_chapter = window.gameState.earned_knowledge_this_chapter || 0;
    window.gameState.knowledge_challenges_completed = window.gameState.knowledge_challenges_completed || [];
    
    if (challengeCorrectCount > 0 && !window.gameState.knowledge_challenges_completed.includes(chapter)) {
        window.gameState.knowledge_challenges_completed.push(chapter);
        window.gameState.knowledge_score += 100;
        window.gameState.earned_knowledge_this_chapter += 100;
        saveState();
    }
    
    // IMPORTANT: Capture BEFORE snapshot to calculate actual earned rewards (deltas)
    // Using chapterStart parameters to capture everything earned during the chapter!
    let beforeXP = window.gameState.chapterStartXP !== undefined ? window.gameState.chapterStartXP : (window.gameState.xp || 0);
    let beforeCoins = window.gameState.chapterStartCoins !== undefined ? window.gameState.chapterStartCoins : (window.gameState.coins || 0);
    let beforeScore = window.gameState.chapterStartScore !== undefined ? window.gameState.chapterStartScore : (window.gameState.score || 0);
    
    console.log("[REWARD DEBUG] Before XP:", beforeXP);
    console.log("[REWARD DEBUG] Before Coins:", beforeCoins);
    console.log("[REWARD DEBUG] Before Score:", beforeScore);

    let earnedXp = 0;
    let earnedCoins = 0;
    let earnedScore = 0;
    
    if (data) {
        if (window.gameState.serverConnected && window.gameState.playerId) {
            const res = await completeChapter(window.gameState.playerId, chapter);
            console.log("[REWARD DEBUG] Backend response:", res);
            
            if (res && res.success) {
                // Re-fetch authoritative state from backend
                const bootstrap = await getBootstrap(window.gameState.playerId);
                if (bootstrap) {
                    mergeServerState(bootstrap); // This updates window.gameState
                }
                
                // Use backend explicitly returned rewards for the UI
                if (res.xp_earned !== undefined) earnedXp = res.xp_earned;
                if (res.coins_earned !== undefined) earnedCoins = res.coins_earned;
                if (res.score_earned !== undefined) earnedScore = res.score_earned;
            } else if (!res) {
                // Offline / network failure fallback
                const localRew = applyLocalRewards(chapter, data);
                earnedXp = localRew.earnedXp;
                earnedCoins = localRew.earnedCoins;
                earnedScore = localRew.earnedScore;
            }
        } else {
            const localRew = applyLocalRewards(chapter, data);
            earnedXp = localRew.earnedXp;
            earnedCoins = localRew.earnedCoins;
            earnedScore = localRew.earnedScore;
        }
        
        // Prevent negative values just in case
        earnedXp = Math.max(0, earnedXp);
        earnedCoins = Math.max(0, earnedCoins);
        earnedScore = Math.max(0, earnedScore);
        
        console.log("[REWARD DEBUG] After XP:", window.gameState.xp);
        console.log("[REWARD DEBUG] After Coins:", window.gameState.coins);
        console.log("[REWARD DEBUG] After Score:", window.gameState.score);
        console.log("[REWARD DEBUG] Earned XP to display:", earnedXp);
        console.log("[REWARD DEBUG] Earned Coins to display:", earnedCoins);
        console.log("[REWARD DEBUG] Earned Score to display:", earnedScore);
        
        // Display specific rewards in UI
        document.getElementById('earned-xp').textContent = "+" + earnedXp;
        document.getElementById('earned-coins').textContent = "+" + earnedCoins;
        document.getElementById('earned-score').textContent = "+" + earnedScore;
        
        // Update total stats in UI
        document.getElementById('reward-level').textContent = window.gameState.level;
        document.getElementById('reward-xp').textContent = window.gameState.xp;
        document.getElementById('reward-coins').textContent = window.gameState.coins;
        document.getElementById('reward-score').textContent = window.gameState.score;
        
        if (chapter === 5) {
            document.querySelector('#reward-screen h2').textContent = "🏆 JOURNEY COMPLETE!";
            let subtitle = document.getElementById('reward-subtitle');
            if (!subtitle) {
                subtitle = document.createElement('h3');
                subtitle.id = 'reward-subtitle';
                subtitle.style.textAlign = 'center';
                subtitle.style.color = 'var(--color-primary)';
                document.querySelector('#reward-screen h2').after(subtitle);
            }
            subtitle.textContent = "YOU HAVE COMPLETED THE FIVE CHAPTERS OF INDIA'S HERITAGE.";
            document.querySelector('#reward-screen .btn').textContent = "CONTINUE";
        } else {
            document.querySelector('#reward-screen h2').textContent = "CHAPTER COMPLETE!";
            let subtitle = document.getElementById('reward-subtitle');
            if (subtitle) subtitle.textContent = "";
            document.querySelector('#reward-screen .btn').textContent = "CONTINUE";
        }
        
        // Pass the chapter that was just completed, not the next chapter state
        const rewardBtn = document.querySelector('#reward-screen .btn');
        if (rewardBtn) {
            rewardBtn.setAttribute('onclick', `showLearningSummary(${chapter})`);
        }
    }
    
    if (continueBtn) {
        continueBtn.disabled = false;
        continueBtn.textContent = 'CONTINUE';
    }
    
    goToReward();
}

function showLearningSummary(completedChapter) {
    const chapter = completedChapter || window.gameState.current_chapter;
    const summary = CHAPTER_LEARNING_SUMMARY[chapter];
    if (summary) {
        document.getElementById('summary-title').textContent = summary.title;
        document.getElementById('summary-subtitle').textContent = summary.region;
        
        const lessonsUl = document.getElementById('summary-lessons');
        lessonsUl.innerHTML = '';
        summary.lessons.forEach(l => {
            const li = document.createElement('li');
            li.innerHTML = `• ${l}`;
            li.style.marginBottom = '10px';
            lessonsUl.appendChild(li);
        });
        
        const knowledgeUl = document.getElementById('summary-knowledge');
        knowledgeUl.innerHTML = '';
        summary.knowledge.forEach(k => {
            const li = document.createElement('li');
            li.innerHTML = `✓ ${k}`;
            li.style.marginBottom = '8px';
            knowledgeUl.appendChild(li);
        });
        
        document.getElementById('summary-codex-msg').textContent = `${summary.codex} has been added to your Codex.`;
        
        
        let earnedKnowledge = 0;
        const data = CHAPTER_DATA[chapter];
        if (data && window.gameState.unlocked_codex && window.gameState.unlocked_codex.includes(data.codexId)) {
            earnedKnowledge += 50;
        }
        if (window.gameState.knowledge_challenges_completed && window.gameState.knowledge_challenges_completed.includes(chapter)) {
            earnedKnowledge += 100;
        }
        
        document.getElementById('summary-knowledge-earned').textContent = `+${earnedKnowledge} Knowledge`;
        document.getElementById('summary-knowledge-total').textContent = window.gameState.knowledge_score || 0;
    }
    
    showScreen('learning-summary-screen');
}

function continueJourney() {
    claimRewardsAndChapters();
}

function claimRewardsAndChapters() {
    updateChapterUI(); 
    updateCodexUI();   
    if (window.gameState.game_completed) {
        showFinalScreen();
    } else {
        goToChapters();
    }
}

function showFinalScreen() {
    document.getElementById('final-total-xp').textContent = window.gameState.xp;
    document.getElementById('final-total-coins').textContent = window.gameState.coins;
    document.getElementById('final-total-score').textContent = window.gameState.score;
    
    showScreen('final-screen');
}

function playAgain() {
    if (confirm("Start a new journey?")) {
        // Reset local state using state.js functions
        resetState();
        updateChapterUI();
        updateCodexUI();
        goToHome();
    }
}

// ==========================================
// CODEX
// ==========================================
function updateCodexUI() {
    const list = document.getElementById('codex-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    // Update headers
    const unlockedList = window.gameState.unlocked_codex || [];
    const collectedCountEl = document.getElementById('codex-collected-count');
    const knowledgeScoreEl = document.getElementById('codex-knowledge-score');
    
    if (collectedCountEl) collectedCountEl.textContent = unlockedList.length;
    if (knowledgeScoreEl) knowledgeScoreEl.textContent = window.gameState.knowledge_score || 0;
    
    for (let i = 1; i <= 5; i++) {
        const chapterData = CHAPTER_DATA[i];
        if (!chapterData) continue;
        
        const codexId = chapterData.codexId;
        let data = codexDatabase[codexId];
        
        // If not in local DB, check server data
        if (!data && window.gameState.server_codex_data) {
            const serverEntry = window.gameState.server_codex_data.find(c => c.codex_id === codexId);
            if (serverEntry) {
                data = {
                    title: serverEntry.title,
                    region: serverEntry.region,
                    desc: serverEntry.short_description || serverEntry.detailed_description
                };
            }
        }
        
        if (!data) continue;
        
        const entryDiv = document.createElement('div');
        
        if (unlockedList.includes(codexId)) {
            entryDiv.className = 'codex-entry discovered';
            entryDiv.style.cssText = 'border: 1px solid var(--color-primary); background: rgba(0,0,0,0.8); padding: 20px; border-radius: 8px; transition: transform 0.2s, box-shadow 0.2s;';
            entryDiv.onmouseover = () => { entryDiv.style.transform = 'translateY(-2px)'; entryDiv.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.2)'; };
            entryDiv.onmouseout = () => { entryDiv.style.transform = 'none'; entryDiv.style.boxShadow = 'none'; };
            
            entryDiv.innerHTML = `
                <h3 style="color: var(--color-secondary); margin: 0 0 5px 0; font-size: 1rem; letter-spacing: 1px;">[ ${data.region.toUpperCase()} ]</h3>
                <h2 style="color: var(--color-primary); margin: 0 0 10px 0; font-size: 1.6rem;">${data.title.toUpperCase()}</h2>
                <div style="color: #4caf50; font-weight: bold; margin-bottom: 15px; font-size: 0.9rem;">✓ DISCOVERED</div>
                <p style="color: #ccc; line-height: 1.6; margin-bottom: 15px; font-size: 1.05rem;">${data.desc}</p>
                <div style="color: #9c27b0; font-weight: bold; font-size: 0.9rem;">+50 KNOWLEDGE</div>
            `;
        } else {
            entryDiv.className = 'codex-entry locked';
            entryDiv.style.cssText = 'border: 1px solid #444; background: rgba(0,0,0,0.4); padding: 20px; border-radius: 8px; opacity: 0.7;';
            
            entryDiv.innerHTML = `
                <h3 style="color: #888; margin: 0 0 5px 0; font-size: 1rem; letter-spacing: 1px;">[ ${chapterData.region.toUpperCase()} ]</h3>
                <h2 style="color: #888; margin: 0 0 10px 0; font-size: 1.4rem;">🔒 NOT YET DISCOVERED</h2>
                <p style="color: #666; line-height: 1.6; font-style: italic; margin: 0;">Continue your journey to uncover this part of India's heritage.</p>
            `;
        }
        
        list.appendChild(entryDiv);
    }
}
