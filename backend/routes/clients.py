from fastapi import APIRouter
from backend.db import get_all_user_ids

router = APIRouter()

@router.get("/clients")
def list_clients():
    users = get_all_user_ids()
    print(f"[API] Found {len(users)} clients: {users}")
    return {"clients": users}
