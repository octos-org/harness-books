---
kind: case
sources: [https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f]
related: [concept-harness, concept-memory-layer, concept-incremental-research, fowler-on-harness]
updated: 2026-04-22
---

# Case · Karpathy's LLM-Wiki Auto-Research Pattern

Andrej Karpathy's [LLM-wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) is the most compact existing description of what this book calls the **memory pillar done right** — and it is, notably, not a prompt-engineering document at all. It is a *harness* specification, even though Karpathy does not use the word. The entire design lives outside the model: raw sources on one side, a query interface on the other, and between them a **maintained, LLM-compiled markdown wiki** that compounds across ingests.

## The three-layer architecture

> Raw Sources → Maintained Wiki → Query Interface

The load-bearing move is the middle layer. Traditional RAG rediscovers information on every query; Karpathy's pattern compiles once at ingest and pays a retrieval cost only against the compiled artifact. The wiki is the agent's externalized long-term memory — closer to a compiler's symbol table than to a chat transcript. This is precisely the distinction [[fowler-on-harness]] makes between *session-scoped context* and *durable state*, and why [[concept-memory-layer]] needs to be a first-class harness component rather than a retrieval plugin.

## The three operations

- **Ingest** — extracts, summarizes, updates entity pages, maintains cross-references across 10–15 files at once. This is where the harness earns its keep: a human would spend hours on bookkeeping; the LLM turns bookkeeping into a background job.
- **Query** — synthesizes over the wiki; valuable queries can be *filed back* as new pages, so the knowledge graph densifies with use.
- **Lint** — periodic health checks for contradictions, stale claims, orphaned pages, and gaps. This is the evaluation pillar applied inward, to the harness's own memory.

Two special navigation files hold the whole thing together: `index.md` (content catalog, rewritten every ingest) and `log.md` (append-only chronological record). The split between *rewritten* and *append-only* is itself a harness pattern — it separates what must stay consistent from what must stay auditable.

## The load-bearing quote

> "The tedious part of maintaining a knowledge base is not reading or thinking — it's bookkeeping."

This is the harness thesis in one sentence, generalized beyond the wiki case: *the tedious parts of LLM applications are not prompting or reasoning — they are the bookkeeping of state, tools, memory, and execution.* The harness automates the bookkeeping so that humans (or the model) can focus on judgment.

## Real-world tensions (why this is a case study, not a recipe)

The gist's discussion surfaces four failure modes that any harness built on this pattern has to budget for:

1. **Scale** — `index.md` stops working as a flat catalog past ~100–200 pages; a secondary retrieval layer (embeddings, graph index) must appear.
2. **Drift** — lossy synthesis means the wiki diverges from sources over time; the lint operation is the antibody.
3. **Contradiction policy** — when a new source disagrees with an archived claim, there is no default resolution; the schema has to declare one, or the wiki silently rots.
4. **Determinism** — runs vary; the same ingest can produce different wiki deltas. Reproducibility lives in the schema and the log, not in the model call.

Each of these reappears, with different names, in [[openai-harness-engineering]] (drift ≈ context collapse) and will resurface in the chapter on [[concept-evaluation-harness]].

## Why this case matters for the book

Karpathy's pattern is the session you are currently reading — literally. The loop that produced this wiki page *is* an instance of the three-layer architecture, applied recursively. That is not coincidence; it is evidence that the pattern generalizes. Every later case — [[case-claude-code]], [[case-aider]], [[case-ascent-research]] — will be compared back to this one along the same axis: *where does the durable state live, and who maintains it?*
