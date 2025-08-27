#!/usr/bin/env python3
import argparse
import io
import os
import sys
import zipfile
from pathlib import Path

import requests

ML_SMALL_URL = "https://files.grouplens.org/datasets/movielens/ml-latest-small.zip"


def download_and_extract(url: str, out_dir: Path) -> Path:
	out_dir.mkdir(parents=True, exist_ok=True)
	zip_path = out_dir / "ml-latest-small.zip"
	print(f"Downloading {url} -> {zip_path} ...")
	r = requests.get(url, timeout=60)
	r.raise_for_status()
	zip_path.write_bytes(r.content)

	print("Extracting...")
	with zipfile.ZipFile(io.BytesIO(r.content)) as zf:
		zf.extractall(out_dir)

	dataset_dir = out_dir / "ml-latest-small"
	if not dataset_dir.exists():
		print("Extraction failed: directory not found", file=sys.stderr)
		sys.exit(1)
	print(f"Dataset available at: {dataset_dir}")
	return dataset_dir


def main():
	parser = argparse.ArgumentParser(description="Download MovieLens ml-latest-small")
	parser.add_argument("--out_dir", type=str, default="data", help="Output directory")
	args = parser.parse_args()

	out = Path(args.out_dir)
	download_and_extract(ML_SMALL_URL, out)


if __name__ == "__main__":
	main()