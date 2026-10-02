from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Player(Base):
    __tablename__ = "players"
    
    player_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    level = Column(Integer, default=1)
    experience = Column(Integer, default=0)
    total_score = Column(Integer, default=0)
    coins = Column(Integer, default=0)
    current_health = Column(Integer, default=100)
    max_health = Column(Integer, default=100)
    current_chapter = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    progress = relationship("ChapterProgress", back_populates="player", cascade="all, delete-orphan")
    items = relationship("PlayerItem", back_populates="player", cascade="all, delete-orphan")
    codex = relationship("PlayerCodex", back_populates="player", cascade="all, delete-orphan")
    skills = relationship("PlayerSkill", back_populates="player", cascade="all, delete-orphan")

class ChapterProgress(Base):
    __tablename__ = "chapter_progress"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.player_id"))
    chapter_id = Column(Integer, ForeignKey("chapters.chapter_id"))
    status = Column(String, default="locked") # locked, unlocked, completed
    score = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)

    player = relationship("Player", back_populates="progress")
    chapter = relationship("Chapter")

class PlayerItem(Base):
    __tablename__ = "player_items"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.player_id"))
    item_id = Column(String)
    quantity = Column(Integer, default=1)
    acquired_at = Column(DateTime, default=datetime.utcnow)

    player = relationship("Player", back_populates="items")

class PlayerCodex(Base):
    __tablename__ = "player_codex"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.player_id"))
    codex_entry_id = Column(String)
    unlocked_at = Column(DateTime, default=datetime.utcnow)

    player = relationship("Player", back_populates="codex")

class Chapter(Base):
    __tablename__ = "chapters"

    chapter_id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    region = Column(String)
    historical_period = Column(String)
    description = Column(String)
    cultural_theme = Column(String)
    objective = Column(String)
    difficulty = Column(String)
    required_chapter = Column(Integer, ForeignKey("chapters.chapter_id"), nullable=True)
    required_boss_id = Column(Integer, ForeignKey("bosses.boss_id"), nullable=True)
    required_scene_id = Column(String, ForeignKey("dialogue_scenes.scene_id"), nullable=True)
    required_challenge_id = Column(Integer, ForeignKey("cultural_challenges.challenge_id"), nullable=True)
    boss_id = Column(Integer, nullable=True)
    intro_dialogue_scene = Column(String, nullable=True)
    victory_dialogue_scene = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class Boss(Base):
    __tablename__ = "bosses"

    boss_id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.chapter_id"))
    name = Column(String)
    title = Column(String)
    level = Column(Integer)
    max_health = Column(Integer)
    difficulty = Column(String)
    description = Column(String)
    cultural_context = Column(String)
    reward_xp = Column(Integer)
    reward_score = Column(Integer)

class Enemy(Base):
    __tablename__ = "enemies"

    enemy_id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.chapter_id"))
    name = Column(String)
    type = Column(String) # e.g., invader, beast, rogue
    level = Column(Integer, default=1)
    max_health = Column(Integer, default=50)
    damage_rating = Column(Integer, default=10)
    reward_xp = Column(Integer, default=10)
    reward_coins = Column(Integer, default=5)

class Skill(Base):
    __tablename__ = "skills"

    skill_id = Column(String, primary_key=True, index=True)
    name = Column(String)
    description = Column(String)
    damage_multiplier = Column(Float, default=1.0)
    stamina_cost = Column(Integer, default=10)
    unlock_level = Column(Integer, default=1)

class PlayerSkill(Base):
    __tablename__ = "player_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.player_id"))
    skill_id = Column(String, ForeignKey("skills.skill_id"))
    unlocked_at = Column(DateTime, default=datetime.utcnow)

    player = relationship("Player", back_populates="skills")

class CodexEntry(Base):
    __tablename__ = "codex_entries"

    codex_id = Column(String, primary_key=True, index=True)
    title = Column(String)
    category = Column(String)
    region = Column(String)
    historical_period = Column(String)
    short_description = Column(String)
    detailed_description = Column(String)
    cultural_significance = Column(String)
    chapter_id = Column(Integer, ForeignKey("chapters.chapter_id"), nullable=True)
    image_reference = Column(String, nullable=True)
    unlock_condition = Column(String)

class Item(Base):
    __tablename__ = "items"

    item_id = Column(String, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)
    region = Column(String)
    historical_period = Column(String)
    description = Column(String)
    cultural_significance = Column(String)
    chapter_id = Column(Integer, ForeignKey("chapters.chapter_id"), nullable=True)
    unlock_condition = Column(String)

class DialogueScene(Base):
    __tablename__ = "dialogue_scenes"

    scene_id = Column(String, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.chapter_id"), nullable=True)
    trigger_event = Column(String) # e.g., chapter_start, boss_encounter, boss_defeated, chapter_complete
    description = Column(String, nullable=True)

class DialogueLine(Base):
    __tablename__ = "dialogue_lines"

    dialogue_id = Column(String, primary_key=True, index=True)
    scene_id = Column(String, ForeignKey("dialogue_scenes.scene_id"))
    chapter_id = Column(Integer, ForeignKey("chapters.chapter_id"), nullable=True)
    sequence_order = Column(Integer)
    speaker_id = Column(String)
    speaker_name = Column(String)
    speaker_role = Column(String)
    dialogue_text = Column(String)
    emotion = Column(String, nullable=True)
    animation_hint = Column(String, nullable=True)
    background_reference = Column(String, nullable=True)
    audio_reference = Column(String, nullable=True)
    next_dialogue_id = Column(String, ForeignKey("dialogue_lines.dialogue_id"), nullable=True)
    is_cinematic = Column(Boolean, default=False)

    choices = relationship("DialogueChoice", back_populates="dialogue_line", foreign_keys="[DialogueChoice.dialogue_id]")

class DialogueChoice(Base):
    __tablename__ = "dialogue_choices"

    choice_id = Column(String, primary_key=True, index=True)
    dialogue_id = Column(String, ForeignKey("dialogue_lines.dialogue_id"))
    choice_text = Column(String)
    next_dialogue_id = Column(String, ForeignKey("dialogue_lines.dialogue_id"), nullable=True)
    effect = Column(String, nullable=True)

    dialogue_line = relationship("DialogueLine", back_populates="choices", foreign_keys=[dialogue_id])

class PlayerDialogueProgress(Base):
    __tablename__ = "player_dialogue_progress"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.player_id"))
    scene_id = Column(String, ForeignKey("dialogue_scenes.scene_id"))
    completed_at = Column(DateTime, default=datetime.utcnow)

class CulturalChallenge(Base):
    __tablename__ = "cultural_challenges"

    challenge_id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.chapter_id"))
    title = Column(String)
    description = Column(String)
    challenge_type = Column(String) # e.g., knowledge_question, weapon_identification
    question_text = Column(String)
    options = Column(String) # JSON string of options
    correct_answer = Column(String)
    explanation = Column(String)
    reward_xp = Column(Integer, default=0)
    reward_score = Column(Integer, default=0)
    reward_coins = Column(Integer, default=0)
    codex_reward_id = Column(String, nullable=True)
    item_reward_id = Column(String, nullable=True)
    difficulty = Column(String, default="normal")
    trigger_event = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class ChallengeAttempt(Base):
    __tablename__ = "challenge_attempts"

    attempt_id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.player_id"))
    challenge_id = Column(Integer, ForeignKey("cultural_challenges.challenge_id"))
    answer = Column(String)
    correct = Column(Boolean)
    score_earned = Column(Integer, default=0)
    xp_earned = Column(Integer, default=0)
    attempted_at = Column(DateTime, default=datetime.utcnow)

class GameEvent(Base):
    __tablename__ = "game_events"

    event_id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.player_id"))
    chapter_id = Column(Integer, ForeignKey("chapters.chapter_id"), nullable=True)
    event_type = Column(String) # e.g. chapter_started, boss_defeated
    event_data = Column(String) # JSON string
    timestamp = Column(DateTime, default=datetime.utcnow)

class HistoricalStoryEntry(Base):
    __tablename__ = "historical_story_entries"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.chapter_id"))
    sequence_order = Column(Integer)
    title = Column(String)
    content = Column(String)
    image_reference = Column(String, nullable=True)
