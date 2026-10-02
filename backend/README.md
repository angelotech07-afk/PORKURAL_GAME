# Culture Game Backend

## Project Overview
Backend foundation for the Indian cultural 2D action/fighting game. This system serves as the authoritative state machine for a progression-driven, episodic adventure game focusing on rich cultural storytelling, boss battles, and interactive learning challenges.

## Backend Purpose
The backend is responsible for:
- Maintaining authoritative player progression and statistics.
- Validating game events (boss defeats, chapter completions).
- Serving dynamic cultural content (codex entries, items, dialogues).
- Evaluating cultural challenges to prevent frontend answer leakage.
- Enforcing anti-cheat constraints on XP, score, and level progression.

## Technology Stack
- **Framework**: FastAPI
- **Server**: Uvicorn
- **ORM & Database**: SQLAlchemy, SQLite
- **Validation**: Pydantic & Pydantic-Settings
- **Testing**: Pytest & HTTPX

## Installation & Requirements
Ensure you have Python 3.11+ installed.

1. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Configuration
Configuration is managed via `pydantic-settings`. 
Copy the example configuration to set up your local environment:
```bash
cp .env.example .env
```
*(Note: `.env.example` contains safe defaults like `DATABASE_URL="sqlite:///./database/app.db"`. Do not commit real secrets if added later.)*

## Database Setup & Seed Instructions
The database runs on SQLite locally. You must populate the database with the cultural seed data (Chapters, Bosses, Codex, Items, Dialogues, and Challenges) before playing.

1. Ensure you are in the `backend` directory.
2. Run the seed script:
   ```bash
   python -m scripts.populate_db
   ```
*(This operation is idempotent. Running it multiple times safely updates the existing data.)*

## Server Startup
Start the backend server with live-reloading:
```bash
uvicorn main:app --reload
```

## API Documentation
Once the server is running, you can access the interactive Swagger UI OpenAPI documentation:
- **Swagger Docs**: http://127.0.0.1:8000/docs
- **Health Check**: http://127.0.0.1:8000/api/health

## Frontend Integration Flow
This API uses a progression-driven design where the backend acts as the authoritative state. The frontend should **NEVER** calculate authoritative XP, score, level, or rewards. 

**Recommended Flow:**
1. **Create/load player**: `POST /api/players/guest` or `GET /api/players/{id}`
2. **Bootstrap game**: `GET /api/game/bootstrap/{player_id}` initializes the HUD, active chapter, unlocked codex/items, and continue state.
3. **Read continue state**: `GET /api/players/{player_id}/continue` determines the next action (e.g. `chapter_intro`, `boss`).
4. **Load chapter**: Fetch chapter assets via `GET /api/chapters/{chapter_id}`.
5. **Play dialogue/cinematic**: If continue state says dialogue, fetch `GET /api/dialogues/scene/{scene_id}`. After user reads it, send `POST /api/game/event` (`dialogue_completed`).
6. **Frontend combat**: Frontend handles physics and combat.
7. **Backend validates boss defeat**: Report victory via `POST /api/game/event` (`boss_defeated`). Backend validates and awards authoritative XP.
8. **Start cultural challenge**: Fetch `GET /api/challenges/chapter/{chapter_id}`. Correct answers are hidden.
9. **Submit challenge**: `POST /api/challenges/submit`. Backend evaluates correctness and issues rewards.
10. **Complete chapter**: `POST /api/game/complete-chapter` strictly unlocks the next sequential chapter.

## Testing Instructions
A comprehensive 53-test suite validates End-to-End journeys, anti-cheat security, database integrity, and REST constraints.
Run tests using:
```bash
pytest
```
*Tests utilize an in-memory SQLite database and do not corrupt the local development file.*

## Project Structure
- `routers/`: FastAPI endpoint controllers (players, chapters, game, challenges, dialogues).
- `services/`: Core business logic (reward calculators, progression determinism).
- `models/`: SQLAlchemy database definitions.
- `schemas/`: Pydantic validation schemas.
- `data/`: Raw JSON seed files for Indian cultural content.
- `scripts/`: Database bootstrap and utility scripts.
- `tests/`: Pytest suite (integration, e2e, security).

## Known Limitations
1. **Authentication**: This prototype uses an anonymous guest system. A raw `player_id` acts as the session token. There are no JWTs or OAuth headers, meaning guests are not cryptographically isolated.
2. **Local Database**: SQLite is utilized for portability. For a massively multiplayer production release, migration to PostgreSQL is required.
