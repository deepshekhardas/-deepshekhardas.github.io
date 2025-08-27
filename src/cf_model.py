from __future__ import annotations

from typing import Iterable, List, Tuple

import numpy as np
import pandas as pd
from surprise import Dataset, Reader, SVD
from surprise.model_selection import train_test_split
from surprise.accuracy import rmse


class SVDModel:
	def __init__(self, model: SVD, trainset):
		self.model = model
		self.trainset = trainset
		self.rmse = None


def train_svd(ratings: pd.DataFrame, n_factors: int = 100, n_epochs: int = 20, random_state: int = 42) -> SVDModel:
	reader = Reader(rating_scale=(ratings["rating"].min(), ratings["rating"].max()))
	dataset = Dataset.load_from_df(ratings[["userId", "movieId", "rating"]], reader)
	trainset, testset = train_test_split(dataset, test_size=0.2, random_state=random_state)

	algo = SVD(n_factors=n_factors, n_epochs=n_epochs, biased=True, random_state=random_state, verbose=False)
	algo.fit(trainset)
	preds = algo.test(testset)
	err = rmse(preds, verbose=False)
	wrapper = SVDModel(algo, trainset)
	wrapper.rmse = err
	return wrapper


def predict_for_user(model: SVDModel, user_id: int, candidate_movie_ids: Iterable[int]) -> pd.Series:
	algo = model.model
	# surprise expects raw ids; it will map internally via trainset
	preds = [algo.predict(uid=user_id, iid=mid, r_ui=None, verbose=False) for mid in candidate_movie_ids]
	ests = {int(p.iid): p.est for p in preds}
	return pd.Series(ests)