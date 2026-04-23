---
kind: entity
sources: [https://medium.com/@fisher262425/harness-engineering-the-oldest-new-idea-in-ai-7a7bcd6baf7b]
related: [fowler-on-harness, concept-harness, concept-prompt-vs-context-vs-harness, ariely-big-data-quote]
updated: 2026-04-22
---

# Fisher Zhang · *Harness Engineering: The Oldest New Idea in AI*

Medium essay (April 2026) by Fisher Zhang that frames **Harness Engineering** as the third era in a prompt → context → harness progression and argues the discipline is new but the structure is ancient. Read the [source essay](https://medium.com/@fisher262425/harness-engineering-the-oldest-new-idea-in-ai-7a7bcd6baf7b). This is one of the foundational texts for [[concept-harness]] and supplies the book's subtitle motif ("最古老的新想法").

## Three eras

Zhang's central periodization — these are not replacements, they are nested disciplines (see [[concept-prompt-vs-context-vs-harness]]):

- **2023 · Prompt Engineering** — direct manual control of a single call.
- **2025 · Context Engineering** — strategic information setup *before* execution; the [[neo4j-context-vs-prompt]] school.
- **2026 · Harness Engineering** — systematic constraints + feedback mechanisms around an autonomous model.

The shift, Zhang insists, was never about model capability increasing — it was about our **understanding of AI usage** changing. That framing mirrors Dan Ariely's [[ariely-big-data-quote]]: everyone *talks* about the model, but the engineering leverage has migrated underneath.

## The gaming-scale analogy

Zhang's most quotable device. Each era is a real-time-strategy genre:

- **Elden Ring ≈ Prompt** — every action hand-controlled; 1-to-1 exchange with the world.
- **Clash of Clans ≈ Context** — pre-battle setup decides the outcome; once the attack starts you mostly watch.
- **StarCraft II ≈ Harness** — commanding thousands of autonomous units through systems and rules, not direct commands.

> "The player's control gets coarser. The AI's autonomy gets higher." — Zhang, *Medium*, 2026.

This is the same move [[fowler-on-harness]] makes with "guides and sensors" but dramatized: a harness is the RTS UI, not the unit.

## Two pillars (same shape as Fowler)

Zhang explicitly borrows LangChain's formula **Agent = Model + Harness** and then decomposes the harness into:

- **Guides (feedforward)** — pre-emptive rules, highway guardrails. CLAUDE.md, code-style docs, architecture decisions. Feeds [[concept-context-engineering]] when it exists.
- **Sensors (feedback)** — post-execution detection. Static analysis, tests, review agents. Feeds the evaluation side of [[concept-harness]].

Underlying philosophy: **"constraints first"** — design the rails before you worry about the vehicle.

## The "oldest new idea" argument

Zhang's historical move, which supplies the book's title motif:

- Fire — direct control of heat.
- Furnaces — environmental control of heat.
- Steam engines — *systemic* harnesses converting heat into disciplined work.

The prompt → context → harness progression mirrors humanity's millennia-long pattern for taming powerful forces. **The discipline is new; the structure is ancient.** Compiler, OS, runtime, and middleware history (see [[concept-harness-as-platform]] when drafted) are the immediately preceding software instances of the same pattern.

## Load-bearing quote

> "Human engineers built a million-line codebase with zero lines of human code — they spent five months engineering the harness instead."

Zhang uses this as the "extreme endpoint" that motivates harness engineering as a distinct discipline. It is the empirical anchor for the book's opening Ariely callback: the thing everyone *claims* to be doing (prompting) is not where the effort actually goes.

## How this page is used in the book

- **Chapter 01 · 看不见的 harness** — opens with Zhang's three-era timeline, then pivots to Ariely.
- **Chapter 02 · 驾驭的解剖** — the guides/sensors split seeds the 6-part anatomy; Zhang's two pillars are the parents of memory/tools/state/context/execution/evaluation.
- **Chapter 03 · prompt vs context vs harness** — Zhang's periodization is the spine; [[concept-prompt-vs-context-vs-harness]] holds the technical definitions.
- **Chapter 06 · harness 即平台** — "oldest new idea" historical argument recurs as the closing motif.

## Open questions Zhang leaves unanswered

- No treatment of **durability / resume** — the Ascent-research axis ([[case-ascent-research]] when drafted) extends Zhang.
- No concrete failure-mode taxonomy (dropped refs, context collapse, divergence) — this book adds that layer.
- Gaming analogy obscures the **evaluation harness** — Zhang's sensors are reactive; RL-style training-time harnesses are out of scope for his essay.
