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
    
    db.query(models.PlayerCodex).delete()
    db.query(models.CodexEntry).delete()
    db.query(models.Player).delete()
    
    ce1 = models.CodexEntry(codex_id="c1", title="Title 1", category="Cat 1", region="Reg 1", historical_period="Period 1", short_description="Desc", detailed_description="Details", cultural_significance="Sig", chapter_id=1, unlock_condition="None")
    db.add(ce1)
    db.commit()
    db.close()

def test_get_codex_entries():
    response = client.get("/api/codex/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["codex_id"] == "c1"

def test_get_codex_entry():
    response = client.get("/api/codex/c1")
    assert response.status_code == 200
    data = response.json()
    assert data["codex_id"] == "c1"

def test_get_invalid_codex_entry():
    response = client.get("/api/codex/invalid")
    assert response.status_code == 404

def test_get_player_codex():
    create_response = client.post("/api/players/guest")
    player_id = create_response.json()["player_id"]
    
    # Initially empty
    response = client.get(f"/api/players/{player_id}/codex")
    assert response.status_code == 200
    assert response.json() == []
    
    # Unlock a codex
    db = TestingSessionLocal()
    db_player_codex = models.PlayerCodex(player_id=player_id, codex_entry_id="c1")
    db.add(db_player_codex)
    db.commit()
    db.close()
    
    response = client.get(f"/api/players/{player_id}/codex")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["codex_entry"]["codex_id"] == "c1"
