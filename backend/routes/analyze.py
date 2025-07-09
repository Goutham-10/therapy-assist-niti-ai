from fastapi import APIRouter
from backend.analyzer import extract_insights
from backend.db import store_entry
from backend.models import JournalEntryRequest, JournalEntry
from datetime import datetime

router = APIRouter()

@router.post("/analyze", response_model=JournalEntry)
def analyze_entry(entry: JournalEntryRequest):
    if len(entry.raw_input.strip().split()) < 5:
        return {
            "summary": "Entry too short. Can you describe your thoughts in a bit more detail?",
            "emotions": [],
            "topics": [],
            "cognitive_patterns": [],
            "suggested_questions": [],
            "tip": "Try adding a few more sentences to express your thoughts.",
            "raw_input": entry.raw_input,
            "user_id": entry.user_id,
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    insights = extract_insights(entry.raw_input)
    insights["raw_input"] = entry.raw_input
    insights["user_id"] = entry.user_id
    insights["source"] = entry.source
    store_entry(insights)

    return insights
