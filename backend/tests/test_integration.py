from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pytest

from main import app
from database import Base, get_db
import models

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    db = TestingSessionLocal()
    # Clean DB
    db.query(models.GameEvent).delete()
    db.query(models.ChallengeAttempt).delete()
    db.query(models.PlayerDialogueProgress).delete()
    db.query(models.ChapterProgress).delete()
    db.query(models.PlayerCodex).delete()
    db.query(models.PlayerItem).delete()
    db.query(models.CulturalChallenge).delete()
    db.query(models.CodexEntry).delete()
    db.query(models.Item).delete()
    db.query(models.DialogueScene).delete()
    db.query(models.Boss).delete()
    db.query(models.Chapter).delete()
    db.query(models.Player).delete()

    # Seed basic info
    ch1 = models.Chapter(
        chapter_id=1, title="Ch1", region="Reg", historical_period="Per", 
        description="Desc", cultural_theme="Theme", objective="Obj", difficulty="easy",
        boss_id=1, intro_dialogue_scene="intro_scene", victory_dialogue_scene="vic_scene", required_challenge_id=1
    )
    ch2 = models.Chapter(
        chapter_id=2, title="Ch2", region="Reg", historical_period="Per", 
        description="Desc", cultural_theme="Theme", objective="Obj", difficulty="easy",
        required_chapter=1
    )
    db.add(ch1)
    db.add(ch2)

    boss1 = models.Boss(
        boss_id=1, chapter_id=1, name="Boss", title="Title", level=1, max_health=100, 
        difficulty="easy", description="Desc", cultural_context="Ctx", reward_xp=500, reward_score=1000
    )
    db.add(boss1)

    c1 = models.CulturalChallenge(
        challenge_id=1, chapter_id=1, title="Chal", description="Desc", challenge_type="test", 
        question_text="Q", options='["A"]', correct_answer="A", explanation="Expl", 
        reward_xp=100, reward_score=200
    )
    db.add(c1)
    
    # Seed Dialogue Scenes for bootstrap
    ds1 = models.DialogueScene(scene_id="intro_scene", chapter_id=1, trigger_event="chapter_start")
    ds2 = models.DialogueScene(scene_id="vic_scene", chapter_id=1, trigger_event="boss_defeated")
    db.add(ds1)
    db.add(ds2)
    
    db.commit()
    db.close()

def test_full_integration_flow():
    # 1. Player Creation
    resp = client.post("/api/players/guest")
    assert resp.status_code == 201
    player_id = resp.json()["player_id"]
    
    # Check start point
    resp = client.get(f"/api/players/{player_id}/continue")
    assert resp.json()["next_action"] == "chapter_intro"
    
    # 2. Intro cinematic
    # The frontend logs dialogue completion after it displays it
    resp = client.post("/api/game/event", json={
        "player_id": player_id, "chapter_id": 1, "event_type": "dialogue_completed", "event_data": {"scene_id": "intro_scene"}
    })
    assert resp.status_code == 200
    
    # Boss Defeated
    resp = client.post("/api/game/event", json={
        "player_id": player_id, "chapter_id": 1, "event_type": "boss_defeated", "event_data": {"boss_id": 1}
    })
    assert resp.status_code == 200
    assert resp.json()["xp_earned"] == 500
    
    # Check progress
    resp = client.get(f"/api/players/{player_id}/progress")
    assert resp.json()["statistics"]["bosses_defeated"] == 1
    
    # Challenge Completed
    resp = client.post("/api/challenges/submit", json={
        "player_id": player_id, "challenge_id": 1, "answer": "A"
    })
    assert resp.json()["correct"] == True
    
    # Complete Chapter
    resp = client.post("/api/game/complete-chapter", json={
        "player_id": player_id, "chapter_id": 1
    })
    assert resp.status_code == 200
    
    # Check updated continue
    resp = client.get(f"/api/players/{player_id}/continue")
    assert resp.json()["chapter_id"] == 2

    # Save State verification
    resp = client.get(f"/api/players/{player_id}/save")
    assert resp.status_code == 200
    assert resp.json()["player"]["current_chapter"] == 2
    assert "statistics" in resp.json()

def test_bootstrap_flow():
    # 1. Non-existent player
    resp = client.get("/api/game/bootstrap/999999")
    assert resp.status_code == 404

    # 2. Newly created player
    resp = client.post("/api/players/guest")
    assert resp.status_code == 201
    player_id = resp.json()["player_id"]

    resp = client.get(f"/api/game/bootstrap/{player_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["player"]["current_chapter"] == 1
    assert data["player"]["level"] == 1
    assert data["current_chapter"]["chapter_id"] == 1
    assert data["boss"]["boss_id"] == 1
    assert data["continue_state"]["next_action"] == "chapter_intro"
    
    # 6. Player with dialogue progress -> Should show dialogue available
    assert data["dialogue"]["available"] == True
    assert data["dialogue"]["scene_id"] == "intro_scene"
    assert data["dialogue"]["scene_type"] == "chapter_intro"
    assert "correct_answer" not in data["challenges"]
    
    # Complete dialogue
    client.post("/api/game/event", json={
        "player_id": player_id, "chapter_id": 1, "event_type": "dialogue_completed", "event_data": {"scene_id": "intro_scene"}
    })
    
    # Bootstrap again, now boss should be next
    resp = client.get(f"/api/game/bootstrap/{player_id}")
    data = resp.json()
    assert data["continue_state"]["next_action"] == "boss"
    assert data["dialogue"]["available"] == False

    # Complete boss
    client.post("/api/game/event", json={
        "player_id": player_id, "chapter_id": 1, "event_type": "boss_defeated", "event_data": {"boss_id": 1}
    })
    
    # Bootstrap again, now victory_cinematic should be next
    resp = client.get(f"/api/game/bootstrap/{player_id}")
    data = resp.json()
    assert data["continue_state"]["next_action"] == "victory_cinematic"
    assert data["dialogue"]["available"] == True
    assert data["dialogue"]["scene_id"] == "vic_scene"

    # Complete victory cinematic
    client.post("/api/game/event", json={
        "player_id": player_id, "chapter_id": 1, "event_type": "dialogue_completed", "event_data": {"scene_id": "vic_scene"}
    })
    
    # Bootstrap again, now challenge should be next
    resp = client.get(f"/api/game/bootstrap/{player_id}")
    data = resp.json()
    assert data["continue_state"]["next_action"] == "cultural_challenge"
    assert len(data["challenges"]) == 1
    assert data["challenges"][0]["challenge_id"] == 1
    # 9. Verify correct_answer is never returned in bootstrap
    assert "correct_answer" not in data["challenges"][0]
    
    # Submit challenge
    client.post("/api/challenges/submit", json={
        "player_id": player_id, "challenge_id": 1, "answer": "A"
    })
    
    # Complete chapter
    client.post("/api/game/complete-chapter", json={
        "player_id": player_id, "chapter_id": 1
    })

    # Bootstrap again, should be on chapter 2
    resp = client.get(f"/api/game/bootstrap/{player_id}")
    data = resp.json()
    assert data["player"]["current_chapter"] == 2
    assert data["current_chapter"]["chapter_id"] == 2
    assert data["boss"] is None
    assert data["continue_state"]["next_action"] == "chapter_complete"
    # 10. Verify bootstrap data matches existing progress
    assert data["statistics"]["bosses_defeated"] == 1
    assert data["statistics"]["challenges_completed"] == 1
    assert data["statistics"]["chapters_completed"] == 1

