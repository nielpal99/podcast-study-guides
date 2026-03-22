"""
summarize.py — generate a structured study guide from a podcast transcript.

Detects the podcast type and produces format-appropriate sections.
Supports: Acquired, Huberman Lab, Dwarkesh Patel, My First Million, and generic.
"""

import json
import os
from anthropic import Anthropic

client = Anthropic()

PODCAST_CONFIGS = {
    "acquired": {
        "name": "Acquired",
        "type": "business_breakdown",
        "description": "Deep-dive business history and strategy breakdown",
    },
    "huberman": {
        "name": "Huberman Lab",
        "type": "health_science",
        "description": "Science-based health and performance podcast",
    },
    "dwarkesh": {
        "name": "Dwarkesh Patel",
        "type": "long_form_interview",
        "description": "Long-form intellectual interview",
    },
    "mfm": {
        "name": "My First Million",
        "type": "startup_ideas",
        "description": "Startup ideas, business opportunities, and entrepreneurship",
    },
}

TYPE_PROMPTS = {
    "business_breakdown": """
Generate a structured study guide for this business/company breakdown podcast episode.
Return a JSON object with these exact keys:
{
  "title": "Episode title or company name",
  "overview": "3-4 sentence summary of what this episode covers",
  "key_people": [{"name": "...", "role": "..."}],
  "timeline": [{"year": "...", "event": "..."}],
  "business_model": "2-3 sentences explaining how the business makes money",
  "competitive_moat": ["moat 1", "moat 2", "moat 3"],
  "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4"],
  "notable_quote": {"text": "...", "attribution": "..."}
}
""",
    "health_science": """
Generate a structured study guide for this health and science podcast episode.
Return a JSON object with these exact keys:
{
  "title": "Episode title",
  "overview": "3-4 sentence summary of what this episode covers",
  "the_protocol": ["step 1", "step 2", "step 3"],
  "mechanisms": [{"concept": "...", "explanation": "..."}],
  "research_cited": [{"finding": "...", "implication": "..."}],
  "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4"],
  "actionable_summary": "2-3 sentences on what to actually do with this information"
}
""",
    "long_form_interview": """
Generate a structured study guide for this long-form interview podcast episode.
Return a JSON object with these exact keys:
{
  "title": "Episode title",
  "guest": {"name": "...", "background": "2-3 sentences on who they are"},
  "overview": "3-4 sentence summary of what this episode covers",
  "big_ideas": [{"idea": "...", "explanation": "..."}],
  "key_arguments": ["argument 1", "argument 2", "argument 3"],
  "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4"],
  "further_reading": ["topic 1", "topic 2", "topic 3"]
}
""",
    "startup_ideas": """
Generate a structured study guide for this startup/business ideas podcast episode.
Return a JSON object with these exact keys:
{
  "title": "Episode title",
  "overview": "3-4 sentence summary of what this episode covers",
  "ideas_discussed": [{"idea": "...", "market": "...", "why_now": "..."}],
  "frameworks": [{"name": "...", "explanation": "..."}],
  "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4"],
  "notable_quote": {"text": "...", "attribution": "..."}
}
""",
    "generic": """
Generate a structured study guide for this podcast episode.
Return a JSON object with these exact keys:
{
  "title": "Episode title",
  "overview": "3-4 sentence summary of what this episode covers",
  "main_topics": [{"topic": "...", "summary": "..."}],
  "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4"],
  "notable_quote": {"text": "...", "attribution": "..."}
}
""",
}


def detect_podcast_type(title: str, text_sample: str) -> str:
    """Use Claude to detect which podcast type this is."""
    title_lower = title.lower()

    # Fast keyword matching first
    if any(k in title_lower for k in ["acquired", "ben gilbert", "david rosenthal"]):
        return "business_breakdown"
    if any(k in title_lower for k in ["huberman", "andrew huberman"]):
        return "health_science"
    if any(k in title_lower for k in ["dwarkesh", "patel"]):
        return "long_form_interview"
    if any(k in title_lower for k in ["my first million", "shaan", "sam parr"]):
        return "startup_ideas"

    # Fall back to Claude for unknown podcasts
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=50,
        messages=[{
            "role": "user",
            "content": (
                f"Podcast title: {title}\n\n"
                f"First 500 words:\n{text_sample[:500]}\n\n"
                "Classify this podcast into exactly one of these types: "
                "business_breakdown, health_science, long_form_interview, startup_ideas, generic\n"
                "Reply with only the type name."
            ),
        }],
    )
    detected = response.content[0].text.strip().lower()
    return detected if detected in TYPE_PROMPTS else "generic"


def generate_summary(title: str, text: str, podcast_type: str | None = None) -> dict:
    """
    Generate a structured study guide summary.
    Returns a dict with podcast_type + the generated sections.
    """
    if podcast_type is None:
        podcast_type = detect_podcast_type(title, text)

    type_prompt = TYPE_PROMPTS.get(podcast_type, TYPE_PROMPTS["generic"])

    # Use up to ~60k chars of transcript (well within Claude's context)
    truncated = text[:60000]

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": (
                f"Here is a podcast transcript titled: {title}\n\n"
                f"---\n{truncated}\n---\n\n"
                f"{type_prompt}\n"
                "Return only valid JSON. No markdown, no explanation."
            ),
        }],
    )

    raw = response.content[0].text.strip()
    # Strip markdown code fences if present
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    data = json.loads(raw)
    data["podcast_type"] = podcast_type
    return data
