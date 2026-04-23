---
kind: entity
sources: [https://www.aios.foundation/, https://arxiv.org/abs/2403.16971, https://github.com/agiresearch/AIOS]
related: [anthropic-harness-design, concept-harness, openai-harness-engineering, milvus-execution-layer, concept-prompt-vs-context-vs-harness]
updated: 2026-04-22
---

# AIOS — LLM Agent Operating System

**Primary sources:**
- Project home: [aios.foundation](https://www.aios.foundation/)
- Paper (COLM 2025): [arXiv:2403.16971](https://arxiv.org/abs/2403.16971)
- Code: [github.com/agiresearch/AIOS](https://github.com/agiresearch/AIOS)

## Thesis — the most literal harness claim on record

AIOS is the **research / open-source twin** of the [[anthropic-harness-design]] "Managed Agents" position. Where Anthropic keeps the OS analogy implicit, AIOS makes it explicit: **LLM as OS, Agents as Apps.** Agents issue syscalls; a kernel schedules, dispatches, manages memory, and mediates tool access on their behalf. Same architectural bet, independent evidence.

This is exactly the claim *驾驭工程* wants to stress-test: the interesting engineering is **not** inside the prompt or the model — it's in the kernel-shaped layer around them.

## The five problems AIOS names (and how they map to the book)

1. **Resource management** — preventing unrestricted access to LLM + tool resources → **Tools pillar**
2. **Scheduling** — concurrent processing of multiple agents → **Harness pillar**
3. **Context switching** — between agent tasks → **Harness pillar** (see [[concept-prompt-vs-context-vs-harness]])
4. **Memory management** — allocation + lifecycle → **Session / memory pillar**
5. **Access control** — authorization + governance → **Tools pillar**

Verification is conspicuously missing from the AIOS framing — AIOS is about *running* agents, not *evaluating* them. That gap is where [[case-karpathy-autoresearch]] and the evaluation-harness concept have to fill in.

## Two-layer architecture — lifted from the paper

### AIOS Kernel
- **LLM Core(s)** — model execution
- **Context Manager** — contextual state ([[neo4j-context-vs-prompt]] argues this is where the win lives)
- **Memory Manager** — agent memory ops
- **Storage Manager** — persistent data
- **Tool Manager** — registry + invocation control (compare to [[openai-harness-engineering]] tool-vocabulary framing)

### AIOS SDK (`Cerebrum`)
- Agent-facing API — agents don't touch the kernel directly; they call SDK primitives that translate to kernel syscalls.
- Same separation-of-concerns logic that [[milvus-execution-layer]] makes for vector-store execution.

## Why it belongs in the book's arc

AIOS gives the book a **primary-source scientific artifact** (peer-reviewed at COLM 2025) to anchor the otherwise-industry-blog-heavy set of references. It also provides a cleanly enumerated problem taxonomy — the five problems above — which the harness-anatomy SVG can reuse as labels.

Cross-link: this page is the OS-theoretic grounding for [[concept-harness]].
