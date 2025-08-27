from __future__ import annotations

import os
from pathlib import Path
from typing import List

import joblib
import numpy as np
import pandas as pd
import streamlit as st

from src.data_loader import load_movielens, build_popularity
from src.content_model import fit_content_model
from src.cf_model import train_svd
from src.hybrid import hybrid_recommend
from src.posters import get_poster_url

ARTIFACTS = Path("artifacts")
DATA_DIR = Path("data/ml-latest-small")

st.set_page_config(page_title="Hybrid Movie Recommender", page_icon="🎬", layout="wide")

# Minimal CSS for card-style layout
CARD_CSS = """
<style>
.card {
	border-radius: 12px;
	background: #ffffff10;
	padding: 12px;
	box-shadow: 0 2px 12px rgba(0,0,0,0.15);
	height: 100%;
	border: 1px solid rgba(255,255,255,0.15);
}
.poster {
	width: 100%;
	border-radius: 8px;
}
.title {font-weight: 700; margin-top: 8px;}
.meta {opacity: 0.85; font-size: 0.9rem;}
.score {font-size: 0.9rem; margin-top: 6px;}
</style>
"""

st.markdown(CARD_CSS, unsafe_allow_html=True)

@st.cache_resource(show_spinner=False)
def get_data():
	mld = load_movielens(DATA_DIR)
	pop = build_popularity(mld)
	return mld, pop

@st.cache_resource(show_spinner=False)
def get_models(mld):
	vectorizer, tfidf, sim = fit_content_model(mld.movies, mld.tags)
	cf = train_svd(mld.ratings)
	return (vectorizer, tfidf, sim), cf


def ensure_dataset():
	if not DATA_DIR.exists():
		st.warning("Dataset not found. Click the button to download MovieLens ml-latest-small.")
		if st.button("Download Dataset"):
			from scripts.download_movielens import download_and_extract, ML_SMALL_URL
			download_and_extract(ML_SMALL_URL, Path("data"))
			st.experimental_rerun()


def render_cards(df: pd.DataFrame):
	cols = st.columns(5)
	for i, (_, row) in enumerate(df.iterrows()):
		col = cols[i % 5]
		with col:
			with st.container(border=False):
				st.markdown('<div class="card">', unsafe_allow_html=True)
				poster = get_poster_url(row["clean_title"], None if pd.isna(row["year"]) else int(row["year"]))
				st.image(poster, use_column_width=True)
				st.markdown(f"<div class=title>{row['clean_title']}</div>", unsafe_allow_html=True)
				st.markdown(f"<div class=meta>{', '.join(row['genres_list'])}</div>", unsafe_allow_html=True)
				st.markdown(f"<div class=score>Hybrid: {row['hybrid_score']:.3f} | CF: {row['cf_score']:.3f} | Content: {row['content_score']:.3f}</div>", unsafe_allow_html=True)
				st.markdown('</div>', unsafe_allow_html=True)


def main():
	st.title("🎬 Hybrid Movie Recommender")
	st.caption("MovieLens ml-latest-small | SVD + TF-IDF (genres + tags)")

	ensure_dataset()
	if not DATA_DIR.exists():
		st.stop()

	with st.spinner("Loading data and training models..."):
		mld, pop = get_data()
		(content_vec, tfidf, sim), cf_model = get_models(mld)

	st.sidebar.header("Input")
	mode = st.sidebar.radio("Mode", ["Existing User ID", "Pick Likes/Dislikes"])
	top_n = st.sidebar.slider("Top N", 5, 20, 10)
	alpha_cf = st.sidebar.slider("CF weight", 0.0, 1.0, 0.6, 0.05)
	alpha_content = 1.0 - alpha_cf

	all_movie_ids = mld.movies["movieId"].tolist()

	liked_ids: List[int] = []
	disliked_ids: List[int] = []
	user_id = None
	existing_user_ids = sorted(mld.ratings["userId"].unique().tolist())

	if mode == "Existing User ID":
		user_id = st.sidebar.selectbox("User ID", existing_user_ids, index=0)
		user_rated = mld.ratings[mld.ratings["userId"] == user_id]["movieId"].tolist()
		st.sidebar.caption(f"User has rated {len(user_rated)} movies")
		exclude = user_rated
	else:
		search_titles = mld.movies.sort_values("clean_title")["clean_title"].tolist()
		likes = st.sidebar.multiselect("Liked movies", search_titles[:5000])
		dislikes = st.sidebar.multiselect("Disliked movies", search_titles[:5000])
		# Map back to ids
		liked_ids = mld.movies[mld.movies["clean_title"].isin(likes)]["movieId"].tolist()
		disliked_ids = mld.movies[mld.movies["clean_title"].isin(dislikes)]["movieId"].tolist()
		exclude = liked_ids + disliked_ids

	if st.sidebar.button("Recommend"):
		with st.spinner("Scoring recommendations..."):
			recs = hybrid_recommend(
				movies=mld.movies,
				cf_model=cf_model,
				content_sim_matrix=sim,
				all_movie_ids=all_movie_ids,
				user_id=user_id,
				liked_movie_ids=liked_ids,
				disliked_movie_ids=disliked_ids,
				alpha_cf=alpha_cf,
				alpha_content=alpha_content,
				exclude_rated=exclude,
				top_n=top_n,
			)

			st.subheader("Top Recommendations")
			render_cards(recs)

	st.divider()
	st.subheader("Analytics")
	col1, col2, col3 = st.columns([1,1,1])
	with col1:
		st.metric("Ratings count", len(mld.ratings))
		st.metric("Users", mld.ratings["userId"].nunique())
		st.metric("Movies", len(mld.movies))
	with col2:
		st.write("Model RMSE (cf):", f"{cf_model.rmse:.4f}")
	with col3:
		top_pop = (
			mld.movies.merge(pop, on="movieId").sort_values(["pop_count", "pop_mean"], ascending=False).head(10)
		)
		st.write("Most Rated Movies:")
		st.dataframe(top_pop[["clean_title","genres","pop_count","pop_mean"]], hide_index=True, use_container_width=True)


if __name__ == "__main__":
	main()