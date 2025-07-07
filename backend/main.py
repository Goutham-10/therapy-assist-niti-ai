# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.models import JournalEntryRequest, JournalEntry
from backend.analyzer import extract_insights
from backend.db import (
    store_entry,
    get_recent_entries,
    get_all_user_ids,
    get_entries_by_user,
    collection,
)

import datetime
import os
import json
from collections import Counter

# --- 🔒 Risk Phrase Detection ---
RISK_KEYWORDS = [
    "suicide", "kill myself", "give up", "worthless", "hopeless",
    "nothing matters", "end it all", "self-harm", "hurting myself", "can't go on"
]

def detect_risk(text: str) -> bool:
    lowered = text.lower()
    return any(kw in lowered for kw in RISK_KEYWORDS)

# --- 🚀 App Initialization ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="frontend"), name="static")

# --- 🧾 Frontend Routes ---
@app.get("/")
def serve_client_page():
    return FileResponse(os.path.join("frontend", "index.html"))

@app.get("/therapist")
def serve_therapist_page():
    return FileResponse("frontend/therapist.html")

# --- 📬 Journal Entry Submission ---
@app.post("/analyze", response_model=JournalEntry)
def analyze_entry(entry: JournalEntryRequest):
    if len(entry.raw_input.strip().split()) < 5:
        return {"message": "Entry too short. Can you describe your thoughts in a bit more detail?"}

    insights = extract_insights(entry.raw_input)
    insights.update({
        "user_id": entry.user_id,
        "raw_input": entry.raw_input,
        "source": entry.source,
        "flagged": detect_risk(entry.raw_input),
    })

    store_entry(insights)
    return insights

# --- 📅 Daily Prompt ---
@app.get("/prompt")
def get_prompt():
    try:
        path = os.path.join(os.path.dirname(__file__), "../prompts/daily_prompts.json")
        with open(path) as f:
            prompts = json.load(f)
        today_index = datetime.date.today().toordinal() % len(prompts)
        return {"prompt": prompts[today_index]}
    except Exception as e:
        return {"error": str(e)}

# --- 🧪 Sample Entry ---
@app.get("/sample")
def insert_sample():
    sample = {
        "user_id": "demo_user",
        "raw_input": "I felt unsupported this week during group meetings...",
        "summary": "Client felt emotionally isolated at work.",
        "emotions": ["frustration", "loneliness"],
        "topics": ["workplace", "self-worth"],
        "date": "2025-07-07",
        "source": "text",
        "flagged": False
    }
    store_entry(sample)
    return {"status": "ok"}

# --- 📜 Journal Logs ---
@app.get("/log")
def fetch_all_recent():
    entries = get_recent_entries(limit=10)
    return JSONResponse(content=entries)

@app.get("/log/{user_id}")
def fetch_by_user(user_id: str):
    return get_entries_by_user(user_id)

@app.get("/clients")
def fetch_clients():
    return {"clients": get_all_user_ids()}

# --- 📈 Stats ---
@app.get("/stats/{user_id}")
def user_stats(user_id: str):
    entries = get_entries_by_user(user_id)
    if not entries:
        return {"message": "No entries found"}

    all_emotions = [e for entry in entries for e in entry.get("emotions", [])]
    all_topics = [t for entry in entries for t in entry.get("topics", [])]
    word_counts = [len(entry.get("raw_input", "").split()) for entry in entries]
    dates = sorted([entry.get("date", "") for entry in entries])

    return {
        "total_entries": len(entries),
        "avg_words_per_entry": sum(word_counts) // len(word_counts) if word_counts else 0,
        "top_emotions": [e for e, _ in Counter(all_emotions).most_common(3)],
        "most_common_topics": [t for t, _ in Counter(all_topics).most_common(3)],
        "first_entry_date": dates[0] if dates else "N/A",
        "last_entry_date": dates[-1] if dates else "N/A",
    }
