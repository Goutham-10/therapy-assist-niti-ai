from fastapi import APIRouter, HTTPException
from backend.models import FeedbackRequest
from backend.db import collection
from bson.objectid import ObjectId

router = APIRouter()

@router.post("/feedback")
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
