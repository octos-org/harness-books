#!/usr/bin/env python3
from __future__ import annotations

import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "sources" / "large-mdbook-src"
ORIGINAL = ROOT / "original-book"


def main() -> None:
    src_dir = ORIGINAL / "src"
    if src_dir.exists():
        shutil.rmtree(src_dir)
    src_dir.mkdir(parents=True, exist_ok=True)

    for path in SOURCE.iterdir():
        if path.is_file():
            shutil.copy2(path, src_dir / path.name)

    (ORIGINAL / "book.toml").write_text(
        "[book]\n"
        "title = \"驾驭工程：原始完整书稿\"\n"
        "authors = [\"Octos Harness Research\"]\n"
        "language = \"zh-CN\"\n"
        "src = \"src\"\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
