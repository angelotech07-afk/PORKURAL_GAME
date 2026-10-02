from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import health, players, chapters, codex, items, dialogues, challenges, game, leaderboard, story
from database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Culture Game API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5500",
        "http://127.0.0.1",
        "http://localhost",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "null",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(chapters.router, prefix="/api/chapters", tags=["chapters"])
app.include_router(codex.router, prefix="/api/codex", tags=["codex"])
app.include_router(items.router, prefix="/api/items", tags=["items"])
app.include_router(dialogues.router, prefix="/api/dialogues", tags=["dialogues"])
app.include_router(challenges.router, prefix="/api/challenges", tags=["challenges"])
app.include_router(game.router, prefix="/api/game", tags=["game"])
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["leaderboard"])
app.include_router(story.router, prefix="/api/story", tags=["story"])

@app.get("/")
def root():
    return {"message": "Welcome to the Culture Game Backend. Visit /docs for the API documentation."}
