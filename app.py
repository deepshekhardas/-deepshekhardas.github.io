import math
from typing import Optional, Tuple

import numpy as np
import pandas as pd
import streamlit as st
import plotly.express as px

from recommender import (
    ensure_movielens_small,
    load_datasets,
    build_content_features,
    load_or_train_svd,
    hybrid_rank,
    get_poster_url,
    extract_title_year,
)


def _setup_page():
    st.set_page_config(page_title="Hybrid Movie Recommender", page_icon="🎬", layout="wide")
    CUSTOM_CSS = """
    <style>
    .card { background: #151a23; border-radius: 14px; padding: 12px; box-shadow: 0 6px 24px rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.06); }
    .card h4 { margin: 8px 0 6px 0; font-size: 1.0rem; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; background: rgba(108,99,255,0.2); color: #c9c6ff; margin-right: 6px; font-size: 0.75rem; }
    .score { font-weight: 600; color: #ffd166; }
    </style>
    """
    st.markdown(CUSTOM_CSS, unsafe_allow_html=True)


@st.cache_data(show_spinner=False)
def _load_data() -> Tuple[pd.DataFrame, pd.DataFrame, Optional[pd.DataFrame]]:
    data_dir = ensure_movielens_small("data")
    movies_df, ratings_df, tags_df = load_datasets(data_dir)
    return movies_df, ratings_df, tags_df


@st.cache_resource(show_spinner=True)
def _prepare_models(ratings_df: pd.DataFrame):
    model_bundle, rmse = load_or_train_svd(ratings_df, save_dir="models")
    return model_bundle, rmse


@st.cache_resource(show_spinner=False)
def _prepare_content(movies_df: pd.DataFrame, tags_df: Optional[pd.DataFrame]):
    return build_content_features(movies_df, tags_df)


def _render_cards(df: pd.DataFrame, title: str = "Recommendations"):
    st.subheader(title)
    if df.empty:
        st.info("No recommendations available. Try different inputs.")
        return
    cols_per_row = 5
    rows = math.ceil(len(df) / cols_per_row)
    for r in range(rows):
        cols = st.columns(cols_per_row)
        for c in range(cols_per_row):
            idx = r * cols_per_row + c
            if idx >= len(df):
                break
            rec = df.iloc[idx]
            with cols[c]:
                with st.container():
                    st.markdown('<div class="card">', unsafe_allow_html=True)
                    poster_url = get_poster_url(rec["title"], rec.get("year"))
                    st.image(poster_url, use_column_width=True)
                    st.markdown(f"<h4>{rec['title']}</h4>", unsafe_allow_html=True)
                    genres = rec.get("genres", "").split("|") if isinstance(rec.get("genres"), str) else []
                    if genres:
                        st.markdown(" ".join([f"<span class='badge'>{g}</span>" for g in genres[:4]]), unsafe_allow_html=True)
                    score_val = rec.get("hybrid_score")
                    score_txt = f"{score_val:.3f}" if isinstance(score_val, (float, int)) else "-"
                    st.markdown(f"<div class='score'>Hybrid score: {score_txt}</div>", unsafe_allow_html=True)
                    st.markdown("</div>", unsafe_allow_html=True)


def main():
    _setup_page()
    st.title("🎬 Hybrid Movie Recommendation System")
    st.caption("Collaborative Filtering (SVD) + Content-Based (Genres/Tags)")

    with st.spinner("Loading data..."):
        movies_df, ratings_df, tags_df = _load_data()

    with st.spinner("Preparing models..."):
        model_bundle, rmse = _prepare_models(ratings_df)
    st.success(f"SVD RMSE: {rmse:.4f}")

    tfidf_matrix, movie_index, index_to_movie, vocab = _prepare_content(movies_df, tags_df)

    tabs = st.tabs(["Recommend", "Analytics"])

    with tabs[0]:
        st.sidebar.header("Controls")
        mode = st.sidebar.radio("Mode", ["Existing user", "Likes/Dislikes"], index=0)
        weight_cf = st.sidebar.slider("CF weight (vs Content)", 0.0, 1.0, 0.65, 0.05)
        top_n = st.sidebar.slider("Top N", 5, 30, 10, 1)

        if mode == "Existing user":
            trainset = model_bundle["trainset"]
            try:
                known_user_ids = [int(trainset.to_raw_uid(i)) for i in range(trainset.n_users)]
            except Exception:
                known_user_ids = list(sorted(ratings_df["userId"].unique().tolist()))
            default_uid = int(known_user_ids[0]) if known_user_ids else 1
            user_id = st.number_input("User ID", min_value=1, value=default_uid, step=1)
            if st.button("Recommend for user"):
                recs = hybrid_rank(
                    mode="by_user",
                    user_id=int(user_id),
                    movies_df=movies_df,
                    ratings_df=ratings_df,
                    tfidf_matrix=tfidf_matrix,
                    movie_index=movie_index,
                    index_to_movie=index_to_movie,
                    svd_bundle=model_bundle,
                    weight_cf=weight_cf,
                    top_n=top_n,
                )
                _render_cards(recs)
        else:
            st.write("Pick a few movies you liked and disliked to shape recommendations.")
            all_options = movies_df["title"].tolist()
            liked_titles = st.multiselect("Liked movies", all_options[:2000], max_selections=20)
            disliked_titles = st.multiselect("Disliked movies (optional)", all_options[:2000], max_selections=10)
            liked_ids = movies_df[movies_df["title"].isin(liked_titles)]["movieId"].tolist()
            disliked_ids = movies_df[movies_df["title"].isin(disliked_titles)]["movieId"].tolist()
            if st.button("Recommend from likes/dislikes"):
                recs = hybrid_rank(
                    mode="by_likes",
                    liked_movie_ids=liked_ids,
                    disliked_movie_ids=disliked_ids,
                    movies_df=movies_df,
                    ratings_df=ratings_df,
                    tfidf_matrix=tfidf_matrix,
                    movie_index=movie_index,
                    index_to_movie=index_to_movie,
                    svd_bundle=model_bundle,
                    weight_cf=weight_cf,
                    top_n=top_n,
                )
                _render_cards(recs)

    with tabs[1]:
        st.subheader("Dataset Analytics")
        genres_exp = (
            movies_df.assign(genre_list=movies_df["genres"].str.split("|")).explode("genre_list")
        )
        genre_counts = genres_exp["genre_list"].value_counts().head(15).reset_index()
        genre_counts.columns = ["genre", "count"]
        fig1 = px.bar(genre_counts, x="genre", y="count", title="Top Genres")
        st.plotly_chart(fig1, use_container_width=True)

        pop = ratings_df.groupby("movieId").agg(count=("rating", "count"), avg_rating=("rating", "mean")).reset_index()
        pop = pop.merge(movies_df[["movieId", "title"]], on="movieId", how="left").sort_values("count", ascending=False).head(20)
        fig2 = px.bar(pop, x="title", y="count", title="Most Rated Movies")
        st.plotly_chart(fig2, use_container_width=True)


if __name__ == "__main__":
    main()