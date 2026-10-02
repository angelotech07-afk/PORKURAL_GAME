from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pytest

from main import app
from database import Base, get_db
import models
from scripts import populate_db

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
def setup_seed_db(monkeypatch):
    app.dependency_overrides[get_db] = override_get_db
    
    # clear db
    db = TestingSessionLocal()
    db.query(models.ChallengeAttempt).delete()
    db.query(models.CulturalChallenge).delete()
    db.query(models.PlayerCodex).delete()
    db.query(models.PlayerItem).delete()
    db.query(models.CodexEntry).delete()
    db.query(models.Item).delete()
    db.query(models.DialogueScene).delete()
    db.query(models.DialogueLine).delete()
    db.query(models.DialogueChoice).delete()
    db.query(models.GameEvent).delete()
    db.query(models.Boss).delete()
    db.query(models.ChapterProgress).delete()
    db.query(models.Chapter).delete()
    db.query(models.Player).delete()
    db.commit()
    db.close()

    # Mock populate_db to use our test DB
    monkeypatch.setattr(populate_db, "engine", engine)
    monkeypatch.setattr(populate_db, "SessionLocal", TestingSessionLocal)
    populate_db.populate()
    yield

def test_five_chapter_e2e_journey():
    # 1. Create guest player
    resp = client.post("/api/players/guest")
    assert resp.status_code == 201
    player_id = resp.json()["player_id"]
    
    db = TestingSessionLocal()
    chapters = db.query(models.Chapter).order_by(models.Chapter.chapter_id).all()
    assert len(chapters) >= 5, "Database must have at least 5 chapters seeded"
    
    for chapter in chapters:
        c_id = chapter.chapter_id
        
        # Check current chapter state
        prog_resp = client.get(f"/api/players/{player_id}/progress")
        assert prog_resp.json()["player"]["current_chapter"] == c_id
        
        # Continue should point to intro
        cont_resp = client.get(f"/api/players/{player_id}/continue")
        assert cont_resp.json()["chapter_id"] == c_id
        if chapter.intro_dialogue_scene:
            assert cont_resp.json()["next_action"] == "chapter_intro"
            # Complete intro
            client.post("/api/game/event", json={
                "player_id": player_id, "chapter_id": c_id, "event_type": "dialogue_completed", 
                "event_data": {"scene_id": chapter.intro_dialogue_scene}
            })
            
        # Continue should point to boss
        if chapter.boss_id:
            cont_resp = client.get(f"/api/players/{player_id}/continue")
            assert cont_resp.json()["next_action"] == "boss"
            
            # Complete Boss
            client.post("/api/game/event", json={
                "player_id": player_id, "chapter_id": c_id, "event_type": "boss_defeated", 
                "event_data": {"boss_id": chapter.boss_id}
            })
            
        # Victory cinematic
        if chapter.victory_dialogue_scene:
            cont_resp = client.get(f"/api/players/{player_id}/continue")
            assert cont_resp.json()["next_action"] == "victory_cinematic"
            
            # Complete victory
            client.post("/api/game/event", json={
                "player_id": player_id, "chapter_id": c_id, "event_type": "dialogue_completed", 
                "event_data": {"scene_id": chapter.victory_dialogue_scene}
            })
            
        # Challenge
        if chapter.required_challenge_id:
            cont_resp = client.get(f"/api/players/{player_id}/continue")
            assert cont_resp.json()["next_action"] == "cultural_challenge"
            
            chal = db.query(models.CulturalChallenge).filter(models.CulturalChallenge.challenge_id == chapter.required_challenge_id).first()
            # Submit challenge correctly
            client.post("/api/challenges/submit", json={
                "player_id": player_id, "challenge_id": chal.challenge_id, "answer": chal.correct_answer
            })
            
        # Complete chapter
        cont_resp = client.get(f"/api/players/{player_id}/continue")
        assert cont_resp.json()["next_action"] == "chapter_complete"
        
        comp_resp = client.post("/api/game/complete-chapter", json={
            "player_id": player_id, "chapter_id": c_id
        })
        assert comp_resp.status_code == 200
        
    db.close()
    
    # Verify final stats
    stats_resp = client.get(f"/api/players/{player_id}/statistics")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["chapters_completed"] == len(chapters)
    
def test_cross_player_isolation():
    # Player A
    resp_a = client.post("/api/players/guest")
    player_a_id = resp_a.json()["player_id"]
    
    # Player B
    resp_b = client.post("/api/players/guest")
    player_b_id = resp_b.json()["player_id"]
    
    # Player A completes dialogue
    db = TestingSessionLocal()
    ch1 = db.query(models.Chapter).filter(models.Chapter.chapter_id == 1).first()
    db.close()
    
    client.post("/api/game/event", json={
        "player_id": player_a_id, "chapter_id": 1, "event_type": "dialogue_completed", 
        "event_data": {"scene_id": ch1.intro_dialogue_scene}
    })
    
    # Verify Player B does not have it
    cont_b = client.get(f"/api/players/{player_b_id}/continue")
    assert cont_b.json()["next_action"] == "chapter_intro"
    
def test_duplicate_retry_handling():
    resp = client.post("/api/players/guest")
    player_id = resp.json()["player_id"]
    
    db = TestingSessionLocal()
    ch1 = db.query(models.Chapter).filter(models.Chapter.chapter_id == 1).first()
    db.close()
    
    # Boss Defeat 1
    client.post("/api/game/event", json={
        "player_id": player_id, "chapter_id": 1, "event_type": "dialogue_completed", "event_data": {"scene_id": ch1.intro_dialogue_scene}
    })
    r1 = client.post("/api/game/event", json={
        "player_id": player_id, "chapter_id": 1, "event_type": "boss_defeated", "event_data": {"boss_id": ch1.boss_id}
    })
    assert r1.json()["xp_earned"] > 0
    
    # Boss Defeat 2 (Duplicate)
    r2 = client.post("/api/game/event", json={
        "player_id": player_id, "chapter_id": 1, "event_type": "boss_defeated", "event_data": {"boss_id": ch1.boss_id}
    })
    assert r2.json()["xp_earned"] == 0
    assert "already processed" in r2.json()["message"]
