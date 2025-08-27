#!/usr/bin/env python3
from pathlib import Path

from src.data_loader import load_movielens
from src.content_model import fit_content_model
from src.cf_model import train_svd
from src.hybrid import hybrid_recommend

DATA_DIR = Path("data/ml-latest-small")

def main():
	print("Loading data...")
	mld = load_movielens(DATA_DIR)
	print(f"Movies: {len(mld.movies)}, Ratings: {len(mld.ratings)}, Tags: {len(mld.tags)}")
	print("Training content model...")
	_, _, sim = fit_content_model(mld.movies, mld.tags)
	print("Training SVD model...")
	cf = train_svd(mld.ratings)
	print(f"CF RMSE: {cf.rmse:.4f}")

	user_id = int(mld.ratings['userId'].sample(1, random_state=42).iloc[0])
	print(f"Generating recommendations for user {user_id}...")
	all_movie_ids = mld.movies['movieId'].tolist()
	user_rated = mld.ratings[mld.ratings['userId'] == user_id]['movieId'].tolist()
	recs = hybrid_recommend(
		movies=mld.movies,
		cf_model=cf,
		content_sim_matrix=sim,
		all_movie_ids=all_movie_ids,
		user_id=user_id,
		exclude_rated=user_rated,
		top_n=5,
	)
	for i, row in recs.iterrows():
		print(f"- {row['clean_title']} ({row['year']}) -> {row['hybrid_score']:.3f}")

if __name__ == "__main__":
	main()