import math
from sqlalchemy.orm import Session
import models

def calculate_level(total_xp: int) -> int:
    """Calculate player level based on total XP using a square root curve."""
    return 1 + int(math.sqrt(total_xp / 100))

def grant_rewards(db: Session, player: models.Player, xp: int, score: int, coins: int = 0, codex_id: str = None, item_id: str = None):
    """
    Grants XP, score, and coins to the player.
    Calculates new level if necessary.
    Unlocks codex entry or item if provided and not already unlocked.
    Returns a dict with unlocked items for the response.
    """
    player.experience += xp
    player.total_score += score
    if coins > 0:
        player.coins += coins
    
    # Calculate level
    new_level = calculate_level(player.experience)
    if new_level > player.level:
        player.level = new_level
        
    unlocks = {"codex": [], "items": []}
    
    if codex_id:
        existing_codex = db.query(models.PlayerCodex).filter(
            models.PlayerCodex.player_id == player.player_id,
            models.PlayerCodex.codex_entry_id == codex_id
        ).first()
        if not existing_codex:
            new_codex = models.PlayerCodex(player_id=player.player_id, codex_entry_id=codex_id)
            db.add(new_codex)
            unlocks["codex"].append(codex_id)
            
    if item_id:
        existing_item = db.query(models.PlayerItem).filter(
            models.PlayerItem.player_id == player.player_id,
            models.PlayerItem.item_id == item_id
        ).first()
        if not existing_item:
            new_item = models.PlayerItem(player_id=player.player_id, item_id=item_id, quantity=1)
            db.add(new_item)
            unlocks["items"].append(item_id)
        else:
            existing_item.quantity += 1
            unlocks["items"].append(item_id)
            
    return unlocks
