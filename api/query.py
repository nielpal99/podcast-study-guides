"""
query.py — ask a natural language question against an indexed transcript.

Usage:
    python api/query.py acquired "Who invented Coca-Cola and why?"
    python api/query.py acquired "What was the New Coke disaster?"
"""

import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

import re
from llama_index.core import StorageContext, load_index_from_storage, Settings
from llama_index.core.query_engine import CitationQueryEngine
from llama_index.core.prompts import PromptTemplate
from llama_index.embeddings.fastembed import FastEmbedEmbedding
from llama_index.llms.anthropic import Anthropic

Settings.embed_model = FastEmbedEmbedding(model_name="BAAI/bge-small-en-v1.5")
Settings.llm = Anthropic(model="claude-sonnet-4-20250514", max_tokens=2048)

CITATION_QA_TEMPLATE = PromptTemplate(
    "You are a helpful assistant answering questions about a podcast episode transcript.\n"
    "Below are numbered source passages from the transcript.\n"
    "Answer the question using only information from these sources.\n"
    "Cite sources inline as [1], [2], etc. Only cite a source if it directly supports what you're saying.\n"
    "Write in clear, concise prose. Use 2-3 short paragraphs. Do not use bullet points.\n\n"
    "Sources:\n"
    "---------------------\n"
    "{context_str}\n"
    "---------------------\n"
    "Question: {query_str}\n"
    "Answer: "
)


def load_index(episode_slug: str):
    persist_dir = Path("indexes") / episode_slug
    if not persist_dir.exists():
        raise FileNotFoundError(
            f"No index found for '{episode_slug}'. "
            f"Run: python api/index_transcript.py <transcript.txt>"
        )
    storage_context = StorageContext.from_defaults(persist_dir=str(persist_dir))
    return load_index_from_storage(storage_context)


def query_episode(episode_slug: str, question: str) -> dict:
    index = load_index(episode_slug)

    query_engine = CitationQueryEngine.from_args(
        index,
        similarity_top_k=7,
        citation_chunk_size=1024,
        citation_qa_template=CITATION_QA_TEMPLATE,
    )

    response = query_engine.query(question)

    def clean_source(text: str) -> str:
        # Remove podcast speaker labels like "Ben:", "David:", "Brad:"
        text = re.sub(r'\b[A-Z][a-z]+:\s*', '', text)
        # Collapse extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    sources = []
    for i, node in enumerate(response.source_nodes, 1):
        sources.append({
            "id": i,
            "text": clean_source(node.node.get_content()),
            "score": round(node.score, 3) if node.score else None,
        })

    return {
        "answer": str(response),
        "sources": sources,
    }


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python api/query.py <episode-slug> <question>")
        print('Example: python api/query.py acquired "What was New Coke?"')
        sys.exit(1)

    episode = sys.argv[1]
    question = " ".join(sys.argv[2:])

    print(f"\nQuestion: {question}\n")
    result = query_episode(episode, question)

    print("Answer:")
    print(result["answer"])
    print(f"\n— {len(result['sources'])} source passage(s) used —")
    for s in result["sources"]:
        print(f"\n[{s['id']}] (score: {s['score']})")
        print(s["text"])
