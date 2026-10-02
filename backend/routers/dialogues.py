from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db

router = APIRouter()

@router.get("/chapter/{chapter_id}", response_model=List[schemas.DialogueSceneWithLines])
def get_chapter_dialogues(chapter_id: int, db: Session = Depends(get_db)):
    scenes = db.query(models.DialogueScene).filter(models.DialogueScene.chapter_id == chapter_id).all()
    
    result = []
    for scene in scenes:
        lines = db.query(models.DialogueLine).filter(models.DialogueLine.scene_id == scene.scene_id).order_by(models.DialogueLine.sequence_order).all()
        # attach lines to scene representation
        scene_dict = schemas.DialogueScene.model_validate(scene).model_dump()
        lines_with_choices = []
        for line in lines:
            line_dict = schemas.DialogueLineBase.model_validate(line).model_dump()
            choices = db.query(models.DialogueChoice).filter(models.DialogueChoice.dialogue_id == line.dialogue_id).all()
            line_dict['choices'] = [schemas.DialogueChoice.model_validate(c) for c in choices]
            lines_with_choices.append(schemas.DialogueLine(**line_dict))
            
        scene_dict['lines'] = lines_with_choices
        result.append(schemas.DialogueSceneWithLines(**scene_dict))
        
    return result

@router.get("/scene/{scene_id}", response_model=schemas.DialogueSceneWithLines)
def get_scene_dialogue(scene_id: str, db: Session = Depends(get_db)):
    scene = db.query(models.DialogueScene).filter(models.DialogueScene.scene_id == scene_id).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
        
    lines = db.query(models.DialogueLine).filter(models.DialogueLine.scene_id == scene_id).order_by(models.DialogueLine.sequence_order).all()
    scene_dict = schemas.DialogueScene.model_validate(scene).model_dump()
    lines_with_choices = []
    for line in lines:
        line_dict = schemas.DialogueLineBase.model_validate(line).model_dump()
        choices = db.query(models.DialogueChoice).filter(models.DialogueChoice.dialogue_id == line.dialogue_id).all()
        line_dict['choices'] = [schemas.DialogueChoice.model_validate(c) for c in choices]
        lines_with_choices.append(schemas.DialogueLine(**line_dict))
        
    scene_dict['lines'] = lines_with_choices
    return schemas.DialogueSceneWithLines(**scene_dict)

@router.post("/{scene_id}/complete", response_model=dict)
def complete_dialogue_scene(scene_id: str, player_id: int, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.player_id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
        
    scene = db.query(models.DialogueScene).filter(models.DialogueScene.scene_id == scene_id).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")
        
    progress = db.query(models.PlayerDialogueProgress).filter(
        models.PlayerDialogueProgress.player_id == player_id,
        models.PlayerDialogueProgress.scene_id == scene_id
    ).first()
    
    if not progress:
        progress = models.PlayerDialogueProgress(player_id=player_id, scene_id=scene_id)
        db.add(progress)
        db.commit()
        
    return {"status": "success", "message": "Scene completed"}

@router.post("/trigger", response_model=schemas.DialogueSceneWithLines)
def trigger_dialogue(req: schemas.DialogueTriggerRequest, db: Session = Depends(get_db)):
    scene = db.query(models.DialogueScene).filter(
        models.DialogueScene.chapter_id == req.chapter_id,
        models.DialogueScene.trigger_event == req.event
    ).first()
    
    if not scene:
        raise HTTPException(status_code=404, detail="No dialogue scene for this trigger event")
        
    # Return scene
    lines = db.query(models.DialogueLine).filter(models.DialogueLine.scene_id == scene.scene_id).order_by(models.DialogueLine.sequence_order).all()
    scene_dict = schemas.DialogueScene.model_validate(scene).model_dump()
    lines_with_choices = []
    for line in lines:
        line_dict = schemas.DialogueLineBase.model_validate(line).model_dump()
        choices = db.query(models.DialogueChoice).filter(models.DialogueChoice.dialogue_id == line.dialogue_id).all()
        line_dict['choices'] = [schemas.DialogueChoice.model_validate(c) for c in choices]
        lines_with_choices.append(schemas.DialogueLine(**line_dict))
        
    scene_dict['lines'] = lines_with_choices
    return schemas.DialogueSceneWithLines(**scene_dict)

@router.post("/choice", response_model=schemas.DialogueChoice)
def submit_dialogue_choice(req: schemas.DialogueChoiceRequest, db: Session = Depends(get_db)):
    choice = db.query(models.DialogueChoice).filter(models.DialogueChoice.choice_id == req.choice_id).first()
    if not choice:
        raise HTTPException(status_code=404, detail="Choice not found")
    
    # Normally we might apply the effect (e.g. alignment_power) to the player's profile here
    # For now, just return the choice response
    return choice
