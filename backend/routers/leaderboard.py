from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List

import models
import schemas
from database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard(limit: int = 10, db: Session = Depends(get_db)):
    players = db.query(models.Player).order_by(
        desc(models.Player.total_score),
        desc(models.Player.level),
        models.Player.player_id
    ).limit(limit).all()
    
    leaderboard = []
    for i, p in enumerate(players):
        # Calculate chapters completed for this player
        chap_count = db.query(func.count(models.ChapterProgress.id)).filter(
            models.ChapterProgress.player_id == p.player_id,
            models.ChapterProgress.status == "completed"
        ).scalar()
        
        leaderboard.append(schemas.LeaderboardEntry(
            rank=i + 1,
            player_id=p.player_id,
            username=p.username,
            score=p.total_score,
            level=p.level,
            chapters_completed=chap_count
        ))
        
    return leaderboard

@router.get("/{player_id}", response_model=schemas.LeaderboardEntry)
def get_player_rank(player_id: int, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.player_id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
        
    # Calculate rank based on total score with deterministic tie-breakers
    from sqlalchemy import or_, and_
    higher_ranked = db.query(func.count(models.Player.player_id)).filter(
        or_(
            models.Player.total_score > player.total_score,
            and_(
                models.Player.total_score == player.total_score,
                models.Player.level > player.level
            ),
            and_(
                models.Player.total_score == player.total_score,
                models.Player.level == player.level,
                models.Player.player_id < player.player_id
            )
        )
    ).scalar()
    
    rank = higher_ranked + 1
    
    chap_count = db.query(func.count(models.ChapterProgress.id)).filter(
        models.ChapterProgress.player_id == player.player_id,
        models.ChapterProgress.status == "completed"
    ).scalar()
    
    return schemas.LeaderboardEntry(
        rank=rank,
        player_id=player.player_id,
        username=player.username,
        score=player.total_score,
        level=player.level,
        chapters_completed=chap_count
    )
