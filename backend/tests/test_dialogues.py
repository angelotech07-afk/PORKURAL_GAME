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
    
    db.query(models.DialogueChoice).delete()
    db.query(models.DialogueLine).delete()
    db.query(models.DialogueScene).delete()
    db.query(models.PlayerDialogueProgress).delete()
    db.query(models.Player).delete()
    
    scene1 = models.DialogueScene(scene_id="s1", chapter_id=1, trigger_event="chapter_start", description="Desc")
    db.add(scene1)
    
    line1 = models.DialogueLine(dialogue_id="l1", scene_id="s1", chapter_id=1, sequence_order=1, speaker_id="npc", speaker_name="NPC", speaker_role="npc", dialogue_text="Hello", is_cinematic=True)
    db.add(line1)
    
    choice1 = models.DialogueChoice(choice_id="c1", dialogue_id="l1", choice_text="Hi")
    db.add(choice1)
    
    db.commit()
    db.close()

def test_get_chapter_dialogues():
    response = client.get("/api/dialogues/chapter/1")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["scene_id"] == "s1"
    assert len(data[0]["lines"]) == 1
    assert len(data[0]["lines"][0]["choices"]) == 1

def test_get_scene_dialogue():
    response = client.get("/api/dialogues/scene/s1")
    assert response.status_code == 200
    data = response.json()
    assert data["scene_id"] == "s1"
    assert len(data["lines"]) == 1

def test_trigger_dialogue():
    response = client.post("/api/dialogues/trigger", json={
        "player_id": 1,
        "chapter_id": 1,
        "event": "chapter_start"
    })
    assert response.status_code == 200
    assert response.json()["scene_id"] == "s1"

def test_complete_dialogue_scene():
    create_response = client.post("/api/players/guest")
    player_id = create_response.json()["player_id"]
    
    response = client.post(f"/api/dialogues/s1/complete?player_id={player_id}")
    assert response.status_code == 200
    
    progress_res = client.get(f"/api/players/{player_id}/dialogues")
    assert progress_res.status_code == 200
    data = progress_res.json()
    assert len(data) == 1
    assert data[0]["scene_id"] == "s1"

def test_submit_dialogue_choice():
    response = client.post("/api/dialogues/choice", json={
        "player_id": 1,
        "choice_id": "c1"
    })
    assert response.status_code == 200
    assert response.json()["choice_id"] == "c1"
