from fastapi import APIRouter, Request, HTTPException
from backend.config import THERAPIST_SECRET_KEY

router = APIRouter()

@router.post("/therapist-login")
async def therapist_login(request: Request):
    data = await request.json()
    if data.get("password") != THERAPIST_SECRET_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"message": "Authenticated"}
