---
kind: entity
sources: [https://martinfowler.com/articles/harness-engineering.html]
related: [concept-harness, concept-prompt-vs-context-vs-harness, concept-evaluation-harness, concept-observability]
updated: 2026-04-22
---

# Fowler / Böckeler · *Harness Engineering for Coding Agent Users*

Birgitta Böckeler's April 2026 essay on [martinfowler.com](https://martinfowler.com/articles/harness-engineering.html) is the load-bearing public definition of the term. It states the equation plainly: **Agent = Model + Harness**, where the harness is *everything around the model except the model itself*. The model is non-deterministic, lacks project context, and doesn't really understand the code; the harness is the guides and sensors — feedforward and feedback — that close the gap.

## The two control types

Böckeler splits harness regulation into two kinds, and the distinction is the analytic spine of the whole essay:

- **Computational controls** — deterministic, cheap, fast. Linters, type-checkers, tests, structural analysis. Cheap enough to run on every change, so they can be wired directly into the agent loop.
- **Inferential controls** — slower, expensive, non-deterministic. AI code review, semantic duplicate detection, "is this overengineered?" judgments. Useful where deterministic checks cannot express the property.

This pairing is what [[concept-harness]] borrows as its first-order decomposition.

## The steering loop

The operator's job is **not** to review every agent output. It is to iterate on the harness itself. When an issue recurs, the fix is to strengthen feedforward/feedback controls — never to re-explain to the agent. This reframes "prompt engineering" as a local coping strategy and elevates harness iteration as the real work.

## Three regulation categories (in increasing difficulty)

1. **Maintainability harness** — easiest; existing tools already cover most of it.
2. **Architecture fitness harness** — skills + tests for performance, observability, module boundaries.
3. **Behaviour harness** — hardest. AI-generated test suites are insufficient. Böckeler flags this as an **open problem**.

## Harnessability

Not all codebases are equally amenable to harnessing. Strong types, clear module boundaries, and framework structure give the agent *ambient affordances*. Legacy code needs the harness most but provides the fewest affordances — the central harnessability paradox.

## Ashby's Law applied

Böckeler cites Ashby's Law of Requisite Variety: a regulator must have at least as much variety as what it governs. Since LLMs can output anything, **committing to narrower topologies** (templates, frameworks, conventions) is what makes comprehensive harnesses achievable. This is the theoretical warrant for the "harness template" pattern that recurs across [[case-claude-code]], [[case-aider]], and similar tools.

## Why this source anchors the book

Böckeler provides: (1) the equation Agent = Model + Harness, (2) the computational/inferential split, (3) the steering-loop reframing, (4) the harnessability concept, and (5) the Ashby's Law warrant. Every later chapter of *驾驭工程* cites this page as the starting point of the vocabulary. The [[concept-prompt-vs-context-vs-harness]] taxonomy is constructed *against* this definition, extending it from coding agents to LLM-native apps generally.


<!-- appended 2026-04-22 -->

## 在本书中的角色

Fowler 的贡献不是发明 harness 这个概念,而是在 2024 年把它从工程民间术语提升为可公开引用的名词。本书把 [[fowler-on-harness]] 当作术语来源引用,在 ## 01 · WHY 开篇与 [[ariely-big-data-quote]] 并列出现,构成本书的双重锚点:一个给问题命名(Fowler),一个给问题定调(Ariely)。
