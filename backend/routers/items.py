from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.Item])
def get_items(db: Session = Depends(get_db)):
    items = db.query(models.Item).all()
    return items

@router.get("/{item_id}", response_model=schemas.Item)
def get_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(models.Item).filter(models.Item.item_id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
