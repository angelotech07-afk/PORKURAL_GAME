from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.CodexEntry])
def get_codex_entries(db: Session = Depends(get_db)):
    entries = db.query(models.CodexEntry).all()
    return entries

@router.get("/{codex_id}", response_model=schemas.CodexEntry)
def get_codex_entry(codex_id: str, db: Session = Depends(get_db)):
    entry = db.query(models.CodexEntry).filter(models.CodexEntry.codex_id == codex_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Codex entry not found")
    return entry
