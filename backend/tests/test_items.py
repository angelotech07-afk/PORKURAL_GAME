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
    
    db.query(models.PlayerItem).delete()
    db.query(models.Item).delete()
    db.query(models.Player).delete()
    
    i1 = models.Item(item_id="i1", name="Item 1", type="Weapon", region="Reg 1", historical_period="Period 1", description="Desc", cultural_significance="Sig", chapter_id=1, unlock_condition="None")
    db.add(i1)
    db.commit()
    db.close()

def test_get_items():
    response = client.get("/api/items/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["item_id"] == "i1"

def test_get_item():
    response = client.get("/api/items/i1")
    assert response.status_code == 200
    data = response.json()
    assert data["item_id"] == "i1"

def test_get_invalid_item():
    response = client.get("/api/items/invalid")
    assert response.status_code == 404

def test_get_player_items():
    create_response = client.post("/api/players/guest")
    player_id = create_response.json()["player_id"]
    
    # Initially empty
    response = client.get(f"/api/players/{player_id}/items")
    assert response.status_code == 200
    assert response.json() == []
    
    # Unlock an item
    db = TestingSessionLocal()
    db_player_item = models.PlayerItem(player_id=player_id, item_id="i1", quantity=1)
    db.add(db_player_item)
    db.commit()
    db.close()
    
    response = client.get(f"/api/players/{player_id}/items")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["item"]["item_id"] == "i1"
    assert data[0]["quantity"] == 1
