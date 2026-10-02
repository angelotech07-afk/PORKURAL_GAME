from sqlalchemy.orm import Session
import models

def determine_next_action(db: Session, player_id: int):
    player = db.query(models.Player).filter(models.Player.player_id == player_id).first()
    if not player:
        return None
        
    chapter = db.query(models.Chapter).filter(models.Chapter.chapter_id == player.current_chapter).first()
    if not chapter:
        return {"next_action": "chapter_select", "chapter_id": player.current_chapter}

    # Check intro cinematic
    if chapter.intro_dialogue_scene:
        intro_done = db.query(models.PlayerDialogueProgress).filter(
            models.PlayerDialogueProgress.player_id == player_id,
            models.PlayerDialogueProgress.scene_id == chapter.intro_dialogue_scene
        ).first()
        if not intro_done:
            return {"next_action": "chapter_intro", "chapter_id": chapter.chapter_id, "scene_id": chapter.intro_dialogue_scene}

    # Check boss defeat
    if chapter.boss_id:
        boss_event = db.query(models.GameEvent).filter(
            models.GameEvent.player_id == player_id,
            models.GameEvent.chapter_id == chapter.chapter_id,
            models.GameEvent.event_type == "boss_defeated"
        ).first()
        if not boss_event:
            return {"next_action": "boss", "chapter_id": chapter.chapter_id}

    # Check victory cinematic
    if chapter.victory_dialogue_scene:
        vic_done = db.query(models.PlayerDialogueProgress).filter(
            models.PlayerDialogueProgress.player_id == player_id,
            models.PlayerDialogueProgress.scene_id == chapter.victory_dialogue_scene
        ).first()
        if not vic_done:
            return {"next_action": "victory_cinematic", "chapter_id": chapter.chapter_id, "scene_id": chapter.victory_dialogue_scene}

    # Check cultural challenge
    if chapter.required_challenge_id:
        chal_done = db.query(models.ChallengeAttempt).filter(
            models.ChallengeAttempt.player_id == player_id,
            models.ChallengeAttempt.challenge_id == chapter.required_challenge_id,
            models.ChallengeAttempt.correct == True
        ).first()
        if not chal_done:
            return {"next_action": "cultural_challenge", "chapter_id": chapter.chapter_id, "challenge_id": chapter.required_challenge_id}

    # Check chapter completion
    chap_done = db.query(models.ChapterProgress).filter(
        models.ChapterProgress.player_id == player_id,
        models.ChapterProgress.chapter_id == chapter.chapter_id,
        models.ChapterProgress.status == "completed"
    ).first()
    if not chap_done:
        return {"next_action": "chapter_complete", "chapter_id": chapter.chapter_id}
        
    # Default fallback
    return {"next_action": "chapter_select", "chapter_id": chapter.chapter_id}
