from typing import Dict, Iterable, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _prepare_content_corpus(movies_df: pd.DataFrame, tags_df: Optional[pd.DataFrame]) -> Tuple[List[str], List[int]]:
    genres_text = (
        movies_df["genres"].fillna("")
        .replace("(no genres listed)", "")
        .apply(lambda g: " ".join([tok for tok in g.split("|") if tok and tok != "(no genres listed)"]))
    )

    tags_text_map: Dict[int, str] = {}
    if tags_df is not None and not tags_df.empty:
        grouped = tags_df.dropna(subset=["tag"]).groupby("movieId")["tag"].apply(list)
        for mid, tag_list in grouped.items():
            tags_text_map[int(mid)] = " ".join(str(t) for t in tag_list)

    corpus: List[str] = []
    movie_ids: List[int] = []
    for idx, row in movies_df.iterrows():
        mid = int(row["movieId"])  # type: ignore[arg-type]
        text_parts = [str(genres_text.loc[idx])]  # genres as tokens
        if mid in tags_text_map:
            text_parts.append(tags_text_map[mid])
        corpus.append(" ".join([p for p in text_parts if p]))
        movie_ids.append(mid)

    return corpus, movie_ids


def build_content_features(
    movies_df: pd.DataFrame,
    tags_df: Optional[pd.DataFrame] = None,
    max_features: int = 8000,
):
    corpus, movie_ids = _prepare_content_corpus(movies_df, tags_df)
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        min_df=2,
        max_features=max_features,
    )
    tfidf_matrix = vectorizer.fit_transform(corpus)
    movie_index = {mid: idx for idx, mid in enumerate(movie_ids)}
    index_to_movie = movie_ids
    vocab = vectorizer.vocabulary_
    return tfidf_matrix, movie_index, index_to_movie, vocab


def content_similarity_scores(
    liked_movie_ids: Iterable[int],
    disliked_movie_ids: Optional[Iterable[int]],
    tfidf_matrix,
    movie_index: Dict[int, int],
    subtract_weight: float = 0.5,
) -> np.ndarray:
    num_items = tfidf_matrix.shape[0]
    sim_scores = np.zeros(num_items, dtype=np.float64)

    liked_indices = [movie_index[mid] for mid in liked_movie_ids if mid in movie_index]
    if liked_indices:
        liked_vec = cosine_similarity(tfidf_matrix[liked_indices], tfidf_matrix).mean(axis=0)
        sim_scores += np.asarray(liked_vec).ravel()

    if disliked_movie_ids is not None:
        disliked_indices = [movie_index[mid] for mid in disliked_movie_ids if mid in movie_index]
        if disliked_indices:
            disliked_vec = cosine_similarity(tfidf_matrix[disliked_indices], tfidf_matrix).mean(axis=0)
            sim_scores -= subtract_weight * np.asarray(disliked_vec).ravel()

    if sim_scores.max() > sim_scores.min():
        sim_scores = (sim_scores - sim_scores.min()) / (sim_scores.max() - sim_scores.min())
    return sim_scores
