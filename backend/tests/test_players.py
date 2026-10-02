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
    db.query(models.Player).delete()
    db.query(models.ChapterProgress).delete()
    db.commit()
    db.close()

def test_create_guest_player():
    response = client.post("/api/players/guest")
    assert response.status_code == 201
    data = response.json()
    assert "player_id" in data
    assert data["username"].startswith("Guest_")
    assert data["level"] == 1
    assert data["experience"] == 0
    assert data["total_score"] == 0
    assert data["current_chapter"] == 1

def test_get_player():
    # First create a player
    create_response = client.post("/api/players/guest")
    player_id = create_response.json()["player_id"]
    
    # Then get the player
    response = client.get(f"/api/players/{player_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["player_id"] == player_id

def test_get_invalid_player():
    response = client.get("/api/players/999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Player not found"

def test_get_player_progress():
    # First create a player
    create_response = client.post("/api/players/guest")
    player_id = create_response.json()["player_id"]
    
    # Get progress
    response = client.get(f"/api/players/{player_id}/progress")
    assert response.status_code == 200
    data = response.json()
    assert "player" in data
    assert data["chapters"]["completed"] == []
