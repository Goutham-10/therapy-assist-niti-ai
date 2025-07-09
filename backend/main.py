from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import os

# Routes
from backend.routes.analyze import router as analyze_router
from backend.routes.feedback import router as feedback_router
from backend.routes.prompt import router as prompt_router
from backend.routes.journal import router as journal_router
from backend.routes.clients import router as clients_router
from backend.routes.stats import router as stats_router
# from backend.routes.auth import router as auth_router

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

# Register routers
app.include_router(analyze_router)
app.include_router(feedback_router)
app.include_router(prompt_router)
app.include_router(journal_router)
app.include_router(clients_router)
app.include_router(stats_router)
# app.include_router(auth_router)
