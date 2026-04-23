---
kind: concept
sources: [https://neo4j.com/blog/developer/context-engineering/, https://www.nxcode.io/resources/news/what-is-harness-engineering-complete-guide-2026, https://martinfowler.com/articles/exploring-gen-ai/]
related: [concept-harness, fowler-on-harness, openai-harness-engineering, anthropic-harness-design, neo4j-context-vs-prompt, mindstudio-harness]
updated: 2026-04-22
---

# Prompt vs Context vs Harness — The Three-Layer Taxonomy

The taxonomy at the heart of *驾驭工程* is **not** three competing schools of practice; it is three *nested* layers, each a strict superset of the last.

- **Prompt engineering** — the shape of one model call. Word choice, system instructions, few-shot examples, output format. Scope: a single inference.
- **Context engineering** — the *information environment* of one call. Retrieval, memory injection, tool descriptions, knowledge-graph slices. Scope: what the call can *see*. The [Neo4j blog](https://neo4j.com/blog/developer/context-engineering/) is the canonical statement of this layer; see [[neo4j-context-vs-prompt]].
- **Harness engineering** — the *operational framework* across many calls, sessions, agents, and time. Tools, state, durability, recovery, observability, evaluation, sandboxing, human checkpoints. Scope: everything the agent *does*. The [MindStudio guide](https://www.nxcode.io/resources/news/what-is-harness-engineering-complete-guide-2026) and [Anthropic Managed Agents](https://www.anthropic.com/engineering/managed-agents) both describe this layer; see [[mindstudio-harness]] and [[anthropic-harness-design]].

## Superset, not replacement

A harness still contains prompts. A context layer still uses prompts to describe tool affordances. The newer disciplines do not retire the older ones — they wrap them. A team that says "we don't do prompt engineering anymore" has not transcended prompts; they have outsourced the prompts to a framework someone else wrote.

## Why the distinction is substantive

MindStudio's framing is sharpest: harness engineering encompasses **multi-agent coordination, state management, and error recovery — problems that do not appear at prompt level at all**. You cannot prompt-engineer your way to a durable session log. You cannot context-engineer your way to a sandbox isolation boundary. The layers solve genuinely different problems.

## The Ariely test

Applied to the Dan Ariely teenage-sex-and-big-data quote (see [[ariely-big-data-quote]]): *everyone talks about prompt engineering, few do harness engineering, and those who do don't think they're doing it well.* The book's job is to make the third layer legible.

## Diagram

A concentric diagram (prompt ⊂ context ⊂ harness) is the canonical visual; it lands in the numbered narrative as the taxonomy figure.


<!-- appended 2026-04-22 -->

## Three-layer taxonomy, as a superset ladder

Each layer strictly contains the previous — it is NOT a replacement:

1. **Prompt engineering** — authoring the static instruction string. The surface most practitioners started on.
2. **Context engineering** — building the runtime context window dynamically: retrieval, summarization, graph walks, tool-call results. See [[neo4j-context-vs-prompt]] and [[milvus-execution-layer]] for the retrieval side.
3. **Harness engineering** — orchestrating the entire runtime that *produces* the context, *calls* the tools, *persists* the state, and *evaluates* the outputs. See [[anthropic-harness-design]], [[openai-harness-engineering]], [[fowler-on-harness]].

## Why practitioners get stuck

Teams trapped on rung 1 tune prompts for weeks when the real leverage is on rung 3. The symptom: "the model is dumb" when the actual issue is a missing memory layer ([[concept-memory-layer]]) or an ill-specified tool vocabulary ([[concept-tool-vocabulary]]).

See [[medium-oldest-new-idea]] for the historical analogue: every prior compute era repeated the same mistake — blaming the CPU when the bug was in the runtime.
