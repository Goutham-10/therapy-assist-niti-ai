from fastapi import APIRouter
from backend.db import collection
from collections import Counter

router = APIRouter()

@router.get("/stats/{user_id}")
def user_stats(user_id: str):
    entries = list(collection.find({"user_id": user_id}, {"_id": 0}))
    if not entries:
        return {"message": "No entries found"}

    all_emotions = [emotion for e in entries for emotion in e.get("emotions", [])]
    all_topics = [topic for e in entries for topic in e.get("topics", [])]
    word_counts = [len(e.get("raw_input", "").split()) for e in entries if e.get("raw_input")]
    top_emotions = [e for e, _ in Counter(all_emotions).most_common(3)]
    top_topics = [t for t, _ in Counter(all_topics).most_common(3)]
    dates = sorted([e.get("date", "") for e in entries if "date" in e])

    return {
        "total_entries": len(entries),
        "avg_words_per_entry": sum(word_counts) // len(word_counts) if word_counts else 0,
        "top_emotions": top_emotions,
        "most_common_topics": top_topics,
        "first_entry_date": dates[0] if dates else "N/A",
        "last_entry_date": dates[-1] if dates else "N/A"
    }
