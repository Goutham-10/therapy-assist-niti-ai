from fastapi import APIRouter
from backend.utils import load_daily_prompt

router = APIRouter()

@router.get("/prompt")
def get_prompt():
    return {"prompt": load_daily_prompt()}
