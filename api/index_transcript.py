"""
index_transcript.py — chunk and embed a transcript into a local vector index.

Usage:
    python api/index_transcript.py Acquired.txt
    python api/index_transcript.py transcripts/shopify.txt
"""

import sys
import re
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from llama_index.core import Document, VectorStoreIndex, Settings
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.anthropic import Anthropic

# Configure models
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")
Settings.llm = Anthropic(model="claude-sonnet-4-20250514", max_tokens=2048)


def slugify(name: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", name.lower()).strip()
    return re.sub(r"[\s-]+", "-", slug)


def index_transcript(transcript_path: str):
    path = Path(transcript_path)
    if not path.exists():
        print(f"Error: file not found — {transcript_path}")
        sys.exit(1)

    slug = slugify(path.stem)
    persist_dir = Path("indexes") / slug

    if persist_dir.exists():
        print(f"Index already exists at {persist_dir}/")
        print("Delete the folder and re-run to rebuild.")
        return slug

    print(f"Loading transcript: {path.name} ({path.stat().st_size // 1024}KB)")
    text = path.read_text(encoding="utf-8")
    doc = Document(text=text, metadata={"source": path.name, "episode": slug})

    print("Splitting into nodes...")
    parser = SentenceSplitter(chunk_size=1024, chunk_overlap=100)
    nodes = parser.get_nodes_from_documents([doc])
    print(f"  {len(nodes)} nodes created")

    print("Embedding and building index (this calls OpenAI)...")
    index = VectorStoreIndex(nodes, show_progress=True)

    persist_dir.mkdir(parents=True, exist_ok=True)
    index.storage_context.persist(persist_dir=str(persist_dir))
    print(f"Index saved to {persist_dir}/")
    return slug


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python api/index_transcript.py <transcript.txt>")
        sys.exit(1)
    index_transcript(sys.argv[1])
