# backend/db.py

import os
from pymongo import MongoClient
from dotenv import load_dotenv
from typing import List, Dict

load_dotenv()

# MongoDB Setup
client = MongoClient(os.getenv("MONGODB_URI"))
db = client["therapyai"]
collection = db["entries"]

def store_entry(entry: Dict) -> None:
    """Insert a single journal entry into the database."""
    print("[DB] Saving entry for user:", entry.get("user_id", "unknown"))
    collection.insert_one(entry)

def get_recent_entries(limit: int = 10) -> List[Dict]:
    """Return the most recent journal entries across all users."""
    cursor = collection.find({}, {"_id": 0}).sort("date", -1).limit(limit)
    return list(cursor)

def get_entries_by_user(user_id: str) -> List[Dict]:
    """Fetch all entries submitted by a specific user."""
    return list(
        collection.find({"user_id": user_id}, {"_id": 0}).sort("date", -1)
    )

def get_all_user_ids() -> List[str]:
    """Return a list of unique user IDs from the journal collection."""
    return collection.distinct("user_id")
