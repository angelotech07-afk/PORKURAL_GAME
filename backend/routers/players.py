from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

import models
import schemas
from database import get_db
from services.progression_service import determine_next_action

router = APIRouter()

@router.post("/guest", response_model=schemas.Player, status_code=status.HTTP_201_CREATED)
def create_guest_player(db: Session = Depends(get_db)):
    # Generate unique guest username
    username = f"Guest_{uuid.uuid4().hex[:8]}"
    db_player = models.Player(
        username=username,
        level=1,
        experience=0,
        total_score=0,
        coins=0,
        current_health=100,
        max_health=100,
        current_chapter=1
    )
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player

@router.get("/{player_id}", response_model=schemas.Player)
def get_player(player_id: int, db: Session = Depends(get_db)):
    db_player = db.query(models.Player).filter(models.Player.player_id == player_id).first()
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    return db_player

@router.get("/{player_id}/chapters", response_model=schemas.PlayerChaptersResponse)
def get_player_chapters(player_id: int, db: Session = Depends(get_db)):
    db_player = db.query(models.Player).filter(models.Player.player_id == player_id).first()
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    
    all_chapters = db.query(models.Chapter).filter(models.Chapter.is_active == True).all()
    progress_records = db.query(models.ChapterProgress).filter(models.ChapterProgress.player_id == player_id).all()
    
    progress_map = {p.chapter_id: p for p in progress_records}
    
    locked = []
    unlocked = []
    completed = []
    current = None
    
    for chapter in all_chapters:
        if chapter.chapter_id == db_player.current_chapter:
            current = chapter
            continue
            
        prog = progress_map.get(chapter.chapter_id)
        status = prog.status if prog else "locked"
        
        if status == "locked":
            # Check requirements
            can_unlock = True
            
            if chapter.required_chapter:
                req_prog = progress_map.get(chapter.required_chapter)
                if not req_prog or req_prog.status != "completed":
                    can_unlock = False
                    
            if chapter.required_boss_id:
                has_boss = db.query(models.GameEvent).filter(
                    models.GameEvent.player_id == player_id,
                    models.GameEvent.event_type == "boss_defeated",
                    models.GameEvent.event_data.like(f'%\"boss_id\": {chapter.required_boss_id}%')
                ).first()
                if not has_boss:
                    can_unlock = False
            if chapter.required_scene_id:
                has_scene = db.query(models.PlayerDialogueProgress).filter(
                    models.PlayerDialogueProgress.player_id == player_id,
                    models.PlayerDialogueProgress.scene_id == chapter.required_scene_id
                ).first()
                if not has_scene:
                    can_unlock = False
                    
            if chapter.required_challenge_id:
                has_chal = db.query(models.ChallengeAttempt).filter(
                    models.ChallengeAttempt.player_id == player_id,
                    models.ChallengeAttempt.challenge_id == chapter.required_challenge_id,
                    models.ChallengeAttempt.correct == True
                ).first()
                if not has_chal:
                    can_unlock = False
                    
            if can_unlock and chapter.chapter_id <= db_player.level: # Example fallback
                status = "unlocked"
                
        if not prog and chapter.chapter_id == 1:
            status = "unlocked"
            if db_player.current_chapter > 1:
                status = "completed"
                
        if status == "completed":
            completed.append(chapter)
        elif status == "unlocked":
            unlocked.append(chapter)
        else:
            locked.append(chapter)
            
    return schemas.PlayerChaptersResponse(
        locked=locked,
        unlocked=unlocked,
        completed=completed,
        current=current
    )

@router.get("/{player_id}/codex", response_model=List[schemas.PlayerCodexResponse])
def get_player_codex(player_id: int, db: Session = Depends(get_db)):
    db_player = db.query(models.Player).filter(models.Player.player_id == player_id).first()
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")
        
    unlocked_codex = db.query(models.PlayerCodex).filter(models.PlayerCodex.player_id == player_id).all()
    
    result = []
    for pc in unlocked_codex:
        entry = db.query(models.CodexEntry).filter(models.CodexEntry.codex_id == pc.codex_entry_id).first()
        if entry:
            result.append(schemas.PlayerCodexResponse(
                codex_entry=entry,
                unlocked_at=pc.unlocked_at
            ))
            
    return result

@router.get("/{player_id}/items", response_model=List[schemas.PlayerItemResponse])
def get_player_items(player_id: int, db: Session = Depends(get_db)):
    db_player = db.query(models.Player).filter(models.Player.player_id == player_id).first()
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")
        
    player_items = db.query(models.PlayerItem).filter(models.PlayerItem.player_id == player_id).all()
    
    result = []
    for pi in player_items:
        item = db.query(models.Item).filter(models.Item.item_id == pi.item_id).first()
        if item:
            result.append(schemas.PlayerItemResponse(
                item=item,
                quantity=pi.quantity,
                acquired_at=pi.acquired_at
            ))
            
    return result

@router.get("/{player_id}/dialogues")
def get_player_dialogues(player_id: int, db: Session = Depends(get_db)):
    db_player = db.query(models.Player).filter(models.Player.player_id == player_id).first()
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")
        
    progress = db.query(models.PlayerDialogueProgress).filter(models.PlayerDialogueProgress.player_id == player_id).all()
    
    result = []
    for p in progress:
        result.append({
            "scene_id": p.scene_id,
            "completed_at": p.completed_at
        })
        
    return result

@router.get("/{player_id}/statistics", response_model=schemas.PlayerStatistics)
def get_player_statistics(player_id: int, db: Session = Depends(get_db)):
    db_player = db.query(models.Player).filter(models.Player.player_id == player_id).first()
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")
        
    chap_count = db.query(models.ChapterProgress).filter(
        models.ChapterProgress.player_id == player_id,
        models.ChapterProgress.status == "completed"
    ).count()
    
    boss_count = db.query(models.GameEvent).filter(
        models.GameEvent.player_id == player_id,
        models.GameEvent.event_type == "boss_defeated"
    ).count()
    
    # Challenge attempts
    chal_correct = db.query(models.ChallengeAttempt).filter(
        models.ChallengeAttempt.player_id == player_id,
        models.ChallengeAttempt.correct == True
    ).count()
    
    chal_incorrect = db.query(models.ChallengeAttempt).filter(
        models.ChallengeAttempt.player_id == player_id,
        models.ChallengeAttempt.correct == False
    ).count()
    
    diag_count = db.query(models.PlayerDialogueProgress).filter(
        models.PlayerDialogueProgress.player_id == player_id
    ).count()
    
    codex_count = db.query(models.PlayerCodex).filter(
        models.PlayerCodex.player_id == player_id
    ).count()
    
    # Sum of item quantities or unique items? The prompt asked for "total items unlocked"
    items_count = db.query(models.PlayerItem).filter(
        models.PlayerItem.player_id == player_id
    ).count()
    
    return schemas.PlayerStatistics(
        player_id=db_player.player_id,
        username=db_player.username,
        level=db_player.level,
        experience=db_player.experience,
        total_score=db_player.total_score,
        current_chapter=db_player.current_chapter,
        chapters_completed=chap_count,
        bosses_defeated=boss_count,
        challenges_completed=chal_correct,  # Total unique challenges successfully completed (if only 1 success allowed)
        correct_challenge_answers=chal_correct,
        incorrect_challenge_answers=chal_incorrect,
        codex_unlocked=codex_count,
        items_unlocked=items_count,
        dialogues_completed=diag_count
    )

@router.get("/{player_id}/progress", response_model=schemas.ComprehensiveProgressResponse)
def get_comprehensive_progress(player_id: int, db: Session = Depends(get_db)):
    db_player = db.query(models.Player).filter(models.Player.player_id == player_id).first()
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")
        
    # Get chapters
    chapters_data = get_player_chapters(player_id, db)
    completed_ids = [c.chapter_id for c in chapters_data.completed]
    unlocked_ids = [c.chapter_id for c in chapters_data.unlocked]
    
    # Get items
    items_data = get_player_items(player_id, db)
    items = [i.item for i in items_data]
    
    # Get codex
    codex_data = get_player_codex(player_id, db)
    codex = [c.codex_entry for c in codex_data]
    
    # Get dialogues
    diag_data = get_player_dialogues(player_id, db)
    diags = [d["scene_id"] for d in diag_data]
    
    # Get stats
    stats = get_player_statistics(player_id, db)
    
    # Get skills
    player_skills = db.query(models.PlayerSkill).filter(models.PlayerSkill.player_id == player_id).all()
    skills = []
    for ps in player_skills:
        skill = db.query(models.Skill).filter(models.Skill.skill_id == ps.skill_id).first()
        if skill:
            skills.append(skill)
            
    return schemas.ComprehensiveProgressResponse(
        player=schemas.Player.model_validate(db_player),
        chapters=schemas.PlayerChaptersSummary(
            completed=completed_ids,
            unlocked=unlocked_ids,
            current=db_player.current_chapter
        ),
        items=items,
        codex=codex,
        skills=skills,
        dialogues=diags,
        statistics=stats
    )

@router.get("/{player_id}/continue", response_model=schemas.GameContinueResponse)
def get_continue_action(player_id: int, db: Session = Depends(get_db)):
    db_player = db.query(models.Player).filter(models.Player.player_id == player_id).first()
    if db_player is None:
        raise HTTPException(status_code=404, detail="Player not found")
        
    action = determine_next_action(db, player_id)
    if not action:
        raise HTTPException(status_code=404, detail="Could not determine next action")
        
    return schemas.GameContinueResponse(**action)

@router.get("/{player_id}/save", response_model=schemas.ComprehensiveProgressResponse, summary="Get full save state")
def get_player_save(player_id: int, db: Session = Depends(get_db)):
    """Returns the complete game save state including player data, progress, unlocked items, and codex entries."""
    return get_comprehensive_progress(player_id, db)
