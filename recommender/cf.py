from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional, Tuple

import joblib
import numpy as np
import pandas as pd

try:
    from surprise import Dataset, Reader, SVD, accuracy
    from surprise.model_selection import train_test_split
    HAS_SURPRISE = True
except Exception:  # pragma: no cover
    HAS_SURPRISE = False
    from sklearn.decomposition import TruncatedSVD


@dataclass
class SVDBundle:
    algo: object
    rmse: float
    backend: str  # "surprise" or "sklearn"
    trainset: Optional[object] = None


class SklearnSVDWrapper:
    def __init__(self, bundle: Dict):
        self.bundle = bundle
        self.trainset = None  # parity with Surprise API

    def predict(self, uid: int, iid: int):
        b = self.bundle
        i = b["user_to_idx"].get(uid, None)
        j = b["movie_to_idx"].get(iid, None)
        if i is None or j is None:
            est = b["global_mean"]
        else:
            uf = b["user_factors"][i]
            itf = b["item_factors"][j]
            est = float(uf @ itf) + float(b["item_means"][j])
        return type("Pred", (), {"est": float(est)})


def _train_surprise(ratings_df: pd.DataFrame, random_state: int = 42) -> SVDBundle:
    reader = Reader(rating_scale=(ratings_df["rating"].min(), ratings_df["rating"].max()))
    data = Dataset.load_from_df(ratings_df[["userId", "movieId", "rating"]], reader)

    trainset, testset = train_test_split(data, test_size=0.2, random_state=random_state)
    algo = SVD(n_factors=100, n_epochs=20, lr_all=0.005, reg_all=0.02, random_state=random_state)
    algo.fit(trainset)
    predictions = algo.test(testset)
    rmse = float(accuracy.rmse(predictions, verbose=False))

    full_trainset = data.build_full_trainset()
    algo.fit(full_trainset)
    return SVDBundle(algo=algo, rmse=rmse, backend="surprise", trainset=algo.trainset)


def _train_sklearn(ratings_df: pd.DataFrame, random_state: int = 42) -> SVDBundle:
    users = sorted(ratings_df["userId"].unique())
    movies = sorted(ratings_df["movieId"].unique())
    user_to_idx = {u: i for i, u in enumerate(users)}
    movie_to_idx = {m: i for i, m in enumerate(movies)}

    mat = np.zeros((len(users), len(movies)), dtype=np.float32)
    counts = np.zeros_like(mat)
    for _, row in ratings_df.iterrows():
        i = user_to_idx[int(row["userId"])]
        j = movie_to_idx[int(row["movieId"])]
        mat[i, j] = float(row["rating"])  # overwrite OK
        counts[i, j] = 1.0

    nonzero = counts > 0
    global_mean = mat[nonzero].mean() if nonzero.any() else 3.5

    with np.errstate(invalid="ignore"):
        item_means = np.divide(
            mat.sum(axis=0),
            counts.sum(axis=0),
            out=np.full(mat.shape[1], global_mean, dtype=np.float32),
            where=counts.sum(axis=0) > 0,
        )

    centered = np.where(nonzero, mat - item_means, 0.0)
    n_components = max(20, min(100, min(centered.shape) - 1))
    svd = TruncatedSVD(n_components=n_components, random_state=random_state)
    user_factors = svd.fit_transform(centered)
    item_factors = svd.components_.T

    b = {
        "user_to_idx": user_to_idx,
        "movie_to_idx": movie_to_idx,
        "users": users,
        "movies": movies,
        "user_factors": user_factors,
        "item_factors": item_factors,
        "global_mean": float(global_mean),
        "item_means": item_means.astype(np.float32),
    }

    recon = (user_factors @ item_factors.T) + item_means
    obs_pred = recon[nonzero]
    obs_true = mat[nonzero]
    rmse = float(np.sqrt(np.mean((obs_true - obs_pred) ** 2))) if obs_true.size else 0.0

    algo = SklearnSVDWrapper(b)
    return SVDBundle(algo=algo, rmse=rmse, backend="sklearn", trainset=None)


def train_svd_model(
    ratings_df: pd.DataFrame,
    random_state: int = 42,
) -> SVDBundle:
    if HAS_SURPRISE:
        return _train_surprise(ratings_df, random_state=random_state)
    return _train_sklearn(ratings_df, random_state=random_state)


def load_or_train_svd(ratings_df: pd.DataFrame, save_dir: str = "models") -> Tuple[Dict, float]:
    save_path = Path(save_dir)
    save_path.mkdir(parents=True, exist_ok=True)
    model_file = save_path / "svd_algo.joblib"

    if model_file.exists():
        algo = joblib.load(model_file)
        rmse: float = float(getattr(algo, "_cached_rmse", 0.9))
        return {"algo": algo, "trainset": getattr(algo, "trainset", None)}, rmse

    bundle = train_svd_model(ratings_df)
    setattr(bundle.algo, "_cached_rmse", bundle.rmse)
    joblib.dump(bundle.algo, model_file)
    return {"algo": bundle.algo, "trainset": getattr(bundle, "trainset", None)}, bundle.rmse


def predict_scores_for_user(
    user_id: int,
    movies_df: pd.DataFrame,
    ratings_df: pd.DataFrame,
    svd_bundle: Dict,
) -> pd.DataFrame:
    algo = svd_bundle["algo"]

    user_rated = set(ratings_df.loc[ratings_df["userId"] == user_id, "movieId"].tolist())
    preds = []
    for mid in movies_df["movieId"].tolist():
        if mid in user_rated:
            continue
        est = algo.predict(user_id, mid).est
        preds.append((mid, est))

    pred_df = pd.DataFrame(preds, columns=["movieId", "cf_score"])
    return pred_df
