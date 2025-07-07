# backend/models.py

from pydantic import BaseModel
from typing import List, Optional

class JournalEntryRequest(BaseModel):
    user_id: str
    raw_input: str
    source: Optional[str] = "text"

class JournalEntry(BaseModel):
    user_id: str
    raw_input: str
    summary: str
    emotions: List[str]
    topics: List[str]
    date: str
    source: Optional[str] = "text"
