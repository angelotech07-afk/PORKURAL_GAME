from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models
import json

client = TestClient(app)

def get_correct_answer(challenge_id: int) -> str:
    db = SessionLocal()
    try:
        chal = db.query(models.CulturalChallenge).filter(models.CulturalChallenge.challenge_id == challenge_id).first()
        return chal.correct_answer if chal else "UNKNOWN"
    finally:
        db.close()

def run_verification():
    print("=== STARTING VERIFICATION ===")
    
    # 1. POST /api/players/guest
    print("\n1. Creating guest player...")
    resp = client.post("/api/players/guest", json={"username": "TestGuest"})
    assert resp.status_code == 201, f"Failed to create player: {resp.text}"
    player = resp.json()
    player_id = player["player_id"]
    print(f"   -> Player created with ID {player_id}")

    # 2. GET /api/game/bootstrap/{player_id}
    print("\n2. Fetching bootstrap...")
    resp = client.get(f"/api/game/bootstrap/{player_id}")
    assert resp.status_code == 200, f"Failed to bootstrap: {resp.text}"
    bootstrap_data = resp.json()
    current_chapter = bootstrap_data["current_chapter"]["chapter_id"]
    print(f"   -> Current Chapter: {current_chapter}")
    
    boss_id = None
    if bootstrap_data.get("boss"):
        boss_id = bootstrap_data["boss"]["boss_id"]
        print(f"   -> Chapter Boss ID: {boss_id}")
        
    challenges = bootstrap_data.get("challenges", [])
    challenge_id = None
    if challenges:
        challenge_id = challenges[0]["challenge_id"]
        print(f"   -> Chapter Challenge ID: {challenge_id}")

    # 3. Chapter 1 flow
    print("\n3. Executing Chapter Flow...")
    if boss_id:
        print(f"   -> Submitting boss_defeated event for boss {boss_id}")
        event_payload = {
            "player_id": player_id,
            "chapter_id": current_chapter,
            "event_type": "boss_defeated",
            "event_data": {"boss_id": boss_id}
        }
        resp = client.post("/api/game/event", json=event_payload)
        assert resp.status_code == 200, f"Boss event failed: {resp.text}"
        event_resp = resp.json()
        print(f"      XP Earned: {event_resp.get('xp_earned')}, Score: {event_resp.get('score_earned')}")

    if challenge_id:
        correct_answer = get_correct_answer(challenge_id)
        print(f"   -> Submitting challenge {challenge_id} with answer '{correct_answer}'")
        chal_payload = {
            "player_id": player_id,
            "challenge_id": challenge_id,
            "answer": correct_answer
        }
        resp = client.post("/api/challenges/submit", json=chal_payload)
        assert resp.status_code == 200, f"Challenge submit failed: {resp.text}"
        chal_resp = resp.json()
        print(f"      Success: {chal_resp.get('success')}, Correct: {chal_resp.get('correct')}")
        print(f"      XP Earned: {chal_resp.get('xp_earned')}, Score: {chal_resp.get('score_earned')}")

    print("   -> Completing Chapter...")
    complete_payload = {
        "player_id": player_id,
        "chapter_id": current_chapter
    }
    resp = client.post("/api/game/complete-chapter", json=complete_payload)
    assert resp.status_code == 200, f"Chapter complete failed: {resp.text}"
    print(f"      Chapter complete result: {resp.json().get('message')}")

    # 4. Verify server-authoritative progression
    print("\n4. Verifying progression after completion...")
    resp = client.get(f"/api/players/{player_id}")
    assert resp.status_code == 200
    player_data = resp.json()
    print(f"   -> Level: {player_data['level']}")
    print(f"   -> XP: {player_data['experience']}")
    print(f"   -> Score: {player_data['total_score']}")
    print(f"   -> Coins: {player_data['coins']}")
    print(f"   -> Current Chapter: {player_data['current_chapter']}")
    assert player_data["current_chapter"] > current_chapter, "Chapter did not increment!"

    # 5. Verify duplicate protection
    print("\n5. Verifying duplicate protection...")
    if boss_id:
        print("   -> Resubmitting boss_defeated event")
        resp = client.post("/api/game/event", json=event_payload)
        dup_event_resp = resp.json()
        print(f"      XP Earned: {dup_event_resp.get('xp_earned')}, Expected: 0")
        assert dup_event_resp.get("xp_earned") == 0, "Duplicate protection failed for boss!"
    
    if challenge_id:
        print("   -> Resubmitting challenge")
        resp = client.post("/api/challenges/submit", json=chal_payload)
        dup_chal_resp = resp.json()
        print(f"      XP Earned: {dup_chal_resp.get('xp_earned')}, Expected: 0")
        assert dup_chal_resp.get("xp_earned") == 0, "Duplicate protection failed for challenge!"

    # 6. Verify bootstrap after completion
    print("\n6. Verifying bootstrap after completion...")
    resp = client.get(f"/api/game/bootstrap/{player_id}")
    assert resp.status_code == 200
    bootstrap_after = resp.json()
    new_chapter = bootstrap_after["current_chapter"]["chapter_id"]
    print(f"   -> New Bootstrap Current Chapter: {new_chapter}")
    assert new_chapter > current_chapter, "Bootstrap chapter mismatch!"

    print("\n=== VERIFICATION SUCCESSFUL ===")

if __name__ == "__main__":
    run_verification()
