"""
ingest.py — extract transcript/text from a URL.

Supports:
    - YouTube videos (via youtube-transcript-api)
    - Web articles (via trafilatura)
"""

import re
from urllib.parse import urlparse, parse_qs


def is_youtube_url(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.netloc in ("www.youtube.com", "youtube.com", "youtu.be")


def get_youtube_video_id(url: str) -> str | None:
    parsed = urlparse(url)
    if parsed.netloc == "youtu.be":
        return parsed.path.lstrip("/")
    qs = parse_qs(parsed.query)
    ids = qs.get("v", [])
    return ids[0] if ids else None


def extract_youtube(url: str) -> tuple[str, str]:
    """Returns (title, transcript_text)."""
    import os
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api.formatters import TextFormatter

    video_id = get_youtube_video_id(url)
    if not video_id:
        raise ValueError(f"Could not extract video ID from URL: {url}")

    proxy_url = os.environ.get("PROXY_URL")
    proxies = {"http": proxy_url, "https": proxy_url} if proxy_url else None

    transcript_list = YouTubeTranscriptApi.get_transcript(video_id, proxies=proxies)
    formatter = TextFormatter()
    text = formatter.format_transcript(transcript_list)

    # Try to get the video title via oembed (no API key needed)
    try:
        import urllib.request, json
        oembed_url = f"https://www.youtube.com/oembed?url={url}&format=json"
        with urllib.request.urlopen(oembed_url, timeout=5) as r:
            data = json.loads(r.read())
        title = data.get("title", video_id)
    except Exception:
        title = video_id

    return title, text


def extract_article(url: str) -> tuple[str, str]:
    """Returns (title, article_text)."""
    import trafilatura

    downloaded = trafilatura.fetch_url(url)
    if not downloaded:
        raise ValueError(f"Could not fetch URL: {url}")

    text = trafilatura.extract(downloaded, include_comments=False, include_tables=False)
    if not text:
        raise ValueError(f"Could not extract text from URL: {url}")

    # Extract title
    metadata = trafilatura.extract_metadata(downloaded)
    title = metadata.title if metadata and metadata.title else url

    return title, text


def extract_from_url(url: str) -> tuple[str, str]:
    """
    Main entry point. Returns (title, text).
    Raises ValueError if extraction fails.
    """
    if is_youtube_url(url):
        return extract_youtube(url)
    else:
        return extract_article(url)
