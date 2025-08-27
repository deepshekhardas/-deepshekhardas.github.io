from __future__ import annotations

from typing import List, Optional, Tuple

import numpy as np
import pandas as pd

from .content_model import content_similarity_scores
from .cf_model import SVDModel, predict_for_user


def _minmax(series: pd.Series) -> pd.Series:
	if series.max() == series.min():
		return pd.Series(0.5, index=series.index)
	return (series - series.min()) / (series.max() - series.min())


def hybrid_recommend(
	movies: pd.DataFrame,
	cf_model: Optional[SVDModel],
	content_sim_matrix,
	all_movie_ids: List[int],
	user_id: Optional[int] = None,
	liked_movie_ids: Optional[List[int]] = None,
	disliked_movie_ids: Optional[List[int]] = None,
	alpha_cf: float = 0.6,
	alpha_content: float = 0.4,
	exclude_rated: Optional[List[int]] = None,
	top_n: int = 10,
) -> pd.DataFrame:
	liked_movie_ids = liked_movie_ids or []
	disliked_movie_ids = disliked_movie_ids or []
	exclude_rated = set(exclude_rated or [])

	# CF scores (if model/user provided)
	cf_scores = pd.Series(0.0, index=all_movie_ids)
	if cf_model is not None and (user_id is not None or liked_movie_ids):
		cf_scores = predict_for_user(cf_model, user_id if user_id is not None else -1, all_movie_ids)
		cf_scores = cf_scores.reindex(all_movie_ids).fillna(cf_scores.mean())

	# Content scores
	content_scores = content_similarity_scores(liked_movie_ids, disliked_movie_ids, content_sim_matrix, all_movie_ids)

	# Normalize
	cf_norm = _minmax(cf_scores)
	content_norm = _minmax(content_scores)

	hybrid = alpha_cf * cf_norm + alpha_content * content_norm

	# Exclude rated/selected movies
	for mid in liked_movie_ids + list(disliked_movie_ids) + list(exclude_rated):
		if mid in hybrid.index:
			hybrid.loc[mid] = -1.0

	top_ids = hybrid.sort_values(ascending=False).head(top_n).index.tolist()
	res = movies[movies["movieId"].isin(top_ids)].copy()
	res["hybrid_score"] = res["movieId"].map(hybrid)
	res["cf_score"] = res["movieId"].map(cf_scores)
	res["content_score"] = res["movieId"].map(content_scores)
	return res.sort_values("hybrid_score", ascending=False)