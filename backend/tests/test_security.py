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
    
    # Setup base universe
    c1 = models.Chapter(chapter_id=1, title="C1", region="R", historical_period="H", description="D", cultural_theme="T", objective="O", difficulty="E")
    c2 = models.Chapter(chapter_id=2, title="C2", region="R", historical_period="H", description="D", cultural_theme="T", objective="O", difficulty="E")
    db.add_all([c1, c2])
    
    boss = models.Boss(boss_id=1, chapter_id=2, name="Future Boss", title="B", level=2, max_health=100, difficulty="H", description="D", cultural_context="C", reward_xp=500, reward_score=500)
    db.add(boss)
    
    chal = models.CulturalChallenge(
        challenge_id=1, chapter_id=2, title="T", description="D", challenge_type="Q", 
        question_text="Q", options="O", correct_answer="SecretAnswer", explanation="E",
        reward_xp=100, reward_score=100, difficulty="M"
    )
    db.add(chal)
    
    db.commit()
    db.close()

def test_chapter_lock_bypass():
    db = TestingSessionLocal()
    p = models.Player(username="Hacker", level=1, experience=0, total_score=0, current_chapter=1)
    db.add(p)
    db.commit()
    db.refresh(p)
    player_id = p.player_id
    db.close()
    
    # 1. Attempt to log an event for locked chapter 2
    res = client.post("/api/game/event", json={
        "player_id": player_id,
        "chapter_id": 2,
        "event_type": "boss_defeated",
        "event_data": {"boss_id": 1}
    })
    assert res.status_code == 403
    assert res.json()["detail"] == "Chapter is locked"
    
    # 2. Attempt to complete locked chapter 2
    res2 = client.post("/api/game/complete-chapter", json={
        "player_id": player_id,
        "chapter_id": 2
    })
    assert res2.status_code == 403
    assert res2.json()["detail"] == "Chapter is locked"
    
    # 3. Attempt to submit a challenge for locked chapter 2
    res3 = client.post("/api/challenges/submit", json={
        "player_id": player_id,
        "challenge_id": 1,
        "answer": "SecretAnswer"
    })
    assert res3.status_code == 403
    assert res3.json()["detail"] == "Challenge chapter is locked"

def test_schema_input_bounds():
    # Attempt negative IDs
    res = client.post("/api/game/event", json={
        "player_id": -5,
        "chapter_id": -2,
        "event_type": "boss_defeated",
        "event_data": {"boss_id": 1}
    })
    assert res.status_code == 422 # Unprocessable Entity (Pydantic validation failure)
    
def test_challenge_correct_answer_protection():
    # Fetch challenge 1 directly
    res = client.get("/api/challenges/1")
    assert res.status_code == 200
    data = res.json()
    
    # Assert correct_answer is completely scrubbed from the response
    assert "correct_answer" not in data
    assert data["question_text"] == "Q"
