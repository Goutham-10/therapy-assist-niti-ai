@app.get("/")
def serve_frontend():
    return FileResponse(os.path.join("frontend", "index.html"))

@app.get("/therapist", response_class=HTMLResponse)
async def get_therapist_page():
    with open("frontend/therapist.html", "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read(), status_code=200)
