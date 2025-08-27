## Movie Recommendation System (Hybrid: SVD + Content)

An advanced, presentation-ready MovieLens recommender combining collaborative filtering (SVD) with content-based similarity (genres + tags). Built with Streamlit.

### Features
- Hybrid scoring: SVD CF + TF-IDF content similarity
- Cold-start support via likes/dislikes (content-based)
- Top-10 recommendations with posters, titles, genres, and scores
- Model evaluation (RMSE)
- Optional analytics (top genres, popular movies)

### Dataset
Automatically downloads MovieLens `ml-latest-small` (~100k ratings).

### Quick Start

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
streamlit run app.py
```

Optionally, pre-train and cache the SVD model:
```bash
python scripts/train.py
```

Set an API key for higher-quality posters (optional):
- OMDb: export `OMDB_API_KEY=your_key`
- or TMDb: export `TMDB_API_KEY=your_key`

Without a key, a placeholder image is shown.

### Project Structure
```
app.py
recommender/
  __init__.py
  data.py
  content.py
  cf.py
  hybrid.py
  posters.py
scripts/
  train.py
```

### Notes
- First run will download the dataset and train the SVD model (cached).
- For unknown users, the app uses content similarity from likes/dislikes.
- For known users, the app combines SVD predictions with content similarity.
