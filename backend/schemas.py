from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime

class ChapterProgressBase(BaseModel):
    chapter_id: int
    status: str
    score: int
    completed_at: Optional[datetime] = None

class ChapterProgress(ChapterProgressBase):
    id: int
    player_id: int
    model_config = ConfigDict(from_attributes=True)

class PlayerBase(BaseModel):
    username: str

class PlayerCreate(PlayerBase):
    pass

class Player(PlayerBase):
    player_id: int
    level: int
    experience: int
    total_score: int
    coins: int
    current_health: int
    max_health: int
    current_chapter: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class BossBase(BaseModel):
    name: str
    title: str
    level: int
    max_health: int
    difficulty: str
    description: str
    cultural_context: str
    reward_xp: int
    reward_score: int

class Boss(BossBase):
    boss_id: int
    chapter_id: int
    model_config = ConfigDict(from_attributes=True)

class EnemyBase(BaseModel):
    name: str
    type: str
    level: int
    max_health: int
    damage_rating: int
    reward_xp: int
    reward_coins: int

class Enemy(EnemyBase):
    enemy_id: int
    chapter_id: int
    model_config = ConfigDict(from_attributes=True)

class SkillBase(BaseModel):
    name: str
    description: str
    damage_multiplier: float
    stamina_cost: int
    unlock_level: int

class Skill(SkillBase):
    skill_id: str
    model_config = ConfigDict(from_attributes=True)

class PlayerSkillResponse(BaseModel):
    skill: Skill
    unlocked_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ChapterBase(BaseModel):
    title: str
    region: str
    historical_period: str
    description: str
    cultural_theme: str
    objective: str
    difficulty: str
    required_chapter: Optional[int] = None
    required_boss_id: Optional[int] = None
    required_scene_id: Optional[str] = None
    required_challenge_id: Optional[int] = None
    intro_dialogue_scene: Optional[str] = None
    victory_dialogue_scene: Optional[str] = None
    is_active: bool = True

class Chapter(ChapterBase):
    chapter_id: int
    boss_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class PlayerChaptersResponse(BaseModel):
    locked: List[Chapter]
    unlocked: List[Chapter]
    completed: List[Chapter]
    current: Optional[Chapter] = None

class CodexEntryBase(BaseModel):
    title: str
    category: str
    region: str
    historical_period: str
    short_description: str
    detailed_description: str
    cultural_significance: str
    chapter_id: Optional[int] = None
    image_reference: Optional[str] = None
    unlock_condition: str

class CodexEntry(CodexEntryBase):
    codex_id: str
    model_config = ConfigDict(from_attributes=True)

class ItemBase(BaseModel):
    name: str
    type: str
    region: str
    historical_period: str
    description: str
    cultural_significance: str
    chapter_id: Optional[int] = None
    unlock_condition: str

class Item(ItemBase):
    item_id: str
    model_config = ConfigDict(from_attributes=True)

class PlayerItemResponse(BaseModel):
    item: Item
    quantity: int
    acquired_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PlayerCodexResponse(BaseModel):
    codex_entry: CodexEntry
    unlocked_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DialogueChoiceBase(BaseModel):
    choice_id: str
    choice_text: str
    next_dialogue_id: Optional[str] = None
    effect: Optional[str] = None

class DialogueChoice(DialogueChoiceBase):
    model_config = ConfigDict(from_attributes=True)

class DialogueLineBase(BaseModel):
    dialogue_id: str
    scene_id: str
    chapter_id: Optional[int] = None
    sequence_order: int
    speaker_id: str
    speaker_name: str
    speaker_role: str
    dialogue_text: str
    emotion: Optional[str] = None
    animation_hint: Optional[str] = None
    background_reference: Optional[str] = None
    audio_reference: Optional[str] = None
    next_dialogue_id: Optional[str] = None
    is_cinematic: bool = False
    model_config = ConfigDict(from_attributes=True)

class DialogueLine(DialogueLineBase):
    choices: List[DialogueChoice] = []
    model_config = ConfigDict(from_attributes=True)

class DialogueSceneBase(BaseModel):
    scene_id: str
    chapter_id: Optional[int] = None
    trigger_event: str
    description: Optional[str] = None

class DialogueScene(DialogueSceneBase):
    model_config = ConfigDict(from_attributes=True)

class DialogueSceneWithLines(DialogueScene):
    lines: List[DialogueLine] = []
    model_config = ConfigDict(from_attributes=True)

class DialogueTriggerRequest(BaseModel):
    player_id: int
    chapter_id: int
    event: str

class DialogueChoiceRequest(BaseModel):
    player_id: int
    choice_id: str

class CulturalChallengeBase(BaseModel):
    title: str
    description: str
    challenge_type: str
    question_text: str
    options: str
    reward_xp: int
    reward_score: int
    reward_coins: int = 0
    codex_reward_id: Optional[str] = None
    item_reward_id: Optional[str] = None
    difficulty: str
    trigger_event: Optional[str] = None
    is_active: bool = True

class CulturalChallenge(CulturalChallengeBase):
    challenge_id: int
    chapter_id: int
    model_config = ConfigDict(from_attributes=True)

class ChallengeSubmitRequest(BaseModel):
    player_id: int = Field(..., ge=1)
    challenge_id: int = Field(..., ge=1)
    answer: str

class UnlocksResponse(BaseModel):
    codex: List[str]
    items: List[str]

class ChallengeSubmitResponse(BaseModel):
    success: bool
    correct: bool
    message: Optional[str] = None
    xp_earned: int
    score_earned: int
    coins_earned: int = 0
    explanation: Optional[str] = None
    correct_answer: Optional[str] = None
    new_unlocks: UnlocksResponse

class GameEventRequest(BaseModel):
    player_id: int = Field(..., ge=1)
    chapter_id: Optional[int] = Field(None, ge=1)
    event_type: str
    event_data: dict

class GameEventResponse(BaseModel):
    success: bool
    event: str
    message: Optional[str] = None
    xp_earned: int = 0
    score_earned: int = 0
    coins_earned: int = 0
    player: dict
    next_action: Optional[str] = None

class ChapterCompleteRequest(BaseModel):
    player_id: int = Field(..., ge=1)
    chapter_id: int = Field(..., ge=1)

class PlayerChaptersSummary(BaseModel):
    completed: List[int]
    unlocked: List[int]
    current: int

class PlayerStatistics(BaseModel):
    player_id: int
    username: str
    level: int
    experience: int
    total_score: int
    current_chapter: int
    chapters_completed: int
    bosses_defeated: int
    challenges_completed: int
    correct_challenge_answers: int
    incorrect_challenge_answers: int
    codex_unlocked: int
    items_unlocked: int
    dialogues_completed: int

class ComprehensiveProgressResponse(BaseModel):
    player: Player
    chapters: PlayerChaptersSummary
    items: List[Item]
    codex: List[CodexEntry]
    skills: List[Skill]
    dialogues: List[str] # List of scene_ids
    statistics: PlayerStatistics

class LeaderboardEntry(BaseModel):
    rank: int
    player_id: int
    username: str
    score: int
    level: int
    chapters_completed: int

class GameContinueResponse(BaseModel):
    next_action: str
    chapter_id: int
    scene_id: Optional[str] = None
    challenge_id: Optional[int] = None

class BootstrapDialogue(BaseModel):
    available: bool
    scene_id: Optional[str] = None
    scene_type: Optional[str] = None
    lines: List[DialogueLine] = []

class GameBootstrapResponse(BaseModel):
    player: Player
    current_chapter: Optional[Chapter] = None
    boss: Optional[Boss] = None
    continue_state: GameContinueResponse
    dialogue: BootstrapDialogue
    challenges: List[CulturalChallenge] = []
    unlocked_items: List[Item] = []
    unlocked_codex: List[CodexEntry] = []
    statistics: PlayerStatistics

class HistoricalStoryEntryBase(BaseModel):
    chapter_id: int
    sequence_order: int
    title: str
    content: str
    image_reference: Optional[str] = None

class HistoricalStoryEntry(HistoricalStoryEntryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

