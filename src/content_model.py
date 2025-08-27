from __future__ import annotations

from typing import Tuple, List

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _build_text_corpus(movies: pd.DataFrame, tags: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
	# Aggregate tags per movie
	tags_agg = (
		tags.groupby("movieId")["tag"].apply(lambda s: " ".join(map(str, s.tolist())))
		if len(tags) > 0
		else pd.Series(dtype=str)
	)

	movies = movies.copy()
	movies["tags_text"] = movies["movieId"].map(tags_agg).fillna("")
	movies["genres_text"] = movies["genres"].fillna("").str.replace("|", " ")
	movies["text"] = (movies["clean_title"].fillna("") + " " + movies["genres_text"] + " " + movies["tags_text"]).str.lower()
	return movies, movies["text"].tolist()


def fit_content_model(movies: pd.DataFrame, tags: pd.DataFrame) -> Tuple[TfidfVectorizer, np.ndarray, np.ndarray]:
	movies_text_df, corpus = _build_text_corpus(movies, tags)
	vectorizer = TfidfVectorizer(stop_words="english", max_features=5000, ngram_range=(1,2))
	tfidf = vectorizer.fit_transform(corpus)
	# Item-item cosine similarity
	sim = cosine_similarity(tfidf)
	return vectorizer, tfidf, sim


def content_similarity_scores(
	liked_movie_ids: List[int],
	disliked_movie_ids: List[int],
	sim_matrix: np.ndarray,
	all_movie_ids: List[int],
	alpha_like: float = 1.0,
	alpha_dislike: float = 1.0,
) -> pd.Series:
	"""Compute content similarity scores from liked and disliked movie sets."""
	id_to_index = {mid: idx for idx, mid in enumerate(all_movie_ids)}
	scores = np.zeros(len(all_movie_ids), dtype=float)

	if liked_movie_ids:
		idxs = [id_to_index[m] for m in liked_movie_ids if m in id_to_index]
		if idxs:
			scores += alpha_like * np.mean(sim_matrix[idxs, :], axis=0)

	if disliked_movie_ids:
		idxs = [id_to_index[m] for m in disliked_movie_ids if m in id_to_index]
		if idxs:
			scores -= alpha_dislike * np.mean(sim_matrix[idxs, :], axis=0)

	return pd.Series(scores, index=all_movie_ids)