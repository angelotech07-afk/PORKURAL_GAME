from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import json

import models
import schemas
from database import get_db
from services.reward_service import grant_rewards
from services.progression_service import determine_next_action

router = APIRouter()

@router.post("/event", response_model=schemas.GameEventResponse)
def log_game_event(req: schemas.GameEventRequest, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.player_id == req.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
        
    chapter = db.query(models.Chapter).filter(models.Chapter.chapter_id == req.chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    if req.chapter_id and req.chapter_id > player.current_chapter:
        raise HTTPException(status_code=403, detail="Chapter is locked")
        
    # Prevent duplicate events of certain types to stop reward farming
    unique_events = ["boss_defeated", "chapter_started", "chapter_completed", "cultural_challenge_completed"]
    if req.event_type in unique_events:
        existing = db.query(models.GameEvent).filter(
            models.GameEvent.player_id == req.player_id,
            models.GameEvent.chapter_id == req.chapter_id,
            models.GameEvent.event_type == req.event_type
        ).first()
        if existing:
            # Already logged, just return state without new rewards
            next_act = determine_next_action(db, req.player_id)
            return schemas.GameEventResponse(
                success=True, event=req.event_type,
                message=f"Event {req.event_type} already processed. No duplicate rewards given.",
                xp_earned=0, score_earned=0,
                player=schemas.Player.model_validate(player).model_dump(),
                next_action=next_act["next_action"] if next_act else None
            )
            
    # Process event
    xp_earned = 0
    score_earned = 0
    coins_earned = 0
    
    if req.event_type == "boss_defeated":
        boss_id = req.event_data.get("boss_id")
        boss = db.query(models.Boss).filter(models.Boss.boss_id == boss_id, models.Boss.chapter_id == req.chapter_id).first()
        if not boss:
            raise HTTPException(status_code=400, detail="Invalid boss for chapter")
            
        xp_earned = boss.reward_xp
        score_earned = boss.reward_score
        
        # Grant rewards
        grant_rewards(db, player, xp=xp_earned, score=score_earned, coins=coins_earned)

    elif req.event_type == "enemy_defeated":
        enemy_id = req.event_data.get("enemy_id")
        if enemy_id:
            enemy = db.query(models.Enemy).filter(models.Enemy.enemy_id == enemy_id).first()
            if enemy:
                xp_earned = enemy.reward_xp
                coins_earned = getattr(enemy, 'reward_coins', 0)
                grant_rewards(db, player, xp=xp_earned, score=0, coins=coins_earned)

    elif req.event_type == "dialogue_completed":
        scene_id = req.event_data.get("scene_id")
        if scene_id:
            # Check if progress exists
            prog = db.query(models.PlayerDialogueProgress).filter(
                models.PlayerDialogueProgress.player_id == req.player_id,
                models.PlayerDialogueProgress.scene_id == scene_id
            ).first()
            if not prog:
                prog = models.PlayerDialogueProgress(player_id=req.player_id, scene_id=scene_id)
                db.add(prog)
                db.commit() # commit early to ensure progression service sees it

    # Store event
    event = models.GameEvent(
        player_id=req.player_id,
        chapter_id=req.chapter_id,
        event_type=req.event_type,
        event_data=json.dumps(req.event_data)
    )
    db.add(event)
    db.commit()
    
    next_act = determine_next_action(db, req.player_id)
    
    return schemas.GameEventResponse(
        success=True, event=req.event_type,
        xp_earned=xp_earned, score_earned=score_earned, coins_earned=coins_earned,
        player=schemas.Player.model_validate(player).model_dump(),
        next_action=next_act["next_action"] if next_act else None
    )

@router.post("/complete-chapter")
def complete_chapter(req: schemas.ChapterCompleteRequest, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.player_id == req.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
        
    chapter = db.query(models.Chapter).filter(models.Chapter.chapter_id == req.chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    if req.chapter_id > player.current_chapter:
        raise HTTPException(status_code=403, detail="Chapter is locked")
        
    # Verify conditions
    if chapter.boss_id:
        boss_event = db.query(models.GameEvent).filter(
            models.GameEvent.player_id == req.player_id,
            models.GameEvent.chapter_id == req.chapter_id,
            models.GameEvent.event_type == "boss_defeated"
        ).first()
        if not boss_event:
            raise HTTPException(status_code=400, detail="Boss not defeated")
            
    if chapter.required_challenge_id:
        chal_event = db.query(models.ChallengeAttempt).filter(
            models.ChallengeAttempt.player_id == req.player_id,
            models.ChallengeAttempt.challenge_id == chapter.required_challenge_id,
            models.ChallengeAttempt.correct == True
        ).first()
        if not chal_event:
            raise HTTPException(status_code=400, detail="Challenge not completed")
            
    # Mark completed
    prog = db.query(models.ChapterProgress).filter(
        models.ChapterProgress.player_id == req.player_id,
        models.ChapterProgress.chapter_id == req.chapter_id
    ).first()
    
    if not prog:
        prog = models.ChapterProgress(player_id=req.player_id, chapter_id=req.chapter_id)
        db.add(prog)
        
    xp_earned = 0
    score_earned = 0
    coins_earned = 0
    
    if prog.status == "completed":
        return {"success": True, "message": "Already completed", "xp_earned": 0, "score_earned": 0, "coins_earned": 0}
        
    prog.status = "completed"
    prog.completed_at = datetime.utcnow()
    
    # Award some fixed chapter completion XP
    xp_earned = 1000
    score_earned = 2000
    coins_earned = 100 if req.chapter_id == 1 else 0
    grant_rewards(db, player, xp=xp_earned, score=score_earned, coins=coins_earned)
    
    # Unlock next chapter if it exists
    next_chapter = db.query(models.Chapter).filter(models.Chapter.required_chapter == req.chapter_id).first()
    if next_chapter:
        next_prog = models.ChapterProgress(player_id=req.player_id, chapter_id=next_chapter.chapter_id, status="unlocked")
        db.add(next_prog)
        if player.current_chapter == req.chapter_id:
            player.current_chapter = next_chapter.chapter_id
            
    # Log event
    event = models.GameEvent(
        player_id=req.player_id,
        chapter_id=req.chapter_id,
        event_type="chapter_completed",
        event_data=json.dumps({})
    )
    db.add(event)
    
    db.commit()
    
    return {
        "success": True, 
        "message": "Chapter completed",
        "xp_earned": xp_earned,
        "score_earned": score_earned,
        "coins_earned": coins_earned
    }

@router.get("/bootstrap/{player_id}", response_model=schemas.GameBootstrapResponse)
def bootstrap_game_session(player_id: int, db: Session = Depends(get_db)):
    from routers.players import get_player_items, get_player_codex, get_player_statistics
    
    player = db.query(models.Player).filter(models.Player.player_id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
        
    chapter = db.query(models.Chapter).filter(models.Chapter.chapter_id == player.current_chapter).first()
    boss = None
    if chapter and chapter.boss_id:
        boss = db.query(models.Boss).filter(models.Boss.boss_id == chapter.boss_id).first()
        
    continue_state = determine_next_action(db, player_id)
    if not continue_state:
        continue_state = {"next_action": "chapter_select", "chapter_id": player.current_chapter}
        
    # Dialogue handling
    dialogue_resp = {"available": False, "scene_id": None, "scene_type": None, "lines": []}
    if continue_state["next_action"] in ["chapter_intro", "victory_cinematic"]:
        scene_id = continue_state.get("scene_id")
        if scene_id:
            scene = db.query(models.DialogueScene).filter(models.DialogueScene.scene_id == scene_id).first()
            if scene:
                lines = db.query(models.DialogueLine).filter(models.DialogueLine.scene_id == scene_id).order_by(models.DialogueLine.sequence_order).all()
                lines_with_choices = []
                for line in lines:
                    line_dict = schemas.DialogueLineBase.model_validate(line).model_dump()
                    choices = db.query(models.DialogueChoice).filter(models.DialogueChoice.dialogue_id == line.dialogue_id).all()
                    line_dict['choices'] = [schemas.DialogueChoice.model_validate(c) for c in choices]
                    lines_with_choices.append(schemas.DialogueLine(**line_dict))
                    
                dialogue_resp = {
                    "available": True,
                    "scene_id": scene_id,
                    "scene_type": continue_state["next_action"],
                    "lines": lines_with_choices
                }
                
    # Challenges handling
    challenges_resp = []
    if continue_state["next_action"] == "cultural_challenge":
        chal_id = continue_state.get("challenge_id")
        if chal_id:
            chal = db.query(models.CulturalChallenge).filter(models.CulturalChallenge.challenge_id == chal_id).first()
            if chal:
                challenges_resp.append(chal)
                
    items_data = get_player_items(player_id, db)
    items_resp = [i.item for i in items_data]
    
    codex_data = get_player_codex(player_id, db)
    codex_resp = [c.codex_entry for c in codex_data]
    
    stats = get_player_statistics(player_id, db)
    
    return schemas.GameBootstrapResponse(
        player=schemas.Player.model_validate(player),
        current_chapter=schemas.Chapter.model_validate(chapter) if chapter else None,
        boss=schemas.Boss.model_validate(boss) if boss else None,
        continue_state=schemas.GameContinueResponse(**continue_state),
        dialogue=schemas.BootstrapDialogue(**dialogue_resp),
        challenges=challenges_resp,
        unlocked_items=items_resp,
        unlocked_codex=codex_resp,
        statistics=stats
    )
