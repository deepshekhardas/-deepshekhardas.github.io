import os
from recommender import ensure_movielens_small, load_datasets, load_or_train_svd


def main():
    data_dir = ensure_movielens_small("data")
    _, ratings_df, _ = load_datasets(data_dir)
    _, rmse = load_or_train_svd(ratings_df, save_dir="models")
    print(f"Trained SVD model. RMSE: {rmse:.4f}")


if __name__ == "__main__":
    main()
