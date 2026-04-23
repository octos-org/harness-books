---
kind: entity
sources: [https://www.anthropic.com/engineering/managed-agents]
related: [concept-harness, concept-prompt-vs-context-vs-harness, concept-state-durability, concept-execution-sandbox, openai-harness-engineering, fowler-on-harness]
updated: 2026-04-22
---

# Anthropic Managed Agents — Decoupling the Brain from the Hands

Anthropic's April 2026 engineering post [Scaling Managed Agents](https://www.anthropic.com/engineering/managed-agents) by Lance Martin, Gabe Cemaj, and Michael Cohen is the clearest published statement of a **meta-harness** philosophy: be opinionated about *interfaces*, unopinionated about specific *implementations*. The thesis is that any concrete harness encodes assumptions about model capabilities that go stale as models improve, so only the stable interfaces should be load-bearing.

## The coupled-architecture problem

The earlier design co-located session, harness, and sandbox in a single container. This created the classic "pet" pathology — servers required careful maintenance, container failure meant session loss, debugging required shelling into user data containers (a privacy/security hazard), and private-VPC customers couldn't integrate without running the harness themselves. Anthropic's response was to split the system into three orthogonal abstractions.

## The three abstractions

1. **Session — the log.** An append-only event log of everything that happened, deliberately living *outside* Claude's context window. Access via `getEvents()` allows transformations before data enters context. This is the [[concept-state-durability]] pillar made concrete: the log is the source of truth, the model's context is a derived view.
2. **Harness — the brain.** Stateless and decoupled from containers. Recovers from failure via `wake(sessionId)` + `getSession(id)`; writes durably via `emitEvent(id, event)`. Because it holds no state, it can be replaced wholesale as models improve — the central meta-harness move.
3. **Sandbox — the hands.** Execution environment for code edits and shell calls. "Cattle" not "pets" — failures don't cascade. Invoked as a simple tool: `execute(name, input) → string`, with no co-location assumption to the harness. See [[concept-execution-sandbox]].

## Measured results

- TTFT dropped **~60% at p50, over 90% at p95** because containers provision only when needed.
- Sandboxes are lazily provisioned, so inference starts immediately on session resume.
- Credentials never reach sandboxes where Claude-generated code runs; MCP proxy patterns handle credential fetches without exposing tokens to the model.

## Security stance

Anthropic argues that "narrow-scoped tokens" is still betting on model limits — a brittle position. The durable mitigation is **architectural**: the sandbox cannot see credentials at all, the harness brokers tool calls through proxies, and the session log records every action for post-hoc audit. This is a [[concept-observability]] argument as much as a security one.

## Why it matters for *驾驭工程*

Managed Agents is the strongest existing case for the book's central claim: the *interesting* engineering is the harness, and the harness must be designed to *outlive* whatever model it currently wraps. Compare with [[openai-harness-engineering]], which makes the complementary argument that constraint design (AGENTS.md, reproducible envs, CI gates) is itself a harness pillar.


<!-- appended 2026-04-22 -->

## Long-running app harness (Rajasekaran · Anthropic Labs · 2026)
Per [Harness Design for Long-Running Apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) (raw: file:///Users/zhangalex/.actionbook/research-sources/harness-engineering/04-anthropic-harness-design-long-running.md), naive single-agent loops collapse on multi-hour coding tasks. The Anthropic Labs three-agent harness — **planner / generator / evaluator** — treats each component as a *stress-testable assumption about model limitations*, not a fixed architecture.

### Load-bearing tactics
- **Context resets > compaction.** Sonnet 4.5 exhibited "context anxiety" — wrapping up prematurely as the window filled. Smarter summarization did not cure it; only hard resets with **structured handoffs** between fresh agents did. Cost: orchestration complexity + token overhead.
- **Evaluator ≠ generator.** Self-evaluating agents confidently praise mediocre output on subjective tasks. The fix is not better prompting — it is a *separate* evaluating agent tuned for skepticism. Maps to the [[concept-evaluation-harness]] page.
- **Sprint contracts.** Evaluator and generator negotiate explicit success criteria *before* implementation. The evaluator then drives Playwright against the live app and grades on Design / Originality / Craft / Functionality. 5–15 iterations, up to 4 hours per task.
- **File-based inter-agent communication.** Durable, inspectable, replayable. Maps directly to the [[concept-state-durability]] axis — the harness writes its own audit log to disk.

### Implication for [[concept-harness]]
The harness must *evolve* as model capability shifts the task-model frontier. A harness that fits Sonnet 4.5 will be over-scaffolded for the next model and under-scaffolded for the one after. **Versioned, not fixed.** This is the strongest argument yet that harness engineering is engineering — not configuration — because its artifacts have lifecycles.

### Empirical signal
Retro game maker benchmark: solo Claude run finished in 20 min for $9 with shallow output; the three-agent harness ran 4 hours, cost ~$80, and produced production-quality results that solo runs could not reach at any token budget. The harness *unlocks capability the underlying model already has* — Fowler's two-pillars hypothesis (guides + sensors) confirmed at scale.
