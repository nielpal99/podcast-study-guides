"""
server.py — FastAPI server wrapping the query engine.

Usage:
    python -m uvicorn api.server:app --reload --port 8000

Endpoints:
    POST /query   { "episode": "acquired", "question": "..." }
    POST /index   { "url": "https://..." }
    GET  /episodes
    GET  /summary/{slug}
"""

import json
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from api.query import query_episode, load_index  # noqa: E402
from api.ingest import extract_from_url          # noqa: E402
from api.summarize import generate_summary       # noqa: E402
from api.index_transcript import index_from_text # noqa: E402

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
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/episodes")
async def list_episodes():
    indexes_dir = Path("indexes")
    if not indexes_dir.exists():
        return {"episodes": []}
    episodes = [d.name for d in indexes_dir.iterdir() if d.is_dir()]
    return {"episodes": sorted(episodes)}


class IndexRequest(BaseModel):
    url: str
    podcast_type: str | None = None  # optional override


class IndexResponse(BaseModel):
    slug: str
    title: str
    podcast_type: str


@app.post("/index", response_model=IndexResponse)
async def index_url(req: IndexRequest):
    try:
        title, text = extract_from_url(req.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {e}")

    try:
        summary = generate_summary(title, text, podcast_type=req.podcast_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {e}")

    try:
        slug = index_from_text(title, text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {e}")

    # Persist summary alongside index
    summary_path = Path("indexes") / slug / "summary.json"
    summary_path.write_text(json.dumps(summary, indent=2))

    return {"slug": slug, "title": title, "podcast_type": summary["podcast_type"]}


@app.get("/summary/{slug}")
async def get_summary(slug: str):
    summary_path = Path("indexes") / slug / "summary.json"
    if not summary_path.exists():
        raise HTTPException(status_code=404, detail=f"No summary found for '{slug}'")
    return json.loads(summary_path.read_text())


@app.get("/health")
async def health():
    return {"status": "ok"}
