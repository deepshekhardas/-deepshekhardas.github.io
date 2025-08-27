from typing import Dict, Iterable, List, Optional

import numpy as np
import pandas as pd

from .content import content_similarity_scores


def _minmax(s: np.ndarray) -> np.ndarray:
    if s.size == 0:
        return s
    smin, smax = float(np.min(s)), float(np.max(s))
    if smax - smin < 1e-12:
        return np.zeros_like(s)
    return (s - smin) / (smax - smin)


def hybrid_rank(
    mode: str,
    movies_df: pd.DataFrame,
    ratings_df: pd.DataFrame,
    tfidf_matrix,
    movie_index: Dict[int, int],
    index_to_movie: List[int],
    svd_bundle: Dict,
    weight_cf: float = 0.65,
    top_n: int = 10,
    user_id: Optional[int] = None,
    liked_movie_ids: Optional[Iterable[int]] = None,
    disliked_movie_ids: Optional[Iterable[int]] = None,
) -> pd.DataFrame:
    assert mode in {"by_user", "by_likes"}

    # CF scores
    algo = svd_bundle["algo"]

    # Content scores initialization
    if mode == "by_user":
        assert user_id is not None
        # Determine user likes/dislikes from past ratings if available
        user_hist = ratings_df[ratings_df["userId"] == user_id]
        liked_ids = user_hist[user_hist["rating"] >= 4.0]["movieId"].tolist()
        disliked_ids = user_hist[user_hist["rating"] <= 2.0]["movieId"].tolist()
        content_scores = content_similarity_scores(liked_ids, disliked_ids, tfidf_matrix, movie_index)

        # CF predictions for unseen items
        user_seen = set(user_hist["movieId"].tolist())
        cf_scores = []
        candidate_indices = []
        for idx, mid in enumerate(index_to_movie):
            if mid in user_seen:
                continue
            est = algo.predict(user_id, mid).est
            cf_scores.append(est)
            candidate_indices.append(idx)

        cf_scores = np.array(cf_scores, dtype=np.float64)
        cf_scores = _minmax(cf_scores)
        subset_content = content_scores[candidate_indices]
        subset_content = _minmax(subset_content)

        hybrid = weight_cf * cf_scores + (1.0 - weight_cf) * subset_content
        candidates = [index_to_movie[i] for i in candidate_indices]

    else:  # by_likes
        liked_movie_ids = list(liked_movie_ids or [])
        disliked_movie_ids = list(disliked_movie_ids or [])
        content_scores = content_similarity_scores(liked_movie_ids, disliked_movie_ids, tfidf_matrix, movie_index)
        # Use CF item biases even for unknown user (Surprise will back off to global/item biases)
        pseudo_uid = 99999999
        cf_scores = np.array([algo.predict(pseudo_uid, mid).est for mid in index_to_movie], dtype=np.float64)
        cf_scores = _minmax(cf_scores)
        content_scores = _minmax(content_scores)
        hybrid = weight_cf * cf_scores + (1.0 - weight_cf) * content_scores
        candidates = index_to_movie

    # Prepare result DataFrame
    out = pd.DataFrame({
        "movieId": candidates,
        "hybrid_score": hybrid,
    })
    out = out.merge(movies_df[["movieId", "title", "genres", "year"]], on="movieId", how="left")
    out = out.sort_values("hybrid_score", ascending=False).head(top_n).reset_index(drop=True)
    return out
