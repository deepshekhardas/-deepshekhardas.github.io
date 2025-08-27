import os
from functools import lru_cache
from typing import Optional

import requests

PLACEHOLDER = "https://via.placeholder.com/500x750?text=No+Image"


@lru_cache(maxsize=4096)
def _omdb_poster(title: str, year: Optional[int]) -> Optional[str]:
    api_key = os.getenv("OMDB_API_KEY")
    if not api_key:
        return None
    try:
        params = {"t": title}
        if year:
            params["y"] = str(year)
        params["apikey"] = api_key
        r = requests.get("https://www.omdbapi.com/", params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
        poster = data.get("Poster")
        if poster and poster != "N/A":
            return poster
    except Exception:
        return None
    return None


@lru_cache(maxsize=4096)
def _tmdb_poster(title: str, year: Optional[int]) -> Optional[str]:
    api_key = os.getenv("TMDB_API_KEY")
    if not api_key:
        return None
    try:
        params = {"api_key": api_key, "query": title}
        if year:
            params["year"] = int(year)
        r = requests.get("https://api.themoviedb.org/3/search/movie", params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
        results = data.get("results") or []
        if results:
            poster_path = results[0].get("poster_path")
            if poster_path:
                return f"https://image.tmdb.org/t/p/w500{poster_path}"
    except Exception:
        return None
    return None


def get_poster_url(title: str, year: Optional[int]) -> str:
    title = (title or "").strip()
    url = _omdb_poster(title, year)
    if url:
        return url
    url = _tmdb_poster(title, year)
    if url:
        return url
    return PLACEHOLDER
