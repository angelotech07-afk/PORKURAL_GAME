from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db
from services.reward_service import grant_rewards

router = APIRouter()

@router.get("/chapter/{chapter_id}", response_model=List[schemas.CulturalChallenge])
def get_chapter_challenges(chapter_id: int, player_id: int, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.player_id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
        
    all_challenges = db.query(models.CulturalChallenge).filter(
        models.CulturalChallenge.chapter_id == chapter_id,
        models.CulturalChallenge.is_active == True
    ).all()
    
    # Filter by trigger_event
    player_events = db.query(models.GameEvent).filter(
        models.GameEvent.player_id == player_id
    ).all()
    event_types = set([e.event_type for e in player_events])
    
    available_challenges = []
    for chal in all_challenges:
        if chal.trigger_event and chal.trigger_event not in event_types:
            continue
        available_challenges.append(chal)
        
    return available_challenges

@router.get("/{challenge_id}", response_model=schemas.CulturalChallenge)
def get_challenge(challenge_id: int, db: Session = Depends(get_db)):
    challenge = db.query(models.CulturalChallenge).filter(models.CulturalChallenge.challenge_id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge

@router.post("/submit", response_model=schemas.ChallengeSubmitResponse)
def submit_challenge(req: schemas.ChallengeSubmitRequest, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.player_id == req.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
        
    challenge = db.query(models.CulturalChallenge).filter(models.CulturalChallenge.challenge_id == req.challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
        
    if challenge.chapter_id > player.current_chapter:
        raise HTTPException(status_code=403, detail="Challenge chapter is locked")
        
    if challenge.trigger_event:
        has_event = db.query(models.GameEvent).filter(
            models.GameEvent.player_id == req.player_id,
            models.GameEvent.event_type == challenge.trigger_event
        ).first()
        if not has_event:
            raise HTTPException(status_code=400, detail="Challenge is locked")
            
    # Check if already attempted correctly
    previous_success = db.query(models.ChallengeAttempt).filter(
        models.ChallengeAttempt.player_id == req.player_id,
        models.ChallengeAttempt.challenge_id == req.challenge_id,
        models.ChallengeAttempt.correct == True
    ).first()
    
    is_correct = (req.answer == challenge.correct_answer)
    
    xp = 0
    score = 0
    explanation = challenge.explanation # Always provide the explanation for learning
    msg = None
    unlocks = {"codex": [], "items": []}
    
    if is_correct:
        # Only reward if not already successfully completed
        if not previous_success:
            xp = challenge.reward_xp
            score = challenge.reward_score
            coins = getattr(challenge, 'reward_coins', 0)
            unlocks = grant_rewards(
                db=db,
                player=player,
                xp=xp,
                score=score,
                coins=coins,
                codex_id=challenge.codex_reward_id,
                item_id=challenge.item_reward_id
            )
        else:
            msg = "Challenge already completed previously. No duplicate rewards given."
    
    # Record attempt
    attempt = models.ChallengeAttempt(
        player_id=req.player_id,
        challenge_id=req.challenge_id,
        answer=req.answer,
        correct=is_correct,
        score_earned=score,
        xp_earned=xp
    )
    db.add(attempt)
    db.commit()
    
    return schemas.ChallengeSubmitResponse(
        success=True,
        correct=is_correct,
        message=msg,
        xp_earned=xp,
        score_earned=score,
        coins_earned=coins if 'coins' in locals() else 0,
        explanation=explanation,
        correct_answer=challenge.correct_answer,
        new_unlocks=schemas.UnlocksResponse(**unlocks)
    )
