from typing import List, Optional
from pydantic import BaseModel

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
    tip: Optional[str]
    date: str
    source: Optional[str] = "text"
    therapist_feedback: Optional[str] = ""  

class FeedbackRequest(BaseModel):
    entry_id: str
    feedback: str
