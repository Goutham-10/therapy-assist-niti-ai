from fastapi import APIRouter
from backend.db import get_recent_entries, collection
from fastapi.responses import JSONResponse

router = APIRouter()

@router.get("/log")
def fetch_journal_history():
    entries = get_recent_entries(limit=10)
    return JSONResponse(content=entries)

@router.get("/log/{user_id}")
def get_entries_by_user(user_id: str):
    print(f"[API] Fetching entries for user: {user_id}")
    cursor = collection.find({"user_id": user_id}).sort("date", -1)
    results = []

    for entry in cursor:
        entry["_id"] = str(entry["_id"])
        results.append(entry)

    print(f"[API] Found {len(results)} entries for user {user_id}")
    return results
