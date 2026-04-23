# Harness Engineering Book

This repository contains an outline-synced Harness Engineering book for Octos.

The short Octos outline is the controlling structure. The larger half-written
mdBook source is folded into that outline as expanded source material.

## Outputs

- `OCTOS_HARNESS_ENGINEERING_AI_SOFTWARE_FACTORY_FULL_SYNCED.md` is the single-file edition.
- `synced-book/src/` is the mdBook source.
- `synced-book/book/` is the built HTML book.
- `SYNC_MAP.md` documents how the short outline maps to the larger source.

Open the built book locally:

```bash
open synced-book/book/index.html
```

Regenerate the synced book:

```bash
python3 tools/assemble_synced_book.py
mdbook build synced-book
mdbook build synced-book-zh
python3 tools/build_pages.py
```

GitHub Pages is served from `docs/`:

- `/en/` contains the English-outline edition.
- `/zh/` contains the Chinese-outline edition.

## Sources

- `sources/octos-outline/` contains the shorter Octos outline.
- `sources/large-mdbook-src/` contains the larger mdBook source snapshot.
- `sources/wiki/` contains the wiki notes used by the larger source.
