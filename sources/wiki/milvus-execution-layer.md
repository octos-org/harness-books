---
kind: entity
sources: [https://milvus.io/ai-quick-reference/harness-engineering-the-execution-layer-ai-agents-actually-need, https://milvus.io/blog/harness-engineering-ai-agents.md]
related: [concept-harness, concept-memory-layer, concept-execution-sandbox, concept-tool-vocabulary, fowler-on-harness, anthropic-harness-design, openai-harness-engineering, medium-oldest-new-idea]
updated: 2026-04-22
---

# Milvus — Harness Engineering: The Execution Layer

Milvus's position paper reframes harness engineering from the vantage of the **data substrate**: a raw LLM call is not an agent; the *execution layer* — the machinery that routes tool calls, manages state, and coordinates memory against a vector / graph store — is what makes an agent functional in production. Source: [Milvus — The Execution Layer AI Agents Actually Need](https://milvus.io/ai-quick-reference/harness-engineering-the-execution-layer-ai-agents-actually-need).

## Core thesis

> The brain (LLM) generates candidate actions; the execution layer turns those candidates into real operations. Without it, every agent action has to fit inside one prompt/response — which does not scale past toys.

This is the same move [[fowler-on-harness]] makes with "controls" and [[anthropic-harness-design]] makes with "assumptions to stress-test," but Milvus centers it on the **retrieval substrate** — the part most frameworks treat as a sidecar.

## The five components of the execution layer

1. **Tool dispatcher** — which tool, which arguments, under what permission. See [[concept-tool-vocabulary]].
2. **State store** — session state, working memory, intermediate results. See [[concept-state-durability]].
3. **Memory substrate** — vector DB / graph store for long-term recall. See [[concept-memory-layer]].
4. **Retrieval orchestration** — which index to query, when, and how to rerank.
5. **Observability** — traces, logs, metrics over every action. See [[concept-observability]].

Compare with [[openai-harness-engineering]]'s six components (memory / tools / state / context / execution / evaluation): Milvus collapses *context* and *memory* into the substrate and promotes *observability* to first class.

## What Milvus adds that the others don't

- **Retrieval as execution, not context**. In the [[concept-prompt-vs-context-vs-harness]] taxonomy, most frameworks file retrieval under *context engineering* ("stuff the right chunks into the prompt"). Milvus argues retrieval is an *executed action* under harness control — when to query, which index, how to rerank, and what to do when results are thin are all runtime decisions the harness must own.
- **Hybrid vector + graph**. Pure vector RAG has failure modes (loss of entity structure, poor multi-hop). Harnesses that own the retrieval layer can route between semantic similarity (vector) and symbolic walks (graph) per query.
- **The data substrate has opinions**. Index choice, embedding model, chunk granularity, and TTL policy are *harness decisions* — they change what the agent can remember and therefore what it can do. This is the dual of [[neo4j-context-vs-prompt]]'s argument from the graph side.

## Load-bearing quotes

> "No matter how smart the model, it still needs a place to put evidence and a way to get it back."

> "Retrieval is not a sidecar; it's part of the execution layer."

## Where this lands in the book

- Chapter on the 6-component anatomy (memory + tools + state + context + execution + evaluation) cites Milvus as the strongest argument for promoting the *data substrate* from appendix to chapter.
- The durability-resume axis (see plan) extends Milvus: if memory is a harness component, resuming a crashed agent means resuming against a *consistent snapshot* of that memory, not a fresh vector store. This is beyond what the Milvus piece itself covers.
