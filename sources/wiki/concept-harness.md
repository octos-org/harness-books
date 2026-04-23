---
kind: concept
sources: [https://martinfowler.com/articles/harness-engineering.html]
related: [fowler-on-harness, concept-prompt-vs-context-vs-harness, concept-agent-loop, concept-memory-layer, concept-tool-vocabulary, concept-state-durability, concept-execution-sandbox, concept-evaluation-harness, concept-observability]
updated: 2026-04-22
---

# Concept · The Harness

The **harness** is the runtime scaffolding that surrounds an LLM in an LLM-native application. Following [[fowler-on-harness]]: *Agent = Model + Harness*. In this book's usage, the harness extends beyond coding agents to any LLM-native app, and has a six-part anatomy.

## Six components (the anatomy the book will hand-draw)

1. **Memory** — durable state across turns and sessions. Covered in [[concept-memory-layer]].
2. **Tools** — the callable vocabulary exposed to the model. Covered in [[concept-tool-vocabulary]].
3. **State** — the explicit step-by-step record the agent mutates. Covered in [[concept-state-durability]].
4. **Context** — what gets packed into each turn's prompt window. The narrow pipe the model sees through.
5. **Execution** — the sandbox that runs model-produced code / tool calls safely. Covered in [[concept-execution-sandbox]].
6. **Evaluation** — the feedback loop that scores behaviour and steers iteration. Covered in [[concept-evaluation-harness]].

## Why "harness" and not "framework"

A framework is a *library* shape — you build against its APIs. A harness is a *runtime* shape — it wraps an opaque core (the model) and regulates its interaction with the world. The harness is closer to an operating system or a test harness than to a library. See the historical frame in [[medium-oldest-new-idea]] — the harness is the *oldest new idea* in LLM engineering.

## The superset claim

Prompt Engineering ⊂ Context Engineering ⊂ Harness Engineering. Each layer *subsumes* the previous one rather than replacing it. A harness engineer still writes prompts; a prompt is just one leaf node in a much larger regulation graph. See [[concept-prompt-vs-context-vs-harness]].


<!-- appended 2026-04-22 -->

## 与书第一章的关联

本概念页是 [[chapter-01-invisible-harness]] 的锚点。章节里提到的 "6-part anatomy" 对应本页 6 个组件:memory / tools / state / context / execution / evaluation。叙事脊柱在 ## 01 · WHY 和 ## 02 · WHAT 两节引用本页作为 [[slug]] 节点,而不是重复其内容。


<!-- appended 2026-04-22 -->

## Cross-links into the primary source set

The harness concept is triangulated across the nine primary references the book draws from:

- [[fowler-on-harness]] — Fowler's positioning: the harness is the engineering surface, the prompt is the API call.
- [[anthropic-harness-design]] — Claude's harness as explicit engineering discipline (tool choice, memory shape, loop shape).
- [[openai-harness-engineering]] — OpenAI's framing that splits context / tools / state as first-class runtime concerns.
- [[mindstudio-harness]] — productization view: harness-as-platform for business workflows.
- [[neo4j-context-vs-prompt]] — the context layer as a retrieval + graph problem, not a prompt problem.
- [[milvus-execution-layer]] — the execution sandbox viewed from a vector-DB / retrieval vendor.
- [[medium-oldest-new-idea]] — harness as continuation of compiler / OS / middleware history.
- [[aios-foundation]] — academic framing of "LLM-as-OS-kernel" with the harness as the rest of the OS.
- [[ariely-big-data-quote]] — the framing joke, repurposed: everyone talks about LLMs, nobody really runs them.

## Six anatomy components, as wiki pages

- [[concept-memory-layer]]
- [[concept-tool-vocabulary]]
- [[concept-state-durability]]
- [[concept-agent-loop]] (the control flow that ties the above)
- [[concept-observability]]
- [[concept-evaluation-harness]]

See also [[concept-harness-as-platform]] for how these six cohere into a reusable substrate, and [[concept-prompt-vs-context-vs-harness]] for the superset taxonomy.


<!-- appended 2026-04-22 -->

## Corollary: harness design is itself optimizable (2026-04-22)

[[stanford-meta-harness]] demonstrates that the harness, once it is just code over a stable interface, becomes a legitimate target for automated search — outer-loop agents can propose, score, and evolve harness variants. This does **not** dissolve harness engineering into an optimizer; it relocates the human's job:

- **Still human:** intent specification, verification semantics, objective design, deciding which interfaces are load-bearing (see [[concept-harness-as-platform]]).
- **Automatable:** the code *behind* a stable interface — retry policy, tool choice heuristics, memory compaction rules, plan-decomposition templates.

The corollary reframes the book's closing argument: harness engineering is not threatened by being automated; it is **validated** by being automatable — only engineering disciplines acquire their own optimizers.