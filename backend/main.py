if __package__ in (None, ""):
    # Allow `python main.py` from this directory by making the project root
    # importable, then using absolute imports below.
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend import config, db
from backend.routers import chats, models


@asynccontextmanager
async def lifespan(app):
    db.init_db()
    yield


app = FastAPI(title="Ragstead", lifespan=lifespan)
app.include_router(chats.router, prefix="/api")
app.include_router(models.router, prefix="/api")
app.mount("/assets", StaticFiles(directory=config.ROOT_DIR / "assets"), name="assets")
app.mount("/", StaticFiles(directory=config.FRONTEND_DIR, html=True), name="frontend")


@app.middleware("http")
async def no_store_frontend_assets(request, call_next):
    """The frontend has no build step, so never let browsers cache stale files."""
    response = await call_next(request)
    path = request.url.path
    if path == "/" or path.endswith((".html", ".css", ".js", ".mjs")):
        response.headers["Cache-Control"] = "no-store"
    return response


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
