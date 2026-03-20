"""
server.py — FastAPI server wrapping the query engine.

Usage:
    python -m uvicorn api.server:app --reload --port 8000

Endpoints:
    POST /query  { "episode": "acquired", "question": "..." }
              -> { "answer": "...", "sources": [...] }
    GET  /episodes  -> list of available indexed episodes
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from api.query import query_episode, load_index  # noqa: E402

app = FastAPI(title="Podcast Study Guide API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    episode: str
    question: str


class SourcePassage(BaseModel):
    id: int
    text: str
    score: float | None


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourcePassage]


@app.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    try:
        result = query_episode(req.episode, req.question)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}")


@app.get("/episodes")
async def list_episodes():
    indexes_dir = Path("indexes")
    if not indexes_dir.exists():
        return {"episodes": []}
    episodes = [d.name for d in indexes_dir.iterdir() if d.is_dir()]
    return {"episodes": sorted(episodes)}


@app.get("/health")
async def health():
    return {"status": "ok"}
