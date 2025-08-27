import os
import re
import zipfile
from pathlib import Path
from typing import Optional, Tuple

import pandas as pd
import requests

MOVIELENS_URL = "https://files.grouplens.org/datasets/movielens/ml-latest-small.zip"


def ensure_movielens_small(base_dir: str = "data") -> str:
    base = Path(base_dir)
    base.mkdir(parents=True, exist_ok=True)
    extract_dir = base / "ml-latest-small"
    if extract_dir.exists() and (extract_dir / "movies.csv").exists():
        return str(extract_dir)

    # If user provided a local zip path
    local_zip = os.getenv("MOVIELENS_LOCAL_ZIP")
    zip_path = base / "ml-latest-small.zip"

    def _extract(zip_file: Path):
        with zipfile.ZipFile(zip_file, "r") as zf:
            zf.extractall(base)

    if local_zip and Path(local_zip).exists():
        _extract(Path(local_zip))
        return str(extract_dir)

    # Download with TLS verification first, then fallback to verify=False
    try:
        with requests.get(MOVIELENS_URL, stream=True, timeout=60) as r:
            r.raise_for_status()
            with open(zip_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=1 << 20):
                    if chunk:
                        f.write(chunk)
    except requests.exceptions.SSLError:
        try:
            import urllib3  # type: ignore

            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        except Exception:
            pass
        with requests.get(MOVIELENS_URL, stream=True, timeout=60, verify=False) as r:  # type: ignore[arg-type]
            r.raise_for_status()
            with open(zip_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=1 << 20):
                    if chunk:
                        f.write(chunk)
    # Other network errors propagate

    _extract(zip_path)
    return str(extract_dir)



def load_datasets(data_dir: str) -> Tuple[pd.DataFrame, pd.DataFrame, Optional[pd.DataFrame]]:
    movies_path = Path(data_dir) / "movies.csv"
    ratings_path = Path(data_dir) / "ratings.csv"
    tags_path = Path(data_dir) / "tags.csv"

    movies_df = pd.read_csv(movies_path)
    ratings_df = pd.read_csv(ratings_path)
    tags_df = pd.read_csv(tags_path) if tags_path.exists() else None

    # Extract year from title and add a year column
    years = []
    cleaned_titles = []
    for t in movies_df["title"].fillna(""):
        res = extract_title_year(t)
        if res is None:
            cleaned_titles.append(t)
            years.append(None)
        else:
            title, year = res
            cleaned_titles.append(title)
            years.append(year)
    movies_df["clean_title"] = cleaned_titles
    movies_df["year"] = years
    return movies_df, ratings_df, tags_df


_TITLE_YEAR_RE = re.compile(r"^(?P<title>.*)\s*\((?P<year>\d{4})\)\s*$")


def extract_title_year(raw_title: str) -> Optional[Tuple[str, int]]:
    if not isinstance(raw_title, str):
        return None
    m = _TITLE_YEAR_RE.match(raw_title)
    if not m:
        return None
    title = m.group("title").strip()
    year = int(m.group("year"))
    return title, year
