from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.Chapter])
def get_chapters(db: Session = Depends(get_db)):
    chapters = db.query(models.Chapter).filter(models.Chapter.is_active == True).all()
    return chapters

@router.get("/{chapter_id}", response_model=schemas.Chapter)
def get_chapter(chapter_id: int, db: Session = Depends(get_db)):
    chapter = db.query(models.Chapter).filter(models.Chapter.chapter_id == chapter_id, models.Chapter.is_active == True).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    return chapter

@router.get("/{chapter_id}/boss", response_model=schemas.Boss)
def get_chapter_boss(chapter_id: int, db: Session = Depends(get_db)):
    chapter = db.query(models.Chapter).filter(models.Chapter.chapter_id == chapter_id, models.Chapter.is_active == True).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    if not chapter.boss_id:
        raise HTTPException(status_code=404, detail="Boss not found for this chapter")
        
    boss = db.query(models.Boss).filter(models.Boss.boss_id == chapter.boss_id).first()
    if not boss:
        raise HTTPException(status_code=404, detail="Boss not found")
    
    return boss

@router.get("/{chapter_id}/codex", response_model=List[schemas.CodexEntry])
def get_chapter_codex(chapter_id: int, db: Session = Depends(get_db)):
    chapter = db.query(models.Chapter).filter(models.Chapter.chapter_id == chapter_id, models.Chapter.is_active == True).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
        
    codex_entries = db.query(models.CodexEntry).filter(models.CodexEntry.chapter_id == chapter_id).all()
    return codex_entries

