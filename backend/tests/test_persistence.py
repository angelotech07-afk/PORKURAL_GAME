from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pytest

from main import app
from database import Base, get_db
import models

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    
    db = TestingSessionLocal()
    # clear db to avoid conflicts
    db.query(models.ChallengeAttempt).delete()
    db.query(models.PlayerDialogueProgress).delete()
    db.query(models.GameEvent).delete()
    db.query(models.ChapterProgress).delete()
    db.query(models.Boss).delete()
    db.query(models.Chapter).delete()
    db.query(models.Player).delete()
    db.commit()

    # Insert test chapter and boss
    chapter = models.Chapter(
        chapter_id=1, 
        title="Chapter 1", 
        region="Test Region",
        historical_period="Test Period",
        description="Test Chapter", 
        cultural_theme="Test Theme",
        objective="Test Objective",
        difficulty="Normal",
        is_active=True,
        intro_dialogue_scene="101",
        boss_id=201,
        victory_dialogue_scene="102",
        required_challenge_id=301
    )
    boss = models.Boss(
        boss_id=201, 
        chapter_id=1, 
        name="Test Boss", 
        title="Test Title",
        level=1,
        difficulty="Normal",
        description="Boss", 
        cultural_context="Test Context",
        max_health=100,
        reward_xp=500,
        reward_score=1000
    )
    db.add(chapter)
    db.add(boss)
    db.commit()
    db.close()
    
    yield


def test_missing_player():
    response = client.get("/api/players/999/save")
    assert response.status_code == 404
    assert response.json()["detail"] == "Player not found"

def test_duplicate_reward_protection():
    # 1. Create player
    response = client.post("/api/players/guest")
    assert response.status_code == 201
    player_id = response.json()["player_id"]
    
    # 2. Defeat boss first time
    event_payload = {
        "player_id": player_id,
        "chapter_id": 1,
        "event_type": "boss_defeated",
        "event_data": {"boss_id": 201}
    }
    response1 = client.post("/api/game/event", json=event_payload)
    assert response1.status_code == 200
    assert response1.json()["xp_earned"] == 500
    
    # 3. Defeat boss second time
    response2 = client.post("/api/game/event", json=event_payload)
    assert response2.status_code == 200
    # The duplicate request should not grant XP/score again
    assert response2.json()["xp_earned"] == 0
    assert response2.json()["score_earned"] == 0
    assert "already processed" in response2.json()["message"].lower()

def test_application_restart_simulation():
    """
    Test simulating an application restart.
    We create progress, close the test client/session, then fetch it again using a new session logic 
    (though the in-memory SQLite persists the data across requests within the same engine).
    """
    # 1. Create Player
    resp_player = client.post("/api/players/guest")
    player_id = resp_player.json()["player_id"]
    
    # 2. Make Progress
    # Complete Dialogue
    client.post("/api/game/event", json={
        "player_id": player_id, "chapter_id": 1, "event_type": "dialogue_completed", "event_data": {"scene_id": "101"}
    })
    
    # Defeat Boss
    client.post("/api/game/event", json={
        "player_id": player_id, "chapter_id": 1, "event_type": "boss_defeated", "event_data": {"boss_id": 201}
    })
    
    # Save (GET save state just to verify)
    resp_save = client.get(f"/api/players/{player_id}/save")
    assert resp_save.status_code == 200
    save_data = resp_save.json()
    assert save_data["player"]["experience"] >= 500
    assert "101" in save_data["dialogues"]
    
    # 3. Simulate "Restart" and Load Player via Bootstrap
    resp_boot = client.get(f"/api/game/bootstrap/{player_id}")
    assert resp_boot.status_code == 200
    boot_data = resp_boot.json()
    
    # 4. Verify Progress Still Exists
    # XP and Score
    assert boot_data["player"]["experience"] == save_data["player"]["experience"]
    assert boot_data["player"]["total_score"] == save_data["player"]["total_score"]
    
    # Continue-state logic
    # After intro and boss, next should be victory cinematic (scene_id: 102)
    assert boot_data["continue_state"]["next_action"] == "victory_cinematic"
    assert boot_data["continue_state"]["scene_id"] == "102"

def test_continue_state_persistence_progression():
    resp_player = client.post("/api/players/guest")
    player_id = resp_player.json()["player_id"]
    
    # Start: Intro
    resp = client.get(f"/api/players/{player_id}/continue")
    assert resp.json()["next_action"] == "chapter_intro"
    
    # Finish Intro
    client.post("/api/game/event", json={
        "player_id": player_id, "chapter_id": 1, "event_type": "dialogue_completed", "event_data": {"scene_id": "101"}
    })
    resp = client.get(f"/api/players/{player_id}/continue")
    assert resp.json()["next_action"] == "boss"
    
    # Finish Boss
    client.post("/api/game/event", json={
        "player_id": player_id, "chapter_id": 1, "event_type": "boss_defeated", "event_data": {"boss_id": 201}
    })
    resp = client.get(f"/api/players/{player_id}/continue")
    assert resp.json()["next_action"] == "victory_cinematic"
    
    # Finish Victory Cinematic
    client.post("/api/game/event", json={
        "player_id": player_id, "chapter_id": 1, "event_type": "dialogue_completed", "event_data": {"scene_id": "102"}
    })
    resp = client.get(f"/api/players/{player_id}/continue")
    assert resp.json()["next_action"] == "cultural_challenge"
    
    # Finish Challenge
    # Need to create a mock challenge attempt in db directly for testing since there is no challenge completion endpoint via events
    # We'll just test that we get cultural_challenge since we did not complete it yet.
    # Actually wait, I can post to the actual challenges endpoints if they exist, but testing the progression_service is sufficient.
