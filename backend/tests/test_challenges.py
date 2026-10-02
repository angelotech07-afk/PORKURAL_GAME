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
    
    db.query(models.ChallengeAttempt).delete()
    db.query(models.CulturalChallenge).delete()
    db.query(models.PlayerCodex).delete()
    db.query(models.PlayerItem).delete()
    db.query(models.CodexEntry).delete()
    db.query(models.Item).delete()
    db.query(models.Player).delete()
    db.query(models.Chapter).delete()
    
    ch1 = models.Chapter(chapter_id=1, title="Ch 1", region="R", historical_period="P", description="D", cultural_theme="T", objective="O", difficulty="N", is_active=True)
    db.add(ch1)
    
    ce1 = models.CodexEntry(codex_id="c1", title="Title 1", category="Cat 1", region="Reg 1", historical_period="Period 1", short_description="Desc", detailed_description="Details", cultural_significance="Sig", chapter_id=1, unlock_condition="None")
    db.add(ce1)
    
    i1 = models.Item(item_id="i1", name="Item 1", type="Weapon", region="Reg 1", historical_period="Period 1", description="Desc", cultural_significance="Sig", chapter_id=1, unlock_condition="None")
    db.add(i1)
    
    c1 = models.CulturalChallenge(
        challenge_id=1, chapter_id=1, title="Title 1", description="Desc",
        challenge_type="knowledge_question", question_text="Q1",
        options='["A", "B"]', correct_answer="A", explanation="Exp 1",
        reward_xp=100, reward_score=200, codex_reward_id="c1", item_reward_id="i1",
        difficulty="normal", trigger_event=None
    )
    db.add(c1)
    db.commit()
    db.close()

def test_get_chapter_challenges():
    create_response = client.post("/api/players/guest")
    player_id = create_response.json()["player_id"]
    
    response = client.get(f"/api/challenges/chapter/1?player_id={player_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["challenge_id"] == 1
    assert "correct_answer" not in data[0]

def test_get_challenge():
    response = client.get("/api/challenges/1")
    assert response.status_code == 200
    data = response.json()
    assert data["challenge_id"] == 1
    assert "correct_answer" not in data

def test_submit_challenge_correct():
    create_response = client.post("/api/players/guest")
    player_id = create_response.json()["player_id"]
    
    # Check player initial XP
    p_res = client.get(f"/api/players/{player_id}")
    assert p_res.json()["experience"] == 0
    assert p_res.json()["total_score"] == 0
    
    # Submit correct answer
    response = client.post("/api/challenges/submit", json={
        "player_id": player_id,
        "challenge_id": 1,
        "answer": "A"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["correct"] == True
    assert data["xp_earned"] == 100
    assert data["score_earned"] == 200
    assert data["explanation"] == "Exp 1"
    assert "c1" in data["new_unlocks"]["codex"]
    assert "i1" in data["new_unlocks"]["items"]
    
    # Check player updated XP
    p_res = client.get(f"/api/players/{player_id}")
    assert p_res.json()["experience"] == 100
    assert p_res.json()["total_score"] == 200
    assert p_res.json()["level"] > 1 # formula 1 + int(sqrt(100/100)) = 2

    # Check unlocks via player endpoints
    codex_res = client.get(f"/api/players/{player_id}/codex")
    assert len(codex_res.json()) == 1
    # since we mocked out the actual codex entry from DB, player codex response will try to fetch the codex entry. 
    # Let's just make sure it doesn't crash.

def test_submit_challenge_incorrect():
    create_response = client.post("/api/players/guest")
    player_id = create_response.json()["player_id"]
    
    response = client.post("/api/challenges/submit", json={
        "player_id": player_id,
        "challenge_id": 1,
        "answer": "B"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["correct"] == False
    assert data["xp_earned"] == 0
    assert data["score_earned"] == 0
    assert data["explanation"] == "Exp 1"

def test_locked_challenge_by_trigger_event():
    db = TestingSessionLocal()
    # Add a locked challenge
    c_locked = models.CulturalChallenge(
        challenge_id=99, chapter_id=1, title="Locked", description="Locked",
        challenge_type="discovery", question_text="Q", options='[]', correct_answer="A",
        explanation="Exp", trigger_event="secret_found"
    )
    db.add(c_locked)
    db.commit()
    db.close()
    
    create_response = client.post("/api/players/guest")
    player_id = create_response.json()["player_id"]
    
    # Challenge should NOT be returned
    response = client.get(f"/api/challenges/chapter/1?player_id={player_id}")
    assert response.status_code == 200
    ids = [c["challenge_id"] for c in response.json()]
    assert 99 not in ids
    
    # Submitting locked challenge should fail
    response = client.post("/api/challenges/submit", json={
        "player_id": player_id,
        "challenge_id": 99,
        "answer": "A"
    })
    assert response.status_code == 400
    assert response.json()["detail"] == "Challenge is locked"
    
    # Simulate trigger event
    r = client.post("/api/game/event", json={
        "player_id": player_id, "chapter_id": 1, "event_type": "secret_found", "event_data": {}
    })
    assert r.status_code == 200
    
    # Challenge should NOW be returned
    response = client.get(f"/api/challenges/chapter/1?player_id={player_id}")
    assert response.status_code == 200
    ids = [c["challenge_id"] for c in response.json()]
    assert 99 in ids

def test_submit_duplicate_correct():
    create_response = client.post("/api/players/guest")
    player_id = create_response.json()["player_id"]
    
    # First correct
    client.post("/api/challenges/submit", json={
        "player_id": player_id, "challenge_id": 1, "answer": "A"
    })
    
    # Second correct
    response = client.post("/api/challenges/submit", json={
        "player_id": player_id,
        "challenge_id": 1,
        "answer": "A"
    })
    
    assert response.status_code == 200
    data = response.json()
    # It's correct, but rewards shouldn't be given twice
    assert data["correct"] == True
    assert data["xp_earned"] == 0
    assert data["score_earned"] == 0
