import sys
import os
import json

# Add parent directory to path so we can import models and database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal, engine, Base
import models

def load_json_data(db, model_class, filename):
    filepath = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", filename)
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    with open(filepath, "r") as f:
        data_list = json.load(f)
        
    for data in data_list:
        obj = model_class(**data)
        db.merge(obj)
    db.commit()

def load_dialogues(db):
    filepath = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "dialogues.json")
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    with open(filepath, "r") as f:
        data = json.load(f)
        
    for scene in data.get("scenes", []):
        db.merge(models.DialogueScene(**scene))
    db.commit()
    
    for line in data.get("lines", []):
        db.merge(models.DialogueLine(**line))
    db.commit()
    
    for choice in data.get("choices", []):
        db.merge(models.DialogueChoice(**choice))
    db.commit()

def populate():
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Populating JSON data (Items, Codex, Dialogues, Challenges, Story)...")
        load_json_data(db, models.CodexEntry, "codex.json")
        load_json_data(db, models.Item, "items.json")
        load_json_data(db, models.CulturalChallenge, "challenges.json")
        load_json_data(db, models.HistoricalStoryEntry, "story.json")
        load_dialogues(db)

        print("Populating database with sample chapters and bosses...")

        # Chapter 1: Kerala / Kalaripayattu
        ch1 = models.Chapter(
            chapter_id=1,
            title="The Way of Kalari",
            region="Kerala",
            historical_period="11th Century AD",
            description="Begin your journey in the verdant backwaters of Kerala, mastering the ancient martial art of Kalaripayattu.",
            cultural_theme="Kalaripayattu",
            objective="Defeat the renegade master.",
            difficulty="Normal",
            intro_dialogue_scene="intro_kalari_01",
            victory_dialogue_scene="victory_kalari_01",
            is_active=True,
            boss_id=1
        )
        db.merge(ch1)

        boss1 = models.Boss(
            boss_id=1,
            chapter_id=1,
            name="Gurukkal Raman",
            title="The Fallen Master",
            level=1,
            max_health=1000,
            difficulty="Normal",
            description="A former master of the Kalari who now uses his skills for oppression.",
            cultural_context="Kalaripayattu practitioners were highly respected warriors in medieval Kerala.",
            reward_xp=500,
            reward_score=1000
        )
        db.merge(boss1)

        # Chapter 2: Rajasthan
        ch2 = models.Chapter(
            chapter_id=2,
            title="Shadows of Rajasthan",
            region="Rajasthan",
            historical_period="16th Century Rajputana",
            description="Navigate the arid deserts and grand forts of Rajasthan to uncover a Rajput conspiracy.",
            cultural_theme="Rajput Warfare & Forts",
            objective="Secure the fort of Kumbhalgarh.",
            difficulty="Hard",
            required_chapter=1,
            intro_dialogue_scene="intro_rajput_01",
            victory_dialogue_scene="victory_rajput_01",
            is_active=True,
            boss_id=2
        )
        db.merge(ch2)

        boss2 = models.Boss(
            boss_id=2,
            chapter_id=2,
            name="General Vikram Singh",
            title="The Desert Lion",
            level=5,
            max_health=2500,
            difficulty="Hard",
            description="A fearsome commander wielding a massive Khanda sword.",
            cultural_context="The Khanda is a traditional double-edged straight sword originating from the Indian subcontinent, heavily associated with the Rajput warrior class.",
            reward_xp=1500,
            reward_score=3000
        )
        db.merge(boss2)

        # Chapter 3: Maharashtra
        ch3 = models.Chapter(
            chapter_id=3,
            title="The Maratha Stand",
            region="Maharashtra",
            historical_period="17th Century Maratha Empire",
            description="Engage in guerrilla warfare alongside the Marathas against the Mughal empire forces.",
            cultural_theme="Maratha Guerrilla Tactics",
            objective="Break the siege of the mountain fort.",
            difficulty="Very Hard",
            required_chapter=2,
            intro_dialogue_scene="intro_maratha_01",
            victory_dialogue_scene="victory_maratha_01",
            is_active=True,
            boss_id=3
        )
        db.merge(ch3)

        boss3 = models.Boss(
            boss_id=3,
            chapter_id=3,
            name="Commander Tariq",
            title="The Imperial Vanguard",
            level=10,
            max_health=5000,
            difficulty="Very Hard",
            description="An elite imperial commander heavily armored and employing standard military formations.",
            cultural_context="The Marathas were known for their speed and agility, often bypassing heavily armored imperial forces using guerrilla tactics.",
            reward_xp=3000,
            reward_score=6000
        )
        db.merge(boss3)
        
        # Chapter 4: Tamil Nadu
        ch4 = models.Chapter(
            chapter_id=4,
            title="The Naval Supremacy",
            region="Tamil Nadu",
            historical_period="11th Century AD",
            description="Explore the mighty Chola Empire and master their naval strategies and martial arts.",
            cultural_theme="Chola Navy & Temple Architecture",
            objective="Secure the maritime trade routes.",
            difficulty="Extreme",
            required_chapter=3,
            intro_dialogue_scene="intro_chola_01",
            victory_dialogue_scene="victory_chola_01",
            is_active=True,
            boss_id=4
        )
        db.merge(ch4)

        boss4 = models.Boss(
            boss_id=4,
            chapter_id=4,
            name="Admiral Rajendra",
            title="The Sea Tiger",
            level=15,
            max_health=8000,
            difficulty="Extreme",
            description="A brilliant naval commander of the Chola empire, master of sea warfare.",
            cultural_context="The Chola Navy was one of the strongest in ancient India, dominating the Indian Ocean and Southeast Asia trade routes.",
            reward_xp=5000,
            reward_score=10000
        )
        db.merge(boss4)

        # Chapter 5: Karnataka
        ch5 = models.Chapter(
            chapter_id=5,
            title="The City of Victory",
            region="Karnataka",
            historical_period="14th-17th Century",
            description="Defend the grand temples and wealth of the Vijayanagara Empire from invading forces.",
            cultural_theme="Vijayanagara Empire & Art",
            objective="Protect the Virupaksha Temple.",
            difficulty="Legendary",
            required_chapter=4,
            intro_dialogue_scene="intro_vijayanagara_01",
            victory_dialogue_scene="victory_vijayanagara_01",
            is_active=True,
            boss_id=5
        )
        db.merge(ch5)

        boss5 = models.Boss(
            boss_id=5,
            chapter_id=5,
            name="Commander Krishnadeva",
            title="The Temple Guardian",
            level=20,
            max_health=12000,
            difficulty="Legendary",
            description="An elite warrior dedicated to protecting the sacred monuments of Hampi.",
            cultural_context="The Vijayanagara Empire was a bastion of Hindu culture and grand temple architecture in Southern India.",
            reward_xp=8000,
            reward_score=15000
        )
        db.merge(boss5)
        
        db.commit()

        print("Database populated successfully.")

        
    finally:
        db.close()

if __name__ == "__main__":
    populate()
