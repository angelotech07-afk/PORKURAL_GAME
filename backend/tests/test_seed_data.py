from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pytest
import os
import sys
import json

from main import app
from database import Base, get_db
import models
from scripts import populate_db

# Setup test database
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
    db.query(models.Boss).delete()
    db.query(models.Chapter).delete()
    db.query(models.Player).delete()
    db.commit()
    db.close()

    # Mock populate_db to use our test DB
    monkeypatch.setattr(populate_db, "engine", engine)
    monkeypatch.setattr(populate_db, "SessionLocal", TestingSessionLocal)
    
    # Run populate twice to test idempotency
    populate_db.populate()
    populate_db.populate()
    
    yield

def test_seed_minimum_chapter_count():
    db = TestingSessionLocal()
    chapters = db.query(models.Chapter).all()
    assert len(chapters) >= 5, "Must have at least 5 chapters"
    db.close()

def test_every_active_chapter_has_boss():
    db = TestingSessionLocal()
    chapters = db.query(models.Chapter).filter(models.Chapter.is_active == True).all()
    for chapter in chapters:
        assert chapter.boss_id is not None, f"Chapter {chapter.chapter_id} has no boss"
        boss = db.query(models.Boss).filter(models.Boss.boss_id == chapter.boss_id).first()
        assert boss is not None, f"Boss for chapter {chapter.chapter_id} not found"
        assert boss.chapter_id == chapter.chapter_id
    db.close()

def test_every_chapter_has_cultural_content():
    db = TestingSessionLocal()
    chapters = db.query(models.Chapter).all()
    for chapter in chapters:
        # Check challenges
        challenges = db.query(models.CulturalChallenge).filter(models.CulturalChallenge.chapter_id == chapter.chapter_id).all()
        assert len(challenges) > 0, f"Chapter {chapter.chapter_id} has no cultural challenges"
        
        # Check codex entries OR items (at least some cultural context should exist)
        assert chapter.intro_dialogue_scene is not None
        assert chapter.victory_dialogue_scene is not None
    db.close()

def test_codex_entries_valid_data():
    db = TestingSessionLocal()
    entries = db.query(models.CodexEntry).all()
    assert len(entries) >= 20, "Must have at least 20 codex entries"
    for entry in entries:
        assert entry.title is not None
        assert entry.detailed_description is not None
        assert entry.cultural_significance is not None
        if entry.chapter_id is not None:
            chap = db.query(models.Chapter).filter(models.Chapter.chapter_id == entry.chapter_id).first()
            assert chap is not None, f"Invalid chapter_id {entry.chapter_id} in codex {entry.codex_id}"
    db.close()

def test_items_valid_chapter_references():
    db = TestingSessionLocal()
    items = db.query(models.Item).all()
    assert len(items) >= 10, "Must have at least 10 items"
    for item in items:
        if item.chapter_id is not None:
            chap = db.query(models.Chapter).filter(models.Chapter.chapter_id == item.chapter_id).first()
            assert chap is not None, f"Invalid chapter_id {item.chapter_id} in item {item.item_id}"
    db.close()

def test_challenges_valid_chapter_references():
    db = TestingSessionLocal()
    challenges = db.query(models.CulturalChallenge).all()
    for challenge in challenges:
        if challenge.chapter_id is not None:
            chap = db.query(models.Chapter).filter(models.Chapter.chapter_id == challenge.chapter_id).first()
            assert chap is not None, f"Invalid chapter_id {challenge.chapter_id} in challenge {challenge.challenge_id}"
    db.close()

def test_dialogues_valid_chapter_references():
    db = TestingSessionLocal()
    scenes = db.query(models.DialogueScene).all()
    for scene in scenes:
        if scene.chapter_id is not None:
            chap = db.query(models.Chapter).filter(models.Chapter.chapter_id == scene.chapter_id).first()
            assert chap is not None, f"Invalid chapter_id {scene.chapter_id} in scene {scene.scene_id}"
            
    lines = db.query(models.DialogueLine).all()
    for line in lines:
        if line.chapter_id is not None:
            chap = db.query(models.Chapter).filter(models.Chapter.chapter_id == line.chapter_id).first()
            assert chap is not None, f"Invalid chapter_id {line.chapter_id} in line {line.dialogue_id}"
    db.close()

def test_no_duplicate_seed_records():
    db = TestingSessionLocal()
    chapters = db.query(models.Chapter).all()
    assert len(chapters) == 5, "Expected exactly 5 chapters without duplicates after running twice"
    
    bosses = db.query(models.Boss).all()
    assert len(bosses) == 5, "Expected exactly 5 bosses without duplicates"
    
    entries = db.query(models.CodexEntry).all()
    assert len(entries) == 20, f"Expected 20 entries, found {len(entries)}"
    
    items = db.query(models.Item).all()
    assert len(items) == 10, "Expected 10 items without duplicates"
    db.close()

def test_challenge_answers_not_exposed():
    # Verify through GET endpoints
    # Use real seeded DB data via the app overriding get_db
    create_response = client.post("/api/players/guest")
    player_id = create_response.json()["player_id"]
    
    # Unlock a challenge by triggering it
    client.post("/api/game/event", json={
        "player_id": player_id, "chapter_id": 1, "event_type": "master_training", "event_data": {}
    })
    
    response = client.get(f"/api/challenges/chapter/1?player_id={player_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    for challenge in data:
        assert "correct_answer" not in challenge
        assert "explanation" not in challenge # usually explanation is not exposed until submitted
