#!/usr/bin/env python3
from __future__ import annotations

import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"


def copy_book(source: Path, target: Path) -> None:
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(source, target)


def main() -> None:
    DOCS.mkdir(exist_ok=True)
    copy_book(ROOT / "synced-book" / "book", DOCS / "en")
    copy_book(ROOT / "synced-book-zh" / "book", DOCS / "zh")
    copy_book(ROOT / "original-book" / "book", DOCS / "original")

    (DOCS / ".nojekyll").write_text("", encoding="utf-8")
    (DOCS / "index.html").write_text(
        """<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>驾驭工程 / Harness Engineering Book</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f7f7f4;
      color: #191919;
    }
    main {
      max-width: 860px;
      margin: 0 auto;
      padding: 72px 24px;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 42px;
      line-height: 1.1;
      letter-spacing: 0;
    }
    p {
      max-width: 680px;
      font-size: 18px;
      line-height: 1.6;
      color: #4b4b45;
    }
    .links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-top: 32px;
    }
    a {
      display: block;
      padding: 18px 20px;
      border: 1px solid #d6d2c8;
      border-radius: 8px;
      color: inherit;
      text-decoration: none;
      background: #fff;
    }
    a strong { display: block; font-size: 20px; margin-bottom: 6px; }
    a span { color: #666159; line-height: 1.45; }
    @media (prefers-color-scheme: dark) {
      body { background: #171717; color: #f3f0e8; }
      p { color: #c8c2b8; }
      a { background: #222; border-color: #3a3834; }
      a span { color: #b8b0a5; }
    }
  </style>
</head>
<body>
  <main>
    <h1>驾驭工程</h1>
    <p>基于当前提纲与较大的 harness-engineering mdBook 源材料生成的纲要版。</p>
    <section class="links" aria-label="Book editions">
      <a href="./en/">
        <strong>English Outline Edition</strong>
        <span>English navigation edition using the current outline as the table of contents.</span>
      </a>
      <a href="./zh/">
        <strong>中文纲要版</strong>
        <span>使用中文纲要正文和中文目录，保留必要技术名词、代码标识符和原文标题。</span>
      </a>
      <a href="./original/">
        <strong>原始完整书稿</strong>
        <span>保留较大 mdBook 源书的原始章节顺序和全部正文内容。</span>
      </a>
    </section>
  </main>
</body>
</html>
""",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
