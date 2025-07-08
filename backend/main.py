
# backend/main.py

from fastapi import FastAPI, Body, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse 
from fastapi.middleware.cors import CORSMiddleware
from backend.analyzer import extract_insights
from backend.db import store_entry, get_recent_entries, get_all_user_ids, collection
from backend.models import JournalEntryRequest, FeedbackRequest, JournalEntry
import random, os, datetime, json
from backend.utils import load_daily_prompt
from bson.objectid import ObjectId

from dotenv import load_dotenv
load_dotenv()

THERAPIST_SECRET_KEY = os.environ["THERAPIST_SECRET_KEY"] 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
def serve_frontend():
    return FileResponse(os.path.join("frontend", "index.html"))

@app.get("/therapist", response_class=HTMLResponse)
async def get_therapist_page():
    with open("frontend/therapist.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read(), status_code=200)

@app.post("/analyze", response_model=JournalEntry)
def analyze_entry(entry: JournalEntryRequest):
    if len(entry.raw_input.strip().split()) < 5:
        return {
            "summary": "Entry too short. Can you describe your thoughts in a bit more detail?",
            "emotions": [],
            "topics": [],
            "cognitive_patterns": [],
            "suggested_questions": [],
            "raw_input": entry.raw_input,
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "user_id": entry.user_id
        }

    insights = extract_insights(entry.raw_input)

    # ✅ Add raw_input and user_id to the result
    insights["raw_input"] = entry.raw_input
    insights["user_id"] = entry.user_id

    # Save to DB
    store_entry(insights)

    return insights

from fastapi import Body

from fastapi import Body


@app.post("/feedback")
def save_feedback(data: FeedbackRequest):
    try:
        result = collection.update_one(
            {"_id": ObjectId(data.entry_id)},
            {"$set": {"therapist_feedback": data.feedback}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Entry not found")
        return {"success": True}
    except Exception as e:
        print("Error saving feedback:", e)
        raise HTTPException(status_code=500, detail="Failed to save feedback")



@app.get("/prompt")
def get_prompt():
    return {"prompt": load_daily_prompt()}


@app.get("/log")
def fetch_journal_history():
    entries = get_recent_entries(limit=10)
    return JSONResponse(content=entries)


@app.get("/clients")
def list_clients():
    users = get_all_user_ids()
    return {"clients": users}

@app.get("/log/{user_id}")
def get_entries_by_user(user_id: str):
    cursor = collection.find({"user_id": user_id}).sort("date", -1)
    results = []

    for entry in cursor:
        entry["_id"] = str(entry["_id"])  # ✅ Convert ObjectId to string for frontend use
        results.append(entry)

    return results


@app.get("/stats/{user_id}")
def user_stats(user_id: str):
    from collections import Counter
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

@app.post("/therapist-login")
async def therapist_login(request: Request):
    form = await request.json()
    password = form.get("password", "")

    if password == THERAPIST_SECRET_KEY:
        return {"status": "ok"}
    else:
        return JSONResponse(status_code=401, content={"message": "Unauthorized"})