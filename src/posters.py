from __future__ import annotations

import os
from typing import Optional

import requests

TMDB_SEARCH_URL = "https://api.themoviedb.org/3/search/movie"
TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w342"
PLACEHOLDER = "https://via.placeholder.com/342x513?text=No+Poster"


def get_poster_url(title: str, year: Optional[int] = None, api_key: Optional[str] = None) -> str:
	api_key = api_key or os.getenv("TMDB_API_KEY")
	if not api_key:
		return PLACEHOLDER
	try:
		params = {"api_key": api_key, "query": title}
		if year:
			params["year"] = int(year)
		r = requests.get(TMDB_SEARCH_URL, params=params, timeout=10)
		r.raise_for_status()
		data = r.json()
		results = data.get("results", [])
		if not results:
			return PLACEHOLDER
		poster_path = results[0].get("poster_path")
		if not poster_path:
			return PLACEHOLDER
		return f"{TMDB_IMG_BASE}{poster_path}"
	except Exception:
		return PLACEHOLDER