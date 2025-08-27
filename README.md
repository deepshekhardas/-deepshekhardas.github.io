# MovieLens Hybrid Recommender (Streamlit)

A hybrid movie recommendation system combining Collaborative Filtering (SVD) with Content-Based similarity (genres + tags), presented with a modern Streamlit UI.

## Features
- Hybrid scoring: SVD CF + TF-IDF (genres + tags)
- Enter an existing user ID or pick liked/disliked movies
- Top-N recommendations with posters, genres, and predicted ratings
- Optional analytics: top genres, popular movies
- Optional TMDB poster lookup via `TMDB_API_KEY`; falls back to placeholder

## Setup
1. Python 3.10+ recommended
2. Install dependencies:
```bash
pip install -r requirements.txt
```
3. Download MovieLens (ml-latest-small):
```bash
python scripts/download_movielens.py --out_dir data
```
4. Run the app:
```bash
streamlit run app.py
```

## Environment
- Optional: export `TMDB_API_KEY` for posters
```bash
export TMDB_API_KEY=your_key_here
```

## Notes
- The SVD model is (re)trained on startup for demo simplicity (small dataset). When you adjust liked/disliked movies, the system may re-fit quickly to include your new ratings.
- This is a demo-oriented implementation prioritizing clarity and presentation.