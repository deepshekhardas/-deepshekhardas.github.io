from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Tuple

import pandas as pd


@dataclass
class MovieLensData:
	movies: pd.DataFrame
	ratings: pd.DataFrame
	tags: pd.DataFrame


def load_movielens(dataset_dir: str | Path) -> MovieLensData:
	dataset_path = Path(dataset_dir)
	movies_path = dataset_path / "movies.csv"
	ratings_path = dataset_path / "ratings.csv"
	tags_path = dataset_path / "tags.csv"

	if not movies_path.exists() or not ratings_path.exists():
		raise FileNotFoundError(
			f"Could not find movies.csv/ratings.csv in {dataset_path}. Run downloader or check path."
		)

	movies = pd.read_csv(movies_path)
	ratings = pd.read_csv(ratings_path)
	tags = pd.read_csv(tags_path) if tags_path.exists() else pd.DataFrame(columns=["userId","movieId","tag","timestamp"]) 

	# Basic cleanup
	movies["year"] = movies["title"].str.extract(r"\((\d{4})\)").astype("Int64")
	movies["clean_title"] = movies["title"].str.replace(r"\s*\(\d{4}\)$", "", regex=True)
	movies["genres_list"] = movies["genres"].fillna("").apply(lambda g: [x for x in g.split("|") if x != "(no genres listed)"])

	return MovieLensData(movies=movies, ratings=ratings, tags=tags)


def build_popularity(mld: MovieLensData) -> pd.DataFrame:
	pop = (
		mld.ratings.groupby("movieId")["rating"]
		.agg(pop_count="count", pop_mean="mean")
		.reset_index()
	)
	return pop