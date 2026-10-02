from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pytest

from main import app
from database import Base, get_db
import models

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
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    db = TestingSessionLocal()
    
    # clear db
    db.query(models.ChapterProgress).delete()
    db.query(models.Boss).delete()
    db.query(models.Chapter).delete()
    db.query(models.Player).delete()

    
    # Seed data
    ch1 = models.Chapter(chapter_id=1, title="Chapter 1", region="Region 1", historical_period="Period 1", description="Desc", cultural_theme="Theme", objective="Obj", difficulty="Normal", is_active=True)
    db.add(ch1)
    db.commit()
    
    b1 = models.Boss(boss_id=1, chapter_id=1, name="Boss 1", title="Title", level=1, max_health=100, difficulty="Normal", description="Desc", cultural_context="Context", reward_xp=10, reward_score=10)
    db.add(b1)
    db.commit()
    
    ch1.boss_id = 1
    db.commit()
    
    db.close()

def test_get_chapters():
    response = client.get("/api/chapters/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["chapter_id"] == 1
    assert data[0]["title"] == "Chapter 1"

def test_get_chapter():
    response = client.get("/api/chapters/1")
    assert response.status_code == 200
    data = response.json()
    assert data["chapter_id"] == 1
    
def test_get_chapter_not_found():
    response = client.get("/api/chapters/999")
    assert response.status_code == 404

def test_get_chapter_boss():
    response = client.get("/api/chapters/1/boss")
    assert response.status_code == 200
    data = response.json()
    assert data["boss_id"] == 1
    assert data["name"] == "Boss 1"

def test_get_chapter_boss_not_found():
    response = client.get("/api/chapters/999/boss")
    assert response.status_code == 404

def test_get_player_chapters():
    # First create a player
    create_response = client.post("/api/players/guest")
    player_id = create_response.json()["player_id"]
    
    response = client.get(f"/api/players/{player_id}/chapters")
    assert response.status_code == 200
    data = response.json()
    
    # A new player is at chapter 1, which becomes current.
    # Current might be chapter 1. And no others since there's only 1 chapter in db.
    assert data["current"] is not None
    assert data["current"]["chapter_id"] == 1
    assert len(data["locked"]) == 0
    assert len(data["unlocked"]) == 0
    assert len(data["completed"]) == 0
