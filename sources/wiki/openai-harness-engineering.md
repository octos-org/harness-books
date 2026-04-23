---
kind: entity
sources: [https://openai.com/index/harness-engineering/]
related: [concept-harness, fowler-on-harness, concept-tool-vocabulary, concept-evaluation-harness, concept-memory-layer, case-codex]
updated: 2026-04-22
---

# OpenAI — Harness Engineering

> *"Extreme Harness Engineering for Token Billionaires: 1M LOC, 1B toks/day, 0% human code, 0% human review."*
> — OpenAI Frontier team, via Latent Space

**Canonical source:** [OpenAI · Harness Engineering: Leveraging Codex in an Agent-First World](https://openai.com/index/harness-engineering/) (Feb 2026).

This is the **load-bearing primary source** for *驾驭工程* — the strongest public statement to date that the interesting engineering in an LLM-native team has moved out of the model and into the runtime scaffolding around it. The article names the practice ("harness engineering"), quantifies it, and describes the specific artifacts that constitute the harness at OpenAI's own Codex team.

## The experiment, in numbers

- First commit **late Aug 2025** → by **Feb 2026** (≈ 5 months): ~**1M LOC**, ~**1,500 merged PRs**.
- **Three engineers** driving Codex as their primary author. Throughput averaged **3.5 PRs / engineer / day**.
- **Zero human-written code.** The team adopted this as a philosophy, not just a statistic — a hard constraint that forces the harness to carry the weight.
- **~1B tokens / day** consumed by the agent loop.

These numbers matter because they refute the "agents are a toy" framing. They also refute the "just write better prompts" framing: at this token scale, prompt micro-engineering is rounding error. The leverage is in the scaffolding.

## Core philosophy

Harness Engineering = **designing the runtime scaffolding around LLM code-generation agents so the agent can work with minimum human intervention**. The engineer moves up the stack — from writing code to designing the *conditions* under which the agent writes correct code.

This aligns with the [[concept-harness]] definition used throughout this book: the harness is everything around the model that makes a useful system — tools, memory, state, context assembly, execution, evaluation. Prompts live inside the harness; the harness outlives any particular prompt or model version.

## AGENTS.md as table of contents, not encyclopedia

One of the article's most transferable design patterns, and the clearest worked example of [[concept-tool-vocabulary]] + context economy in practice:

- `AGENTS.md` = **the map.** Short. Pointers to deeper sources of truth. This is what gets injected into the agent's context on every turn.
- `docs/` = **the system of record.** Structured by topic. Loaded on-demand via the pointers in `AGENTS.md`.
- **Principles always in scope; details pulled when needed.** This is a concrete answer to the context-window-is-finite problem, and it generalizes far beyond code agents.

The anti-pattern this explicitly rejects: stuffing the entire style guide / architecture doc / API reference into the system prompt. That approach scales badly, burns tokens, and — more importantly — teaches the agent that context is "whatever was written down once," not "whatever is relevant right now."

## What engineers now spend their time on

The article enumerates the harness-engineer's actual job. Every item on this list is scaffolding, not code:

1. **Reproducible dev environments** — so the agent's "does it work?" check is deterministic.
2. **CI-enforced architectural constraints** — the harness catches shape violations the agent cannot self-diagnose.
3. **Test infrastructure** — fast, hermetic, agent-runnable. See also [[concept-evaluation-harness]].
4. **Feedback-loop design** — what signals flow back to the agent on failure? Stack trace? Diff? Rendered UI screenshot?
5. **PR templates + review criteria** — the harness encodes human taste as checkable rules.
6. **Agent instruction files structured around retrieval, not inlining** — the `AGENTS.md` → `docs/` pattern above.

## The bet

At sufficient scale, the human bottleneck moves from **writing code** to **designing the harness that lets agents write code correctly**. Every item in the list above is a place where a human's judgment is encoded *once* and amortized across thousands of agent turns.

This is the same bet Fowler makes from the outside ([[fowler-on-harness]]) and the same bet this book argues is the central engineering story of the LLM era: prompts and models are commodities, the harness is where the compounding value lives.

## How this source is used in the book

- Opening of [[chapter-01-invisible-harness]] — the 1M-LOC / 3-engineer statistic is the hook that refutes "LLM apps = prompt + model."
- Chapter 4 (tools + context) — `AGENTS.md` as table-of-contents is the canonical example of context economy.
- Chapter 6 (harness as platform) — the "engineer moves up the stack" framing anchors the closing argument.
- Cross-references: [[concept-prompt-vs-context-vs-harness]] (OpenAI makes the layering explicit); [[case-codex]] (the tool this harness is built around).