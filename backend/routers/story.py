from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db

router = APIRouter()

@router.get("/chapter/{chapter_id}", response_model=List[schemas.HistoricalStoryEntry])
def get_chapter_story(chapter_id: int, db: Session = Depends(get_db)):
    story = db.query(models.HistoricalStoryEntry).filter(
        models.HistoricalStoryEntry.chapter_id == chapter_id
    ).order_by(models.HistoricalStoryEntry.sequence_order).all()
    
    if not story:
        raise HTTPException(status_code=404, detail="Story not found for this chapter")
        
    return story
