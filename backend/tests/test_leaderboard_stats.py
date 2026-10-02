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
    
    # Clear all data
    db.query(models.ChallengeAttempt).delete()
    db.query(models.CulturalChallenge).delete()
    db.query(models.PlayerCodex).delete()
    db.query(models.PlayerItem).delete()
    db.query(models.CodexEntry).delete()
    db.query(models.Item).delete()
    db.query(models.PlayerDialogueProgress).delete()
    db.query(models.DialogueScene).delete()
    db.query(models.DialogueLine).delete()
    db.query(models.DialogueChoice).delete()
    db.query(models.GameEvent).delete()
    db.query(models.ChapterProgress).delete()
    db.query(models.Boss).delete()
    db.query(models.Chapter).delete()
    db.query(models.Player).delete()
    db.commit()
    db.close()

def test_comprehensive_statistics():
    db = TestingSessionLocal()
    # Create player
    p1 = models.Player(username="stat_player", level=2, experience=100, total_score=500, current_chapter=2)
    db.add(p1)
    db.commit()
    db.refresh(p1)
    
    # Add dummy data to trigger stat counting
    db.add(models.ChapterProgress(player_id=p1.player_id, chapter_id=1, status="completed", score=100))
    db.add(models.GameEvent(player_id=p1.player_id, event_type="boss_defeated", event_data="{}"))
    db.add(models.GameEvent(player_id=p1.player_id, event_type="boss_defeated", event_data="{}"))
    db.add(models.ChallengeAttempt(player_id=p1.player_id, challenge_id=1, answer="A", correct=True))
    db.add(models.ChallengeAttempt(player_id=p1.player_id, challenge_id=2, answer="B", correct=False))
    db.add(models.PlayerDialogueProgress(player_id=p1.player_id, scene_id="s1"))
    db.add(models.PlayerCodex(player_id=p1.player_id, codex_entry_id="c1"))
    db.add(models.PlayerItem(player_id=p1.player_id, item_id="i1", quantity=1))
    db.add(models.PlayerItem(player_id=p1.player_id, item_id="i2", quantity=2))
    
    player_id = p1.player_id
    db.commit()
    db.close()
    
    response = client.get(f"/api/players/{player_id}/statistics")
    assert response.status_code == 200
    data = response.json()
    
    assert data["player_id"] == player_id
    assert data["username"] == "stat_player"
    assert data["level"] == 2
    assert data["experience"] == 100
    assert data["total_score"] == 500
    assert data["current_chapter"] == 2
    assert data["chapters_completed"] == 1
    assert data["bosses_defeated"] == 2
    assert data["challenges_completed"] == 1
    assert data["correct_challenge_answers"] == 1
    assert data["incorrect_challenge_answers"] == 1
    assert data["dialogues_completed"] == 1
    assert data["codex_unlocked"] == 1
    assert data["items_unlocked"] == 2

def test_leaderboard_sorting_and_rank():
    db = TestingSessionLocal()
    p1 = models.Player(player_id=1, username="P1", level=5, total_score=500)
    p2 = models.Player(player_id=2, username="P2", level=2, total_score=500)
    p3 = models.Player(player_id=3, username="P3", level=2, total_score=500)
    p4 = models.Player(player_id=4, username="P4", level=1, total_score=1000)
    
    db.add_all([p1, p2, p3, p4])
    db.commit()
    db.close()
    
    # Test main leaderboard array
    response = client.get("/api/leaderboard")
    assert response.status_code == 200
    data = response.json()
    
    assert len(data) == 4
    
    # Check absolute order
    assert data[0]["player_id"] == 4 # Rank 1
    assert data[0]["rank"] == 1
    
    assert data[1]["player_id"] == 1 # Rank 2
    assert data[1]["rank"] == 2
    
    assert data[2]["player_id"] == 2 # Rank 3
    assert data[2]["rank"] == 3
    
    assert data[3]["player_id"] == 3 # Rank 4
    assert data[3]["rank"] == 4
    
    # Test specific player ranks
    res_p1 = client.get("/api/leaderboard/1")
    assert res_p1.json()["rank"] == 2
    
    res_p2 = client.get("/api/leaderboard/2")
    assert res_p2.json()["rank"] == 3
    
    res_p3 = client.get("/api/leaderboard/3")
    assert res_p3.json()["rank"] == 4
    
    res_p4 = client.get("/api/leaderboard/4")
    assert res_p4.json()["rank"] == 1

def test_invalid_player():
    # Invalid stats
    response = client.get("/api/players/999/statistics")
    assert response.status_code == 404
    
    # Invalid leaderboard
    response = client.get("/api/leaderboard/999")
    assert response.status_code == 404
